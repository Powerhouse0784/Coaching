'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText, Search, Download, Eye, Bookmark, BookmarkCheck,
  RefreshCw, Loader, Star, X, Filter,
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
  teacher: { name: string | null; avatar: string | null };
  isBookmarked: boolean;
  stats: { totalBookmarks: number };
}

export default function NotesLibrary() {
  const { data: session } = useSession();

  // ── Master data (fetched once from API) ──
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── UI filter state (all local, zero API calls) ──
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  // ── Dark mode ──
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  const dm = darkMode;

  // ── Debounce search input (300 ms) ──
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Fetch ALL notes once (no filter params sent to API) ──
  const fetchNotes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/student/notes');
      const data = await res.json();
      if (data.success) setAllNotes(data.notes);
    } catch (e) {
      console.error('Error fetching notes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // ── Derive subjects & classes from master list ──
  const subjects = useMemo(() => Array.from(new Set(allNotes.map((n) => n.subject))).sort(), [allNotes]);
  const classes  = useMemo(() => Array.from(new Set(allNotes.map((n) => n.class))).sort(),   [allNotes]);

  // ── ALL filtering happens here, locally, instantly ──
  const filteredNotes = useMemo(() => {
    let notes = [...allNotes];

    // Tab filter
    if (selectedFilter === 'bookmarked') {
      notes = notes.filter((n) => n.isBookmarked);
    } else if (selectedFilter === 'recent') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      notes = notes.filter((n) => new Date(n.createdAt) > cutoff);
    } else if (selectedFilter === 'popular') {
      notes = [...notes].sort((a, b) => b.downloads - a.downloads);
    }

    // Subject & class
    if (selectedSubject !== 'all') notes = notes.filter((n) => n.subject === selectedSubject);
    if (selectedClass   !== 'all') notes = notes.filter((n) => n.class   === selectedClass);

    // Search (uses debounced value so it only runs 300ms after typing stops)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.description?.toLowerCase().includes(q) ?? false) ||
          (n.topic?.toLowerCase().includes(q)       ?? false) ||
          (n.chapter?.toLowerCase().includes(q)     ?? false) ||
          n.subject.toLowerCase().includes(q) ||
          n.class.toLowerCase().includes(q),
      );
    }

    return notes;
  }, [allNotes, selectedFilter, selectedSubject, selectedClass, debouncedSearch]);

  // ── Stats (from master list, not filtered) ──
  const totalNotes      = allNotes.length;
  const bookmarkedNotes = allNotes.filter((n) => n.isBookmarked).length;
  const totalDownloads  = allNotes.reduce((s, n) => s + n.downloads, 0);
  const pinnedNotes     = allNotes.filter((n) => n.isPinned).length;

  // ── Bookmark (optimistic update — no full refetch) ──
  const handleBookmark = async (noteId: string) => {
    // Optimistic toggle immediately
    setAllNotes((prev) =>
      prev.map((n) =>
        n.id !== noteId ? n : {
          ...n,
          isBookmarked: !n.isBookmarked,
          stats: {
            totalBookmarks: n.isBookmarked
              ? n.stats.totalBookmarks - 1
              : n.stats.totalBookmarks + 1,
          },
        },
      ),
    );
    try {
      await fetch('/api/student/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });
    } catch (e) {
      console.error('Bookmark error:', e);
      // Revert on failure
      setAllNotes((prev) =>
        prev.map((n) =>
          n.id !== noteId ? n : {
            ...n,
            isBookmarked: !n.isBookmarked,
            stats: {
              totalBookmarks: n.isBookmarked
                ? n.stats.totalBookmarks - 1
                : n.stats.totalBookmarks + 1,
            },
          },
        ),
      );
    }
  };

  // ── Optimistic download counter ──
  const handleDownload = async (noteId: string, fileUrl: string, fileName: string) => {
    setAllNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, downloads: n.downloads + 1 } : n)),
    );
    window.open(fileUrl, '_blank');
    try {
      await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, action: 'download' }),
      });
    } catch (e) { console.error(e); }
  };

  // ── Optimistic view counter ──
  const handleView = async (noteId: string, fileUrl: string) => {
    setAllNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, views: n.views + 1 } : n)),
    );
    window.open(fileUrl, '_blank');
    try {
      await fetch('/api/student/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, action: 'view' }),
      });
    } catch (e) { console.error(e); }
  };

  const activeFilterCount = [
    selectedFilter !== 'all',
    selectedSubject !== 'all',
    selectedClass !== 'all',
  ].filter(Boolean).length;

  // ── Initial full-screen loader (only first load) ──
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
          <p className={`font-semibold ${dm ? 'text-gray-300' : 'text-gray-600'}`}>Loading your notes…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 sm:p-5 lg:p-8 min-h-screen transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>

      {/* ── Header ── */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3 ${dm ? 'text-white' : 'text-gray-900'}`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              Notes Library
            </h1>
            <p className={`text-sm sm:text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              Study materials uploaded by your teachers
            </p>
          </div>
          <button
            onClick={() => fetchNotes(true)}
            disabled={refreshing}
            className={`self-start sm:self-auto px-3 sm:px-4 py-2 border-2 rounded-xl hover:bg-opacity-80 transition flex items-center gap-2 font-semibold text-sm sm:text-base disabled:opacity-60 ${
              dm ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[
            { icon: FileText,      iconBg: dm ? 'bg-blue-900'    : 'bg-blue-100',    iconColor: 'text-blue-500',    value: totalNotes,      label: 'Available Notes'  },
            { icon: BookmarkCheck, iconBg: dm ? 'bg-violet-900'  : 'bg-violet-100',  iconColor: 'text-violet-500',  value: bookmarkedNotes, label: 'Bookmarked'       },
            { icon: Download,      iconBg: dm ? 'bg-emerald-900' : 'bg-emerald-100', iconColor: 'text-emerald-500', value: totalDownloads,  label: 'Total Downloads'  },
            { icon: Star,          iconBg: dm ? 'bg-amber-900'   : 'bg-amber-100',   iconColor: 'text-amber-500',   value: pinnedNotes,     label: 'Pinned Notes'     },
          ].map(({ icon: Icon, iconBg, iconColor, value, label }) => (
            <div key={label} className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 lg:p-6 border-2 hover:shadow-xl transition-all ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="mb-2 sm:mb-3">
                <div className={`w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${iconColor}`} />
                </div>
              </div>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 ${dm ? 'text-white' : 'text-gray-900'}`}>{value}</p>
              <p className={`text-xs sm:text-sm font-medium ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 lg:p-6 mb-5 sm:mb-6 shadow-sm ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { value: 'all',        label: 'All Notes'  },
            { value: 'bookmarked', label: 'Bookmarked' },
            { value: 'recent',     label: 'Recent'     },
            { value: 'popular',    label: 'Popular'    },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedFilter(value)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                selectedFilter === value
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg'
                  : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Search — controlled, debounced */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes, topics, subjects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 sm:pl-10 pr-8 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm sm:text-base ${
                dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className={`w-4 h-4 ${dm ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`} />
              </button>
            )}
          </div>

          {/* Subject */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all font-semibold text-sm sm:text-base ${
              dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Class */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all font-semibold text-sm sm:text-base ${
              dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="all">All Classes</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Active chips */}
        {activeFilterCount > 0 && (
          <div className={`flex flex-wrap gap-2 mt-3 pt-3 border-t-2 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
            {selectedFilter  !== 'all' && <Chip label={selectedFilter}  onRemove={() => setSelectedFilter('all')}  dm={dm} />}
            {selectedSubject !== 'all' && <Chip label={selectedSubject} onRemove={() => setSelectedSubject('all')} dm={dm} />}
            {selectedClass   !== 'all' && <Chip label={selectedClass}   onRemove={() => setSelectedClass('all')}   dm={dm} />}
            <button
              onClick={() => { setSelectedFilter('all'); setSelectedSubject('all'); setSelectedClass('all'); }}
              className="text-xs text-gray-400 hover:text-red-400 underline underline-offset-2 transition"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Results count ── */}
      {filteredNotes.length > 0 && (
        <p className={`text-xs mb-4 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
          Showing{' '}
          <span className={`font-semibold ${dm ? 'text-gray-300' : 'text-gray-600'}`}>{filteredNotes.length}</span>{' '}
          of{' '}
          <span className={`font-semibold ${dm ? 'text-gray-300' : 'text-gray-600'}`}>{totalNotes}</span>{' '}
          note{totalNotes !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Empty state ── */}
      {filteredNotes.length === 0 ? (
        <div className={`rounded-xl sm:rounded-2xl border-2 p-8 sm:p-12 text-center ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <FileText className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg sm:text-xl font-bold mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>No notes found</h3>
          <p className={`text-sm sm:text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
            {searchQuery || selectedSubject !== 'all' || selectedClass !== 'all'
              ? 'Try adjusting your search or filters.'
              : "Your teachers haven't uploaded any notes yet. Check back soon!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              darkMode={dm}
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

// ─── Chip ────────────────────────────────────────────────────────────────────
function Chip({ label, onRemove, dm }: { label: string; onRemove: () => void; dm: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
      dm ? 'bg-violet-900 text-violet-300 border-violet-700' : 'bg-violet-50 text-violet-700 border-violet-200'
    }`}>
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition"><X className="w-3 h-3" /></button>
    </span>
  );
}

// ─── Note Card ───────────────────────────────────────────────────────────────
function NoteCard({
  note, darkMode, onBookmark, onDownload, onView,
}: {
  note: Note;
  darkMode: boolean;
  onBookmark: (id: string) => void;
  onDownload: (id: string, url: string, name: string) => void;
  onView: (id: string, url: string) => void;
}) {
  const dm = darkMode;

  const subjectColorMap: Record<string, { light: string; dark: string }> = {
    Mathematics: { light: 'bg-blue-100 text-blue-700',      dark: 'bg-blue-900 text-blue-300'      },
    Physics:     { light: 'bg-violet-100 text-violet-700',  dark: 'bg-violet-900 text-violet-300'  },
    Chemistry:   { light: 'bg-emerald-100 text-emerald-700',dark: 'bg-emerald-900 text-emerald-300' },
    Biology:     { light: 'bg-green-100 text-green-700',    dark: 'bg-green-900 text-green-300'    },
    English:     { light: 'bg-pink-100 text-pink-700',      dark: 'bg-pink-900 text-pink-300'      },
    History:     { light: 'bg-amber-100 text-amber-700',    dark: 'bg-amber-900 text-amber-300'    },
  };
  const subjectColor = subjectColorMap[note.subject]
    ? (dm ? subjectColorMap[note.subject].dark : subjectColorMap[note.subject].light)
    : (dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700');

  return (
    <div className={`group flex flex-col rounded-xl sm:rounded-2xl border-2 overflow-hidden hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5 ${
      dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>

      {/* Thumbnail */}
      <div className={`relative h-40 sm:h-44 shrink-0 ${dm ? 'bg-gradient-to-br from-violet-950 to-pink-950' : 'bg-gradient-to-br from-violet-50 to-pink-50'}`}>
        {note.thumbnailUrl ? (
          <img src={note.thumbnailUrl} alt={note.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className={`w-12 h-12 ${dm ? 'text-violet-700' : 'text-violet-300'}`} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {note.isPinned && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-lg">
            <Star className="w-3 h-3" fill="currentColor" /> Pinned
          </div>
        )}
        <button
          onClick={() => onBookmark(note.id)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-all ${
            note.isBookmarked
              ? 'bg-violet-600 text-white'
              : dm
                ? 'bg-gray-900/90 text-gray-400 hover:bg-violet-600 hover:text-white'
                : 'bg-white/90 text-gray-500 hover:bg-violet-600 hover:text-white'
          }`}
        >
          {note.isBookmarked
            ? <BookmarkCheck className="w-4 h-4" fill="currentColor" />
            : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      {/* Body */}
      <div className={`flex flex-col flex-1 p-4 sm:p-5 ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${subjectColor}`}>{note.subject}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{note.class}</span>
          {note.chapter && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${dm ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>Ch. {note.chapter}</span>
          )}
        </div>

        <h3 className={`text-sm sm:text-base font-bold mb-1 line-clamp-2 leading-snug ${dm ? 'text-white' : 'text-gray-900'}`}>{note.title}</h3>
        {note.topic      && <p className={`text-xs mb-2 line-clamp-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>📌 {note.topic}</p>}
        {note.description && <p className={`text-xs line-clamp-2 mb-3 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{note.description}</p>}

        <div className="flex-1" />

        {/* Teacher row */}
        <div className={`flex items-center gap-2.5 py-3 border-t-2 mb-3 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {note.teacher.avatar
              ? <img src={note.teacher.avatar} alt={note.teacher.name || ''} className="w-full h-full object-cover" />
              : (note.teacher.name?.charAt(0) ?? 'T')}
          </div>
          <div className="min-w-0">
            <p className={`text-[11px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Uploaded by</p>
            <p className={`text-xs font-semibold truncate ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{note.teacher.name ?? 'Teacher'}</p>
          </div>
          <div className={`ml-auto text-[11px] shrink-0 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
            {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: Download, val: note.downloads,            label: 'Downloads' },
            { icon: Eye,      val: note.views,                label: 'Views'     },
            { icon: Bookmark, val: note.stats.totalBookmarks, label: 'Saved'     },
          ].map(({ icon: Icon, val, label }) => (
            <div key={label} className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border-2 ${dm ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <Icon className={`w-3.5 h-3.5 ${dm ? 'text-gray-400' : 'text-gray-400'}`} />
              <span className={`text-xs font-bold ${dm ? 'text-gray-200' : 'text-gray-800'}`}>{val}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onView(note.id, note.fileUrl)}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white text-xs sm:text-sm font-semibold transition-all"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> View
          </button>
          <button
            onClick={() => onDownload(note.id, note.fileUrl, note.fileName)}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:shadow-lg text-white text-xs sm:text-sm font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Download
          </button>
        </div>

        <p className={`text-[11px] text-center mt-2 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
          {note.fileType.toUpperCase()} · {note.fileSize}
        </p>
      </div>
    </div>
  );
}