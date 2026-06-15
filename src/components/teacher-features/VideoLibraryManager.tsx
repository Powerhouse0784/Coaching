'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Eye, Edit, Trash2, Folder, Grid3x3, LayoutList, Search,
  X, Plus, Clock, FolderPlus, ChevronRight,
  FileVideo, MoreVertical, Globe, Lock, Loader, Image as ImageIcon,
  Youtube, RefreshCw, CheckCircle, AlertCircle, Wifi, ExternalLink,
  Maximize2, List, SkipForward, ChevronLeft, FastForward, Rewind,
  Check, RotateCcw, Bookmark, SkipBack, Link as LinkIcon,
} from 'lucide-react';
import TeacherYouTubeSync from '@/components/teacher-features/TeacherYouTubeSync';

interface VideoFolder {
  id: string; name: string; subject: string; class: string; chapter: string;
  description: string; thumbnail: string; videoCount: number; totalDuration: string;
  totalViews: number; totalWatchTime: string; createdAt: string; isPublic: boolean;
  youtubePlaylistId?: string | null;
  videos: VideoItem[];
}

interface VideoItem {
  id: string; title: string; description: string; duration: string;
  views: number; uniqueViewers: number; totalWatchTime: string;
  uploadDate: string; thumbnail: string; videoUrl: string; size: string; quality: string;
}

declare global { interface Window { YT: any; onYouTubeIframeAPIReady: () => void; } }

// YT IFrame API singleton
let ytPromise: Promise<void> | null = null;
function loadYT(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytPromise) return ytPromise;
  ytPromise = new Promise(resolve => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    if (!document.getElementById('yt-api-teacher')) {
      const s = document.createElement('script');
      s.id = 'yt-api-teacher'; s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });
  return ytPromise;
}

function useDarkMode() {
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dm;
}

