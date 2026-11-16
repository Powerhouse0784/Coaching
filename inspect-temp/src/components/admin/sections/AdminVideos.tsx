/**
 * FILE: src/components/admin/sections/AdminVideos.tsx
 *
 * Usage:
 *   import AdminVideos from '@/components/admin/sections/AdminVideos';
 *   {activeSection === 'videos' && <AdminVideos />}
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Trash2, Loader, AlertCircle,
  ChevronLeft, ChevronRight, Video, Eye, Play, Globe, Lock,
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

export default function AdminVideos() {
  const dm = useDarkMode();
  const [items,   setItems]   = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const LIMIT = 12;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), search });
      const data = await adminFetch(`videos?${params}`);
      if (data.success) { setItems(data.folders ?? []); setTotal(data.total ?? 0); }
      else setError(data.error || 'Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const del = async (item: any) => {
    if (!confirm(`Delete folder "${item.name}" and ALL ${item._count?.videos ?? 0} videos inside? Cannot be undone.`)) return;
    await adminFetch(`videos/${item.id}`, { method: 'DELETE' });
    load();
  };

  const totalPages = Math.ceil(total / LIMIT);
  const tp   = dm ? 'text-white' : 'text-gray-900';
  const tm   = dm ? 'text-gray-400' : 'text-gray-500';
  const card = `rounded-2xl border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const inputCls = `px-3 py-2 border-2 rounded-xl text-sm outline-none transition ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tm}`} />
          <input type="text" placeholder="Search folders…" value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} w-full pl-9`} />
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${tm}`}>{total} folders</span>
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

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader className="w-8 h-8 text-orange-500 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <Video className={`w-12 h-12 mx-auto mb-3 ${tm}`} />
          <p className={`font-semibold ${tp}`}>No video folders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(folder => {
            const totalViews = (folder.videos ?? []).reduce((s: number, v: any) => s + (v.views ?? 0), 0);
            return (
              <div key={folder.id} className={`${card} p-4 hover:shadow-lg transition-shadow`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <button onClick={() => del(folder)} className={`p-1.5 rounded-lg ml-auto transition-colors ${dm ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className={`font-bold text-sm mb-1 ${tp}`}>{folder.name}</h3>
                <p className={`text-xs ${tm} mb-2`}>{folder.teacher?.user?.name ?? 'Unknown'}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="px-2 py-0.5 bg-red-500/15 text-red-400 rounded-full text-xs font-semibold">{folder.subject}</span>
                  <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-full text-xs font-semibold">Class {folder.class}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${folder.isPublic ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
                    {folder.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {folder.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                <div className={`flex items-center gap-4 text-xs ${tm}`}>
                  <span className="flex items-center gap-1"><Play className="w-3 h-3" />{folder._count?.videos ?? 0} videos</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{totalViews.toLocaleString()} views</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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