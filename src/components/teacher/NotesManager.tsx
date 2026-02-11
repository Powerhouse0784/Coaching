'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUploadThing } from '@/lib/uploadthing';
import {
  FileText, Plus, Search, Filter, Download, Eye, Bookmark,
  Trash2, Edit, Pin, Upload, Loader, X, AlertCircle,
  CheckCircle, Book, GraduationCap, TrendingUp, Users,
  RefreshCw, Image as ImageIcon, Star, Lock, Unlock
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  class: string;
  topic: string | null;
  chapter: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
  isPinned: boolean;
  downloads: number;
  views: number;
  createdAt: string;
  stats: {
    totalBookmarks: number;
  };
}

export default function NotesManager() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teacher/notes');
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.notes);
        setFilteredNotes(data.notes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    let filtered = notes;

    if (searchQuery) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter((n) => n.subject === selectedSubject);
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter((n) => n.class === selectedClass);
    }

    setFilteredNotes(filtered);
  }, [searchQuery, selectedSubject, selectedClass, notes]);

  const subjects = Array.from(new Set(notes.map((n) => n.subject)));
  const classes = Array.from(new Set(notes.map((n) => n.class)));

  const totalNotes = notes.length;
  const totalDownloads = notes.reduce((sum, n) => sum + n.downloads, 0);
  const totalViews = notes.reduce((sum, n) => sum + n.views, 0);
  const totalBookmarks = notes.reduce((sum, n) => sum + n.stats.totalBookmarks, 0);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/teacher/notes?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        alert('Note deleted successfully');
      } else {
        alert('Failed to delete note');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const response = await fetch('/api/teacher/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id, action: 'toggle-publish' }),
      });

      const data = await response.json();

      if (data.success) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const response = await fetch('/api/teacher/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id, action: 'toggle-pin' }),
      });

      const data = await response.json();

      if (data.success) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notes Manager</h1>
          <p className="text-gray-600">Upload and manage study materials for students</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchNotes}
            className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Upload Note
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalNotes}</p>
          <p className="text-sm text-gray-600">Total Notes</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <Download className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalDownloads}</p>
          <p className="text-sm text-gray-600">Total Downloads</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
            <Eye className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalViews}</p>
          <p className="text-sm text-gray-600">Total Views</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <Bookmark className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalBookmarks}</p>
          <p className="text-sm text-gray-600">Total Bookmarks</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchQuery || selectedSubject !== 'all' || selectedClass !== 'all'
              ? 'No notes match your filters'
              : 'No notes yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedSubject !== 'all' || selectedClass !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload your first note to get started'}
          </p>
          {!searchQuery && selectedSubject === 'all' && selectedClass === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold"
            >
              Upload Note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
              onTogglePublish={handleTogglePublish}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateNoteModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchNotes();
          }}
        />
      )}
    </div>
  );
}

