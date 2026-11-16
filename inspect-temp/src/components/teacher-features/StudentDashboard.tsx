'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Download, Eye, Mail, Phone, MoreVertical,
  TrendingUp, TrendingDown, Award, Clock, CheckCircle, XCircle,
  BarChart3, PieChart, Calendar, Book, Target, Star, Users,
  Settings, Edit, MapPin, Globe, Linkedin, Twitter, Briefcase,
  GraduationCap, BookOpen, Activity, Zap, Trophy, Flame,
  ChevronRight, ArrowRight, Plus, Bell, MessageSquare, User,
  Sun, Moon, RefreshCw, FileText, Video, Share, Camera, Shield, Loader
} from 'lucide-react';

// Import modals
import EditProfileModal from '@/components/modals/EditProfileModal/Editprofilemodal';
import SettingsModal from '@/components/modals/SettingsModal/Settingsmodal';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
  dateOfBirth: string | null;
  qualification: string | null;
  experience: string | null;
  subjects: string | null;
  specialization: string | null;
  teachingStyle: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function StudentDashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [students,         setStudents]         = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [filterRole,       setFilterRole]       = useState('STUDENT');
  const [selectedStudent,  setSelectedStudent]  = useState<Student | null>(null);
  const [showEditProfile,  setShowEditProfile]  = useState(false);
  const [showSettings,     setShowSettings]     = useState(false);
  const [userProfile,      setUserProfile]      = useState<any>(null);
  const [loading,          setLoading]          = useState(true);
  const [activeTab,        setActiveTab]        = useState<'all-students' | 'my-profile'>('all-students');
  const [totalStudents,    setTotalStudents]    = useState(0);

  // ── Dark mode detection (same pattern throughout app) ──
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const dm = darkMode;

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', next.toString());
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch(`/api/user/profile/${session.user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUserProfile(data); })
        .catch(() => {});
    }
  }, [session, status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoading(true);
    fetch(`/api/user/students?role=${filterRole}`)
      .then(r => r.ok ? r.json() : { users: [], total: 0 })
      .then(data => {
        setStudents(data.users || []);
        setFilteredStudents(data.users || []);
        setTotalStudents(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, filterRole]);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredStudents(students); return; }
    const q = searchQuery.toLowerCase();
    setFilteredStudents(students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q) ||
      s.subjects?.toLowerCase().includes(q)
    ));
  }, [searchQuery, students]);

  const handleProfileUpdate = async (data: any) => { setUserProfile(data); await update(); };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const p = name.split(' ');
    return p.length >= 2 ? `${p[0][0]}${p[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const today = new Date(), birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const exportCSV = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Location', 'Role', 'Joined'],
      ...filteredStudents.map(s => [s.name || '', s.email || '', s.phone || '', s.location || '', s.role || '', formatDate(s.createdAt)])
    ].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `students-${new Date().toISOString()}.csv`;
    a.click();
  };

  // ── Loading ──
  if (loading || status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
        <div className="text-center px-4">
          <div className="relative mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20">
            <div className={`absolute inset-0 rounded-full border-4 ${dm ? 'border-indigo-900' : 'border-indigo-100'}`} />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
            </div>
          </div>
          <p className={`font-semibold text-base sm:text-lg ${dm ? 'text-gray-200' : 'text-gray-700'}`}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Students',  value: totalStudents.toString(),                       icon: Users,      color: 'from-blue-500 to-cyan-500'    },
    { label: 'Active Today',    value: Math.floor(totalStudents * 0.8).toString(),      icon: Activity,   color: 'from-green-500 to-emerald-500' },
    { label: 'This Month',      value: Math.floor(totalStudents * 0.15).toString(),     icon: TrendingUp, color: 'from-purple-500 to-pink-500'   },
    { label: 'All Time',        value: totalStudents.toString(),                        icon: Trophy,     color: 'from-yellow-500 to-orange-500' },
  ];

  // ── Shared info row item ──
  const InfoItem = ({ icon: Icon, iconColor, text }: { icon: any; iconColor: string; text: string }) => (
    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${iconColor}`} />
      <span className="truncate text-xs sm:text-sm">{text}</span>
    </div>
  );

  // ── My Profile Tab ──
  const MyProfileContent = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Header Card */}
      <div className={`rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 lg:p-8 shadow-xl ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl">
              {userProfile?.avatar
                ? <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-3xl sm:text-4xl">{getInitials(userProfile?.name || session?.user?.name || '')}</span>}
            </div>
            <button onClick={() => setShowEditProfile(true)}
              className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white hover:shadow-lg transition-all">
              <Edit className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center sm:justify-start mb-2">
              <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                {userProfile?.name || session?.user?.name}
              </h2>
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs sm:text-sm font-bold">
                {session?.user?.role === 'TEACHER' ? 'Teacher' : 'Student'}
              </span>
            </div>

            {userProfile?.bio && (
              <p className={`text-xs sm:text-sm mb-3 sm:mb-4 max-w-2xl ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{userProfile.bio}</p>
            )}

            <div className={`flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm justify-center sm:justify-start mb-4 sm:mb-6 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
              {userProfile?.email    && <InfoItem icon={Mail}   iconColor="text-indigo-500" text={userProfile.email}    />}
              {userProfile?.phone    && <InfoItem icon={Phone}  iconColor="text-green-500"  text={userProfile.phone}    />}
              {userProfile?.location && <InfoItem icon={MapPin} iconColor="text-red-500"    text={userProfile.location} />}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
              <button onClick={() => setShowEditProfile(true)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 text-sm sm:text-base">
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Edit Profile
              </button>
              <button onClick={() => setShowSettings(true)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm sm:text-base ${dm ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Info */}
      {(userProfile?.qualification || userProfile?.experience || userProfile?.subjects) && (
        <div className={`rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 shadow-lg ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-base sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
            <Briefcase className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />Professional Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {userProfile?.qualification && (
              <div>
                <p className={`text-xs sm:text-sm mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Qualification</p>
                <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{userProfile.qualification}</p>
              </div>
            )}
            {userProfile?.experience && (
              <div>
                <p className={`text-xs sm:text-sm mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Experience</p>
                <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{userProfile.experience}</p>
              </div>
            )}
            {userProfile?.subjects && (
              <div className="sm:col-span-2">
                <p className={`text-xs sm:text-sm mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Subjects</p>
                <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{userProfile.subjects}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className={`rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 shadow-lg ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-base sm:text-xl font-bold mb-4 sm:mb-6 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className={`text-xs sm:text-sm mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Member Since</p>
            <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{formatDate(userProfile?.createdAt)}</p>
          </div>
          <div>
            <p className={`text-xs sm:text-sm mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Last Updated</p>
            <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{formatDate(userProfile?.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>

      {/* ── Sticky Header ── */}
      <div className={`sticky top-0 z-40 border-b-2 backdrop-blur-lg ${dm ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className={`text-lg sm:text-2xl lg:text-3xl font-bold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                Student Dashboard
              </h1>
              <p className={`text-xs sm:text-sm mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeTab === 'all-students' ? 'View all registered students' : 'Manage your profile'}
              </p>
            </div>

            {/* Dark mode toggle in header */}
            <button onClick={toggleDarkMode}
              className={`p-2 rounded-xl hover:scale-110 transition-all flex-shrink-0 ${dm ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {dm ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4 overflow-x-auto pb-0.5">
            {[
              { key: 'all-students', icon: Users, label: `All Students (${totalStudents})` },
              { key: 'my-profile',   icon: User,  label: 'My Profile'                      },
            ].map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === key
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {activeTab === 'my-profile' ? (
          <MyProfileContent />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-5 sm:mb-8">
              {stats.map((stat, idx) => (
                <div key={idx} className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 lg:p-6 border-2 hover:shadow-xl transition-all group ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="mb-2 sm:mb-4">
                    <div className={`w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{stat.value}</p>
                  <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 mb-4 sm:mb-6 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, location or subjects..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-xs sm:text-sm ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                  />
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-semibold text-xs sm:text-sm ${dm ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  >
                    <option value="STUDENT">Students Only</option>
                    <option value="TEACHER">Teachers Only</option>
                    <option value="all">All Users</option>
                  </select>
                  <button onClick={exportCSV}
                    className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
                    <Download className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline">Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results count */}
            {filteredStudents.length > 0 && (
              <p className={`text-xs mb-3 sm:mb-4 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
                Showing <span className={`font-semibold ${dm ? 'text-gray-300' : 'text-gray-600'}`}>{filteredStudents.length}</span> {filterRole === 'TEACHER' ? 'teacher' : 'student'}{filteredStudents.length !== 1 ? 's' : ''}
              </p>
            )}

            {/* Students List */}
            <div className="space-y-3 sm:space-y-4">
              {filteredStudents.length === 0 ? (
                <div className={`rounded-xl sm:rounded-2xl border-2 p-8 sm:p-12 text-center ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <Users className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className={`text-lg sm:text-xl font-bold mb-2 ${dm ? 'text-gray-200' : 'text-gray-900'}`}>No Students Found</h3>
                  <p className={`text-sm sm:text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                    {searchQuery ? 'Try adjusting your search criteria' : 'No students have registered yet'}
                  </p>
                </div>
              ) : (
                filteredStudents.map(student => (
                  <div key={student.id}
                    className={`rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 lg:p-6 hover:shadow-xl transition-all ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 lg:gap-6">

                      {/* Avatar */}
                      <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                          {student.avatar
                            ? <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                            : <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl">{getInitials(student.name)}</span>}
                        </div>

                        {/* Name + badges — visible on mobile next to avatar */}
                        <div className="flex-1 sm:hidden min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <h3 className={`text-sm font-bold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{student.name}</h3>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${student.role === 'TEACHER' ? dm ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700' : dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                              {student.role}
                            </span>
                            {student.isActive && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 ${dm ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                <CheckCircle className="w-2.5 h-2.5" />Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 w-full">
                        {/* Name row — hidden on mobile (shown inline above) */}
                        <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <h3 className={`text-base sm:text-lg lg:text-xl font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{student.name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${student.role === 'TEACHER' ? dm ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700' : dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                            {student.role}
                          </span>
                          {student.isActive && (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${dm ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                              <CheckCircle className="w-3 h-3" />Active
                            </span>
                          )}
                        </div>

                        {student.bio && (
                          <p className={`text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{student.bio}</p>
                        )}

                        {/* Contact info */}
                        <div className={`flex flex-wrap gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2 text-xs sm:text-sm mb-3 sm:mb-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                          {student.email    && <InfoItem icon={Mail}     iconColor="text-indigo-500" text={student.email}    />}
                          {student.phone    && <InfoItem icon={Phone}    iconColor="text-green-500"  text={student.phone}    />}
                          {student.location && <InfoItem icon={MapPin}   iconColor="text-red-500"    text={student.location} />}
                          {student.dateOfBirth && <InfoItem icon={Calendar} iconColor="text-blue-500"   text={`Age: ${calculateAge(student.dateOfBirth)}`} />}
                        </div>

                        {/* Extra info cards */}
                        {(student.qualification || student.experience || student.subjects) && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 sm:mb-4">
                            {student.qualification && (
                              <div className={`rounded-lg p-2 sm:p-3 ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-[10px] sm:text-xs mb-0.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Qualification</p>
                                <p className={`text-xs sm:text-sm font-semibold truncate ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{student.qualification}</p>
                              </div>
                            )}
                            {student.experience && (
                              <div className={`rounded-lg p-2 sm:p-3 ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-[10px] sm:text-xs mb-0.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Experience</p>
                                <p className={`text-xs sm:text-sm font-semibold truncate ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{student.experience}</p>
                              </div>
                            )}
                            {student.subjects && (
                              <div className={`rounded-lg p-2 sm:p-3 col-span-2 ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-[10px] sm:text-xs mb-0.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Subjects</p>
                                <p className={`text-xs sm:text-sm font-semibold truncate ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{student.subjects}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Social links */}
                        {(student.website || student.linkedin || student.twitter || student.instagram) && (
                          <div className="flex gap-2">
                            {student.website  && <a href={student.website}  target="_blank" rel="noopener noreferrer" className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-all ${dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}><Globe    className="w-3.5 h-3.5" /></a>}
                            {student.linkedin  && <a href={student.linkedin}  target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:scale-110 transition-all"><Linkedin className="w-3.5 h-3.5" /></a>}
                            {student.twitter   && <a href={student.twitter}   target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 text-blue-400 rounded-lg flex items-center justify-center hover:scale-110 transition-all"><Twitter  className="w-3.5 h-3.5" /></a>}
                            {student.instagram && <a href={student.instagram} target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center hover:scale-110 transition-all"><Camera   className="w-3.5 h-3.5" /></a>}
                          </div>
                        )}
                      </div>

                      {/* Action button */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0 border-t-2 sm:border-0 border-gray-100 dark:border-gray-700 sm:border-transparent">
                        <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
                          Joined {formatDate(student.createdAt)}
                        </p>
                        <button onClick={() => setSelectedStudent(student)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-semibold whitespace-nowrap">
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Student Detail Modal ── */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col ${dm ? 'bg-gray-800' : 'bg-white'}`}>

            {/* Modal Header */}
            <div className={`p-4 sm:p-6 border-b-2 flex items-center justify-between flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  {selectedStudent.avatar
                    ? <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-lg sm:text-2xl">{getInitials(selectedStudent.name)}</span>}
                </div>
                <div className="min-w-0">
                  <h3 className={`text-lg sm:text-2xl font-bold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{selectedStudent.name}</h3>
                  <p className={`text-xs sm:text-sm truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{selectedStudent.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)}
                className={`p-2 rounded-xl transition flex-shrink-0 ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5 sm:space-y-6">

              {/* Personal Info */}
              <div>
                <h4 className={`font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {selectedStudent.phone && (
                    <div>
                      <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Phone</p>
                      <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{selectedStudent.phone}</p>
                    </div>
                  )}
                  {selectedStudent.location && (
                    <div>
                      <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Location</p>
                      <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{selectedStudent.location}</p>
                    </div>
                  )}
                  {selectedStudent.dateOfBirth && (
                    <div>
                      <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Date of Birth</p>
                      <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{formatDate(selectedStudent.dateOfBirth)} (Age: {calculateAge(selectedStudent.dateOfBirth)})</p>
                    </div>
                  )}
                  <div>
                    <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Member Since</p>
                    <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{formatDate(selectedStudent.createdAt)}</p>
                  </div>
                </div>
                {selectedStudent.bio && (
                  <div className="mt-3 sm:mt-4">
                    <p className={`text-xs sm:text-sm mb-1 sm:mb-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Bio</p>
                    <p className={`text-xs sm:text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{selectedStudent.bio}</p>
                  </div>
                )}
              </div>

              {/* Professional Info */}
              {(selectedStudent.qualification || selectedStudent.experience || selectedStudent.subjects || selectedStudent.specialization) && (
                <div>
                  <h4 className={`font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />Professional Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {selectedStudent.qualification && (
                      <div>
                        <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Qualification</p>
                        <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{selectedStudent.qualification}</p>
                      </div>
                    )}
                    {selectedStudent.experience && (
                      <div>
                        <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Experience</p>
                        <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{selectedStudent.experience}</p>
                      </div>
                    )}
                    {selectedStudent.subjects && (
                      <div className="sm:col-span-2">
                        <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Subjects</p>
                        <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{selectedStudent.subjects}</p>
                      </div>
                    )}
                    {selectedStudent.specialization && (
                      <div className="sm:col-span-2">
                        <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Specialization</p>
                        <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{selectedStudent.specialization}</p>
                      </div>
                    )}
                  </div>
                  {selectedStudent.teachingStyle && (
                    <div className="mt-3 sm:mt-4">
                      <p className={`text-xs sm:text-sm mb-1 sm:mb-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Teaching Style</p>
                      <p className={`text-xs sm:text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{selectedStudent.teachingStyle}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Social Links */}
              {(selectedStudent.website || selectedStudent.linkedin || selectedStudent.twitter || selectedStudent.instagram) && (
                <div>
                  <h4 className={`font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />Social Profiles
                  </h4>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {selectedStudent.website && (
                      <a href={selectedStudent.website} target="_blank" rel="noopener noreferrer"
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium ${dm ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                        <Globe className="w-3.5 h-3.5" />Website
                      </a>
                    )}
                    {selectedStudent.linkedin && (
                      <a href={selectedStudent.linkedin} target="_blank" rel="noopener noreferrer"
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
                        <Linkedin className="w-3.5 h-3.5" />LinkedIn
                      </a>
                    )}
                    {selectedStudent.twitter && (
                      <a href={selectedStudent.twitter} target="_blank" rel="noopener noreferrer"
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 hover:bg-blue-200 text-blue-400 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
                        <Twitter className="w-3.5 h-3.5" />Twitter
                      </a>
                    )}
                    {selectedStudent.instagram && (
                      <a href={selectedStudent.instagram} target="_blank" rel="noopener noreferrer"
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-pink-100 hover:bg-pink-200 text-pink-600 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
                        <Camera className="w-3.5 h-3.5" />Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showEditProfile && <EditProfileModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} userProfile={userProfile} onUpdate={handleProfileUpdate} darkMode={dm} />}
      {showSettings    && <SettingsModal    isOpen={showSettings}    onClose={() => setShowSettings(false)}    darkMode={dm} onDarkModeToggle={toggleDarkMode} />}
    </div>
  );
}