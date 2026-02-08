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
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all'); // ✅ REMOVED 'overdue'
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Fetch assignments
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

  useEffect(() => {
    fetchAssignments();
  }, [filter]);

  // Filter assignments by search and subject
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

  // Get unique subjects
  const subjects = Array.from(new Set(assignments.map((a) => a.subject)));

  // Calculate stats - ✅ REMOVED overdueAssignments
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

  // ✅ NEW: Mark as completed function
  const handleMarkAsCompleted = async (submissionId: string) => {
    try {
      const response = await fetch('/api/student/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          isCompleted: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              My Assignments
            </h1>
            <p className="text-gray-600">View, submit, and collaborate on your assignments</p>
          </div>
          <button
            onClick={fetchAssignments}
            className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 font-semibold"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {/* Stats Cards - ✅ REMOVED Overdue card */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-gray-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{totalAssignments}</p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Assignments</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-gray-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <span className="text-xs font-bold text-green-600">
                {totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0}%
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{completedAssignments}</p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">Completed</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-gray-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{pendingAssignments}</p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">Pending</p>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-gray-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{submittedAssignments}</p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">Submitted</p>
          </div>
        </div>
      </div>

      {/* Filters - ✅ REMOVED Overdue filter tab */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 sm:p-6 mb-6 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All', icon: BookOpen },
            { value: 'pending', label: 'Pending', icon: Clock },
            { value: 'submitted', label: 'Submitted', icon: CheckCircle },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                filter === value
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-semibold"
          >
            <option value="all">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-600">
            {searchQuery || selectedSubject !== 'all'
              ? 'Try adjusting your filters'
              : 'Your teachers haven\'t assigned any work yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onSubmit={handleOpenSubmit}
              onViewComments={handleOpenComments}
              onMarkAsCompleted={handleMarkAsCompleted}
            />
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedAssignment && (
        <SubmitAssignmentModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowSubmitModal(false);
            setSelectedAssignment(null);
          }}
          onSuccess={() => {
            setShowSubmitModal(false);
            setSelectedAssignment(null);
            fetchAssignments();
          }}
        />
      )}

      {/* Comments Modal */}
      {showCommentsModal && selectedAssignment && (
        <CommentsModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedAssignment(null);
          }}
        />
      )}
    </div>
  );
}