function NoteCard({
  note,
  onDelete,
  onTogglePublish,
  onTogglePin,
}: {
  note: Note;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all overflow-hidden">
      {note.thumbnailUrl ? (
        <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 relative">
          <img
            src={note.thumbnailUrl}
            alt={note.title}
            className="w-full h-full object-cover"
          />
          {note.isPinned && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-white p-2 rounded-lg">
              <Star className="w-4 h-4" fill="currentColor" />
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
          <FileText className="w-16 h-16 text-purple-400" />
          {note.isPinned && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-white p-2 rounded-lg">
              <Star className="w-4 h-4" fill="currentColor" />
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{note.title}</h3>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                {note.subject}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {note.class}
              </span>
              {!note.isPublished && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Draft
                </span>
              )}
            </div>
          </div>
        </div>

        {note.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{note.description}</p>
        )}

        {note.topic && (
          <p className="text-xs text-gray-500 mb-3">
            <span className="font-semibold">Topic:</span> {note.topic}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Downloads</p>
            <p className="text-lg font-bold text-gray-900">{note.downloads}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Views</p>
            <p className="text-lg font-bold text-gray-900">{note.views}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Bookmarks</p>
            <p className="text-lg font-bold text-gray-900">{note.stats.totalBookmarks}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTogglePin(note.id)}
            className={`flex-1 px-3 py-2 rounded-lg transition text-sm font-semibold ${
              note.isPinned
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-4 h-4 mx-auto" />
          </button>
          <button
            onClick={() => onTogglePublish(note.id)}
            className={`flex-1 px-3 py-2 rounded-lg transition text-sm font-semibold ${
              note.isPublished
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={note.isPublished ? 'Unpublish' : 'Publish'}
          >
            {note.isPublished ? (
              <Unlock className="w-4 h-4 mx-auto" />
            ) : (
              <Lock className="w-4 h-4 mx-auto" />
            )}
          </button>
          <a
            href={note.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-semibold flex items-center justify-center"
          >
            <Eye className="w-4 h-4" />
          </a>
          <button
            onClick={() => onDelete(note.id)}
            className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-semibold"
          >
            <Trash2 className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateNoteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class: '',
    topic: '',
    chapter: '',
    isPublished: true,
    isPinned: false,
  });
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const { startUpload: uploadFile, isUploading: isUploadingFile } = useUploadThing('notesFile', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const file = res[0];
        const fileType = file.type?.includes('pdf') ? 'pdf' : file.type?.includes('image') ? 'image' : 'doc';
        setUploadedFile({
          url: file.url,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          type: fileType,
        });
        setUploading(false);
      }
    },
    onUploadError: (error: Error) => {
      alert(`Upload failed: ${error.message}`);
      setUploading(false);
    },
  });

  const { startUpload: uploadThumbnail, isUploading: isUploadingThumbnail } = useUploadThing(
    'notesThumbnail',
    {
      onClientUploadComplete: (res) => {
        if (res && res[0]) {
          setUploadedThumbnail({
            url: res[0].url,
            name: res[0].name,
          });
        }
      },
      onUploadError: (error: Error) => {
        alert(`Thumbnail upload failed: ${error.message}`);
      },
    }
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or image file');
      return;
    }

    if (file.size > 32 * 1024 * 1024) {
      alert('File size must be less than 32MB');
      return;
    }

    setUploading(true);
    await uploadFile([file]);
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert('Thumbnail size must be less than 4MB');
      return;
    }

    await uploadThumbnail([file]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.subject || !formData.class || !uploadedFile) {
      alert('Please fill in all required fields and upload a file');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/teacher/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          subject: formData.subject,
          class: formData.class,
          topic: formData.topic || null,
          chapter: formData.chapter || null,
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          fileSize: uploadedFile.size,
          thumbnailUrl: uploadedThumbnail?.url || null,
          isPublished: formData.isPublished,
          isPinned: formData.isPinned,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Note uploaded successfully!');
        onSuccess();
      } else {
        alert('Failed to upload note: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">Upload New Note</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Organic Chemistry Chapter 5"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the note content..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Chemistry"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  placeholder="e.g., Class 12"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Alcohols and Phenols"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
                <input
                  type="text"
                  value={formData.chapter}
                  onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                  placeholder="e.g., Chapter 11"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File (PDF or Image) *
              </label>
              {uploadedFile ? (
                <div className="border-2 border-green-300 bg-green-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-600">{uploadedFile.size}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="p-2 hover:bg-red-100 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition cursor-pointer block">
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading || isUploadingFile}
                  />
                  {uploading || isUploadingFile ? (
                    <>
                      <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-3" />
                      <p className="text-purple-600 font-medium">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-1 font-medium">Click to upload file</p>
                      <p className="text-xs text-gray-500">PDF or Image (Max 32MB)</p>
                    </>
                  )}
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail (Optional)
              </label>
              {uploadedThumbnail ? (
                <div className="border-2 border-green-300 bg-green-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={uploadedThumbnail.url}
                      alt="Thumbnail"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <p className="font-semibold text-gray-900">{uploadedThumbnail.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedThumbnail(null)}
                    className="p-2 hover:bg-red-100 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-500 transition cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                    disabled={isUploadingThumbnail}
                  />
                  {isUploadingThumbnail ? (
                    <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload thumbnail</p>
                    </>
                  )}
                </label>
              )}
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Publish immediately</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Pin to top</span>
              </label>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || uploading || isUploadingFile || !uploadedFile}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Note
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
