'use client';
// components/student/StudentVideoLibrary.tsx
// Full YouTube-powered video library with advanced player

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Eye, Search, Folder, Clock, ChevronRight, Bookmark, X,
  CheckCircle, Loader, Check, RotateCcw, Youtube, ExternalLink,
  SkipForward, ChevronLeft, List, Filter, TrendingUp, Grid3x3,
  LayoutList, FastForward, Rewind, Maximize2, ChevronDown, Star,
  BookOpen, Award, Zap, BarChart2, ArrowUp,
} from 'lucide-react';

declare global { interface Window { YT: any; onYouTubeIframeAPIReady: () => void; } }

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
interface Stats { watchTime: { hours: number; minutes: number }; completedVideos: number; startedVideos: number; bookmarkedVideos: number; }

// ── YT IFrame API loader (singleton) ─────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
export default function StudentVideoLibrary() {
  const [folders, setFolders] = useState<VideoFolder[]>([]);
  const [stats, setStats] = useState<Stats>({ watchTime: { hours: 0, minutes: 0 }, completedVideos: 0, startedVideos: 0, bookmarkedVideos: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'continue' | 'bookmarks' | 'completed'>('all');
  const [selectedFolder, setSelectedFolder] = useState<VideoFolder | null>(null);
  const [playerVideo, setPlayerVideo] = useState<Video | null>(null);
  const [playerQueue, setPlayerQueue] = useState<Video[]>([]);

  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const ob = new MutationObserver(check);
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => ob.disconnect();
  }, []);

  useEffect(() => { fetchAll(); }, []);

  // Keep selectedFolder fresh after refetch
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

  const trackProgress = useCallback(async (videoId: string, pct: number, secs: number, lastPos: number) => {
    await fetch('/api/student/video-progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, watchedPercentage: pct, watchedSeconds: secs, lastPosition: lastPos, completed: pct >= 95 }),
    }).catch(() => {});
    fetch('/api/student/watch-stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d); });
  }, []);

  const toggleBookmark = useCallback(async (videoId: string, current: boolean) => {
    await fetch('/api/student/bookmarks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, bookmarked: !current }),
    }).catch(() => {});
    fetchAll();
  }, []);

  const toggleCompleted = useCallback(async (videoId: string, current: boolean) => {
    await fetch('/api/student/video-progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, watchedPercentage: current ? 0 : 100, watchedSeconds: 0, lastPosition: 0, completed: !current }),
    }).catch(() => {});
    fetchAll();
  }, []);

  // Derived lists
  const allVideos = folders.flatMap(f => f.videos.map(v => ({ ...v, folder: f })));
  const continueList = allVideos.filter(v => (v.watchedPercentage ?? 0) > 0 && !(v.watched)).sort((a, b) => (b.watchedPercentage ?? 0) - (a.watchedPercentage ?? 0));
  const bookmarkList = allVideos.filter(v => v.bookmarked);
  const completedList = allVideos.filter(v => v.watched);

  const subjects = ['all', ...Array.from(new Set(folders.map(f => f.subject)))];
  const filteredFolders = folders.filter(f => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q || f.name.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q) || f.chapter.toLowerCase().includes(q);
    const matchS = subjectFilter === 'all' || f.subject === subjectFilter;
    return matchQ && matchS;
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

      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Video Library</h2>
          <p className={`text-sm mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
            Watch lectures from YouTube · {folders.reduce((s,f) => s+f.videoCount,0)} videos across {folders.length} folders
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${dm ? 'bg-red-900/40 text-red-300' : 'bg-red-50 text-red-600 border border-red-100'}`}>
          <Youtube className="w-3.5 h-3.5" />
          YouTube
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { icon: Play,         bg: dm?'bg-red-900/50':'bg-red-50',     color:'text-red-500',    value: folders.reduce((s,f)=>s+f.videoCount,0), label:'Total Videos',  border: dm?'border-red-800':'border-red-100' },
          { icon: CheckCircle,  bg: dm?'bg-green-900/50':'bg-green-50', color:'text-green-500',  value: stats.completedVideos,                   label:'Completed',     border: dm?'border-green-800':'border-green-100' },
          { icon: Clock,        bg: dm?'bg-blue-900/50':'bg-blue-50',   color:'text-blue-500',   value: `${stats.watchTime.hours}h ${stats.watchTime.minutes}m`, label:'Watch Time', border: dm?'border-blue-800':'border-blue-100' },
          { icon: Bookmark,     bg: dm?'bg-amber-900/50':'bg-amber-50', color:'text-amber-500',  value: stats.bookmarkedVideos,                  label:'Bookmarked',    border: dm?'border-amber-800':'border-amber-100' },
        ].map(({ icon: Icon, bg: ibg, color, value, label, border }) => (
          <div key={label} className={`rounded-2xl border-2 p-4 sm:p-5 transition-all hover:shadow-lg ${card}`}>
            <div className={`w-10 h-10 ${ibg} border ${border} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold mb-0.5 ${dm?'text-white':'text-gray-900'}`}>{value}</p>
            <p className={`text-xs font-medium ${dm?'text-gray-400':'text-gray-500'}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className={`rounded-2xl border-2 p-1.5 mb-5 flex gap-1 overflow-x-auto ${card}`}>
        {([
          ['all','All Folders', folders.length],
          ['continue','Continue', continueList.length],
          ['bookmarks','Bookmarked', bookmarkList.length],
          ['completed','Completed', completedList.length],
        ] as [typeof activeTab, string, number][]).map(([tab, label, count]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                : dm ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab ? 'bg-white/20 text-white' : dm?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-600'}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search + Filters (only on All tab) ── */}
      {activeTab === 'all' && (
        <div className={`rounded-2xl border-2 p-3 sm:p-4 mb-5 ${card}`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 relative min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Search videos, subjects, topics…"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition ${dm?'bg-gray-700 border-gray-600 text-white placeholder-gray-400':'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              {subjects.map(s => (
                <button key={s} onClick={() => setSubjectFilter(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${subjectFilter===s ? 'bg-red-500 text-white shadow-sm' : dm?'bg-gray-700 text-gray-300 hover:bg-gray-600':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {s === 'all' ? 'All Subjects' : s}
                </button>
              ))}
            </div>
            <button onClick={() => setViewMode(v => v==='grid'?'list':'grid')}
              className={`p-2.5 rounded-xl border-2 transition ${dm?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {viewMode==='grid' ? <LayoutList className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab content ── */}

      {/* ALL FOLDERS */}
      {activeTab === 'all' && (
        <div>
          {filteredFolders.length === 0 ? (
            <EmptyState icon={<Folder className="w-12 h-12" />} title="No folders found" sub="Try a different search or filter" dm={dm} />
          ) : (
            <div className={viewMode==='grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-3'}>
              {filteredFolders.map(f => (
                <FolderCard key={f.id} folder={f} dm={dm} onClick={() => setSelectedFolder(f)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTINUE WATCHING */}
      {activeTab === 'continue' && (
        <div>
          {continueList.length === 0 ? (
            <EmptyState icon={<Play className="w-12 h-12" />} title="Nothing in progress" sub="Start watching a video and it'll appear here" dm={dm} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {continueList.map(item => (
                <ContinueCard key={item.id} video={item} folder={(item as any).folder} dm={dm} onPlay={() => handlePlay(item, (item as any).folder)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* BOOKMARKS */}
      {activeTab === 'bookmarks' && (
        <div>
          {bookmarkList.length === 0 ? (
            <EmptyState icon={<Bookmark className="w-12 h-12" />} title="No bookmarks yet" sub="Bookmark videos while watching to save them here" dm={dm} />
          ) : (
            <div className={`rounded-2xl border-2 overflow-hidden ${card}`}>
              {bookmarkList.map((item, i) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 sm:p-4 ${i < bookmarkList.length-1 ? `border-b-2 ${dm?'border-gray-700':'border-gray-100'}` : ''}`}>
                  <Thumb video={item} dm={dm} size="sm" onClick={() => handlePlay(item, (item as any).folder)} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm line-clamp-1 ${dm?'text-white':'text-gray-900'}`}>{item.title}</p>
                    <p className={`text-xs ${dm?'text-gray-400':'text-gray-500'}`}>{(item as any).folder.name} · {item.duration}</p>
                    {(item.watchedPercentage??0) > 0 && (
                      <div className={`mt-1.5 h-1 rounded-full overflow-hidden ${dm?'bg-gray-700':'bg-gray-100'}`}>
                        <div className="h-full bg-red-500 rounded-full" style={{width:`${item.watchedPercentage}%`}} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleBookmark(item.id, true)} className={`p-1.5 rounded-lg transition ${dm?'hover:bg-gray-700':'hover:bg-gray-100'}`}>
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
        </div>
      )}

      {/* COMPLETED */}
      {activeTab === 'completed' && (
        <div>
          {completedList.length === 0 ? (
            <EmptyState icon={<CheckCircle className="w-12 h-12" />} title="No completed videos" sub="Videos you finish watching will appear here" dm={dm} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <p className={`font-semibold text-sm line-clamp-2 mb-1 ${dm?'text-white':'text-gray-900'}`}>{item.title}</p>
                    <p className={`text-xs ${dm?'text-gray-400':'text-gray-500'}`}>{(item as any).folder.name}</p>
                    <button onClick={() => toggleCompleted(item.id, true)} className={`mt-2 text-xs flex items-center gap-1 ${dm?'text-gray-500 hover:text-gray-300':'text-gray-400 hover:text-gray-600'}`}>
                      <RotateCcw className="w-3 h-3" /> Mark as unwatched
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedFolder && (
        <FolderModal
          folder={selectedFolder} dm={dm}
          onClose={() => setSelectedFolder(null)}
          onPlay={(v) => handlePlay(v, selectedFolder)}
          onToggleBookmark={toggleBookmark}
          onToggleCompleted={toggleCompleted}
        />
      )}
      {playerVideo && (
        <YouTubePlayer
          video={playerVideo} queue={playerQueue} dm={dm}
          onClose={() => { setPlayerVideo(null); fetchAll(); }}
          onProgress={trackProgress}
          onToggleBookmark={toggleBookmark}
          onToggleCompleted={toggleCompleted}
          onNext={v => setPlayerVideo(v)}
        />
      )}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
function EmptyState({ icon, title, sub, dm }: { icon: React.ReactNode; title: string; sub: string; dm: boolean }) {
  return (
    <div className={`rounded-2xl border-2 p-14 text-center ${dm?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
      <div className={`mx-auto mb-3 ${dm?'text-gray-600':'text-gray-300'}`}>{icon}</div>
      <p className={`font-bold text-lg mb-1 ${dm?'text-white':'text-gray-900'}`}>{title}</p>
      <p className={`text-sm ${dm?'text-gray-400':'text-gray-500'}`}>{sub}</p>
    </div>
  );
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────
function Thumb({ video, dm, size='md', onClick, fill }: { video: Video; dm: boolean; size?: 'sm'|'md'; onClick?: () => void; fill?: boolean }) {
  const cls = fill ? 'w-full aspect-video' : size==='sm' ? 'w-20 h-14 flex-shrink-0' : 'w-28 h-[4.5rem] flex-shrink-0';
  const src = video.thumbnail || `https://img.youtube.com/vi/${video.videoUrl}/hqdefault.jpg`;
  return (
    <div onClick={onClick} className={`${cls} relative rounded-lg overflow-hidden cursor-pointer group`}>
      <img src={src} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 transition-all">
          <Play className="w-4 h-4 text-red-600 fill-current ml-0.5" />
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

// ── FolderCard ────────────────────────────────────────────────────────────────
function FolderCard({ folder, dm, onClick }: { folder: VideoFolder; dm: boolean; onClick: () => void }) {
  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  return (
    <div onClick={onClick} className={`rounded-2xl border-2 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group ${card}`}>
      <div className="h-40 sm:h-44 relative overflow-hidden">
        {folder.thumbnail ? (
          <img src={folder.thumbnail} alt={folder.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 flex items-center justify-center">
            <Youtube className="w-16 h-16 text-white opacity-60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${dm?'bg-red-900/80 text-red-300':'bg-red-500 text-white'}`}>{folder.subject}</span>
          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-semibold">{folder.videoCount} videos</span>
        </div>
        {folder.progress > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20">
            <div className="h-full bg-green-400 transition-all" style={{width:`${folder.progress}%`}} />
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h3 className={`font-bold text-base sm:text-lg mb-1 line-clamp-1 ${dm?'text-white':'text-gray-900'}`}>{folder.name}</h3>
        <p className={`text-xs mb-1 ${dm?'text-gray-400':'text-gray-500'}`}>{folder.chapter}</p>
        <p className={`text-xs line-clamp-2 mb-4 ${dm?'text-gray-500':'text-gray-500'}`}>{folder.description}</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label:'Videos', value: folder.videoCount },
            { label:'Duration', value: folder.totalDuration },
            { label:'Progress', value: `${folder.progress}%` },
          ].map(({label,value}) => (
            <div key={label} className={`rounded-xl p-2 text-center ${dm?'bg-gray-700/60':'bg-gray-50'}`}>
              <p className={`text-[10px] mb-0.5 ${dm?'text-gray-400':'text-gray-500'}`}>{label}</p>
              <p className={`text-xs font-bold truncate ${dm?'text-gray-200':'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className={`flex items-center justify-between text-xs pt-3 border-t-2 ${dm?'border-gray-700 text-gray-500':'border-gray-100 text-gray-500'}`}>
          <span className="truncate">By {folder.teacher}</span>
          <span className={`font-semibold flex items-center gap-1 ${dm?'text-red-400':'text-red-600'}`}>
            View All <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

// ── ContinueCard ──────────────────────────────────────────────────────────────
function ContinueCard({ video, folder, dm, onPlay }: { video: Video; folder: VideoFolder; dm: boolean; onPlay: () => void }) {
  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  return (
    <div onClick={onPlay} className={`rounded-xl border-2 overflow-hidden hover:shadow-xl transition-all cursor-pointer group ${card}`}>
      <div className="aspect-video relative overflow-hidden">
        <Thumb video={video} dm={dm} fill onClick={onPlay} />
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20">
          <div className="h-full bg-purple-400" style={{width:`${video.watchedPercentage}%`}} />
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <p className={`font-semibold text-sm line-clamp-2 mb-1 ${dm?'text-white':'text-gray-900'}`}>{video.title}</p>
        <p className={`text-xs mb-2 ${dm?'text-gray-400':'text-gray-500'}`}>{folder.name}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-purple-500 font-semibold">{video.watchedPercentage}% watched</span>
          <span className={`text-xs ${dm?'text-gray-500':'text-gray-400'}`}>{video.duration}</span>
        </div>
      </div>
    </div>
  );
}

// ── FolderModal ───────────────────────────────────────────────────────────────
function FolderModal({ folder, dm, onClose, onPlay, onToggleBookmark, onToggleCompleted }: {
  folder: VideoFolder; dm: boolean; onClose: () => void;
  onPlay: (v: Video) => void; onToggleBookmark: (id: string, b: boolean) => void; onToggleCompleted: (id: string, c: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = folder.videos.filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase()));
  const bg = dm ? 'bg-gray-900' : 'bg-white';
  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`${bg} rounded-t-2xl sm:rounded-2xl w-full sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl`}>
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b-2 flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <div className="flex items-start gap-4">
            {folder.thumbnail && (
              <img src={folder.thumbnail} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0 hidden sm:block" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg sm:text-2xl font-bold line-clamp-1 ${dm?'text-white':'text-gray-900'}`}>{folder.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${dm?'bg-red-900/60 text-red-300':'bg-red-100 text-red-700'}`}>{folder.subject}</span>
                <span className={`text-xs ${dm?'text-gray-400':'text-gray-500'}`}>• {folder.chapter} • By {folder.teacher}</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className={`text-xs ${dm?'text-gray-400':'text-gray-500'}`}>{folder.videoCount} videos • {folder.totalDuration}</span>
                {folder.progress > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-20 h-1.5 rounded-full ${dm?'bg-gray-700':'bg-gray-200'}`}>
                      <div className="h-full bg-green-500 rounded-full" style={{width:`${folder.progress}%`}} />
                    </div>
                    <span className="text-xs text-green-500 font-semibold">{folder.progress}%</span>
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl transition flex-shrink-0 ${dm?'hover:bg-gray-700':'hover:bg-gray-100'}`}>
              <X className={`w-5 h-5 ${dm?'text-gray-400':'text-gray-500'}`} />
            </button>
          </div>
          {/* Search inside folder */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search in this folder…" value={search} onChange={e=>setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent ${dm?'bg-gray-700 border-gray-600 text-white placeholder-gray-400':'bg-gray-50 border-gray-200 text-gray-900'}`}
            />
          </div>
        </div>

        {/* Videos */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6 space-y-3">
          {filtered.length === 0 && (
            <p className={`text-center py-8 text-sm ${dm?'text-gray-400':'text-gray-500'}`}>No videos match your search</p>
          )}
          {filtered.map((video, idx) => (
            <div key={video.id} className={`rounded-xl border-2 overflow-hidden hover:shadow-md transition-all ${card}`}>
              <div className="flex items-center gap-3 p-3 sm:p-4">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${dm?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-500'}`}>{idx+1}</span>
                <Thumb video={video} dm={dm} onClick={() => onPlay(video)} />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-xs sm:text-sm line-clamp-2 mb-1 ${dm?'text-white':'text-gray-900'}`}>{video.title}</p>
                  <div className={`flex flex-wrap items-center gap-2 text-[10px] sm:text-xs ${dm?'text-gray-500':'text-gray-400'}`}>
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {video.views.toLocaleString()}</span>
                    <span>· {video.duration}</span>
                    {(video.watchedPercentage??0) > 0 && !video.watched && (
                      <span className="text-purple-500 font-semibold">{video.watchedPercentage}%</span>
                    )}
                    {video.watched && <span className="flex items-center gap-0.5 text-green-500 font-semibold"><Check className="w-3 h-3" strokeWidth={3} /> Done</span>}
                  </div>
                  {(video.watchedPercentage??0) > 0 && (
                    <div className={`mt-1.5 h-1 rounded-full overflow-hidden ${dm?'bg-gray-700':'bg-gray-100'}`}>
                      <div className={`h-full rounded-full ${video.watched?'bg-green-500':'bg-red-400'}`} style={{width:`${video.watchedPercentage}%`}} />
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => onToggleCompleted(video.id, !!video.watched)} className={`p-1.5 rounded-lg transition ${dm?'hover:bg-gray-700':'hover:bg-gray-100'}`} title={video.watched?'Mark unwatched':'Mark complete'}>
                    {video.watched ? <RotateCcw className="w-4 h-4 text-orange-500" /> : <Check className="w-4 h-4 text-green-500" />}
                  </button>
                  <button onClick={() => onToggleBookmark(video.id, !!video.bookmarked)} className={`p-1.5 rounded-lg transition ${dm?'hover:bg-gray-700':'hover:bg-gray-100'}`} title="Bookmark">
                    <Bookmark className={`w-4 h-4 ${video.bookmarked?'text-amber-500 fill-current':dm?'text-gray-500':'text-gray-400'}`} />
                  </button>
                  <a href={`https://www.youtube.com/watch?v=${video.videoUrl}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                    className={`p-1.5 rounded-lg transition ${dm?'hover:bg-gray-700':'hover:bg-gray-100'}`} title="Watch on YouTube">
                    <Youtube className="w-4 h-4 text-red-500" />
                  </a>
                  <button onClick={() => onPlay(video)} className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 transition" title="Play">
                    <Play className="w-4 h-4 text-white fill-current" />
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

// ── YouTube Player ────────────────────────────────────────────────────────────
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
  const [pct, setPct] = useState(video.watchedPercentage ?? 0);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [bookmarked, setBookmarked] = useState(!!video.bookmarked);
  const [completed, setCompleted] = useState(!!video.watched);
  const [showQueue, setShowQueue] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [countdown, setCountdown] = useState<number|null>(null);
  const [isFs, setIsFs] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const secs = useRef(0);
  const lastSent = useRef(Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const cdownRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const resumedRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  const cidx = queue.findIndex(v => v.id === video.id);
  const nextV = cidx >= 0 && cidx < queue.length-1 ? queue[cidx+1] : null;
  const prevV = cidx > 0 ? queue[cidx-1] : null;

  const flush = useCallback((final=false) => {
    const p = playerRef.current;
    if (!p?.getCurrentTime) return;
    const dur = p.getDuration() || 0;
    const cur = p.getCurrentTime() || 0;
    const newPct = dur > 0 ? Math.min(100, Math.round((cur/dur)*100)) : 0;
    setPct(newPct);
    const delta = secs.current;
    if (delta > 0 || final) {
      onProgress(video.id, newPct, delta, Math.round(cur));
      secs.current = 0;
      lastSent.current = Date.now();
      if (newPct >= 95) setCompleted(true);
    }
  }, [onProgress, video.id]);

  const cancelCountdown = () => {
    if (cdownRef.current) clearInterval(cdownRef.current);
    setCountdown(null);
  };

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
        return n-1;
      });
    }, 1000);
  }, [autoNext, nextV, onNext]);

  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    let dead = false;
    loadYT().then(() => {
      if (dead || !elRef.current) return;
      playerRef.current = new window.YT.Player(elRef.current, {
        videoId: video.videoUrl,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, origin: window.location.origin },
        events: {
          onReady(e: any) {
            setReady(true);
            if (!resumedRef.current && (video.lastPosition ?? 0) > 10 && (video.watchedPercentage ?? 0) < 95) {
              try { e.target.seekTo(video.lastPosition, true); } catch {}
            }
            resumedRef.current = true;
            try { e.target.setPlaybackRate(speed); } catch {}
          },
          onStateChange(e: any) {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              cancelCountdown();
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = setInterval(() => {
                secs.current += 1;
                if (Date.now() - lastSent.current >= 30_000) flush();
              }, 1000);
              resetHideTimer();
            } else {
              if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
              flush();
              setShowControls(true);
              if (hideTimer.current) clearTimeout(hideTimer.current);
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
      if (hideTimer.current) clearTimeout(hideTimer.current);
      flush(true);
      try { playerRef.current?.destroy?.(); } catch {}
    };
  }, [video.videoUrl]);

  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const setRate = (s: number) => {
    setSpeed(s); setShowSpeed(false);
    try { playerRef.current?.setPlaybackRate(s); } catch {}
  };
  const seek = (d: number) => {
    try { playerRef.current?.seekTo((playerRef.current?.getCurrentTime()??0)+d, true); } catch {}
    resetHideTimer();
  };
  const toggleFs = () => {
    const c = containerRef.current;
    if (!document.fullscreenElement) c?.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col" onMouseMove={resetHideTimer}>
      <div ref={containerRef} className="relative w-full h-full flex flex-col">

        {/* Top bar */}
        <div className={`absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-3 sm:p-4 transition-opacity duration-300 ${showControls?'opacity-100':'opacity-0'}`}>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition backdrop-blur-sm flex-shrink-0">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">{video.title}</h3>
              {nextV && <p className="text-xs text-white/50 line-clamp-1">Up next: {nextV.title}</p>}
            </div>
            <button onClick={() => setShowQueue(!showQueue)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition backdrop-blur-sm flex-shrink-0">
              <List className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Player */}
        <div className="flex-1 flex items-center justify-center bg-black relative">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-red-900" />
                <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
                <Youtube className="absolute inset-0 m-auto w-5 h-5 text-red-400" />
              </div>
            </div>
          )}
          <div ref={elRef} className="w-full h-full" />
        </div>

        {/* Auto-next overlay */}
        {countdown !== null && nextV && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-30">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-xs w-full mx-4 text-center shadow-2xl">
              <p className="text-white/70 text-sm mb-1">Up Next</p>
              <p className="text-white font-bold text-base mb-3 line-clamp-2">{nextV.title}</p>
              <img src={nextV.thumbnail || `https://img.youtube.com/vi/${nextV.videoUrl}/hqdefault.jpg`} alt="" className="w-full aspect-video rounded-xl object-cover mb-4" />
              <div className="flex gap-3">
                <button onClick={cancelCountdown} className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/80 text-sm hover:bg-white/10 transition">Cancel</button>
                <button onClick={() => { cancelCountdown(); onNext(nextV!); }} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition flex items-center justify-center gap-2">
                  <Play className="w-4 h-4 fill-current" /> Play ({countdown}s)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Queue sidebar */}
        {showQueue && (
          <div className="absolute top-0 right-0 bottom-0 w-72 sm:w-80 bg-gray-950/95 backdrop-blur-md z-20 flex flex-col border-l border-white/10">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <p className="text-white font-bold text-sm">Queue · {queue.length} videos</p>
              <button onClick={() => setShowQueue(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
              <span className="text-white/50 text-xs">Auto-play next</span>
              <button onClick={() => setAutoNext(a=>!a)}
                className={`ml-auto w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${autoNext?'bg-red-500':'bg-gray-600'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${autoNext?'translate-x-4':'translate-x-0'}`} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {queue.map((v, i) => (
                <button key={v.id} onClick={() => { onNext(v); setShowQueue(false); }}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition ${v.id===video.id?'bg-red-500/20 border border-red-500/40':'hover:bg-white/8'}`}>
                  <span className="text-white/30 text-xs w-4 text-center flex-shrink-0">{i+1}</span>
                  <img src={v.thumbnail || `https://img.youtube.com/vi/${v.videoUrl}/hqdefault.jpg`} alt="" className="w-14 h-9 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold line-clamp-2 leading-tight ${v.id===video.id?'text-red-300':'text-white/80'}`}>{v.title}</p>
                    <p className="text-white/30 text-[10px] mt-0.5">{v.duration}</p>
                  </div>
                  {v.watched && <CheckCircle className="w-3.5 h-3.5 text-green-400 fill-current flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className={`absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-3 sm:p-4 transition-opacity duration-300 ${showControls?'opacity-100':'opacity-0'}`}>
          {/* Progress bar */}
          <div className="mb-3">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all" style={{width:`${pct}%`}} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-white/50 text-[10px]">{pct}% watched</span>
              <span className="text-white/50 text-[10px]">{video.duration}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Left */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {prevV && (
                <button onClick={() => onNext(prevV)} className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition" title="Previous">
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
              )}
              <button onClick={() => seek(-10)} className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition" title="-10s">
                <Rewind className="w-4 h-4 text-white" />
              </button>
              <button onClick={() => seek(10)} className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition" title="+10s">
                <FastForward className="w-4 h-4 text-white" />
              </button>
              {nextV && (
                <button onClick={() => onNext(nextV)} className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl transition" title="Next">
                  <SkipForward className="w-4 h-4 text-white" />
                </button>
              )}

              {/* Speed */}
              <div className="relative">
                <button onClick={() => setShowSpeed(s=>!s)}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold transition"
                >{speed}×</button>
                {showSpeed && (
                  <div className="absolute bottom-10 left-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-xl z-30 min-w-[80px]">
                    {SPEEDS.map(s => (
                      <button key={s} onClick={() => setRate(s)}
                        className={`block w-full text-left px-4 py-2 text-sm transition ${s===speed?'bg-red-500 text-white font-bold':'text-white/70 hover:bg-white/10'}`}
                      >{s}×</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Complete */}
              <button
                onClick={() => { const next = !completed; setCompleted(next); if (next) setPct(100); onToggleCompleted(video.id, completed); }}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${completed?'bg-green-500/20 text-green-400 hover:bg-green-500/30':'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {completed ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                {completed ? 'Unmark' : 'Complete'}
              </button>

              {/* Bookmark */}
              <button
                onClick={() => { setBookmarked(b=>!b); onToggleBookmark(video.id, bookmarked); }}
                className={`p-1.5 sm:p-2 rounded-xl transition ${bookmarked?'bg-amber-500/20 text-amber-400':'bg-white/10 text-white hover:bg-white/20'}`}
                title="Bookmark"
              >
                <Bookmark className={`w-4 h-4 ${bookmarked?'fill-current':''}`} />
              </button>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <a href={`https://www.youtube.com/watch?v=${video.videoUrl}`} target="_blank" rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition">
                <Youtube className="w-3.5 h-3.5" />
                YouTube
                <ExternalLink className="w-3 h-3" />
              </a>
              <button onClick={toggleFs} className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition" title="Fullscreen">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}