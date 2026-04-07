'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search, Download, Mail,
  TrendingUp, Award, Clock, CheckCircle, XCircle,
  Calendar, Users, Settings, Edit, MapPin, Globe, Linkedin, 
  Twitter, Briefcase, GraduationCap, BookOpen, Activity, Trophy,
  User, Sun, Moon, Camera, Shield, RefreshCw, Filter
} from 'lucide-react';

// Import modals
import EditProfileModal from '@/components/modals/EditProfileModal/Editprofilemodal';
import SettingsModal from '@/components/modals/SettingsModal/Settingsmodal';

interface Teacher {
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

export default function TeacherDashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all-teachers' | 'my-profile'>('all-teachers');
  const [totalTeachers, setTotalTeachers] = useState(0);

  // Dark mode detection - same as AssignmentCard
  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/user/profile/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setUserProfile(data);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [session, status]);

  // Fetch all teachers (ONLY TEACHERS)
  useEffect(() => {
    const fetchTeachers = async () => {
      if (status === 'authenticated') {
        try {
          const response = await fetch(`/api/user/students?role=TEACHER`);
          if (response.ok) {
            const data = await response.json();
            setTeachers(data.users || []);
            setFilteredTeachers(data.users || []);
            setTotalTeachers(data.total || 0);
          }
        } catch (error) {
          console.error('Error fetching teachers:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTeachers();
  }, [status]);

  // Filter teachers based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTeachers(teachers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = teachers.filter(teacher => 
        teacher.name?.toLowerCase().includes(query) ||
        teacher.email?.toLowerCase().includes(query) ||
        teacher.location?.toLowerCase().includes(query) ||
        teacher.subjects?.toLowerCase().includes(query)
      );
      setFilteredTeachers(filtered);
    }
  }, [searchQuery, teachers]);

  const handleProfileUpdate = async (updatedData: any) => {
    setUserProfile(updatedData);
    await update();
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const exportToCSV = () => {
    const csv = [
      ['Name', 'Email', 'Location', 'Subjects', 'Experience', 'Joined'],
      ...filteredTeachers.map(t => [
        t.name || '',
        t.email || '',
        t.location || '',
        t.subjects || '',
        t.experience || '',
        formatDate(t.createdAt)
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers-${new Date().toISOString()}.csv`;
    a.click();
  };

  const dm = darkMode;

  if (loading || status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
        <div className="text-center">
          <div className="relative">
            <div className={`animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-b-4 mx-auto mb-4 ${dm ? 'border-indigo-500' : 'border-indigo-600'}`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className={`w-6 h-6 sm:w-8 sm:h-8 ${dm ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
          </div>
          <p className={`font-semibold text-base sm:text-lg ${dm ? 'text-gray-200' : 'text-gray-700'}`}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Teachers', value: totalTeachers.toString(), icon: Users, color: dm ? 'from-blue-600 to-cyan-600' : 'from-blue-500 to-cyan-500' },
    { label: 'Active Today', value: Math.floor(totalTeachers * 0.8).toString(), icon: Activity, color: dm ? 'from-green-600 to-emerald-600' : 'from-green-500 to-emerald-500' },
    { label: 'This Month', value: Math.floor(totalTeachers * 0.15).toString(), icon: TrendingUp, color: dm ? 'from-purple-600 to-pink-600' : 'from-purple-500 to-pink-500' },
    { label: 'All Time', value: totalTeachers.toString(), icon: Trophy, color: dm ? 'from-yellow-600 to-orange-600' : 'from-yellow-500 to-orange-500' },
  ];

  // My Profile Content
  const MyProfileContent = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Header Card */}
      <div className={`rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 md:p-8 shadow-xl transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-3xl sm:text-4xl">{getInitials(userProfile?.name || session?.user?.name || '')}</span>
              )}
            </div>
            <button
              onClick={() => setShowEditProfile(true)}
              className="absolute -bottom-2 -right-2 w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white hover:shadow-lg transition-all"
            >
              <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 justify-center md:justify-start mb-2">
              <h2 className={`text-2xl sm:text-3xl font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                {userProfile?.name || session?.user?.name}
              </h2>
              <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs sm:text-sm font-bold">
                Teacher
              </span>
            </div>
            
            {userProfile?.bio && (
              <p className={`mb-3 sm:mb-4 max-w-2xl text-sm sm:text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                {userProfile.bio}
              </p>
            )}

            <div className={`flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm justify-center md:justify-start ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
              {userProfile?.email && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                  <span className="truncate max-w-[200px]">{userProfile.email}</span>
                </div>
              )}
              {userProfile?.location && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                  <span>{userProfile.location}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 justify-center md:justify-start">
              <button
                onClick={() => setShowEditProfile(true)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Edit Profile
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                  dm ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      {(userProfile?.qualification || userProfile?.experience || userProfile?.subjects) && (
        <div className={`rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 shadow-lg transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center gap-2 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" />
            Professional Information
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
      <div className={`rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 shadow-lg transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Account Information</h3>
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
      {/* Header */}
      <div className={`border-b sticky top-0 z-40 backdrop-blur-lg bg-opacity-95 transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                Teacher Dashboard
              </h1>
              <p className={`text-xs sm:text-sm mt-1 truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeTab === 'all-teachers' ? 'View all registered teachers' : 'Manage your profile'}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('all-teachers')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === 'all-teachers'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">All Teachers ({totalTeachers})</span>
              <span className="xs:hidden">All ({totalTeachers})</span>
            </button>
            <button
              onClick={() => setActiveTab('my-profile')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === 'my-profile'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              My Profile
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {activeTab === 'my-profile' ? (
          <MyProfileContent />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              {stats.map((stat, idx) => (
                <div key={idx} className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 hover:shadow-xl transition-all group ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                  </div>
                  <p className={`text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{stat.value}</p>
                  <p className={`text-[10px] xs:text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Search Bar */}
            <div className={`rounded-xl border p-3 sm:p-4 mb-4 sm:mb-6 transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, location, or subjects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm sm:text-base transition-colors ${
                      dm ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <button
                  onClick={exportToCSV}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Export</span>
                </button>
              </div>
            </div>

            {/* Teachers Grid */}
            <div className="space-y-3 sm:space-y-4">
              {filteredTeachers.length === 0 ? (
                <div className={`rounded-xl sm:rounded-2xl border-2 p-8 sm:p-12 text-center transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <Users className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className={`text-lg sm:text-xl font-bold mb-2 ${dm ? 'text-gray-200' : 'text-gray-900'}`}>No Teachers Found</h3>
                  <p className={`text-sm sm:text-base ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                    {searchQuery ? 'Try adjusting your search criteria' : 'No teachers have registered yet'}
                  </p>
                </div>
              ) : (
                filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className={`rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 hover:shadow-xl transition-all ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6">
                      {/* Avatar */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        {teacher.avatar ? (
                          <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-xl sm:text-2xl">{getInitials(teacher.name)}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                          <h3 className={`text-lg sm:text-xl font-bold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{teacher.name}</h3>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${dm ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                            TEACHER
                          </span>
                          {teacher.isActive && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 flex-shrink-0 ${dm ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>

                        {teacher.bio && (
                          <p className={`mb-2 sm:mb-3 text-sm sm:text-base line-clamp-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{teacher.bio}</p>
                        )}

                        <div className={`flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm mb-3 sm:mb-4 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                          {teacher.email && (
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{teacher.email}</span>
                            </div>
                          )}
                          {teacher.location && (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                              <span>{teacher.location}</span>
                            </div>
                          )}
                          {teacher.dateOfBirth && (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                              <span>Age: {calculateAge(teacher.dateOfBirth)}</span>
                            </div>
                          )}
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                          {teacher.qualification && (
                            <div className={`rounded-lg p-2.5 sm:p-3 ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <p className={`text-[10px] sm:text-xs mb-0.5 sm:mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Qualification</p>
                              <p className={`text-xs sm:text-sm font-semibold truncate ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{teacher.qualification}</p>
                            </div>
                          )}
                          {teacher.experience && (
                            <div className={`rounded-lg p-2.5 sm:p-3 ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <p className={`text-[10px] sm:text-xs mb-0.5 sm:mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Experience</p>
                              <p className={`text-xs sm:text-sm font-semibold truncate ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{teacher.experience}</p>
                            </div>
                          )}
                          {teacher.subjects && (
                            <div className={`rounded-lg p-2.5 sm:p-3 xs:col-span-2 ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <p className={`text-[10px] sm:text-xs mb-0.5 sm:mb-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Subjects</p>
                              <p className={`text-xs sm:text-sm font-semibold truncate ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{teacher.subjects}</p>
                            </div>
                          )}
                        </div>

                        {/* Social Links */}
                        {(teacher.website || teacher.linkedin || teacher.twitter || teacher.instagram) && (
                          <div className="flex gap-2 mt-3 sm:mt-4">
                            {teacher.website && (
                              <a href={teacher.website} target="_blank" rel="noopener noreferrer" className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-all ${dm ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </a>
                            )}
                            {teacher.linkedin && (
                              <a href={teacher.linkedin} target="_blank" rel="noopener noreferrer" className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-all ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                                <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </a>
                            )}
                            {teacher.twitter && (
                              <a href={teacher.twitter} target="_blank" rel="noopener noreferrer" className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-all ${dm ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-400'}`}>
                                <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </a>
                            )}
                            {teacher.instagram && (
                              <a href={teacher.instagram} target="_blank" rel="noopener noreferrer" className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:scale-110 transition-all ${dm ? 'bg-pink-900 text-pink-300' : 'bg-pink-100 text-pink-600'}`}>
                                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 w-full lg:w-auto flex-shrink-0">
                        <button
                          onClick={() => setSelectedTeacher(teacher)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-semibold whitespace-nowrap"
                        >
                          View Full Profile
                        </button>
                        <p className={`text-[10px] sm:text-xs text-center ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
                          Joined {formatDate(teacher.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Teacher Detail Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className={`rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transition-colors ${dm ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-4 sm:p-6 border-b flex items-center justify-between sticky top-0 z-10 ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  {selectedTeacher.avatar ? (
                    <img src={selectedTeacher.avatar} alt={selectedTeacher.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg sm:text-2xl">{getInitials(selectedTeacher.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className={`text-lg sm:text-2xl font-bold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{selectedTeacher.name}</h3>
                  <p className={`text-sm sm:text-base truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{selectedTeacher.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className={`p-2 rounded-lg transition flex-shrink-0 ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className={`font-bold mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {selectedTeacher.location && (
                    <div>
                      <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Location</p>
                      <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{selectedTeacher.location}</p>
                    </div>
                  )}
                  {selectedTeacher.dateOfBirth && (
                    <div>
                      <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Date of Birth</p>
                      <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{formatDate(selectedTeacher.dateOfBirth)} (Age: {calculateAge(selectedTeacher.dateOfBirth)})</p>
                    </div>
                  )}
                  <div>
                    <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Member Since</p>
                    <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{formatDate(selectedTeacher.createdAt)}</p>
                  </div>
                </div>
                {selectedTeacher.bio && (
                  <div className="mt-3 sm:mt-4">
                    <p className={`text-xs sm:text-sm mb-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Bio</p>
                    <p className={`text-sm sm:text-base ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{selectedTeacher.bio}</p>
                  </div>
                )}
              </div>

              {/* Professional Info */}
              {(selectedTeacher.qualification || selectedTeacher.experience || selectedTeacher.subjects || selectedTeacher.specialization) && (
                <div>
                  <h4 className={`font-bold mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    Professional Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {selectedTeacher.qualification && (
                      <div>
                        <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Qualification</p>
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{selectedTeacher.qualification}</p>
                      </div>
                    )}
                    {selectedTeacher.experience && (
                      <div>
                        <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Experience</p>
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{selectedTeacher.experience}</p>
                      </div>
                    )}
                    {selectedTeacher.subjects && (
                      <div className="sm:col-span-2">
                        <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Subjects</p>
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{selectedTeacher.subjects}</p>
                      </div>
                    )}
                    {selectedTeacher.specialization && (
                      <div className="sm:col-span-2">
                        <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Specialization</p>
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{selectedTeacher.specialization}</p>
                      </div>
                    )}
                  </div>
                  {selectedTeacher.teachingStyle && (
                    <div className="mt-3 sm:mt-4">
                      <p className={`text-xs sm:text-sm mb-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Teaching Style</p>
                      <p className={`text-sm sm:text-base ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{selectedTeacher.teachingStyle}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Social Links */}
              {(selectedTeacher.website || selectedTeacher.linkedin || selectedTeacher.twitter || selectedTeacher.instagram) && (
                <div>
                  <h4 className={`font-bold mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    Social Profiles
                  </h4>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {selectedTeacher.website && (
                      <a href={selectedTeacher.website} target="_blank" rel="noopener noreferrer" className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold ${dm ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Website
                      </a>
                    )}
                    {selectedTeacher.linkedin && (
                      <a href={selectedTeacher.linkedin} target="_blank" rel="noopener noreferrer" className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold ${dm ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}>
                        <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        LinkedIn
                      </a>
                    )}
                    {selectedTeacher.twitter && (
                      <a href={selectedTeacher.twitter} target="_blank" rel="noopener noreferrer" className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold ${dm ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' : 'bg-blue-100 hover:bg-blue-200 text-blue-400'}`}>
                        <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Twitter
                      </a>
                    )}
                    {selectedTeacher.instagram && (
                      <a href={selectedTeacher.instagram} target="_blank" rel="noopener noreferrer" className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold ${dm ? 'bg-pink-900 hover:bg-pink-800 text-pink-200' : 'bg-pink-100 hover:bg-pink-200 text-pink-600'}`}>
                        <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditProfile && (
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          userProfile={userProfile}
          onUpdate={handleProfileUpdate}
          darkMode={dm}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          darkMode={dm}
          onDarkModeToggle={() => {}} // Not used anymore since we detect dark mode from DOM
        />
      )}
    </div>
  );
}