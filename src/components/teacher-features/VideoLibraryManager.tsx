// COMPLETE UPDATED Teacher Video Library Manager
// ✅ FIXED: Proper UploadThing imports and TypeScript types
// ✅ Uses UploadThing for thumbnails (cloud storage)
// ✅ Uses Puter.js for videos (unlimited cloud storage)
// ✅ Works on both localhost and Vercel
// ✅ All modals are INSIDE this component (no separate files needed)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { uploadVideoToPuter, getVideoDuration, formatFileSize } from '@/lib/puter';
import {
  Upload, Play, Eye, Edit, Trash2, Folder, Grid3x3, LayoutList, Search,
  Download, X, Plus, Video, Clock, Users, FolderPlus, ChevronRight,
  FileVideo, MoreVertical, Globe, Lock, Pause, Volume2, VolumeX,
  Maximize, Minimize, Settings, SkipForward, SkipBack, Loader, Image as ImageIcon
} from 'lucide-react';

// ✅ FIXED: Proper dynamic import for UploadThing (client-side only)
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
  videos: Video[];
}

interface Video {
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

export default function VideoLibraryManager() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showUploadVideoModal, setShowUploadVideoModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [showEditVideoModal, setShowEditVideoModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<VideoFolder | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [editingFolder, setEditingFolder] = useState<VideoFolder | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [folders, setFolders] = useState<VideoFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher/video-folders');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch folders: ${response.status}`);
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

  const totalVideos = folders.reduce((acc, f) => acc + f.videoCount, 0);
  const totalViews = folders.reduce((acc, f) => acc + f.totalViews, 0);
  
  const totalWatchTime = folders.reduce((acc, f) => {
    if (!f.totalWatchTime) return acc;
    const timeStr = f.totalWatchTime;
    const hourMatch = timeStr.match(/(\d+)h/);
    const minMatch = timeStr.match(/(\d+)m/);
    const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    const mins = minMatch ? parseInt(minMatch[1]) : 0;
    return acc + (hours * 60) + mins;
  }, 0);

  const watchTimeHours = Math.floor(totalWatchTime / 60);
  const watchTimeMins = totalWatchTime % 60;

  const stats = [
    { label: 'Total Folders', value: folders.length.toString(), icon: Folder, color: 'purple' },
    { label: 'Total Videos', value: totalVideos.toString(), icon: FileVideo, color: 'blue' },
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'green' },
    { label: 'Watch Time', value: `${watchTimeHours}h ${watchTimeMins}m`, icon: Clock, color: 'orange' },
  ];

