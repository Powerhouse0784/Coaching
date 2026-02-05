'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Video, FileText, Users, Target, Play, MessageSquare,
  BarChart3, Calendar, BookOpen, Settings, Bell, Search,
  Home, LogOut, User as UserIcon, Menu, X, TrendingUp,
  Clock, DollarSign, Star, CheckCircle, Upload, Plus,
  ChevronRight, Zap, GraduationCap, Sparkles, Activity,
  Award, Shield, ArrowLeft, Rocket, BookMarked, 
  TrendingDown, Eye, BookCheck, Flame, ArrowRight, Trophy,
  Moon, Sun, Edit, Camera, Save, Mail, Phone, MapPin,
  Briefcase, Link as LinkIcon, Calendar as CalendarIcon,
  Github, Linkedin, Twitter, Globe
} from 'lucide-react';

// Import feature components
import LiveClassManager from '@/components/teacher-features/LiveClassManager';
import AssignmentManager from '@/components/teacher-features/AssignmentManager';
import StudentDashboard from '@/components/teacher-features/StudentDashboard';
import TestManager from '@/components/teacher-features/TestManager';
import VideoLibraryManager from '@/components/teacher-features/VideoLibraryManager';
import DoubtManager from '@/components/teacher-features/DoubtManager';
import AnalyticsDashboard from '@/components/teacher-features/AnalyticsDashboard';
import ScheduleManager from '@/components/teacher-features/ScheduleManager';
import CourseManager from '@/components/teacher-features/CourseManager';

// Import custom components
import EditProfileModal from '../../components/modals/EditProfileModal/Editprofilemodal';
import SettingsModal from '@/components/modals//SettingsModal/Settingsmodal';

