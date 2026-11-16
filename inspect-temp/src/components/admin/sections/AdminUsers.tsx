'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, RefreshCw, Trash2, Loader, AlertCircle,
  ChevronLeft, ChevronRight, ToggleLeft, ToggleRight,
  Users, GraduationCap, X, Mail, Phone, MapPin,
  Calendar, Globe, Briefcase, BookOpen, Shield,
  CheckCircle2, XCircle, Download, Camera, Filter,
  SortAsc, SortDesc, Eye, TrendingUp, Activity,
  UserCheck, UserX, AlertTriangle, Star, Hash,
  ExternalLink, Copy, Check, MoreVertical, Zap,
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

const fmtDateShort = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

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

// ── Avatar component ───────────────────────────────────────────────────────
function Avatar({ user, size = 'md' }: { user: UserRow; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' };
  const gradients = user.role === 'TEACHER'
    ? 'from-violet-500 via-purple-500 to-fuchsia-500'
    : 'from-blue-500 via-cyan-500 to-teal-500';
  return (
    <div className={`${sizes[size]} rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden bg-gradient-to-br ${gradients} shadow-lg ring-2 ring-white/20`}>
      {user.avatar
        ? <img src={user.avatar} alt={user.name ?? ''} className="w-full h-full object-cover" />
        : getInitials(user.name)}
    </div>
  );
}

// ── Copy button ────────────────────────────────────────────────────────────
function CopyBtn({ text, dm }: { text: string; dm: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy}
      className={`p-1 rounded-md transition-colors ${dm ? 'hover:bg-gray-600 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient, dm }: {
  label: string; value: number; icon: any; gradient: string; dm: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 border transition-all hover:scale-[1.02] ${dm ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 bg-gradient-to-br ${gradient}`} />
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} mb-3 shadow-md`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className={`text-2xl font-black ${dm ? 'text-white' : 'text-gray-900'}`}>{value.toLocaleString()}</p>
      <p className={`text-xs font-medium mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}