export default function VideoLibraryManager() {
  const dm = useDarkMode();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'library' | 'youtube'>('library');
  const [selectedFolder, setSelectedFolder] = useState<VideoFolder | null>(null);
  const [playerVideo, setPlayerVideo] = useState<VideoItem | null>(null);
  const [playerQueue, setPlayerQueue] = useState<VideoItem[]>([]);
  const [editingFolder, setEditingFolder] = useState<VideoFolder | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [folders, setFolders] = useState<VideoFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);

  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const text = dm ? 'text-white' : 'text-gray-900';
  const sub  = dm ? 'text-gray-400' : 'text-gray-500';

  useEffect(() => { fetchFolders(); }, []);
  useEffect(() => {
    const h = () => setFolderMenuOpen(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  // Keep selectedFolder fresh after refetch
  useEffect(() => {
    if (!selectedFolder) return;
    const f = folders.find(x => x.id === selectedFolder.id);
    if (f) setSelectedFolder(f);
  }, [folders]);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/video-folders');
      if (!res.ok) throw new Error('Failed');
      setFolders(await res.json());
    } catch { alert('Failed to load folders.'); }
    finally { setLoading(false); }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this folder and all its videos?')) return;
    try {
      const res = await fetch(`/api/teacher/video-folders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      await fetchFolders(); setSelectedFolder(null);
    } catch (e: any) { alert(`Failed: ${e.message}`); }
  };

  // Called from the YouTube sync tab to jump straight to the synced folder
  const handleViewFolder = (folderId: string) => {
    setActiveTab('library');
    const f = folders.find(x => x.id === folderId);
    if (f) setSelectedFolder(f);
    else fetchFolders().then(() => {
      // folders state will update via effect once fetched; try again shortly
      setTimeout(() => {
        setFolders(curr => {
          const found = curr.find(x => x.id === folderId);
          if (found) setSelectedFolder(found);
          return curr;
        });
      }, 100);
    });
  };

  const totalVideos = folders.reduce((s, f) => s + f.videoCount, 0);
  const totalViews  = folders.reduce((s, f) => s + f.totalViews, 0);
  const youtubeCount = folders.filter(f => f.youtubePlaylistId).length;

  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.chapter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className={`flex items-center justify-center min-h-[400px] ${dm?'bg-gray-900':''}`}>
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-red-100" />
          <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
          <Youtube className="absolute inset-0 m-auto w-5 h-5 text-red-500" />
        </div>
        <p className={`text-sm ${sub}`}>Loading video library…</p>
      </div>
    </div>
  );

  return (
    <div className={`p-3 sm:p-6 lg:p-8 min-h-screen ${dm?'bg-gray-900':''}`}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-bold mb-1 ${text}`}>Video Library Manager</h2>
          <p className={`text-sm ${sub}`}>Manage and view all your YouTube lecture videos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowCreateFolder(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 text-sm">
            <FolderPlus className="w-4 h-4" /> New Folder
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { icon: Folder,   bg: dm?'bg-purple-900/50':'bg-purple-50', color:'text-purple-500', border: dm?'border-purple-800':'border-purple-100', value: folders.length, label:'Total Folders' },
          { icon: Youtube,  bg: dm?'bg-red-900/50':'bg-red-50',       color:'text-red-500',    border: dm?'border-red-800':'border-red-100',       value: youtubeCount,   label:'YouTube Folders' },
          { icon: FileVideo,bg: dm?'bg-blue-900/50':'bg-blue-50',     color:'text-blue-500',   border: dm?'border-blue-800':'border-blue-100',     value: totalVideos,    label:'Total Videos' },
          { icon: Eye,      bg: dm?'bg-green-900/50':'bg-green-50',   color:'text-green-500',  border: dm?'border-green-800':'border-green-100',   value: totalViews.toLocaleString(), label:'Total Views' },
        ].map(({ icon: Icon, bg, color, border, value, label }) => (
          <div key={label} className={`rounded-2xl border-2 p-4 sm:p-5 hover:shadow-lg transition-all ${card}`}>
            <div className={`w-10 h-10 ${bg} border ${border} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold mb-0.5 ${text}`}>{value}</p>
            <p className={`text-xs font-medium ${sub}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`rounded-2xl border-2 p-1.5 mb-5 flex gap-1 ${card}`}>
        {([['library','📁 Video Library'],['youtube','▶️ YouTube Sync']] as [typeof activeTab, string][]).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab===tab ? 'bg-red-500 text-white shadow-lg' : `${sub} ${dm?'hover:bg-gray-700':'hover:bg-gray-50'}`
            }`}>{label}</button>
        ))}
      </div>

      {/* ── YOUTUBE SYNC TAB ── */}
      {activeTab === 'youtube' && <TeacherYouTubeSync darkMode={dm} onViewFolder={handleViewFolder} />}

      {/* ── LIBRARY TAB ── */}
      {activeTab === 'library' && (
        <>
          {/* Search */}
          <div className={`rounded-2xl border-2 p-3 sm:p-4 mb-5 ${card}`}>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search folders, subjects…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 border-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${dm?'bg-gray-700 border-gray-600 text-white placeholder-gray-400':'bg-white border-gray-200 text-gray-900'}`} />
              </div>
              <button onClick={() => setViewMode(v=>v==='grid'?'list':'grid')}
                className={`p-2.5 rounded-xl border-2 transition ${dm?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {viewMode==='grid' ? <LayoutList className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {filteredFolders.length === 0 ? (
            <div className={`rounded-2xl border-2 p-12 text-center ${card}`}>
              <Folder className={`w-14 h-14 mx-auto mb-4 ${dm?'text-gray-600':'text-gray-400'}`} />
              <h3 className={`text-lg font-bold mb-2 ${text}`}>No folders yet</h3>
              <p className={`text-sm mb-4 ${sub}`}>Sync your YouTube channel to auto-import videos, or create a folder manually</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button onClick={() => setActiveTab('youtube')} className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-semibold text-sm flex items-center gap-2">
                  <Youtube className="w-4 h-4" /> Sync YouTube
                </button>
                <button onClick={() => setShowCreateFolder(true)} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold text-sm flex items-center gap-2">
                  <FolderPlus className="w-4 h-4" /> Create Folder
                </button>
              </div>
            </div>
          ) : (
            <div className={viewMode==='grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6' : 'space-y-3'}>
              {filteredFolders.map(folder => (
                <div key={folder.id} className={`rounded-2xl border-2 overflow-hidden hover:shadow-xl transition-all group ${card}`}>
                  {/* Thumbnail */}
                  <div onClick={() => setSelectedFolder(folder)} className="h-40 sm:h-44 relative cursor-pointer overflow-hidden">
                    {folder.thumbnail ? (
                      <img src={folder.thumbnail} alt={folder.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 flex items-center justify-center">
                        {folder.youtubePlaylistId ? <Youtube className="w-16 h-16 text-white opacity-70" /> : <Folder className="w-16 h-16 text-white opacity-70" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${dm?'bg-red-900/80 text-red-300':'bg-red-500 text-white'}`}>{folder.subject}</span>
                      <div className="flex items-center gap-1.5">
                        {folder.youtubePlaylistId && (
                          <span className="px-2 py-1 bg-red-500/90 rounded-full flex items-center gap-1 text-white text-[10px] font-bold">
                            <Youtube className="w-2.5 h-2.5" /> YT
                          </span>
                        )}
                        <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-semibold">{folder.videoCount} videos</span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className={`font-bold text-base mb-1 truncate ${text}`}>{folder.name}</h3>
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${dm?'bg-blue-900 text-blue-300':'bg-blue-100 text-blue-700'}`}>{folder.class}</span>
                          {folder.isPublic
                            ? <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${dm?'bg-green-900 text-green-300':'bg-green-100 text-green-700'}`}><Globe className="w-3 h-3" />Public</span>
                            : <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${dm?'bg-orange-900 text-orange-300':'bg-orange-100 text-orange-700'}`}><Lock className="w-3 h-3" />Private</span>}
                        </div>
                        <p className={`text-xs line-clamp-1 ${sub}`}>{folder.chapter}</p>
                      </div>
                      {/* Kebab */}
                      <div className="relative flex-shrink-0" onClick={e=>e.stopPropagation()}>
                        <button onClick={() => setFolderMenuOpen(folderMenuOpen===folder.id ? null : folder.id)}
                          className={`p-2 rounded-lg transition ${dm?'hover:bg-gray-700':'hover:bg-gray-100'}`}>
                          <MoreVertical className={`w-4 h-4 ${sub}`} />
                        </button>
                        {folderMenuOpen===folder.id && (
                          <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-xl border z-20 overflow-hidden ${dm?'bg-gray-800 border-gray-700':'bg-white border-gray-200'}`}>
                            <button onClick={() => { setSelectedFolder(folder); setFolderMenuOpen(null); }}
                              className={`w-full px-4 py-2.5 text-left flex items-center gap-2 text-sm transition ${dm?`hover:bg-gray-700 ${text}`:'hover:bg-gray-50 text-gray-700'}`}>
                              <Eye className="w-4 h-4" /> View Videos
                            </button>
                            <button onClick={() => { setEditingFolder(folder); setFolderMenuOpen(null); }}
                              className={`w-full px-4 py-2.5 text-left flex items-center gap-2 text-sm transition ${dm?`hover:bg-gray-700 ${text}`:'hover:bg-gray-50 text-gray-700'}`}>
                              <Edit className="w-4 h-4" /> Edit Folder
                            </button>
                            <button onClick={() => { handleDeleteFolder(folder.id); setFolderMenuOpen(null); }}
                              className={`w-full px-4 py-2.5 text-left flex items-center gap-2 text-sm text-red-500 transition ${dm?'hover:bg-red-900/30':'hover:bg-red-50'}`}>
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label:'Videos', value: folder.videoCount },
                        { label:'Duration', value: folder.totalDuration },
                        { label:'Views', value: folder.totalViews },
                      ].map(({label,value}) => (
                        <div key={label} className={`rounded-xl p-2 text-center ${dm?'bg-gray-700/60':'bg-gray-50'}`}>
                          <p className={`text-[10px] mb-0.5 ${sub}`}>{label}</p>
                          <p className={`text-xs font-bold truncate ${text}`}>{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedFolder(folder)}
                        className="flex-1 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition font-semibold text-xs flex items-center justify-center gap-1.5">
                        <Play className="w-3.5 h-3.5" /> View Videos
                      </button>
                      <button onClick={() => setEditingFolder(folder)}
                        className={`px-3 py-2 border-2 rounded-xl transition ${dm?'border-gray-600 hover:bg-gray-700':'border-gray-200 hover:bg-gray-50'}`}>
                        <Edit className={`w-3.5 h-3.5 ${sub}`} />
                      </button>
                      <button onClick={() => handleDeleteFolder(folder.id)}
                        className={`px-3 py-2 border-2 rounded-xl transition ${dm?'border-red-800 hover:bg-red-900/30':'border-red-200 hover:bg-red-50'}`}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>

                    <div className={`mt-3 pt-3 border-t-2 flex items-center justify-between text-xs ${sub} ${dm?'border-gray-700':'border-gray-100'}`}>
                      <span>Created {new Date(folder.createdAt).toLocaleDateString()}</span>
                      <span>Watch: {folder.totalWatchTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {selectedFolder && (
        <FolderVideosModal
          folder={selectedFolder} dm={dm}
          onClose={() => setSelectedFolder(null)}
          onPlay={(v) => { setPlayerVideo(v); setPlayerQueue(selectedFolder.videos); }}
          onDelete={handleDeleteFolder}
        />
      )}
      {playerVideo && (
        <YouTubePlayerModal
          video={playerVideo} queue={playerQueue} dm={dm}
          onClose={() => { setPlayerVideo(null); fetchFolders(); }}
          onNext={v => setPlayerVideo(v)}
        />
      )}
      {showCreateFolder && (
        <FolderFormModal dm={dm} mode="create" onClose={() => setShowCreateFolder(false)} onSave={async (data) => {
          const res = await fetch('/api/teacher/video-folders', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
          if (!res.ok) throw new Error((await res.json()).error);
          await fetchFolders(); setShowCreateFolder(false);
        }} />
      )}
      {editingFolder && (
        <FolderFormModal dm={dm} mode="edit" folder={editingFolder} onClose={() => setEditingFolder(null)} onSave={async (data) => {
          const res = await fetch(`/api/teacher/video-folders/${editingFolder.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
          if (!res.ok) throw new Error((await res.json()).error);
          await fetchFolders(); setEditingFolder(null);
        }} />
      )}
    </div>
  );
}

// ── FolderVideosModal ─────────────────────────────────────────────────────────
function FolderVideosModal({ folder, dm, onClose, onPlay, onDelete }: { folder: VideoFolder; dm: boolean; onClose: () => void; onPlay: (v: VideoItem) => void; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const text = dm?'text-white':'text-gray-900';
  const sub  = dm?'text-gray-400':'text-gray-500';
  const card = dm?'bg-gray-800 border-gray-700':'bg-white border-gray-200';
  const filtered = folder.videos.filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl ${dm?'bg-gray-900':'bg-white'}`}>
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b-2 flex-shrink-0 ${dm?'border-gray-700':'border-gray-100'}`}>
          <div className="flex items-start gap-4">
            {folder.thumbnail && (
              <img src={folder.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 hidden sm:block" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-lg sm:text-xl font-bold line-clamp-1 ${text}`}>{folder.name}</h3>
                {folder.youtubePlaylistId && <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 rounded-full text-white text-[10px] font-bold flex-shrink-0"><Youtube className="w-3 h-3" />YT</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${dm?'bg-red-900/60 text-red-300':'bg-red-100 text-red-700'}`}>{folder.subject}</span>
                <span className={`text-xs ${sub}`}>• {folder.chapter}</span>
                <span className={`text-xs ${sub}`}>• {folder.videoCount} videos • {folder.totalDuration}</span>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl transition flex-shrink-0 ${dm?'hover:bg-gray-700':'hover:bg-gray-100'}`}>
              <X className={`w-5 h-5 ${sub}`} />
            </button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search videos…" value={search} onChange={e=>setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border-2 text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent ${dm?'bg-gray-700 border-gray-600 text-white placeholder-gray-400':'bg-gray-50 border-gray-200 text-gray-900'}`} />
          </div>
        </div>

        {/* Videos */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6 space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-10">
              <FileVideo className={`w-12 h-12 mx-auto mb-3 ${dm?'text-gray-600':'text-gray-300'}`} />
              <p className={`text-sm font-semibold mb-1 ${text}`}>No videos found</p>
              {folder.videoCount === 0 && folder.youtubePlaylistId && (
                <p className={`text-xs ${sub}`}>This folder is linked to YouTube — go to the "YouTube Sync" tab and click Sync Now.</p>
              )}
            </div>
          )}
          {filtered.map((video, idx) => (
            <div key={video.id} className={`rounded-xl border-2 overflow-hidden hover:shadow-md transition-all ${card}`}>
              <div className="flex items-center gap-3 p-3 sm:p-4">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${dm?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-500'}`}>{idx+1}</span>

                {/* Thumb */}
                <div onClick={() => onPlay(video)} className="w-28 h-[4.5rem] rounded-lg flex-shrink-0 relative cursor-pointer overflow-hidden group">
                  <img src={video.thumbnail || `https://img.youtube.com/vi/${video.videoUrl}/hqdefault.jpg`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-red-600 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-[10px] rounded">{video.duration}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-xs sm:text-sm line-clamp-2 mb-1 ${text}`}>{video.title}</p>
                  <div className={`flex flex-wrap items-center gap-2 text-[10px] sm:text-xs ${sub}`}>
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {video.views.toLocaleString()}</span>
                    <span>· {video.uniqueViewers} unique</span>
                    <span>· {video.duration}</span>
                    <span>· {video.totalWatchTime} watched</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <a href={`https://www.youtube.com/watch?v=${video.videoUrl}`} target="_blank" rel="noopener noreferrer"
                    className={`p-1.5 rounded-lg transition ${dm?'hover:bg-gray-700':'hover:bg-gray-100'}`} title="YouTube">
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

// ── YouTube Player (Teacher) ──────────────────────────────────────────────────
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function YouTubePlayerModal({ video, queue, dm, onClose, onNext }: { video: VideoItem; queue: VideoItem[]; dm: boolean; onClose: () => void; onNext: (v: VideoItem) => void }) {
  const elRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  const cidx = queue.findIndex(v => v.id === video.id);
  const nextV = cidx >= 0 && cidx < queue.length-1 ? queue[cidx+1] : null;
  const prevV = cidx > 0 ? queue[cidx-1] : null;

  const resetHide = () => {
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
          onReady() { setReady(true); },
          onStateChange(e: any) {
            if (e.data === window.YT.PlayerState.PLAYING) resetHide();
            else { setShowControls(true); if (hideTimer.current) clearTimeout(hideTimer.current); }
          },
        },
      });
    });
    return () => {
      dead = true;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      try { playerRef.current?.destroy?.(); } catch {}
    };
  }, [video.videoUrl]);

  const setRate = (s: number) => { setSpeed(s); setShowSpeed(false); try { playerRef.current?.setPlaybackRate(s); } catch {} };
  const seek = (d: number) => { try { playerRef.current?.seekTo((playerRef.current?.getCurrentTime()??0)+d, true); } catch {} resetHide(); };

  return (
    <div className="fixed inset-0 bg-black z-[100]" onMouseMove={resetHide}>
      <div ref={containerRef} className="relative w-full h-full flex flex-col">

        {/* Top bar */}
        <div className={`absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/90 to-transparent p-3 sm:p-4 transition-opacity duration-300 ${showControls?'opacity-100':'opacity-0'}`}>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition flex-shrink-0">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">{video.title}</h3>
              {nextV && <p className="text-xs text-white/50 line-clamp-1">Up next: {nextV.title}</p>}
            </div>
            <button onClick={() => setShowQueue(!showQueue)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition flex-shrink-0">
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

        {/* Queue sidebar */}
        {showQueue && (
          <div className="absolute top-0 right-0 bottom-0 w-72 sm:w-80 bg-gray-950/95 backdrop-blur-md z-20 flex flex-col border-l border-white/10">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <p className="text-white font-bold text-sm">Queue · {queue.length} videos</p>
              <button onClick={() => setShowQueue(false)} className="p-1.5 rounded-lg hover:bg-white/10"><X className="w-4 h-4 text-white/70" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {queue.map((v, i) => (
                <button key={v.id} onClick={() => { onNext(v); setShowQueue(false); }}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition ${v.id===video.id?'bg-red-500/20 border border-red-500/40':'hover:bg-white/10'}`}>
                  <span className="text-white/30 text-xs w-4 text-center flex-shrink-0">{i+1}</span>
                  <img src={v.thumbnail || `https://img.youtube.com/vi/${v.videoUrl}/hqdefault.jpg`} alt="" className="w-14 h-9 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold line-clamp-2 ${v.id===video.id?'text-red-300':'text-white/80'}`}>{v.title}</p>
                    <p className="text-white/30 text-[10px] mt-0.5">{v.duration}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className={`absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/95 to-transparent p-3 sm:p-4 transition-opacity duration-300 ${showControls?'opacity-100':'opacity-0'}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 sm:gap-1.5">
              {prevV && <button onClick={() => onNext(prevV)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition"><ChevronLeft className="w-4 h-4 text-white" /></button>}
              <button onClick={() => seek(-10)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition"><Rewind className="w-4 h-4 text-white" /></button>
              <button onClick={() => seek(10)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition"><FastForward className="w-4 h-4 text-white" /></button>
              {nextV && <button onClick={() => onNext(nextV)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition"><SkipForward className="w-4 h-4 text-white" /></button>}

              <div className="relative">
                <button onClick={() => setShowSpeed(s=>!s)} className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold transition">{speed}×</button>
                {showSpeed && (
                  <div className="absolute bottom-10 left-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-xl z-30 min-w-[80px]">
                    {SPEEDS.map(s => (
                      <button key={s} onClick={() => setRate(s)}
                        className={`block w-full text-left px-4 py-2 text-sm transition ${s===speed?'bg-red-500 text-white font-bold':'text-white/70 hover:bg-white/10'}`}>{s}×</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <a href={`https://www.youtube.com/watch?v=${video.videoUrl}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl hover:bg-red-500/30 transition">
                <Youtube className="w-3.5 h-3.5" /> YouTube <ExternalLink className="w-3 h-3" />
              </a>
              <button onClick={() => { const c=containerRef.current; if(!document.fullscreenElement) c?.requestFullscreen(); else document.exitFullscreen(); }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FolderFormModal ───────────────────────────────────────────────────────────
// No UploadThing — thumbnail is just a pasted image URL (e.g. a YouTube
// thumbnail link like https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg,
// or any other hosted image). youtubePlaylistId is optional/advanced.
function FolderFormModal({ dm, mode, folder, onClose, onSave }: { dm: boolean; mode:'create'|'edit'; folder?: VideoFolder; onClose: () => void; onSave: (data: any) => Promise<void> }) {
  const isEdit = mode==='edit';
  const text = dm?'text-white':'text-gray-900';
  const sub  = dm?'text-gray-400':'text-gray-500';
  const [form, setForm] = useState({
    name: folder?.name || '',
    subject: folder?.subject || '',
    class: folder?.class || '',
    chapter: folder?.chapter || '',
    description: folder?.description || '',
    isPublic: folder?.isPublic ?? true,
    thumbnailUrl: folder?.thumbnail || '',
    youtubePlaylistId: folder?.youtubePlaylistId || '',
  });
  const [busy, setBusy] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const set = (k: string) => (v: any) => setForm(p=>({...p,[k]:v}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name||!form.subject||!form.class||!form.chapter) { alert('Fill all required fields'); return; }
    setBusy(true);
    try {
      await onSave({ ...form, youtubePlaylistId: form.youtubePlaylistId.trim() || null });
    } catch (e: any) { alert(e.message); }
    finally { setBusy(false); }
  };

  const inp = `w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50 ${dm?'bg-gray-700 border-gray-600 text-white placeholder-gray-400':'bg-white border-gray-300 text-gray-900'}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[95vh] flex flex-col shadow-2xl ${dm?'bg-gray-900':'bg-white'}`}>
        <div className={`p-4 sm:p-5 border-b-2 flex items-center justify-between flex-shrink-0 ${dm?'border-gray-700 bg-gray-800':'border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50'}`}>
          <div>
            <h3 className={`text-lg font-bold ${text}`}>{isEdit?'Edit Folder':'Create New Folder'}</h3>
            <p className={`text-xs ${sub}`}>{isEdit?'Update folder details':'Fill in details for your new folder'}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition ${dm?'hover:bg-gray-700':'hover:bg-gray-100'}`}><X className={`w-5 h-5 ${sub}`} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {[
              { label:'Folder Name *', key:'name', placeholder:'e.g., Wave Optics Complete' },
              { label:'Subject *', key:'subject', placeholder:'e.g., Physics, Chemistry' },
              { label:'Class *', key:'class', placeholder:'e.g., 12th, JEE, NEET' },
              { label:'Chapter *', key:'chapter', placeholder:'e.g., Chapter 10 - Wave Optics' },
            ].map(({label,key,placeholder}) => (
              <div key={key}>
                <label className={`block text-xs font-semibold mb-1.5 ${sub}`}>{label}</label>
                <input type="text" value={(form as any)[key]} onChange={e=>set(key)(e.target.value)} placeholder={placeholder} disabled={busy} className={inp} />
              </div>
            ))}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${sub}`}>Description</label>
              <textarea value={form.description} onChange={e=>set('description')(e.target.value)} rows={3} disabled={busy} className={`${inp} resize-none`} placeholder="Brief description…" />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${sub}`}>Thumbnail Image URL</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={e => { set('thumbnailUrl')(e.target.value); setThumbError(false); }}
                  placeholder="https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg"
                  disabled={busy}
                  className={`${inp} pl-9`}
                />
              </div>
              <p className={`text-xs mt-1 ${sub}`}>
                Paste any image URL — e.g. a YouTube thumbnail link. Leave blank to auto-use the first video's thumbnail.
              </p>
              {form.thumbnailUrl && (
                <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border-2 border-dashed">
                  {!thumbError ? (
                    <img
                      src={form.thumbnailUrl}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      onError={() => setThumbError(true)}
                    />
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center ${dm?'bg-gray-800':'bg-gray-50'}`}>
                      <ImageIcon className={`w-6 h-6 mb-1 ${dm?'text-gray-500':'text-gray-400'}`} />
                      <p className={`text-xs ${sub}`}>Couldn't load this image</p>
                    </div>
                  )}
                  <button type="button" onClick={()=>{set('thumbnailUrl')(''); setThumbError(false);}} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* YouTube playlist (advanced) */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${sub}`}>
                YouTube Playlist ID <span className="font-normal opacity-70">(optional, advanced)</span>
              </label>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                <input
                  type="text"
                  value={form.youtubePlaylistId}
                  onChange={e=>set('youtubePlaylistId')(e.target.value)}
                  placeholder="e.g. PLxxxxxxxxxxxxxxxxxxxx"
                  disabled={busy}
                  className={`${inp} pl-9`}
                />
              </div>
              <p className={`text-xs mt-1 ${sub}`}>
                From a playlist URL: youtube.com/playlist?list=<strong>THIS_PART</strong>. Leave blank for a regular manual folder.
              </p>
            </div>

            {/* Visibility */}
            <div>
              <label className={`block text-xs font-semibold mb-2 ${sub}`}>Visibility</label>
              <div className="grid grid-cols-2 gap-2">
                {[{val:true,icon:Globe,label:'Public',color:'text-green-500'},{val:false,icon:Lock,label:'Private',color:'text-orange-500'}].map(({val,icon:Icon,label,color})=>(
                  <label key={label} className={`flex items-center gap-2 cursor-pointer p-3 border-2 rounded-xl transition ${form.isPublic===val?'border-purple-500 bg-purple-50 dark:bg-purple-900/20':dm?'border-gray-700 hover:border-purple-400':'border-gray-200 hover:border-purple-400'}`}>
                    <input type="radio" checked={form.isPublic===val} onChange={()=>set('isPublic')(val)} className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                    <span className={`text-xs font-semibold ${text}`}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={`p-4 border-t-2 flex gap-2 flex-shrink-0 ${dm?'border-gray-700 bg-gray-800':'border-gray-200 bg-gray-50'}`}>
            <button type="button" onClick={onClose} disabled={busy}
              className={`flex-1 py-2.5 border-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition ${dm?'border-gray-600 text-gray-300 hover:bg-gray-700':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Cancel</button>
            <button type="submit" disabled={busy}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition">
              {busy ? <><Loader className="w-4 h-4 animate-spin" />{isEdit?'Updating…':'Creating…'}</> : isEdit?'Update Folder':'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}