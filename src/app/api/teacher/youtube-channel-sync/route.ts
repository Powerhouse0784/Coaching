// app/api/teacher/youtube-channel-sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const YT_KEY = process.env.YOUTUBE_API_KEY!;
const YT_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID!;
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

function isoDuration(iso: string): string {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '0:00';
  const h = +(m[1] || 0), min = +(m[2] || 0), s = +(m[3] || 0);
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${min}:${String(s).padStart(2, '0')}`;
}

async function ytFetch(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${YT_BASE}/${endpoint}`);
  Object.entries({ ...params, key: YT_KEY }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`YouTube API ${endpoint} → ${res.status}: ${errorText}`);
  }
  return res.json();
}

async function getChannelInfo(channelId: string) {
  const data = await ytFetch('channels', { part: 'snippet,contentDetails,statistics', id: channelId });
  const ch = data.items?.[0];
  if (!ch) throw new Error(`Channel ${channelId} not found. Check YOUTUBE_CHANNEL_ID in .env`);
  return {
    title: ch.snippet.title as string,
    uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads as string,
    thumbnail: (ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.medium?.url || '') as string,
    subscriberCount: parseInt(ch.statistics?.subscriberCount || '0').toLocaleString(),
    videoCount: ch.statistics?.videoCount || '0',
  };
}

