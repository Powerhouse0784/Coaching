// app/api/teacher/youtube-channel-sync/route.ts
// Syncs ALL public uploads from your YouTube channel (YOUTUBE_CHANNEL_ID) into
// a single auto-managed VideoFolder for that teacher. This is the "import
// everything from my channel" button.
//
// Requires env vars: YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from "@/lib/getSessionUser";

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
  if (!res.ok) throw new Error(`YouTube API ${endpoint} → ${res.status}: ${await res.text()}`);
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

async function fetchAllVideos(uploadsPlaylistId: string) {
  const results: any[] = [];
  let pageToken: string | undefined;
  do {
    const params: Record<string, string> = { part: 'snippet,contentDetails,status', maxResults: '50', playlistId: uploadsPlaylistId };
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

async function syncChannel(folderId: string, uploadsPlaylistId: string) {
  const videos = await fetchAllVideos(uploadsPlaylistId);
  if (videos.length === 0) return { total: 0, created: 0, updated: 0, removed: 0 };

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

  // Remove videos that no longer exist in the channel's uploads
  const liveIds = videos.map(v => v.videoId);
  const { count: removed } = await prisma.video.deleteMany({
    where: { folderId, videoUrl: { notIn: liveIds } },
  });

  return { total: videos.length, created, updated, removed };
}

// GET — status info for the dashboard widget
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'TEACHER') return NextResponse.json({ error: 'Teachers only' }, { status: 403 });
    if (!YT_CHANNEL_ID) return NextResponse.json({ error: 'YOUTUBE_CHANNEL_ID not set in .env' }, { status: 500 });

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const folder = await prisma.videoFolder.findFirst({
      where: { teacherId: teacher.id, youtubePlaylistId: { not: null } },
      include: {
        videos: {
          orderBy: { uploadDate: 'desc' },
          take: 3,
          select: { id: true, title: true, thumbnail: true, videoUrl: true, duration: true },
        },
        _count: { select: { videos: true } },
      },
    });

    let channelSnippet = { title: 'Your Channel', thumbnail: '', subscriberCount: '0', videoCount: '0' };
    try {
      const info = await getChannelInfo(YT_CHANNEL_ID);
      channelSnippet = { title: info.title, thumbnail: info.thumbnail, subscriberCount: info.subscriberCount, videoCount: info.videoCount };
    } catch {
      /* non-critical — UI still works without live channel snippet */
    }

    return NextResponse.json({
      channelId: YT_CHANNEL_ID,
      channelTitle: channelSnippet.title,
      channelThumbnail: channelSnippet.thumbnail,
      subscriberCount: channelSnippet.subscriberCount,
      videoCount: channelSnippet.videoCount,
      folder: folder
        ? {
            id: folder.id,
            name: folder.name,
            videoCount: folder._count.videos, // ← mapped to a plain number for the client
            videos: folder.videos,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — run the sync
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'TEACHER') return NextResponse.json({ error: 'Teachers only' }, { status: 403 });
    if (!YT_KEY) return NextResponse.json({ error: 'YOUTUBE_API_KEY not set in .env' }, { status: 500 });
    if (!YT_CHANNEL_ID) return NextResponse.json({ error: 'YOUTUBE_CHANNEL_ID not set in .env' }, { status: 500 });

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });

    const { title: channelTitle, uploadsPlaylistId, thumbnail: channelThumb } = await getChannelInfo(YT_CHANNEL_ID);

    let folder = await prisma.videoFolder.findFirst({
      where: { teacherId: teacher.id, youtubePlaylistId: uploadsPlaylistId },
    });

    if (!folder) {
      folder = await prisma.videoFolder.create({
        data: {
          teacherId: teacher.id,
          name: `${channelTitle} — Video Lectures`,
          subject: 'All Subjects',
          class: 'All Classes',
          chapter: 'YouTube Channel',
          description: `All video lectures from the YouTube channel "${channelTitle}"`,
          thumbnail: channelThumb,
          isPublic: true,
          youtubePlaylistId: uploadsPlaylistId,
        },
      });
    } else if (channelThumb && !folder.thumbnail) {
      await prisma.videoFolder.update({ where: { id: folder.id }, data: { thumbnail: channelThumb } });
    }

    const stats = await syncChannel(folder.id, uploadsPlaylistId);
    return NextResponse.json({ success: true, channelTitle, folderId: folder.id, ...stats });
  } catch (err: any) {
    console.error('YT sync error:', err);
    return NextResponse.json({ error: err.message ?? 'Sync failed' }, { status: 500 });
  }
}