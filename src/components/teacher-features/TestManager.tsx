'use client';

import React, { useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Target, Clock, Users, BarChart3, CheckCircle, Award } from 'lucide-react';

export default function TestManager() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const tests = [
    { id: 1, title: 'JEE Mains Mock Test #5', questions: 90, duration: 180, students: 120, avgScore: 78, status: 'active' },
    { id: 2, title: 'NEET Biology Chapter Test', questions: 45, duration: 60, students: 87, avgScore: 82, status: 'active' },
    { id: 3, title: 'Physics Thermodynamics Quiz', questions: 20, duration: 30, students: 95, avgScore: 75, status: 'completed' },
  ];

  const stats = [
    { label: 'Active Tests', value: '8', icon: Target, color: 'orange' },
    { label: 'Total Attempts', value: '1.2K', icon: Users, color: 'blue' },
    { label: 'Avg Score', value: '76%', icon: BarChart3, color: 'green' },
    { label: 'Pass Rate', value: '89%', icon: CheckCircle, color: 'purple' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Manager</h2>
          <p className="text-gray-600">Create and manage practice tests and mock exams</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6">
        {tests.map((test) => (
          <div key={test.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{test.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    test.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {test.status}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {test.questions} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {test.duration} minutes
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {test.students} students
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Avg: {test.avgScore}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Eye className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Edit className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}