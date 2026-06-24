'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useUploadThing } from '@/lib/uploadthing';
import {
  FileText, Plus, Search, Download, Eye, Bookmark,
  Trash2, Edit, Pin, Upload, Loader, X,
  RefreshCw, Image as ImageIcon, Star, Lock, Unlock,
  IndianRupee, CheckCircle, TrendingUp, Filter,
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
  price: number;
  downloads: number;
  views: number;
  createdAt: string;
  stats: { totalBookmarks: number };
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

function useStyles(dm: boolean) {
  return {
    card:        `rounded-xl sm:rounded-2xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`,
    input:       `w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`,
    label:       `block text-xs sm:text-sm font-semibold mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`,
    textPrimary: dm ? 'text-white'    : 'text-gray-900',
    textMuted:   dm ? 'text-gray-400' : 'text-gray-600',
  };
}

// ═══════════════════════════════════════════════════════════════════
export default function NotesManager() {
  const dm = useDarkMode();
  const s  = useStyles(dm);

  // ── Master data — fetched once ──
  const [allNotes,    setAllNotes]    = useState<Note[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  // ── Local filter state — zero API calls ──
  const [searchQuery,     setSearchQuery]     = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass,   setSelectedClass]   = useState('all');
  const [publishFilter,   setPublishFilter]   = useState<'all' | 'published' | 'draft'>('all');

  // ── Modal state ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote,     setEditingNote]     = useState<Note | null>(null);

  const fetchNotes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res  = await fetch('/api/teacher/notes');
      const data = await res.json();
      if (data.success) setAllNotes(data.notes);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // ── All filtering is local & instant ──
  const filteredNotes = useMemo(() => {
    let list = [...allNotes];
    if (publishFilter === 'published') list = list.filter(n =>  n.isPublished);
    if (publishFilter === 'draft')     list = list.filter(n => !n.isPublished);
    if (selectedSubject !== 'all')     list = list.filter(n => n.subject === selectedSubject);
    if (selectedClass   !== 'all')     list = list.filter(n => n.class   === selectedClass);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        n.topic?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allNotes, searchQuery, selectedSubject, selectedClass, publishFilter]);

  const subjects = useMemo(() => Array.from(new Set(allNotes.map(n => n.subject))).sort(), [allNotes]);
  const classes  = useMemo(() => Array.from(new Set(allNotes.map(n => n.class))).sort(),   [allNotes]);

  // ── Stats from master list ──
  const totalDownloads = allNotes.reduce((s, n) => s + n.downloads,            0);
  const totalViews     = allNotes.reduce((s, n) => s + n.views,                0);
  const totalBookmarks = allNotes.reduce((s, n) => s + n.stats.totalBookmarks, 0);
  const publishedCount = allNotes.filter(n => n.isPublished).length;

  // ── Optimistic delete ──
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    setAllNotes(prev => prev.filter(n => n.id !== id));
    try {
      const data = await (await fetch(`/api/teacher/notes?id=${id}`, { method: 'DELETE' })).json();
      if (!data.success) { fetchNotes(); alert('Failed to delete note'); }
    } catch { fetchNotes(); alert('An error occurred'); }
  }, [fetchNotes]);

  // ── Optimistic toggle publish ──
  const handleTogglePublish = useCallback(async (id: string) => {
    setAllNotes(prev => prev.map(n => n.id === id ? { ...n, isPublished: !n.isPublished } : n));
    try {
      const data = await (await fetch('/api/teacher/notes', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id, action: 'toggle-publish' }),
      })).json();
      if (!data.success) fetchNotes();
    } catch { fetchNotes(); }
  }, [fetchNotes]);

  // ── Optimistic toggle pin ──
  const handleTogglePin = useCallback(async (id: string) => {
    setAllNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    try {
      const data = await (await fetch('/api/teacher/notes', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id, action: 'toggle-pin' }),
      })).json();
      if (!data.success) fetchNotes();
    } catch { fetchNotes(); }
  }, [fetchNotes]);

  if (loading) return (
    <div className={`flex items-center justify-center min-h-[400px] ${dm ? 'bg-gray-900' : ''}`}>
      <div className="text-center">
        <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
        <p className={`font-semibold ${s.textMuted}`}>Loading notes...</p>
      </div>
    </div>
  );

  return (
    <div className={`p-3 sm:p-6 lg:p-8 min-h-screen transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-purple-50/30'}`}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-1 ${s.textPrimary}`}>Notes Manager</h1>
          <p className={`text-sm sm:text-base ${s.textMuted}`}>
            {allNotes.length} notes · {publishedCount} published
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
          <button
            onClick={() => fetchNotes(true)}
            disabled={refreshing}
            className={`p-2.5 sm:p-3 border-2 rounded-xl transition disabled:opacity-60 ${dm ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Upload Note
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
        {[
          { icon: FileText,   bg: dm ? 'bg-blue-900'   : 'bg-blue-100',   color: 'text-blue-500',   value: allNotes.length, label: 'Total Notes',     sub: `${publishedCount} published` },
          { icon: Download,   bg: dm ? 'bg-green-900'  : 'bg-green-100',  color: 'text-green-500',  value: totalDownloads,  label: 'Total Downloads', sub: 'across all notes'  },
          { icon: Eye,        bg: dm ? 'bg-orange-900' : 'bg-orange-100', color: 'text-orange-500', value: totalViews,      label: 'Total Views',     sub: 'lifetime views'    },
          { icon: Bookmark,   bg: dm ? 'bg-purple-900' : 'bg-purple-100', color: 'text-purple-500', value: totalBookmarks,  label: 'Bookmarks',       sub: 'saved by students' },
        ].map(({ icon: Icon, bg, color, value, label, sub }, i) => (
          <div key={i} className={`${s.card} p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all`}>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold mb-0.5 ${s.textPrimary}`}>{value}</p>
            <p className={`text-xs sm:text-sm font-medium ${s.textMuted}`}>{label}</p>
            <p className={`text-[10px] sm:text-xs mt-0.5 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`${s.card} p-3 sm:p-5 mb-5 sm:mb-6`}>
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          {([
            { value: 'all',       label: `All (${allNotes.length})`       },
            { value: 'published', label: `Published (${publishedCount})`  },
            { value: 'draft',     label: `Drafts (${allNotes.length - publishedCount})` },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPublishFilter(value)}
              className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
                publishFilter === value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, subject, topic..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`${s.input} pl-9 sm:pl-10`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className={s.input}>
            <option value="all">All Subjects</option>
            {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className={s.input}>
            <option value="all">All Classes</option>
            {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>

        {/* Results count */}
        {(searchQuery || selectedSubject !== 'all' || selectedClass !== 'all' || publishFilter !== 'all') && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
            <p className={`text-xs ${s.textMuted}`}>
              Showing <span className={`font-bold ${s.textPrimary}`}>{filteredNotes.length}</span> of <span className="font-bold">{allNotes.length}</span> notes
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedSubject('all'); setSelectedClass('all'); setPublishFilter('all'); }}
              className="text-xs text-purple-500 hover:text-purple-400 font-semibold underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Notes grid / empty state */}
      {filteredNotes.length === 0 ? (
        <div className={`${s.card} p-10 sm:p-14 text-center`}>
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dm ? 'bg-gray-700' : 'bg-purple-50'}`}>
            <FileText className={`w-10 h-10 ${dm ? 'text-gray-500' : 'text-purple-400'}`} />
          </div>
          <h3 className={`text-lg sm:text-xl font-bold mb-2 ${s.textPrimary}`}>
            {searchQuery || selectedSubject !== 'all' || selectedClass !== 'all' ? 'No notes match your filters' : 'No notes yet'}
          </h3>
          <p className={`text-sm sm:text-base mb-5 ${s.textMuted}`}>
            {searchQuery || selectedSubject !== 'all' || selectedClass !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload your first note to get started'}
          </p>
          {!searchQuery && selectedSubject === 'all' && selectedClass === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-semibold text-sm sm:text-base"
            >
              Upload First Note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              darkMode={dm}
              onDelete={handleDelete}
              onTogglePublish={handleTogglePublish}
              onTogglePin={handleTogglePin}
              onEdit={() => setEditingNote(note)}
            />
          ))}
        </div>
      )}

      {/* ── Modals — top-level so they NEVER get recreated on filter changes ── */}
      {showCreateModal && (
        <NoteFormModal
          mode="create"
          darkMode={dm}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newNote) => {
            setAllNotes(prev => [newNote, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}

      {editingNote && (
        <NoteFormModal
          mode="edit"
          note={editingNote}
          darkMode={dm}
          onClose={() => setEditingNote(null)}
          onSuccess={(updated) => {
            setAllNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Note Card — memo so it doesn't re-render unless its own props change
// ═══════════════════════════════════════════════════════════════════
const NoteCard = memo(function NoteCard({
  note, darkMode, onDelete, onTogglePublish, onTogglePin, onEdit,
}: {
  note: Note;
  darkMode: boolean;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string) => void;
  onTogglePin: (id: string) => void;
  onEdit: () => void;
}) {
  const dm = darkMode;

  return (
    <div className={`rounded-xl sm:rounded-2xl border-2 hover:shadow-2xl transition-all duration-200 overflow-hidden group ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>

      {/* Thumbnail */}
      <div className={`h-40 sm:h-48 relative overflow-hidden flex items-center justify-center ${dm ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50' : 'bg-gradient-to-br from-purple-50 to-pink-100'}`}>
        {note.thumbnailUrl
          ? <img src={note.thumbnailUrl} alt={note.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <FileText className={`w-14 h-14 sm:w-16 sm:h-16 ${dm ? 'text-purple-600' : 'text-purple-300'}`} />}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {note.isPinned && (
            <span className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow">
              <Star className="w-2.5 h-2.5" fill="currentColor" /> Pinned
            </span>
          )}
          {!note.isPublished && (
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-800/90 text-gray-300 rounded-lg text-[10px] font-bold shadow">
              <Lock className="w-2.5 h-2.5" /> Draft
            </span>
          )}
        </div>

        {/* Published dot */}
        {note.isPublished && (
          <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
        )}
      </div>

      <div className="p-4 sm:p-5">
        {/* Title */}
        <h3 className={`text-base sm:text-lg font-bold mb-2 line-clamp-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{note.title}</h3>

        {/* Subject + Class tags */}
        <div className="flex flex-wrap gap-1.5 mb-2 sm:mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${dm ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>{note.subject}</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${dm ? 'bg-blue-900/60 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{note.class}</span>
          {note.fileType && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${dm ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{note.fileType}</span>
          )}
        </div>

        {note.description && (
          <p className={`text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{note.description}</p>
        )}

        {note.topic && (
          <p className={`text-xs mb-3 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
            <span className="font-semibold">Topic:</span> {note.topic}
          </p>
        )}

        {/* Stats */}
        <div className={`grid grid-cols-4 gap-1.5 sm:gap-2 mb-4 pb-4 border-b ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
          {[
            { label: 'Downloads', value: note.downloads },
            { label: 'Views',     value: note.views     },
            { label: 'Saved',     value: note.stats.totalBookmarks },
            { label: 'Price',     value: `₹${note.price}` },
          ].map(({ label, value }) => (
            <div key={label} className={`text-center py-2 rounded-xl ${dm ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
              <p className={`text-[9px] sm:text-[10px] mb-0.5 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{label}</p>
              <p className={`text-xs sm:text-sm font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-5 gap-1.5">
          {/* Pin */}
          <button
            onClick={() => onTogglePin(note.id)}
            title={note.isPinned ? 'Unpin' : 'Pin'}
            className={`py-2 rounded-xl transition text-xs font-semibold flex items-center justify-center gap-1 ${
              note.isPinned
                ? dm ? 'bg-amber-900/50 text-amber-400 hover:bg-amber-900/70' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : dm ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          {/* Publish */}
          <button
            onClick={() => onTogglePublish(note.id)}
            title={note.isPublished ? 'Unpublish' : 'Publish'}
            className={`py-2 rounded-xl transition text-xs font-semibold flex items-center justify-center ${
              note.isPublished
                ? dm ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70' : 'bg-green-100 text-green-700 hover:bg-green-200'
                : dm ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {note.isPublished ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          </button>

          {/* View */}
          <a
            href={note.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="View file"
            className={`py-2 rounded-xl transition text-xs font-semibold flex items-center justify-center ${
              dm ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/70' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </a>

          {/* Edit */}
          <button
            onClick={onEdit}
            title="Edit note"
            className={`py-2 rounded-xl transition text-xs font-semibold flex items-center justify-center ${
              dm ? 'bg-indigo-900/50 text-indigo-400 hover:bg-indigo-900/70' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(note.id)}
            title="Delete note"
            className={`py-2 rounded-xl transition text-xs font-semibold flex items-center justify-center ${
              dm ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70' : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Date */}
        <p className={`text-[10px] text-center mt-2.5 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>
          Added {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Note Form Modal — top-level component, never remounted by parent
// filters/search/typing in the list can't touch it
// ═══════════════════════════════════════════════════════════════════
function NoteFormModal({
  mode, note, darkMode, onClose, onSuccess,
}: {
  mode: 'create' | 'edit';
  note?: Note;
  darkMode: boolean;
  onClose: () => void;
  onSuccess: (note: Note) => void;
}) {
  const dm     = darkMode;
  const s      = useStyles(dm);
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
    title:       note?.title       ?? '',
    description: note?.description ?? '',
    subject:     note?.subject     ?? '',
    class:       note?.class       ?? '',
    topic:       note?.topic       ?? '',
    chapter:     note?.chapter     ?? '',
    price:       note?.price       ?? 30,
    isPublished: note?.isPublished ?? true,
    isPinned:    note?.isPinned    ?? false,
  });

  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: string; type: string } | null>(
    note ? { url: note.fileUrl, name: note.fileName, size: note.fileSize, type: note.fileType } : null
  );
  const [uploadedThumbnail, setUploadedThumbnail] = useState<{ url: string; name: string } | null>(
    note?.thumbnailUrl ? { url: note.thumbnailUrl, name: 'Current thumbnail' } : null
  );
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);

  // field helper
  const set = <K extends keyof typeof formData>(key: K, val: (typeof formData)[K]) =>
    setFormData(p => ({ ...p, [key]: val }));

  const { startUpload: uploadFile, isUploading: isUploadingFile } = useUploadThing('notesFile', {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        const f = res[0];
        const t = f.type?.includes('pdf') ? 'pdf' : f.type?.includes('image') ? 'image' : 'doc';
        setUploadedFile({ url: f.url, name: f.name, size: `${(f.size / 1024 / 1024).toFixed(2)} MB`, type: t });
        setUploading(false);
      }
    },
    onUploadError: (err: Error) => { alert(`Upload failed: ${err.message}`); setUploading(false); },
  });

  const { startUpload: uploadThumb, isUploading: isUploadingThumb } = useUploadThing('notesThumbnail', {
    onClientUploadComplete: (res) => {
      if (res?.[0]) setUploadedThumbnail({ url: res[0].url, name: res[0].name });
    },
    onUploadError: (err: Error) => alert(`Thumbnail upload failed: ${err.message}`),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Please upload a PDF or image file'); return;
    }
    if (file.size > 32 * 1024 * 1024) { alert('File size must be less than 32MB'); return; }
    setUploading(true);
    await uploadFile([file]);
  };

  const handleThumbChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/'))    { alert('Please upload an image'); return; }
    if (file.size > 4 * 1024 * 1024)       { alert('Thumbnail < 4MB please'); return; }
    await uploadThumb([file]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.class || !uploadedFile) {
      alert('Please fill in all required fields and upload a file'); return;
    }
    if (formData.price < 0) { alert('Price cannot be negative'); return; }

    setSaving(true);
    try {
      const payload = {
        title:        formData.title,
        description:  formData.description  || null,
        subject:      formData.subject,
        class:        formData.class,
        topic:        formData.topic        || null,
        chapter:      formData.chapter      || null,
        fileUrl:      uploadedFile.url,
        fileName:     uploadedFile.name,
        fileType:     uploadedFile.type,
        fileSize:     uploadedFile.size,
        thumbnailUrl: uploadedThumbnail?.url || null,
        price:        formData.price,
        isPublished:  formData.isPublished,
        isPinned:     formData.isPinned,
        ...(isEdit ? { noteId: note!.id } : {}),
      };

      const res  = await fetch('/api/teacher/notes', {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        onSuccess(data.note);
      } else {
        alert(`Failed to ${isEdit ? 'update' : 'upload'} note: ` + data.error);
      }
    } catch { alert('An error occurred'); }
    finally { setSaving(false); }
  };

  const isBusy = saving || uploading || isUploadingFile;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl ${dm ? 'bg-gray-900' : 'bg-white'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b-2 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50'}`}>
          <div>
            <h3 className={`text-xl sm:text-2xl font-bold ${s.textPrimary}`}>
              {isEdit ? 'Edit Note' : 'Upload New Note'}
            </h3>
            <p className={`text-xs sm:text-sm mt-0.5 ${s.textMuted}`}>
              {isEdit ? 'Update details below' : 'Fill in details and upload your file'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">

            {/* Title */}
            <div>
              <label className={s.label}>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g., Organic Chemistry Chapter 5"
                required
                className={s.input}
              />
            </div>

            {/* Description */}
            <div>
              <label className={s.label}>Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Brief description of the note content..."
                className={`${s.input} resize-none`}
              />
            </div>

            {/* Subject + Class */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className={s.label}>Subject *</label>
                <input type="text" value={formData.subject} onChange={e => set('subject', e.target.value)}
                  placeholder="e.g., Chemistry" required className={s.input} />
              </div>
              <div>
                <label className={s.label}>Class *</label>
                <input type="text" value={formData.class} onChange={e => set('class', e.target.value)}
                  placeholder="e.g., Class 12" required className={s.input} />
              </div>
            </div>

            {/* Topic + Chapter */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className={s.label}>Topic</label>
                <input type="text" value={formData.topic} onChange={e => set('topic', e.target.value)}
                  placeholder="e.g., Alcohols and Phenols" className={s.input} />
              </div>
              <div>
                <label className={s.label}>Chapter</label>
                <input type="text" value={formData.chapter} onChange={e => set('chapter', e.target.value)}
                  placeholder="e.g., Chapter 11" className={s.input} />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className={s.label}>Hardcopy Price (₹) *</label>
              <div className="relative">
                <IndianRupee className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => set('price', parseInt(e.target.value) || 0)}
                  placeholder="30"
                  min="0"
                  step="5"
                  required
                  className={`${s.input} pl-9 sm:pl-10`}
                />
              </div>
              <p className={`text-xs mt-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                Price when students order a physical hardcopy. Default ₹30.
              </p>
            </div>

            {/* File upload */}
            <div>
              <label className={s.label}>Upload File (PDF or Image) *</label>
              {uploadedFile ? (
                <div className={`border-2 rounded-xl p-3 sm:p-4 flex items-center justify-between ${dm ? 'border-green-700 bg-green-900/20' : 'border-green-300 bg-green-50'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${dm ? 'bg-green-800' : 'bg-green-100'}`}>
                      <FileText className={`w-5 h-5 ${dm ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${s.textPrimary}`}>{uploadedFile.name}</p>
                      <p className={`text-xs ${s.textMuted}`}>{uploadedFile.size} · {uploadedFile.type.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <button type="button" onClick={() => setUploadedFile(null)}
                      className={`p-1.5 rounded-lg transition ${dm ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center hover:border-purple-500 transition cursor-pointer block ${dm ? 'border-gray-600 hover:bg-gray-800/50' : 'border-gray-300 hover:bg-purple-50/50'}`}>
                  <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={handleFileChange} className="hidden" disabled={isBusy} />
                  {uploading || isUploadingFile ? (
                    <>
                      <Loader className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-2" />
                      <p className="text-purple-500 font-medium text-sm">Uploading...</p>
                      <p className={`text-xs mt-1 ${s.textMuted}`}>Please wait</p>
                    </>
                  ) : (
                    <>
                      <Upload className={`w-10 h-10 mx-auto mb-2 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={`font-semibold text-sm sm:text-base mb-1 ${s.textPrimary}`}>Click to upload file</p>
                      <p className={`text-xs ${s.textMuted}`}>PDF or Image · Max 32MB</p>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label className={s.label}>Thumbnail <span className={s.textMuted}>(Optional)</span></label>
              {uploadedThumbnail ? (
                <div className={`border-2 rounded-xl p-3 sm:p-4 flex items-center justify-between ${dm ? 'border-green-700 bg-green-900/20' : 'border-green-300 bg-green-50'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={uploadedThumbnail.url} alt="Thumbnail" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border-2 border-white/20" />
                    <p className={`font-semibold text-sm truncate ${s.textPrimary}`}>{uploadedThumbnail.name}</p>
                  </div>
                  <button type="button" onClick={() => setUploadedThumbnail(null)}
                    className={`p-1.5 rounded-lg transition flex-shrink-0 ml-2 ${dm ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <label className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center hover:border-purple-400 transition cursor-pointer block ${dm ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input type="file" accept="image/*" onChange={handleThumbChange} className="hidden" disabled={isUploadingThumb} />
                  {isUploadingThumb
                    ? <Loader className="w-7 h-7 text-purple-500 animate-spin mx-auto" />
                    : (
                      <>
                        <ImageIcon className={`w-7 h-7 mx-auto mb-1.5 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
                        <p className={`text-xs sm:text-sm ${s.textMuted}`}>Upload cover image · Max 4MB</p>
                      </>
                    )}
                </label>
              )}
            </div>

            {/* Publish + Pin toggles */}
            <div className={`rounded-xl border-2 p-4 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${s.textMuted}`}>Settings</p>
              <div className="space-y-3">
                {([
                  { key: 'isPublished', label: 'Publish immediately', desc: 'Students can see this note right away' },
                  { key: 'isPinned',    label: 'Pin to top',          desc: 'This note will appear first in the list' },
                ] as const).map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center justify-between gap-4 cursor-pointer">
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${s.textPrimary}`}>{label}</p>
                      <p className={`text-xs ${s.textMuted}`}>{desc}</p>
                    </div>
                    <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${formData[key] ? 'bg-purple-600' : dm ? 'bg-gray-600' : 'bg-gray-300'}`}
                      onClick={() => set(key, !formData[key])}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${formData[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 sm:p-6 border-t-2 flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 sm:px-6 py-2.5 border-2 rounded-xl transition font-semibold text-sm ${dm ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy || !uploadedFile}
              className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              {saving
                ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Upload className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Upload Note'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}