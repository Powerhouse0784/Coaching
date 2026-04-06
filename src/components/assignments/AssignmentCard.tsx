'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUploadThing } from '@/lib/uploadthing';
import {
  FileText, Calendar, Clock, Users, Download, Search, AlertCircle, 
  Loader, X, Upload, CheckCircle, XCircle, Eye, MessageSquare, 
  TrendingUp, Award, Filter, RefreshCw, Send, ThumbsUp, Trash2,
  BookOpen, Target, Activity, Paperclip, ExternalLink, User,
  ChevronDown, ChevronUp, Sparkles, AlertTriangle, Check
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  dueDate: string;
  totalMarks: number;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: string | null;
  createdAt: string;
  teacher: {
    name: string | null;
    avatar: string | null;
  };
  mySubmission: {
    id: string;
    fileUrl: string;
    fileName: string;
    fileSize: string;
    remarks: string | null;
    status: string;
    isCompleted: boolean;
    submittedAt: string;
  } | null;
  stats: {
    totalSubmissions: number;
    totalComments: number;
  };
}

interface Comment {
  id: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: string | null;
  likes: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    role: string;
  };
}

export default function StudentAssignmentDashboard() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Dark mode detection
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/student/assignments?filter=${filter}`);
      const data = await response.json();
      if (data.success) {
        setAssignments(data.assignments);
        setFilteredAssignments(data.assignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, [filter]);

  useEffect(() => {
    let filtered = assignments;
    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedSubject !== 'all') {
      filtered = filtered.filter((a) => a.subject === selectedSubject);
    }
    setFilteredAssignments(filtered);
  }, [searchQuery, selectedSubject, assignments]);

  const subjects = Array.from(new Set(assignments.map((a) => a.subject)));

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a) => a.mySubmission?.isCompleted).length;
  const pendingAssignments = assignments.filter((a) => !a.mySubmission).length;
  const submittedAssignments = assignments.filter((a) => a.mySubmission).length;

  const handleOpenSubmit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
  };

  const handleOpenComments = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowCommentsModal(true);
  };

  const handleMarkAsCompleted = async (submissionId: string) => {
    try {
      const response = await fetch('/api/student/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, isCompleted: true }),
      });
      const data = await response.json();
      if (data.success) {
        setAssignments(prev =>
          prev.map(a =>
            a.mySubmission?.id === submissionId
              ? { ...a, mySubmission: { ...a.mySubmission, isCompleted: true, status: 'completed' } }
              : a
          )
        );
        alert('Marked as completed! 🎉');
      } else {
        alert('Failed to mark as completed: ' + data.error);
      }
    } catch (error) {
      console.error('Error marking as completed:', error);
      alert('An error occurred');
    }
  };

  const dm = darkMode;

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className={`font-semibold ${dm ? 'text-gray-300' : 'text-gray-600'}`}>Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 sm:p-5 lg:p-8 min-h-screen transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3 ${dm ? 'text-white' : 'text-gray-900'}`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              My Assignments
            </h1>
            <p className={`text-sm sm:text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>View, submit, and collaborate on your assignments</p>
          </div>
          <button
            onClick={fetchAssignments}
            className={`self-start sm:self-auto px-3 sm:px-4 py-2 border-2 rounded-xl hover:bg-opacity-80 transition flex items-center gap-2 font-semibold text-sm sm:text-base ${
              dm ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[
            { icon: BookOpen, iconBg: dm ? 'bg-blue-900' : 'bg-blue-100', iconColor: 'text-blue-500', value: totalAssignments, label: 'Total Assignments', extra: <TrendingUp className="w-4 h-4 text-green-500" /> },
            { icon: CheckCircle, iconBg: dm ? 'bg-green-900' : 'bg-green-100', iconColor: 'text-green-500', value: completedAssignments, label: 'Completed', extra: <span className={`text-xs font-bold text-green-500`}>{totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0}%</span> },
            { icon: Clock, iconBg: dm ? 'bg-orange-900' : 'bg-orange-100', iconColor: 'text-orange-500', value: pendingAssignments, label: 'Pending', extra: null },
            { icon: Activity, iconBg: dm ? 'bg-purple-900' : 'bg-purple-100', iconColor: 'text-purple-500', value: submittedAssignments, label: 'Submitted', extra: null },
          ].map(({ icon: Icon, iconBg, iconColor, value, label, extra }, i) => (
            <div key={i} className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 lg:p-6 border-2 hover:shadow-xl transition-all ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${iconColor}`} />
                </div>
                {extra}
              </div>
              <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 ${dm ? 'text-white' : 'text-gray-900'}`}>{value}</p>
              <p className={`text-xs sm:text-sm font-medium ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 lg:p-6 mb-5 sm:mb-6 shadow-sm ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'All', icon: BookOpen },
            { value: 'pending', label: 'Pending', icon: Clock },
            { value: 'submitted', label: 'Submitted', icon: CheckCircle },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                filter === value
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm sm:text-base ${
                dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-semibold text-sm sm:text-base ${
              dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="all">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className={`rounded-xl sm:rounded-2xl border-2 p-8 sm:p-12 text-center ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <FileText className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg sm:text-xl font-bold mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>No assignments found</h3>
          <p className={`text-sm sm:text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
            {searchQuery || selectedSubject !== 'all'
              ? 'Try adjusting your filters'
              : "Your teachers haven't assigned any work yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onSubmit={handleOpenSubmit}
              onViewComments={handleOpenComments}
              onMarkAsCompleted={handleMarkAsCompleted}
              darkMode={dm}
            />
          ))}
        </div>
      )}

      {showSubmitModal && selectedAssignment && (
        <SubmitAssignmentModal
          assignment={selectedAssignment}
          darkMode={dm}
          onClose={() => { setShowSubmitModal(false); setSelectedAssignment(null); }}
          onSuccess={() => { setShowSubmitModal(false); setSelectedAssignment(null); fetchAssignments(); }}
        />
      )}

      {showCommentsModal && selectedAssignment && (
        <CommentsModal
          assignment={selectedAssignment}
          darkMode={dm}
          onClose={() => { setShowCommentsModal(false); setSelectedAssignment(null); }}
        />
      )}
    </div>
  );
}

// ─── Assignment Card ─────────────────────────────────────────────────────────
function AssignmentCard({
  assignment,
  onSubmit,
  onViewComments,
  onMarkAsCompleted,
  darkMode,
}: {
  assignment: Assignment;
  onSubmit: (a: Assignment) => void;
  onViewComments: (a: Assignment) => void;
  onMarkAsCompleted: (id: string) => void;
  darkMode: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const timeLeft = dueDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
  const dm = darkMode;

  const getTimeLeftText = () => {
    if (daysLeft > 1) return `${daysLeft} days left`;
    if (hoursLeft > 1) return `${hoursLeft} hours left`;
    if (daysLeft < 0) return 'Past due date';
    return 'Due soon!';
  };

  const getStatusBadge = () => {
    if (assignment.mySubmission?.isCompleted) {
      return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 flex-shrink-0 ${dm ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
          <CheckCircle className="w-3 h-3" /> Completed
        </span>
      );
    }
    if (assignment.mySubmission) {
      return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 flex-shrink-0 ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
          <Activity className="w-3 h-3" /> Submitted
        </span>
      );
    }
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 flex-shrink-0 ${dm ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  };

  return (
    <div className={`rounded-xl sm:rounded-2xl border-2 hover:shadow-2xl transition-all overflow-hidden ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
            <h3 className={`text-base sm:text-xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>{assignment.title}</h3>
            {getStatusBadge()}
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${dm ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
              {assignment.subject}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
              {assignment.class}
            </span>
          </div>

          <p className={`text-sm sm:text-base mb-2 leading-relaxed ${dm ? 'text-gray-300' : 'text-gray-600'} ${expanded ? '' : 'line-clamp-2'}`}>
            {assignment.description}
          </p>

          {assignment.description.length > 100 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-indigo-500 hover:text-indigo-400 font-semibold text-xs sm:text-sm flex items-center gap-1 mb-3"
            >
              {expanded ? <><ChevronUp className="w-4 h-4" />Show less</> : <><ChevronDown className="w-4 h-4" />Read more</>}
            </button>
          )}

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className={`flex items-center gap-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="font-medium truncate max-w-[120px]">{assignment.teacher.name || 'Unknown'}</span>
            </div>
            <div className={`flex items-center gap-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Due: {dueDate.toLocaleDateString()}</span>
            </div>
            <div className={`flex items-center gap-1 font-semibold ${
              daysLeft < 0 ? (dm ? 'text-gray-500' : 'text-gray-500') : daysLeft <= 2 ? 'text-orange-500' : 'text-green-500'
            }`}>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              {getTimeLeftText()}
            </div>
            <div className={`flex items-center gap-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{assignment.totalMarks} marks</span>
            </div>
            <div className={`flex items-center gap-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{assignment.stats.totalSubmissions} submissions</span>
            </div>
            <div className={`flex items-center gap-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{assignment.stats.totalComments} comments</span>
            </div>
          </div>
        </div>

        {/* Submission Info */}
        {assignment.mySubmission && (
          <div className={`border-2 rounded-xl p-3 sm:p-4 mb-4 ${dm ? 'bg-blue-900/30 border-blue-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold mb-1 text-sm sm:text-base ${dm ? 'text-blue-200' : 'text-blue-900'}`}>Your Submission</p>
                <div className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${dm ? 'text-blue-300' : 'text-blue-700'}`}>
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{assignment.mySubmission.fileName}</span>
                  <span className="flex-shrink-0">•</span>
                  <span className="flex-shrink-0">{assignment.mySubmission.fileSize}</span>
                </div>
                <p className={`text-xs mt-1 ${dm ? 'text-blue-400' : 'text-blue-600'}`}>
                  Submitted on {new Date(assignment.mySubmission.submittedAt).toLocaleDateString()}
                </p>
                {assignment.mySubmission.remarks && (
                  <p className={`text-xs sm:text-sm mt-2 italic ${dm ? 'text-blue-200' : 'text-blue-800'}`}>"{assignment.mySubmission.remarks}"</p>
                )}
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                <a
                  href={assignment.mySubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  title="View file"
                >
                  <Eye className="w-4 h-4" />
                </a>
                {!assignment.mySubmission.isCompleted && (
                  <button
                    onClick={() => onMarkAsCompleted(assignment.mySubmission!.id)}
                    className="p-2 sm:px-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                    title="Mark as Completed"
                  >
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs font-semibold">Done</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-2 sm:gap-3">
          {assignment.fileUrl && (
            <a
              href={assignment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Download Assignment</span>
            </a>
          )}

          {!assignment.mySubmission && (
            <button
              onClick={() => onSubmit(assignment)}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm"
            >
              <Upload className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Submit Assignment</span>
            </button>
          )}

          <button
            onClick={() => onViewComments(assignment)}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl transition flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm flex-shrink-0 ${
              dm ? 'border-indigo-500 text-indigo-400 hover:bg-indigo-900/30' : 'border-indigo-300 text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            Discuss ({assignment.stats.totalComments})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Submit Assignment Modal ──────────────────────────────────────────────────
function SubmitAssignmentModal({
  assignment,
  onClose,
  onSuccess,
  darkMode,
}: {
  assignment: Assignment;
  onClose: () => void;
  onSuccess: () => void;
  darkMode: boolean;
}) {
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: string } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dm = darkMode;

  const { startUpload, isUploading } = useUploadThing('submissionFile', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const file = res[0];
        setUploadedFile({ url: file.url, name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` });
        setUploading(false);
      }
    },
    onUploadError: (error: Error) => {
      alert(`Upload failed: ${error.message}`);
      setUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Please upload a PDF file'); return; }
    if (file.size > 16 * 1024 * 1024) { alert('File size must be less than 16MB'); return; }
    setUploading(true);
    await startUpload([file]);
  };

  const handleSubmit = async () => {
    if (!uploadedFile) { alert('Please upload your assignment PDF'); return; }
    setSubmitting(true);
    try {
      const response = await fetch('/api/student/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          remarks: remarks || null,
        }),
      });
      const data = await response.json();
      if (data.success) { alert('Assignment submitted successfully!'); onSuccess(); }
      else alert('Failed to submit: ' + data.error);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('An error occurred while submitting');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col ${dm ? 'bg-gray-900' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b-2 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-xl sm:text-2xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Submit Assignment</h3>
              <p className={`text-xs sm:text-sm mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{assignment.title}</p>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg transition ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <X className={`w-5 h-5 sm:w-6 sm:h-6 ${dm ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* File Upload */}
          <div>
            <label className={`block text-sm font-semibold mb-2 sm:mb-3 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
              Upload Your Solution (PDF) *
            </label>
            {uploadedFile ? (
              <div className={`border-2 rounded-xl p-3 sm:p-4 flex items-center justify-between ${dm ? 'border-green-700 bg-green-900/30' : 'border-green-300 bg-green-50'}`}>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? 'bg-green-800' : 'bg-green-100'}`}>
                    <FileText className={`w-5 h-5 sm:w-6 sm:h-6 ${dm ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{uploadedFile.name}</p>
                    <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{uploadedFile.size}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setUploadedFile(null)} className={`p-2 rounded-lg transition flex-shrink-0 ${dm ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}>
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                </button>
              </div>
            ) : (
              <label className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center hover:border-indigo-500 transition cursor-pointer block ${dm ? 'border-gray-600 hover:border-indigo-500' : 'border-gray-300'}`}>
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" disabled={uploading || isUploading} />
                {uploading || isUploading ? (
                  <>
                    <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-500 animate-spin mx-auto mb-2 sm:mb-3" />
                    <p className="text-indigo-500 font-medium text-sm sm:text-base">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={`mb-1 font-medium text-sm sm:text-base ${dm ? 'text-gray-300' : 'text-gray-600'}`}>Click to upload your solution PDF</p>
                    <p className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>PDF only (Max 16MB)</p>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Remarks (Optional)</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any notes or comments about your submission..."
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm sm:text-base ${
                dm ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'border-gray-200 text-gray-900'
              }`}
            />
          </div>

          <div className={`border-2 rounded-xl p-3 sm:p-4 ${dm ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-200'}`}>
            <div className="flex items-start gap-2 sm:gap-3">
              <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${dm ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <div>
                <p className={`text-xs sm:text-sm font-semibold mb-0.5 ${dm ? 'text-indigo-300' : 'text-indigo-900'}`}>Pro Tip</p>
                <p className={`text-xs ${dm ? 'text-indigo-400' : 'text-indigo-700'}`}>
                  Make sure your PDF is clear and readable. You can also help other students by discussing solutions in the comments!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-6 border-t-2 flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={onClose}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 border-2 rounded-xl transition font-semibold text-sm sm:text-base ${dm ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!uploadedFile || submitting || uploading || isUploading}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
          >
            {submitting ? <><Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />Submitting...</> : <><Send className="w-4 h-4 sm:w-5 sm:h-5" />Submit</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Comments Modal ───────────────────────────────────────────────────────────
function CommentsModal({
  assignment,
  onClose,
  darkMode,
}: {
  assignment: Assignment;
  onClose: () => void;
  darkMode: boolean;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: string } | null>(null);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dm = darkMode;

  const { startUpload, isUploading } = useUploadThing('commentAttachment', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const file = res[0];
        setUploadedFile({ url: file.url, name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)} MB` });
        setUploading(false);
      }
    },
    onUploadError: (error: Error) => {
      alert(`Upload failed: ${error.message}`);
      setUploading(false);
    },
  });

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/assignments/comments?assignmentId=${assignment.id}`);
      const data = await response.json();
      if (data.success) setComments(data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, [assignment.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Please upload a PDF file'); return; }
    if (file.size > 8 * 1024 * 1024) { alert('File size must be less than 8MB'); return; }
    setUploading(true);
    await startUpload([file]);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() && !uploadedFile) { alert('Please write a comment or attach a file'); return; }
    setPosting(true);
    try {
      const response = await fetch('/api/assignments/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          content: newComment,
          fileUrl: uploadedFile?.url || null,
          fileName: uploadedFile?.name || null,
          fileSize: uploadedFile?.size || null,
        }),
      });
      const data = await response.json();
      if (data.success) { setComments([data.comment, ...comments]); setNewComment(''); setUploadedFile(null); }
      else alert('Failed to post comment: ' + data.error);
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('An error occurred while posting');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      const response = await fetch('/api/assignments/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, action: 'like' }),
      });
      const data = await response.json();
      if (data.success) setComments(comments.map((c) => c.id === commentId ? { ...c, likes: data.comment.likes } : c));
    } catch (error) { console.error('Error liking comment:', error); }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      const response = await fetch(`/api/assignments/comments?id=${commentId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) setComments(comments.filter((c) => c.id !== commentId));
    } catch (error) { console.error('Error deleting comment:', error); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col ${dm ? 'bg-gray-900' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b-2 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-xl sm:text-2xl font-bold flex items-center gap-2 ${dm ? 'text-white' : 'text-gray-900'}`}>
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                Discussion
              </h3>
              <p className={`text-xs sm:text-sm mt-0.5 truncate max-w-[240px] sm:max-w-full ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{assignment.title}</p>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg transition flex-shrink-0 ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <X className={`w-5 h-5 sm:w-6 sm:h-6 ${dm ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 sm:py-12">
              <MessageSquare className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`font-semibold mb-1 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-600'}`}>No comments yet</p>
              <p className={`text-xs sm:text-sm ${dm ? 'text-gray-500' : 'text-gray-500'}`}>Be the first to start the discussion!</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className={`rounded-xl p-3 sm:p-4 border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm overflow-hidden">
                      {comment.user.avatar ? (
                        <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        comment.user.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-white' : 'text-gray-900'}`}>{comment.user.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          comment.user.role === 'TEACHER'
                            ? dm ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'
                            : dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {comment.user.role}
                        </span>
                        <span className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm sm:text-base mb-2 whitespace-pre-wrap break-words ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{comment.content}</p>
                      
                      {comment.fileUrl && (
                        <a
                          href={comment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 border-2 rounded-lg transition text-xs sm:text-sm font-semibold ${
                            dm ? 'bg-gray-700 border-indigo-700 text-indigo-300 hover:bg-gray-600' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                          }`}
                        >
                          <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-[250px]">{comment.fileName}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      )}

                      <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3">
                        <button
                          onClick={() => handleLike(comment.id)}
                          className={`flex items-center gap-1 text-xs sm:text-sm transition ${dm ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600'}`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="font-semibold">{comment.likes}</span>
                        </button>
                        {comment.user.id === session?.user?.id && (
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-xs sm:text-sm text-red-500 hover:text-red-400 font-semibold"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className={`p-3 sm:p-6 border-t-2 flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          {uploadedFile && (
            <div className={`mb-2 sm:mb-3 flex items-center gap-2 border-2 rounded-lg p-2.5 sm:p-3 ${dm ? 'bg-gray-700 border-indigo-700' : 'bg-white border-indigo-200'}`}>
              <Paperclip className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span className={`text-xs sm:text-sm font-medium flex-1 truncate ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)} className="text-red-500 hover:text-red-400 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts or help others..."
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm sm:text-base ${
                dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border-gray-200 text-gray-900'
              }`}
            />
            <div className="flex flex-col gap-2">
              <label className={`p-2.5 sm:p-3 border-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
                dm ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
              }`}>
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" disabled={uploading || isUploading} />
                {uploading || isUploading
                  ? <Loader className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 animate-spin" />
                  : <Paperclip className={`w-4 h-4 sm:w-5 sm:h-5 ${dm ? 'text-gray-400' : 'text-gray-600'}`} />}
              </label>
              <button
                onClick={handlePostComment}
                disabled={(!newComment.trim() && !uploadedFile) || posting}
                className="p-2.5 sm:p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {posting
                  ? <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}