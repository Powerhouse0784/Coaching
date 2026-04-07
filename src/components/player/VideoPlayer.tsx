'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Eye, Search, Folder, Clock, ChevronRight, Bookmark, X, Grid3x3,
  LayoutList, CheckCircle, Download, Pause, Volume2, VolumeX,
  Maximize, Minimize, Settings, SkipForward, SkipBack, Loader, Check, RotateCcw
} from 'lucide-react';

interface VideoFolder {
  id: string;
  name: string;
  subject: string;
  chapter: string;
  description: string;
  thumbnail: string;
  videoCount: number;
  totalDuration: string;
  totalViews: number;
  teacher: string;
  videos: Video[];
  progress?: number;
}

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  views: number;
  uploadDate: string;
  thumbnail: string;
  videoUrl: string;
  watched?: boolean;
  watchedPercentage?: number;
  bookmarked?: boolean;
}

export default function StudentVideoLibrary() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolder, setSelectedFolder] = useState<VideoFolder | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [folders, setFolders] = useState<VideoFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentWatchTime, setStudentWatchTime] = useState({ hours: 0, minutes: 0 });

  // ── Dark mode detection ──
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const dm = darkMode;

  useEffect(() => {
    fetchFolders();
    fetchStudentStats();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/video-folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      alert('Failed to load folders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStats = async () => {
    try {
      const response = await fetch('/api/student/watch-stats');
      if (response.ok) {
        const data = await response.json();
        setStudentWatchTime(data.watchTime);
      }
    } catch (error) {
      console.error('Error fetching student stats:', error);
    }
  };

  const trackProgress = async (videoId: string, percentage: number, watchedSeconds: number) => {
    try {
      await fetch('/api/student/video-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, watchedPercentage: percentage, watchedSeconds, completed: percentage >= 95 })
      });
      await fetchStudentStats();
    } catch (error) {
      console.error('Error tracking progress:', error);
    }
  };

  const toggleCompleted = async (videoId: string, currentlyCompleted: boolean) => {
    try {
      await fetch('/api/student/video-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, watchedPercentage: currentlyCompleted ? 0 : 100, watchedSeconds: 0, completed: !currentlyCompleted })
      });
      await fetchFolders();
      await fetchStudentStats();
      alert(currentlyCompleted ? 'Video marked as uncompleted!' : 'Video marked as completed!');
    } catch (error) {
      console.error('Error toggling completion:', error);
      alert('Failed to update completion status.');
    }
  };

  const toggleBookmark = async (videoId: string, currentBookmarked: boolean) => {
    try {
      await fetch('/api/student/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, bookmarked: !currentBookmarked })
      });
      await fetchFolders();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark.');
    }
  };

  const handleDownloadVideo = async (video: Video) => {
    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading video:', error);
      alert('Failed to download video.');
    }
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.chapter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const continueWatching = folders
    .flatMap(folder => folder.videos.map(video => ({ ...video, folder })))
    .filter(item => item.watchedPercentage && item.watchedPercentage > 0 && item.watchedPercentage < 95)
    .slice(0, 3);

  const bookmarkedVideos = folders
    .flatMap(folder => folder.videos.map(video => ({ ...video, folder })))
    .filter(item => item.bookmarked);

  const completedVideos = folders.flatMap(f => f.videos).filter(v => v.watched).length;
  const totalVideos = folders.reduce((acc, f) => acc + f.videoCount, 0);

  const handlePlayVideo = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30'}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className={`font-semibold ${dm ? 'text-gray-300' : 'text-gray-600'}`}>Loading video library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors p-3 sm:p-5 lg:p-8 ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30'}`}>

      {/* ── Header ── */}
      <div className="mb-6 sm:mb-8">
        <h2 className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>Video Library</h2>
        <p className={`text-sm sm:text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Access all lecture videos organized by subjects and topics</p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {[
          { icon: Folder,       iconBg: dm ? 'bg-blue-900'   : 'bg-blue-100',   iconColor: 'text-blue-500',   value: folders.length,  label: 'Available Folders' },
          { icon: Play,         iconBg: dm ? 'bg-purple-900' : 'bg-purple-100', iconColor: 'text-purple-500', value: totalVideos,     label: 'Total Videos'      },
          { icon: CheckCircle,  iconBg: dm ? 'bg-green-900'  : 'bg-green-100',  iconColor: 'text-green-500',  value: completedVideos, label: 'Completed'         },
          { icon: Clock,        iconBg: dm ? 'bg-orange-900' : 'bg-orange-100', iconColor: 'text-orange-500', value: `${studentWatchTime.hours}h ${studentWatchTime.minutes}m`, label: 'Watch Time' },
        ].map(({ icon: Icon, iconBg, iconColor, value, label }) => (
          <div key={label} className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 lg:p-6 border-2 hover:shadow-xl transition-all ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`w-9 h-9 sm:w-11 sm:h-11 ${iconBg} rounded-xl flex items-center justify-center mb-2 sm:mb-3`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${iconColor}`} />
            </div>
            <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 ${dm ? 'text-white' : 'text-gray-900'}`}>{value}</p>
            <p className={`text-xs sm:text-sm font-medium ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Continue Watching ── */}
      {continueWatching.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${dm ? 'text-white' : 'text-gray-900'}`}>
            <Play className="w-5 h-5 text-purple-500" />
            Continue Watching
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {continueWatching.map((item) => (
              <div
                key={item.id}
                onClick={() => handlePlayVideo(item)}
                className={`rounded-xl border-2 overflow-hidden hover:shadow-xl transition-all cursor-pointer group ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className="aspect-video relative overflow-hidden">
                  {item.thumbnail && item.thumbnail.trim() !== '' ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                      <Play className="w-10 h-10 text-white opacity-80" />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded font-medium">
                    {item.duration}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                    <div className="h-full bg-purple-500" style={{ width: `${item.watchedPercentage}%` }} />
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <h4 className={`font-semibold mb-1 text-sm sm:text-base line-clamp-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                  <p className={`text-xs sm:text-sm mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{(item as any).folder.name}</p>
                  <p className="text-xs text-purple-500 font-semibold">{item.watchedPercentage}% completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bookmarked Videos ── */}
      {bookmarkedVideos.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${dm ? 'text-white' : 'text-gray-900'}`}>
            <Bookmark className="w-5 h-5 text-yellow-500" />
            Bookmarked Videos
          </h3>
          <div className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="space-y-2 sm:space-y-3">
              {bookmarkedVideos.map((item) => (
                <div key={item.id} className={`flex items-center gap-3 p-2 sm:p-3 rounded-xl transition ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div
                    onClick={() => handlePlayVideo(item)}
                    className="w-20 h-14 sm:w-24 sm:h-16 rounded-lg flex-shrink-0 cursor-pointer relative overflow-hidden"
                  >
                    {item.thumbnail && item.thumbnail.trim() !== '' ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-[10px] rounded">
                      {item.duration}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-xs sm:text-sm truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                    <p className={`text-[11px] sm:text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{(item as any).folder.name} • {item.duration}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id, true); }}
                    className={`p-2 rounded-lg transition flex-shrink-0 ${dm ? 'hover:bg-yellow-900/40' : 'hover:bg-yellow-50'}`}
                  >
                    <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Search + View Toggle ── */}
      <div className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 sm:p-5 mb-5 sm:mb-6 shadow-sm ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search folders, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm sm:text-base ${
                dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
          </div>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className={`p-2.5 sm:p-3 border-2 rounded-xl transition flex-shrink-0 ${dm ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            {viewMode === 'grid' ? <LayoutList className="w-4 h-4 sm:w-5 sm:h-5" /> : <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* ── All Folders ── */}
      <div>
        <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>All Folders</h3>

        {filteredFolders.length === 0 ? (
          <div className={`rounded-xl sm:rounded-2xl border-2 p-10 sm:p-14 text-center ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <Folder className={`w-12 h-12 mx-auto mb-3 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`font-bold text-lg mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>No folders found</p>
            <p className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Try adjusting your search query</p>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
            : 'space-y-3 sm:space-y-4'
          }>
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
                className={`rounded-xl sm:rounded-2xl border-2 overflow-hidden hover:shadow-2xl transition-all cursor-pointer group ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                {/* Thumbnail */}
                <div className="h-36 sm:h-44 lg:h-48 relative overflow-hidden">
                  {folder.thumbnail && folder.thumbnail.trim() !== '' ? (
                    <img src={folder.thumbnail} alt={folder.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                      <Folder className="w-14 h-14 sm:w-20 sm:h-20 text-white opacity-80" />
                    </div>
                  )}
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
                    {folder.videoCount} videos
                  </span>
                  {folder.progress && folder.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30">
                      <div className="h-full bg-green-500" style={{ width: `${folder.progress}%` }} />
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5">
                  <h3 className={`font-bold text-base sm:text-lg mb-2 line-clamp-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{folder.name}</h3>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                      {folder.subject}
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{folder.chapter}</p>
                  <p className={`text-xs line-clamp-2 mb-4 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{folder.description}</p>

                  {/* Stats mini */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Videos',   value: folder.videoCount       },
                      { label: 'Duration', value: folder.totalDuration     },
                      { label: 'Progress', value: `${folder.progress || 0}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className={`rounded-xl p-2 text-center border-2 ${dm ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
                        <p className={`text-xs sm:text-sm font-bold truncate ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className={`flex items-center justify-between text-xs pt-3 border-t-2 ${dm ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-500'}`}>
                    <span className="truncate">By {folder.teacher}</span>
                    <span className={`font-semibold flex items-center gap-1 flex-shrink-0 ${dm ? 'text-purple-400' : 'text-purple-600'}`}>
                      View All <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Folder Details Modal ── */}
      {selectedFolder && (
        <FolderDetailsModal
          folder={selectedFolder}
          darkMode={dm}
          onClose={() => setSelectedFolder(null)}
          onPlayVideo={handlePlayVideo}
          onToggleBookmark={toggleBookmark}
          onDownloadVideo={handleDownloadVideo}
          onToggleCompleted={toggleCompleted}
        />
      )}

      {/* ── Video Player Modal ── */}
      {showVideoPlayer && selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={() => {
            setShowVideoPlayer(false);
            setSelectedVideo(null);
            fetchFolders();
            fetchStudentStats();
          }}
          onProgressUpdate={trackProgress}
          onDownload={handleDownloadVideo}
        />
      )}
    </div>
  );
}

// ─── Folder Details Modal ────────────────────────────────────────────────────
function FolderDetailsModal({ folder, darkMode, onClose, onPlayVideo, onToggleBookmark, onDownloadVideo, onToggleCompleted }: any) {
  const dm = darkMode;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col ${dm ? 'bg-gray-900' : 'bg-white'}`}>

        {/* Header */}
        <div className={`p-4 sm:p-6 border-b-2 flex-shrink-0 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-gray-200'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className={`text-lg sm:text-2xl font-bold truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{folder.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  {folder.subject}
                </span>
                <span className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>• {folder.chapter}</span>
                <span className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>• By {folder.teacher}</span>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <X className={`w-5 h-5 sm:w-6 sm:h-6 ${dm ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        {/* Videos list */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6">
          <p className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
            Videos ({folder.videos.length})
          </p>
          <div className="space-y-3 sm:space-y-4">
            {folder.videos.map((video: Video, index: number) => (
              <div key={video.id} className={`rounded-xl border-2 overflow-hidden hover:shadow-lg transition-all ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                {/* Mobile: stacked layout */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-0">

                  {/* Thumbnail row on mobile */}
                  <div className="flex items-center gap-3 p-3 sm:p-4">
                    {/* Index badge */}
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? 'bg-purple-900' : 'bg-purple-100'}`}>
                      <span className={`font-bold text-xs ${dm ? 'text-purple-300' : 'text-purple-700'}`}>{index + 1}</span>
                    </div>

                    {/* Thumbnail */}
                    <div
                      onClick={() => onPlayVideo(video)}
                      className="w-28 h-18 sm:w-36 sm:h-22 lg:w-40 lg:h-24 rounded-lg flex-shrink-0 relative cursor-pointer overflow-hidden"
                      style={{ height: '4.5rem' }}
                    >
                      {video.thumbnail && video.thumbnail.trim() !== '' ? (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-[10px] rounded">
                        {video.duration}
                      </span>
                      {video.watchedPercentage && video.watchedPercentage > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                          <div className="h-full bg-green-400" style={{ width: `${video.watchedPercentage}%` }} />
                        </div>
                      )}
                      {video.watched && (
                        <div className="absolute top-1 left-1">
                          <CheckCircle className="w-4 h-4 text-green-400 fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h5 className={`font-semibold text-xs sm:text-sm mb-1 line-clamp-2 ${dm ? 'text-white' : 'text-gray-900'}`}>{video.title}</h5>
                      <p className={`text-[11px] sm:text-xs mb-1.5 line-clamp-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{video.description}</p>
                      <div className={`flex flex-wrap items-center gap-2 text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {video.views}</span>
                        <span>•</span>
                        <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                        {video.watchedPercentage && video.watchedPercentage > 0 && (
                          <span className="text-purple-500 font-semibold">{video.watchedPercentage}% watched</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons — horizontal scroll on mobile */}
                  <div className={`flex items-center gap-1.5 px-3 pb-3 sm:p-4 sm:pb-4 sm:border-l-2 flex-shrink-0 overflow-x-auto ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                    {/* Toggle complete */}
                    {video.watched ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleCompleted(video.id, true); }}
                        className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-orange-900/40' : 'hover:bg-orange-50'}`}
                        title="Mark as Uncompleted"
                      >
                        <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleCompleted(video.id, false); }}
                        className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-green-900/40' : 'hover:bg-green-50'}`}
                        title="Mark as Completed"
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      </button>
                    )}

                    {/* Bookmark */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleBookmark(video.id, video.bookmarked || false); }}
                      className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-yellow-900/40' : 'hover:bg-yellow-50'}`}
                      title="Bookmark"
                    >
                      <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${video.bookmarked ? 'text-yellow-500 fill-current' : dm ? 'text-gray-500' : 'text-gray-400'}`} />
                    </button>

                    {/* Download */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownloadVideo(video); }}
                      className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-blue-900/40' : 'hover:bg-blue-50'}`}
                      title="Download"
                    >
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    </button>

                    {/* Play */}
                    <button
                      onClick={() => onPlayVideo(video)}
                      className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg transition flex-shrink-0"
                      title="Play"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Video Player Modal ──────────────────────────────────────────────────────
function VideoPlayerModal({ video, onClose, onProgressUpdate, onDownload }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState('1080p');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const [viewCounted, setViewCounted] = useState(false);
  const lastUpdateTimeRef = useRef(0);
  const watchStartTimeRef = useRef(Date.now());
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    watchStartTimeRef.current = Date.now();

    const handleTimeUpdate = () => {
      const currentTimestamp = Date.now();
      const elapsedSeconds = Math.floor((currentTimestamp - watchStartTimeRef.current) / 1000);
      setCurrentTime(videoElement.currentTime);
      if (elapsedSeconds >= 50 && !viewCounted) setViewCounted(true);
      if (currentTimestamp - lastUpdateTimeRef.current >= 30000) {
        const percentage = Math.round((videoElement.currentTime / videoElement.duration) * 100);
        onProgressUpdate(video.id, percentage, elapsedSeconds);
        lastUpdateTimeRef.current = currentTimestamp;
      }
    };
    const handleDurationChange = () => setDuration(videoElement.duration);
    const handleLoadedMetadata = () => setDuration(videoElement.duration);
    const handlePlay = () => { setIsPlaying(true); watchStartTimeRef.current = Date.now(); };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      const elapsedSeconds = Math.floor((Date.now() - watchStartTimeRef.current) / 1000);
      onProgressUpdate(video.id, 100, elapsedSeconds);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('durationchange', handleDurationChange);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('durationchange', handleDurationChange);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      const finalElapsed = Math.floor((Date.now() - watchStartTimeRef.current) / 1000);
      const pct = Math.round((videoElement.currentTime / videoElement.duration) * 100);
      onProgressUpdate(video.id, pct, finalElapsed);
    };
  }, [video.id, viewCounted]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseInt(e.target.value);
    v.volume = val / 100;
    setVolume(val);
    setIsMuted(val === 0);
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = parseFloat(e.target.value);
    v.currentTime = t;
    setCurrentTime(t);
  };
  const handleSkip = (secs: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime += secs;
  };
  const handlePlaybackRateChange = (rate: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };
  const toggleFullscreen = () => {
    const c = containerRef.current;
    if (!c) return;
    if (!document.fullscreenElement) { c.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };
  const formatTime = (t: number) => {
    if (isNaN(t) || !isFinite(t)) return '0:00';
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div
        ref={containerRef}
        className="w-full h-full relative"
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-50 p-2 bg-black/60 hover:bg-black/80 rounded-xl transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </button>

        {/* Title */}
        <div className={`absolute top-3 left-3 right-14 sm:top-4 sm:left-4 sm:right-16 z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <h3 className="text-sm sm:text-xl font-bold text-white drop-shadow-lg line-clamp-1">{video.title}</h3>
        </div>

        {/* Video */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="max-w-full max-h-full"
            onClick={togglePlay}
            playsInline
          />
        </div>

        {/* Controls overlay */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>

          {/* Progress bar */}
          <div className="px-3 sm:px-6 pt-4 sm:pt-6 pb-1 sm:pb-2">
            <div
              className="relative w-full h-5 sm:h-6 group cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                const newTime = pct * duration;
                if (videoRef.current) videoRef.current.currentTime = newTime;
              }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 sm:h-1.5 bg-white/30 rounded-full">
                <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progressPercentage}%` }} />
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPercentage}%`, transform: 'translate(-50%, -50%)' }}
              />
              <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs text-white/80 mt-1 sm:mt-2 font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Buttons row */}
          <div className="px-3 sm:px-6 pb-3 sm:pb-6 pt-1 sm:pt-2">
            <div className="flex items-center justify-between gap-2">

              {/* Left controls */}
              <div className="flex items-center gap-1 sm:gap-3">
                <button onClick={togglePlay} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition">
                  {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                </button>
                <button onClick={() => handleSkip(-10)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition" title="Rewind 10s">
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
                <button onClick={() => handleSkip(10)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition" title="Forward 10s">
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>

                {/* Volume — hide slider on mobile, just mute button */}
                <div className="flex items-center gap-1 sm:gap-2 group/vol">
                  <button onClick={toggleMute} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                  </button>
                  <div className="hidden sm:block w-0 group-hover/vol:w-20 transition-all duration-300 overflow-hidden">
                    <input
                      type="range" min="0" max="100" value={volume} onChange={handleVolumeChange}
                      className="w-20 h-1 rounded-lg appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #8b5cf6 ${volume}%, rgba(255,255,255,0.3) ${volume}%)` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-1 sm:gap-2">

                {/* Speed */}
                <div className="relative">
                  <button
                    onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition text-white text-xs sm:text-sm font-medium min-w-[40px] sm:min-w-[56px] text-center"
                  >
                    {playbackRate}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full mb-2 right-0 bg-black/95 rounded-xl p-1.5 sm:p-2 min-w-[90px] sm:min-w-[100px] z-10 shadow-2xl">
                      {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => handlePlaybackRateChange(rate)}
                          className={`block w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition ${playbackRate === rate ? 'bg-purple-600 text-white' : 'text-white hover:bg-white/20'}`}
                        >
                          {rate}x {rate === 1 && <span className="text-[10px] opacity-70">(Normal)</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quality — hidden on very small screens */}
                <div className="relative hidden xs:block">
                  <button
                    onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition text-white text-xs sm:text-sm font-medium flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{quality}</span>
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-full mb-2 right-0 bg-black/95 rounded-xl p-1.5 sm:p-2 min-w-[90px] sm:min-w-[100px] z-10 shadow-2xl">
                      {['1080p', '720p', '480p', '360p'].map((q) => (
                        <button
                          key={q}
                          onClick={() => { setQuality(q); setShowQualityMenu(false); }}
                          className={`block w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition ${quality === q ? 'bg-purple-600 text-white' : 'text-white hover:bg-white/20'}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download */}
                <button
                  onClick={() => onDownload(video)}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition"
                  title="Download"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition" title="Fullscreen">
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