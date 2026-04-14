'use client';

/**
 * INTENSE LEARNERS — Admin Control Panel
 * Styled to match TeacherDashboard (indigo/purple hero, same navbar, coaching logo)
 * Full admin CRUD functionality preserved from existing admin code.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Flame, Lock, Mail, Eye, EyeOff, AlertCircle,
  LayoutDashboard, Users, GraduationCap, FileText,
  MessageSquare, Video, CreditCard, BookOpen,
  LogOut, Moon, Sun, Menu, X, Shield,
  ChevronRight, ChevronLeft, Loader, CheckCircle2, XCircle,
  Search, RefreshCw, Trash2, ToggleLeft, Sparkles,
  ArrowLeft, Home, Zap, Star, DollarSign, Trophy,
  Plus, ArrowRight, BookMarked, Brain, Calendar, Play,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Dark mode hook (same MutationObserver pattern as all other components)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Coaching Logo — matches TeacherDashboard exactly
// ─────────────────────────────────────────────────────────────────────────────
function CoachingLogo({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <Image
      src="/coaching-icon.png"
      alt="Intense Learners"
      width={48}
      height={48}
      className={className}
      priority
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type AdminSection = 'dashboard' | 'notes' | 'assignments' | 'users' | 'doubts' | 'videos' | 'payments';

interface Stats {
  students:    { total: number; active: number };
  teachers:    { total: number; active: number };
  notes:       { total: number; published: number };
  assignments: { total: number; submitted: number };
  doubts:      { total: number; pending: number; solved: number };
  videos:      { total: number; folders: number };
  payments:    { total: number; revenue: string; pending: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// API helper (sends admin Bearer token automatically)
// ─────────────────────────────────────────────────────────────────────────────
function adminFetch(path: string, opts: RequestInit = {}) {
  const token = sessionStorage.getItem('admin_auth') || '';
  return fetch(`/api/admin/${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Login Screen — dark, branded, same Flame icon as Teacher hero
// ─────────────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then(r => r.json());

      if (data.success) { sessionStorage.setItem('admin_auth', data.token); onLogin(); }
      else setError(data.error || 'Invalid credentials');
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Same background blobs as TeacherDashboard hero */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo — same as TeacherDashboard */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
              <CoachingLogo />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Intense Learners</h1>
          <div className="flex items-center justify-center gap-2 text-purple-200 text-sm">
            <Shield className="w-4 h-4" />
            <span className="font-semibold">Admin Control Panel</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl shadow-2xl p-6 sm:p-8 bg-white/10 backdrop-blur-xl border border-white/15">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Admin Sign In</h2>
          <p className="text-purple-200 text-sm mb-6">Restricted access — authorised personnel only</p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-900/40 border border-red-700 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-100 mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@intenseLearners.com" required
                  className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-100 mb-1.5">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" required
                  className="w-full pl-11 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition text-sm" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 py-3 rounded-xl font-bold hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><Loader className="w-5 h-5 animate-spin" />Authenticating...</>
                : <><Shield className="w-5 h-5" />Access Dashboard</>}
            </button>
          </form>

          <p className="text-center text-xs text-purple-400 mt-5">
            Unauthorised access is prohibited and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic badge + pill helpers
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
    }`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {ok ? yes : no}
    </span>
  );
}

function Pill({ text, color }: { text: string; color: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{text}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic Data Table
// ─────────────────────────────────────────────────────────────────────────────
interface ColDef { label: string; key: string; render?: (row: any) => React.ReactNode; width?: string; }
interface RowAction { label: string; icon: React.ElementType; color: string; onClick: (row: any) => void; confirm?: string; }

function DataTable({ endpoint, cols, actions = [], refreshKey = 0 }: {
  endpoint: string; cols: ColDef[]; actions?: RowAction[]; refreshKey?: number;
}) {
  const dm = useDarkMode();
  const [rows,    setRows]    = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), search: search.trim() });
      const data   = await adminFetch(`${endpoint}?${params}`);
      if (data.success) {
        const arr = data.users || data.notes || data.assignments || data.doubts || data.folders || data.payments || data.data || [];
        setRows(arr); setTotal(data.total ?? arr.length);
      } else setError(data.error || 'Failed to load');
    } catch (e: any) { setError(e.message || 'Network error'); }
    finally { setLoading(false); }
  }, [endpoint, page, search, refreshKey]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.ceil(total / LIMIT);
  const tp  = dm ? 'text-white' : 'text-gray-900';
  const tm  = dm ? 'text-gray-400' : 'text-gray-500';
  const bg  = dm ? 'bg-gray-800' : 'bg-white';
  const bdr = dm ? 'border-gray-700' : 'border-gray-200';

  if (error) return (
    <div className={`rounded-2xl border-2 ${bdr} ${bg} p-10 text-center`}>
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-red-400 font-semibold mb-3">{error}</p>
      <button onClick={load} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">Retry</button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tm}`} />
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 border-2 rounded-xl text-sm outline-none transition ${
              dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
            }`} />
        </div>
        <div className="flex items-center gap-3">
          <p className={`text-sm ${tm}`}>{total} record{total !== 1 ? 's' : ''}</p>
          <button onClick={load} className={`p-2 rounded-xl transition ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border-2 overflow-hidden ${bdr}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className={dm ? 'bg-gray-800' : 'bg-indigo-50'}>
                <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${tm} w-10`}>#</th>
                {cols.map(c => (
                  <th key={c.key} className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${tm} ${c.width || ''}`}>{c.label}</th>
                ))}
                {actions.length > 0 && <th className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${tm} w-28`}>Actions</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${dm ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {loading ? (
                <tr><td colSpan={cols.length + (actions.length > 0 ? 2 : 1)} className="py-16 text-center">
                  <Loader className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={cols.length + (actions.length > 0 ? 2 : 1)} className={`py-14 text-center text-sm ${tm}`}>No records found</td></tr>
              ) : rows.map((row, idx) => (
                <tr key={row.id ?? idx} className={`transition-colors ${dm ? 'hover:bg-gray-700/50' : 'hover:bg-indigo-50/50'}`}>
                  <td className={`px-4 py-3 text-xs ${tm}`}>{(page - 1) * LIMIT + idx + 1}</td>
                  {cols.map(c => (
                    <td key={c.key} className={`px-4 py-3 ${tp} max-w-[220px]`}>
                      {c.render ? c.render(row) : <span className="line-clamp-1">{row[c.key] ?? '—'}</span>}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {actions.map(action => {
                          const Icon = action.icon;
                          return (
                            <button key={action.label} title={action.label}
                              onClick={() => { if (action.confirm && !confirm(action.confirm)) return; action.onClick(row); }}
                              className={`p-1.5 rounded-lg transition ${action.color}`}>
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-indigo-50/50'}`}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${page === 1 ? 'opacity-40 cursor-not-allowed' : dm ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className={`text-xs ${tm}`}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${page === totalPages ? 'opacity-40 cursor-not-allowed' : dm ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Action factory
// ─────────────────────────────────────────────────────────────────────────────
function useActions(setReloadKey: (fn: (k: number) => number) => void) {
  const refresh = () => setReloadKey(k => k + 1);
  const patch   = async (path: string, body: object) => { await adminFetch(path, { method: 'PATCH', body: JSON.stringify(body) }); refresh(); };
  const del     = async (path: string)               => { await adminFetch(path, { method: 'DELETE' }); refresh(); };
  return {
    users:       { toggle: (r: any) => patch(`users/${r.id}`,       { isActive:    !r.isActive    }), delete: (r: any) => del(`users/${r.id}`)       },
    notes:       { toggle: (r: any) => patch(`notes/${r.id}`,       { isPublished: !r.isPublished }), delete: (r: any) => del(`notes/${r.id}`)       },
    assignments: { delete: (r: any) => del(`assignments/${r.id}`) },
    doubts:      { toggle: (r: any) => patch(`doubts/${r.id}`,      { isSolved:    !r.isSolved    }), delete: (r: any) => del(`doubts/${r.id}`)      },
    videos:      { delete: (r: any) => del(`videos/${r.id}`) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Tables
// ─────────────────────────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500/15 text-red-400', high: 'bg-orange-500/15 text-orange-400',
  normal: 'bg-blue-500/15 text-blue-400', low: 'bg-gray-500/15 text-gray-400',
};
const PAYMENT_COLORS: Record<string, string> = {
  paid: 'bg-green-500/15 text-green-400', pending: 'bg-yellow-500/15 text-yellow-400', failed: 'bg-red-500/15 text-red-400',
};

function SectionUsers({ rk, a }: any) {
  return <DataTable endpoint="users" refreshKey={rk} cols={[
    { label: 'Name',   key: 'name',      render: r => <span className="font-semibold">{r.name ?? '—'}</span> },
    { label: 'Email',  key: 'email',     width: 'min-w-[180px]' },
    { label: 'Role',   key: 'role',      render: r => <Pill text={r.role} color={r.role === 'TEACHER' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'} /> },
    { label: 'Status', key: 'isActive',  render: r => <StatusBadge ok={r.isActive} yes="Active" no="Inactive" /> },
    { label: 'Joined', key: 'createdAt', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
  ]} actions={[
    { label: 'Toggle', icon: ToggleLeft, color: 'hover:bg-blue-500/20 text-blue-400',  onClick: a.users.toggle },
    { label: 'Delete', icon: Trash2,     color: 'hover:bg-red-500/20 text-red-400',   onClick: a.users.delete, confirm: 'Delete this user permanently?' },
  ]} />;
}

function SectionNotes({ rk, a }: any) {
  return <DataTable endpoint="notes" refreshKey={rk} cols={[
    { label: 'Title',     key: 'title',       render: r => <span className="font-semibold line-clamp-1">{r.title}</span>, width: 'min-w-[180px]' },
    { label: 'Subject',   key: 'subject'      },
    { label: 'Class',     key: 'class'        },
    { label: 'Teacher',   key: 'teacher',     render: r => r.teacher?.user?.name ?? '—' },
    { label: 'Status',    key: 'isPublished',  render: r => <StatusBadge ok={r.isPublished} yes="Published" no="Draft" /> },
    { label: 'Downloads', key: 'downloads'    },
  ]} actions={[
    { label: 'Toggle', icon: ToggleLeft, color: 'hover:bg-blue-500/20 text-blue-400', onClick: a.notes.toggle },
    { label: 'Delete', icon: Trash2,     color: 'hover:bg-red-500/20 text-red-400',  onClick: a.notes.delete, confirm: 'Delete this note?' },
  ]} />;
}

function SectionAssignments({ rk, a }: any) {
  return <DataTable endpoint="assignments" refreshKey={rk} cols={[
    { label: 'Title',       key: 'title',    render: r => <span className="font-semibold line-clamp-1">{r.title}</span>, width: 'min-w-[180px]' },
    { label: 'Subject',     key: 'subject'   },
    { label: 'Class',       key: 'class'     },
    { label: 'Teacher',     key: 'teacher',  render: r => r.teacher?.user?.name ?? '—' },
    { label: 'Due',         key: 'dueDate',  render: r => new Date(r.dueDate).toLocaleDateString('en-IN') },
    { label: 'Submissions', key: '_count',   render: r => r._count?.submissions ?? 0 },
  ]} actions={[
    { label: 'Delete', icon: Trash2, color: 'hover:bg-red-500/20 text-red-400', onClick: a.assignments.delete, confirm: 'Delete this assignment?' },
  ]} />;
}

function SectionDoubts({ rk, a }: any) {
  return <DataTable endpoint="doubts" refreshKey={rk} cols={[
    { label: 'Title',    key: 'title',    render: r => <span className="font-semibold line-clamp-1">{r.title}</span>, width: 'min-w-[180px]' },
    { label: 'Subject',  key: 'subject'  },
    { label: 'Student',  key: 'student', render: r => r.student?.user?.name ?? '—' },
    { label: 'Priority', key: 'priority', render: r => <Pill text={r.priority} color={PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.normal} /> },
    { label: 'Status',   key: 'isSolved', render: r => <StatusBadge ok={r.isSolved} yes="Solved" no="Open" /> },
    { label: 'Replies',  key: '_count',   render: r => r._count?.replies ?? 0 },
  ]} actions={[
    { label: 'Toggle', icon: CheckCircle2, color: 'hover:bg-green-500/20 text-green-400', onClick: a.doubts.toggle },
    { label: 'Delete', icon: Trash2,       color: 'hover:bg-red-500/20 text-red-400',    onClick: a.doubts.delete, confirm: 'Delete this doubt?' },
  ]} />;
}

function SectionVideos({ rk, a }: any) {
  return <DataTable endpoint="videos" refreshKey={rk} cols={[
    { label: 'Folder',     key: 'name',     render: r => <span className="font-semibold line-clamp-1">{r.name}</span>, width: 'min-w-[180px]' },
    { label: 'Subject',    key: 'subject'   },
    { label: 'Class',      key: 'class'     },
    { label: 'Teacher',    key: 'teacher',  render: r => r.teacher?.user?.name ?? '—' },
    { label: 'Videos',     key: '_count',   render: r => r._count?.videos ?? 0 },
    { label: 'Visibility', key: 'isPublic', render: r => <StatusBadge ok={r.isPublic} yes="Public" no="Private" /> },
  ]} actions={[
    { label: 'Delete', icon: Trash2, color: 'hover:bg-red-500/20 text-red-400', onClick: a.videos.delete, confirm: 'Delete folder and all videos?' },
  ]} />;
}

function SectionPayments({ rk }: any) {
  return <DataTable endpoint="payments" refreshKey={rk} cols={[
    { label: 'Order ID', key: 'orderId', render: r => <span className="font-mono text-xs">{r.orderId?.slice(-12) ?? '—'}</span> },
    { label: 'User',     key: 'user',    render: r => r.user?.name ?? '—' },
    { label: 'Email',    key: 'user',    render: r => r.user?.email ?? '—', width: 'min-w-[160px]' },
    { label: 'Amount',   key: 'amount',  render: r => `₹${r.amount?.toLocaleString('en-IN') ?? 0}` },
    { label: 'Status',   key: 'status',  render: r => <Pill text={r.status} color={PAYMENT_COLORS[r.status] || PAYMENT_COLORS.pending} /> },
    { label: 'Date',     key: 'createdAt', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
  ]} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard — matches TeacherDashboard layout exactly
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const dm = useDarkMode();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [scrolled,      setScrolled]      = useState(false);
  const [stats,         setStats]         = useState<Stats | null>(null);
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [reloadKey,     setReloadKey]     = useState(0);

  const actions = useActions(setReloadKey);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setLoadingStats(true);
    adminFetch('stats')
      .then(d => { if (d.success) setStats(d.stats); })
      .catch(e => console.error('Stats:', e))
      .finally(() => setLoadingStats(false));
  }, [reloadKey]);

  const toggleDark = () => {
    const next = !dm;
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark', next);
  };

  const openSection = (id: AdminSection) => { setActiveSection(id); setSidebarOpen(false); };

  // Nav items — same icon/color pattern as TeacherDashboard platformFeatures
  const navItems: { id: AdminSection; icon: React.ElementType; label: string; color: string; grad: string; subtitle: string }[] = [
    { id: 'dashboard',   icon: LayoutDashboard, label: 'Dashboard',    color: 'text-blue-400',    grad: 'from-blue-500 to-cyan-500',      subtitle: 'Platform overview'         },
    { id: 'users',       icon: Users,           label: 'Users',        color: 'text-orange-400',  grad: 'from-orange-500 to-red-500',     subtitle: 'Teachers & students'       },
    { id: 'notes',       icon: BookOpen,        label: 'Notes',        color: 'text-purple-400',  grad: 'from-purple-500 to-pink-500',    subtitle: 'Study materials'           },
    { id: 'assignments', icon: FileText,        label: 'Assignments',  color: 'text-green-400',   grad: 'from-green-500 to-emerald-500',  subtitle: 'All assignments'           },
    { id: 'doubts',      icon: MessageSquare,   label: 'Doubts',       color: 'text-yellow-400',  grad: 'from-yellow-500 to-orange-500',  subtitle: 'Student questions'         },
    { id: 'videos',      icon: Video,           label: 'Videos',       color: 'text-red-400',     grad: 'from-rose-500 to-pink-500',      subtitle: 'Video library'             },
    { id: 'payments',    icon: CreditCard,      label: 'Payments',     color: 'text-emerald-400', grad: 'from-emerald-500 to-teal-500',   subtitle: 'Revenue & transactions'    },
  ];

  const meta = navItems.find(n => n.id === activeSection)!;

  const bg  = dm ? 'bg-gray-900'  : 'bg-white';
  const bdr = dm ? 'border-gray-700' : 'border-gray-200';
  const tp  = dm ? 'text-white'   : 'text-gray-900';
  const tm  = dm ? 'text-gray-400' : 'text-gray-500';

  const statCards = [
    { label: 'Students',    value: stats?.students.total    ?? 0, sub: `${stats?.students.active    ?? 0} active`,    icon: GraduationCap, grad: 'from-blue-500 to-cyan-500'      },
    { label: 'Teachers',    value: stats?.teachers.total    ?? 0, sub: `${stats?.teachers.active    ?? 0} active`,    icon: Users,         grad: 'from-purple-500 to-pink-500'    },
    { label: 'Notes',       value: stats?.notes.total       ?? 0, sub: `${stats?.notes.published    ?? 0} published`, icon: BookOpen,      grad: 'from-green-500 to-emerald-500'  },
    { label: 'Assignments', value: stats?.assignments.total ?? 0, sub: `${stats?.assignments.submitted ?? 0} subs`,  icon: FileText,      grad: 'from-orange-500 to-yellow-500'  },
    { label: 'Open Doubts', value: stats?.doubts.pending    ?? 0, sub: `${stats?.doubts.total       ?? 0} total`,     icon: MessageSquare, grad: 'from-rose-500 to-pink-500'      },
    { label: 'Videos',      value: stats?.videos.total      ?? 0, sub: `in ${stats?.videos.folders  ?? 0} folders`,  icon: Video,         grad: 'from-indigo-500 to-purple-500'  },
    { label: 'Revenue',     value: stats?.payments.revenue  ?? '₹0', sub: `${stats?.payments.total  ?? 0} orders`,   icon: CreditCard,    grad: 'from-emerald-500 to-teal-500'   },
  ];

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <div className={`flex flex-col h-full ${bg} border-r ${bdr} transition-colors`}>
      {/* Logo — same as TeacherDashboard */}
      <div className={`p-4 sm:p-5 border-b ${bdr}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0">
            <CoachingLogo />
          </div>
          <div className="min-w-0">
            <p className={`font-bold text-sm sm:text-base truncate ${tp}`}>Intense Learners</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <p className="text-xs text-green-400 font-semibold">Admin Panel</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ id, icon: Icon, label, color }) => (
          <button key={id} onClick={() => openSection(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
              activeSection === id
                ? `${dm ? 'bg-indigo-900/50 text-indigo-400 border border-indigo-500/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`
                : dm ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}>
            <Icon className={`w-4 h-4 flex-shrink-0 ${activeSection === id ? (dm ? 'text-indigo-400' : 'text-indigo-600') : color}`} />
            {label}
            {activeSection === id && <ChevronRight className={`w-3.5 h-3.5 ml-auto ${dm ? 'text-indigo-400' : 'text-indigo-500'}`} />}
          </button>
        ))}
      </nav>

      <div className={`p-4 border-t ${bdr} space-y-1`}>
        <button onClick={toggleDark}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition text-sm ${dm ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          {dm ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
          {dm ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition text-sm text-red-500 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden transition-colors ${dm ? 'bg-gray-950' : 'bg-gray-100'}`}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0"><Sidebar /></aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 flex-shrink-0 shadow-2xl"><Sidebar /></div>
          <button onClick={() => setSidebarOpen(false)} className="flex-1 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar — same style as TeacherDashboard feature nav */}
        <header className={`flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b shadow-sm flex-shrink-0 backdrop-blur-lg ${
          dm ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className={`text-base sm:text-lg font-bold truncate ${tp}`}>{meta.label}</h1>
              <p className={`text-xs hidden sm:block ${tm}`}>{meta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setReloadKey(k => k + 1)}
              className={`p-2 rounded-xl transition ${dm ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={toggleDark}
              className={`p-2 rounded-xl hover:scale-110 transition-all ${dm ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {dm ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            {/* Same style as TeacherDashboard user button */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
              dm ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
            }`}>
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </div>
            <button onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition text-xs sm:text-sm font-semibold">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">

          {/* Section banner — same gradient style as TeacherDashboard feature header */}
          <div className={`bg-gradient-to-r ${meta.grad} rounded-2xl p-4 sm:p-6 mb-5 sm:mb-6 flex items-center justify-between shadow-lg`}>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{meta.label}</h2>
                <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">Admin</span>
              </div>
              <p className="text-white/90 text-xs sm:text-sm">{meta.subtitle}</p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
              {React.createElement(meta.icon, { className: 'w-6 h-6 sm:w-7 sm:h-7 text-white' })}
            </div>
          </div>

          {/* ── Dashboard overview ── */}
          {activeSection === 'dashboard' && (
            <>
              {loadingStats ? (
                <div className="flex items-center justify-center h-48">
                  <Loader className="w-10 h-10 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Stat cards — same style as TeacherDashboard hero stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {statCards.map(({ label, value, sub, icon: Icon, grad }) => (
                      <div key={label}
                        className={`rounded-2xl border-2 p-4 sm:p-5 hover:shadow-xl transition-all hover:-translate-y-1 cursor-default ${
                          dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${grad} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 shadow-lg`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <p className={`text-2xl sm:text-3xl font-bold mb-0.5 ${tp}`}>{value}</p>
                        <p className={`text-xs sm:text-sm font-semibold ${tp}`}>{label}</p>
                        <p className={`text-xs mt-0.5 ${tm}`}>{sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quick access — same style as TeacherDashboard feature grid */}
                  <div className="mb-4 sm:mb-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs ${dm ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                      <Zap className="w-3 h-3" /><span className="font-semibold">QUICK ACCESS</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {navItems.filter(n => n.id !== 'dashboard').map(({ id, icon: Icon, label, color, grad }) => (
                      <button key={id} onClick={() => openSection(id)}
                        className={`group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 overflow-hidden text-center ${
                          dm ? 'bg-gray-800 border-gray-700 hover:border-indigo-500' : 'bg-white border-gray-100 hover:border-indigo-500'
                        }`}>
                        <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${grad} rounded-xl sm:rounded-2xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <p className={`text-xs sm:text-sm font-bold leading-tight ${tp} group-hover:text-indigo-600 transition-colors`}>{label}</p>
                        <div className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Data sections ── */}
          {activeSection === 'users'       && <SectionUsers       rk={reloadKey} a={actions} />}
          {activeSection === 'notes'       && <SectionNotes       rk={reloadKey} a={actions} />}
          {activeSection === 'assignments' && <SectionAssignments rk={reloadKey} a={actions} />}
          {activeSection === 'doubts'      && <SectionDoubts      rk={reloadKey} a={actions} />}
          {activeSection === 'videos'      && <SectionVideos      rk={reloadKey} a={actions} />}
          {activeSection === 'payments'    && <SectionPayments    rk={reloadKey} />}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root — handles auth gate same as before
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking,      setChecking]      = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('admin_auth');
    if (!token) { setChecking(false); return; }
    fetch('/api/admin/auth', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setAuthenticated(true); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
        <div className="text-center">
          <Loader className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-purple-200 text-sm font-semibold">Verifying session...</p>
        </div>
      </div>
    );
  }

  return authenticated
    ? <AdminDashboard onLogout={() => { sessionStorage.removeItem('admin_auth'); setAuthenticated(false); }} />
    : <AdminLogin onLogin={() => setAuthenticated(true)} />;
}