async function fetchAllPlaylists(channelId: string) {
  const results: { id: string; title: string; description: string; thumbnail: string; itemCount: number }[] = [];
  let pageToken: string | undefined;
  do {
    const params: Record<string, string> = { part: 'snippet,contentDetails', maxResults: '50', channelId };
    if (pageToken) params.pageToken = pageToken;
    const data = await ytFetch('playlists', params);
    for (const item of data.items ?? []) {
      const snip = item.snippet ?? {};
      results.push({
        id: item.id,
        title: snip.title ?? 'Untitled Playlist',
        description: snip.description ?? '',
        thumbnail:
          snip.thumbnails?.maxres?.url ??
          snip.thumbnails?.standard?.url ??
          snip.thumbnails?.high?.url ??
          snip.thumbnails?.medium?.url ??
          '',
        itemCount: item.contentDetails?.itemCount ?? 0,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return results;
}

async function fetchAllVideos(playlistId: string) {
  const results: any[] = [];
  let pageToken: string | undefined;
  
  try {
    do {
      const params: Record<string, string> = { 
        part: 'snippet,contentDetails,status', 
        maxResults: '50', 
        playlistId 
      };
      if (pageToken) params.pageToken = pageToken;
      const data = await ytFetch('playlistItems', params);
      
      for (const item of data.items ?? []) {
        const videoId: string = item.contentDetails?.videoId;
        if (!videoId) continue;
        if (item.status?.privacyStatus === 'private') continue;
        const title: string = item.snippet?.title ?? '';
        if (title === 'Deleted video' || title === 'Private video') continue;
        const snip = item.snippet ?? {};
        results.push({
          videoId,
          title,
          description: snip.description ?? '',
          thumbnail:
            snip.thumbnails?.maxres?.url ??
            snip.thumbnails?.standard?.url ??
            snip.thumbnails?.high?.url ??
            snip.thumbnails?.medium?.url ??
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt: item.contentDetails?.videoPublishedAt ?? snip.publishedAt ?? new Date().toISOString(),
          position: snip.position ?? 0,
        });
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
  } catch (error: any) {
    // Handle 404 playlist not found errors gracefully
    if (error.message?.includes('404') || 
        error.message?.includes('playlistNotFound') ||
        error.message?.includes('playlistId')) {
      console.warn(`Playlist ${playlistId} not found or not accessible. Skipping.`);
      return [];
    }
    throw error;
  }
  
  return results;
}

async function fetchVideoDetails(videoIds: string[]) {
  const durMap = new Map<string, string>();
  const viewMap = new Map<string, number>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await ytFetch('videos', { part: 'contentDetails,statistics', id: batch.join(',') });
    for (const item of data.items ?? []) {
      durMap.set(item.id, isoDuration(item.contentDetails?.duration ?? 'PT0S'));
      viewMap.set(item.id, parseInt(item.statistics?.viewCount ?? '0', 10));
    }
  }
  return { durMap, viewMap };
}

async function syncPlaylistVideos(folderId: string, playlistId: string) {
  let videos;
  try {
    videos = await fetchAllVideos(playlistId);
  } catch (error: any) {
    console.error(`Failed to fetch videos for playlist ${playlistId}:`, error.message);
    // If playlist is inaccessible, delete the folder and rethrow
    if (error.message?.includes('404') || error.message?.includes('playlistNotFound')) {
      await prisma.videoFolder.delete({ where: { id: folderId } }).catch(() => {});
      throw new Error(`Playlist not accessible. It might be private or deleted.`);
    }
    throw error;
  }
  
  if (videos.length === 0) {
    // Still clean up any stale videos if the playlist is now empty
    const { count: removed } = await prisma.video.deleteMany({ where: { folderId } });
    return { total: 0, created: 0, updated: 0, removed };
  }

  const { durMap, viewMap } = await fetchVideoDetails(videos.map(v => v.videoId));
  let created = 0, updated = 0;

  for (const v of videos) {
    const existing = await prisma.video.findFirst({ where: { folderId, videoUrl: v.videoId } });
    const payload = {
      title: v.title,
      description: v.description,
      duration: durMap.get(v.videoId) ?? '0:00',
      views: viewMap.get(v.videoId) ?? 0,
      thumbnail: v.thumbnail,
      uploadDate: new Date(v.publishedAt),
      order: v.position,
    };
    if (existing) {
      await prisma.video.update({ where: { id: existing.id }, data: payload });
      updated++;
    } else {
      await prisma.video.create({ data: { folderId, videoUrl: v.videoId, ...payload } });
      created++;
    }
  }

  const liveIds = videos.map(v => v.videoId);
  const { count: removed } = await prisma.video.deleteMany({
    where: { folderId, videoUrl: { notIn: liveIds } },
  });

  return { total: videos.length, created, updated, removed };
}

async function getChannelPlaylists() {
  const info = await getChannelInfo(YT_CHANNEL_ID);
  const customPlaylists = await fetchAllPlaylists(YT_CHANNEL_ID);

  // Only add the "All Videos" playlist if we can access it
  let allVideosEntry = null;
  try {
    // Test if we can access the uploads playlist
    await fetchAllVideos(info.uploadsPlaylistId);
    allVideosEntry = {
      id: info.uploadsPlaylistId,
      title: 'All Videos',
      description: `Every public video uploaded to ${info.title}`,
      thumbnail: info.thumbnail,
      itemCount: parseInt(info.videoCount, 10) || 0,
      isUploads: true,
    };
  } catch (error: any) {
    console.warn(`Cannot access uploads playlist ${info.uploadsPlaylistId}. Skipping "All Videos" folder.`);
  }

  return {
    info,
    playlists: allVideosEntry 
      ? [allVideosEntry, ...customPlaylists.map(p => ({ ...p, isUploads: false }))]
      : customPlaylists.map(p => ({ ...p, isUploads: false })),
  };
}

// GET — channel info + every playlist with its sync status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'TEACHER') return NextResponse.json({ error: 'Teachers only' }, { status: 403 });
    if (!YT_KEY) return NextResponse.json({ error: 'YOUTUBE_API_KEY not set in .env' }, { status: 500 });
    if (!YT_CHANNEL_ID) return NextResponse.json({ error: 'YOUTUBE_CHANNEL_ID not set in .env' }, { status: 500 });

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const { info, playlists } = await getChannelPlaylists();

    const folders = await prisma.videoFolder.findMany({
      where: { teacherId: teacher.id, youtubePlaylistId: { in: playlists.map(p => p.id) } },
      include: { _count: { select: { videos: true } } },
    });
    const folderMap = new Map(folders.map(f => [f.youtubePlaylistId as string, f]));

    return NextResponse.json({
      channelId: YT_CHANNEL_ID,
      channelTitle: info.title,
      channelThumbnail: info.thumbnail,
      subscriberCount: info.subscriberCount,
      videoCount: info.videoCount,
      playlists: playlists.map(p => {
        const f = folderMap.get(p.id);
        return {
          playlistId: p.id,
          title: p.title,
          description: p.description,
          thumbnail: p.thumbnail,
          itemCount: p.itemCount,
          isUploads: p.isUploads || false,
          folder: f ? { id: f.id, name: f.name, videoCount: f._count.videos, isPublic: f.isPublic } : null,
        };
      }),
    });
  } catch (err: any) {
    console.error('GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — sync one playlist (body.playlistId) or ALL playlists (no body / empty body)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'TEACHER') return NextResponse.json({ error: 'Teachers only' }, { status: 403 });
    if (!YT_KEY) return NextResponse.json({ error: 'YOUTUBE_API_KEY not set in .env' }, { status: 500 });
    if (!YT_CHANNEL_ID) return NextResponse.json({ error: 'YOUTUBE_CHANNEL_ID not set in .env' }, { status: 500 });

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });

    const body = await req.json().catch(() => ({} as any));
    const targetPlaylistId: string | undefined = body?.playlistId;

    const { playlists } = await getChannelPlaylists();

    const toSync = targetPlaylistId ? playlists.filter(p => p.id === targetPlaylistId) : playlists;
    if (toSync.length === 0) {
      return NextResponse.json({ error: 'That playlist was not found on this channel' }, { status: 404 });
    }

    const results = [];
    const errors = [];

    for (const p of toSync) {
      try {
        let folder = await prisma.videoFolder.findFirst({
          where: { teacherId: teacher.id, youtubePlaylistId: p.id },
        });

        if (!folder) {
          folder = await prisma.videoFolder.create({
            data: {
              teacherId: teacher.id,
              name: p.title,
              subject: 'All Subjects',
              class: 'All Classes',
              chapter: p.isUploads ? 'YouTube Channel' : 'YouTube Playlist',
              description: p.description || `Synced from YouTube playlist "${p.title}"`,
              thumbnail: p.thumbnail || '',
              isPublic: true,
              youtubePlaylistId: p.id,
            },
          });
        } else if (p.thumbnail && !folder.thumbnail) {
          await prisma.videoFolder.update({ where: { id: folder.id }, data: { thumbnail: p.thumbnail } });
        }

        const stats = await syncPlaylistVideos(folder.id, p.id);
        results.push({
          playlistId: p.id,
          playlistTitle: p.title,
          folderId: folder.id,
          folderName: folder.name,
          ...stats,
        });
      } catch (error: any) {
        console.error(`Failed to sync playlist ${p.title} (${p.id}):`, error.message);
        errors.push({
          playlistId: p.id,
          playlistTitle: p.title,
          error: error.message,
        });
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return NextResponse.json({ 
        error: 'Failed to sync any playlists', 
        errors 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      synced: results.length, 
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err: any) {
    console.error('YT sync error:', err);
    return NextResponse.json({ error: err.message ?? 'Sync failed' }, { status: 500 });
  }
}