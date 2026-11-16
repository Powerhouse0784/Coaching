/**
 * FILE: src/components/admin/sections/AdminNotes.tsx
 *
 * Plug this into your admin page wherever you render the 'notes' section.
 * It reads/updates notes via /api/admin/notes using your unified route.
 *
 * Usage in your admin page:
 *   import AdminNotes from '@/components/admin/sections/AdminNotes';
 *   ...
 *   {activeSection === 'notes' && <AdminNotes />}
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Eye, EyeOff, Trash2, Pin, PinOff,
  Loader, AlertCircle, ChevronLeft, ChevronRight,
  FileText, Download, BookOpen, Filter,
} from 'lucide-react';

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

function adminFetch(path: string, opts: RequestInit = {}) {
  const token = sessionStorage.getItem('admin_auth') || '';
  return fetch(`/api/admin/${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  }).then(r => r.json());
}

export default function AdminNotes() {
  const dm = useDarkMode();
  const [notes,   setNotes]   = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), search });
      if (subject) params.set('subject', subject);
      const data = await adminFetch(`notes?${params}`);
      if (data.success) { setNotes(data.notes ?? []); setTotal(data.total ?? 0); }
      else setError(data.error || 'Failed to load notes');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [page, search, subject]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, subject]);

  const togglePublish = async (note: any) => {
    await adminFetch(`notes/${note.id}`, { method: 'PATCH', body: JSON.stringify({ isPublished: !note.isPublished }) });
    load();
  };
  const togglePin = async (note: any) => {
    await adminFetch(`notes/${note.id}`, { method: 'PATCH', body: JSON.stringify({ isPinned: !note.isPinned }) });
    load();
  };
  const deleteNote = async (note: any) => {
    if (!confirm(`Delete "${note.title}" permanently?`)) return;
    await adminFetch(`notes/${note.id}`, { method: 'DELETE' });
    load();
  };

  const totalPages = Math.ceil(total / LIMIT);
  const tp = dm ? 'text-white' : 'text-gray-900';
  const tm = dm ? 'text-gray-400' : 'text-gray-500';
  const card = `rounded-2xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const inputCls = `px-3 py-2 border-2 rounded-xl text-sm outline-none transition ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'}`;

  // Collect unique subjects for filter
  const subjects = [...new Set(notes.map(n => n.subject).filter(Boolean))];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tm}`} />
          <input type="text" placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} w-full pl-9`} />
        </div>
        <select value={subject} onChange={e => setSubject(e.target.value)} className={`${inputCls} min-w-[140px]`}>
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${tm}`}>{total} notes</span>
          <button onClick={load} className={`p-2 rounded-xl transition ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={load} className="ml-auto px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold">Retry</button>
        </div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <BookOpen className={`w-12 h-12 mx-auto mb-3 ${tm}`} />
          <p className={`font-semibold ${tp}`}>No notes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {notes.map(note => (
            <div key={note.id} className={`${card} p-4 hover:shadow-lg transition-shadow`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm truncate ${tp}`}>{note.title}</h3>
                  <p className={`text-xs mt-0.5 ${tm}`}>{note.teacher?.user?.name ?? 'Unknown teacher'}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {note.isPinned
                    ? <span className="px-1.5 py-0.5 bg-orange-500/15 text-orange-400 rounded-md text-xs font-semibold">Pinned</span>
                    : null}
                </div>
              </div>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="px-2 py-0.5 bg-purple-500/15 text-purple-400 rounded-full text-xs font-semibold">{note.subject}</span>
                <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-full text-xs font-semibold">Class {note.class}</span>
                {note.topic && <span className="px-2 py-0.5 bg-gray-500/15 text-gray-400 rounded-full text-xs">{note.topic}</span>}
              </div>

              {/* Stats */}
              <div className={`flex items-center gap-4 text-xs ${tm} mb-3`}>
                <span className="flex items-center gap-1"><Download className="w-3 h-3" />{note.downloads ?? 0}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{note.views ?? 0}</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{note._count?.bookmarks ?? 0} saves</span>
              </div>

              {/* Status + Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-700/30">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  note.isPublished ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {note.isPublished ? '● Published' : '● Draft'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => togglePin(note)} title={note.isPinned ? 'Unpin' : 'Pin'}
                    className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-orange-500/20 text-orange-400' : 'hover:bg-orange-50 text-orange-500'}`}>
                    {note.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => togglePublish(note)} title={note.isPublished ? 'Unpublish' : 'Publish'}
                    className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-50 text-blue-500'}`}>
                    {note.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteNote(note)} title="Delete"
                    className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition ${page === 1 ? 'opacity-40 cursor-not-allowed' : dm ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
            <ChevronLeft className="w-4 h-4" />Prev
          </button>
          <span className={`text-sm ${tm}`}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition ${page === totalPages ? 'opacity-40 cursor-not-allowed' : dm ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
            Next<ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}