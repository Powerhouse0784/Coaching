'use client';
// components/common/EmptyState.tsx
import React from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// ============================================
// Specific Empty States
// ============================================
import { BookOpen, Video, FileText, MessageSquare, Calendar } from 'lucide-react'

export const NoCourses = ({ onCreateCourse }: { onCreateCourse?: () => void }) => (
  <EmptyState
    icon={BookOpen}
    title="No courses yet"
    description="Start your learning journey by enrolling in a course"
    action={onCreateCourse ? { label: 'Browse Courses', onClick: onCreateCourse } : undefined}
  />
)

export const NoLectures = ({ onAddLecture }: { onAddLecture?: () => void }) => (
  <EmptyState
    icon={Video}
    title="No lectures available"
    description="Lectures will appear here once they are added to this course"
    action={onAddLecture ? { label: 'Add Lecture', onClick: onAddLecture } : undefined}
  />
)

export const NoAssignments = ({ onCreateAssignment }: { onCreateAssignment?: () => void }) => (
  <EmptyState
    icon={FileText}
    title="No assignments yet"
    description="Assignments will be posted here by your teachers"
    action={onCreateAssignment ? { label: 'Create Assignment', onClick: onCreateAssignment } : undefined}
  />
)

export const NoDoubts = ({ onAskDoubt }: { onAskDoubt?: () => void }) => (
  <EmptyState
    icon={MessageSquare}
    title="No doubts posted"
    description="Have a question? Post your doubt and get help from teachers and peers"
    action={onAskDoubt ? { label: 'Ask a Doubt', onClick: onAskDoubt } : undefined}
  />
)

export const NoClasses = ({ onScheduleClass }: { onScheduleClass?: () => void }) => (
  <EmptyState
    icon={Calendar}
    title="No upcoming classes"
    description="Live classes will be scheduled and appear here"
    action={onScheduleClass ? { label: 'Schedule Class', onClick: onScheduleClass } : undefined}
  />
)