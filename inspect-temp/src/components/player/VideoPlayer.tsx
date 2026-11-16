'use client';
// components/student/StudentVideoLibrary.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Eye, Search, Folder, Clock, ChevronRight, Bookmark, X,
  CheckCircle, Check, RotateCcw, Youtube, ExternalLink,
  SkipForward, ChevronLeft, List, Grid3x3, LayoutList,
  FastForward, Rewind, Maximize2, Minimize2,
} from 'lucide-react';

declare global { interface Window { YT: any; onYouTubeIframeAPIReady: () => void; } }

// ─── Types ───────────────────────────────────────────────────────────────────
interface VideoFolder {
  id: string; name: string; subject: string; class: string; chapter: string;
  description: string; thumbnail: string; videoCount: number; totalDuration: string;
  totalViews: number; teacher: string; teacherAvatar: string;
  videos: Video[]; progress: number; completedCount: number;
}
interface Video {
  id: string; title: string; description: string; duration: string;
  views: number; uploadDate: string; thumbnail: string; videoUrl: string;
  order: number; watched?: boolean; watchedPercentage?: number;
  watchedSeconds?: number; lastPosition?: number; bookmarked?: boolean;
}
interface Stats {
  watchTime: { hours: number; minutes: number };
  completedVideos: number; startedVideos: number; bookmarkedVideos: number;
}

