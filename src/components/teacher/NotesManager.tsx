'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUploadThing } from '@/lib/uploadthing';
import {
  FileText, Plus, Search, Download, Eye, Bookmark,
  Trash2, Edit, Pin, Upload, Loader, X,
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

// ── Dark mode hook (same MutationObserver pattern) ────────────────────────────
function useDarkMode() {
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dm;
}

// ── Shared style helpers ──────────────────────────────────────────────────────
function useStyles(dm: boolean) {
  return {
    card:   `rounded-xl sm:rounded-2xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`,
    input:  `w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm sm:text-base ${
              dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
            }`,
    label:  `block text-xs sm:text-sm font-semibold mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`,
    textPrimary: dm ? 'text-white'     : 'text-gray-900',
    textMuted:   dm ? 'text-gray-400'  : 'text-gray-600',
  };
}

// ═════════════════════════════════════════════════════════════════════════════
export default function NotesManager() {
  const dm = useDarkMode();
  const s  = useStyles(dm);

  const [notes,            setNotes]            = useState<Note[]>([]);
  const [filteredNotes,    setFilteredNotes]    = useState<Note[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [selectedSubject,  setSelectedSubject]  = useState('all');
  const [selectedClass,    setSelectedClass]    = useState('all');
  const [showCreateModal,  setShowCreateModal]  = useState(false);
  const [editingNote,      setEditingNote]      = useState<Note | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/teacher/notes');
      const data = await res.json();
      if (data.success) { setNotes(data.notes); setFilteredNotes(data.notes); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotes(); }, []);

  useEffect(() => {
    let f = notes;
    if (searchQuery)           f = f.filter(n =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.topic?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (selectedSubject !== 'all') f = f.filter(n => n.subject === selectedSubject);
    if (selectedClass   !== 'all') f = f.filter(n => n.class   === selectedClass);
    setFilteredNotes(f);
  }, [searchQuery, selectedSubject, selectedClass, notes]);

  const subjects = Array.from(new Set(notes.map(n => n.subject)));
  const classes  = Array.from(new Set(notes.map(n => n.class)));

  const totalDownloads = notes.reduce((s, n) => s + n.downloads,            0);
  const totalViews     = notes.reduce((s, n) => s + n.views,                0);
  const totalBookmarks = notes.reduce((s, n) => s + n.stats.totalBookmarks, 0);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const data = await (await fetch(`/api/teacher/notes?id=${id}`, { method: 'DELETE' })).json();
      if (data.success) { setNotes(p => p.filter(n => n.id !== id)); alert('Note deleted successfully'); }
      else alert('Failed to delete note');
    } catch { alert('An error occurred'); }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const data = await (await fetch('/api/teacher/notes', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id, action: 'toggle-publish' }),
      })).json();
      if (data.success) fetchNotes();
    } catch { /* silent */ }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const data = await (await fetch('/api/teacher/notes', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id, action: 'toggle-pin' }),
      })).json();
      if (data.success) fetchNotes();
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${dm ? 'bg-gray-900' : ''}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className={`font-semibold ${s.textMuted}`}>Loading notes...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: FileText,  bg: dm ? 'bg-blue-900'  : 'bg-blue-100',  color: 'text-blue-500',  value: notes.length,   label: 'Total Notes'     },
    { icon: Download,  bg: dm ? 'bg-green-900' : 'bg-green-100', color: 'text-green-500', value: totalDownloads, label: 'Total Downloads' },
    { icon: Eye,       bg: dm ? 'bg-orange-900': 'bg-orange-100',color: 'text-orange-500',value: totalViews,     label: 'Total Views'     },
    { icon: Bookmark,  bg: dm ? 'bg-purple-900': 'bg-purple-100',color: 'text-purple-500',value: totalBookmarks, label: 'Total Bookmarks' },
  ];

  return (
    <div className={`p-3 sm:p-6 lg:p-8 min-h-screen transition-colors ${dm ? 'bg-gray-900' : ''}`}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-1 ${s.textPrimary}`}>Notes Manager</h1>
          <p className={`text-sm sm:text-base ${s.textMuted}`}>Upload and manage study materials for students</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
          <button onClick={fetchNotes}
            className={`p-2.5 sm:p-3 border-2 rounded-xl transition ${dm ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Upload Note
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
        {statCards.map(({ icon: Icon, bg, color, value, label }, i) => (
          <div key={i} className={`${s.card} p-4 sm:p-5 lg:p-6 hover:shadow-lg transition-shadow`}>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${bg} rounded-xl flex items-center justify-center mb-3 sm:mb-4`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold mb-0.5 ${s.textPrimary}`}>{value}</p>
            <p className={`text-xs sm:text-sm ${s.textMuted}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`${s.card} p-3 sm:p-5 lg:p-6 mb-5 sm:mb-6`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input type="text" placeholder="Search notes..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`${s.input} pl-9 sm:pl-10`} />
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
      </div>

      {/* Notes grid / empty state */}
      {filteredNotes.length === 0 ? (
        <div className={`${s.card} p-10 sm:p-12 text-center`}>
          <FileText className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg sm:text-xl font-bold mb-2 ${s.textPrimary}`}>
            {searchQuery || selectedSubject !== 'all' || selectedClass !== 'all' ? 'No notes match your filters' : 'No notes yet'}
          </h3>
          <p className={`text-sm sm:text-base mb-5 ${s.textMuted}`}>
            {searchQuery || selectedSubject !== 'all' || selectedClass !== 'all' ? 'Try adjusting your search or filters' : 'Upload your first note to get started'}
          </p>
          {!searchQuery && selectedSubject === 'all' && selectedClass === 'all' && (
            <button onClick={() => setShowCreateModal(true)}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold text-sm sm:text-base">
              Upload Note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredNotes.map(note => (
            <NoteCard key={note.id} note={note} darkMode={dm}
              onDelete={handleDelete}
              onTogglePublish={handleTogglePublish}
              onTogglePin={handleTogglePin}
              onEdit={() => setEditingNote(note)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <NoteFormModal
          mode="create"
          darkMode={dm}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchNotes(); }}
        />
      )}

      {/* Edit modal */}
      {editingNote && (
        <NoteFormModal
          mode="edit"
          note={editingNote}
          darkMode={dm}
          onClose={() => setEditingNote(null)}
          onSuccess={() => { setEditingNote(null); fetchNotes(); }}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Note Card
// ═════════════════════════════════════════════════════════════════════════════
function NoteCard({
  note, darkMode,
  onDelete, onTogglePublish, onTogglePin, onEdit,
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
    <div className={`rounded-xl sm:rounded-2xl border-2 hover:shadow-2xl transition-all overflow-hidden ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Thumbnail */}
      <div className={`h-40 sm:h-48 relative flex items-center justify-center ${dm ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50' : 'bg-gradient-to-br from-purple-100 to-pink-100'}`}>
        {note.thumbnailUrl
          ? <img src={note.thumbnailUrl} alt={note.title} className="w-full h-full object-cover" />
          : <FileText className={`w-14 h-14 sm:w-16 sm:h-16 ${dm ? 'text-purple-400' : 'text-purple-400'}`} />}
        {note.isPinned && (
          <div className="absolute top-2.5 right-2.5 bg-yellow-500 text-white p-1.5 sm:p-2 rounded-lg shadow">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 lg:p-6">
        {/* Title + badges */}
        <h3 className={`text-base sm:text-lg font-bold mb-2 line-clamp-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{note.title}</h3>
        <div className="flex flex-wrap gap-1.5 mb-2 sm:mb-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${dm ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>{note.subject}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{note.class}</span>
          {!note.isPublished && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              <Lock className="w-2.5 h-2.5" /> Draft
            </span>
          )}
        </div>

        {note.description && (
          <p className={`text-xs sm:text-sm mb-3 line-clamp-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{note.description}</p>
        )}
        {note.topic && (
          <p className={`text-xs mb-3 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
            <span className="font-semibold">Topic:</span> {note.topic}
          </p>
        )}

        {/* Stats row */}
        <div className={`grid grid-cols-3 gap-2 mb-4 pb-4 border-b ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
          {[
            { label: 'Downloads', value: note.downloads },
            { label: 'Views',     value: note.views     },
            { label: 'Bookmarks', value: note.stats.totalBookmarks },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className={`text-xs mb-0.5 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{label}</p>
              <p className={`text-base sm:text-lg font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Pin */}
          <button onClick={() => onTogglePin(note.id)} title={note.isPinned ? 'Unpin' : 'Pin'}
            className={`flex-1 py-2 rounded-lg transition text-sm font-semibold flex items-center justify-center ${
              note.isPinned
                ? dm ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900/70' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            <Pin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Publish toggle */}
          <button onClick={() => onTogglePublish(note.id)} title={note.isPublished ? 'Unpublish' : 'Publish'}
            className={`flex-1 py-2 rounded-lg transition text-sm font-semibold flex items-center justify-center ${
              note.isPublished
                ? dm ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70' : 'bg-green-100 text-green-700 hover:bg-green-200'
                : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {note.isPublished ? <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* View */}
          <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" title="View file"
            className={`flex-1 py-2 rounded-lg transition text-sm font-semibold flex items-center justify-center ${
              dm ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/70' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}>
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>

          {/* Edit */}
          <button onClick={onEdit} title="Edit note"
            className={`flex-1 py-2 rounded-lg transition text-sm font-semibold flex items-center justify-center ${
              dm ? 'bg-indigo-900/50 text-indigo-400 hover:bg-indigo-900/70' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}>
            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Delete */}
          <button onClick={() => onDelete(note.id)} title="Delete note"
            className={`flex-1 py-2 rounded-lg transition text-sm font-semibold flex items-center justify-center ${
              dm ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70' : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}>
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Note Form Modal — handles both Create & Edit
// ═════════════════════════════════════════════════════════════════════════════
function NoteFormModal({
  mode, note, darkMode, onClose, onSuccess,
}: {
  mode: 'create' | 'edit';
  note?: Note;
  darkMode: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const dm = darkMode;
  const s  = useStyles(dm);
  const isEdit = mode === 'edit';

  const [formData, setFormData] = useState({
    title:       note?.title       || '',
    description: note?.description || '',
    subject:     note?.subject     || '',
    class:       note?.class       || '',
    topic:       note?.topic       || '',
    chapter:     note?.chapter     || '',
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
    const valid = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!valid.includes(file.type)) { alert('Please upload a PDF or image file'); return; }
    if (file.size > 32 * 1024 * 1024) { alert('File size must be less than 32MB'); return; }
    setUploading(true);
    await uploadFile([file]);
  };

  const handleThumbChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
    if (file.size > 4 * 1024 * 1024) { alert('Thumbnail size must be less than 4MB'); return; }
    await uploadThumb([file]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.class || !uploadedFile) {
      alert('Please fill in all required fields and upload a file'); return;
    }
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
        alert(isEdit ? 'Note updated successfully!' : 'Note uploaded successfully!');
        onSuccess();
      } else {
        alert(`Failed to ${isEdit ? 'update' : 'upload'} note: ` + data.error);
      }
    } catch { alert('An error occurred'); }
    finally { setSaving(false); }
  };

  // shared input field renderer
  const Field = ({ label, name, placeholder, type = 'text', required = false, colSpan = '' }: {
    label: string; name: string; placeholder: string; type?: string; required?: boolean; colSpan?: string;
  }) => (
    <div className={colSpan}>
      <label className={s.label}>{label}{required && ' *'}</label>
      <input type={type} value={(formData as any)[name]} placeholder={placeholder} required={required}
        onChange={e => setFormData(p => ({ ...p, [name]: e.target.value }))}
        className={s.input} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl ${dm ? 'bg-gray-900' : 'bg-white'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b-2 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50'}`}>
          <div className="min-w-0 pr-4">
            <h3 className={`text-xl sm:text-2xl font-bold ${s.textPrimary}`}>
              {isEdit ? 'Edit Note' : 'Upload New Note'}
            </h3>
            <p className={`text-xs sm:text-sm mt-0.5 ${s.textMuted}`}>
              {isEdit ? 'Update the details below and save changes' : 'Fill in the details and upload your file'}
            </p>
          </div>
          <button onClick={onClose}
            className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">

            {/* Title */}
            <Field label="Title" name="title" placeholder="e.g., Organic Chemistry Chapter 5" required />

            {/* Description */}
            <div>
              <label className={s.label}>Description</label>
              <textarea rows={3} value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of the note content..."
                className={`${s.input} resize-none`} />
            </div>

            {/* Subject + Class */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              <Field label="Subject" name="subject" placeholder="e.g., Chemistry" required />
              <Field label="Class"   name="class"   placeholder="e.g., Class 12"  required />
            </div>

            {/* Topic + Chapter */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              <Field label="Topic"   name="topic"   placeholder="e.g., Alcohols and Phenols" />
              <Field label="Chapter" name="chapter" placeholder="e.g., Chapter 11" />
            </div>

            {/* File upload */}
            <div>
              <label className={s.label}>Upload File (PDF or Image) *</label>
              {uploadedFile ? (
                <div className={`border-2 rounded-xl p-3 sm:p-4 flex items-center justify-between ${dm ? 'border-green-700 bg-green-900/30' : 'border-green-300 bg-green-50'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? 'bg-green-800' : 'bg-green-100'}`}>
                      <FileText className={`w-5 h-5 sm:w-6 sm:h-6 ${dm ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${s.textPrimary}`}>{uploadedFile.name}</p>
                      <p className={`text-xs ${s.textMuted}`}>{uploadedFile.size}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setUploadedFile(null)}
                    className={`p-2 rounded-lg transition flex-shrink-0 ml-2 ${dm ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}>
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  </button>
                </div>
              ) : (
                <label className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center hover:border-purple-500 transition cursor-pointer block ${dm ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={handleFileChange} className="hidden" disabled={uploading || isUploadingFile} />
                  {uploading || isUploadingFile ? (
                    <><Loader className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 animate-spin mx-auto mb-2" /><p className="text-purple-500 font-medium text-sm sm:text-base">Uploading...</p></>
                  ) : (
                    <><Upload className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={`mb-1 font-medium text-sm sm:text-base ${s.textMuted}`}>Click to upload file</p>
                    <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>PDF or Image (Max 32MB)</p></>
                  )}
                </label>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label className={s.label}>Thumbnail (Optional)</label>
              {uploadedThumbnail ? (
                <div className={`border-2 rounded-xl p-3 sm:p-4 flex items-center justify-between ${dm ? 'border-green-700 bg-green-900/30' : 'border-green-300 bg-green-50'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <img src={uploadedThumbnail.url} alt="Thumbnail" className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0" />
                    <p className={`font-semibold text-sm truncate ${s.textPrimary}`}>{uploadedThumbnail.name}</p>
                  </div>
                  <button type="button" onClick={() => setUploadedThumbnail(null)}
                    className={`p-2 rounded-lg transition flex-shrink-0 ml-2 ${dm ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <label className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center hover:border-purple-500 transition cursor-pointer block ${dm ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input type="file" accept="image/*" onChange={handleThumbChange} className="hidden" disabled={isUploadingThumb} />
                  {isUploadingThumb
                    ? <Loader className="w-7 h-7 sm:w-8 sm:h-8 text-purple-500 animate-spin mx-auto" />
                    : <><ImageIcon className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-1.5 ${dm ? 'text-gray-500' : 'text-gray-400'}`} /><p className={`text-xs sm:text-sm ${s.textMuted}`}>Upload thumbnail</p></>}
                </label>
              )}
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {[
                { key: 'isPublished', label: 'Publish immediately' },
                { key: 'isPinned',    label: 'Pin to top' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(formData as any)[key]}
                    onChange={e => setFormData(p => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
                  <span className={`text-xs sm:text-sm font-medium ${s.textPrimary}`}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 sm:p-6 border-t-2 flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <button type="button" onClick={onClose}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 border-2 rounded-xl transition font-semibold text-sm sm:text-base ${dm ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              Cancel
            </button>
            <button type="submit"
              disabled={saving || uploading || isUploadingFile || !uploadedFile}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base">
              {saving
                ? <><Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />Saving...</>
                : <><Upload className="w-4 h-4 sm:w-5 sm:h-5" />{isEdit ? 'Save Changes' : 'Upload Note'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}