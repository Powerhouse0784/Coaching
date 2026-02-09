'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  MessageSquare,
  ThumbsUp,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  Pin,
  Trash2,
  AlertCircle,
  Smile,
  Book,
  Users,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamically import toast to avoid SSR issues
const toast = dynamic(
  () => import('react-hot-toast').then((mod) => mod.default),
  { ssr: false }
);

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

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50' },
  { value: 'normal', label: 'Normal', color: 'text-blue-600 bg-blue-50' },
  { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-50' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-50' },
];

export default function StudentDoubtsComponent() {
  const { data: session } = useSession();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submittingDoubt, setSubmittingDoubt] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Ask Doubt Form State
  const [doubtForm, setDoubtForm] = useState({
    title: '',
    description: '',
    subject: '',
    priority: 'normal',
    imageUrl: '',
    imageName: '',
    pdfUrl: '',
    pdfName: '',
  });

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
        subject: subjectFilter,
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

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Submit new doubt
  const handleSubmitDoubt = async () => {
    if (!doubtForm.title || !doubtForm.description || !doubtForm.subject) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSubmittingDoubt(true);
    try {
      const res = await fetch('/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doubtForm),
      });

      const data = await res.json();

      if (data.success) {
        showToast('Doubt posted successfully!');
        setShowAskModal(false);
        setDoubtForm({
          title: '',
          description: '',
          subject: '',
          priority: 'normal',
          imageUrl: '',
          imageName: '',
          pdfUrl: '',
          pdfName: '',
        });
        fetchDoubts();
      } else {
        showToast(data.error || 'Failed to post doubt', 'error');
      }
    } catch (error) {
      console.error('Error posting doubt:', error);
      showToast('Error posting doubt', 'error');
    } finally {
      setSubmittingDoubt(false);
    }
  };

  // Upvote doubt
  const handleUpvoteDoubt = async (doubtId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/doubts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId, action: 'upvote' }),
      });

      const data = await res.json();

      if (data.success) {
        fetchDoubts();
        if (selectedDoubt?.id === doubtId) {
          const updatedDoubt = doubts.find((d) => d.id === doubtId);
          if (updatedDoubt) setSelectedDoubt(updatedDoubt);
        }
      }
    } catch (error) {
      console.error('Error upvoting doubt:', error);
    }
  };

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

  // Upvote reply
  const handleUpvoteReply = async (replyId: string) => {
    try {
      const res = await fetch('/api/doubts/reply', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyId }),
      });

      if (res.ok) {
        fetchDoubts();
        if (selectedDoubt) {
          const updatedDoubt = doubts.find((d) => d.id === selectedDoubt.id);
          if (updatedDoubt) setSelectedDoubt(updatedDoubt);
        }
      }
    } catch (error) {
      console.error('Error upvoting reply:', error);
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
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.color}`}>
        {p.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Discussion Forum
              </h1>
              <p className="text-slate-600">
                Ask questions, get answers, and help fellow students
              </p>
            </div>
            <button
              onClick={() => setShowAskModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-2 justify-center"
            >
              <MessageSquare size={20} />
              Ask a Doubt
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <MessageSquare size={18} />
                <span className="text-sm font-medium">Total Doubts</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{doubts.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <CheckCircle2 size={18} />
                <span className="text-sm font-medium">Solved</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {doubts.filter((d) => d.isSolved).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-orange-700 mb-1">
                <Users size={18} />
                <span className="text-sm font-medium">My Doubts</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {doubts.filter((d) => d.isMyDoubt).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <TrendingUp size={18} />
                <span className="text-sm font-medium">Active</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {doubts.filter((d) => !d.isSolved).length}
              </p>
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
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Doubts</option>
              <option value="open">Open</option>
              <option value="solved">Solved</option>
              <option value="myDoubts">My Doubts</option>
            </select>

            {/* Subject Filter */}
            <input
              type="text"
              placeholder="Filter by subject..."
              value={subjectFilter === 'all' ? '' : subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value || 'all')}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doubts List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading doubts...</p>
              </div>
            ) : doubts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  No doubts found
                </h3>
                <p className="text-slate-600 mb-6">
                  Be the first to ask a question!
                </p>
                <button
                  onClick={() => setShowAskModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
                >
                  Ask Your First Doubt
                </button>
              </div>
            ) : (
              doubts.map((doubt) => (
                <div
                  key={doubt.id}
                  onClick={() => setSelectedDoubt(doubt)}
                  className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl border-2 ${
                    selectedDoubt?.id === doubt.id
                      ? 'border-blue-500 ring-4 ring-blue-100'
                      : 'border-transparent hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
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
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                              {doubt.subject}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(doubt.priority)}
                          {doubt.isSolved && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
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

                      {/* Attachments Preview */}
                      {(doubt.imageUrl || doubt.pdfUrl) && (
                        <div className="flex gap-2 mb-4">
                          {doubt.imageUrl && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                              <ImageIcon size={14} />
                              <span>Image attached</span>
                            </div>
                          )}
                          {doubt.pdfUrl && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm">
                              <FileText size={14} />
                              <span>PDF attached</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <button
                          onClick={(e) => handleUpvoteDoubt(doubt.id, e)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            doubt.hasUpvoted
                              ? 'text-blue-600 font-semibold'
                              : 'text-slate-600 hover:text-blue-600'
                          }`}
                        >
                          <ThumbsUp
                            size={16}
                            fill={doubt.hasUpvoted ? 'currentColor' : 'none'}
                          />
                          <span>{doubt.stats.totalUpvotes}</span>
                        </button>
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <MessageSquare size={16} />
                          {doubt.stats.totalReplies} replies
                        </span>
                        {doubt.isMyDoubt && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDoubt(doubt.id);
                            }}
                            className="flex items-center gap-1.5 text-red-600 hover:text-red-700 ml-auto"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Doubt Detail */}
          <div className="lg:col-span-1">
            {selectedDoubt ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Replies</h3>
                  <button
                    onClick={() => setSelectedDoubt(null)}
                    className="text-slate-400 hover:text-slate-600 lg:hidden"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Doubt Details */}
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-2">
                    {selectedDoubt.title}
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">
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
                      className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm"
                    >
                      <FileText size={16} />
                      <span>{selectedDoubt.pdfName || 'Download PDF'}</span>
                    </a>
                  )}
                </div>

                {/* ✅ FIXED: Replies sorting - Teacher first, then pinned, then students */}
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
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
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-semibold">
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
                              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm mb-3"
                            >
                              <FileText size={14} />
                              <span>{reply.pdfName || 'Download PDF'}</span>
                            </a>
                          )}

                          {/* Reply Actions */}
                          <div className="flex items-center gap-4 text-sm">
                            <button
                              onClick={() => handleUpvoteReply(reply.id)}
                              className={`flex items-center gap-1.5 transition-colors ${
                                reply.hasUpvoted
                                  ? 'text-blue-600 font-semibold'
                                  : 'text-slate-600 hover:text-blue-600'
                              }`}
                            >
                              <ThumbsUp
                                size={14}
                                fill={reply.hasUpvoted ? 'currentColor' : 'none'}
                              />
                              <span>{reply.upvotes}</span>
                            </button>
                            {reply.isMyReply && (
                              <button
                                onClick={() => handleDeleteReply(reply.id)}
                                className="flex items-center gap-1.5 text-red-600 hover:text-red-700 ml-auto"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* ✅ FIXED: Reply Input with better button sizes */}
                <div className="border-t border-slate-200 pt-4">
                  {/* Attachments Preview */}
                  {(replyImage.url || replyPdf.url) && (
                    <div className="mb-3 space-y-2">
                      {replyImage.url && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                          <ImageIcon size={16} className="text-blue-600" />
                          <span className="text-sm text-blue-900 flex-1 truncate">
                            {replyImage.name}
                          </span>
                          <button
                            onClick={() => setReplyImage({ url: '', name: '' })}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                      {replyPdf.url && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
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
                    placeholder="Write your answer..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm mb-3"
                  />

                  {/* ✅ FIXED: Better sized buttons that don't overflow */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Emoji Picker */}
                    <div className="relative" ref={emojiPickerRef}>
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Add emoji"
                      >
                        <Smile size={18} />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 z-50">
                          <EmojiPicker
                            onEmojiClick={(emojiData: any) => {
                              setReplyText(replyText + emojiData.emoji);
                              setShowEmojiPicker(false);
                            }}
                          />
                        </div>
                      )}
                    </div>

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
                        button: "bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors",
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

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmitReply}
                      disabled={submittingReply || (!replyText.trim() && !replyImage.url && !replyPdf.url)}
                      className="flex-1 min-w-[120px] px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingReply ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Post
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-slate-200 sticky top-4">
                <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-sm">
                  Select a doubt to view replies
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ask Doubt Modal */}
      {showAskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Ask a Doubt
              </h2>
              <button
                onClick={() => setShowAskModal(false)}
                className="text-slate-500 hover:text-slate-700 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of your doubt..."
                  value={doubtForm.title}
                  onChange={(e) =>
                    setDoubtForm({ ...doubtForm, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mathematics, Physics, Chemistry..."
                  value={doubtForm.subject}
                  onChange={(e) =>
                    setDoubtForm({ ...doubtForm, subject: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {PRIORITIES.map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() =>
                        setDoubtForm({ ...doubtForm, priority: priority.value })
                      }
                      className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
                        doubtForm.priority === priority.value
                          ? priority.color
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Explain your doubt in detail..."
                  rows={6}
                  value={doubtForm.description}
                  onChange={(e) =>
                    setDoubtForm({ ...doubtForm, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Attachments (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Image Upload */}
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-400 transition">
                    {doubtForm.imageUrl ? (
                      <div className="relative">
                        <Image
                          src={doubtForm.imageUrl}
                          alt="Preview"
                          width={300}
                          height={200}
                          className="rounded-xl border border-slate-200 w-full"
                        />
                        <button
                          onClick={() =>
                            setDoubtForm({
                              ...doubtForm,
                              imageUrl: '',
                              imageName: '',
                            })
                          }
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ImageIcon className="text-blue-600" size={28} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                          Upload Image
                        </p>
                        <UploadButton<OurFileRouter, "doubtImage">
                          endpoint="doubtImage"
                          onClientUploadComplete={(res: UploadFileResponse[] | undefined) => {
                            if (res?.[0]) {
                              setDoubtForm({
                                ...doubtForm,
                                imageUrl: res[0].url,
                                imageName: res[0].name,
                              });
                              showToast('Image uploaded!');
                            }
                          }}
                          onUploadError={(error: Error) => {
                            showToast(`Upload failed: ${error.message}`, 'error');
                          }}
                          appearance={{
                            button: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-2",
                            allowedContent: "text-xs text-slate-500 mt-2"
                          }}
                          content={{
                            button: () => (
                              <span className="flex items-center gap-2">
                                <Upload size={16} />
                                Choose Image
                              </span>
                            ),
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* PDF Upload */}
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-red-400 transition">
                    {doubtForm.pdfUrl ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <FileText className="text-red-600" size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-red-900 truncate">
                              {doubtForm.pdfName}
                            </p>
                            <p className="text-xs text-red-700">PDF attached</p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setDoubtForm({
                              ...doubtForm,
                              pdfUrl: '',
                              pdfName: '',
                            })
                          }
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <X size={16} />
                          Remove PDF
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FileText className="text-red-600" size={28} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                          Upload PDF
                        </p>
                        <UploadButton<OurFileRouter, "doubtPdf">
                          endpoint="doubtPdf"
                          onClientUploadComplete={(res: UploadFileResponse[] | undefined) => {
                            if (res?.[0]) {
                              setDoubtForm({
                                ...doubtForm,
                                pdfUrl: res[0].url,
                                pdfName: res[0].name,
                              });
                              showToast('PDF uploaded!');
                            }
                          }}
                          onUploadError={(error: Error) => {
                            showToast(`Upload failed: ${error.message}`, 'error');
                          }}
                          appearance={{
                            button: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-2",
                            allowedContent: "text-xs text-slate-500 mt-2"
                          }}
                          content={{
                            button: () => (
                              <span className="flex items-center gap-2">
                                <Upload size={16} />
                                Choose PDF
                              </span>
                            ),
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAskModal(false)}
                  disabled={submittingDoubt}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDoubt}
                  disabled={submittingDoubt || !doubtForm.title || !doubtForm.description || !doubtForm.subject}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingDoubt ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Post Doubt
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}