// ─── YT API singleton loader ──────────────────────────────────────────────────
let ytPromise: Promise<void> | null = null;
function loadYT(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytPromise) return ytPromise;
  ytPromise = new Promise(resolve => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    if (!document.getElementById('yt-api')) {
      const s = document.createElement('script');
      s.id = 'yt-api'; s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });
  return ytPromise;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StudentVideoLibrary() {
  const [folders, setFolders] = useState<VideoFolder[]>([]);
  const [stats, setStats] = useState<Stats>({
    watchTime: { hours: 0, minutes: 0 }, completedVideos: 0,
    startedVideos: 0, bookmarkedVideos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'continue' | 'bookmarks' | 'completed'>('all');
  const [selectedFolder, setSelectedFolder] = useState<VideoFolder | null>(null);
  const [playerVideo, setPlayerVideo] = useState<Video | null>(null);
  const [playerQueue, setPlayerQueue] = useState<Video[]>([]);

  // dark mode
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const ob = new MutationObserver(check);
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => ob.disconnect();
  }, []);

  useEffect(() => { fetchAll(); }, []);

  // keep selectedFolder in sync but DON'T remount player
  useEffect(() => {
    if (!selectedFolder) return;
    const f = folders.find(x => x.id === selectedFolder.id);
    if (f) setSelectedFolder(f);
  }, [folders]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [fRes, sRes] = await Promise.all([
        fetch('/api/student/video-folders'),
        fetch('/api/student/watch-stats'),
      ]);
      if (fRes.ok) setFolders(await fRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch { } finally { setLoading(false); }
  };

  const fetchStatsOnly = useCallback(async () => {
    try {
      const res = await fetch('/api/student/watch-stats');
      if (res.ok) setStats(await res.json());
    } catch { }
  }, []);

  const trackProgress = useCallback(async (videoId: string, pct: number, secs: number, lastPos: number) => {
    await fetch('/api/student/video-progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, watchedPercentage: pct, watchedSeconds: secs, lastPosition: lastPos, completed: pct >= 95 }),
    }).catch(() => {});
    fetchStatsOnly();
  }, [fetchStatsOnly]);

  // Bookmark: fire-and-forget, update local state optimistically — NO full refetch
  const toggleBookmark = useCallback(async (videoId: string, nowBookmarked: boolean) => {
    await fetch('/api/student/bookmarks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, bookmarked: nowBookmarked }),
    }).catch(() => {});
    // Patch folders in-place so the library list updates without remounting the player
    setFolders(prev => prev.map(f => ({
      ...f,
      videos: f.videos.map(v => v.id === videoId ? { ...v, bookmarked: nowBookmarked } : v),
    })));
  }, []);

  // Complete: same fire-and-forget optimistic update
  const toggleCompleted = useCallback(async (videoId: string, nowCompleted: boolean) => {
    await fetch('/api/student/video-progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        watchedPercentage: nowCompleted ? 100 : 0,
        watchedSeconds: 0, lastPosition: 0,
        completed: nowCompleted,
      }),
    }).catch(() => {});
    setFolders(prev => prev.map(f => ({
      ...f,
      videos: f.videos.map(v => v.id === videoId
        ? { ...v, watched: nowCompleted, watchedPercentage: nowCompleted ? 100 : 0 }
        : v),
    })));
    fetchStatsOnly();
  }, [fetchStatsOnly]);

  const allVideos = folders.flatMap(f => f.videos.map(v => ({ ...v, folder: f })));
  const continueList = allVideos.filter(v => (v.watchedPercentage ?? 0) > 0 && !v.watched)
    .sort((a, b) => (b.watchedPercentage ?? 0) - (a.watchedPercentage ?? 0));
  const bookmarkList = allVideos.filter(v => v.bookmarked);
  const completedList = allVideos.filter(v => v.watched);

  const subjects = ['all', ...Array.from(new Set(folders.map(f => f.subject)))];
  const filteredFolders = folders.filter(f => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q || f.name.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q) || f.chapter.toLowerCase().includes(q);
    return matchQ && (subjectFilter === 'all' || f.subject === subjectFilter);
  });

  const handlePlay = (video: Video, folder?: VideoFolder) => {
    setPlayerVideo(video);
    setPlayerQueue(folder?.videos ?? selectedFolder?.videos ?? []);
  };

  const bg = dm ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-red-50/20 to-rose-50/20';
  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${bg}`}>
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-red-100" />
          <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
          <Youtube className="absolute inset-0 m-auto w-6 h-6 text-red-500" />
        </div>
        <p className={`font-semibold ${dm ? 'text-gray-300' : 'text-gray-600'}`}>Loading video library…</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} p-3 sm:p-5 lg:p-8`}>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Video Library</h2>
          <p className={`text-sm mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
            Watch lectures from YouTube · {folders.reduce((s, f) => s + f.videoCount, 0)} videos across {folders.length} folders
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0 ${dm ? 'bg-red-900/40 text-red-300' : 'bg-red-50 text-red-600 border border-red-100'}`}>
          <Youtube className="w-3.5 h-3.5" /> YouTube
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { icon: Play,        bg: dm ? 'bg-red-900/50'   : 'bg-red-50',    color: 'text-red-500',    border: dm ? 'border-red-800'   : 'border-red-100',    value: folders.reduce((s, f) => s + f.videoCount, 0), label: 'Total Videos' },
          { icon: CheckCircle, bg: dm ? 'bg-green-900/50' : 'bg-green-50',  color: 'text-green-500',  border: dm ? 'border-green-800' : 'border-green-100',  value: stats.completedVideos,                         label: 'Completed'    },
          { icon: Clock,       bg: dm ? 'bg-blue-900/50'  : 'bg-blue-50',   color: 'text-blue-500',   border: dm ? 'border-blue-800'  : 'border-blue-100',   value: `${stats.watchTime.hours}h ${stats.watchTime.minutes}m`, label: 'Watch Time' },
          { icon: Bookmark,    bg: dm ? 'bg-amber-900/50' : 'bg-amber-50',  color: 'text-amber-500',  border: dm ? 'border-amber-800' : 'border-amber-100',  value: stats.bookmarkedVideos,                        label: 'Bookmarked'   },
        ].map(({ icon: Icon, bg: ibg, color, border, value, label }) => (
          <div key={label} className={`rounded-2xl border-2 p-4 sm:p-5 hover:shadow-lg transition-all ${card}`}>
            <div className={`w-10 h-10 ${ibg} border ${border} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold mb-0.5 ${dm ? 'text-white' : 'text-gray-900'}`}>{value}</p>
            <p className={`text-xs font-medium ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className={`rounded-2xl border-2 p-1.5 mb-5 flex gap-1 overflow-x-auto ${card}`}>
        {([
          ['all', 'All Folders', folders.length],
          ['continue', 'Continue', continueList.length],
          ['bookmarks', 'Bookmarked', bookmarkList.length],
          ['completed', 'Completed', completedList.length],
        ] as [typeof activeTab, string, number][]).map(([tab, label, count]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                : dm ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            {label}
            {count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab ? 'bg-white/20 text-white' : dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      {activeTab === 'all' && (
        <div className={`rounded-2xl border-2 p-3 sm:p-4 mb-5 ${card}`}>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex-1 relative min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search videos, subjects…"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto flex-shrink-0 max-w-full">
              {subjects.map(s => (
                <button key={s} onClick={() => setSubjectFilter(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${subjectFilter === s ? 'bg-red-500 text-white' : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
            <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
              className={`p-2.5 rounded-xl border-2 transition flex-shrink-0 ${dm ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {viewMode === 'grid' ? <LayoutList className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* ALL FOLDERS */}
      {activeTab === 'all' && (
        filteredFolders.length === 0
          ? <EmptyState icon={<Folder className="w-12 h-12" />} title="No folders found" sub="Try a different search or filter" dm={dm} />
          : <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-3'}>
              {filteredFolders.map(f => <FolderCard key={f.id} folder={f} dm={dm} onClick={() => setSelectedFolder(f)} />)}
            </div>
      )}

      {/* CONTINUE WATCHING */}
      {activeTab === 'continue' && (
        continueList.length === 0
          ? <EmptyState icon={<Play className="w-12 h-12" />} title="Nothing in progress" sub="Start watching a video and it'll appear here" dm={dm} />
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {continueList.map(item => (
                <ContinueCard key={item.id} video={item} folder={(item as any).folder} dm={dm}
                  onPlay={() => handlePlay(item, (item as any).folder)} />
              ))}
            </div>
      )}

      {/* BOOKMARKS */}
      {activeTab === 'bookmarks' && (
        bookmarkList.length === 0
          ? <EmptyState icon={<Bookmark className="w-12 h-12" />} title="No bookmarks yet" sub="Bookmark videos while watching to save them here" dm={dm} />
          : <div className={`rounded-2xl border-2 overflow-hidden ${card}`}>
              {bookmarkList.map((item, i) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 sm:p-4 ${i < bookmarkList.length - 1 ? `border-b-2 ${dm ? 'border-gray-700' : 'border-gray-100'}` : ''}`}>
                  <Thumb video={item} dm={dm} size="sm" onClick={() => handlePlay(item, (item as any).folder)} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm line-clamp-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                    <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{(item as any).folder.name} · {item.duration}</p>
                    {(item.watchedPercentage ?? 0) > 0 && (
                      <div className={`mt-1.5 h-1 rounded-full overflow-hidden ${dm ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${item.watchedPercentage}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleBookmark(item.id, false)}
                      className={`p-1.5 rounded-lg transition ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <Bookmark className="w-4 h-4 text-amber-500 fill-current" />
                    </button>
                    <button onClick={() => handlePlay(item, (item as any).folder)} className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 transition">
                      <Play className="w-4 h-4 text-white fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* COMPLETED */}
      {activeTab === 'completed' && (
        completedList.length === 0
          ? <EmptyState icon={<CheckCircle className="w-12 h-12" />} title="No completed videos" sub="Videos you finish watching will appear here" dm={dm} />
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedList.map(item => (
                <div key={item.id} className={`rounded-xl border-2 overflow-hidden ${card}`}>
                  <div className="relative">
                    <Thumb video={item} dm={dm} fill onClick={() => handlePlay(item, (item as any).folder)} />
                    <div className="absolute top-2 left-2">
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-500 rounded-full text-white text-[10px] font-bold">
                        <CheckCircle className="w-3 h-3" /> Done
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className={`font-semibold text-sm line-clamp-2 mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{item.title}</p>
                    <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{(item as any).folder.name}</p>
                    <button onClick={() => toggleCompleted(item.id, false)}
                      className={`mt-2 text-xs flex items-center gap-1 ${dm ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      <RotateCcw className="w-3 h-3" /> Mark as unwatched
                    </button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* Folder modal */}
      {selectedFolder && (
        <FolderModal folder={selectedFolder} dm={dm}
          onClose={() => setSelectedFolder(null)}
          onPlay={v => handlePlay(v, selectedFolder)}
          onToggleBookmark={toggleBookmark}
          onToggleCompleted={toggleCompleted}
        />
      )}

      {/* Player — key stays stable; only videoUrl drives remount */}
      {playerVideo && (
        <YouTubePlayer
          video={playerVideo} queue={playerQueue} dm={dm}
          onClose={() => { setPlayerVideo(null); fetchStatsOnly(); }}
          onProgress={trackProgress}
          onToggleBookmark={toggleBookmark}
          onToggleCompleted={toggleCompleted}
          onNext={v => setPlayerVideo(v)}
        />
      )}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ icon, title, sub, dm }: { icon: React.ReactNode; title: string; sub: string; dm: boolean }) {
  return (
    <div className={`rounded-2xl border-2 p-10 sm:p-14 text-center ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`mx-auto mb-3 ${dm ? 'text-gray-600' : 'text-gray-300'}`}>{icon}</div>
      <p className={`font-bold text-lg mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      <p className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{sub}</p>
    </div>
  );
}

// ─── Thumb ────────────────────────────────────────────────────────────────────
function Thumb({ video, dm, size = 'md', onClick, fill }: {
  video: Video; dm: boolean; size?: 'sm' | 'md'; onClick?: () => void; fill?: boolean;
}) {
  const cls = fill ? 'w-full aspect-video' : size === 'sm' ? 'w-20 h-14 flex-shrink-0' : 'w-24 sm:w-28 h-16 sm:h-[4.5rem] flex-shrink-0';
  const src = video.thumbnail || `https://img.youtube.com/vi/${video.videoUrl}/hqdefault.jpg`;
  return (
    <div onClick={onClick} className={`${cls} relative rounded-lg overflow-hidden cursor-pointer group`}>
      <img src={src} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 fill-current ml-0.5" />
        </div>
      </div>
      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-[10px] rounded font-medium">{video.duration}</span>
      {video.watched && (
        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

// ─── FolderCard ───────────────────────────────────────────────────────────────
function FolderCard({ folder, dm, onClick }: { folder: VideoFolder; dm: boolean; onClick: () => void }) {
  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  return (
    <div onClick={onClick} className={`rounded-2xl border-2 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group ${card}`}>
      <div className="h-40 sm:h-44 relative overflow-hidden">
        {folder.thumbnail
          ? <img src={folder.thumbnail} alt={folder.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 flex items-center justify-center">
              <Youtube className="w-16 h-16 text-white opacity-60" />
            </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${dm ? 'bg-red-900/80 text-red-300' : 'bg-red-500 text-white'}`}>{folder.subject}</span>
          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-semibold">{folder.videoCount} videos</span>
        </div>
        {folder.progress > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20">
            <div className="h-full bg-green-400 transition-all" style={{ width: `${folder.progress}%` }} />
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h3 className={`font-bold text-base sm:text-lg mb-1 line-clamp-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{folder.name}</h3>
        <p className={`text-xs mb-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{folder.chapter}</p>
        <p className={`text-xs line-clamp-2 mb-4 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{folder.description}</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Videos', value: folder.videoCount },
            { label: 'Duration', value: folder.totalDuration },
            { label: 'Progress', value: `${folder.progress}%` },
          ].map(({ label, value }) => (
            <div key={label} className={`rounded-xl p-2 text-center ${dm ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
              <p className={`text-[10px] mb-0.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
              <p className={`text-xs font-bold truncate ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className={`flex items-center justify-between text-xs pt-3 border-t-2 ${dm ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-500'}`}>
          <span className="truncate">By {folder.teacher}</span>
          <span className={`font-semibold flex items-center gap-1 flex-shrink-0 ${dm ? 'text-red-400' : 'text-red-600'}`}>
            View All <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── ContinueCard ─────────────────────────────────────────────────────────────
function ContinueCard({ video, folder, dm, onPlay }: { video: Video; folder: VideoFolder; dm: boolean; onPlay: () => void }) {
  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  return (
    <div onClick={onPlay} className={`rounded-xl border-2 overflow-hidden hover:shadow-xl transition-all cursor-pointer group ${card}`}>
      <div className="aspect-video relative overflow-hidden">
        <Thumb video={video} dm={dm} fill onClick={onPlay} />
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20">
          <div className="h-full bg-purple-400" style={{ width: `${video.watchedPercentage}%` }} />
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <p className={`font-semibold text-sm line-clamp-2 mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{video.title}</p>
        <p className={`text-xs mb-2 truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{folder.name}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-purple-500 font-semibold">{video.watchedPercentage}% watched</span>
          <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{video.duration}</span>
        </div>
      </div>
    </div>
  );
}

// ─── FolderModal ──────────────────────────────────────────────────────────────
function FolderModal({ folder, dm, onClose, onPlay, onToggleBookmark, onToggleCompleted }: {
  folder: VideoFolder; dm: boolean; onClose: () => void;
  onPlay: (v: Video) => void;
  onToggleBookmark: (id: string, b: boolean) => void;
  onToggleCompleted: (id: string, c: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = folder.videos.filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase()));
  const bg = dm ? 'bg-gray-900' : 'bg-white';
  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`${bg} rounded-t-2xl sm:rounded-2xl w-full sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl`}>
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b-2 flex-shrink-0 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-start gap-3 sm:gap-4">
            {folder.thumbnail && (
              <img src={folder.thumbnail} alt="" className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0 hidden sm:block" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className={`text-base sm:text-2xl font-bold line-clamp-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{folder.name}</h3>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${dm ? 'bg-red-900/60 text-red-300' : 'bg-red-100 text-red-700'}`}>{folder.subject}</span>
                <span className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>• {folder.chapter} • By {folder.teacher}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{folder.videoCount} videos • {folder.totalDuration}</span>
                {folder.progress > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-16 sm:w-20 h-1.5 rounded-full ${dm ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${folder.progress}%` }} />
                    </div>
                    <span className="text-xs text-green-500 font-semibold">{folder.progress}%</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <X className={`w-5 h-5 ${dm ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search in this folder…" value={search} onChange={e => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            />
          </div>
        </div>

        {/* Video list */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6 space-y-2 sm:space-y-3">
          {filtered.length === 0 && <p className={`text-center py-8 text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>No videos match your search</p>}
          {filtered.map((video, idx) => (
            <div key={video.id} className={`rounded-xl border-2 overflow-hidden hover:shadow-md transition-all ${card}`}>
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4">
                <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</span>
                <Thumb video={video} dm={dm} onClick={() => onPlay(video)} />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-xs sm:text-sm line-clamp-2 mb-0.5 sm:mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{video.title}</p>
                  <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {video.views.toLocaleString()}</span>
                    <span>· {video.duration}</span>
                    {(video.watchedPercentage ?? 0) > 0 && !video.watched && (
                      <span className="text-purple-500 font-semibold">{video.watchedPercentage}%</span>
                    )}
                    {video.watched && (
                      <span className="flex items-center gap-0.5 text-green-500 font-semibold">
                        <Check className="w-3 h-3" strokeWidth={3} /> Done
                      </span>
                    )}
                  </div>
                  {(video.watchedPercentage ?? 0) > 0 && (
                    <div className={`mt-1 sm:mt-1.5 h-1 rounded-full overflow-hidden ${dm ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className={`h-full rounded-full ${video.watched ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${video.watchedPercentage}%` }} />
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => onToggleCompleted(video.id, !video.watched)}
                    className={`p-1.5 rounded-lg transition ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    title={video.watched ? 'Mark unwatched' : 'Mark complete'}>
                    {video.watched
                      ? <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                      : <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />}
                  </button>
                  <button onClick={() => onToggleBookmark(video.id, !video.bookmarked)}
                    className={`p-1.5 rounded-lg transition ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="Bookmark">
                    <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${video.bookmarked ? 'text-amber-500 fill-current' : dm ? 'text-gray-500' : 'text-gray-400'}`} />
                  </button>
                  <a href={`https://www.youtube.com/watch?v=${video.videoUrl}`} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className={`p-1.5 rounded-lg transition hidden sm:block ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="YouTube">
                    <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                  </a>
                  <button onClick={() => onPlay(video)} className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 transition" title="Play">
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-current" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── YouTube Player ───────────────────────────────────────────────────────────
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function YouTubePlayer({ video, queue, dm, onClose, onProgress, onToggleBookmark, onToggleCompleted, onNext }: {
  video: Video; queue: Video[]; dm: boolean;
  onClose: () => void;
  onProgress: (id: string, pct: number, secs: number, lastPos: number) => void;
  onToggleBookmark: (id: string, b: boolean) => void;
  onToggleCompleted: (id: string, c: boolean) => void;
  onNext: (v: Video) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pct, setPct] = useState(video.watchedPercentage ?? 0);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [bookmarked, setBookmarked] = useState(!!video.bookmarked);
  const [completed, setCompleted] = useState(!!video.watched);
  const [showQueue, setShowQueue] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFs, setIsFs] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const secsRef = useRef(0);
  const lastSentRef = useRef(Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumedRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dblClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cidx = queue.findIndex(v => v.id === video.id);
  const nextV = cidx >= 0 && cidx < queue.length - 1 ? queue[cidx + 1] : null;
  const prevV = cidx > 0 ? queue[cidx - 1] : null;

  useEffect(() => {
    setBookmarked(!!video.bookmarked);
    setCompleted(!!video.watched);
    setPct(video.watchedPercentage ?? 0);
  }, [video.id]);

  const flush = useCallback((final = false) => {
    const p = playerRef.current;
    if (!p?.getCurrentTime) return;
    const dur = p.getDuration() || 0;
    const cur = p.getCurrentTime() || 0;
    const newPct = dur > 0 ? Math.min(100, Math.round((cur / dur) * 100)) : 0;
    setPct(newPct);
    const delta = secsRef.current;
    if (delta > 0 || final) {
      onProgress(video.id, newPct, delta, Math.round(cur));
      secsRef.current = 0;
      lastSentRef.current = Date.now();
      if (newPct >= 95) setCompleted(true);
    }
  }, [onProgress, video.id]);

  const cancelCountdown = useCallback(() => {
    if (cdownRef.current) clearInterval(cdownRef.current);
    setCountdown(null);
  }, []);

  const startCountdown = useCallback(() => {
    if (!autoNext || !nextV) return;
    setCountdown(8);
    cdownRef.current = setInterval(() => {
      setCountdown(n => {
        if (n === null || n <= 1) {
          clearInterval(cdownRef.current!);
          setCountdown(null);
          onNext(nextV);
          return null;
        }
        return n - 1;
      });
    }, 1000);
  }, [autoNext, nextV, onNext]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // ── Init player — width/height MUST be passed, and we force iframe CSS too ──
  useEffect(() => {
    let dead = false;
    loadYT().then(() => {
      if (dead || !elRef.current) return;
      playerRef.current = new window.YT.Player(elRef.current, {
        width: '100%',
        height: '100%',
        videoId: video.videoUrl,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          origin: window.location.origin,
        },
        events: {
          onReady(e: any) {
            setReady(true);
            // Force the actual iframe element to fill its container —
            // YT writes inline width/height attrs that fight our CSS otherwise.
            try {
              const iframe = e.target.getIframe?.();
              if (iframe) {
                iframe.style.position = 'absolute';
                iframe.style.inset = '0';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
              }
            } catch {}
            if (!resumedRef.current && (video.lastPosition ?? 0) > 10 && (video.watchedPercentage ?? 0) < 95) {
              try { e.target.seekTo(video.lastPosition, true); } catch { }
            }
            resumedRef.current = true;
            try { e.target.setPlaybackRate(speed); } catch { }
          },
          onStateChange(e: any) {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              setIsPlaying(true);
              cancelCountdown();
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = setInterval(() => {
                secsRef.current += 1;
                if (Date.now() - lastSentRef.current >= 30_000) flush();
              }, 1000);
              resetHideTimer();
            } else {
              setIsPlaying(false);
              if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
              flush();
              setShowControls(true);
              if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
              if (e.data === S.ENDED) {
                setCompleted(true);
                onProgress(video.id, 100, 0, 0);
                startCountdown();
              }
            }
          },
        },
      });
    });
    return () => {
      dead = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (cdownRef.current) clearInterval(cdownRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (dblClickTimerRef.current) clearTimeout(dblClickTimerRef.current);
      flush(true);
      try { playerRef.current?.destroy?.(); } catch { }
    };
  }, [video.videoUrl]);

  // Fullscreen listener
  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight' || e.key === 'l') seek(10);
      if (e.key === 'ArrowLeft' || e.key === 'j') seek(-10);
      if (e.key === 'f') toggleFs();
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    const state = p.getPlayerState?.();
    if (state === window.YT?.PlayerState?.PLAYING) p.pauseVideo();
    else p.playVideo();
  };

  const setRate = (s: number) => {
    setSpeed(s); setShowSpeed(false);
    try { playerRef.current?.setPlaybackRate(s); } catch { }
  };

  const seek = (d: number) => {
    try { playerRef.current?.seekTo((playerRef.current?.getCurrentTime() ?? 0) + d, true); } catch { }
    resetHideTimer();
  };

  const toggleFs = () => {
    const c = containerRef.current;
    if (!document.fullscreenElement) c?.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  // ── Tap/click handling: single tap = play/pause + show controls,
  //    double tap/click = toggle REAL fullscreen (like YouTube/Netflix apps) ──
  const handlePlayerClick = useCallback(() => {
    if (dblClickTimerRef.current) {
      clearTimeout(dblClickTimerRef.current);
      dblClickTimerRef.current = null;
      toggleFs();
    } else {
      dblClickTimerRef.current = setTimeout(() => {
        dblClickTimerRef.current = null;
        togglePlay();
        resetHideTimer();
      }, 280);
    }
  }, []);

  const handleBookmark = () => {
    const next = !bookmarked;
    setBookmarked(next);
    onToggleBookmark(video.id, next);
  };

  const handleComplete = () => {
    const next = !completed;
    setCompleted(next);
    if (next) setPct(100);
    onToggleCompleted(video.id, next);
  };

  return (
    <div className="fixed inset-0 bg-black z-[100]" onMouseMove={resetHideTimer} onTouchStart={resetHideTimer}>
      <div ref={containerRef} className="relative w-full h-full flex flex-col bg-black">

        {/* ── Top bar ── */}
        <div className={`absolute top-0 inset-x-0 z-20 transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-gradient-to-b from-black/90 via-black/50 to-transparent px-3 sm:px-4 pt-3 sm:pt-4 pb-8 pointer-events-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition backdrop-blur-sm flex-shrink-0">
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-base font-bold text-white line-clamp-1 leading-snug">{video.title}</h3>
                {nextV && <p className="text-[10px] sm:text-xs text-white/50 line-clamp-1 mt-0.5">Up next: {nextV.title}</p>}
              </div>
              <button onClick={() => setShowQueue(!showQueue)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition backdrop-blur-sm flex-shrink-0">
                <List className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Video area — fills 100% of available space, no flex shrinking ── */}
        <div className="absolute inset-0">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                <div className="absolute inset-0 rounded-full border-4 border-red-900" />
                <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
                <Youtube className="absolute inset-0 m-auto w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              </div>
            </div>
          )}

          {/* The YT iframe gets mounted into this div; we force-fill it in onReady */}
          <div ref={elRef} className="absolute inset-0 w-full h-full [&>iframe]:!w-full [&>iframe]:!h-full [&>iframe]:!absolute [&>iframe]:!inset-0" />

          {/* Transparent overlay — intercepts all clicks for our custom controls */}
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={handlePlayerClick}
          />
        </div>

        {/* ── Auto-next overlay ── */}
        {countdown !== null && nextV && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30 p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 sm:p-6 w-full max-w-xs text-center shadow-2xl">
              <p className="text-white/60 text-xs sm:text-sm mb-1">Up Next</p>
              <p className="text-white font-bold text-sm sm:text-base mb-3 line-clamp-2">{nextV.title}</p>
              <img src={nextV.thumbnail || `https://img.youtube.com/vi/${nextV.videoUrl}/hqdefault.jpg`}
                alt="" className="w-full aspect-video rounded-xl object-cover mb-4" />
              <div className="flex gap-3">
                <button onClick={cancelCountdown}
                  className="flex-1 py-2 sm:py-2.5 rounded-xl border border-white/20 text-white/80 text-xs sm:text-sm hover:bg-white/10 transition">
                  Cancel
                </button>
                <button onClick={() => { cancelCountdown(); onNext(nextV!); }}
                  className="flex-1 py-2 sm:py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-current" /> Play ({countdown}s)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Queue sidebar ── */}
        {showQueue && (
          <div className="absolute top-0 right-0 bottom-0 w-64 sm:w-80 bg-black/95 backdrop-blur-md z-20 flex flex-col border-l border-white/10">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
              <p className="text-white font-bold text-xs sm:text-sm">Queue · {queue.length} videos</p>
              <button onClick={() => setShowQueue(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-white/10">
              <span className="text-white/50 text-xs">Auto-play next</span>
              <button onClick={() => setAutoNext(a => !a)}
                className={`ml-auto w-8 sm:w-9 h-4 sm:h-5 rounded-full transition-colors flex items-center px-0.5 ${autoNext ? 'bg-red-500' : 'bg-gray-600'}`}>
                <div className={`w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-white shadow transition-transform ${autoNext ? 'translate-x-3.5 sm:translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-1.5 sm:p-2 space-y-1">
              {queue.map((v, i) => (
                <button key={v.id} onClick={() => { onNext(v); setShowQueue(false); }}
                  className={`w-full flex items-center gap-2 p-1.5 sm:p-2 rounded-xl text-left transition ${v.id === video.id ? 'bg-red-500/20 border border-red-500/40' : 'hover:bg-white/10'}`}>
                  <span className="text-white/30 text-[10px] sm:text-xs w-4 text-center flex-shrink-0">{i + 1}</span>
                  <img src={v.thumbnail || `https://img.youtube.com/vi/${v.videoUrl}/hqdefault.jpg`}
                    alt="" className="w-12 h-8 sm:w-14 sm:h-9 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] sm:text-xs font-semibold line-clamp-2 leading-tight ${v.id === video.id ? 'text-red-300' : 'text-white/80'}`}>{v.title}</p>
                    <p className="text-white/30 text-[9px] sm:text-[10px] mt-0.5">{v.duration}</p>
                  </div>
                  {v.watched && <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400 fill-current flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom controls ── */}
        <div className={`absolute bottom-0 inset-x-0 z-20 transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 sm:px-4 pt-8 pb-3 sm:pb-4 pointer-events-auto">

            <div className="mb-2 sm:mb-3">
              <div
                className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer group"
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  try {
                    const dur = playerRef.current?.getDuration() || 0;
                    if (dur) playerRef.current?.seekTo(ratio * dur, true);
                  } catch { }
                }}
              >
                <div className="h-full bg-red-500 rounded-full transition-all group-hover:bg-red-400" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-white/40 text-[10px]">{pct}% watched</span>
                <span className="text-white/40 text-[10px]">{video.duration}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-1 flex-wrap">
                <button onClick={togglePlay}
                  className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition">
                  {isPlaying
                    ? <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    : <Play className="w-4 h-4 text-white fill-current" />}
                </button>

                {prevV && (
                  <button onClick={() => onNext(prevV)} className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition" title="Previous">
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </button>
                )}

                <button onClick={() => seek(-10)} className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition" title="-10s">
                  <Rewind className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </button>

                <button onClick={() => seek(10)} className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition" title="+10s">
                  <FastForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </button>

                {nextV && (
                  <button onClick={() => onNext(nextV)} className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition" title="Next">
                    <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </button>
                )}

                <div className="relative">
                  <button onClick={() => setShowSpeed(s => !s)}
                    className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-[10px] sm:text-xs font-bold transition">
                    {speed}×
                  </button>
                  {showSpeed && (
                    <div className="absolute bottom-8 sm:bottom-10 left-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-xl z-30 min-w-[70px] sm:min-w-[80px]">
                      {SPEEDS.map(s => (
                        <button key={s} onClick={() => setRate(s)}
                          className={`block w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition ${s === speed ? 'bg-red-500 text-white font-bold' : 'text-white/70 hover:bg-white/10'}`}>
                          {s}×
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={handleComplete}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition ${completed ? 'bg-green-500/30 text-green-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  {completed ? <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                  <span className="hidden xs:inline sm:inline">{completed ? 'Done ✓' : 'Complete'}</span>
                </button>

                <button onClick={handleBookmark}
                  className={`p-1.5 sm:p-2 rounded-xl transition ${bookmarked ? 'bg-amber-500/30 text-amber-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  title="Bookmark">
                  <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${bookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                <a href={`https://www.youtube.com/watch?v=${video.videoUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-red-500/20 text-red-400 text-[10px] sm:text-xs font-semibold hover:bg-red-500/30 transition">
                  <Youtube className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  YT
                  <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </a>

                <button onClick={toggleFs}
                  className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition" title="Fullscreen (or double-tap video)">
                  {isFs
                    ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}