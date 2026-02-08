// components/teacher/AssignmentManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUploadThing } from '@/lib/uploadthing';
import {
  Plus, FileText, Calendar, Clock, Users, Download, Trash2, Search,
  AlertCircle, Loader, X, Upload, CheckCircle, XCircle, Eye,
  MessageSquare, TrendingUp, Award, Filter, RefreshCw
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  userName: string | null;
  userEmail: string | null;
  userAvatar: string | null;
  createdAt: string;
}

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
  isPublished: boolean;
  createdAt: string;
  stats: {
    totalSubmissions: number;
  };
  comments: Comment[];
}

export default function AssignmentManager() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Fetch assignments
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teacher/assignments');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(`Error: ${errorData.error || 'Failed to load assignments'}`);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      console.log('Fetched assignments:', data);
      
      if (data.success) {
        setAssignments(data.assignments || []);
        setFilteredAssignments(data.assignments || []);
      } else {
        console.error('Failed to fetch assignments:', data.error);
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      alert('Failed to load assignments. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Filter assignments
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

    if (selectedClass !== 'all') {
      filtered = filtered.filter((a) => a.class === selectedClass);
    }

    setFilteredAssignments(filtered);
  }, [searchQuery, selectedSubject, selectedClass, assignments]);

  // Delete assignment
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This will also delete all student submissions.')) {
      return;
    }

    try {
      const response = await fetch(`/api/teacher/assignments?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setAssignments((prev) => prev.filter((a) => a.id !== id));
        alert('Assignment deleted successfully');
      } else {
        alert('Failed to delete assignment: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('An error occurred while deleting the assignment');
    }
  };

  // Get unique subjects and classes for filters
  const subjects = Array.from(new Set(assignments.map((a) => a.subject)));
  const classes = Array.from(new Set(assignments.map((a) => a.class)));

  // Calculate stats - ✅ REMOVED completed
  const totalAssignments = assignments.length;
  const totalSubmissions = assignments.reduce((sum, a) => sum + a.stats.totalSubmissions, 0);
  const totalComments = assignments.reduce((sum, a) => sum + a.comments.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignment Manager</h1>
          <p className="text-gray-600">Create and manage assignments for your students</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAssignments}
            className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Assignment
          </button>
        </div>
      </div>

      {/* Stats Cards - ✅ REMOVED Completed card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalAssignments}</p>
          <p className="text-sm text-gray-600">Total Assignments</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalSubmissions}</p>
          <p className="text-sm text-gray-600">Total Submissions</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{totalComments}</p>
          <p className="text-sm text-gray-600">Total Comments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchQuery || selectedSubject !== 'all' || selectedClass !== 'all'
              ? 'No assignments match your filters'
              : 'No assignments yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedSubject !== 'all' || selectedClass !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first assignment to get started'}
          </p>
          {!searchQuery && selectedSubject === 'all' && selectedClass === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold"
            >
              Create Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <CreateAssignmentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAssignments();
          }}
        />
      )}
    </div>
  );
}

// Assignment Card Component
function AssignmentCard({
  assignment,
  onDelete,
}: {
  assignment: Assignment;
  onDelete: (id: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  
  // ✅ FIXED: Proper days calculation - set time to midnight for accurate day difference
  const dueDateMidnight = new Date(dueDate);
  dueDateMidnight.setHours(0, 0, 0, 0);
  const nowMidnight = new Date(now);
  nowMidnight.setHours(0, 0, 0, 0);
  
  const isOverdue = dueDateMidnight < nowMidnight;
  const daysUntilDue = Math.ceil((dueDateMidnight.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{assignment.title}</h3>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                {assignment.subject}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {assignment.class}
              </span>
            </div>
            <p className="text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Due: {dueDate.toLocaleDateString()}
              </span>
              {isOverdue ? (
                <span className="flex items-center gap-1 text-red-600 font-semibold">
                  <XCircle className="w-4 h-4" />
                  Overdue
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'} left
                </span>
              )}
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4" />
                {assignment.totalMarks} marks
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {assignment.stats.totalSubmissions} submissions
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {assignment.comments.length} comments
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row - ✅ REMOVED Completed, only showing Total Submissions */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
            <p className="text-3xl font-bold text-blue-600">{assignment.stats.totalSubmissions}</p>
          </div>
        </div>

        {/* Comments Section */}
        {assignment.comments.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 mb-2"
            >
              <MessageSquare className="w-4 h-4" />
              {showComments ? 'Hide' : 'View'} Comments ({assignment.comments.length})
            </button>
            
            {showComments && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                {assignment.comments.map((comment) => (
                  <div key={comment.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm text-gray-900">{comment.userName || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {assignment.fileUrl && (
            <a
              href={assignment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold"
            >
              <Download className="w-4 h-4" />
              Download Assignment
            </a>
          )}
          <button
            onClick={() => onDelete(assignment.id)}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center gap-2 font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Create Assignment Modal Component
function CreateAssignmentModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class: '',
    dueDate: '',
    dueTime: '23:59',
    totalMarks: '',
  });
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const { startUpload, isUploading } = useUploadThing('assignmentFile', {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.subject || !formData.class || !formData.dueDate || !formData.totalMarks) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);

    try {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);

      const response = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          class: formData.class,
          dueDate: dueDateTime.toISOString(),
          totalMarks: parseInt(formData.totalMarks), // ✅ FIXED: Convert to number
          fileUrl: uploadedFile?.url || null,
          fileName: uploadedFile?.name || null,
          fileSize: uploadedFile?.size || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Assignment created successfully!');
        onSuccess();
      } else {
        alert('Failed to create assignment: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('An error occurred while creating the assignment');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">Create New Assignment</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Chapter 5 - Thermodynamics Problems"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the assignment objectives and what students should submit..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Subject and Class */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Physics"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  placeholder="e.g., Class 12"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Due Date, Time, and Marks */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Time *</label>
                <input
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks *</label>
                <input
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                  placeholder="15"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment File (PDF) *
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
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition cursor-pointer block">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading || isUploading}
                  />
                  {uploading || isUploading ? (
                    <>
                      <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-3" />
                      <p className="text-purple-600 font-medium">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-1 font-medium">Click to upload assignment PDF</p>
                      <p className="text-xs text-gray-500">PDF only (Max 16MB)</p>
                    </>
                  )}
                </label>
              )}
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-900 mb-1">Important Note</p>
                  <p className="text-xs text-purple-700">
                    Students will be able to submit their answers as PDF files and discuss solutions in the comments section to help each other.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || uploading || isUploading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}