// Assignment Card Component - ✅ UPDATED
function AssignmentCard({
  assignment,
  onSubmit,
  onViewComments,
  onMarkAsCompleted,
}: {
  assignment: Assignment;
  onSubmit: (assignment: Assignment) => void;
  onViewComments: (assignment: Assignment) => void;
  onMarkAsCompleted: (submissionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const timeLeft = dueDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));

  const getTimeLeftText = () => {
    if (daysLeft > 1) return `${daysLeft} days left`;
    if (hoursLeft > 1) return `${hoursLeft} hours left`;
    if (daysLeft < 0) return 'Past due date';
    return 'Due soon!';
  };

  const getStatusBadge = () => {
    if (assignment.mySubmission?.isCompleted) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    }
    if (assignment.mySubmission) {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Submitted
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 hover:shadow-2xl transition-all overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h3 className="text-xl font-bold text-gray-900">{assignment.title}</h3>
              {getStatusBadge()}
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                {assignment.subject}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {assignment.class}
              </span>
            </div>

            <p className={`text-gray-600 mb-3 ${expanded ? '' : 'line-clamp-2'}`}>
              {assignment.description}
            </p>

            {assignment.description.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1 mb-3"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Read more
                  </>
                )}
              </button>
            )}

            {/* Info Row - ✅ REMOVED Overdue status */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="font-medium">{assignment.teacher.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Due: {dueDate.toLocaleDateString()}</span>
              </div>
              <div className={`flex items-center gap-1 font-semibold ${
                daysLeft < 0 ? 'text-gray-500' : daysLeft <= 2 ? 'text-orange-600' : 'text-green-600'
              }`}>
                <Clock className="w-4 h-4" />
                {getTimeLeftText()}
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4" />
                <span>{assignment.totalMarks} marks</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{assignment.stats.totalSubmissions} submissions</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{assignment.stats.totalComments} comments</span>
              </div>
            </div>
          </div>
        </div>

        {/* My Submission Info - ✅ ADDED Mark as Completed button */}
        {assignment.mySubmission && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-1">Your Submission</p>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <FileText className="w-4 h-4" />
                  <span>{assignment.mySubmission.fileName}</span>
                  <span>•</span>
                  <span>{assignment.mySubmission.fileSize}</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Submitted on {new Date(assignment.mySubmission.submittedAt).toLocaleDateString()}
                </p>
                {assignment.mySubmission.remarks && (
                  <p className="text-sm text-blue-800 mt-2 italic">"{assignment.mySubmission.remarks}"</p>
                )}
              </div>
              <div className="flex gap-2">
                <a
                  href={assignment.mySubmission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                >
                  <Eye className="w-4 h-4" />
                </a>
                {/* ✅ NEW: Mark as Completed button */}
                {!assignment.mySubmission.isCompleted && (
                  <button
                    onClick={() => onMarkAsCompleted(assignment.mySubmission!.id)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold flex items-center gap-1"
                    title="Mark as Completed"
                  >
                    <Check className="w-4 h-4" />
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {assignment.fileUrl && (
            <a
              href={assignment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[200px] px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 font-semibold"
            >
              <Download className="w-5 h-5" />
              Download Assignment
            </a>
          )}

          {!assignment.mySubmission && (
            <button
              onClick={() => onSubmit(assignment)}
              className="flex-1 min-w-[200px] px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 font-semibold"
            >
              <Upload className="w-5 h-5" />
              Submit Assignment
            </button>
          )}

          <button
            onClick={() => onViewComments(assignment)}
            className="px-4 py-3 border-2 border-indigo-300 text-indigo-700 rounded-xl hover:bg-indigo-50 transition flex items-center gap-2 font-semibold"
          >
            <MessageSquare className="w-5 h-5" />
            Discuss ({assignment.stats.totalComments})
          </button>
        </div>
      </div>
    </div>
  );
}

// Submit Assignment Modal Component
function SubmitAssignmentModal({
  assignment,
  onClose,
  onSuccess,
}: {
  assignment: Assignment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: string } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { startUpload, isUploading } = useUploadThing('submissionFile', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const file = res[0];
        setUploadedFile({
          url: file.url,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        });
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

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      alert('File size must be less than 16MB');
      return;
    }

    setUploading(true);
    await startUpload([file]);
  };

  const handleSubmit = async () => {
    if (!uploadedFile) {
      alert('Please upload your assignment PDF');
      return;
    }

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

      if (data.success) {
        alert('Assignment submitted successfully!');
        onSuccess();
      } else {
        alert('Failed to submit: ' + data.error);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('An error occurred while submitting');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Submit Assignment</h3>
              <p className="text-sm text-gray-600 mt-1">{assignment.title}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Upload Your Solution (PDF) *
            </label>
            {uploadedFile ? (
              <div className="border-2 border-green-300 bg-green-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-600">{uploadedFile.size}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="p-2 hover:bg-red-100 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 transition cursor-pointer block">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading || isUploading}
                />
                {uploading || isUploading ? (
                  <>
                    <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-indigo-600 font-medium">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-1 font-medium">Click to upload your solution PDF</p>
                    <p className="text-xs text-gray-500">PDF only (Max 16MB)</p>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Remarks (Optional)
            </label>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any notes or comments about your submission..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-indigo-900 mb-1">Pro Tip</p>
                <p className="text-xs text-indigo-700">
                  Make sure your PDF is clear and readable. You can also help other students by discussing solutions in the comments!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!uploadedFile || submitting || uploading || isUploading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Assignment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Comments Modal Component
function CommentsModal({
  assignment,
  onClose,
}: {
  assignment: Assignment;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: string } | null>(null);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { startUpload, isUploading } = useUploadThing('commentAttachment', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const file = res[0];
        setUploadedFile({
          url: file.url,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        });
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
      
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [assignment.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('File size must be less than 8MB');
      return;
    }

    setUploading(true);
    await startUpload([file]);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() && !uploadedFile) {
      alert('Please write a comment or attach a file');
      return;
    }

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

      if (data.success) {
        setComments([data.comment, ...comments]);
        setNewComment('');
        setUploadedFile(null);
      } else {
        alert('Failed to post comment: ' + data.error);
      }
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

      if (data.success) {
        setComments(
          comments.map((c) =>
            c.id === commentId ? { ...c, likes: data.comment.likes } : c
          )
        );
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`/api/assignments/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
                Discussion
              </h3>
              <p className="text-sm text-gray-600 mt-1">{assignment.title}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold mb-2">No comments yet</p>
              <p className="text-sm text-gray-500">Be the first to start the discussion!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                      {comment.user.avatar ? (
                        <img src={comment.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        comment.user.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{comment.user.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          comment.user.role === 'TEACHER'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {comment.user.role}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2 whitespace-pre-wrap">{comment.content}</p>
                      
                      {comment.fileUrl && (
                        <a
                          href={comment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 transition text-sm font-semibold text-indigo-700"
                        >
                          <Paperclip className="w-4 h-4" />
                          {comment.fileName}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => handleLike(comment.id)}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 transition"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span className="font-semibold">{comment.likes}</span>
                        </button>
                        {comment.user.id === session?.user?.id && (
                          <button
                            onClick={() => handleDelete(comment.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-semibold"
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
        <div className="p-6 border-t-2 border-gray-200 bg-gray-50 flex-shrink-0">
          {uploadedFile && (
            <div className="mb-3 flex items-center gap-2 bg-white border-2 border-indigo-200 rounded-lg p-3">
              <Paperclip className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-900 flex-1">{uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)} className="text-red-600 hover:text-red-700">
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
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <div className="flex flex-col gap-2">
              <label className="px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition cursor-pointer flex items-center justify-center">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading || isUploading}
                />
                {uploading || isUploading ? (
                  <Loader className="w-5 h-5 text-indigo-600 animate-spin" />
                ) : (
                  <Paperclip className="w-5 h-5 text-gray-600" />
                )}
              </label>
              <button
                onClick={handlePostComment}
                disabled={(!newComment.trim() && !uploadedFile) || posting}
                className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {posting ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}