  const filteredFolders = folders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         folder.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         folder.chapter.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const handleCreateFolder = async (folderData: any) => {
    try {
      const response = await fetch('/api/teacher/video-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderData.name,
          subject: folderData.subject,
          class: folderData.class,
          chapter: folderData.chapter,
          description: folderData.description || '',
          isPublic: folderData.isPublic,
          thumbnailUrl: folderData.thumbnailUrl || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folder');
      }

      await fetchFolders();
      setShowCreateFolderModal(false);
      alert('Folder created successfully!');
    } catch (error) {
      console.error('Error creating folder:', error);
      alert(`Failed to create folder: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleEditFolder = async (folderId: string, folderData: any) => {
    try {
      const response = await fetch(`/api/teacher/video-folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderData.name,
          subject: folderData.subject,
          class: folderData.class,
          chapter: folderData.chapter,
          description: folderData.description || '',
          isPublic: folderData.isPublic,
          thumbnailUrl: folderData.thumbnailUrl || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update folder');
      }

      await fetchFolders();
      setShowEditFolderModal(false);
      setEditingFolder(null);
      alert('Folder updated successfully!');
    } catch (error) {
      console.error('Error updating folder:', error);
      alert(`Failed to update folder: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleUploadVideo = async (videoData: any) => {
    try {
      setUploading(true);
      
      const response = await fetch('/api/teacher/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId: videoData.folderId,
          title: videoData.title,
          description: videoData.description || '',
          duration: videoData.duration,
          videoUrl: videoData.videoUrl,
          thumbnailUrl: videoData.thumbnailUrl || '',
          size: videoData.size,
          quality: videoData.quality || '1080p'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload video');
      }

      await fetchFolders();
      setShowUploadVideoModal(false);
      alert('Video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading video:', error);
      alert(`Failed to upload video: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEditVideo = async (videoId: string, videoData: any) => {
    try {
      const response = await fetch(`/api/teacher/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoData.title,
          description: videoData.description || '',
          thumbnailUrl: videoData.thumbnailUrl || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update video');
      }

      await fetchFolders();
      setShowEditVideoModal(false);
      setEditingVideo(null);
      alert('Video updated successfully!');
    } catch (error) {
      console.error('Error updating video:', error);
      alert(`Failed to update video: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder and all its videos?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/video-folders/${folderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete folder');
      }

      await fetchFolders();
      setSelectedFolder(null);
      alert('Folder deleted successfully!');
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert(`Failed to delete folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/videos/${videoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete video');
      }

      await fetchFolders();
      alert('Video deleted successfully!');
    } catch (error) {
      console.error('Error deleting video:', error);
      alert(`Failed to delete video: ${error instanceof Error ? error.message : 'Please try again.'}`);
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Video Library Manager</h2>
          <p className="text-gray-600">Organize and manage your lecture videos by folders</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <FolderPlus className="w-5 h-5" />
            Create Folder
          </button>
          <button
            onClick={() => setShowUploadVideoModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Video
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search folders, videos, subjects..."
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

      {/* Folders Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredFolders.map((folder) => (
          <div
            key={folder.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all group"
          >
            <div
              onClick={() => setSelectedFolder(folder)}
              className="h-48 relative cursor-pointer group-hover:scale-105 transition-transform overflow-hidden"
            >
              {folder.thumbnail && folder.thumbnail.trim() !== '' ? (
                <img 
                  src={folder.thumbnail} 
                  alt={folder.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Folder className="w-20 h-20 text-white opacity-80" />
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                  {folder.videoCount} videos
                </span>
                {folder.isPublic ? (
                  <div className="px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full flex items-center gap-1">
                    <Globe className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-semibold">Public</span>
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-orange-500/90 backdrop-blur-sm rounded-full flex items-center gap-1">
                    <Lock className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-semibold">Private</span>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{folder.name}</h3>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                      {folder.subject}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                      {folder.class}
                    </span>
                    {folder.isPublic ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{folder.chapter}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{folder.description}</p>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setFolderMenuOpen(folderMenuOpen === folder.id ? null : folder.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  {folderMenuOpen === folder.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                      <button
                        onClick={() => {
                          setEditingFolder(folder);
                          setShowEditFolderModal(true);
                          setFolderMenuOpen(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Folder
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFolder(folder);
                          setFolderMenuOpen(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Videos
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteFolder(folder.id);
                          setFolderMenuOpen(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Folder
                      </button>
                    </div>
                  )}
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
                  <p className="text-xs text-gray-600">Views</p>
                  <p className="text-lg font-bold text-gray-900">{folder.totalViews}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFolder(folder)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Videos
                </button>
                <button 
                  onClick={() => {
                    setEditingFolder(folder);
                    setShowEditFolderModal(true);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>Created {new Date(folder.createdAt).toLocaleDateString()}</span>
                <span className="text-gray-400">Watch time: {folder.totalWatchTime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFolders.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No folders found</h3>
          <p className="text-gray-600 mb-6">Create your first folder to organize lecture videos</p>
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            Create Folder
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedFolder && (
        <FolderDetailsModal
          folder={selectedFolder}
          onClose={() => setSelectedFolder(null)}
          onUploadVideo={() => setShowUploadVideoModal(true)}
          onPlayVideo={(video: Video) => {
            setSelectedVideo(video);
            setShowVideoPlayer(true);
          }}
          onEditVideo={(video: Video) => {
            setEditingVideo(video);
            setShowEditVideoModal(true);
          }}
          onDeleteVideo={handleDeleteVideo}
          onDownloadVideo={handleDownloadVideo}
        />
      )}

      {showVideoPlayer && selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          onClose={() => {
            setShowVideoPlayer(false);
            setSelectedVideo(null);
          }}
          onDownload={handleDownloadVideo}
        />
      )}

      {showCreateFolderModal && (
        <CreateFolderModal
          onClose={() => setShowCreateFolderModal(false)}
          onCreate={handleCreateFolder}
        />
      )}

      {showEditFolderModal && editingFolder && (
        <EditFolderModal
          folder={editingFolder}
          onClose={() => {
            setShowEditFolderModal(false);
            setEditingFolder(null);
          }}
          onUpdate={handleEditFolder}
        />
      )}

      {showUploadVideoModal && (
        <UploadVideoModal
          folders={folders}
          selectedFolder={selectedFolder}
          onClose={() => setShowUploadVideoModal(false)}
          onUpload={handleUploadVideo}
          uploading={uploading}
        />
      )}

      {showEditVideoModal && editingVideo && (
        <EditVideoModal
          video={editingVideo}
          onClose={() => {
            setShowEditVideoModal(false);
            setEditingVideo(null);
          }}
          onUpdate={handleEditVideo}
        />
      )}
    </div>
  );
}

// All modals below (FolderDetailsModal, VideoPlayerModal, CreateFolderModal, etc.)
// Continue with the rest of the component...
function FolderDetailsModal({ folder, onClose, onUploadVideo, onPlayVideo, onEditVideo, onDeleteVideo, onDownloadVideo }: any) {
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
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                {folder.class}
              </span>
              {folder.isPublic ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Public
                </span>
              ) : (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Private
                </span>
              )}
              <span className="text-sm text-gray-600">• {folder.chapter}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Videos ({folder.videos.length})</h4>
            <button
              onClick={onUploadVideo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Video
            </button>
          </div>

          {folder.videos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <FileVideo className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No videos in this folder yet</p>
              <button
                onClick={onUploadVideo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Upload First Video
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {folder.videos.map((video: Video) => (
                <div key={video.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4 p-4">
                    <div 
                      onClick={() => onPlayVideo(video)}
                      className="w-32 h-20 rounded-lg flex-shrink-0 relative group cursor-pointer overflow-hidden"
                    >
                      {video.thumbnail && video.thumbnail.trim() !== '' ? (
                        <img 
                          src={video.thumbnail} 
                          alt={video.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                        {video.duration}
                      </span>
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
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {video.totalWatchTime} watched
                        </span>
                        <span>•</span>
                        <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{video.size}</span>
                        <span>•</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">
                          {video.quality}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onPlayVideo(video)}
                        className="p-2 hover:bg-purple-50 rounded-lg transition"
                        title="Play"
                      >
                        <Play className="w-5 h-5 text-purple-600" />
                      </button>
                      <button 
                        onClick={() => onDownloadVideo(video)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition"
                        title="Download"
                      >
                        <Download className="w-5 h-5 text-blue-600" />
                      </button>
                      <button 
                        onClick={() => onEditVideo(video)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5 text-gray-600" />
                      </button>
                      <button 
                        onClick={() => onDeleteVideo(video.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
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

function VideoPlayerModal({ video, onClose, onDownload }: any) {
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
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadedmetadata', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadedmetadata', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = parseInt(e.target.value);
    video.volume = newVolume / 100;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime += seconds;
  };

  const handlePlaybackRateChange = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = rate;
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

// ✅ FIXED: Simple image upload component (no UploadButton needed)
function SimpleImageUpload({ onUpload, currentUrl, label }: { onUpload: (url: string) => void; currentUrl: string; label: string }) {
  const { startUpload, isUploading } = useUploadThing("folderThumbnail", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        onUpload(res[0].url);
      }
    },
    onUploadError: (error: Error) => {
      alert(`Upload failed: ${error.message}`);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await startUpload([file]);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  if (currentUrl) {
    return (
      <div className="relative">
        <img 
          src={currentUrl} 
          alt={label} 
          className="w-full h-48 object-cover rounded-lg border"
        />
        <button
          type="button"
          onClick={() => onUpload('')}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition">
      <label className="cursor-pointer block">
        {isUploading ? (
          <div>
            <Loader className="w-12 h-12 text-purple-600 mx-auto mb-3 animate-spin" />
            <p className="text-purple-600 font-medium">Uploading...</p>
          </div>
        ) : (
          <div>
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-1 font-medium">Click to upload {label}</p>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP (Max 4MB)</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
      </label>
    </div>
  );
}

// ✅ FIXED: CreateFolderModal with proper thumbnail upload
function CreateFolderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    class: '',
    chapter: '',
    description: '',
    isPublic: true,
    thumbnailUrl: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subject || !formData.class || !formData.chapter) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsCreating(true);
    await onCreate(formData);
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-2xl font-bold text-gray-900">Create New Folder</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Folder Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Wave Optics Complete"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
            <input
              type="text"
              required
              placeholder="e.g., Physics, Chemistry, Mathematics"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
            <input
              type="text"
              required
              placeholder="e.g., 12th, 11th, NEET, JEE"
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chapter *</label>
            <input
              type="text"
              required
              placeholder="e.g., Chapter 10 - Wave Optics"
              value={formData.chapter}
              onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              placeholder="Brief description of what this folder contains..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Folder Thumbnail</label>
            <SimpleImageUpload
              onUpload={(url) => setFormData({ ...formData, thumbnailUrl: url })}
              currentUrl={formData.thumbnailUrl}
              label="thumbnail"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Visibility *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 rounded-lg flex-1 transition hover:border-purple-500">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: true })}
                  className="w-4 h-4 text-purple-600"
                />
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Public</p>
                    <p className="text-xs text-gray-500">Visible to all students</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 rounded-lg flex-1 transition hover:border-purple-500">
                <input
                  type="radio"
                  name="visibility"
                  checked={!formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: false })}
                  className="w-4 h-4 text-purple-600"
                />
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900">Private</p>
                    <p className="text-xs text-gray-500">Only you can see</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Folder'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ✅ EditFolderModal (similar to Create, but with editing)
function EditFolderModal({ folder, onClose, onUpdate }: any) {
  const [formData, setFormData] = useState({
    name: folder.name,
    subject: folder.subject,
    class: folder.class || '',
    chapter: folder.chapter,
    description: folder.description || '',
    isPublic: folder.isPublic ?? true,
    thumbnailUrl: folder.thumbnail || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await onUpdate(folder.id, formData);
    setIsUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-2xl font-bold text-gray-900">Edit Folder</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Folder Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
            <input
              type="text"
              required
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chapter *</label>
            <input
              type="text"
              required
              value={formData.chapter}
              onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Folder Thumbnail</label>
            <SimpleImageUpload
              onUpload={(url) => setFormData({ ...formData, thumbnailUrl: url })}
              currentUrl={formData.thumbnailUrl}
              label="thumbnail"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Visibility *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 rounded-lg flex-1 transition hover:border-purple-500">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.isPublic === true}
                  onChange={() => setFormData({ ...formData, isPublic: true })}
                  className="w-4 h-4 text-purple-600"
                />
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Public</p>
                    <p className="text-xs text-gray-500">Visible to students</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 rounded-lg flex-1 transition hover:border-purple-500">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.isPublic === false}
                  onChange={() => setFormData({ ...formData, isPublic: false })}
                  className="w-4 h-4 text-purple-600"
                />
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900">Private</p>
                    <p className="text-xs text-gray-500">Only you</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Folder'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ✅ Simple video thumbnail upload component
function SimpleVideoThumbnailUpload({ onUpload, currentUrl, label }: { onUpload: (url: string) => void; currentUrl: string; label: string }) {
  const { startUpload, isUploading } = useUploadThing("videoThumbnail", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        onUpload(res[0].url);
      }
    },
    onUploadError: (error: Error) => {
      alert(`Upload failed: ${error.message}`);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await startUpload([file]);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  if (currentUrl) {
    return (
      <div className="relative">
        <img 
          src={currentUrl} 
          alt={label} 
          className="w-full h-48 object-cover rounded-lg border"
        />
        <button
          type="button"
          onClick={() => onUpload('')}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
      <label className="cursor-pointer block">
        {isUploading ? (
          <div>
            <Loader className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-spin" />
            <p className="text-blue-600 font-medium">Uploading...</p>
          </div>
        ) : (
          <div>
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-1 font-medium">Click to upload {label}</p>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP (Max 4MB)</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
      </label>
    </div>
  );
}

// ✅ UploadVideoModal with Puter.js + UploadThing
function UploadVideoModal({ folders, selectedFolder, onClose, onUpload, uploading }: any) {
  const [formData, setFormData] = useState({
    folderId: selectedFolder?.id || '',
    title: '',
    description: '',
    videoFile: null as File | null,
    thumbnailUrl: '',
    videoUrl: '',
    duration: '0:00',
    size: '0 MB',
    quality: '1080p'
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleVideoChange = async (file: File | null) => {
    setFormData(prev => ({ ...prev, videoFile: file }));
    
    if (file) {
      try {
        const duration = await getVideoDuration(file);
        const size = formatFileSize(file.size);
        setFormData(prev => ({ ...prev, duration, size }));
      } catch (error) {
        console.error('Error extracting duration:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.videoFile) {
      alert('Please select a video file');
      return;
    }
    if (!formData.folderId) {
      alert('Please select a folder');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('Uploading video to Puter.js...');
      const puterResult = await uploadVideoToPuter(formData.videoFile, (progress) => {
        setUploadProgress(progress);
      });

      console.log('Puter upload complete:', puterResult.url);

      await onUpload({
        ...formData,
        videoUrl: puterResult.url
      });

    } catch (error) {
      console.error('Error uploading video:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-2xl font-bold text-gray-900">Upload Video</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition" disabled={isUploading}>
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Folder *</label>
            <select
              required
              value={formData.folderId}
              onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUploading}
            >
              <option value="">Choose a folder</option>
              {folders.map((folder: VideoFolder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name} ({folder.subject}) - {folder.isPublic ? 'Public' : 'Private'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Introduction to Wave Optics"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of the video content..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video File *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
              {formData.videoFile ? (
                <div>
                  <FileVideo className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <p className="text-green-600 font-medium mb-1">✓ {formData.videoFile.name}</p>
                  <p className="text-xs text-gray-500 mb-2">{formData.size}</p>
                  <p className="text-xs text-gray-600">Duration: {formData.duration}</p>
                  <label className="mt-3 inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition cursor-pointer text-sm">
                    Change Video
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleVideoChange(e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1 font-medium">Click to upload video</p>
                  <p className="text-xs text-gray-500">MP4, AVI, MOV (Any size - unlimited storage)</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleVideoChange(e.target.files?.[0] || null)}
                    className="hidden"
                    required
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video Thumbnail (Optional)</label>
            <SimpleVideoThumbnailUpload
              onUpload={(url) => setFormData({ ...formData, thumbnailUrl: url })}
              currentUrl={formData.thumbnailUrl}
              label="video thumbnail"
            />
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading video to cloud...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Uploading... {uploadProgress}%
                </>
              ) : (
                'Upload Video'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ✅ EditVideoModal
function EditVideoModal({ video, onClose, onUpdate }: any) {
  const [formData, setFormData] = useState({
    title: video.title,
    description: video.description || '',
    thumbnailUrl: video.thumbnail || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await onUpdate(video.id, formData);
    setIsUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Edit Video</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video Thumbnail</label>
            <SimpleVideoThumbnailUpload
              onUpload={(url) => setFormData({ ...formData, thumbnailUrl: url })}
              currentUrl={formData.thumbnailUrl}
              label="video thumbnail"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Video'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}