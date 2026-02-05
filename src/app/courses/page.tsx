// src/app/courses/page.tsx
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { CourseGrid } from '@/components/courses/CourseGrid'
import { CourseFilters } from '@/components/courses/CourseFilters'
import { CardSkeleton } from '@/components/Common/Loading'
import Link from 'next/link'
import { Search } from 'lucide-react'

// ✅ FIXED: Use Prisma's generated types + proper transformation
import { Prisma } from '@prisma/client'

async function getCourses(searchParams: any) {
  const { search, category, level, sortBy } = searchParams

  const where: any = {
    isPublished: true,
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (category) {
    where.category = { slug: category }
  }

  if (level) {
    where.level = level
  }

  let orderBy: any = { createdAt: 'desc' }
  if (sortBy === 'popular') {
    orderBy = { enrollments: { _count: 'desc' } }
  } else if (sortBy === 'price-low') {
    orderBy = { price: 'asc' }
  } else if (sortBy === 'price-high') {
    orderBy = { price: 'desc' }
  }

  const courses = await prisma.course.findMany({
    where,
    orderBy,
    include: {
      teacher: {
        select: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  })

  // ✅ FIXED: Transform to match CourseGrid exactly - NO type assertions needed
  const transformedCourses = courses.map((course: any) => ({
    ...course,
    duration: course.duration || 0, // Ensure duration exists
    category: {
      ...course.category,
      slug: course.category?.slug || '',
    },
  }))

  return transformedCourses
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
  return categories
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: any
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Explore Courses
              </h1>
              <p className="text-lg text-gray-600">
                Choose from 500+ courses to start learning today
              </p>
            </div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <Suspense fallback={<div>Loading filters...</div>}>
            <CoursesFilters />
          </Suspense>

          {/* Courses Grid */}
          <div className="lg:col-span-3">
            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <CoursesContent searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

async function CoursesFilters() {
  const categories = await getCategories()

  return <CourseFilters categories={categories} />
}

async function CoursesContent({ searchParams }: { searchParams: any }) {
  const courses = await getCourses(searchParams)

  return <CourseGrid courses={courses} />
}
