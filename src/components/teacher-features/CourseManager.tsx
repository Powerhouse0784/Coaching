'use client';

import React, { useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, Users, Play, FileText, CheckCircle, Clock, Award, TrendingUp } from 'lucide-react';

export default function CourseManager() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const courses = [
    {
      id: 1,
      title: 'JEE Advanced Physics',
      description: 'Complete physics preparation for JEE Advanced exam',
      thumbnail: 'JP',
      students: 95,
      modules: 12,
      videos: 48,
      assignments: 24,
      progress: 75,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      title: 'NEET Biology Complete',
      description: 'Comprehensive biology course for NEET aspirants',
      thumbnail: 'NB',
      students: 87,
      modules: 10,
      videos: 52,
      assignments: 20,
      progress: 82,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 3,
      title: 'JEE Mains Mathematics',
      description: 'Mathematical concepts and problem solving for JEE Mains',
      thumbnail: 'JM',
      students: 103,
      modules: 15,
      videos: 60,
      assignments: 30,
      progress: 68,
      color: 'from-purple-500 to-pink-500'
    },
  ];

  const stats = [
    { label: 'Active Courses', value: '3', icon: BookOpen, color: 'yellow' },
    { label: 'Total Students', value: '285', icon: Users, color: 'blue' },
    { label: 'Completion Rate', value: '78%', icon: TrendingUp, color: 'green' },
    { label: 'Avg Rating', value: '4.8', icon: Award, color: 'purple' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Course Management</h2>
          <p className="text-gray-600">Create and organize structured courses</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
            <div className={`h-32 bg-gradient-to-r ${course.color} flex items-center justify-center relative`}>
              <span className="text-white font-bold text-4xl">{course.thumbnail}</span>
              <div className="absolute top-3 right-3 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-white text-sm font-semibold">{course.progress}% Complete</span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{course.description}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{course.students}</p>
                  <p className="text-xs text-gray-600">Students</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{course.modules}</p>
                  <p className="text-xs text-gray-600">Modules</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <Play className="w-4 h-4" />
                  {course.videos} videos
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {course.assignments} tasks
                </span>
              </div>

              <div className="mb-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${course.color} rounded-full`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition font-semibold">
                  Manage
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Edit className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}