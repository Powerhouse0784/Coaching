'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  MessageSquare, ThumbsUp, Send, Paperclip, Image as ImageIcon,
  FileText, X, Filter, Search, Clock, CheckCircle2, Pin, Trash2,
  AlertCircle, Smile, Book, Users, TrendingUp, Upload, Loader,
} from 'lucide-react';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="p-4 text-sm text-gray-500">Loading...</div>,
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
  student: User;
  isMyDoubt: boolean;
  hasUpvoted: boolean;
  stats: { totalReplies: number; totalUpvotes: number };
  replies: Reply[];
}

interface UploadFileResponse {
  url: string;
  name: string;
  size?: number;
}

const PRIORITIES = [
  { value: 'low', label: 'Low', lightColor: 'text-green-700 bg-green-100 border-green-300', darkColor: 'text-green-300 bg-green-900/50 border-green-700' },
  { value: 'normal', label: 'Normal', lightColor: 'text-blue-700 bg-blue-100 border-blue-300', darkColor: 'text-blue-300 bg-blue-900/50 border-blue-700' },
  { value: 'high', label: 'High', lightColor: 'text-orange-700 bg-orange-100 border-orange-300', darkColor: 'text-orange-300 bg-orange-900/50 border-orange-700' },
  { value: 'urgent', label: 'Urgent', lightColor: 'text-red-700 bg-red-100 border-red-300', darkColor: 'text-red-300 bg-red-900/50 border-red-700' },
];

