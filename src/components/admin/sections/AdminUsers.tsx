/**
 * FILE: src/components/admin/sections/AdminUsers.tsx
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Trash2, Loader, AlertCircle,
  ChevronLeft, ChevronRight, ToggleLeft, ToggleRight,
  Users, GraduationCap, X, Mail, Phone, MapPin,
  Calendar, Globe, Briefcase, BookOpen, Shield,
  CheckCircle2, XCircle, Download, Camera,
} from 'lucide-react';

// ── dark mode hook ──────────────────────────────────────────────────────────
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  }).then(r => r.json());
}

// ── types ──────────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
  dateOfBirth: string | null;
  qualification: string | null;
  experience: string | null;
  subjects: string | null;
  specialization: string | null;
  teachingStyle: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
}

// ── helpers ────────────────────────────────────────────────────────────────
const getInitials = (name: string | null) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const calcAge = (dob: string | null) => {
  if (!dob) return null;
  const today = new Date(), birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() - birth.getMonth() < 0 ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--;
  return age;
};

// ── Delete confirm modal ───────────────────────────────────────────────────
function DeleteConfirmModal({
  user, dm, onConfirm, onCancel, loading,
}: { user: UserRow; dm: boolean; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 border-2 ${dm ? 'bg-gray-800 border-red-800' : 'bg-white border-red-200'}`}>
        <div className="w-14 h-14 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className={`text-xl font-bold text-center mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>Delete Account?</h3>
        <p className={`text-sm text-center mb-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>You are about to permanently delete:</p>
        <p className={`text-base font-bold text-center mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>{user.name ?? user.email}</p>
        <p className={`text-xs text-center mb-5 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{user.email} · {user.role}</p>

        <div className={`rounded-xl p-4 mb-6 border-2 ${dm ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-red-500 font-bold mb-2">This action is irreversible</p>
          <ul className={`text-xs space-y-1 ${dm ? 'text-red-400' : 'text-red-700'}`}>
            <li>• All profile data will be permanently deleted</li>
            <li>• All submissions, doubts and notes will be removed</li>
            <li>• The user will be immediately signed out</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${dm ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader className="w-4 h-4 animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4" />Delete Forever</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile detail modal ───────────────────────────────────────────────────
function UserProfileModal({
  user, dm, onClose, onDelete, onToggleActive,
}: {
  user: UserRow;
  dm: boolean;
  onClose: () => void;
  onDelete: (u: UserRow) => void;
  onToggleActive: (u: UserRow) => void;
}) {
  const tp  = dm ? 'text-white' : 'text-gray-900';
  const tm  = dm ? 'text-gray-400' : 'text-gray-500';
  const rowCls = `${dm ? 'bg-gray-700/40' : 'bg-gray-50'} rounded-xl p-3 sm:p-4`;

  const InfoRow = ({
    icon: Icon, label, value, color = '',
  }: { icon: any; label: string; value: string; color?: string }) => (
    <div className={rowCls}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${color || tm}`} />
        <span className={`text-xs ${tm}`}>{label}</span>
      </div>
      <p className={`text-sm font-semibold pl-5 ${tp}`}>{value}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ${dm ? 'bg-gray-800' : 'bg-white'}`}>

        {/* Header */}
        <div className={`flex-shrink-0 p-4 sm:p-6 border-b-2 ${dm ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0 overflow-hidden shadow-lg ${user.role === 'TEACHER' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-indigo-500'}`}>
              {user.avatar
                ? <img src={user.avatar} alt={user.name ?? ''} className="w-full h-full object-cover" />
                : getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className={`font-bold text-lg sm:text-xl truncate ${tp}`}>{user.name ?? 'No name'}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${user.role === 'TEACHER' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'}`}>
                  {user.role}
                </span>
              </div>
              <p className={`text-xs sm:text-sm truncate ${tm}`}>{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className={`text-xs ${tm}`}>· Joined {fmtDate(user.createdAt)}</span>
              </div>
            </div>
            <button onClick={onClose}
              className={`p-2 rounded-xl flex-shrink-0 transition-colors ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

          {user.bio && (
            <div className={rowCls}>
              <p className={`text-xs ${tm} mb-1`}>Bio</p>
              <p className={`text-sm ${tp}`}>{user.bio}</p>
            </div>
          )}

          {/* Contact info */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${tm}`}>Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoRow icon={Mail}     label="Email"    value={user.email}           color="text-indigo-400" />
              {user.phone    && <InfoRow icon={Phone}    label="Phone"    value={user.phone}    color="text-green-400" />}
              {user.location && <InfoRow icon={MapPin}   label="Location" value={user.location} color="text-red-400"   />}
              {user.dateOfBirth && (
                <InfoRow icon={Calendar} label="Date of Birth"
                  value={`${fmtDate(user.dateOfBirth)} (Age ${calcAge(user.dateOfBirth)})`}
                  color="text-blue-400" />
              )}
            </div>
          </div>

          {/* Professional info */}
          {(user.qualification || user.experience || user.subjects || user.specialization) && (
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${tm}`}>Professional</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {user.qualification  && <InfoRow icon={GraduationCap} label="Qualification"  value={user.qualification}  color="text-orange-400" />}
                {user.experience     && <InfoRow icon={Briefcase}     label="Experience"     value={user.experience}     color="text-cyan-400"   />}
                {user.subjects       && <InfoRow icon={BookOpen}      label="Subjects"       value={user.subjects}       color="text-yellow-400" />}
                {user.specialization && <InfoRow icon={Shield}        label="Specialization" value={user.specialization} color="text-purple-400" />}
              </div>
              {user.teachingStyle && (
                <div className={`${rowCls} mt-2`}>
                  <p className={`text-xs ${tm} mb-1`}>Teaching Style</p>
                  <p className={`text-sm ${tp}`}>{user.teachingStyle}</p>
                </div>
              )}
            </div>
          )}

          {/* Social links */}
          {(user.website || user.linkedin || user.twitter || user.instagram) && (
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${tm}`}>Social Profiles</h4>
              <div className="flex flex-wrap gap-2">
                {user.website   && <a href={user.website}   target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${dm ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}><Globe  className="w-3.5 h-3.5" />Website</a>}
                {user.linkedin  && <a href={user.linkedin}  target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-xl text-xs font-semibold">LinkedIn</a>}
                {user.twitter   && <a href={user.twitter}   target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 rounded-xl text-xs font-semibold">Twitter</a>}
                {user.instagram && <a href={user.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-pink-500/15 hover:bg-pink-500/25 text-pink-400 rounded-xl text-xs font-semibold"><Camera className="w-3.5 h-3.5" />Instagram</a>}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className={`flex-shrink-0 flex items-center justify-between gap-3 p-4 sm:p-6 border-t-2 ${dm ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
          <button onClick={() => { onToggleActive(user); onClose(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              user.isActive
                ? 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25'
                : 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
            }`}>
            {user.isActive
              ? <><ToggleLeft  className="w-4 h-4" />Deactivate</>
              : <><ToggleRight className="w-4 h-4" />Activate</>}
          </button>
          <button onClick={() => { onClose(); onDelete(user); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg">
            <Trash2 className="w-4 h-4" />Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminUsers() {
  const dm = useDarkMode();

  const [users,        setUsers]        = useState<UserRow[]>([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [role,         setRole]         = useState('');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [viewUser,     setViewUser]     = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toggling,     setToggling]     = useState<string | null>(null);
  const [counts,       setCounts]       = useState({ all: 0, student: 0, teacher: 0 });
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), search });
      if (role) params.set('role', role);
      const data = await adminFetch(`users?${params}`);
      if (data.success) { setUsers(data.users ?? []); setTotal(data.total ?? 0); }
      else setError(data.error || 'Failed to load users');
    } catch { setError('Network error — check your connection'); }
    finally { setLoading(false); }
  }, [page, search, role]);

  const loadCounts = useCallback(async () => {
    try {
      const [all, student, teacher] = await Promise.all([
        adminFetch('users?page=1&limit=1'),
        adminFetch('users?page=1&limit=1&role=STUDENT'),
        adminFetch('users?page=1&limit=1&role=TEACHER'),
      ]);
      setCounts({ all: all.total ?? 0, student: student.total ?? 0, teacher: teacher.total ?? 0 });
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCounts(); }, [loadCounts]);
  useEffect(() => { setPage(1); }, [search, role]);

  const handleToggleActive = async (user: UserRow) => {
    setToggling(user.id);
    try {
      await adminFetch(`users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      if (viewUser?.id === user.id) setViewUser(prev => prev ? { ...prev, isActive: !prev.isActive } : prev);
    } catch { setError('Failed to update user status'); }
    finally { setToggling(null); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const data = await adminFetch(`users/${deleteTarget.id}`, { method: 'DELETE' });
      if (data.success) {
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
        setTotal(prev => prev - 1);
        setCounts(prev => ({
          all:     prev.all - 1,
          student: deleteTarget.role === 'STUDENT' ? prev.student - 1 : prev.student,
          teacher: deleteTarget.role === 'TEACHER' ? prev.teacher - 1 : prev.teacher,
        }));
        setDeleteTarget(null);
        setViewUser(null);
      } else {
        setError(data.error || 'Delete failed');
        setDeleteTarget(null);
      }
    } catch { setError('Network error during delete'); setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Role', 'Phone', 'Location', 'Status', 'Joined'],
      ...users.map(u => [
        u.name ?? '', u.email, u.role, u.phone ?? '',
        u.location ?? '', u.isActive ? 'Active' : 'Inactive', fmtDate(u.createdAt),
      ]),
    ].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `users-${role || 'all'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(total / LIMIT);
  const tp  = dm ? 'text-white'   : 'text-gray-900';
  const tm  = dm ? 'text-gray-400' : 'text-gray-500';
  const bdr = dm ? 'border-gray-700' : 'border-gray-200';
  const inputCls = `px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'}`;

  const TABS = [
    { key: '',        label: 'All Users', count: counts.all,     icon: Users         },
    { key: 'STUDENT', label: 'Students',  count: counts.student, icon: GraduationCap },
    { key: 'TEACHER', label: 'Teachers',  count: counts.teacher, icon: Briefcase     },
  ];

  return (
    <div className="space-y-4">

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ key, label, count, icon: Icon }) => (
          <button key={key} onClick={() => setRole(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap flex-shrink-0 transition-all ${
              role === key
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : dm
                  ? 'bg-gray-800 border-2 border-gray-700 text-gray-300 hover:border-orange-500/50'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-orange-400'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
              role === key
                ? 'bg-white/20 text-white'
                : dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* ── Search bar + actions ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tm}`} />
          <input type="text" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className={`${inputCls} w-full pl-9`} />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-sm ${tm} hidden sm:block`}>{total} user{total !== 1 ? 's' : ''}</span>
          <button onClick={exportCSV} title="Export CSV"
            className={`p-2.5 rounded-xl border-2 transition-colors ${dm ? 'bg-gray-800 border-gray-700 hover:border-orange-500/50 text-gray-400' : 'bg-white border-gray-200 hover:border-orange-400 text-gray-600'}`}>
            <Download className="w-4 h-4" />
          </button>
          <button onClick={load} title="Refresh"
            className={`p-2.5 rounded-xl border-2 transition-colors ${dm ? 'bg-gray-800 border-gray-700 hover:border-orange-500/50 text-gray-400' : 'bg-white border-gray-200 hover:border-orange-400 text-gray-600'}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={() => { setError(''); load(); }}
            className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold">Retry</button>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl border-2 overflow-hidden ${bdr}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className={dm ? 'bg-gray-800' : 'bg-gray-50'}>
                {['#', 'User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider ${tm}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${dm ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {loading ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader className="w-8 h-8 text-orange-500 animate-spin mx-auto" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className={`py-20 text-center text-sm ${tm}`}>{search ? 'No users match your search' : 'No users found'}</td></tr>
              ) : users.map((user, idx) => (
                <tr key={user.id}
                  onClick={() => setViewUser(user)}
                  className={`transition-colors cursor-pointer ${dm ? 'hover:bg-gray-700/40' : 'hover:bg-orange-50/40'}`}>

                  <td className={`px-4 py-3.5 text-xs ${tm}`}>{(page - 1) * LIMIT + idx + 1}</td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden ${user.role === 'TEACHER' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {user.avatar
                          ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                          : getInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm truncate ${tp}`}>{user.name ?? '—'}</p>
                        <p className={`text-xs ${tm} truncate`}>{user.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === 'TEACHER' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'}`}>
                      {user.role}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {user.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className={`px-4 py-3.5 text-xs ${tm}`}>{fmtDate(user.createdAt)}</td>

                  <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleActive(user)} disabled={toggling === user.id}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${dm ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-50 text-blue-500'}`}>
                        {toggling === user.id
                          ? <Loader className="w-4 h-4 animate-spin" />
                          : user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setDeleteTarget(user)}
                        title="Delete account"
                        className={`p-2 rounded-lg transition-colors ${dm ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${page === 1 ? 'opacity-40 cursor-not-allowed' : dm ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
              <ChevronLeft className="w-4 h-4" />Prev
            </button>
            <span className={`text-xs ${tm}`}>Page {page} of {totalPages} · {total} total</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${page === totalPages ? 'opacity-40 cursor-not-allowed' : dm ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
              Next<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {viewUser && (
        <UserProfileModal
          user={viewUser} dm={dm}
          onClose={() => setViewUser(null)}
          onDelete={u => { setViewUser(null); setDeleteTarget(u); }}
          onToggleActive={handleToggleActive}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget} dm={dm}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}