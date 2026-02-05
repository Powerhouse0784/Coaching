'use client';
import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, Settings, BarChart3, TrendingUp, 
  DollarSign, AlertCircle, CheckCircle, Clock, Search, Filter, 
  MoreVertical, Eye, Edit, Trash2, UserPlus, Download, Bell,
  Video, Target, Award, Activity, Zap, Shield, Database
} from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Total Students', value: '12,847', change: '+12.5%', trend: 'up', icon: Users, color: 'blue' },
    { label: 'Active Courses', value: '156', change: '+8', trend: 'up', icon: BookOpen, color: 'purple' },
    { label: 'Revenue (MTD)', value: '₹45.2L', change: '+23.4%', trend: 'up', icon: DollarSign, color: 'green' },
    { label: 'Avg. Success Rate', value: '94.8%', change: '+2.1%', trend: 'up', icon: Award, color: 'orange' }
  ];

  const recentUsers = [
    { id: 1, name: 'Rahul Sharma', email: 'rahul@email.com', batch: 'JEE 2026', joined: '2 days ago', status: 'active', courses: 3 },
    { id: 2, name: 'Priya Patel', email: 'priya@email.com', batch: 'NEET 2026', joined: '5 days ago', status: 'active', courses: 5 },
    { id: 3, name: 'Amit Kumar', email: 'amit@email.com', batch: 'JEE Advanced', joined: '1 week ago', status: 'inactive', courses: 2 },
    { id: 4, name: 'Sneha Gupta', email: 'sneha@email.com', batch: 'NEET 2025', joined: '3 days ago', status: 'active', courses: 4 },
    { id: 5, name: 'Arjun Singh', email: 'arjun@email.com', batch: 'JEE Mains', joined: '4 days ago', status: 'active', courses: 3 }
  ];

  const courseStats = [
    { course: 'Physics - Complete', students: 2847, revenue: '₹14.2L', rating: 4.8, completion: 78 },
    { course: 'Mathematics - Advanced', students: 3124, revenue: '₹18.6L', rating: 4.9, completion: 82 },
    { course: 'Chemistry - Organic', students: 2156, revenue: '₹10.8L', rating: 4.7, completion: 75 },
    { course: 'Biology - NEET', students: 1945, revenue: '₹9.7L', rating: 4.9, completion: 85 }
  ];

  const recentActivity = [
    { type: 'enrollment', user: 'Rahul S.', action: 'enrolled in Physics Complete', time: '5 min ago', icon: UserPlus },
    { type: 'payment', user: 'Priya P.', action: 'completed payment of ₹9,999', time: '12 min ago', icon: DollarSign },
    { type: 'completion', user: 'Amit K.', action: 'completed Calculus module', time: '28 min ago', icon: CheckCircle },
    { type: 'live', user: 'Dr. Sharma', action: 'started live class (124 students)', time: '1 hour ago', icon: Video },
    { type: 'test', user: 'Sneha G.', action: 'scored 95% in Mock Test #12', time: '2 hours ago', icon: Target }
  ];

  const systemHealth = [
    { service: 'API Server', status: 'operational', uptime: '99.98%', latency: '45ms', color: 'green' },
    { service: 'Database', status: 'operational', uptime: '99.95%', latency: '12ms', color: 'green' },
    { service: 'Video CDN', status: 'degraded', uptime: '98.2%', latency: '180ms', color: 'yellow' },
    { service: 'Payment Gateway', status: 'operational', uptime: '99.99%', latency: '230ms', color: 'green' },
    { service: 'AI Services', status: 'operational', uptime: '99.5%', latency: '89ms', color: 'green' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-indigo-900 to-purple-900 text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Admin Panel</h2>
              <p className="text-xs text-purple-300">EduElite Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'courses', label: 'Course Analytics', icon: BookOpen },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
            { id: 'system', label: 'System Health', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-white/20 backdrop-blur-lg shadow-lg'
                  : 'hover:bg-white/10'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
              SA
            </div>
            <div>
              <p className="font-semibold text-sm">Super Admin</p>
              <p className="text-xs text-purple-300">admin@eduelite.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {activeTab === 'overview' && 'Platform Overview'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'courses' && 'Course Analytics'}
                {activeTab === 'revenue' && 'Revenue Dashboard'}
                {activeTab === 'system' && 'System Health'}
              </h1>
              <p className="text-gray-600 mt-1">Monitor and manage your platform</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-all relative">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 rounded-xl flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                        <TrendingUp className="w-4 h-4" />
                        {stat.change}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Revenue Trend</h3>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Last 90 days</option>
                    </select>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {[65, 78, 82, 91, 88, 95, 100].map((height, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t-lg hover:opacity-80 transition-all" style={{ height: `${height}%` }} />
                        <span className="text-xs text-gray-500">Day {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enrollment Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Student Enrollments</h3>
                    <span className="text-sm text-gray-600">This month: +1,234</span>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {[45, 52, 60, 58, 70, 85, 92].map((height, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gradient-to-t from-green-500 to-teal-500 rounded-t-lg hover:opacity-80 transition-all" style={{ height: `${height}%` }} />
                        <span className="text-xs text-gray-500">Week {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'enrollment' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'payment' ? 'bg-green-100 text-green-600' :
                        activity.type === 'completion' ? 'bg-purple-100 text-purple-600' :
                        activity.type === 'live' ? 'bg-red-100 text-red-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        <activity.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium"><strong>{activity.user}</strong> {activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-80"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">
                    <Filter className="w-5 h-5" />
                    Filters
                  </button>
                </div>
                <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Add User
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Batch</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Courses</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700">
                            {user.batch}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-semibold">{user.courses}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.status === 'active' ? <CheckCircle className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.joined}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                              <Eye className="w-5 h-5 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                              <Edit className="w-5 h-5 text-gray-600" />
                            </button>
                            <button className="p-2 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="grid gap-6">
              {courseStats.map((course, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{course.course}</h3>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {course.students.toLocaleString()} students
                        </span>
                        <span className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          {course.revenue}
                        </span>
                        <span className="flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          {course.rating} ★
                        </span>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold text-gray-900">{course.completion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all"
                      style={{ width: `${course.completion}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* System Health Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              {systemHealth.map((service, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        service.status === 'operational' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                      }`} />
                      <h3 className="text-xl font-bold text-gray-900">{service.service}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        service.status === 'operational' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {service.status}
                      </span>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">{service.uptime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Latency</p>
                      <p className="text-2xl font-bold text-gray-900">{service.latency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Last Check</p>
                      <p className="text-sm font-semibold text-gray-900">2 minutes ago</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;