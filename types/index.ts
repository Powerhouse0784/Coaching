// types/index.ts - Global TypeScript types
// ✅ UPDATED: Compatible with database sessions

import { User, Student, Teacher, Course, Lecture, Enrollment } from "@prisma/client"

// ============================================
// AUTH TYPES (Updated for database sessions)
// ============================================
export interface SessionUser {
  id: string
  email: string | null
  name: string | null
  role: "STUDENT" | "TEACHER" | "ADMIN"
  avatar: string | null
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  role?: "STUDENT" | "TEACHER"
}

export interface LoginInput {
  email: string
  password: string
}

// ============================================
// COURSE TYPES
// ============================================
export interface CourseWithDetails extends Course {
  teacher: {
    id: string
    user: {
      name: string
      avatar: string | null
    }
  }
  _count: {
    enrollments: number
    modules: number
  }
  modules?: ModuleWithLectures[]
}

export interface ModuleWithLectures {
  id: string
  title: string
  description: string | null
  order: number
  lectures: Lecture[]
}

export interface CreateCourseInput {
  title: string
  description: string
  price: number
  level: string
  language: string
  categoryId?: string
  thumbnail?: string
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {
  isPublished?: boolean
}

// ============================================
// ENROLLMENT TYPES
// ============================================
export interface EnrollmentWithCourse extends Enrollment {
  course: CourseWithDetails
}

export interface EnrollmentProgress {
  courseId: string
  totalLectures: number
  completedLectures: number
  progressPercentage: number
  lastWatchedLecture?: string
}

// ============================================
// VIDEO TYPES
// ============================================
export interface VideoProgress {
  lectureId: string
  watchedSeconds: number
  totalDuration: number
  isCompleted: boolean
  lastWatchedAt: Date
}

export interface VideoBookmark {
  id: string
  timestamp: number
  note: string | null
  createdAt: Date
}

export interface CreateBookmarkInput {
  lectureId: string
  timestamp: number
  note?: string
}

// ============================================
// ASSIGNMENT TYPES
// ============================================
export interface AssignmentWithDetails {
  id: string
  title: string
  description: string
  totalMarks: number
  dueDate: Date
  teacher: {
    user: {
      name: string
    }
  }
  _count: {
    submissions: number
  }
}

export interface SubmissionWithDetails {
  id: string
  fileUrl: string | null
  content: string | null
  marks: number | null
  feedback: string | null
  isEvaluated: boolean
  submittedAt: Date
  student: {
    user: {
      name: string
      avatar: string | null
    }
  }
}

export interface CreateAssignmentInput {
  title: string
  description: string
  totalMarks: number
  dueDate: Date
  courseId?: string
  fileUrl?: string
}

export interface SubmitAssignmentInput {
  assignmentId: string
  content?: string
  fileUrl?: string
}

// ============================================
// QUIZ TYPES
// ============================================
export interface QuizWithQuestions {
  id: string
  title: string
  description: string | null
  duration: number
  totalMarks: number
  questions: QuestionType[]
}

export interface QuestionType {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  marks: number
}

export interface QuizAttemptInput {
  quizId: string
  answers: number[]
}

export interface QuizResult {
  score: number
  totalMarks: number
  percentage: number
  isPassed: boolean
  correctAnswers: number
  totalQuestions: number
}

// ============================================
// DOUBT TYPES
// ============================================
export interface DoubtWithReplies {
  id: string
  title: string
  description: string
  upvotes: number
  isSolved: boolean
  createdAt: Date
  student: {
    name: string
    avatar: string | null
  }
  replies: DoubtReplyType[]
  _count: {
    replies: number
  }
}

export interface DoubtReplyType {
  id: string
  content: string
  isAccepted: boolean
  createdAt: Date
  user: {
    name: string
    avatar: string | null
    role: string
  }
}

export interface CreateDoubtInput {
  title: string
  description: string
  courseId?: string
}

export interface ReplyDoubtInput {
  doubtId: string
  content: string
}

// ============================================
// PAYMENT TYPES
// ============================================
export interface PaymentOrder {
  id: string
  amount: number
  currency: string
  receipt: string
}

export interface PaymentVerification {
  orderId: string
  paymentId: string
  signature: string
}

export interface CreatePaymentInput {
  courseId: string
  amount: number
  couponCode?: string
}

// ============================================
// ANALYTICS TYPES
// ============================================
export interface StudentAnalytics {
  totalCourses: number
  completedCourses: number
  totalWatchTime: number
  averageProgress: number
  assignmentsSubmitted: number
  quizzesTaken: number
  doubtsSolved: number
  weeklyActivity: {
    date: string
    minutes: number
  }[]
  performanceBySubject: {
    subject: string
    score: number
  }[]
}

export interface TeacherAnalytics {
  totalStudents: number
  totalCourses: number
  totalRevenue: number
  averageRating: number
  recentEnrollments: {
    date: string
    count: number
  }[]
  topCourses: {
    title: string
    enrollments: number
  }[]
}

// ============================================
// LIVE CLASS TYPES
// ============================================
export interface LiveClassWithDetails {
  id: string
  title: string
  scheduledAt: Date
  duration: number
  meetingUrl: string | null
  isLive: boolean
  batch: {
    name: string
  }
  teacher: {
    user: {
      name: string
      avatar: string | null
    }
  }
}

export interface CreateLiveClassInput {
  title: string
  batchId: string
  scheduledAt: Date
  duration: number
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export interface Notification {
  id: string
  title: string
  message: string
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR"
  read: boolean
  createdAt: Date
  link?: string
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================
// DASHBOARD STATS
// ============================================
export interface DashboardStats {
  totalStudents?: number
  totalCourses?: number
  totalRevenue?: number
  activeUsers?: number
  enrolledCourses?: number
  completionRate?: number
  totalWatchTime?: number
  upcomingClasses?: number
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================
export interface SearchFilters {
  query?: string
  category?: string
  level?: string
  language?: string
  priceMin?: number
  priceMax?: number
  rating?: number
  sortBy?: "popular" | "newest" | "price-low" | "price-high"
}

export interface PaginationParams {
  page?: number
  limit?: number
}

// ============================================
// FILE UPLOAD TYPES
// ============================================
export interface UploadedFile {
  url: string
  name: string
  size: number
  type: string
}

export interface UploadProgress {
  progress: number
  uploading: boolean
  error?: string
}

// ============================================
// CERTIFICATE TYPES
// ============================================
export interface CertificateData {
  id: string
  studentName: string
  courseName: string
  certificateNumber: string
  issueDate: Date
  verificationUrl: string
}