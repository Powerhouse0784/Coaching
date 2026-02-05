// components/student/UpcomingClasses.tsx
'use client'

import React, { useState } from 'react'
import { Calendar, Clock, Video, Users, Bell, ExternalLink } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface LiveClass {
  id: string
  title: string
  scheduledAt: Date
  duration: number
  meetingUrl: string | null
  teacher: {
    user: {
      name: string
      avatar: string | null
    }
  }
  batch: {
    name: string
  }
}

interface UpcomingClassesProps {
  classes: LiveClass[]
}

export const UpcomingClasses: React.FC<UpcomingClassesProps> = ({ classes }) => {
  const [reminderSet, setReminderSet] = useState<string[]>([])

  const toggleReminder = (classId: string) => {
    if (reminderSet.includes(classId)) {
      setReminderSet(reminderSet.filter(id => id !== classId))
    } else {
      setReminderSet([...reminderSet, classId])
      // API call to set reminder
      console.log('Reminder set for:', classId)
    }
  }

  const joinClass = (meetingUrl: string | null) => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank')
    }
  }

  const isClassLive = (scheduledAt: Date) => {
    const now = new Date()
    const classTime = new Date(scheduledAt)
    const diffMinutes = (classTime.getTime() - now.getTime()) / 1000 / 60
    return diffMinutes <= 5 && diffMinutes >= -60 // Live if within 5 min before or 60 min after
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Upcoming Classes
        </h2>
        <div className="text-center py-8">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">No upcoming classes scheduled</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        Upcoming Classes
      </h2>

      <div className="space-y-3">
        {classes.map((liveClass) => {
          const isLive = isClassLive(liveClass.scheduledAt)
          const hasReminder = reminderSet.includes(liveClass.id)

          return (
            <div
              key={liveClass.id}
              className={`border rounded-lg p-4 transition-all ${
                isLive
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {/* Live Badge */}
              {isLive && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-red-600">LIVE NOW</span>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {liveClass.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {liveClass.batch.name}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {format(new Date(liveClass.scheduledAt), 'MMM dd, h:mm a')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {liveClass.teacher.user.name}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleReminder(liveClass.id)}
                  className={`p-2 rounded-lg transition ${
                    hasReminder
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                  }`}
                  title={hasReminder ? 'Reminder set' : 'Set reminder'}
                >
                  <Bell size={16} />
                </button>
              </div>

              {/* Time Until */}
              <div className="text-xs text-gray-500 mb-3">
                {isLive ? (
                  <span className="text-red-600 font-medium">Started {formatDistanceToNow(new Date(liveClass.scheduledAt))} ago</span>
                ) : (
                  <span>Starts {formatDistanceToNow(new Date(liveClass.scheduledAt), { addSuffix: true })}</span>
                )}
              </div>

              {/* Join Button */}
              {liveClass.meetingUrl && (
                <button
                  onClick={() => joinClass(liveClass.meetingUrl)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
                    isLive
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Video size={16} />
                  {isLive ? 'Join Now' : 'Join Class'}
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
        View All Classes →
      </button>
    </div>
  )
}

// ============================================
// components/student/RecentActivity.tsx
// ============================================
interface Assignment {
  id: string
  title: string
  dueDate: Date
  totalMarks: number
}

interface RecentActivityProps {
  pendingAssignments: Assignment[]
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  pendingAssignments,
}) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>

      <div className="space-y-4">
        {/* Pending Assignments */}
        {pendingAssignments.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Pending Assignments ({pendingAssignments.length})
            </h3>
            <div className="space-y-2">
              {pendingAssignments.slice(0, 3).map((assignment) => {
                const daysLeft = Math.ceil(
                  (new Date(assignment.dueDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
                const isUrgent = daysLeft <= 2

                return (
                  <div
                    key={assignment.id}
                    className={`p-3 rounded-lg border ${
                      isUrgent
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {assignment.title}
                      </h4>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          isUrgent
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {daysLeft}d left
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Due: {format(new Date(assignment.dueDate), 'MMM dd, h:mm a')}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Achievement Badge */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">
                Keep it up!
              </h4>
              <p className="text-xs text-gray-600">
                You've completed 3 courses this month
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">This Week</p>
            <p className="text-2xl font-bold text-blue-700">12h</p>
            <p className="text-xs text-blue-600">Watch time</p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-xs text-green-600 font-medium mb-1">Streak</p>
            <p className="text-2xl font-bold text-green-700">7 🔥</p>
            <p className="text-xs text-green-600">Days active</p>
          </div>
        </div>
      </div>
    </div>
  )
}