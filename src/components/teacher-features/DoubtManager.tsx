'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  MessageSquare,
  Search,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Flag,
  ThumbsUp,
  Pin,
  Trash2,
  X,
  Image as ImageIcon,
  FileText,
  Filter,
  TrendingUp,
  Users,
  Award,
  Smile,
} from 'lucide-react';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamically import EmojiPicker
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="p-4 text-sm text-slate-600">Loading...</div>,
});

// Types
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
  stats: {
    totalReplies: number;
    totalUpvotes: number;
  };
  replies: Reply[];
}

interface UploadFileResponse {
  url: string;
  name: string;
  size?: number;
}

const SUBJECTS = [
  'All',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History',
  'Geography',
  'Economics',
  'Other',
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'normal', label: 'Normal', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-50 border-red-200' },
];

export default function TeacherDoubtManager() {
  const { data: session } = useSession();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [filter, setFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState({ url: '', name: '' });
  const [replyPdf, setReplyPdf] = useState({ url: '', name: '' });
  const [submittingReply, setSubmittingReply] = useState(false);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (typeof window !== 'undefined') {
      import('react-hot-toast').then((mod) => {
        if (type === 'success') {
          mod.toast.success(message);
        } else {
          mod.toast.error(message);
        }
      });
    }
  };

  // Fetch doubts
  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        filter,
        subject: subjectFilter === 'All' ? 'all' : subjectFilter,
        search: searchQuery,
      });

      const res = await fetch(`/api/doubts?${params}`);
      const data = await res.json();

      if (data.success) {
        setDoubts(data.doubts);
      } else {
        showToast('Failed to fetch doubts', 'error');
      }
    } catch (error) {
      console.error('Error fetching doubts:', error);
      showToast('Error loading doubts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [filter, subjectFilter, searchQuery]);

  // Submit reply
  const handleSubmitReply = async () => {
    if (!replyText.trim() && !replyImage.url && !replyPdf.url) {
      showToast('Please add some content to your reply', 'error');
      return;
    }

    if (!selectedDoubt) return;

    setSubmittingReply(true);
    try {
      const res = await fetch('/api/doubts/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doubtId: selectedDoubt.id,
          content: replyText,
          imageUrl: replyImage.url || null,
          imageName: replyImage.name || null,
          pdfUrl: replyPdf.url || null,
          pdfName: replyPdf.name || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast('Reply posted successfully!');
        setReplyText('');
        setReplyImage({ url: '', name: '' });
        setReplyPdf({ url: '', name: '' });
        fetchDoubts();
        // Update selected doubt
        const updatedDoubt = doubts.find((d) => d.id === selectedDoubt.id);
        if (updatedDoubt) setSelectedDoubt(updatedDoubt);
      } else {
        showToast(data.error || 'Failed to post reply', 'error');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      showToast('Error posting reply', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Mark doubt as solved
  const handleMarkAsSolved = async (doubtId: string) => {
    try {
      const res = await fetch('/api/doubts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId, action: 'solve' }),
      });

      const data = await res.json();

      if (data.success) {
        showToast('Doubt marked as solved!');
        fetchDoubts();
        if (selectedDoubt?.id === doubtId) {
          const updatedDoubt = doubts.find((d) => d.id === doubtId);
          if (updatedDoubt) setSelectedDoubt(updatedDoubt);
        }
      } else {
        showToast(data.error || 'Failed to mark as solved', 'error');
      }
    } catch (error) {
      console.error('Error marking as solved:', error);
      showToast('Error marking as solved', 'error');
    }
  };

  // Pin reply (teacher only)
  const handlePinReply = async (replyId: string) => {
    if (!selectedDoubt) return;

    try {
      const res = await fetch('/api/doubts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doubtId: selectedDoubt.id,
          action: 'pin',
          replyId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast('Reply pinned successfully!');
        fetchDoubts();
        const updatedDoubt = doubts.find((d) => d.id === selectedDoubt.id);
        if (updatedDoubt) setSelectedDoubt(updatedDoubt);
      } else {
        showToast(data.error || 'Failed to pin reply', 'error');
      }
    } catch (error) {
      console.error('Error pinning reply:', error);
      showToast('Error pinning reply', 'error');
    }
  };

  // Delete doubt
  const handleDeleteDoubt = async (doubtId: string) => {
    if (!confirm('Are you sure you want to delete this doubt?')) return;

    try {
      const res = await fetch(`/api/doubts?id=${doubtId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        showToast('Doubt deleted successfully');
        setSelectedDoubt(null);
        fetchDoubts();
      } else {
        showToast(data.error || 'Failed to delete doubt', 'error');
      }
    } catch (error) {
      console.error('Error deleting doubt:', error);
      showToast('Error deleting doubt', 'error');
    }
  };

  // Delete reply
  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    try {
      const res = await fetch(`/api/doubts/reply?id=${replyId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        showToast('Reply deleted successfully');
        fetchDoubts();
        if (selectedDoubt) {
          const updatedDoubt = doubts.find((d) => d.id === selectedDoubt.id);
          if (updatedDoubt) setSelectedDoubt(updatedDoubt);
        }
      } else {
        showToast(data.error || 'Failed to delete reply', 'error');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      showToast('Error deleting reply', 'error');
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return date.toLocaleDateString();
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const p = PRIORITIES.find((pr) => pr.value === priority);
    if (!p) return null;
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${p.color}`}>
        {p.label}
      </span>
    );
  };

  // Calculate stats
  const stats = {
    total: doubts.length,
    pending: doubts.filter((d) => !d.isSolved).length,
    solved: doubts.filter((d) => d.isSolved).length,
    highPriority: doubts.filter((d) => d.priority === 'high' || d.priority === 'urgent').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-purple-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Doubt Manager
              </h1>
              <p className="text-slate-600">
                Answer student questions and provide guidance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                <p className="text-sm font-semibold text-purple-900">
                  👨‍🏫 Teacher Mode
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <MessageSquare size={18} />
                <span className="text-sm font-medium">Total Doubts</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2 text-orange-700 mb-1">
                <Clock size={18} />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{stats.pending}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">Solved</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{stats.solved}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">High Priority</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{stats.highPriority}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search doubts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2.5 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="open">Open Only</option>
              <option value="solved">Solved Only</option>
            </select>

            {/* Subject Filter */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-4 py-2.5 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doubts List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-purple-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading doubts...</p>
              </div>
            ) : doubts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-purple-200">
                <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  No doubts found
                </h3>
                <p className="text-slate-600">
                  No doubts match your current filters.
                </p>
              </div>
            ) : (
              doubts.map((doubt) => (
                <div
                  key={doubt.id}
                  onClick={() => setSelectedDoubt(doubt)}
                  className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl border-2 ${
                    selectedDoubt?.id === doubt.id
                      ? 'border-purple-500 ring-4 ring-purple-100'
                      : 'border-transparent hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                      {doubt.student.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 mb-2 text-lg">
                            {doubt.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                            <span className="font-medium">{doubt.student.name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {formatTimeAgo(doubt.createdAt)}
                            </span>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                              {doubt.subject}
                            </span>
                            {doubt.class && (
                              <>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-medium">
                                  {doubt.class}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(doubt.priority)}
                          {doubt.isSolved && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold border border-green-200">
                              <CheckCircle2 size={14} />
                              Solved
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-slate-700 mb-4 line-clamp-2">
                        {doubt.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <MessageSquare size={16} />
                          {doubt.stats.totalReplies} replies
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <ThumbsUp size={16} />
                          {doubt.stats.totalUpvotes} votes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply Panel */}
          <div className="lg:sticky lg:top-4 h-fit">
            {selectedDoubt ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-200">
                {/* Doubt Header */}
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {selectedDoubt.student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {selectedDoubt.student.name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {selectedDoubt.subject} • {formatTimeAgo(selectedDoubt.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDoubt(null)}
                      className="text-slate-400 hover:text-slate-600 lg:hidden"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <h4 className="font-semibold text-slate-900 mb-2 text-lg">
                    {selectedDoubt.title}
                  </h4>
                  <p className="text-sm text-slate-700 mb-4">
                    {selectedDoubt.description}
                  </p>

                  {/* Attachments */}
                  {selectedDoubt.imageUrl && (
                    <div className="mb-3">
                      <Image
                        src={selectedDoubt.imageUrl}
                        alt={selectedDoubt.imageName || 'Doubt image'}
                        width={400}
                        height={300}
                        className="rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                  {selectedDoubt.pdfUrl && (
                    <a
                      href={selectedDoubt.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm border border-red-200"
                    >
                      <FileText size={16} />
                      <span>{selectedDoubt.pdfName || 'Download PDF'}</span>
                    </a>
                  )}

                  {/* Teacher Actions */}
                  <div className="flex gap-3 mt-4">
                    {!selectedDoubt.isSolved && (
                      <button
                        onClick={() => handleMarkAsSolved(selectedDoubt.id)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        Mark as Solved
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDoubt(selectedDoubt.id)}
                      className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition font-semibold text-sm flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Replies */}
                <div className="mb-6">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MessageSquare size={18} />
                    Replies ({selectedDoubt.replies.length})
                  </h4>

                  {/* ✅ FIXED: Reply sorting - Teacher first, then pinned, then students */}
                  <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                    {selectedDoubt.replies.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 text-sm">
                          No replies yet. Be the first to help!
                        </p>
                      </div>
                    ) : (
                      selectedDoubt.replies
                        .sort((a, b) => {
                          // ✅ Teacher replies FIRST (highest priority)
                          if (a.user.role === 'TEACHER' && b.user.role !== 'TEACHER') return -1;
                          if (a.user.role !== 'TEACHER' && b.user.role === 'TEACHER') return 1;
                          
                          // ✅ Then pinned (second priority)
                          if (a.isPinned && !b.isPinned) return -1;
                          if (!a.isPinned && b.isPinned) return 1;
                          
                          // ✅ Then students by date
                          return (
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                          );
                        })
                        .map((reply) => (
                          <div
                            key={reply.id}
                            className={`p-4 rounded-xl border-2 ${
                              reply.user.role === 'TEACHER'
                                ? 'bg-purple-50 border-purple-300'
                                : reply.isPinned
                                ? 'bg-amber-50 border-amber-300'
                                : reply.isAccepted
                                ? 'bg-green-50 border-green-300'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            {/* Reply Header */}
                            <div className="flex items-start gap-3 mb-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ${
                                  reply.user.role === 'TEACHER'
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                }`}
                              >
                                {reply.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm text-slate-900">
                                    {reply.user.name}
                                  </span>
                                  {reply.user.role === 'TEACHER' && (
                                    <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-semibold">
                                      Teacher
                                    </span>
                                  )}
                                  {reply.isPinned && (
                                    <Pin
                                      size={14}
                                      className="text-amber-600"
                                      fill="currentColor"
                                    />
                                  )}
                                  {reply.isAccepted && (
                                    <CheckCircle2
                                      size={14}
                                      className="text-green-600"
                                      fill="currentColor"
                                    />
                                  )}
                                </div>
                                <p className="text-xs text-slate-600">
                                  {formatTimeAgo(reply.createdAt)}
                                </p>
                              </div>
                            </div>

                            {/* Reply Content */}
                            <p className="text-sm text-slate-700 mb-3 whitespace-pre-line">
                              {reply.content}
                            </p>

                            {/* Reply Attachments */}
                            {reply.imageUrl && (
                              <div className="mb-3">
                                <Image
                                  src={reply.imageUrl}
                                  alt={reply.imageName || 'Reply image'}
                                  width={300}
                                  height={200}
                                  className="rounded-lg border border-slate-200"
                                />
                              </div>
                            )}
                            {reply.pdfUrl && (
                              <a
                                href={reply.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm mb-3 border border-red-200"
                              >
                                <FileText size={14} />
                                <span>{reply.pdfName || 'Download PDF'}</span>
                              </a>
                            )}

                            {/* Reply Actions - Teacher Only */}
                            <div className="flex items-center gap-3 text-sm">
                              <span className="flex items-center gap-1.5 text-slate-600">
                                <ThumbsUp size={14} />
                                {reply.upvotes}
                              </span>
                              {!reply.isPinned && (
                                <button
                                  onClick={() => handlePinReply(reply.id)}
                                  className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-semibold"
                                >
                                  <Pin size={14} />
                                  Pin
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReply(reply.id)}
                                className="flex items-center gap-1.5 text-red-600 hover:text-red-700 ml-auto font-semibold"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* ✅ FIXED: Reply Input with better button sizes */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-semibold text-slate-900 mb-3 text-sm">
                    Your Response
                  </h4>

                  {/* Attachments Preview */}
                  {(replyImage.url || replyPdf.url) && (
                    <div className="mb-3 space-y-2">
                      {replyImage.url && (
                        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                          <ImageIcon size={16} className="text-purple-600" />
                          <span className="text-sm text-purple-900 flex-1 truncate">
                            {replyImage.name}
                          </span>
                          <button
                            onClick={() => setReplyImage({ url: '', name: '' })}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                      {replyPdf.url && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                          <FileText size={16} className="text-red-600" />
                          <span className="text-sm text-red-900 flex-1 truncate">
                            {replyPdf.name}
                          </span>
                          <button
                            onClick={() => setReplyPdf({ url: '', name: '' })}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={4}
                    className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm mb-3"
                  />

                  {/* Reply Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Image Upload */}
                    <UploadButton<OurFileRouter, "doubtImage">
                      endpoint="doubtImage"
                      onClientUploadComplete={(res: UploadFileResponse[] | undefined) => {
                        if (res?.[0]) {
                          setReplyImage({
                            url: res[0].url,
                            name: res[0].name,
                          });
                          showToast('Image uploaded!');
                        }
                      }}
                      onUploadError={(error: Error) => {
                        showToast(`Upload failed: ${error.message}`, 'error');
                      }}
                      appearance={{
                        button: "bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors",
                        allowedContent: "hidden"
                      }}
                      content={{
                        button: () => <ImageIcon size={18} />,
                      }}
                    />

                    {/* PDF Upload */}
                    <UploadButton<OurFileRouter, "doubtPdf">
                      endpoint="doubtPdf"
                      onClientUploadComplete={(res: UploadFileResponse[] | undefined) => {
                        if (res?.[0]) {
                          setReplyPdf({
                            url: res[0].url,
                            name: res[0].name,
                          });
                          showToast('PDF uploaded!');
                        }
                      }}
                      onUploadError={(error: Error) => {
                        showToast(`Upload failed: ${error.message}`, 'error');
                      }}
                      appearance={{
                        button: "bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors",
                        allowedContent: "hidden"
                      }}
                      content={{
                        button: () => <FileText size={18} />,
                      }}
                    />

                    {/* Submit */}
                    <button
                      onClick={handleSubmitReply}
                      disabled={
                        submittingReply ||
                        (!replyText.trim() && !replyImage.url && !replyPdf.url)
                      }
                      className="flex-1 min-w-[140px] px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingReply ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Response
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-purple-200">
                <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-sm">
                  Select a doubt to respond
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}