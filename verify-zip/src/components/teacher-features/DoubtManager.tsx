'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  MessageSquare, Search, Send, CheckCircle2, Clock, AlertCircle,
  Flag, ThumbsUp, Pin, Trash2, X, Image as ImageIcon, FileText,
  Filter, TrendingUp, Users, Award, Smile,
} from 'lucide-react';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="p-4 text-sm">Loading...</div>,
});

interface User {
  id: string;
  name: string;
  avatar: string | null;
  email?: string;
  role?: string;
}

interface Reply {
  id: string;
  content: string;
  imageUrl: string | null;
  imageName: string | null;
  pdfUrl: string | null;
  pdfName: string | null;
  isPinned: boolean;
  isAccepted: boolean;
  upvotes: number;
  createdAt: string;
  user: User;
  isMyReply: boolean;
  hasUpvoted: boolean;
}

interface Doubt {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string | null;
  priority: string;
  imageUrl: string | null;
  imageName: string | null;
  pdfUrl: string | null;
  pdfName: string | null;
  status: string;
  isSolved: boolean;
  upvotes: number;
  views: number;
  createdAt: string;
  solvedAt: string | null;
  student: User;
  isMyDoubt: boolean;
  hasUpvoted: boolean;
  stats: { totalReplies: number; totalUpvotes: number };
  replies: Reply[];
}

interface UploadFileResponse { url: string; name: string; size?: number; }

const SUBJECTS = ['All','Mathematics','Physics','Chemistry','Biology','Computer Science','English','History','Geography','Economics','Other'];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    lightColor: 'text-green-700 bg-green-100 border-green-300',  darkColor: 'text-green-300 bg-green-900/40 border-green-700'  },
  { value: 'normal', label: 'Normal', lightColor: 'text-blue-700 bg-blue-100 border-blue-300',     darkColor: 'text-blue-300 bg-blue-900/40 border-blue-700'     },
  { value: 'high',   label: 'High',   lightColor: 'text-orange-700 bg-orange-100 border-orange-300', darkColor: 'text-orange-300 bg-orange-900/40 border-orange-700' },
  { value: 'urgent', label: 'Urgent', lightColor: 'text-red-700 bg-red-100 border-red-300',        darkColor: 'text-red-300 bg-red-900/40 border-red-700'        },
];

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

