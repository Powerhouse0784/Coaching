'use client'

import React from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Clock, Target, Award } from 'lucide-react'

interface ProgressChartProps {
  userId: string
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ userId }) => {
  // Sample data - replace with real data from API
  const weeklyData = [
    { day: 'Mon', hours: 2.5 },
    { day: 'Tue', hours: 3.2 },
    { day: 'Wed', hours: 1.8 },
    { day: 'Thu', hours: 4.1 },
    { day: 'Fri', hours: 2.9 },
    { day: 'Sat', hours: 5.5 },
    { day: 'Sun', hours: 3.7 },
  ]

  const monthlyProgress = [
    { month: 'Jan', completed: 12 },
    { month: 'Feb', completed: 18 },
    { month: 'Mar', completed: 25 },
    { month: 'Apr', completed: 32 },
    { month: 'May', completed: 28 },
    { month: 'Jun', completed: 35 },
  ]

  const courseProgress = [
    { name: 'Completed', value: 45, color: '#10b981' },
    { name: 'In Progress', value: 35, color: '#3b82f6' },
    { name: 'Not Started', value: 20, color: '#e5e7eb' },
  ]

  const totalWatchTime = weeklyData.reduce((sum, day) => sum + day.hours, 0)
  const avgDailyTime = (totalWatchTime / 7).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Weekly Study Time */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Weekly Study Time
            </h3>
            <p className="text-sm text-gray-600">
              Total: {totalWatchTime.toFixed(1)} hours this week
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <TrendingUp size={20} />
            <span className="text-sm font-semibold">+23%</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="day" 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="hours" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fill="url(#colorHours)" 
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <Clock className="w-5 h-5 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{avgDailyTime}h</p>
            <p className="text-xs text-gray-600">Avg per day</p>
          </div>
          <div className="text-center">
            <Target className="w-5 h-5 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">5/7</p>
            <p className="text-xs text-gray-600">Days active</p>
          </div>
          <div className="text-center">
            <Award className="w-5 h-5 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">7🔥</p>
            <p className="text-xs text-gray-600">Day streak</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Progress */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Monthly Progress
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Lectures completed per month
          </p>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="completed" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Course Distribution */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Course Distribution
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Your learning progress
          </p>

          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={courseProgress}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {courseProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {courseProgress.map((item, i) => (
              <div key={i} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{item.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}