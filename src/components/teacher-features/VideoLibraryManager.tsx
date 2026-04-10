'use client';

import React, { useState, useEffect, useRef } from 'react';
import { uploadVideoToPuter, getVideoDuration, formatFileSize } from '@/lib/puter';
import {
  Upload, Play, Eye, Edit, Trash2, Folder, Grid3x3, LayoutList, Search,
  Download, X, Plus, Video, Clock, Users, FolderPlus, ChevronRight,
  FileVideo, MoreVertical, Globe, Lock, Pause, Volume2, VolumeX,
  Maximize, Minimize, Settings, SkipForward, SkipBack, Loader, Image as ImageIcon
} from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';

interface VideoFolder {
  id: string;
  name: string;
  subject: string;
  class: string;
  chapter: string;
  description: string;
  thumbnail: string;
  videoCount: number;
  totalDuration: string;
  totalViews: number;
  totalWatchTime: string;
  createdAt: string;
  isPublic: boolean;
  videos: VideoItem[];
}

interface VideoItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  views: number;
  uniqueViewers: number;
  totalWatchTime: string;
  uploadDate: string;
  thumbnail: string;
  videoUrl: string;
  size: string;
  quality: string;
}

// ── Dark mode hook ────────────────────────────────────────────────────────────
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

// ── Shared style helpers ──────────────────────────────────────────────────────
function useS(dm: boolean) {
  return {
    page:   dm ? 'bg-gray-900'  : '',
    card:   `rounded-xl border ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`,
    card2:  `rounded-xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`,
    input:  `w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm sm:text-base ${
              dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
            }`,
    label:  `block text-xs sm:text-sm font-medium mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`,
    tp:     dm ? 'text-white'    : 'text-gray-900',
    tm:     dm ? 'text-gray-400' : 'text-gray-600',
    ts:     dm ? 'text-gray-500' : 'text-gray-500',
    chip:   dm ? 'bg-gray-700'   : 'bg-gray-50',
    modal:  `rounded-t-2xl sm:rounded-2xl w-full shadow-2xl flex flex-col ${dm ? 'bg-gray-900' : 'bg-white'}`,
    mhdr:   `p-4 sm:p-6 border-b-2 flex items-center justify-between flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
export default function VideoLibraryManager() {
  const dm = useDarkMode();
  const s  = useS(dm);

  const [viewMode,               setViewMode]               = useState<'grid' | 'list'>('grid');
  const [showCreateFolderModal,  setShowCreateFolderModal]  = useState(false);
  const [showUploadVideoModal,   setShowUploadVideoModal]   = useState(false);
  const [showEditFolderModal,    setShowEditFolderModal]    = useState(false);
  const [showEditVideoModal,     setShowEditVideoModal]     = useState(false);
  const [showVideoPlayer,        setShowVideoPlayer]        = useState(false);
  const [selectedFolder,         setSelectedFolder]         = useState<VideoFolder | null>(null);
  const [selectedVideo,          setSelectedVideo]          = useState<VideoItem | null>(null);
  const [editingFolder,          setEditingFolder]          = useState<VideoFolder | null>(null);
  const [editingVideo,           setEditingVideo]           = useState<VideoItem | null>(null);
  const [searchQuery,            setSearchQuery]            = useState('');
  const [folders,                setFolders]                = useState<VideoFolder[]>([]);
  const [loading,                setLoading]                = useState(true);
  const [uploading,              setUploading]              = useState(false);
  const [folderMenuOpen,         setFolderMenuOpen]         = useState<string | null>(null);

  useEffect(() => { fetchFolders(); }, []);

  // Close menus on outside click
  useEffect(() => {
    const h = () => setFolderMenuOpen(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/video-folders');
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setFolders(await res.json());
    } catch (e) { console.error(e); alert('Failed to load folders. Please try again.'); }
    finally { setLoading(false); }
  };

  const totalVideos = folders.reduce((a, f) => a + f.videoCount, 0);
  const totalViews  = folders.reduce((a, f) => a + f.totalViews,  0);
  const totalWatchMin = folders.reduce((a, f) => {
    if (!f.totalWatchTime) return a;
    const h = f.totalWatchTime.match(/(\d+)h/);
    const m = f.totalWatchTime.match(/(\d+)m/);
    return a + (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
  }, 0);

  const stats = [
    { label: 'Total Folders', value: folders.length, icon: Folder,    color: { bg: dm ? 'bg-purple-900' : 'bg-purple-100', text: dm ? 'text-purple-300' : 'text-purple-600' } },
    { label: 'Total Videos',  value: totalVideos,     icon: FileVideo, color: { bg: dm ? 'bg-blue-900'   : 'bg-blue-100',   text: dm ? 'text-blue-300'   : 'text-blue-600'   } },
    { label: 'Total Views',   value: totalViews.toLocaleString(), icon: Eye, color: { bg: dm ? 'bg-green-900' : 'bg-green-100', text: dm ? 'text-green-300' : 'text-green-600' } },
    { label: 'Watch Time',    value: `${Math.floor(totalWatchMin/60)}h ${totalWatchMin%60}m`, icon: Clock, color: { bg: dm ? 'bg-orange-900' : 'bg-orange-100', text: dm ? 'text-orange-300' : 'text-orange-600' } },
  ];

  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.chapter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateFolder = async (data: any) => {
    try {
      const res = await fetch('/api/teacher/video-folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      await fetchFolders(); setShowCreateFolderModal(false); alert('Folder created successfully!');
    } catch (e) { alert(`Failed to create folder: ${e instanceof Error ? e.message : 'Please try again.'}`); }
  };

  const handleEditFolder = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/teacher/video-folders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      await fetchFolders(); setShowEditFolderModal(false); setEditingFolder(null); alert('Folder updated successfully!');
    } catch (e) { alert(`Failed to update folder: ${e instanceof Error ? e.message : 'Please try again.'}`); }
  };

  const handleUploadVideo = async (data: any) => {
    try {
      setUploading(true);
      const res = await fetch('/api/teacher/videos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      await fetchFolders(); setShowUploadVideoModal(false); alert('Video uploaded successfully!');
    } catch (e) { alert(`Failed to upload video: ${e instanceof Error ? e.message : 'Please try again.'}`); }
    finally { setUploading(false); }
  };

  const handleEditVideo = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/teacher/videos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      await fetchFolders(); setShowEditVideoModal(false); setEditingVideo(null); alert('Video updated successfully!');
    } catch (e) { alert(`Failed to update video: ${e instanceof Error ? e.message : 'Please try again.'}`); }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this folder and all its videos?')) return;
    try {
      const res = await fetch(`/api/teacher/video-folders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      await fetchFolders(); setSelectedFolder(null); alert('Folder deleted successfully!');
    } catch (e) { alert(`Failed to delete folder: ${e instanceof Error ? e.message : 'Unknown error'}`); }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      const res = await fetch(`/api/teacher/videos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      await fetchFolders(); alert('Video deleted successfully!');
    } catch (e) { alert(`Failed to delete video: ${e instanceof Error ? e.message : 'Please try again.'}`); }
  };

  const handleDownloadVideo = async (video: VideoItem) => {
    try {
      const res = await fetch(video.videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${video.title}.mp4`;
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { alert('Failed to download video.'); }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${s.page}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className={`text-sm sm:text-base ${s.tm}`}>Loading video library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 sm:p-6 lg:p-8 min-h-screen transition-colors ${s.page}`}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-bold mb-1 ${s.tp}`}>Video Library Manager</h2>
          <p className={`text-sm sm:text-base ${s.tm}`}>Organize and manage your lecture videos by folders</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button onClick={() => setShowCreateFolderModal(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base">
            <FolderPlus className="w-4 h-4 sm:w-5 sm:h-5" /> Create Folder
          </button>
          <button onClick={() => setShowUploadVideoModal(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" /> Upload Video
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <div key={i} className={`${s.card} p-4 sm:p-5 lg:p-6 hover:shadow-lg transition-shadow`}>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color.bg} rounded-xl flex items-center justify-center mb-3 sm:mb-4`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color.text}`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold mb-0.5 ${s.tp}`}>{value}</p>
            <p className={`text-xs sm:text-sm ${s.tm}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Search + View toggle */}
      <div className={`${s.card} p-3 sm:p-4 mb-5 sm:mb-6`}>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input type="text" placeholder="Search folders, subjects..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm ${
                dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
              }`} />
          </div>
          <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            className={`p-2.5 sm:p-3 rounded-xl transition flex-shrink-0 ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
            {viewMode === 'grid' ? <LayoutList className="w-4 h-4 sm:w-5 sm:h-5" /> : <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Folders grid/list */}
      {filteredFolders.length === 0 ? (
        <div className={`${s.card2} p-10 sm:p-12 text-center`}>
          <Folder className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg sm:text-xl font-bold mb-2 ${s.tp}`}>No folders found</h3>
          <p className={`text-sm mb-5 ${s.tm}`}>Create your first folder to organize lecture videos</p>
          <button onClick={() => setShowCreateFolderModal(true)}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold text-sm sm:text-base">
            Create Folder
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'
          : 'space-y-3 sm:space-y-4'}>
          {filteredFolders.map(folder => (
            <div key={folder.id} className={`${s.card2} overflow-hidden hover:shadow-xl transition-all group`}>
              {/* Thumbnail */}
              <div onClick={() => setSelectedFolder(folder)}
                className="h-40 sm:h-48 relative cursor-pointer overflow-hidden">
                {folder.thumbnail?.trim()
                  ? <img src={folder.thumbnail} alt={folder.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Folder className="w-16 h-16 sm:w-20 sm:h-20 text-white opacity-80" />
                    </div>}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold">{folder.videoCount} videos</span>
                  {folder.isPublic
                    ? <div className="px-2 py-0.5 bg-green-500/90 rounded-full flex items-center gap-1"><Globe className="w-3 h-3 text-white" /><span className="text-white text-xs font-semibold">Public</span></div>
                    : <div className="px-2 py-0.5 bg-orange-500/90 rounded-full flex items-center gap-1"><Lock className="w-3 h-3 text-white" /><span className="text-white text-xs font-semibold">Private</span></div>}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Play className="w-12 h-12 sm:w-16 sm:h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className={`font-bold text-base sm:text-lg mb-1 truncate ${s.tp}`}>{folder.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{folder.subject}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${dm ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>{folder.class}</span>
                      {folder.isPublic
                        ? <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${dm ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}><Globe className="w-3 h-3" />Public</span>
                        : <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${dm ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700'}`}><Lock className="w-3 h-3" />Private</span>}
                    </div>
                    <p className={`text-xs sm:text-sm mb-1 ${s.tm}`}>{folder.chapter}</p>
                    <p className={`text-xs sm:text-sm line-clamp-2 ${s.ts}`}>{folder.description}</p>
                  </div>
                  {/* Kebab menu */}
                  <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setFolderMenuOpen(folderMenuOpen === folder.id ? null : folder.id)}
                      className={`p-2 rounded-lg transition ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <MoreVertical className={`w-4 h-4 sm:w-5 sm:h-5 ${s.ts}`} />
                    </button>
                    {folderMenuOpen === folder.id && (
                      <div className={`absolute right-0 mt-2 w-44 sm:w-48 rounded-xl shadow-xl border z-20 overflow-hidden ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        {[
                          { icon: Edit,   label: 'Edit Folder',   action: () => { setEditingFolder(folder); setShowEditFolderModal(true); setFolderMenuOpen(null); }, color: '' },
                          { icon: Eye,    label: 'View Videos',   action: () => { setSelectedFolder(folder); setFolderMenuOpen(null); }, color: '' },
                          { icon: Trash2, label: 'Delete Folder', action: () => { handleDeleteFolder(folder.id); setFolderMenuOpen(null); }, color: 'text-red-500' },
                        ].map(({ icon: Icon, label, action, color }) => (
                          <button key={label} onClick={action}
                            className={`w-full px-4 py-2.5 text-left flex items-center gap-2 text-xs sm:text-sm transition ${color} ${
                              color ? (dm ? 'hover:bg-red-900/30' : 'hover:bg-red-50') : (dm ? `hover:bg-gray-700 ${s.tp}` : 'hover:bg-gray-50 text-gray-700')
                            }`}>
                            <Icon className="w-4 h-4" />{label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats chips */}
                <div className={`grid grid-cols-3 gap-2 mb-4 pb-4 border-b ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
                  {[
                    { label: 'Videos',   value: folder.videoCount    },
                    { label: 'Duration', value: folder.totalDuration },
                    { label: 'Views',    value: folder.totalViews    },
                  ].map(({ label, value }) => (
                    <div key={label} className={`${s.chip} rounded-lg p-2 text-center`}>
                      <p className={`text-xs ${s.ts} mb-0.5`}>{label}</p>
                      <p className={`text-sm sm:text-base font-bold ${s.tp}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button onClick={() => setSelectedFolder(folder)}
                    className="flex-1 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> View Videos
                  </button>
                  <button onClick={() => { setEditingFolder(folder); setShowEditFolderModal(true); }}
                    className={`px-3 sm:px-4 py-2 border rounded-xl transition ${dm ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <Edit className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.tm}`} />
                  </button>
                  <button onClick={() => handleDeleteFolder(folder.id)}
                    className={`px-3 sm:px-4 py-2 border rounded-xl transition ${dm ? 'border-red-800 hover:bg-red-900/30' : 'border-red-300 hover:bg-red-50'}`}>
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                  </button>
                </div>

                <div className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${s.ts} ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
                  <span>Created {new Date(folder.createdAt).toLocaleDateString()}</span>
                  <span>Watch: {folder.totalWatchTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedFolder && (
        <FolderDetailsModal folder={selectedFolder} darkMode={dm}
          onClose={() => setSelectedFolder(null)}
          onUploadVideo={() => setShowUploadVideoModal(true)}
          onPlayVideo={(v: VideoItem) => { setSelectedVideo(v); setShowVideoPlayer(true); }}
          onEditVideo={(v: VideoItem) => { setEditingVideo(v); setShowEditVideoModal(true); }}
          onDeleteVideo={handleDeleteVideo}
          onDownloadVideo={handleDownloadVideo} />
      )}
      {showVideoPlayer && selectedVideo && (
        <VideoPlayerModal video={selectedVideo} onClose={() => { setShowVideoPlayer(false); setSelectedVideo(null); }} onDownload={handleDownloadVideo} />
      )}
      {showCreateFolderModal && (
        <CreateFolderModal darkMode={dm} onClose={() => setShowCreateFolderModal(false)} onCreate={handleCreateFolder} />
      )}
      {showEditFolderModal && editingFolder && (
        <EditFolderModal folder={editingFolder} darkMode={dm}
          onClose={() => { setShowEditFolderModal(false); setEditingFolder(null); }}
          onUpdate={handleEditFolder} />
      )}
      {showUploadVideoModal && (
        <UploadVideoModal folders={folders} selectedFolder={selectedFolder} darkMode={dm}
          onClose={() => setShowUploadVideoModal(false)}
          onUpload={handleUploadVideo} uploading={uploading} />
      )}
      {showEditVideoModal && editingVideo && (
        <EditVideoModal video={editingVideo} darkMode={dm}
          onClose={() => { setShowEditVideoModal(false); setEditingVideo(null); }}
          onUpdate={handleEditVideo} />
      )}
    </div>
  );
}

// ─── Shared modal wrapper (slides up on mobile) ───────────────────────────────
function ModalWrap({ children, dm, maxW = 'sm:max-w-2xl' }: { children: React.ReactNode; dm: boolean; maxW?: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`rounded-t-2xl sm:rounded-2xl w-full ${maxW} max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl ${dm ? 'bg-gray-900' : 'bg-white'}`}>
        {children}
      </div>
    </div>
  );
}

// ─── Shared input helpers ─────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder = '', required = false, type = 'text', disabled = false, dm }: any) {
  const cls = `w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm sm:text-base ${
    dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
  } disabled:opacity-50`;
  return (
    <div>
      <label className={`block text-xs sm:text-sm font-medium mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}{required && ' *'}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} className={cls} />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder = '', rows = 3, disabled = false, dm }: any) {
  const cls = `w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm sm:text-base resize-none ${
    dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
  } disabled:opacity-50`;
  return (
    <div>
      <label className={`block text-xs sm:text-sm font-medium mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} disabled={disabled} className={cls} />
    </div>
  );
}

// ─── SimpleImageUpload ────────────────────────────────────────────────────────
function SimpleImageUpload({ onUpload, currentUrl, label, endpoint = 'folderThumbnail', accent = 'purple', dm }: any) {
  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => { if (res?.[0]) onUpload(res[0].url); },
    onUploadError: (err: Error) => alert(`Upload failed: ${err.message}`),
  });
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await startUpload([file]);
  };
  if (currentUrl) {
    return (
      <div className="relative">
        <img src={currentUrl} alt={label} className="w-full h-40 sm:h-48 object-cover rounded-xl border" />
        <button type="button" onClick={() => onUpload('')}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
  return (
    <div className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center transition ${dm ? 'border-gray-600 hover:border-purple-500' : 'border-gray-300 hover:border-purple-500'}`}>
      <label className="cursor-pointer block">
        {isUploading ? (
          <><Loader className={`w-10 h-10 sm:w-12 sm:h-12 text-${accent}-500 mx-auto mb-2 sm:mb-3 animate-spin`} />
          <p className={`text-${accent}-500 font-medium text-sm`}>Uploading...</p></>
        ) : (
          <><ImageIcon className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={`font-medium text-sm sm:text-base mb-1 ${dm ? 'text-gray-300' : 'text-gray-600'}`}>Click to upload {label}</p>
          <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>PNG, JPG, WEBP (Max 4MB)</p></>
        )}
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isUploading} />
      </label>
    </div>
  );
}

// ─── VisibilityPicker ─────────────────────────────────────────────────────────
function VisibilityPicker({ isPublic, onChange, dm }: any) {
  return (
    <div>
      <label className={`block text-xs sm:text-sm font-medium mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Visibility *</label>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
        {[
          { val: true,  icon: Globe, label: 'Public',  sub: 'Visible to all students', color: 'text-green-500' },
          { val: false, icon: Lock,  label: 'Private', sub: 'Only you can see',         color: 'text-orange-500' },
        ].map(({ val, icon: Icon, label, sub, color }) => (
          <label key={label} className={`flex items-center gap-2 sm:gap-3 cursor-pointer px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition ${
            isPublic === val
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : dm ? 'border-gray-700 hover:border-purple-500' : 'border-gray-200 hover:border-purple-500'
          }`}>
            <input type="radio" checked={isPublic === val} onChange={() => onChange(val)} className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
            <div>
              <p className={`font-semibold text-xs sm:text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{label}</p>
              <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{sub}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Modal footer ─────────────────────────────────────────────────────────────
function ModalFooter({ onClose, loading, saveLabel, loadLabel, dm }: any) {
  const s = useS(dm);
  return (
    <div className={`p-4 sm:p-6 border-t-2 flex gap-2 sm:gap-3 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
      <button type="button" onClick={onClose} disabled={loading}
        className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 rounded-xl transition font-semibold text-sm sm:text-base disabled:opacity-50 ${
          dm ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}>Cancel</button>
      <button type="submit" disabled={loading}
        className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base">
        {loading ? <><Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />{loadLabel}</> : saveLabel}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FolderDetailsModal
// ═════════════════════════════════════════════════════════════════════════════
function FolderDetailsModal({ folder, darkMode: dm, onClose, onUploadVideo, onPlayVideo, onEditVideo, onDeleteVideo, onDownloadVideo }: any) {
  const s = useS(dm);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-5xl lg:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl ${dm ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b-2 flex items-start justify-between flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200'}`}>
          <div className="min-w-0 pr-4">
            <h3 className={`text-lg sm:text-2xl font-bold mb-2 ${s.tp}`}>{folder.name}</h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{folder.subject}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${dm ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>{folder.class}</span>
              {folder.isPublic
                ? <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${dm ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}><Globe className="w-3 h-3" />Public</span>
                : <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${dm ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700'}`}><Lock className="w-3 h-3" />Private</span>}
              <span className={`text-xs sm:text-sm ${s.tm}`}>• {folder.chapter}</span>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className={`font-semibold text-sm sm:text-base ${s.tp}`}>Videos ({folder.videos.length})</h4>
            <button onClick={onUploadVideo}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add Video
            </button>
          </div>

          {folder.videos.length === 0 ? (
            <div className={`text-center py-10 sm:py-12 rounded-xl ${dm ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <FileVideo className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm mb-3 ${s.tm}`}>No videos in this folder yet</p>
              <button onClick={onUploadVideo} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm">Upload First Video</button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {folder.videos.map((video: VideoItem) => (
                <div key={video.id} className={`${s.card2} overflow-hidden hover:shadow-lg transition-all`}>
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                    {/* Thumbnail */}
                    <div onClick={() => onPlayVideo(video)}
                      className="w-24 h-16 sm:w-32 sm:h-20 rounded-xl flex-shrink-0 relative group cursor-pointer overflow-hidden">
                      {video.thumbnail?.trim()
                        ? <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center"><Play className="w-6 h-6 sm:w-8 sm:h-8 text-white" /></div>}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">{video.duration}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h5 className={`font-semibold text-sm sm:text-base mb-1 truncate ${s.tp}`}>{video.title}</h5>
                      <p className={`text-xs sm:text-sm mb-1.5 line-clamp-1 ${s.tm}`}>{video.description}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                        <span className={`flex items-center gap-1 ${s.ts}`}><Eye className="w-3 h-3" />{video.views} views</span>
                        <span className={s.ts}>•</span>
                        <span className={`flex items-center gap-1 ${s.ts}`}><Clock className="w-3 h-3" />{video.totalWatchTime}</span>
                        <span className={s.ts}>•</span>
                        <span className={s.ts}>{video.size}</span>
                        <span className={`px-1.5 py-0.5 rounded font-semibold ${dm ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>{video.quality}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {[
                        { action: () => onPlayVideo(video),    icon: Play,     cls: dm ? 'hover:bg-purple-900/50' : 'hover:bg-purple-50', ic: 'text-purple-500' },
                        { action: () => onDownloadVideo(video),icon: Download,  cls: dm ? 'hover:bg-blue-900/50'   : 'hover:bg-blue-50',   ic: 'text-blue-500'   },
                        { action: () => onEditVideo(video),    icon: Edit,     cls: dm ? 'hover:bg-gray-700'       : 'hover:bg-gray-100', ic: s.tm              },
                        { action: () => onDeleteVideo(video.id),icon: Trash2,   cls: dm ? 'hover:bg-red-900/40'    : 'hover:bg-red-50',    ic: 'text-red-500'    },
                      ].map(({ action, icon: Icon, cls, ic }, i) => (
                        <button key={i} onClick={action} className={`p-1.5 sm:p-2 rounded-lg transition ${cls}`}>
                          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${ic}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VideoPlayerModal — unchanged logic, improved sizing
// ═════════════════════════════════════════════════════════════════════════════
function VideoPlayerModal({ video, onClose, onDownload }: any) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [isMuted,       setIsMuted]       = useState(false);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [volume,        setVolume]        = useState(100);
  const [currentTime,   setCurrentTime]  = useState(0);
  const [duration,      setDuration]     = useState(0);
  const [playbackRate,  setPlaybackRate] = useState(1);
  const [showControls,  setShowControls] = useState(true);
  const [quality,       setQuality]      = useState('1080p');
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime     = () => setCurrentTime(v.currentTime);
    const onDuration = () => setDuration(v.duration);
    const onPlay     = () => setIsPlaying(true);
    const onPause    = () => setIsPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('durationchange', onDuration);
    v.addEventListener('loadedmetadata', onDuration);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('durationchange', onDuration);
      v.removeEventListener('loadedmetadata', onDuration);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlay  = () => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause();
  const toggleMute  = () => { if (!videoRef.current) return; videoRef.current.muted = !videoRef.current.muted; setIsMuted(videoRef.current.muted); };
  const handleVol   = (e: React.ChangeEvent<HTMLInputElement>) => { if (!videoRef.current) return; const v = +e.target.value; videoRef.current.volume = v/100; setVolume(v); setIsMuted(v===0); };
  const handleSeek  = (e: React.ChangeEvent<HTMLInputElement>) => { if (!videoRef.current) return; videoRef.current.currentTime = +e.target.value; setCurrentTime(+e.target.value); };
  const handleSkip  = (s: number) => { if (videoRef.current) videoRef.current.currentTime += s; };
  const handleRate  = (r: number) => { if (videoRef.current) videoRef.current.playbackRate = r; setPlaybackRate(r); };
  const toggleFS    = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) { containerRef.current.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };
  const fmt = (t: number) => {
    if (isNaN(t) || !isFinite(t)) return '0:00';
    const h = Math.floor(t/3600), m = Math.floor((t%3600)/60), s = Math.floor(t%60);
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  };
  const prog = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full relative" onMouseMove={handleMouseMove} onMouseLeave={() => isPlaying && setShowControls(false)}>
        <button onClick={onClose} className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-xl transition ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>
        <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 right-14 z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <h3 className="text-base sm:text-xl font-bold text-white drop-shadow-lg truncate">{video.title}</h3>
        </div>
        <div className="w-full h-full flex items-center justify-center bg-black">
          <video ref={videoRef} src={video.videoUrl} className="max-w-full max-h-full" onClick={togglePlay} />
        </div>
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Progress bar */}
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
            <div className="relative w-full h-5 sm:h-6 group cursor-pointer" onClick={e => {
              const r = e.currentTarget.getBoundingClientRect();
              if (videoRef.current) videoRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
            }}>
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 sm:h-1.5 bg-white/30 rounded-full">
                <div className="absolute top-0 left-0 h-full bg-purple-600 rounded-full" style={{ width: `${prog}%` }} />
              </div>
              <div className="absolute top-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-purple-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${prog}%`, transform: 'translate(-50%, -50%)' }} />
              <input type="range" min="0" max={duration||0} value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
            <div className="flex justify-between text-xs text-white/90 mt-1 font-medium">
              <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
            </div>
          </div>
          {/* Controls */}
          <div className="px-3 sm:px-6 pb-4 sm:pb-6 pt-1 sm:pt-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-3">
                <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded-lg transition">
                  {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                </button>
                <button onClick={() => handleSkip(-10)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition" title="Rewind 10s">
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
                <button onClick={() => handleSkip(10)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition" title="Forward 10s">
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
                <div className="flex items-center gap-1 group/vol">
                  <button onClick={toggleMute} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                  </button>
                  <div className="w-0 group-hover/vol:w-16 sm:group-hover/vol:w-24 overflow-hidden transition-all duration-300">
                    <input type="range" min="0" max="100" value={volume} onChange={handleVol}
                      className="w-16 sm:w-24 h-1 rounded-lg cursor-pointer" style={{ background: `linear-gradient(to right, #8b5cf6 ${volume}%, rgba(255,255,255,0.3) ${volume}%)` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="relative group">
                  <button className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs sm:text-sm font-medium min-w-[44px] sm:min-w-[60px]">{playbackRate}x</button>
                  <div className="absolute bottom-full mb-2 right-0 bg-black/95 rounded-xl p-1.5 sm:p-2 hidden group-hover:block min-w-[80px] sm:min-w-[100px]">
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(r => (
                      <button key={r} onClick={() => handleRate(r)} className={`block w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm transition ${playbackRate === r ? 'bg-purple-600 text-white' : 'text-white hover:bg-white/20'}`}>
                        {r}x{r===1 && ' (Normal)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative group">
                  <button className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs sm:text-sm font-medium flex items-center gap-1 min-w-[60px] sm:min-w-[80px]">
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4" />{quality}
                  </button>
                  <div className="absolute bottom-full mb-2 right-0 bg-black/95 rounded-xl p-1.5 sm:p-2 hidden group-hover:block min-w-[80px] sm:min-w-[100px]">
                    {['1080p','720p','480p','360p'].map(q => (
                      <button key={q} onClick={() => setQuality(q)} className={`block w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm transition ${quality === q ? 'bg-purple-600 text-white' : 'text-white hover:bg-white/20'}`}>{q}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => onDownload(video)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition" title="Download">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
                <button onClick={toggleFS} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition">
                  {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FolderFormModal — used by both Create and Edit
// ═════════════════════════════════════════════════════════════════════════════
function FolderFormModal({ mode, folder, darkMode: dm, onClose, onCreate, onUpdate }: any) {
  const isEdit = mode === 'edit';
  const [formData, setFormData] = useState({
    name:         folder?.name        || '',
    subject:      folder?.subject     || '',
    class:        folder?.class       || '',
    chapter:      folder?.chapter     || '',
    description:  folder?.description || '',
    isPublic:     folder?.isPublic    ?? true,
    thumbnailUrl: folder?.thumbnail   || '',
  });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.class || !formData.chapter) { alert('Please fill in all required fields'); return; }
    setBusy(true);
    isEdit ? await onUpdate(folder.id, formData) : await onCreate(formData);
    setBusy(false);
  };

  const set = (key: string) => (val: any) => setFormData(p => ({ ...p, [key]: val }));

  return (
    <ModalWrap dm={dm}>
      <div className={`p-4 sm:p-6 border-b-2 flex items-center justify-between flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50'}`}>
        <div>
          <h3 className={`text-xl sm:text-2xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>{isEdit ? 'Edit Folder' : 'Create New Folder'}</h3>
          <p className={`text-xs sm:text-sm mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{isEdit ? 'Update folder details' : 'Fill in the details for your new folder'}</p>
        </div>
        <button onClick={onClose} className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          <Field label="Folder Name" value={formData.name} onChange={set('name')} placeholder="e.g., Wave Optics Complete" required dm={dm} />
          <Field label="Subject"     value={formData.subject} onChange={set('subject')} placeholder="e.g., Physics, Chemistry" required dm={dm} />
          <Field label="Class"       value={formData.class} onChange={set('class')} placeholder="e.g., 12th, JEE, NEET" required dm={dm} />
          <Field label="Chapter"     value={formData.chapter} onChange={set('chapter')} placeholder="e.g., Chapter 10 - Wave Optics" required dm={dm} />
          <TextareaField label="Description" value={formData.description} onChange={set('description')} placeholder="Brief description of what this folder contains..." dm={dm} />
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Folder Thumbnail</label>
            <SimpleImageUpload onUpload={set('thumbnailUrl')} currentUrl={formData.thumbnailUrl} label="thumbnail" endpoint="folderThumbnail" dm={dm} />
          </div>
          <VisibilityPicker isPublic={formData.isPublic} onChange={set('isPublic')} dm={dm} />
        </div>
        <ModalFooter onClose={onClose} loading={busy} saveLabel={isEdit ? 'Update Folder' : 'Create Folder'} loadLabel={isEdit ? 'Updating...' : 'Creating...'} dm={dm} />
      </form>
    </ModalWrap>
  );
}

function CreateFolderModal({ darkMode, onClose, onCreate }: any) {
  return <FolderFormModal mode="create" darkMode={darkMode} onClose={onClose} onCreate={onCreate} />;
}
function EditFolderModal({ folder, darkMode, onClose, onUpdate }: any) {
  return <FolderFormModal mode="edit" folder={folder} darkMode={darkMode} onClose={onClose} onUpdate={onUpdate} />;
}

// ═════════════════════════════════════════════════════════════════════════════
// UploadVideoModal
// ═════════════════════════════════════════════════════════════════════════════
function UploadVideoModal({ folders, selectedFolder, darkMode: dm, onClose, onUpload, uploading }: any) {
  const s = useS(dm);
  const [formData, setFormData] = useState({
    folderId: selectedFolder?.id || '',
    title: '', description: '',
    videoFile: null as File | null,
    thumbnailUrl: '', videoUrl: '',
    duration: '0:00', size: '0 MB', quality: '1080p',
  });
  const [progress, setProgress] = useState(0);
  const [busy,     setBusy]     = useState(false);

  const handleVideoChange = async (file: File | null) => {
    setFormData(p => ({ ...p, videoFile: file }));
    if (file) {
      try {
        const [dur, sz] = await Promise.all([getVideoDuration(file).catch(() => '0:00'), Promise.resolve(formatFileSize(file.size))]);
        setFormData(p => ({ ...p, duration: dur, size: sz }));
      } catch { /* silent */ }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.videoFile) { alert('Please select a video file'); return; }
    if (!formData.folderId)  { alert('Please select a folder'); return; }
    setBusy(true); setProgress(0);
    try {
      const res = await uploadVideoToPuter(formData.videoFile, p => setProgress(p));
      await onUpload({ ...formData, videoUrl: res.url });
    } catch (e) { alert(`Upload failed: ${e instanceof Error ? e.message : 'Unknown error'}`); }
    finally { setBusy(false); setProgress(0); }
  };

  return (
    <ModalWrap dm={dm}>
      <div className={`p-4 sm:p-6 border-b-2 flex items-center justify-between flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50'}`}>
        <div>
          <h3 className={`text-xl sm:text-2xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Upload Video</h3>
          <p className={`text-xs sm:text-sm mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Add a new lecture video to your library</p>
        </div>
        <button onClick={onClose} disabled={busy} className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Folder select */}
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Select Folder *</label>
            <select required value={formData.folderId} onChange={e => setFormData(p => ({ ...p, folderId: e.target.value }))} disabled={busy}
              className={`${s.input} appearance-auto`}>
              <option value="">Choose a folder</option>
              {folders.map((f: VideoFolder) => (
                <option key={f.id} value={f.id}>{f.name} ({f.subject}) — {f.isPublic ? 'Public' : 'Private'}</option>
              ))}
            </select>
          </div>

          <Field label="Video Title" value={formData.title} onChange={(v: string) => setFormData(p => ({ ...p, title: v }))} placeholder="e.g., Introduction to Wave Optics" required disabled={busy} dm={dm} />
          <TextareaField label="Description" value={formData.description} onChange={(v: string) => setFormData(p => ({ ...p, description: v }))} placeholder="Brief description of the video..." rows={3} disabled={busy} dm={dm} />

          {/* Video file */}
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Video File *</label>
            <div className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition ${dm ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-500'}`}>
              {formData.videoFile ? (
                <div>
                  <FileVideo className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-2 sm:mb-3" />
                  <p className="text-green-500 font-medium text-sm mb-1">✓ {formData.videoFile.name}</p>
                  <p className={`text-xs mb-1 ${s.ts}`}>{formData.size}</p>
                  <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Duration: {formData.duration}</p>
                  <label className={`mt-3 inline-block px-4 py-2 rounded-xl cursor-pointer text-xs sm:text-sm font-semibold ${dm ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} transition`}>
                    Change Video
                    <input type="file" accept="video/*" onChange={e => handleVideoChange(e.target.files?.[0] || null)} className="hidden" disabled={busy} />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`font-medium text-sm sm:text-base mb-1 ${dm ? 'text-gray-300' : 'text-gray-600'}`}>Click to upload video</p>
                  <p className={`text-xs ${s.ts}`}>MP4, AVI, MOV (Any size — unlimited storage)</p>
                  <input type="file" accept="video/*" onChange={e => handleVideoChange(e.target.files?.[0] || null)} className="hidden" required disabled={busy} />
                </label>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Video Thumbnail (Optional)</label>
            <SimpleImageUpload onUpload={(url: string) => setFormData(p => ({ ...p, thumbnailUrl: url }))} currentUrl={formData.thumbnailUrl} label="video thumbnail" endpoint="videoThumbnail" accent="blue" dm={dm} />
          </div>

          {/* Progress */}
          {busy && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className={dm ? 'text-gray-300' : 'text-gray-700'}>Uploading video to cloud...</span>
                <span className={dm ? 'text-gray-300' : 'text-gray-700'}>{progress}%</span>
              </div>
              <div className={`w-full rounded-full h-2 ${dm ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 sm:p-6 border-t-2 flex gap-2 sm:gap-3 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <button type="button" onClick={onClose} disabled={busy}
            className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 rounded-xl transition font-semibold text-sm sm:text-base disabled:opacity-50 ${dm ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            Cancel
          </button>
          <button type="submit" disabled={busy}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base">
            {busy ? <><Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />Uploading... {progress}%</> : 'Upload Video'}
          </button>
        </div>
      </form>
    </ModalWrap>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EditVideoModal
// ═════════════════════════════════════════════════════════════════════════════
function EditVideoModal({ video, darkMode: dm, onClose, onUpdate }: any) {
  const [formData, setFormData] = useState({ title: video.title, description: video.description || '', thumbnailUrl: video.thumbnail || '' });
  const [busy, setBusy] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); await onUpdate(video.id, formData); setBusy(false); };
  const set = (k: string) => (v: any) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <ModalWrap dm={dm}>
      <div className={`p-4 sm:p-6 border-b-2 flex items-center justify-between flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50'}`}>
        <div>
          <h3 className={`text-xl sm:text-2xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Edit Video</h3>
          <p className={`text-xs sm:text-sm mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Update video details</p>
        </div>
        <button onClick={onClose} className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          <Field label="Video Title" value={formData.title} onChange={set('title')} required dm={dm} />
          <TextareaField label="Description" value={formData.description} onChange={set('description')} rows={4} dm={dm} />
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Video Thumbnail</label>
            <SimpleImageUpload onUpload={set('thumbnailUrl')} currentUrl={formData.thumbnailUrl} label="video thumbnail" endpoint="videoThumbnail" accent="blue" dm={dm} />
          </div>
        </div>
        <ModalFooter onClose={onClose} loading={busy} saveLabel="Update Video" loadLabel="Updating..." dm={dm} />
      </form>
    </ModalWrap>
  );
}