// components/student/DashboardStats.tsx
import React from 'react'
import { BookOpen, Award, Clock, Calendar, FileText, TrendingUp } from 'lucide-react'

interface StatsProps {
  stats: {
    enrolledCourses: number
    completedCourses: number
    totalWatchTime: number
    upcomingClasses: number
    pendingAssignments: number
    completionRate: number
  }
}

export const DashboardStats: React.FC<StatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Enrolled Courses',
      value: stats.enrolledCourses,
      icon: BookOpen,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: '+2 this month',
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: Award,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      change: '+5% from last week',
    },
    {
      title: 'Watch Time',
      value: `${stats.totalWatchTime}m`,
      icon: Clock,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      change: '12h this week',
    },
    {
      title: 'Upcoming Classes',
      value: stats.upcomingClasses,
      icon: Calendar,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      change: 'Next in 2 hours',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={index}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <TrendingUp size={12} />
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">
                {stat.title}
              </p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// components/student/EnrolledCourses.tsx
// ============================================
import { Play, BookmarkIcon, MoreVertical } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Enrollment {
  id: string
  course: {
    id: string
    title: string
    slug: string
    thumbnail: string | null
    teacher: {
      user: {
        name: string
        avatar: string | null
      }
    }
    modules: Array<{
      lectures: Array<{
        id: string
        duration: number | null
      }>
    }>
  }
}

export const EnrolledCourses: React.FC<{ enrollments: Enrollment[] }> = ({
  enrollments,
}) => {
  if (enrollments.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No courses yet
        </h3>
        <p className="text-gray-600 mb-4">
          Start your learning journey by enrolling in a course
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Browse Courses
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
        <Link
          href="/student/courses"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enrollments.map((enrollment) => {
          const totalLectures = enrollment.course.modules.reduce(
            (acc, module) => acc + module.lectures.length,
            0
          )
          // This should be calculated from progress data
          const progress = 45 // Placeholder

          return (
            <Link
              key={enrollment.id}
              href={`/student/courses/${enrollment.course.slug}`}
              className="group block"
            >
              <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                {/* Thumbnail */}
                <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600">
                  {enrollment.course.thumbnail ? (
                    <Image
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="w-12 h-12 text-white/80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />
                  <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                    {enrollment.course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    by {enrollment.course.teacher.user.name}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>{progress}% complete</span>
                      <span>{totalLectures} lectures</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <button className="w-full mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                    Continue Learning
                  </button>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}