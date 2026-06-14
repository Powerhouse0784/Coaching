'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUploadThing } from '@/lib/uploadthing';
import {
  Plus, FileText, Calendar, Users, Download, Trash2, Search,
  AlertCircle, Loader, X, Upload, CheckCircle, XCircle, Eye,
  MessageSquare, RefreshCw, User, Mail, MapPin, Phone, Cake
} from 'lucide-react';

interface StudentProfile {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  phone: string | null;
  location: string | null;
  dateOfBirth: string | null;
  bio: string | null;
}

interface Submission {
  id: string;
  status: string;
  isCompleted: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: string;
  remarks: string | null;
  submittedAt: string;
  student: StudentProfile;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    role: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  dueDate: string;
  fileUrl: string;
  fileName: string | null;
  fileSize: string | null;
  isPublished: boolean;
  createdAt: string;
  stats: {
    totalSubmissions: number;
    totalComments: number;
  };
  submissions: Submission[];
  comments: Comment[];
}

export default function AssignmentManager() {
  const { data: session } = useSession();

  // Dark mode detection
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teacher/assignments');
      const data = await response.json();

      if (data.success) {
        setAssignments(data.assignments || []);
        setFilteredAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment? All submissions will be deleted.')) {
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
        alert('Failed to delete: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('An error occurred');
    }
  };

  const subjects = Array.from(new Set(assignments.map((a) => a.subject)));
  const classes = Array.from(new Set(assignments.map((a) => a.class)));

  const totalAssignments = assignments.length;
  const totalSubmissions = assignments.reduce((sum, a) => sum + a.stats.totalSubmissions, 0);
  const totalComments = assignments.reduce((sum, a) => sum + a.stats.totalComments, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className={`w-10 h-10 sm:w-12 sm:h-12 animate-spin mx-auto mb-3 sm:mb-4 ${dm ? 'text-purple-400' : 'text-purple-600'}`} />
          <p className={`text-sm sm:text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Assignment Manager</h1>
          <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Create and manage assignments</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={fetchAssignments}
            className={`p-2.5 sm:p-3 border rounded-xl transition ${dm ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${dm ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Create</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        {[
          { icon: FileText, value: totalAssignments, label: 'Total Assignments', color: 'blue' },
          { icon: Users, value: totalSubmissions, label: 'Total Submissions', color: 'purple' },
          { icon: MessageSquare, value: totalComments, label: 'Total Comments', color: 'orange' },
        ].map((stat, idx) => (
          <div key={idx} className={`rounded-xl p-4 sm:p-5 md:p-6 border hover:shadow-lg transition ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${
              stat.color === 'blue' ? 'bg-blue-100' :
              stat.color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'
            }`}>
              <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                stat.color === 'blue' ? 'text-blue-600' :
                stat.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
              }`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{stat.value}</p>
            <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
          </div>

          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className={`rounded-xl border p-8 sm:p-10 md:p-12 text-center ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <FileText className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg sm:text-xl font-bold mb-1 sm:mb-2 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>No assignments yet</h3>
          <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Create your first assignment to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold text-sm sm:text-base"
          >
            Create Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onDelete={handleDelete}
              onCommentDelete={fetchAssignments}
              darkMode={dm}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAssignmentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAssignments();
          }}
          darkMode={dm}
        />
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  onDelete,
  onCommentDelete,
  darkMode,
}: {
  assignment: Assignment;
  onDelete: (id: string) => void;
  onCommentDelete: () => void;
  darkMode: boolean;
}) {
  const dm = darkMode;
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const isOverdue = dueDate < now;
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`/api/teacher/assignments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('Comment deleted');
        onCommentDelete();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  };

  return (
    <div className={`rounded-xl border hover:shadow-xl transition-all overflow-hidden ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="p-4 sm:p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h3 className={`text-lg sm:text-xl font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{assignment.title}</h3>
              <span className="px-2.5 sm:px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0">
                {assignment.subject}
              </span>
              <span className="px-2.5 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0">
                {assignment.class}
              </span>
            </div>
            <p className={`text-sm sm:text-base mb-3 line-clamp-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{assignment.description}</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
              <span className={`flex items-center gap-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Due: {dueDate.toLocaleDateString()}</span>
              </span>
              {isOverdue ? (
                <span className="flex items-center gap-1 text-red-600 font-semibold flex-shrink-0">
                  <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Overdue
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-600 flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'} left
                </span>
              )}
              <span className={`flex items-center gap-1 flex-shrink-0 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {assignment.stats.totalSubmissions}
              </span>
              <span className={`flex items-center gap-1 flex-shrink-0 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {assignment.stats.totalComments}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Total Submissions</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{assignment.stats.totalSubmissions}</p>
          </div>
        </div>

        {/* Submissions Section */}
        {assignment.submissions.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowSubmissions(!showSubmissions)}
              className="flex items-center gap-2 text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-700 mb-2"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {showSubmissions ? 'Hide' : 'View'} Submissions ({assignment.submissions.length})
            </button>

            {showSubmissions && (
              <div className={`rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
                {assignment.submissions.map((submission) => (
                  <div key={submission.id} className={`rounded-lg p-3 sm:p-4 border ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base">
                          {submission.student.avatar ? (
                            <img src={submission.student.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            submission.student.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm sm:text-base truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{submission.student.name || 'Unknown'}</p>
                          <p className={`text-[10px] sm:text-xs truncate ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{submission.student.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedStudent(submission.student)}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] sm:text-xs font-semibold hover:bg-indigo-200 transition flex-shrink-0"
                      >
                        View Profile
                      </button>
                    </div>

                    <div className="flex items-start gap-2 mb-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-blue-600 hover:underline font-medium truncate"
                      >
                        {submission.fileName}
                      </a>
                      <span className={`text-[10px] sm:text-xs flex-shrink-0 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>({submission.fileSize})</span>
                    </div>

                    {submission.remarks && (
                      <p className={`text-xs sm:text-sm italic mb-2 ${dm ? 'text-gray-400' : 'text-gray-700'}`}>"{submission.remarks}"</p>
                    )}

                    <div className={`flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
                      <span className="truncate">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded-full font-semibold text-center flex-shrink-0 ${
                        submission.isCompleted
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {submission.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comments Section */}
        {assignment.comments.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-700 mb-2"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {showComments ? 'Hide' : 'View'} Comments ({assignment.comments.length})
            </button>

            {showComments && (
              <div className={`rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-60 overflow-y-auto ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
                {assignment.comments.map((comment) => (
                  <div key={comment.id} className={`rounded-lg p-3 border ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                        <p className={`font-semibold text-xs sm:text-sm truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{comment.user.name || 'Unknown'}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                          comment.user.role === 'TEACHER'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {comment.user.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 hover:bg-red-100 rounded transition"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs sm:text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3">
          <a
            href={assignment.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold text-sm sm:text-base"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
          <button
            onClick={() => onDelete(assignment.id)}
            className="px-4 py-2 sm:py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2 font-semibold text-sm sm:text-base"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          darkMode={dm}
        />
      )}
    </div>
  );
}

function StudentProfileModal({ student, onClose, darkMode }: { student: StudentProfile; onClose: () => void; darkMode: boolean }) {
  const dm = darkMode;

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-4 sm:p-6 border-b ${dm ? 'border-gray-700 bg-gradient-to-r from-purple-900/30 to-pink-900/30' : 'border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl sm:text-2xl font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Student Profile</h3>
            <button onClick={onClose} className={`p-2 rounded-lg transition ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <X className={`w-5 h-5 sm:w-6 sm:h-6 ${dm ? 'text-gray-400' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="flex flex-col items-center mb-5 sm:mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold mb-3 shadow-lg">
              {student.avatar ? (
                <img src={student.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                student.name?.charAt(0).toUpperCase()
              )}
            </div>
            <h4 className={`text-lg sm:text-xl font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{student.name || 'Unknown'}</h4>
            <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{student.email}</p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {student.phone && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <Phone className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-400' : 'text-gray-400'}`} />
                <div className="min-w-0">
                  <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>Phone</p>
                  <p className={`font-semibold text-sm sm:text-base truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{student.phone}</p>
                </div>
              </div>
            )}

            {student.location && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-400' : 'text-gray-400'}`} />
                <div className="min-w-0">
                  <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>Location</p>
                  <p className={`font-semibold text-sm sm:text-base truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{student.location}</p>
                </div>
              </div>
            )}

            {student.dateOfBirth && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <Cake className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-400' : 'text-gray-400'}`} />
                <div className="min-w-0">
                  <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>Age</p>
                  <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                    {calculateAge(student.dateOfBirth)} years old
                  </p>
                </div>
              </div>
            )}

            {student.bio && (
              <div className={`p-3 rounded-lg ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <p className={`text-[10px] sm:text-xs mb-1 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>Bio</p>
                <p className={`text-xs sm:text-sm ${dm ? 'text-gray-300' : 'text-gray-900'}`}>{student.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateAssignmentModal({ onClose, onSuccess, darkMode }: { onClose: () => void; onSuccess: () => void; darkMode: boolean }) {
  const dm = darkMode;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class: '',
    dueDate: '',
  });
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = getTodayDate();

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

    if (!formData.title || !formData.description || !formData.subject || !formData.class || !formData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (!uploadedFile) {
      alert('Please upload assignment PDF');
      return;
    }

    const selectedDate = new Date(formData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert('Due date cannot be in the past. Please select today or a future date.');
      return;
    }

    setCreating(true);

    try {
      const dueDateTime = new Date(formData.dueDate);
      dueDateTime.setHours(23, 59, 59, 999);

      const response = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          class: formData.class,
          dueDate: dueDateTime.toISOString(),
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Assignment created successfully!');
        onSuccess();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setCreating(false);
    }
  };

  return (
    // Fixed: items-center on all breakpoints + p-4 everywhere so the modal
    // is always centered with breathing room around it (previously
    // items-end on mobile + p-0 caused inconsistent sizing/positioning).
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/*
        Fixed: the modal is now a flex column with a capped height
        (max-h-[90vh]). The header and footer are normal flex items,
        and the form body uses flex-1 + overflow-y-auto, so the footer
        (with the "Create Assignment" button) is ALWAYS visible at the
        bottom of the modal, regardless of screen size or how many
        fields are shown. Previously the footer could be pushed outside
        the overflow-hidden container on larger (laptop) viewports.
      */}
      <div className={`rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header (fixed) */}
        <div className={`p-4 sm:p-6 border-b flex-shrink-0 ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl sm:text-2xl font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Create New Assignment</h3>
            <button onClick={onClose} className={`p-2 rounded-lg transition ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <X className={`w-5 h-5 sm:w-6 sm:h-6 ${dm ? 'text-gray-400' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>

        {/* Form: flex-1 so it fills remaining height; flex-col so the
            scrollable body and the fixed footer stack correctly */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Assignment Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Chapter 5 - Thermodynamics Problems"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                required
              />
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Description *</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the assignment..."
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base resize-none ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Physics"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Class *</label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  placeholder="e.g., Class 12"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                min={minDate}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                required
              />
              <p className={`text-[10px] sm:text-xs mt-1 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>Due date must be today or in the future</p>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Assignment File (PDF) *</label>
              {uploadedFile ? (
                <div className="border-2 border-green-300 bg-green-50 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm sm:text-base truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{uploadedFile.name}</p>
                      <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{uploadedFile.size}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="p-2 hover:bg-red-100 rounded-lg transition flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </button>
                </div>
              ) : (
                <label className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center hover:border-purple-500 transition cursor-pointer block ${dm ? 'border-gray-600' : 'border-gray-300'}`}>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading || isUploading}
                  />
                  {uploading || isUploading ? (
                    <>
                      <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 animate-spin mx-auto mb-2 sm:mb-3" />
                      <p className="text-purple-600 font-medium text-sm sm:text-base">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 ${dm ? 'text-gray-400' : 'text-gray-400'}`} />
                      <p className={`mb-1 font-medium text-sm sm:text-base ${dm ? 'text-gray-300' : 'text-gray-600'}`}>Click to upload assignment PDF</p>
                      <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>PDF only (Max 16MB) - REQUIRED</p>
                    </>
                  )}
                </label>
              )}
            </div>

            <div className={`border-2 rounded-xl p-3 sm:p-4 ${dm ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${dm ? 'text-purple-400' : 'text-purple-600'}`} />
                <div>
                  <p className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${dm ? 'text-purple-300' : 'text-purple-900'}`}>Important Note</p>
                  <p className={`text-[10px] sm:text-xs ${dm ? 'text-purple-400' : 'text-purple-700'}`}>
                    Students will submit their answers as PDF files and can discuss solutions in comments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer (fixed, always visible) */}
          <div className={`p-4 sm:p-6 border-t flex-shrink-0 flex flex-col xs:flex-row items-stretch xs:items-center justify-end gap-2 sm:gap-3 ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 sm:px-6 py-2.5 sm:py-3 border-2 rounded-xl transition font-semibold text-sm sm:text-base ${dm ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || uploading || isUploading || !uploadedFile}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {creating ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
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