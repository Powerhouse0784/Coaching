'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText, Search, Download, Eye, Bookmark, BookmarkCheck,
  Filter, RefreshCw, Loader, Star, TrendingUp, Clock,
  Book, GraduationCap, Award, Users, Calendar, ChevronDown
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
  isPinned: boolean;
  downloads: number;
  views: number;
  createdAt: string;
  teacher: {
    name: string | null;
    avatar: string | null;
  };
  isBookmarked: boolean;
  stats: {
    totalBookmarks: number;
  };
}

export default function NotesLibrary() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filter: selectedFilter,
        subject: selectedSubject,
        class: selectedClass,
        search: searchQuery,
      });

      const response = await fetch(`/api/student/notes?${params}`);
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
  }, [selectedFilter, selectedSubject, selectedClass, searchQuery]);

  const subjects = Array.from(new Set(notes.map((n) => n.subject)));
  const classes = Array.from(new Set(notes.map((n) => n.class)));

  const totalNotes = notes.length;
  const bookmarkedNotes = notes.filter((n) => n.isBookmarked).length;
  const totalDownloads = notes.reduce((sum, n) => sum + n.downloads, 0);
  const pinnedNotes = notes.filter((n) => n.isPinned).length;

  const handleBookmark = async (noteId: string) => {
    try {
      const response = await fetch('/api/student/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });

      const data = await response.json();

      if (data.success) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDownload = async (noteId: string, fileUrl: string, fileName: string) => {
    try {
      await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, action: 'download' }),
      });

      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleView = async (noteId: string, fileUrl: string) => {
    try {
      await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, action: 'view' }),
      });

      window.open(fileUrl, '_blank');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notes Library</h1>
          <p className="text-gray-600">Access study materials and notes from your teachers</p>
        </div>
        <button
          onClick={fetchNotes}
          className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalNotes}</p>
          <p className="text-sm text-gray-600">Available Notes</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <BookmarkCheck className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{bookmarkedNotes}</p>
          <p className="text-sm text-gray-600">Bookmarked</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <Download className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalDownloads}</p>
          <p className="text-sm text-gray-600">Total Downloads</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{pinnedNotes}</p>
          <p className="text-sm text-gray-600">Pinned Notes</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Notes</option>
              <option value="bookmarked">Bookmarked</option>
              <option value="recent">Recent</option>
              <option value="popular">Popular</option>
            </select>
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">No notes found</h3>
          <p className="text-gray-600">
            {searchQuery || selectedSubject !== 'all' || selectedClass !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No notes are available yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onBookmark={handleBookmark}
              onDownload={handleDownload}
              onView={handleView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  onBookmark,
  onDownload,
  onView,
}: {
  note: Note;
  onBookmark: (noteId: string) => void;
  onDownload: (noteId: string, fileUrl: string, fileName: string) => void;
  onView: (noteId: string, fileUrl: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all overflow-hidden group">
      {note.thumbnailUrl ? (
        <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
          <img
            src={note.thumbnailUrl}
            alt={note.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {note.isPinned && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-white p-2 rounded-lg shadow-lg">
              <Star className="w-4 h-4" fill="currentColor" />
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
          <FileText className="w-16 h-16 text-purple-400" />
          {note.isPinned && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-white p-2 rounded-lg shadow-lg">
              <Star className="w-4 h-4" fill="currentColor" />
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{note.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                {note.subject}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {note.class}
              </span>
            </div>
          </div>
          <button
            onClick={() => onBookmark(note.id)}
            className={`p-2 rounded-lg transition ${
              note.isBookmarked
                ? 'bg-purple-100 text-purple-600'
                : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600'
            }`}
          >
            {note.isBookmarked ? (
              <BookmarkCheck className="w-5 h-5" fill="currentColor" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
        </div>

        {note.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{note.description}</p>
        )}

        {note.topic && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Topic</p>
            <p className="text-sm font-medium text-gray-900">{note.topic}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {note.teacher.avatar ? (
                <img
                  src={note.teacher.avatar}
                  alt={note.teacher.name || 'Teacher'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                note.teacher.name?.charAt(0) || 'T'
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Uploaded by</p>
              <p className="text-sm font-medium text-gray-900">{note.teacher.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <Download className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900">{note.downloads}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <Eye className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900">{note.views}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <Bookmark className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-900">{note.stats.totalBookmarks}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(note.id, note.fileUrl)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold text-sm"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <button
            onClick={() => onDownload(note.id, note.fileUrl, note.fileName)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 font-semibold text-sm"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          {note.fileSize} • {new Date(note.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}