export default function StudentDoubtsComponent() {
  const { data: session } = useSession();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submittingDoubt, setSubmittingDoubt] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Dark mode — same MutationObserver pattern as AssignmentCard
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const dm = darkMode;

  const [doubtForm, setDoubtForm] = useState({
    title: '', description: '', subject: '', priority: 'normal',
    imageUrl: '', imageName: '', pdfUrl: '', pdfName: '',
  });

  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState({ url: '', name: '' });
  const [replyPdf, setReplyPdf] = useState({ url: '', name: '' });
  const [submittingReply, setSubmittingReply] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (typeof window !== 'undefined') {
      import('react-hot-toast').then((mod) => {
        type === 'success' ? mod.toast.success(message) : mod.toast.error(message);
      });
    }
  };

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter, subject: subjectFilter, search: searchQuery });
      const res = await fetch(`/api/doubts?${params}`);
      const data = await res.json();
      if (data.success) setDoubts(data.doubts);
      else showToast('Failed to fetch doubts', 'error');
    } catch { showToast('Error loading doubts', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDoubts(); }, [filter, subjectFilter, searchQuery]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node))
        setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleSubmitDoubt = async () => {
    if (!doubtForm.title || !doubtForm.description || !doubtForm.subject) {
      showToast('Please fill in all required fields', 'error'); return;
    }
    setSubmittingDoubt(true);
    try {
      const res = await fetch('/api/doubts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doubtForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Doubt posted successfully!');
        setShowAskModal(false);
        setDoubtForm({ title: '', description: '', subject: '', priority: 'normal', imageUrl: '', imageName: '', pdfUrl: '', pdfName: '' });
        fetchDoubts();
      } else showToast(data.error || 'Failed to post doubt', 'error');
    } catch { showToast('Error posting doubt', 'error'); }
    finally { setSubmittingDoubt(false); }
  };

  const handleUpvoteDoubt = async (doubtId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/doubts', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId, action: 'upvote' }),
      });
      fetchDoubts();
    } catch { console.error('Error upvoting doubt'); }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() && !replyImage.url && !replyPdf.url) {
      showToast('Please add some content to your reply', 'error'); return;
    }
    if (!selectedDoubt) return;
    setSubmittingReply(true);
    try {
      const res = await fetch('/api/doubts/reply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doubtId: selectedDoubt.id, content: replyText,
          imageUrl: replyImage.url || null, imageName: replyImage.name || null,
          pdfUrl: replyPdf.url || null, pdfName: replyPdf.name || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Reply posted successfully!');
        setReplyText(''); setReplyImage({ url: '', name: '' }); setReplyPdf({ url: '', name: '' });
        fetchDoubts();
      } else showToast(data.error || 'Failed to post reply', 'error');
    } catch { showToast('Error posting reply', 'error'); }
    finally { setSubmittingReply(false); }
  };

  const handleUpvoteReply = async (replyId: string) => {
    try {
      await fetch('/api/doubts/reply', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyId }),
      });
      fetchDoubts();
    } catch { console.error('Error upvoting reply'); }
  };

  const handleDeleteDoubt = async (doubtId: string) => {
    if (!confirm('Are you sure you want to delete this doubt?')) return;
    try {
      const res = await fetch(`/api/doubts?id=${doubtId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showToast('Doubt deleted successfully'); setSelectedDoubt(null); setShowDetailModal(false); fetchDoubts(); }
      else showToast(data.error || 'Failed to delete doubt', 'error');
    } catch { showToast('Error deleting doubt', 'error'); }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    try {
      const res = await fetch(`/api/doubts/reply?id=${replyId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { showToast('Reply deleted successfully'); fetchDoubts(); }
      else showToast(data.error || 'Failed to delete reply', 'error');
    } catch { showToast('Error deleting reply', 'error'); }
  };

  const formatTimeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const dy = Math.floor(h / 24); if (dy < 7) return `${dy}d ago`;
    const w = Math.floor(dy / 7); if (w < 4) return `${w}w ago`;
    return new Date(d).toLocaleDateString();
  };

  const getPriorityBadge = (priority: string, dark: boolean) => {
    const p = PRIORITIES.find(pr => pr.value === priority);
    if (!p) return null;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${dark ? p.darkColor : p.lightColor}`}>
        {p.label}
      </span>
    );
  };

  // Sorted replies
  const sortedReplies = (replies: Reply[]) =>
    [...replies].sort((a, b) => {
      if (a.user.role === 'TEACHER' && b.user.role !== 'TEACHER') return -1;
      if (a.user.role !== 'TEACHER' && b.user.role === 'TEACHER') return 1;
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Reply panel (shared between sidebar and mobile modal)
  const ReplyPanel = ({ doubt }: { doubt: Doubt }) => (
    <div className="flex flex-col h-full">
      {/* Doubt summary */}
      <div className={`mb-3 sm:mb-4 pb-3 sm:pb-4 border-b-2 ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
          {getPriorityBadge(doubt.priority, dm)}
          {doubt.isSolved && (
            <span className={`flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-semibold border ${dm ? 'bg-green-900/50 text-green-300 border-green-700' : 'bg-green-100 text-green-700 border-green-300'}`}>
              <CheckCircle2 className="w-3 h-3" /> Solved
            </span>
          )}
        </div>
        <h4 className={`font-bold text-sm sm:text-base mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>{doubt.title}</h4>
        <p className={`text-xs sm:text-sm leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{doubt.description}</p>
        {doubt.imageUrl && (
          <div className="mt-3">
            <Image src={doubt.imageUrl} alt={doubt.imageName || 'Doubt image'} width={400} height={300} className="rounded-xl border w-full object-cover max-h-48" />
          </div>
        )}
        {doubt.pdfUrl && (
          <a href={doubt.pdfUrl} target="_blank" rel="noopener noreferrer"
            className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${dm ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60 border border-red-700' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}>
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{doubt.pdfName || 'Download PDF'}</span>
          </a>
        )}
      </div>

      {/* Replies list */}
      <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 mb-3 sm:mb-4 min-h-0">
        {doubt.replies.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <MessageSquare className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>No replies yet. Be the first to help!</p>
          </div>
        ) : (
          sortedReplies(doubt.replies).map((reply) => (
            <div key={reply.id} className={`p-3 sm:p-4 rounded-xl border-2 ${
              reply.user.role === 'TEACHER'
                ? dm ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-300'
                : reply.isPinned
                ? dm ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-300'
                : reply.isAccepted
                ? dm ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-300'
                : dm ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-2 sm:gap-3 mb-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0 ${
                  reply.user.role === 'TEACHER' ? 'bg-gradient-to-br from-purple-500 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}>
                  {reply.user.avatar
                    ? <img src={reply.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    : reply.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-0.5">
                    <span className={`font-semibold text-xs sm:text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{reply.user.name}</span>
                    {reply.user.role === 'TEACHER' && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold ${dm ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>Teacher</span>
                    )}
                    {reply.isPinned && <Pin className="w-3 h-3 text-amber-500" fill="currentColor" />}
                    {reply.isAccepted && <CheckCircle2 className="w-3 h-3 text-green-500" fill="currentColor" />}
                  </div>
                  <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{formatTimeAgo(reply.createdAt)}</p>
                </div>
              </div>
              <p className={`text-xs sm:text-sm whitespace-pre-line mb-2 leading-relaxed ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{reply.content}</p>
              {reply.imageUrl && (
                <div className="mb-2">
                  <Image src={reply.imageUrl} alt={reply.imageName || 'Reply image'} width={300} height={200} className="rounded-lg border w-full object-cover max-h-36" />
                </div>
              )}
              {reply.pdfUrl && (
                <a href={reply.pdfUrl} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold mb-2 ${dm ? 'bg-red-900/40 text-red-300 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{reply.pdfName || 'Download PDF'}</span>
                </a>
              )}
              <div className="flex items-center gap-3 text-xs">
                <button onClick={() => handleUpvoteReply(reply.id)}
                  className={`flex items-center gap-1 transition ${reply.hasUpvoted ? 'text-blue-500 font-semibold' : dm ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}>
                  <ThumbsUp className="w-3.5 h-3.5" fill={reply.hasUpvoted ? 'currentColor' : 'none'} />
                  <span>{reply.upvotes}</span>
                </button>
                {reply.isMyReply && (
                  <button onClick={() => handleDeleteReply(reply.id)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-400 ml-auto">
                    <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply input */}
      <div className={`border-t-2 pt-2 sm:pt-3 md:pt-4 ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
        {(replyImage.url || replyPdf.url) && (
          <div className="mb-2 space-y-1.5">
            {replyImage.url && (
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${dm ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                <span className={`text-xs flex-1 truncate ${dm ? 'text-blue-300' : 'text-blue-800'}`}>{replyImage.name}</span>
                <button onClick={() => setReplyImage({ url: '', name: '' })} className="text-red-500 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
            {replyPdf.url && (
              <div className={`flex items-center gap-2 p-2 rounded-lg border ${dm ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'}`}>
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                <span className={`text-xs flex-1 truncate ${dm ? 'text-red-300' : 'text-red-800'}`}>{replyPdf.name}</span>
                <button onClick={() => setReplyPdf({ url: '', name: '' })} className="text-red-500 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
        )}

        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write your answer..."
          rows={2}
          className={`w-full px-3 py-2 sm:py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs sm:text-sm mb-2 ${
            dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-300 text-gray-900'
          }`}
        />

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Emoji */}
          <div className="relative" ref={emojiPickerRef}>
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-lg transition ${dm ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
              title="Add emoji">
              <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-10 left-0 z-50">
                <EmojiPicker onEmojiClick={(e: any) => { setReplyText(replyText + e.emoji); setShowEmojiPicker(false); }} />
              </div>
            )}
          </div>

          {/* Image upload */}
          <UploadButton<OurFileRouter, "doubtImage">
            endpoint="doubtImage"
            onClientUploadComplete={(res: UploadFileResponse[] | undefined) => {
              if (res?.[0]) { setReplyImage({ url: res[0].url, name: res[0].name }); showToast('Image uploaded!'); }
            }}
            onUploadError={(e: Error) => showToast(`Upload failed: ${e.message}`, 'error')}
            appearance={{
              button: `p-2 rounded-lg transition-colors text-white bg-blue-600 hover:bg-blue-700`,
              allowedContent: 'hidden',
            }}
            content={{ button: () => <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> }}
          />

          {/* PDF upload */}
          <UploadButton<OurFileRouter, "doubtPdf">
            endpoint="doubtPdf"
            onClientUploadComplete={(res: UploadFileResponse[] | undefined) => {
              if (res?.[0]) { setReplyPdf({ url: res[0].url, name: res[0].name }); showToast('PDF uploaded!'); }
            }}
            onUploadError={(e: Error) => showToast(`Upload failed: ${e.message}`, 'error')}
            appearance={{
              button: `p-2 rounded-lg transition-colors text-white bg-red-600 hover:bg-red-700`,
              allowedContent: 'hidden',
            }}
            content={{ button: () => <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> }}
          />

          {/* Post reply */}
          <button
            onClick={handleSubmitReply}
            disabled={submittingReply || (!replyText.trim() && !replyImage.url && !replyPdf.url)}
            className="flex-1 min-w-[80px] px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            {submittingReply
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> <span className="hidden xs:inline">Posting...</span></>
              : <><Send className="w-3.5 h-3.5" /> Post</>}
          </button>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className={`min-h-screen transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 md:py-8">

        {/* Header card */}
        <div className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 lg:p-6 mb-4 sm:mb-5 md:mb-6 shadow-lg transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent mb-1">
                Discussion Forum
              </h1>
              <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Ask questions, get answers, and help fellow students</p>
            </div>
            <button
              onClick={() => setShowAskModal(true)}
              className="self-start sm:self-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden xs:inline">Ask a Doubt</span>
              <span className="xs:hidden">Ask</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
            {[
              { icon: MessageSquare, label: 'Total', value: doubts.length, lightCls: 'from-blue-50 to-blue-100 text-blue-700', darkCls: 'from-blue-900/40 to-blue-900/20 text-blue-300', valCls: dm ? 'text-blue-200' : 'text-blue-900' },
              { icon: CheckCircle2, label: 'Solved', value: doubts.filter(d => d.isSolved).length, lightCls: 'from-green-50 to-green-100 text-green-700', darkCls: 'from-green-900/40 to-green-900/20 text-green-300', valCls: dm ? 'text-green-200' : 'text-green-900' },
              { icon: Users, label: 'My Doubts', value: doubts.filter(d => d.isMyDoubt).length, lightCls: 'from-orange-50 to-orange-100 text-orange-700', darkCls: 'from-orange-900/40 to-orange-900/20 text-orange-300', valCls: dm ? 'text-orange-200' : 'text-orange-900' },
              { icon: TrendingUp, label: 'Active', value: doubts.filter(d => !d.isSolved).length, lightCls: 'from-purple-50 to-purple-100 text-purple-700', darkCls: 'from-purple-900/40 to-purple-900/20 text-purple-300', valCls: dm ? 'text-purple-200' : 'text-purple-900' },
            ].map(({ icon: Icon, label, value, lightCls, darkCls, valCls }, i) => (
              <div key={i} className={`bg-gradient-to-br ${dm ? darkCls : lightCls} p-2.5 sm:p-3 md:p-4 rounded-xl border ${dm ? 'border-gray-700' : 'border-transparent'}`}>
                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-[10px] xs:text-xs font-medium">{label}</span>
                </div>
                <p className={`text-lg sm:text-xl md:text-2xl font-bold ${valCls}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search doubts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs sm:text-sm ${
                  dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-3 py-2 sm:py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-semibold text-xs sm:text-sm ${
                dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="solved">Solved</option>
              <option value="myDoubts">My Doubts</option>
            </select>
            <input
              type="text"
              placeholder="Subject..."
              value={subjectFilter === 'all' ? '' : subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value || 'all')}
              className={`px-3 py-2 sm:py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs sm:text-sm ${
                dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Doubts list */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {loading ? (
              <div className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 lg:p-6 text-center py-8 sm:py-12 transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Loading doubts...</p>
              </div>
            ) : doubts.length === 0 ? (
              <div className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 lg:p-6 text-center py-8 sm:py-12 transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <MessageSquare className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto mb-3 sm:mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-base sm:text-lg md:text-xl font-bold mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>No doubts found</h3>
                <p className={`text-xs sm:text-sm mb-4 sm:mb-5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Be the first to ask a question!</p>
                <button onClick={() => setShowAskModal(true)}
                  className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition text-xs sm:text-sm md:text-base">
                  Ask Your First Doubt
                </button>
              </div>
            ) : (
              doubts.map((doubt) => (
                <div
                  key={doubt.id}
                  onClick={() => {
                    setSelectedDoubt(doubt);
                    setShowDetailModal(true);
                  }}
                  className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 md:p-5 lg:p-6 cursor-pointer hover:shadow-xl transition-all ${
                    selectedDoubt?.id === doubt.id
                      ? dm ? 'border-blue-500 ring-2 ring-blue-500/30 bg-gray-800' : 'border-blue-500 ring-4 ring-blue-100 bg-white'
                      : dm ? 'bg-gray-800 border-gray-700 hover:border-blue-600' : 'bg-white border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg flex-shrink-0 shadow-md">
                      {doubt.student.avatar
                        ? <img src={doubt.student.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        : doubt.student.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-sm sm:text-base md:text-lg lg:text-xl mb-1 truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{doubt.title}</h3>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] xs:text-xs sm:text-sm">
                            <span className={`font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{doubt.student.name}</span>
                            <span className={dm ? 'text-gray-500' : 'text-gray-400'}>•</span>
                            <span className={`flex items-center gap-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                              <Clock className="w-3 h-3" />{formatTimeAgo(doubt.createdAt)}
                            </span>
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${dm ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                              {doubt.subject}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-1.5 flex-shrink-0">
                          {getPriorityBadge(doubt.priority, dm)}
                          {doubt.isSolved && (
                            <span className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${dm ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'}`}>
                              <CheckCircle2 className="w-3 h-3" /> Solved
                            </span>
                          )}
                        </div>
                      </div>

                      <p className={`text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{doubt.description}</p>

                      {(doubt.imageUrl || doubt.pdfUrl) && (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                          {doubt.imageUrl && (
                            <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs ${dm ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                              <ImageIcon className="w-3 h-3" /> <span className="hidden xs:inline">Image</span>
                            </div>
                          )}
                          {doubt.pdfUrl && (
                            <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs ${dm ? 'bg-red-900/40 text-red-300' : 'bg-red-50 text-red-700'}`}>
                              <FileText className="w-3 h-3" /> <span className="hidden xs:inline">PDF</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 sm:gap-3 md:gap-5 text-xs sm:text-sm">
                        <button
                          onClick={(e) => handleUpvoteDoubt(doubt.id, e)}
                          className={`flex items-center gap-1 sm:gap-1.5 transition ${doubt.hasUpvoted ? 'text-blue-500 font-semibold' : dm ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={doubt.hasUpvoted ? 'currentColor' : 'none'} />
                          <span>{doubt.stats.totalUpvotes}</span>
                        </button>
                        <span className={`flex items-center gap-1 sm:gap-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {doubt.stats.totalReplies}
                        </span>
                        {doubt.isMyDoubt && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteDoubt(doubt.id); }}
                            className="flex items-center gap-1 sm:gap-1.5 text-red-500 hover:text-red-400 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            {selectedDoubt ? (
              <div
                className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 lg:p-6 sticky top-4 flex flex-col shadow-lg overflow-hidden transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{ maxHeight: 'calc(100vh - 6rem)' }}
              >
                <div className={`flex items-center justify-between pb-3 border-b-2 flex-shrink-0 ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`font-bold text-base ${dm ? 'text-white' : 'text-gray-900'}`}>Replies ({selectedDoubt.replies.length})</h3>
                  <button
                    onClick={() => setSelectedDoubt(null)}
                    className={`p-1.5 rounded-lg transition ${dm ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 mt-3">
                  <ReplyPanel doubt={selectedDoubt} />
                </div>
              </div>
            ) : (
              <div className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 lg:p-6 text-center py-8 sm:py-12 sticky top-4 shadow-lg transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <MessageSquare className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Select a doubt to view replies</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Reply detail modal */}
      {showDetailModal && selectedDoubt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:hidden z-50">
          <div className={`rounded-t-2xl w-full flex flex-col shadow-2xl transition-colors ${dm ? 'bg-gray-900' : 'bg-white'}`} style={{ maxHeight: '90vh' }}>
            <div className={`flex items-center justify-between p-4 border-b-2 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
              <h3 className={`font-bold text-base ${dm ? 'text-white' : 'text-gray-900'}`}>Replies ({selectedDoubt.replies.length})</h3>
              <button onClick={() => setShowDetailModal(false)}
                className={`p-2 rounded-lg transition ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-hidden flex flex-col min-h-0">
              <ReplyPanel doubt={selectedDoubt} />
            </div>
          </div>
        </div>
      )}

      {/* Ask Doubt Modal */}
      {showAskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl lg:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-colors ${dm ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`p-4 sm:p-6 border-b-2 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  Ask a Doubt
                </h2>
                <button onClick={() => setShowAskModal(false)}
                  className={`p-2 rounded-lg transition ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 md:space-y-5 overflow-y-auto flex-1">
              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                  Title <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="Brief summary..." value={doubtForm.title}
                  onChange={(e) => setDoubtForm({ ...doubtForm, title: e.target.value })}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs sm:text-sm md:text-base ${
                    dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                  }`} />
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                  Subject <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="e.g., Mathematics, Physics..." value={doubtForm.subject}
                  onChange={(e) => setDoubtForm({ ...doubtForm, subject: e.target.value })}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs sm:text-sm md:text-base ${
                    dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                  }`} />
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Priority</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRIORITIES.map((p) => (
                    <button key={p.value} onClick={() => setDoubtForm({ ...doubtForm, priority: p.value })}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl font-semibold text-xs sm:text-sm transition border-2 ${
                        doubtForm.priority === p.value
                          ? dm ? `${p.darkColor}` : `${p.lightColor}`
                          : dm ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500' : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-1.5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Explain your doubt in detail..."
                  rows={4}
                  value={doubtForm.description}
                  onChange={(e) => setDoubtForm({ ...doubtForm, description: e.target.value })}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none outline-none text-xs sm:text-sm md:text-base ${
                    dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-semibold mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                  Attachments (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className={`border-2 border-dashed rounded-xl p-3 sm:p-4 md:p-5 transition ${dm ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-400'}`}>
                    {doubtForm.imageUrl ? (
                      <div className="relative">
                        <Image src={doubtForm.imageUrl} alt="Preview" width={300} height={200} className="rounded-xl w-full object-cover max-h-36" />
                        <button onClick={() => setDoubtForm({ ...doubtForm, imageUrl: '', imageName: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${dm ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
                          <ImageIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${dm ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <p className={`text-xs sm:text-sm font-semibold mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Upload Image</p>
                        <UploadButton<OurFileRouter, "doubtImage">
                          endpoint="doubtImage"
                          onClientUploadComplete={(res: UploadFileResponse[] | undefined) => {
                            if (res?.[0]) { setDoubtForm({ ...doubtForm, imageUrl: res[0].url, imageName: res[0].name }); showToast('Image uploaded!'); }
                          }}
                          onUploadError={(e: Error) => showToast(`Upload failed: ${e.message}`, 'error')}
                          appearance={{
                            button: 'bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            allowedContent: 'text-xs mt-1 ' + (dm ? 'text-gray-500' : 'text-gray-400'),
                          }}
                          content={{ button: () => <span className="flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> Choose</span> }}
                        />
                      </div>
                    )}
                  </div>

                  <div className={`border-2 border-dashed rounded-xl p-3 sm:p-4 md:p-5 transition ${dm ? 'border-gray-600 hover:border-red-500' : 'border-gray-300 hover:border-red-400'}`}>
                    {doubtForm.pdfUrl ? (
                      <div className={`p-3 rounded-xl border ${dm ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? 'bg-red-900/50' : 'bg-red-100'}`}>
                            <FileText className={`w-4 h-4 sm:w-5 sm:h-5 ${dm ? 'text-red-400' : 'text-red-600'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs sm:text-sm font-semibold truncate ${dm ? 'text-red-200' : 'text-red-900'}`}>{doubtForm.pdfName}</p>
                            <p className={`text-xs ${dm ? 'text-red-400' : 'text-red-700'}`}>PDF attached</p>
                          </div>
                        </div>
                        <button onClick={() => setDoubtForm({ ...doubtForm, pdfUrl: '', pdfName: '' })}
                          className="w-full px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-semibold flex items-center justify-center gap-1">
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${dm ? 'bg-red-900/40' : 'bg-red-100'}`}>
                          <FileText className={`w-5 h-5 sm:w-6 sm:h-6 ${dm ? 'text-red-400' : 'text-red-600'}`} />
                        </div>
                        <p className={`text-xs sm:text-sm font-semibold mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Upload PDF</p>
                        <UploadButton<OurFileRouter, "doubtPdf">
                          endpoint="doubtPdf"
                          onClientUploadComplete={(res: UploadFileResponse[] | undefined) => {
                            if (res?.[0]) { setDoubtForm({ ...doubtForm, pdfUrl: res[0].url, pdfName: res[0].name }); showToast('PDF uploaded!'); }
                          }}
                          onUploadError={(e: Error) => showToast(`Upload failed: ${e.message}`, 'error')}
                          appearance={{
                            button: 'bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            allowedContent: 'text-xs mt-1 ' + (dm ? 'text-gray-500' : 'text-gray-400'),
                          }}
                          content={{ button: () => <span className="flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> Choose</span> }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-4 sm:p-6 border-t-2 flex gap-2 sm:gap-3 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <button onClick={() => setShowAskModal(false)} disabled={submittingDoubt}
                className={`flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 border-2 rounded-xl transition font-semibold text-xs sm:text-sm md:text-base disabled:opacity-50 ${
                  dm ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}>
                Cancel
              </button>
              <button onClick={handleSubmitDoubt}
                disabled={submittingDoubt || !doubtForm.title || !doubtForm.description || !doubtForm.subject}
                className="flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base hover:shadow-xl transition-all">
                {submittingDoubt
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> <span className="hidden xs:inline">Posting...</span></>
                  : <><Send className="w-4 h-4" /> Post</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}