export default function TeacherDoubtManager() {
  const { data: session } = useSession();
  const dm = useDarkMode();

  const [doubts,          setDoubts]          = useState<Doubt[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedDoubt,   setSelectedDoubt]   = useState<Doubt | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false); // mobile bottom sheet
  const [filter,          setFilter]          = useState('all');
  const [subjectFilter,   setSubjectFilter]   = useState('All');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  const [replyText,       setReplyText]       = useState('');
  const [replyImage,      setReplyImage]      = useState({ url: '', name: '' });
  const [replyPdf,        setReplyPdf]        = useState({ url: '', name: '' });
  const [submittingReply, setSubmittingReply] = useState(false);

  // Close emoji picker on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmojiPicker(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    if (typeof window !== 'undefined') import('react-hot-toast').then(m => type === 'success' ? m.toast.success(msg) : m.toast.error(msg));
  };

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter, subject: subjectFilter === 'All' ? 'all' : subjectFilter, search: searchQuery });
      const res  = await fetch(`/api/doubts?${params}`);
      const data = await res.json();
      if (data.success) setDoubts(data.doubts);
      else showToast('Failed to fetch doubts', 'error');
    } catch { showToast('Error loading doubts', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDoubts(); }, [filter, subjectFilter, searchQuery]);

  const handleSubmitReply = async () => {
    if (!replyText.trim() && !replyImage.url && !replyPdf.url) { showToast('Please add some content to your reply', 'error'); return; }
    if (!selectedDoubt) return;
    setSubmittingReply(true);
    try {
      const res  = await fetch('/api/doubts/reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doubtId: selectedDoubt.id, content: replyText, imageUrl: replyImage.url||null, imageName: replyImage.name||null, pdfUrl: replyPdf.url||null, pdfName: replyPdf.name||null }) });
      const data = await res.json();
      if (data.success) { showToast('Reply posted successfully!'); setReplyText(''); setReplyImage({ url:'', name:'' }); setReplyPdf({ url:'', name:'' }); fetchDoubts(); }
      else showToast(data.error || 'Failed to post reply', 'error');
    } catch { showToast('Error posting reply', 'error'); }
    finally { setSubmittingReply(false); }
  };

  const handleMarkAsSolved = async (doubtId: string) => {
    try {
      const res  = await fetch('/api/doubts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doubtId, action: 'solve' }) });
      const data = await res.json();
      if (data.success) { showToast('Doubt marked as solved!'); fetchDoubts(); }
      else showToast(data.error || 'Failed to mark as solved', 'error');
    } catch { showToast('Error marking as solved', 'error'); }
  };

  const handlePinReply = async (replyId: string) => {
    if (!selectedDoubt) return;
    try {
      const res  = await fetch('/api/doubts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doubtId: selectedDoubt.id, action: 'pin', replyId }) });
      const data = await res.json();
      if (data.success) { showToast('Reply pinned!'); fetchDoubts(); }
      else showToast(data.error || 'Failed to pin reply', 'error');
    } catch { showToast('Error pinning reply', 'error'); }
  };

  const handleDeleteDoubt = async (doubtId: string) => {
    if (!confirm('Are you sure you want to delete this doubt?')) return;
    try {
      const res  = await fetch(`/api/doubts?id=${doubtId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showToast('Doubt deleted'); setSelectedDoubt(null); setShowDetailModal(false); fetchDoubts(); }
      else showToast(data.error || 'Failed to delete', 'error');
    } catch { showToast('Error deleting doubt', 'error'); }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    try {
      const res  = await fetch(`/api/doubts/reply?id=${replyId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showToast('Reply deleted'); fetchDoubts(); }
      else showToast(data.error || 'Failed to delete', 'error');
    } catch { showToast('Error deleting reply', 'error'); }
  };

  const formatTimeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s/60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m/60); if (h < 24) return `${h}h ago`;
    const dy = Math.floor(h/24); if (dy < 7) return `${dy}d ago`;
    const w  = Math.floor(dy/7); if (w < 4) return `${w}w ago`;
    return new Date(d).toLocaleDateString();
  };

  const getPriorityBadge = (priority: string) => {
    const p = PRIORITIES.find(pr => pr.value === priority);
    if (!p) return null;
    return <span className={`px-2 py-0.5 sm:py-1 rounded-lg text-xs font-semibold border ${dm ? p.darkColor : p.lightColor}`}>{p.label}</span>;
  };

  const stats = {
    total:       doubts.length,
    pending:     doubts.filter(d => !d.isSolved).length,
    solved:      doubts.filter(d =>  d.isSolved).length,
    highPriority:doubts.filter(d => d.priority === 'high' || d.priority === 'urgent').length,
  };

  const sortedReplies = (replies: Reply[]) =>
    [...replies].sort((a, b) => {
      if (a.user.role === 'TEACHER' && b.user.role !== 'TEACHER') return -1;
      if (a.user.role !== 'TEACHER' && b.user.role === 'TEACHER') return 1;
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // ── Shared styles ─────────────────────────────────────────────────────────
  const card     = `rounded-xl sm:rounded-2xl border-2 shadow-lg ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'}`;
  const inputCls = `w-full px-3 sm:px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm ${
    dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-purple-300 text-gray-900'
  }`;
  const tp = dm ? 'text-white'    : 'text-slate-900';
  const tm = dm ? 'text-gray-400' : 'text-slate-600';
  const ts = dm ? 'text-gray-500' : 'text-slate-500';

  // ── Reply panel (shared between sidebar + mobile modal) ───────────────────
  const ReplyPanel = ({ doubt }: { doubt: Doubt }) => (
    <div className="flex flex-col">
      {/* Doubt header */}
      <div className={`mb-4 pb-4 border-b-2 ${dm ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg flex-shrink-0">
              {doubt.student.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className={`font-bold text-sm sm:text-base ${tp}`}>{doubt.student.name}</p>
              <p className={`text-xs ${tm}`}>{doubt.subject} • {formatTimeAgo(doubt.createdAt)}</p>
            </div>
          </div>
          <button onClick={() => { setSelectedDoubt(null); setShowDetailModal(false); }} className={`p-1.5 rounded-lg transition lg:hidden flex-shrink-0 ml-2 ${dm ? 'text-gray-400 hover:bg-gray-700' : 'text-slate-400 hover:bg-gray-100'}`}>
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <h4 className={`font-semibold mb-2 text-sm sm:text-base lg:text-lg ${tp}`}>{doubt.title}</h4>
        <p className={`text-xs sm:text-sm mb-3 leading-relaxed ${tm}`}>{doubt.description}</p>

        {doubt.imageUrl && (
          <div className="mb-3">
            <Image src={doubt.imageUrl} alt={doubt.imageName || 'Doubt image'} width={400} height={300} className="rounded-xl border w-full object-cover max-h-40" />
          </div>
        )}
        {doubt.pdfUrl && (
          <a href={doubt.pdfUrl} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm border transition mb-3 ${dm ? 'bg-red-900/30 border-red-700 text-red-300 hover:bg-red-900/50' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'}`}>
            <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{doubt.pdfName || 'Download PDF'}</span>
          </a>
        )}

        {/* Teacher actions */}
        <div className="flex flex-wrap gap-2">
          {!doubt.isSolved && (
            <button onClick={() => handleMarkAsSolved(doubt.id)}
              className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Mark as Solved
            </button>
          )}
          <button onClick={() => handleDeleteDoubt(doubt.id)}
            className={`px-3 sm:px-4 py-2 border-2 rounded-xl transition font-semibold text-xs sm:text-sm flex items-center gap-1.5 ${dm ? 'border-red-700 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-600 hover:bg-red-50'}`}>
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Replies */}
      <div className="mb-4">
        <h4 className={`font-bold mb-3 flex items-center gap-2 text-sm sm:text-base ${tp}`}>
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" /> Replies ({doubt.replies.length})
        </h4>
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '320px' }}>
          {doubt.replies.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 ${dm ? 'text-gray-600' : 'text-slate-400'}`} />
              <p className={`text-xs sm:text-sm ${tm}`}>No replies yet. Be the first to help!</p>
            </div>
          ) : (
            sortedReplies(doubt.replies).map(reply => (
              <div key={reply.id} className={`p-3 sm:p-4 rounded-xl border-2 ${
                reply.user.role === 'TEACHER'
                  ? dm ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-300'
                  : reply.isPinned
                  ? dm ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-300'
                  : reply.isAccepted
                  ? dm ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-300'
                  : dm ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-2 sm:gap-3 mb-2">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0 ${
                    reply.user.role === 'TEACHER' ? 'bg-gradient-to-br from-purple-500 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    {reply.user.avatar
                      ? <img src={reply.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      : reply.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className={`font-semibold text-xs sm:text-sm ${tp}`}>{reply.user.name}</span>
                      {reply.user.role === 'TEACHER' && (
                        <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full font-semibold">Teacher</span>
                      )}
                      {reply.isPinned && <Pin className="w-3 h-3 text-amber-500" fill="currentColor" />}
                      {reply.isAccepted && <CheckCircle2 className="w-3 h-3 text-green-500" fill="currentColor" />}
                    </div>
                    <p className={`text-xs ${ts}`}>{formatTimeAgo(reply.createdAt)}</p>
                  </div>
                </div>

                <p className={`text-xs sm:text-sm whitespace-pre-line mb-2 leading-relaxed ${dm ? 'text-gray-300' : 'text-slate-700'}`}>{reply.content}</p>

                {reply.imageUrl && (
                  <div className="mb-2">
                    <Image src={reply.imageUrl} alt={reply.imageName || 'Reply image'} width={300} height={200} className="rounded-lg border w-full object-cover max-h-32" />
                  </div>
                )}
                {reply.pdfUrl && (
                  <a href={reply.pdfUrl} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border mb-2 ${dm ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{reply.pdfName || 'Download PDF'}</span>
                  </a>
                )}

                <div className="flex items-center gap-2 sm:gap-3 text-xs">
                  <span className={`flex items-center gap-1 ${tm}`}><ThumbsUp className="w-3.5 h-3.5" />{reply.upvotes}</span>
                  {!reply.isPinned && (
                    <button onClick={() => handlePinReply(reply.id)} className="flex items-center gap-1 font-semibold text-amber-500 hover:text-amber-400 transition">
                      <Pin className="w-3.5 h-3.5" /> Pin
                    </button>
                  )}
                  <button onClick={() => handleDeleteReply(reply.id)} className="flex items-center gap-1 text-red-500 hover:text-red-400 font-semibold ml-auto transition">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply input */}
      <div className={`border-t-2 pt-3 sm:pt-4 ${dm ? 'border-gray-700' : 'border-slate-200'}`}>
        <h4 className={`font-semibold mb-2 text-xs sm:text-sm ${tp}`}>Your Response</h4>

        {(replyImage.url || replyPdf.url) && (
          <div className="mb-2 space-y-1.5">
            {replyImage.url && (
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${dm ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
                <ImageIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className={`text-xs flex-1 truncate ${dm ? 'text-purple-300' : 'text-purple-900'}`}>{replyImage.name}</span>
                <button onClick={() => setReplyImage({ url:'', name:'' })} className="text-purple-500 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
            {replyPdf.url && (
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${dm ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'}`}>
                <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className={`text-xs flex-1 truncate ${dm ? 'text-red-300' : 'text-red-900'}`}>{replyPdf.name}</span>
                <button onClick={() => setReplyPdf({ url:'', name:'' })} className="text-red-500 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
        )}

        <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
          placeholder="Type your answer here..."
          rows={3}
          className={`w-full px-3 sm:px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-xs sm:text-sm mb-2 ${
            dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-purple-300 text-slate-900'
          }`}
        />

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <UploadButton<OurFileRouter, "doubtImage">
            endpoint="doubtImage"
            onClientUploadComplete={(res: UploadFileResponse[] | undefined) => { if (res?.[0]) { setReplyImage({ url: res[0].url, name: res[0].name }); showToast('Image uploaded!'); } }}
            onUploadError={(err: Error) => showToast(`Upload failed: ${err.message}`, 'error')}
            appearance={{ button: 'bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-xl transition-colors', allowedContent: 'hidden' }}
            content={{ button: () => <ImageIcon className="w-4 h-4" /> }}
          />
          <UploadButton<OurFileRouter, "doubtPdf">
            endpoint="doubtPdf"
            onClientUploadComplete={(res: UploadFileResponse[] | undefined) => { if (res?.[0]) { setReplyPdf({ url: res[0].url, name: res[0].name }); showToast('PDF uploaded!'); } }}
            onUploadError={(err: Error) => showToast(`Upload failed: ${err.message}`, 'error')}
            appearance={{ button: 'bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl transition-colors', allowedContent: 'hidden' }}
            content={{ button: () => <FileText className="w-4 h-4" /> }}
          />
          <button
            onClick={handleSubmitReply}
            disabled={submittingReply || (!replyText.trim() && !replyImage.url && !replyPdf.url)}
            className="flex-1 min-w-[100px] px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submittingReply
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
              : <><Send className="w-3.5 h-3.5" /> Send Response</>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen p-3 sm:p-4 lg:p-6 transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50'}`}>
      <div className="max-w-7xl mx-auto">

        {/* Header card */}
        <div className={`${card} p-4 sm:p-5 lg:p-6 mb-5 sm:mb-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                Doubt Manager
              </h1>
              <p className={`text-xs sm:text-sm ${tm}`}>Answer student questions and provide guidance</p>
            </div>
            <div className={`self-start sm:self-auto px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold ${dm ? 'bg-purple-900/40 text-purple-300' : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900'}`}>
              👨‍🏫 Teacher Mode
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
            {[
              { icon: MessageSquare, label: 'Total Doubts', value: stats.total,       lc: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',    dc: 'bg-blue-900/30 border-blue-700 text-blue-300',    vc: dm ? 'text-blue-200' : 'text-blue-900'   },
              { icon: Clock,         label: 'Pending',      value: stats.pending,     lc: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700', dc: 'bg-orange-900/30 border-orange-700 text-orange-300', vc: dm ? 'text-orange-200' : 'text-orange-900' },
              { icon: CheckCircle2,  label: 'Solved',       value: stats.solved,      lc: 'from-green-50 to-green-100 border-green-200 text-green-700',  dc: 'bg-green-900/30 border-green-700 text-green-300',  vc: dm ? 'text-green-200' : 'text-green-900' },
              { icon: AlertCircle,   label: 'High Priority',value: stats.highPriority,lc: 'from-red-50 to-red-100 border-red-200 text-red-700',          dc: 'bg-red-900/30 border-red-700 text-red-300',        vc: dm ? 'text-red-200' : 'text-red-900'     },
            ].map(({ icon: Icon, label, value, lc, dc, vc }) => (
              <div key={label} className={`p-3 sm:p-4 rounded-xl border-2 ${dm ? dc : `bg-gradient-to-br ${lc}`}`}>
                <div className={`flex items-center gap-1.5 sm:gap-2 mb-1 text-xs sm:text-sm font-medium ${dm ? lc.split(' ')[3] || 'text-gray-300' : lc.split(' ')[3]}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />{label}
                </div>
                <p className={`text-xl sm:text-2xl font-bold ${vc}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="     Search doubts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputCls} pl-9`} />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)} className={inputCls.replace('w-full', 'sm:w-auto')}>
              <option value="all">All Status</option>
              <option value="open">Open Only</option>
              <option value="solved">Solved Only</option>
            </select>
            <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className={inputCls.replace('w-full', 'sm:w-auto')}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Doubts list */}
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              <div className={`${card} p-10 sm:p-12 text-center`}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className={`text-sm ${tm}`}>Loading doubts...</p>
              </div>
            ) : doubts.length === 0 ? (
              <div className={`${card} p-10 sm:p-12 text-center`}>
                <MessageSquare className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${dm ? 'text-gray-600' : 'text-slate-400'}`} />
                <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${tp}`}>No doubts found</h3>
                <p className={`text-xs sm:text-sm ${tm}`}>No doubts match your current filters.</p>
              </div>
            ) : (
              doubts.map(doubt => (
                <div key={doubt.id}
                  onClick={() => { setSelectedDoubt(doubt); setShowDetailModal(true); }}
                  className={`${card.replace('border-2', 'border-2')} p-4 sm:p-5 lg:p-6 cursor-pointer transition-all hover:shadow-xl ${
                    selectedDoubt?.id === doubt.id
                      ? dm ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-purple-500 ring-4 ring-purple-100'
                      : dm ? 'border-gray-700 hover:border-purple-600' : 'border-transparent hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 shadow-lg">
                      {doubt.student.avatar
                        ? <img src={doubt.student.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        : doubt.student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-sm sm:text-base lg:text-lg mb-1 ${tp}`}>{doubt.title}</h3>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <span className={`font-medium ${tm}`}>{doubt.student.name}</span>
                            <span className={ts}>•</span>
                            <span className={`flex items-center gap-1 ${tm}`}><Clock className="w-3 h-3" />{formatTimeAgo(doubt.createdAt)}</span>
                            <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${dm ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>{doubt.subject}</span>
                            {doubt.class && <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${dm ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-700'}`}>{doubt.class}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 flex-shrink-0">
                          {getPriorityBadge(doubt.priority)}
                          {doubt.isSolved && (
                            <span className={`flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg text-xs font-semibold border ${dm ? 'bg-green-900/40 text-green-300 border-green-700' : 'bg-green-100 text-green-700 border-green-200'}`}>
                              <CheckCircle2 className="w-3 h-3" /> Solved
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed ${tm}`}>{doubt.description}</p>
                      <div className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm">
                        <span className={`flex items-center gap-1.5 ${tm}`}><MessageSquare className="w-3.5 h-3.5" />{doubt.stats.totalReplies} replies</span>
                        <span className={`flex items-center gap-1.5 ${tm}`}><ThumbsUp className="w-3.5 h-3.5" />{doubt.stats.totalUpvotes} votes</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop sidebar reply panel */}
          <div className="hidden lg:block lg:sticky lg:top-4 h-fit">
            {selectedDoubt ? (
              <div className={`${card} p-5 lg:p-6`}>
                <ReplyPanel doubt={selectedDoubt} />
              </div>
            ) : (
              <div className={`${card} p-6 text-center`}>
                <MessageSquare className={`w-14 h-14 mx-auto mb-4 ${dm ? 'text-gray-600' : 'text-slate-400'}`} />
                <p className={`text-sm ${tm}`}>Select a doubt to respond</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {showDetailModal && selectedDoubt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:hidden z-50">
          <div className={`rounded-t-2xl w-full flex flex-col shadow-2xl max-h-[92vh] ${dm ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className={`w-10 h-1 rounded-full ${dm ? 'bg-gray-600' : 'bg-gray-300'}`} />
            </div>
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b-2 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50'}`}>
              <h3 className={`font-bold text-base ${tp}`}>Doubt Details & Reply</h3>
              <button onClick={() => setShowDetailModal(false)} className={`p-2 rounded-xl transition ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-slate-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <ReplyPanel doubt={selectedDoubt} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}