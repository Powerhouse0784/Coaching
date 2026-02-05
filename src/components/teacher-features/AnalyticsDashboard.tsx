'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Award, Calendar, Download, Filter, PieChart, LineChart } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('week');

  const stats = [
    { label: 'Avg Class Attendance', value: '93%', change: '+5%', trend: 'up', icon: Users, color: 'blue' },
    { label: 'Avg Test Score', value: '82%', change: '+3%', trend: 'up', icon: Award, color: 'green' },
    { label: 'Assignment Completion', value: '88%', change: '+7%', trend: 'up', icon: BarChart3, color: 'purple' },
    { label: 'Student Engagement', value: '91%', change: '+2%', trend: 'up', icon: TrendingUp, color: 'orange' },
  ];

  const topPerformers = [
    { rank: 1, name: 'Sneha Gupta', score: 93, avatar: 'SG' },
    { rank: 2, name: 'Priya Patel', score: 91, avatar: 'PP' },
    { rank: 3, name: 'Rahul Sharma', score: 89, avatar: 'RS' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Performance Analytics</h2>
          <p className="text-gray-600">Track class performance with detailed insights and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
            <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
            <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
              <TrendingUp className="w-4 h-4" />
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Performance Trend</h3>
          <div className="h-64 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg flex items-center justify-center">
            <LineChart className="w-16 h-16 text-indigo-600" />
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Subject Performance</h3>
          <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
            <PieChart className="w-16 h-16 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Top Performers</h3>
        <div className="space-y-3">
          {topPerformers.map((student) => (
            <div key={student.rank} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{student.avatar}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-2xl text-gray-400">#{student.rank}</span>
                  <span className="font-semibold text-gray-900">{student.name}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">{student.score}%</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}