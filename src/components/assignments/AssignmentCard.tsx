// components/assignments/AssignmentCard.tsx
'use client'

import React, { useState } from 'react'
import { FileText, Clock, CheckCircle, AlertCircle, Upload, Download } from 'lucide-react'
import { format, isPast } from 'date-fns'

interface Assignment {
  id: string
  title: string
  description: string
  totalMarks: number
  dueDate: Date
  fileUrl?: string | null
  teacher: {
    user: {
      name: string
    }
  }
  submissions?: Array<{
    id: string
    submittedAt: Date
    isEvaluated: boolean
    marks: number | null
  }>
}

export const AssignmentCard: React.FC<{ assignment: Assignment }> = ({
  assignment,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  
  const submission = assignment.submissions?.[0]
  const isSubmitted = !!submission
  const isOverdue = isPast(new Date(assignment.dueDate)) && !isSubmitted
  const isEvaluated = submission?.isEvaluated

  const getStatusBadge = () => {
    if (isEvaluated) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          <CheckCircle size={14} />
          Graded: {submission.marks}/{assignment.totalMarks}
        </span>
      )
    }
    if (isSubmitted) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
          <Clock size={14} />
          Submitted
        </span>
      )
    }
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
          <AlertCircle size={14} />
          Overdue
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
        <Clock size={14} />
          Pending
      </span>
    )
  }

  return (
    <>
      <div className={`bg-white rounded-lg border p-6 hover:shadow-md transition ${
        isOverdue ? 'border-red-300' : 'border-gray-200'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              isEvaluated ? 'bg-green-100' :
              isSubmitted ? 'bg-blue-100' :
              isOverdue ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <FileText className={`w-5 h-5 ${
                isEvaluated ? 'text-green-600' :
                isSubmitted ? 'text-blue-600' :
                isOverdue ? 'text-red-600' : 'text-yellow-600'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {assignment.title}
              </h3>
              <p className="text-sm text-gray-600">
                by {assignment.teacher.user.name}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
          {assignment.description}
        </p>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-1">
              <Clock size={16} />
              Due: {format(new Date(assignment.dueDate), 'MMM dd, h:mm a')}
            </span>
            <span className="font-medium">
              {assignment.totalMarks} marks
            </span>
          </div>
        </div>

        {assignment.fileUrl && (
          <a
            href={assignment.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <Download size={16} />
            Download Assignment File
          </a>
        )}

        <div className="flex gap-2 mt-4 pt-4 border-t">
          {!isSubmitted && !isOverdue && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              Submit Assignment
            </button>
          )}
          {isSubmitted && (
            <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
              View Submission
            </button>
          )}
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
            Details
          </button>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <SubmitAssignmentModal
          assignment={assignment}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
    </>
  )
}

// ============================================
// Submit Assignment Modal
// ============================================
interface SubmitModalProps {
  assignment: Assignment
  onClose: () => void
}

const SubmitAssignmentModal: React.FC<SubmitModalProps> = ({
  assignment,
  onClose,
}) => {
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    setUploading(true)
    
    try {
      // Upload file if present
      let fileUrl = null
      if (file) {
        // Upload logic here (UploadThing)
        console.log('Uploading file:', file.name)
        fileUrl = 'https://example.com/uploaded-file.pdf' // Placeholder
      }

      // Submit assignment
      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          content,
          fileUrl,
        }),
      })

      if (response.ok) {
        alert('Assignment submitted successfully!')
        onClose()
        window.location.reload()
      } else {
        throw new Error('Failed to submit')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to submit assignment')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Submit Assignment</h2>
          <p className="text-sm text-gray-600 mt-1">{assignment.title}</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Text Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Answer
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your answer here..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, TXT (Max 10MB)
                </p>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={(!content && !file) || uploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}
