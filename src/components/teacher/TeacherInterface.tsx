'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search, Download, Mail,
  TrendingUp, Award, Clock, CheckCircle, XCircle,
  Calendar, Users, Settings, Edit, MapPin, Globe, Linkedin, 
  Twitter, Briefcase, GraduationCap, BookOpen, Activity, Trophy,
  User, Sun, Moon, Camera, Shield
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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

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
          // 👇 ONLY fetch users with role=TEACHER
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

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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

  if (loading || status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-indigo-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} font-semibold text-lg`}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Teachers', value: totalTeachers.toString(), icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Today', value: Math.floor(totalTeachers * 0.8).toString(), icon: Activity, color: 'from-green-500 to-emerald-500' },
    { label: 'This Month', value: Math.floor(totalTeachers * 0.15).toString(), icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
    { label: 'All Time', value: totalTeachers.toString(), icon: Trophy, color: 'from-yellow-500 to-orange-500' },
  ];

  // My Profile Content
  const MyProfileContent = () => (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border-2 p-8 shadow-xl`}>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-4xl">{getInitials(userProfile?.name || session?.user?.name || '')}</span>
              )}
            </div>
            <button
              onClick={() => setShowEditProfile(true)}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white hover:shadow-lg transition-all"
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <h2 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {userProfile?.name || session?.user?.name}
              </h2>
              <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold">
                Teacher
              </span>
            </div>
            
            {userProfile?.bio && (
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 max-w-2xl`}>
                {userProfile.bio}
              </p>
            )}

            <div className={`flex flex-wrap gap-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm justify-center md:justify-start`}>
              {userProfile?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span>{userProfile.email}</span>
                </div>
              )}
              {userProfile?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>{userProfile.location}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 justify-center md:justify-start">
              <button
                onClick={() => setShowEditProfile(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`px-6 py-2.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-xl font-semibold transition-all flex items-center gap-2`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      {(userProfile?.qualification || userProfile?.experience || userProfile?.subjects) && (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border-2 p-6 shadow-lg`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-6 flex items-center gap-2`}>
            <Briefcase className="w-6 h-6 text-indigo-600" />
            Professional Information
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {userProfile?.qualification && (
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Qualification</p>
                <p className={`${darkMode ? 'text-gray-200' : 'text-gray-900'} font-semibold`}>{userProfile.qualification}</p>
              </div>
            )}
            {userProfile?.experience && (
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Experience</p>
                <p className={`${darkMode ? 'text-gray-200' : 'text-gray-900'} font-semibold`}>{userProfile.experience}</p>
              </div>
            )}
            {userProfile?.subjects && (
              <div className="md:col-span-2">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Subjects</p>
                <p className={`${darkMode ? 'text-gray-200' : 'text-gray-900'} font-semibold`}>{userProfile.subjects}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border-2 p-6 shadow-lg`}>
        <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-6`}>Account Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Member Since</p>
            <p className={`${darkMode ? 'text-gray-200' : 'text-gray-900'} font-semibold`}>{formatDate(userProfile?.createdAt)}</p>
          </div>
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Last Updated</p>
            <p className={`${darkMode ? 'text-gray-200' : 'text-gray-900'} font-semibold`}>{formatDate(userProfile?.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-40 backdrop-blur-lg bg-opacity-95`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Teacher Dashboard
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>
                {activeTab === 'all-teachers' ? 'View all registered teachers' : 'Manage your profile'}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all-teachers')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'all-teachers'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
              }`}
            >
              <Users className="w-4 h-4" />
              All Teachers ({totalTeachers})
            </button>
            <button
              onClick={() => setActiveTab('my-profile')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'my-profile'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
              }`}
            >
              <User className="w-4 h-4" />
              My Profile
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'my-profile' ? (
          <MyProfileContent />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, idx) => (
                <div key={idx} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 border-2 hover:shadow-xl transition-all group`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-1`}>{stat.value}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Search Bar (NO FILTER DROPDOWN) */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-4 mb-6`}>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, location, or subjects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <button
                  onClick={() => {
                    // Export to CSV
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
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>

            {/* Teachers Grid */}
            <div className="space-y-4">
              {filteredTeachers.length === 0 ? (
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border-2 p-12 text-center`}>
                  <Users className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'} mb-2`}>No Teachers Found</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {searchQuery ? 'Try adjusting your search criteria' : 'No teachers have registered yet'}
                  </p>
                </div>
              ) : (
                filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border-2 p-6 hover:shadow-xl transition-all`}>
                    <div className="flex flex-col lg:flex-row items-start gap-6">
                      {/* Avatar */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        {teacher.avatar ? (
                          <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-2xl">{getInitials(teacher.name)}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{teacher.name}</h3>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                            TEACHER
                          </span>
                          {teacher.isActive && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>

                        {teacher.bio && (
                          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3 line-clamp-2`}>{teacher.bio}</p>
                        )}

                        <div className={`flex flex-wrap gap-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm mb-4`}>
                          {teacher.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-indigo-500" />
                              <span>{teacher.email}</span>
                            </div>
                          )}
                          {teacher.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-500" />
                              <span>{teacher.location}</span>
                            </div>
                          )}
                          {teacher.dateOfBirth && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span>Age: {calculateAge(teacher.dateOfBirth)}</span>
                            </div>
                          )}
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {teacher.qualification && (
                            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Qualification</p>
                              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'} truncate`}>{teacher.qualification}</p>
                            </div>
                          )}
                          {teacher.experience && (
                            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Experience</p>
                              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'} truncate`}>{teacher.experience}</p>
                            </div>
                          )}
                          {teacher.subjects && (
                            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 sm:col-span-2`}>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Subjects</p>
                              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'} truncate`}>{teacher.subjects}</p>
                            </div>
                          )}
                        </div>

                        {/* Social Links */}
                        {(teacher.website || teacher.linkedin || teacher.twitter || teacher.instagram) && (
                          <div className="flex gap-2 mt-4">
                            {teacher.website && (
                              <a href={teacher.website} target="_blank" rel="noopener noreferrer" className={`w-8 h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg flex items-center justify-center hover:scale-110 transition-all`}>
                                <Globe className="w-4 h-4" />
                              </a>
                            )}
                            {teacher.linkedin && (
                              <a href={teacher.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:scale-110 transition-all">
                                <Linkedin className="w-4 h-4" />
                              </a>
                            )}
                            {teacher.twitter && (
                              <a href={teacher.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-blue-100 text-blue-400 rounded-lg flex items-center justify-center hover:scale-110 transition-all">
                                <Twitter className="w-4 h-4" />
                              </a>
                            )}
                            {teacher.instagram && (
                              <a href={teacher.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center hover:scale-110 transition-all">
                                <Camera className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedTeacher(teacher)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold"
                        >
                          View Full Profile
                        </button>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} text-center`}>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between sticky top-0 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  {selectedTeacher.avatar ? (
                    <img src={selectedTeacher.avatar} alt={selectedTeacher.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-2xl">{getInitials(selectedTeacher.name)}</span>
                  )}
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{selectedTeacher.name}</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedTeacher.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition`}
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
                  <User className="w-5 h-5 text-indigo-600" />
                  Personal Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedTeacher.location && (
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Location</p>
                      <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{selectedTeacher.location}</p>
                    </div>
                  )}
                  {selectedTeacher.dateOfBirth && (
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date of Birth</p>
                      <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{formatDate(selectedTeacher.dateOfBirth)} (Age: {calculateAge(selectedTeacher.dateOfBirth)})</p>
                    </div>
                  )}
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Member Since</p>
                    <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{formatDate(selectedTeacher.createdAt)}</p>
                  </div>
                </div>
                {selectedTeacher.bio && (
                  <div className="mt-4">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Bio</p>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedTeacher.bio}</p>
                  </div>
                )}
              </div>

              {/* Professional Info */}
              {(selectedTeacher.qualification || selectedTeacher.experience || selectedTeacher.subjects || selectedTeacher.specialization) && (
                <div>
                  <h4 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    Professional Information
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedTeacher.qualification && (
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Qualification</p>
                        <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{selectedTeacher.qualification}</p>
                      </div>
                    )}
                    {selectedTeacher.experience && (
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Experience</p>
                        <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{selectedTeacher.experience}</p>
                      </div>
                    )}
                    {selectedTeacher.subjects && (
                      <div className="md:col-span-2">
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subjects</p>
                        <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{selectedTeacher.subjects}</p>
                      </div>
                    )}
                    {selectedTeacher.specialization && (
                      <div className="md:col-span-2">
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Specialization</p>
                        <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{selectedTeacher.specialization}</p>
                      </div>
                    )}
                  </div>
                  {selectedTeacher.teachingStyle && (
                    <div className="mt-4">
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Teaching Style</p>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedTeacher.teachingStyle}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Social Links */}
              {(selectedTeacher.website || selectedTeacher.linkedin || selectedTeacher.twitter || selectedTeacher.instagram) && (
                <div>
                  <h4 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
                    <Globe className="w-5 h-5 text-indigo-600" />
                    Social Profiles
                  </h4>
                  <div className="flex gap-3">
                    {selectedTeacher.website && (
                      <a href={selectedTeacher.website} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-all flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                    {selectedTeacher.linkedin && (
                      <a href={selectedTeacher.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all flex items-center gap-2">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                    {selectedTeacher.twitter && (
                      <a href={selectedTeacher.twitter} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-400 rounded-lg transition-all flex items-center gap-2">
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </a>
                    )}
                    {selectedTeacher.instagram && (
                      <a href={selectedTeacher.instagram} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-600 rounded-lg transition-all flex items-center gap-2">
                        <Camera className="w-4 h-4" />
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
          darkMode={darkMode}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          darkMode={darkMode}
          onDarkModeToggle={toggleDarkMode}
        />
      )}
    </div>
  );
}