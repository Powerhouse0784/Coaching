'use client'

import React from 'react'
import Link from 'next/link'
import { Star, Users, Clock, BookOpen } from 'lucide-react'

// ✅ FIXED: Inline formatPrice function - No external dependency needed

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(price)
}

interface Course {
  id: string
  title: string
  slug: string
  description: string
  price: number
  thumbnail: string | null
  level: string
  duration: number | null
  teacher: {
    user: {
      name: string
      avatar: string | null
    }
  }
  _count: {
    enrollments: number
  }
}

interface CourseGridProps {
  courses: Course[]
}

export const CourseGrid: React.FC<CourseGridProps> = ({ courses }) => {
  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No courses found
        </h3>
        <p className="text-gray-600">
          Try adjusting your filters or search query
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white/80" />
          </div>
        )}
        
        {/* Level Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full text-xs font-semibold">
            {course.level}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {course.description}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {course.teacher.user.name.charAt(0)}
          </div>
          <span className="text-sm text-gray-700">{course.teacher.user.name}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span>4.8</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course._count.enrollments} students</span>
          </div>
          {course.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration}h</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(course.price)}
          </span>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            Enroll Now
          </button>
        </div>
      </div>
    </Link>
  )
}