export default function TeacherDashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (session?.user?.role !== 'TEACHER') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        } finally {
          setLoading(false);
        }
      }
    };

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [session, status]);

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

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const switchToStudentView = () => {
    router.push('/student');
  };

  const openFeature = (featureId: string) => {
    setCurrentScreen(featureId);
  };

  const goHome = () => {
    setCurrentScreen('home');
  };

  const handleProfileUpdate = async (updatedData: any) => {
    setUserProfile(updatedData);
    // Update session if needed
    await update();
  };

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50'}`}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} font-semibold text-lg`}>Loading Teacher Portal...</p>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-2`}>Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  const platformFeatures = [
    {
      id: 'go-live',
      icon: Video,
      title: 'Live Classes',
      description: 'Start HD video sessions with screen sharing and interactive tools',
      color: 'from-red-500 to-pink-500',
      stats: 'Start Now',
      tag: 'Live',
      component: <LiveClassManager />,
    },
    {
      id: 'assignments',
      icon: FileText,
      title: 'Assignments',
      description: 'Create and grade assignments with AI-powered assistance',
      color: 'from-blue-500 to-cyan-500',
      stats: '12 Pending',
      tag: 'Popular',
      component: <AssignmentManager />,
    },
    {
      id: 'students',
      icon: Users,
      title: 'Students',
      description: 'Monitor progress, attendance, and performance analytics',
      color: 'from-green-500 to-emerald-500',
      stats: '150 Active',
      tag: 'Dashboard',
      component: <StudentDashboard />,
    },
    {
      id: 'tests',
      icon: Target,
      title: 'Tests & Quizzes',
      description: 'Create practice tests with auto-grading and analytics',
      color: 'from-orange-500 to-amber-500',
      stats: '8 Active',
      tag: 'AI Powered',
      component: <TestManager />,
    },
    {
      id: 'library',
      icon: Play,
      title: 'Video Library',
      description: 'Upload and organize your recorded lecture videos',
      color: 'from-purple-500 to-indigo-500',
      stats: '45 Videos',
      tag: 'On Demand',
      component: <VideoLibraryManager />,
    },
    {
      id: 'doubts',
      icon: MessageSquare,
      title: 'Student Doubts',
      description: 'Answer questions and provide guidance 24/7',
      color: 'from-pink-500 to-rose-500',
      stats: '23 New',
      tag: 'Active',
      component: <DoubtManager />,
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: 'Analytics',
      description: 'Track performance with detailed insights and reports',
      color: 'from-indigo-500 to-blue-500',
      stats: 'View Stats',
      tag: 'Insights',
      component: <AnalyticsDashboard />,
    },
    {
      id: 'schedule',
      icon: Calendar,
      title: 'Schedule',
      description: 'Manage your teaching calendar and sessions',
      color: 'from-teal-500 to-cyan-500',
      stats: '5 Today',
      tag: 'Planner',
      component: <ScheduleManager />,
    },
  ];

  const stats = [
    { value: '150', label: 'Total Students', icon: Users },
    { value: '4.8', label: 'Avg Rating', icon: Star },
    { value: '₹45K', label: 'This Month', icon: DollarSign },
    { value: '95%', label: 'Success Rate', icon: Trophy },
  ];

  const currentFeature = platformFeatures.find(f => f.id === currentScreen);

  // Feature screen
  if (currentScreen !== 'home' && currentFeature) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        <nav className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg shadow-lg`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={goHome}
                className={`flex items-center gap-2 ${darkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'} font-semibold transition-colors group`}
              >
                <div className={`w-10 h-10 ${darkMode ? 'bg-gray-700 group-hover:bg-indigo-900' : 'bg-gray-100 group-hover:bg-indigo-100'} rounded-xl flex items-center justify-center transition-colors`}>
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="hidden sm:inline">Back to Home</span>
              </button>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${currentFeature.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <currentFeature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{currentFeature.title}</h1>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{currentFeature.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'} hover:scale-110 transition-all`}
                  title={darkMode ? 'Light Mode' : 'Dark Mode'}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <button onClick={goHome} className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <span className={`hidden md:inline text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>EduElite</span>
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{session?.user?.name}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-2xl border py-2 z-50`}>
                      <div className={`px-4 py-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            {userProfile?.avatar ? (
                              <img src={userProfile.avatar} alt={session?.user?.name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-lg">{session?.user?.name?.[0]}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{session?.user?.name}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{session?.user?.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => { setShowEditProfile(true); setShowUserMenu(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </button>

                      <button
                        onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>

                      <button
                        onClick={toggleDarkMode}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                      >
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                      </button>

                      <div className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-t`}></div>

                      <button
                        onClick={() => { switchToStudentView(); setShowUserMenu(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Switch to Student View</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 ${darkMode ? 'hover:bg-red-900/20' : ''} transition-colors`}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden border-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`bg-gradient-to-r ${currentFeature.color} p-6 sm:p-8`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">{currentFeature.title}</h2>
                    {currentFeature.tag && (
                      <span className="bg-white/20 backdrop-blur-lg text-white px-3 py-1 rounded-full text-xs font-bold">
                        {currentFeature.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-white/90 text-sm sm:text-base">{currentFeature.description}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-lg px-4 py-2 rounded-xl">
                  <p className="text-white font-semibold text-sm">{currentFeature.stats}</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-12">
              {currentFeature.component}
            </div>

            <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} p-6 border-t`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={goHome}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

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

  // Home/Landing Screen (continued in next part due to length)
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Navigation Bar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled 
          ? `${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg shadow-lg py-3` 
          : 'bg-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <span className={`text-xl sm:text-2xl font-bold ${scrolled ? (darkMode ? 'text-gray-100' : 'text-gray-900') : 'text-white'}`}>
                  EduElite Pro
                </span>
                <div className={`text-xs ${scrolled ? (darkMode ? 'text-gray-400' : 'text-gray-600') : 'text-purple-200'} hidden sm:block`}>
                  Teacher Portal
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className={`font-medium transition-colors ${
                scrolled ? (darkMode ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600') : 'text-white/90 hover:text-white'
              }`}>Features</a>
              <a href="#stats" className={`font-medium transition-colors ${
                scrolled ? (darkMode ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600') : 'text-white/90 hover:text-white'
              }`}>Analytics</a>
              
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white/10 text-white'} hover:scale-110 transition-all`}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all"
                >
                  <UserIcon className="w-4 h-4" />
                  {session?.user?.name}
                </button>
                
                {showUserMenu && (
                  <div className={`absolute right-0 mt-2 w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-2xl border py-2 z-50`}>
                    <div className={`px-4 py-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                          {userProfile?.avatar ? (
                            <img src={userProfile.avatar} alt={session?.user?.name || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-lg">{session?.user?.name?.[0]}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{session?.user?.name}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{session?.user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => { setShowEditProfile(true); setShowUserMenu(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </button>

                    <button
                      onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>

                    <button
                      onClick={toggleDarkMode}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                    >
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    <div className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-t`}></div>

                    <button
                      onClick={() => { switchToStudentView(); setShowUserMenu(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Switch to Student View</span>
                    </button>

                    <button
                      onClick={() => { handleLogout(); setShowUserMenu(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 ${darkMode ? 'hover:bg-red-900/20' : ''} transition-colors`}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100/10 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className={`w-6 h-6 ${scrolled ? (darkMode ? 'text-gray-100' : 'text-gray-900') : 'text-white'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${scrolled ? (darkMode ? 'text-gray-100' : 'text-gray-900') : 'text-white'}`} />
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className={`lg:hidden mt-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl p-6 border`}>
              <div className="flex flex-col gap-4">
                <a href="#features" className={`${darkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'} font-medium py-2`} onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#stats" className={`${darkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'} font-medium py-2`} onClick={() => setMobileMenuOpen(false)}>Analytics</a>
                
                <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      {userProfile?.avatar ? (
                        <img src={userProfile.avatar} alt={session?.user?.name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-lg">{session?.user?.name?.[0]}</span>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{session?.user?.name}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{session?.user?.email}</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => { setShowEditProfile(true); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 ${darkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'} font-medium py-2`}
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>

                <button
                  onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 ${darkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'} font-medium py-2`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>

                <button
                  onClick={() => { toggleDarkMode(); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 ${darkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'} font-medium py-2`}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>

                <button
                  onClick={() => { switchToStudentView(); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 ${darkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'} font-medium py-2`}
                >
                  <Eye className="w-4 h-4" />
                  Switch to Student View
                </button>

                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium py-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className={`relative ${darkMode ? 'bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950' : 'bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900'} overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-32`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-48 h-48 sm:w-72 sm:h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6 border border-white/20 text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
              <span className="font-semibold">Professional Teaching Dashboard</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Welcome back,
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text  mt-2">
                {session?.user?.name?.split(' ')[0]}! 👋
              </span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-purple-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
              You have <span className="font-bold text-white">5 classes</span> scheduled today and{' '}
              <span className="font-bold text-white">23 new questions</span> to answer. Keep inspiring minds!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-10 justify-center">
              <button 
                onClick={() => openFeature('go-live')}
                className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                Start Live Class
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => openFeature('assignments')}
                className="group bg-white/10 backdrop-blur-lg text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 border-2 border-white/20"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Create Assignment
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center">
              <div className="flex -space-x-2 sm:-space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 sm:border-3 border-purple-900 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-yellow-400 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />)}
                </div>
                <p className="text-purple-200 text-xs sm:text-sm font-medium">4.8 Average Rating from 150 Students</p>
              </div>
            </div>
          </div>

          <div id="stats" className="mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className={`bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 text-center hover:bg-white/15 transition-all ${darkMode ? 'hover:bg-white/20' : ''}`}>
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl mb-2 sm:mb-3">
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-purple-200 text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teaching Tools Section */}
      <div id="features" className={`py-16 sm:py-20 lg:py-28 ${darkMode ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-b from-white via-gray-50 to-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className={`inline-flex items-center gap-2 ${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'} px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 text-xs sm:text-sm`}>
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-semibold">COMPLETE TEACHING TOOLKIT</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4 sm:mb-6 px-4`}>
              Everything You Need
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
                To Teach Effectively
              </span>
            </h2>
            <p className={`text-base sm:text-lg lg:text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto px-4`}>
              Powerful tools designed for educators to manage classes, track progress, and inspire students
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {platformFeatures.map((feature) => (
              <button
                key={feature.id}
                onClick={() => openFeature(feature.id)}
                className={`group relative ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-indigo-500' : 'bg-white border-gray-100 hover:border-indigo-500'} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 overflow-hidden text-left w-full`}
              >
                {feature.tag && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold">
                    {feature.tag}
                  </div>
                )}

                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl mb-3 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>

                <h3 className={`text-base sm:text-lg lg:text-xl font-bold ${darkMode ? 'text-gray-100 group-hover:text-indigo-400' : 'text-gray-900 group-hover:text-indigo-600'} mb-2 sm:mb-3 transition-colors`}>
                  {feature.title}
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed`}>
                  {feature.description}
                </p>

                <div className={`flex items-center justify-between pt-3 sm:pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} font-medium`}>{feature.stats}</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                </div>

                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`${darkMode ? 'bg-gray-950' : 'bg-gray-900'} text-white py-12 sm:py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold">EduElite Pro</span>
                <div className="text-xs text-gray-400">Teacher Portal</div>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6 text-sm sm:text-base max-w-2xl mx-auto">
              Empowering educators with AI-powered tools to inspire and educate the next generation.
            </p>
          </div>

          <div className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-800'} pt-6 sm:pt-8 mt-8`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm sm:text-base">
              <p className="text-gray-400 text-center md:text-left">
                © 2026 EduElite Technologies Pvt. Ltd. All rights reserved.
              </p>
              <div className="flex gap-6 text-gray-400">
                <span>Made with ❤️ for Teachers</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

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