// ── Delete confirm modal ───────────────────────────────────────────────────
function DeleteConfirmModal({
  user, dm, onConfirm, onCancel, loading,
}: { user: UserRow; dm: boolean; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  const [typed, setTyped] = useState('');
  const confirmWord = 'DELETE';
  const confirmed = typed === confirmWord;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-2 ${dm ? 'bg-gray-900 border-red-900/60' : 'bg-white border-red-100'}`}
        style={{ animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Red header stripe */}
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />

        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 bg-red-500/20 rounded-2xl animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>

          <h3 className={`text-xl font-black text-center mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>Permanently Delete Account</h3>
          <p className={`text-sm text-center mb-5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
            This action is <span className="font-bold text-red-500">irreversible</span> and cannot be undone
          </p>

          {/* User card */}
          <div className={`flex items-center gap-3 p-3 rounded-2xl mb-5 border ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <Avatar user={user} size="md" />
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{user.name ?? 'No name'}</p>
              <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${user.role === 'TEACHER' ? 'bg-violet-500/15 text-violet-400' : 'bg-blue-500/15 text-blue-400'}`}>{user.role}</span>
            </div>
          </div>

          {/* Consequences */}
          <div className={`rounded-2xl p-4 mb-5 border-2 ${dm ? 'bg-red-950/30 border-red-900/50' : 'bg-red-50 border-red-100'}`}>
            <p className={`text-xs font-bold mb-2.5 flex items-center gap-1.5 text-red-500`}>
              <AlertCircle className="w-3.5 h-3.5" /> What will be deleted
            </p>
            <ul className={`space-y-1.5 text-xs ${dm ? 'text-red-300/70' : 'text-red-700/80'}`}>
              {['Profile data, avatar & all personal info', 'All submissions, doubts & notes', 'Enrollments & course progress', 'Authentication sessions & cookies'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Type to confirm */}
          <div className="mb-5">
            <p className={`text-xs mb-2 font-semibold ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
              Type <span className={`font-black tracking-widest ${dm ? 'text-red-400' : 'text-red-600'}`}>{confirmWord}</span> to confirm
            </p>
            <input
              value={typed}
              onChange={e => setTyped(e.target.value.toUpperCase())}
              placeholder="Type DELETE to confirm"
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-mono font-bold outline-none transition-colors ${
                confirmed
                  ? 'border-red-500 bg-red-500/10 text-red-500'
                  : dm
                    ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-600 focus:border-gray-500'
                    : 'border-gray-200 bg-white text-gray-900 placeholder-gray-300 focus:border-gray-400'
              }`}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onCancel} disabled={loading}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${dm ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading || !confirmed}
              className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                confirmed && !loading
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-red-500/30'
                  : 'bg-red-900/30 text-red-800 cursor-not-allowed opacity-50'
              }`}>
              {loading ? <><Loader className="w-4 h-4 animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4" />Delete Forever</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Profile detail modal ───────────────────────────────────────────────────
function UserProfileModal({
  user, dm, onClose, onDelete, onToggleActive, toggling,
}: {
  user: UserRow; dm: boolean; onClose: () => void;
  onDelete: (u: UserRow) => void; onToggleActive: (u: UserRow) => void; toggling: boolean;
}) {
  const isTeacher = user.role === 'TEACHER';

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h4 className={`text-[11px] font-black uppercase tracking-[0.12em] mb-3 flex items-center gap-2 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
        <span className={`inline-block w-4 h-0.5 rounded ${isTeacher ? 'bg-violet-400' : 'bg-blue-400'}`} />
        {title}
      </h4>
      {children}
    </div>
  );

  const InfoChip = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
    <div className={`p-3 rounded-xl border ${dm ? 'bg-gray-800/60 border-gray-700/60' : 'bg-gray-50 border-gray-100'}`}>
      <div className={`flex items-center gap-1.5 mb-1`}>
        <Icon className={`w-3 h-3 flex-shrink-0 ${color}`} />
        <span className={`text-[10px] font-bold uppercase tracking-wide ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
      </div>
      <p className={`text-sm font-semibold leading-snug ${dm ? 'text-gray-200' : 'text-gray-800'}`}>{value}</p>
    </div>
  );

  const accentGrad = isTeacher ? 'from-violet-500 to-fuchsia-500' : 'from-blue-500 to-cyan-500';
  const accentColor = isTeacher ? 'text-violet-400' : 'text-blue-400';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md">
      <div className={`rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[96vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ${dm ? 'bg-gray-900' : 'bg-white'}`}
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Gradient accent line */}
        <div className={`h-1 bg-gradient-to-r ${accentGrad} flex-shrink-0`} />

        {/* Header */}
        <div className={`flex-shrink-0 relative overflow-hidden ${dm ? 'bg-gray-800/80' : 'bg-gradient-to-br from-slate-50 to-gray-100'}`}>
          <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${accentGrad}`} />
          <div className="relative p-5 sm:p-6 flex items-start gap-4">
            <div className="relative">
              <Avatar user={user} size="xl" />
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${dm ? 'border-gray-800' : 'border-white'} ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {user.isActive ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : <XCircle className="w-2.5 h-2.5 text-white" />}
              </span>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className={`font-black text-xl truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{user.name ?? 'No name'}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r ${accentGrad} text-white shadow-sm`}>
                  {user.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <Mail className={`w-3 h-3 ${accentColor}`} />
                <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                <CopyBtn text={user.email} dm={dm} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${user.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {user.isActive ? 'Active Account' : 'Inactive Account'}
                </span>
                <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Joined {fmtDate(user.createdAt)}</span>
              </div>
            </div>
            <button onClick={onClose}
              className={`p-2 rounded-xl flex-shrink-0 transition-colors mt-0.5 ${dm ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {user.bio && (
            <div className={`p-4 rounded-2xl border-l-4 ${isTeacher ? 'border-l-violet-500' : 'border-l-blue-500'} ${dm ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${accentColor}`}>Bio</p>
              <p className={`text-sm leading-relaxed ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{user.bio}</p>
            </div>
          )}

          <Section title="Contact Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <InfoChip icon={Mail} label="Email" value={user.email} color="text-indigo-400" />
              {user.phone && <InfoChip icon={Phone} label="Phone" value={user.phone} color="text-emerald-400" />}
              {user.location && <InfoChip icon={MapPin} label="Location" value={user.location} color="text-rose-400" />}
              {user.dateOfBirth && (
                <InfoChip icon={Calendar} label="Date of Birth"
                  value={`${fmtDate(user.dateOfBirth)} · Age ${calcAge(user.dateOfBirth)}`}
                  color="text-amber-400" />
              )}
            </div>
          </Section>

          {(user.qualification || user.experience || user.subjects || user.specialization) && (
            <Section title="Professional Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {user.qualification  && <InfoChip icon={GraduationCap} label="Qualification"  value={user.qualification}  color="text-orange-400" />}
                {user.experience     && <InfoChip icon={Briefcase}     label="Experience"     value={user.experience}     color="text-cyan-400"   />}
                {user.subjects       && <InfoChip icon={BookOpen}      label="Subjects"       value={user.subjects}       color="text-yellow-400" />}
                {user.specialization && <InfoChip icon={Shield}        label="Specialization" value={user.specialization} color="text-purple-400" />}
              </div>
              {user.teachingStyle && (
                <div className={`p-3 rounded-xl border mt-2.5 ${dm ? 'bg-gray-800/60 border-gray-700/60' : 'bg-gray-50 border-gray-100'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Teaching Style</p>
                  <p className={`text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{user.teachingStyle}</p>
                </div>
              )}
            </Section>
          )}

          {(user.website || user.linkedin || user.twitter || user.instagram) && (
            <Section title="Social Profiles">
              <div className="flex flex-wrap gap-2">
                {user.website   && <a href={user.website} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ${dm ? 'bg-gray-800 border border-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                  <Globe className="w-3.5 h-3.5" />Website<ExternalLink className="w-3 h-3 opacity-50" /></a>}
                {user.linkedin  && <a href={user.linkedin} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-xl text-xs font-bold transition-all hover:scale-105">
                  LinkedIn<ExternalLink className="w-3 h-3 opacity-50" /></a>}
                {user.twitter   && <a href={user.twitter} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 rounded-xl text-xs font-bold transition-all hover:scale-105">
                  Twitter<ExternalLink className="w-3 h-3 opacity-50" /></a>}
                {user.instagram && <a href={user.instagram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-pink-500/15 hover:bg-pink-500/25 text-pink-400 rounded-xl text-xs font-bold transition-all hover:scale-105">
                  <Camera className="w-3.5 h-3.5" />Instagram<ExternalLink className="w-3 h-3 opacity-50" /></a>}
              </div>
            </Section>
          )}

          {/* User ID */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${dm ? 'bg-gray-800/40' : 'bg-gray-50'}`}>
            <Hash className={`w-3 h-3 flex-shrink-0 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-xs font-mono truncate flex-1 ${dm ? 'text-gray-600' : 'text-gray-400'}`}>{user.id}</p>
            <CopyBtn text={user.id} dm={dm} />
          </div>
        </div>

        {/* Footer */}
        <div className={`flex-shrink-0 flex items-center gap-3 p-4 sm:p-5 border-t ${dm ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
          <button onClick={() => { onToggleActive(user); onClose(); }} disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 ${
              user.isActive
                ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
            }`}>
            {toggling
              ? <Loader className="w-4 h-4 animate-spin" />
              : user.isActive ? <><ToggleLeft className="w-4 h-4" />Deactivate</> : <><ToggleRight className="w-4 h-4" />Activate</>}
          </button>
          <div className="flex-1" />
          <button onClick={() => { onClose(); onDelete(user); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-black text-sm transition-all hover:scale-105 shadow-lg shadow-red-500/20">
            <Trash2 className="w-4 h-4" />Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk action bar ────────────────────────────────────────────────────────
function BulkActionBar({ count, dm, onActivate, onDeactivate, onDelete, onClear }: {
  count: number; dm: boolean;
  onActivate: () => void; onDeactivate: () => void;
  onDelete: () => void; onClear: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-sm ${dm ? 'bg-indigo-950/50 border-indigo-800/60' : 'bg-indigo-50 border-indigo-200'}`}
      style={{ animation: 'slideUp 0.2s ease' }}>
      <span className={`font-black text-sm ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>
        {count} selected
      </span>
      <div className="flex-1" />
      <button onClick={onActivate}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
        <UserCheck className="w-3.5 h-3.5" />Activate All
      </button>
      <button onClick={onDeactivate}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors">
        <UserX className="w-3.5 h-3.5" />Deactivate All
      </button>
      <button onClick={onDelete}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">
        <Trash2 className="w-3.5 h-3.5" />Delete All
      </button>
      <button onClick={onClear}
        className={`p-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`}>
        <X className="w-4 h-4" />
      </button>
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
  const [sortBy,       setSortBy]       = useState<'createdAt' | 'name' | 'email'>('createdAt');
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('desc');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [viewUser,     setViewUser]     = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toggling,     setToggling]     = useState<string | null>(null);
  const [counts,       setCounts]       = useState({ all: 0, student: 0, teacher: 0, active: 0 });
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), search, sortBy, sortDir });
      if (role) params.set('role', role);
      if (filterActive !== 'all') params.set('isActive', String(filterActive === 'active'));
      const data = await adminFetch(`users?${params}`);
      if (data.success) { setUsers(data.users ?? []); setTotal(data.total ?? 0); }
      else setError(data.error || 'Failed to load users');
    } catch { setError('Network error — check your connection'); }
    finally { setLoading(false); }
  }, [page, search, role, sortBy, sortDir, filterActive]);

  const loadCounts = useCallback(async () => {
    try {
      const [all, student, teacher, active] = await Promise.all([
        adminFetch('users?page=1&limit=1'),
        adminFetch('users?page=1&limit=1&role=STUDENT'),
        adminFetch('users?page=1&limit=1&role=TEACHER'),
        adminFetch('users?page=1&limit=1&isActive=true'),
      ]);
      setCounts({ all: all.total ?? 0, student: student.total ?? 0, teacher: teacher.total ?? 0, active: active.total ?? 0 });
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCounts(); }, [loadCounts]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [search, role, sortBy, sortDir, filterActive]);

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleToggleActive = async (user: UserRow) => {
    setToggling(user.id);
    try {
      await adminFetch(`users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      if (viewUser?.id === user.id) setViewUser(prev => prev ? { ...prev, isActive: !prev.isActive } : prev);
      setCounts(prev => ({ ...prev, active: prev.active + (user.isActive ? -1 : 1) }));
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
          active:  deleteTarget.isActive ? prev.active - 1 : prev.active,
        }));
        setDeleteTarget(null);
        setViewUser(null);
        setSelected(prev => { const s = new Set(prev); s.delete(deleteTarget.id); return s; });
      } else {
        setError(data.error || 'Delete failed');
        setDeleteTarget(null);
      }
    } catch { setError('Network error during delete'); setDeleteTarget(null); }
    finally { setDeleting(false); }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    let deleted = 0;
    for (const id of selected) {
      try {
        const data = await adminFetch(`users/${id}`, { method: 'DELETE' });
        if (data.success) {
          deleted++;
          const u = users.find(u => u.id === id);
          if (u) setCounts(prev => ({
            all:     prev.all - 1,
            student: u.role === 'STUDENT' ? prev.student - 1 : prev.student,
            teacher: u.role === 'TEACHER' ? prev.teacher - 1 : prev.teacher,
            active:  u.isActive ? prev.active - 1 : prev.active,
          }));
        }
      } catch { /* skip */ }
    }
    setUsers(prev => prev.filter(u => !selected.has(u.id)));
    setTotal(prev => prev - deleted);
    setSelected(new Set());
    setBulkDeleting(false);
  };

  const handleBulkToggle = async (active: boolean) => {
    for (const id of selected) {
      const user = users.find(u => u.id === id);
      if (!user || user.isActive === active) continue;
      await adminFetch(`users/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: active }) });
    }
    setUsers(prev => prev.map(u => selected.has(u.id) ? { ...u, isActive: active } : u));
    setSelected(new Set());
    await loadCounts();
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Role', 'Phone', 'Location', 'Status', 'Joined', 'ID'],
      ...users.map(u => [
        u.name ?? '', u.email, u.role, u.phone ?? '',
        u.location ?? '', u.isActive ? 'Active' : 'Inactive', fmtDate(u.createdAt), u.id,
      ]),
    ].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `users-${role || 'all'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const toggleSelectAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map(u => u.id)));
  };

  const totalPages = Math.ceil(total / LIMIT);
  const tp  = dm ? 'text-white'    : 'text-gray-900';
  const tm  = dm ? 'text-gray-400' : 'text-gray-500';
  const bdr = dm ? 'border-gray-800' : 'border-gray-200';

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col
      ? sortDir === 'asc' ? <SortAsc className="w-3.5 h-3.5 text-orange-400" /> : <SortDesc className="w-3.5 h-3.5 text-orange-400" />
      : <SortAsc className={`w-3.5 h-3.5 opacity-30 ${tm}`} />;

  const TABS = [
    { key: '',        label: 'All',      count: counts.all,     icon: Users,         grad: 'from-slate-500 to-gray-600' },
    { key: 'STUDENT', label: 'Students', count: counts.student, icon: GraduationCap, grad: 'from-blue-500 to-cyan-500'  },
    { key: 'TEACHER', label: 'Teachers', count: counts.teacher, icon: Briefcase,     grad: 'from-violet-500 to-fuchsia-500' },
  ];

  const ACTIVE_FILTERS = [
    { key: 'all',      label: 'All Status' },
    { key: 'active',   label: 'Active'     },
    { key: 'inactive', label: 'Inactive'   },
  ] as const;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .row-enter { animation: fadeIn 0.2s ease; }
      `}</style>

      <div className="space-y-4">

        {/* ── Stats row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Users"    value={counts.all}     icon={Users}         gradient="from-slate-500 to-gray-600"         dm={dm} />
          <StatCard label="Students"       value={counts.student} icon={GraduationCap} gradient="from-blue-500 to-cyan-500"           dm={dm} />
          <StatCard label="Teachers"       value={counts.teacher} icon={Briefcase}     gradient="from-violet-500 to-fuchsia-500"      dm={dm} />
          <StatCard label="Active Now"     value={counts.active}  icon={Activity}      gradient="from-emerald-500 to-teal-500"        dm={dm} />
        </div>

        {/* ── Role tabs ───────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(({ key, label, count, icon: Icon, grad }) => (
            <button key={key} onClick={() => setRole(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap flex-shrink-0 transition-all hover:scale-[1.02] ${
                role === key
                  ? `bg-gradient-to-r ${grad} text-white shadow-lg`
                  : dm
                    ? 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200'
                    : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                role === key ? 'bg-white/20 text-white' : dm ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}>{count}</span>
            </button>
          ))}

          {/* Status filter pills */}
          <div className={`h-8 w-px mx-1 self-center ${dm ? 'bg-gray-700' : 'bg-gray-200'}`} />
          {ACTIVE_FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilterActive(key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                filterActive === key
                  ? key === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                    : key === 'inactive'
                      ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'
                      : dm ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
                  : dm ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}>{label}</button>
          ))}
        </div>

        {/* ── Search & actions ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${tm}`} />
            <input ref={searchRef} type="text" placeholder="Search users by name or email…"
              value={search} onChange={e => setSearch(e.target.value)}
              className={`w-full pl-10 pr-16 py-2.5 border-2 rounded-xl text-sm outline-none transition-all ${
                dm
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600 focus:border-orange-500/60'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400'
              }`} />
            {search && (
              <button onClick={() => setSearch('')}
                className={`absolute right-8 top-1/2 -translate-y-1/2 ${tm} hover:text-red-400`}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className={`absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border ${dm ? 'border-gray-700 text-gray-600' : 'border-gray-200 text-gray-400'}`}>⌘K</kbd>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold hidden sm:block px-3 py-2 rounded-xl ${dm ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
              {total} user{total !== 1 ? 's' : ''}
            </span>
            <button onClick={exportCSV} title="Export as CSV"
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 ${dm ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-green-400 hover:border-green-500/40' : 'bg-white border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-300'}`}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={load} title="Refresh list"
              className={`p-2.5 rounded-xl border transition-all hover:scale-105 ${dm ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-500/50 hover:text-orange-400' : 'bg-white border-gray-200 text-gray-500 hover:border-orange-400 hover:text-orange-500'}`}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Bulk action bar ────────────────────────────────────────── */}
        {selected.size > 0 && (
          <BulkActionBar
            count={selected.size} dm={dm}
            onActivate={() => handleBulkToggle(true)}
            onDeactivate={() => handleBulkToggle(false)}
            onDelete={handleBulkDelete}
            onClear={() => setSelected(new Set())}
          />
        )}

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <div className="p-4 bg-red-500/10 border-2 border-red-500/20 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={() => { setError(''); load(); }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors">
              Retry
            </button>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Table ──────────────────────────────────────────────────── */}
        <div className={`rounded-2xl border overflow-hidden ${bdr}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className={dm ? 'bg-gray-800/80' : 'bg-gray-50'}>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox"
                      checked={users.length > 0 && selected.size === users.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded accent-orange-500 cursor-pointer" />
                  </th>
                  {[
                    { label: 'User', col: 'name' as const },
                    { label: 'Role', col: null },
                    { label: 'Status', col: null },
                    { label: 'Joined', col: 'createdAt' as const },
                    { label: 'Actions', col: null },
                  ].map(({ label, col }) => (
                    <th key={label}
                      onClick={col ? () => toggleSort(col) : undefined}
                      className={`text-left px-4 py-3 text-[11px] font-black uppercase tracking-wider select-none ${tm} ${col ? 'cursor-pointer hover:text-orange-400 transition-colors' : ''}`}>
                      <span className="flex items-center gap-1.5">
                        {label}
                        {col && <SortIcon col={col} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${dm ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {loading ? (
                  <tr><td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
                        <div className="relative w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <Loader className="w-5 h-5 text-orange-500 animate-spin" />
                        </div>
                      </div>
                      <p className={`text-xs font-semibold ${tm}`}>Loading users…</p>
                    </div>
                  </td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="py-24 text-center">
                    <div className={`flex flex-col items-center gap-3`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dm ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <Users className={`w-7 h-7 ${tm}`} />
                      </div>
                      <p className={`text-sm font-bold ${tm}`}>{search ? 'No users match your search' : 'No users found'}</p>
                      {search && <button onClick={() => setSearch('')} className="text-xs text-orange-400 hover:text-orange-300 font-semibold">Clear search</button>}
                    </div>
                  </td></tr>
                ) : users.map((user, idx) => {
                  const isSelected = selected.has(user.id);
                  return (
                    <tr key={user.id}
                      className={`row-enter transition-colors cursor-pointer group ${
                        isSelected
                          ? dm ? 'bg-orange-500/10' : 'bg-orange-50'
                          : dm ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
                      }`}>

                      <td className="px-4 py-3.5" onClick={e => { e.stopPropagation(); toggleSelect(user.id); }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(user.id)}
                          className="w-4 h-4 rounded accent-orange-500 cursor-pointer" />
                      </td>

                      <td className="px-4 py-3.5" onClick={() => setViewUser(user)}>
                        <div className="flex items-center gap-3">
                          <Avatar user={user} size="sm" />
                          <div className="min-w-0">
                            <p className={`font-bold text-sm truncate ${tp}`}>{user.name ?? '—'}</p>
                            <div className="flex items-center gap-1">
                              <p className={`text-xs truncate ${tm}`}>{user.email}</p>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5" onClick={() => setViewUser(user)}>
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                          user.role === 'TEACHER'
                            ? 'bg-violet-500/15 text-violet-400'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}>{user.role}</span>
                      </td>

                      <td className="px-4 py-3.5" onClick={() => setViewUser(user)}>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          user.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className={`px-4 py-3.5 text-xs ${tm}`} onClick={() => setViewUser(user)}>
                        <span className="hidden sm:inline">{fmtDate(user.createdAt)}</span>
                        <span className="sm:hidden">{fmtDateShort(user.createdAt)}</span>
                      </td>

                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewUser(user)} title="View profile"
                            className={`p-2 rounded-lg transition-colors ${dm ? 'hover:bg-gray-700 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleToggleActive(user)} disabled={toggling === user.id}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
                              user.isActive
                                ? dm ? 'hover:bg-amber-500/20 text-amber-500/60 hover:text-amber-400' : 'hover:bg-amber-50 text-amber-400'
                                : dm ? 'hover:bg-emerald-500/20 text-emerald-500/60 hover:text-emerald-400' : 'hover:bg-emerald-50 text-emerald-500'
                            }`}>
                            {toggling === user.id
                              ? <Loader className="w-3.5 h-3.5 animate-spin" />
                              : user.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => setDeleteTarget(user)} title="Delete account"
                            className={`p-2 rounded-lg transition-colors ${dm ? 'hover:bg-red-500/20 text-red-500/60 hover:text-red-400' : 'hover:bg-red-50 text-red-400'}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-4 py-3 border-t ${dm ? 'border-gray-800 bg-gray-800/40' : 'border-gray-100 bg-gray-50'}`}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100 ${dm ? 'hover:bg-gray-700 text-gray-300 bg-gray-800 border border-gray-700' : 'hover:bg-gray-200 text-gray-700 bg-white border border-gray-200'}`}>
                <ChevronLeft className="w-3.5 h-3.5" />Prev
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1;
                  if (totalPages > 5) {
                    if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                  }
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all hover:scale-110 ${
                        p === page
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/20'
                          : dm ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
                      }`}>{p}</button>
                  );
                })}
              </div>

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100 ${dm ? 'hover:bg-gray-700 text-gray-300 bg-gray-800 border border-gray-700' : 'hover:bg-gray-200 text-gray-700 bg-white border border-gray-200'}`}>
                Next<ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Page info */}
        <p className={`text-xs text-center ${tm}`}>
          Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total} users
          {selected.size > 0 && ` · ${selected.size} selected`}
        </p>

        {/* ── Modals ───────────────────────────────────────────────────── */}
        {viewUser && (
          <UserProfileModal
            user={viewUser} dm={dm}
            onClose={() => setViewUser(null)}
            onDelete={u => { setViewUser(null); setDeleteTarget(u); }}
            onToggleActive={handleToggleActive}
            toggling={toggling === viewUser.id}
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

        {/* Bulk deleting overlay */}
        {bulkDeleting && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className={`px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-4 ${dm ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
              <Loader className="w-6 h-6 text-orange-500 animate-spin" />
              <p className={`font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Deleting {selected.size} accounts…</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}