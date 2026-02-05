'use client';

import React, { useState } from 'react';
import {
  Plus, FileText, Calendar, Clock, Users, CheckCircle, XCircle,
  Download, Upload, Eye, Edit, Trash2, Send, Filter, Search,
  AlertCircle, TrendingUp, Award, Star, MoreVertical, File,
  Paperclip, MessageSquare, ChevronDown, ChevronRight, X,
  BarChart3, Target, Percent, Hash
} from 'lucide-react';

export default function AssignmentManager() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'graded'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubmissions, setShowSubmissions] = useState(false);

  const assignments = [
    {
      id: 1,
      title: 'Physics Assignment #5 - Wave Optics',
      subject: 'Physics',
      dueDate: '2026-02-15',
      totalMarks: 20,
      submissions: 45,
      totalStudents: 50,
      pending: 5,
      graded: 40,
      status: 'active',
      createdAt: '2026-01-20',
      description: 'Solve numerical problems on wave interference, diffraction, and polarization. Include diagrams and detailed steps.',
      avgScore: 16.5,
      highestScore: 20,
      lowestScore: 8
    },
    {
      id: 2,
      title: 'Chemistry Lab Report - Organic Reactions',
      subject: 'Chemistry',
      dueDate: '2026-02-18',
      totalMarks: 25,
      submissions: 38,
      totalStudents: 50,
      pending: 12,
      graded: 26,
      status: 'active',
      createdAt: '2026-01-22',
      description: 'Write a detailed lab report on the synthesis and analysis of organic compounds including methodology and results.',
      avgScore: 19.2,
      highestScore: 25,
      lowestScore: 12
    },
    {
      id: 3,
      title: 'Mathematics Problem Set - Integration Techniques',
      subject: 'Mathematics',
      dueDate: '2026-02-10',
      totalMarks: 30,
      submissions: 50,
      totalStudents: 50,
      pending: 0,
      graded: 50,
      status: 'completed',
      createdAt: '2026-01-15',
      description: 'Advanced integration techniques including substitution, integration by parts, and partial fractions.',
      avgScore: 24.8,
      highestScore: 30,
      lowestScore: 15
    },
    {
      id: 4,
      title: 'Biology - Cell Structure and Functions',
      subject: 'Biology',
      dueDate: '2026-02-20',
      totalMarks: 15,
      submissions: 42,
      totalStudents: 50,
      pending: 8,
      graded: 34,
      status: 'active',
      createdAt: '2026-01-25',
      description: 'Detailed study and diagrams of cell organelles, their structure and functions.',
      avgScore: 12.1,
      highestScore: 15,
      lowestScore: 7
    },
  ];

  const submissions = [
    {
      id: 1,
      studentName: 'Rahul Sharma',
      studentId: 'ST001',
      email: 'rahul@example.com',
      submittedAt: '2026-02-14 10:30 AM',
      status: 'graded',
      marks: 18,
      totalMarks: 20,
      feedback: 'Excellent work! Clear explanations and correct solutions. Keep up the good work.',
      files: ['assignment_5_rahul.pdf'],
      avatar: 'RS'
    },
    {
      id: 2,
      studentName: 'Priya Patel',
      studentId: 'ST002',
      email: 'priya@example.com',
      submittedAt: '2026-02-14 02:15 PM',
      status: 'pending',
      marks: null,
      totalMarks: 20,
      feedback: null,
      files: ['assignment_5_priya.pdf', 'calculations.jpg'],
      avatar: 'PP'
    },
    {
      id: 3,
      studentName: 'Amit Kumar',
      studentId: 'ST003',
      email: 'amit@example.com',
      submittedAt: '2026-02-13 11:45 AM',
      status: 'graded',
      marks: 15,
      totalMarks: 20,
      feedback: 'Good effort. Review the concepts on diffraction patterns. Your diagrams need more detail.',
      files: ['assignment_5_amit.pdf'],
      avatar: 'AK'
    },
    {
      id: 4,
      studentName: 'Sneha Gupta',
      studentId: 'ST004',
      email: 'sneha@example.com',
      submittedAt: '2026-02-14 09:20 AM',
      status: 'pending',
      marks: null,
      totalMarks: 20,
      feedback: null,
      files: ['assignment_5_sneha.pdf', 'notes.pdf'],
      avatar: 'SG'
    },
    {
      id: 5,
      studentName: 'Rohan Singh',
      studentId: 'ST005',
      email: 'rohan@example.com',
      submittedAt: '2026-02-13 04:30 PM',
      status: 'graded',
      marks: 20,
      totalMarks: 20,
      feedback: 'Perfect! Outstanding work with clear methodology and excellent presentation.',
      files: ['assignment_5_rohan.pdf'],
      avatar: 'RS'
    },
  ];

  const stats = [
    { label: 'Total Assignments', value: '24', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+3 this month' },
    { label: 'Pending Review', value: '12', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', trend: 'Needs attention' },
    { label: 'Graded Today', value: '8', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', trend: '+5 from yesterday' },
    { label: 'Avg Score', value: '85%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100', trend: '+3% improvement' },
  ];

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'pending') return assignment.pending > 0;
    if (activeTab === 'graded') return assignment.status === 'completed';
    return true;
  });

  const handleGradeSubmission = (submissionId: number, marks: number, feedback: string) => {
    alert(`Graded submission ${submissionId}: ${marks} marks - ${feedback}`);
    // In real app, make API call to save grade
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Assignment Manager</h2>
          <p className="text-gray-600">Create, distribute, and grade student assignments with AI assistance</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Assignment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
            <p className="text-xs text-gray-500">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tab Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Assignments
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pending Review
              <span className="px-2 py-0.5 bg-orange-600 text-white rounded-full text-xs font-bold">
                12
              </span>
            </button>
            <button
              onClick={() => setActiveTab('graded')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'graded'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Graded
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden md:inline">Filter</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all overflow-hidden"
          >
            <div className="p-6">
              {/* Assignment Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{assignment.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      assignment.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {assignment.status}
                    </span>
                    {assignment.pending > 0 && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 animate-pulse">
                        {assignment.pending} pending
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {assignment.totalMarks} marks
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {assignment.submissions}/{assignment.totalStudents} submitted
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      Avg: {assignment.avgScore}/{assignment.totalMarks}
                    </span>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Progress Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>Submission Progress</span>
                  <span className="font-semibold">{Math.round((assignment.submissions / assignment.totalStudents) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${(assignment.submissions / assignment.totalStudents) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Submitted</p>
                  <p className="text-xl font-bold text-blue-600">{assignment.submissions}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Graded</p>
                  <p className="text-xl font-bold text-green-600">{assignment.graded}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Pending</p>
                  <p className="text-xl font-bold text-orange-600">{assignment.pending}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600 mb-1">Avg Score</p>
                  <p className="text-xl font-bold text-purple-600">{Math.round((assignment.avgScore / assignment.totalMarks) * 100)}%</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedAssignment(assignment);
                    setShowSubmissions(true);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold"
                >
                  <Eye className="w-4 h-4" />
                  View Submissions ({assignment.pending} to review)
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredAssignments.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or create a new assignment</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Assignment
          </button>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissions && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedAssignment.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Submissions: {selectedAssignment.submissions}/{selectedAssignment.totalStudents}</span>
                    <span>•</span>
                    <span>Pending: {selectedAssignment.pending}</span>
                    <span>•</span>
                    <span>Graded: {selectedAssignment.graded}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSubmissions(false);
                    setSelectedAssignment(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Submissions List */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6 space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    {/* Student Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{submission.avatar}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{submission.studentName}</h4>
                          <p className="text-sm text-gray-500">{submission.studentId} • {submission.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          submission.status === 'graded'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {submission.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{submission.submittedAt}</p>
                      </div>
                    </div>

                    {/* Attachments */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                      <div className="flex flex-wrap gap-2">
                        {submission.files.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                            <File className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">{file}</span>
                            <button className="text-blue-600 hover:text-blue-700">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Grading Section */}
                    {submission.status === 'graded' ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-green-900">Marks Awarded</span>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-green-700">
                              {submission.marks}
                            </span>
                            <span className="text-xl text-green-600">/ {submission.totalMarks}</span>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-600 rounded-full"
                              style={{ width: `${(submission.marks! / submission.totalMarks) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Teacher's Feedback:</p>
                          <p className="text-sm text-gray-600">{submission.feedback}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-orange-900 mb-3">Grade This Submission</p>
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Marks (out of {submission.totalMarks})</label>
                              <input
                                type="number"
                                placeholder="Enter marks"
                                min="0"
                                max={submission.totalMarks}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Feedback</label>
                            <textarea
                              placeholder="Add detailed feedback for the student..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Submit Grade
                            </button>
                            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                              Save Draft
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Create New Assignment</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Physics Assignment #5 - Wave Optics"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the assignment objectives, requirements, and what students should submit..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select subject</option>
                      <option>Physics</option>
                      <option>Chemistry</option>
                      <option>Mathematics</option>
                      <option>Biology</option>
                      <option>English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks *</label>
                    <input
                      type="number"
                      placeholder="20"
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Time *</label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attach Resources (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-1 font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, PPT, PPTX (Max 10MB per file)</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">AI Grading Available</p>
                      <p className="text-xs text-blue-700">Enable AI-assisted grading to get instant preliminary scores and feedback suggestions for submitted assignments.</p>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-blue-900">Enable AI grading for this assignment</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition font-semibold">
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}