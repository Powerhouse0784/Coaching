// COMPLETE UPDATED Student Video Library
// ✅ Removed "1M+ Hours watched" text
// ✅ Fixed folder duration calculation
// ✅ Added "Mark as Completed" option on videos
// ✅ 50-second view counting system
// ✅ Enhanced video player (matching teacher's design)
// ✅ Real-time watch time tracking (updates every 30 seconds)
// ✅ Accurate total watch time from all videos combined
// ✅ FIXED: Thumbnails now display correctly
// ✅ NEW: Toggle completed/uncompleted (undo button)

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

  useEffect(() => {
    fetchFolders();
    fetchStudentStats();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/video-folders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }
      
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
        body: JSON.stringify({
          videoId,
          watchedPercentage: percentage,
          watchedSeconds,
          completed: percentage >= 95
        })
      });
      
      await fetchStudentStats();
    } catch (error) {
      console.error('Error tracking progress:', error);
    }
  };

  // ✅ UPDATED: Toggle completed status (mark/unmark)
  const toggleCompleted = async (videoId: string, currentlyCompleted: boolean) => {
    try {
      await fetch('/api/student/video-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          watchedPercentage: currentlyCompleted ? 0 : 100,
          watchedSeconds: 0,
          completed: !currentlyCompleted
        })
      });
      
      await fetchFolders();
      await fetchStudentStats();
      
      if (currentlyCompleted) {
        alert('Video marked as uncompleted!');
      } else {
        alert('Video marked as completed!');
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      alert('Failed to update completion status. Please try again.');
    }
  };

  const toggleBookmark = async (videoId: string, currentBookmarked: boolean) => {
    try {
      await fetch('/api/student/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId, 
          bookmarked: !currentBookmarked 
        })
      });
      
      await fetchFolders();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark. Please try again.');
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
      alert('Failed to download video. Please try again.');
    }
  };

  const filteredFolders = folders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         folder.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         folder.chapter.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Video Library</h2>
        <p className="text-gray-600">Access all lecture videos organized by subjects and topics</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Folder className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{folders.length}</p>
          <p className="text-sm text-gray-600">Available Folders</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Play className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalVideos}</p>
          <p className="text-sm text-gray-600">Total Videos</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{completedVideos}</p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {studentWatchTime.hours}h {studentWatchTime.minutes}m
          </p>
          <p className="text-sm text-gray-600">Your Watch Time</p>
        </div>
      </div>

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-6 h-6 text-purple-600" />
            Continue Watching
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {continueWatching.map((item) => (
              <div
                key={item.id}
                onClick={() => handlePlayVideo(item)}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="aspect-video relative overflow-hidden">
                  {item.thumbnail && item.thumbnail.trim() !== '' ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
                    {item.duration}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                    <div
                      className="h-full bg-purple-600"
                      style={{ width: `${item.watchedPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{item.folder.name}</p>
                  <p className="text-xs text-purple-600 font-medium">{item.watchedPercentage}% completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookmarked Videos */}
      {bookmarkedVideos.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-yellow-600" />
            Bookmarked Videos
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="space-y-3">
              {bookmarkedVideos.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div 
                    onClick={() => handlePlayVideo(item)}
                    className="w-24 h-16 rounded-lg flex-shrink-0 cursor-pointer relative overflow-hidden"
                  >
                    {item.thumbnail && item.thumbnail.trim() !== '' ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-xs rounded">
                      {item.duration}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-600">{item.folder.name} • {item.duration}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(item.id, true);
                    }}
                    className="p-2 hover:bg-yellow-50 rounded-lg transition"
                  >
                    <Bookmark className="w-5 h-5 text-yellow-500 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search folders, videos, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            {viewMode === 'grid' ? <LayoutList className="w-5 h-5" /> : <Grid3x3 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Folders Grid */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">All Folders</h3>
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => setSelectedFolder(folder)}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="h-48 relative group-hover:scale-105 transition-transform overflow-hidden">
                {folder.thumbnail && folder.thumbnail.trim() !== '' ? (
                  <img src={folder.thumbnail} alt={folder.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Folder className="w-20 h-20 text-white opacity-80" />
                  </div>
                )}
                <span className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                  {folder.videoCount} videos
                </span>
                {folder.progress && folder.progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/30">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${folder.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{folder.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        {folder.subject}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{folder.chapter}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{folder.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-600">Videos</p>
                    <p className="text-lg font-bold text-gray-900">{folder.videoCount}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="text-sm font-bold text-gray-900">{folder.totalDuration}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-600">Progress</p>
                    <p className="text-lg font-bold text-gray-900">{folder.progress || 0}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                  <span>By {folder.teacher}</span>
                  <button className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                    View All
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Folder Details Modal */}
      {selectedFolder && (
        <FolderDetailsModal
          folder={selectedFolder}
          onClose={() => setSelectedFolder(null)}
          onPlayVideo={handlePlayVideo}
          onToggleBookmark={toggleBookmark}
          onDownloadVideo={handleDownloadVideo}
          onToggleCompleted={toggleCompleted}
        />
      )}

      {/* Video Player Modal */}
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

// ✅ UPDATED: Folder Details Modal with toggle completed button
function FolderDetailsModal({ folder, onClose, onPlayVideo, onToggleBookmark, onDownloadVideo, onToggleCompleted }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{folder.name}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                {folder.subject}
              </span>
              <span className="text-sm text-gray-600">• {folder.chapter}</span>
              <span className="text-sm text-gray-600">• By {folder.teacher}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900">Videos ({folder.videos.length})</h4>
          </div>

          <div className="space-y-4">
            {folder.videos.map((video: Video, index: number) => (
              <div
                key={video.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-700 font-bold text-sm">{index + 1}</span>
                  </div>

                  <div 
                    onClick={() => onPlayVideo(video)}
                    className="w-40 h-24 rounded-lg flex-shrink-0 relative group-hover:scale-105 transition-transform cursor-pointer overflow-hidden"
                  >
                    {video.thumbnail && video.thumbnail.trim() !== '' ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                      {video.duration}
                    </span>
                    {video.watchedPercentage && video.watchedPercentage > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${video.watchedPercentage}%` }}
                        />
                      </div>
                    )}
                    {video.watched && (
                      <div className="absolute top-1 left-1">
                        <CheckCircle className="w-5 h-5 text-green-400 fill-current" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">{video.title}</h5>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{video.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.views} views
                      </span>
                      <span>•</span>
                      <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                      {video.watchedPercentage && video.watchedPercentage > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-purple-600 font-medium">
                            {video.watchedPercentage}% watched
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ✅ UPDATED: Toggle completed button (Check/Undo) */}
                  <div className="flex items-center gap-2">
                    {video.watched ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCompleted(video.id, true);
                        }}
                        className="p-2 hover:bg-orange-50 rounded-lg transition group"
                        title="Mark as Uncompleted"
                      >
                        <RotateCcw className="w-5 h-5 text-orange-600 group-hover:rotate-180 transition-transform duration-300" />
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCompleted(video.id, false);
                        }}
                        className="p-2 hover:bg-green-50 rounded-lg transition"
                        title="Mark as Completed"
                      >
                        <Check className="w-5 h-5 text-green-600" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(video.id, video.bookmarked || false);
                      }}
                      className="p-2 hover:bg-yellow-50 rounded-lg transition"
                      title="Bookmark"
                    >
                      <Bookmark className={`w-5 h-5 ${video.bookmarked ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadVideo(video);
                      }}
                      className="p-2 hover:bg-blue-50 rounded-lg transition"
                      title="Download"
                    >
                      <Download className="w-5 h-5 text-blue-600" />
                    </button>
                    <button 
                      onClick={() => onPlayVideo(video)}
                      className="p-2 hover:bg-purple-100 rounded-lg transition"
                      title="Play"
                    >
                      <Play className="w-5 h-5 text-purple-600" />
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
  
  const [totalWatchedSeconds, setTotalWatchedSeconds] = useState(0);
  const [viewCounted, setViewCounted] = useState(false);
  const lastUpdateTimeRef = useRef(0);
  const watchStartTimeRef = useRef(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    watchStartTimeRef.current = Date.now();

    const handleTimeUpdate = () => {
      const currentTimestamp = Date.now();
      const elapsedSeconds = Math.floor((currentTimestamp - watchStartTimeRef.current) / 1000);
      
      setCurrentTime(videoElement.currentTime);
      setTotalWatchedSeconds(elapsedSeconds);

      if (elapsedSeconds >= 50 && !viewCounted) {
        setViewCounted(true);
      }

      if (currentTimestamp - lastUpdateTimeRef.current >= 30000) {
        const percentage = Math.round((videoElement.currentTime / videoElement.duration) * 100);
        onProgressUpdate(video.id, percentage, elapsedSeconds);
        lastUpdateTimeRef.current = currentTimestamp;
      }
    };
    
    const handleDurationChange = () => setDuration(videoElement.duration);
    const handleLoadedMetadata = () => setDuration(videoElement.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      watchStartTimeRef.current = Date.now();
    };
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
      
      const finalElapsedSeconds = Math.floor((Date.now() - watchStartTimeRef.current) / 1000);
      const percentage = Math.round((videoElement.currentTime / videoElement.duration) * 100);
      onProgressUpdate(video.id, percentage, finalElapsedSeconds);
    };
  }, [video.id, viewCounted]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  };

  const toggleMute = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    videoElement.muted = !videoElement.muted;
    setIsMuted(videoElement.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const newVolume = parseInt(e.target.value);
    videoElement.volume = newVolume / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const newTime = parseFloat(e.target.value);
    videoElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkip = (seconds: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    videoElement.currentTime += seconds;
  };

  const handlePlaybackRateChange = (rate: number) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    videoElement.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div 
        ref={containerRef}
        className="w-full h-full relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className={`absolute top-4 left-4 right-16 z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <h3 className="text-xl font-bold text-white drop-shadow-lg">{video.title}</h3>
        </div>

        <div className="w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="max-w-full max-h-full"
            onClick={togglePlay}
          />
        </div>

        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="px-6 pt-6 pb-2">
            <div className="relative w-full h-6 group cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percentage = clickX / rect.width;
              const newTime = percentage * duration;
              if (videoRef.current) {
                videoRef.current.currentTime = newTime;
              }
            }}>
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-white/30 rounded-full">
                <div 
                  className="absolute top-0 left-0 h-full bg-purple-600 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPercentage}%`, transform: 'translate(-50%, -50%)' }}
              />
              
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            
            <div className="flex justify-between text-xs text-white/90 mt-2 font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded-lg transition">
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </button>

                <button onClick={() => handleSkip(-10)} className="p-2 hover:bg-white/20 rounded-lg transition" title="Rewind 10s">
                  <SkipBack className="w-5 h-5 text-white" />
                </button>

                <button onClick={() => handleSkip(10)} className="p-2 hover:bg-white/20 rounded-lg transition" title="Forward 10s">
                  <SkipForward className="w-5 h-5 text-white" />
                </button>

                <div className="flex items-center gap-2 group/volume">
                  <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-lg transition">
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <div className="w-0 group-hover/volume:w-24 transition-all duration-300 overflow-hidden">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #8b5cf6 ${volume}%, rgba(255,255,255,0.3) ${volume}%)`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition text-white text-sm font-medium min-w-[60px]">
                    {playbackRate}x
                  </button>
                  <div className="absolute bottom-full mb-2 right-0 bg-black/95 rounded-lg p-2 hidden group-hover:block min-w-[100px]">
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm transition ${
                          playbackRate === rate ? 'bg-purple-600 text-white' : 'text-white hover:bg-white/20'
                        }`}
                      >
                        {rate}x {rate === 1 && '(Normal)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <button className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition text-white text-sm font-medium flex items-center gap-1.5 min-w-[80px]">
                    <Settings className="w-4 h-4" />
                    {quality}
                  </button>
                  <div className="absolute bottom-full mb-2 right-0 bg-black/95 rounded-lg p-2 hidden group-hover:block min-w-[100px]">
                    {['1080p', '720p', '480p', '360p'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={`block w-full text-left px-3 py-2 rounded text-sm transition ${
                          quality === q ? 'bg-purple-600 text-white' : 'text-white hover:bg-white/20'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => onDownload(video)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-white" />
                </button>

                <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-lg transition" title="Fullscreen (F)">
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}