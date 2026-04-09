'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Video, FileText, Users, Target, Play, MessageSquare,
  BarChart3, Calendar, BookOpen, Settings, Bell, Search,
  Home, LogOut, User as UserIcon, Menu, X, TrendingUp,
  Clock, DollarSign, Star, CheckCircle, Upload, Plus,
  ChevronRight, Zap, GraduationCap, Sparkles, Activity,
  Award, Shield, ArrowLeft, BookMarked,
  TrendingDown, Eye, BookCheck, Flame, ArrowRight, Trophy,
  Moon, Sun, Edit, Camera, Save, Mail, Phone, MapPin,
  Briefcase, Linkedin, Twitter, Globe, Brain
} from 'lucide-react';

// Import feature components
import NotesManager from '@/components/teacher/NotesManager';
import AssignmentManager from '@/components/teacher-features/AssignmentManager';
import StudentDashboard from '@/components/teacher-features/StudentDashboard';
import AIAssistant from '@/components/teacher/AIAssistant';
import VideoLibraryManager from '@/components/teacher-features/VideoLibraryManager';
import DoubtManager from '@/components/teacher-features/DoubtManager';
import TeacherChat from '@/components/teacher/TeacherChat';
import ScheduleManager from '@/components/teacher-features/ScheduleManager';

// Import modals
import EditProfileModal from '../../components/modals/EditProfileModal/Editprofilemodal';
import SettingsModal from '@/components/modals/SettingsModal/Settingsmodal';

// ─── Coaching Logo ─────────────────────────────────────────────────────────────
function CoachingLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <Image
      src="/coaching-icon.png"
      alt="Intense Learners"
      width={48}
      height={48}
      className={className}
      priority
    />
  );
}

export default function TeacherDashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [showUserMenu, setShowUserMenu]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [userProfile, setUserProfile]     = useState<any>(null);
  const [loading, setLoading]             = useState(true);

  // ── Dark mode detection (same pattern as student dashboard) ──
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);
    if (saved) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', next.toString());
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const dm = darkMode;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    else if (status === 'authenticated' && session?.user?.role !== 'TEACHER') router.push('/');
  }, [session, status, router]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch(`/api/user/profile/${session.user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUserProfile(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [session, status]);

  const handleLogout = async () => { await signOut({ callbackUrl: '/' }); };
  const handleProfileUpdate = async (data: any) => { setUserProfile(data); await update(); };
  const openFeature = (id: string) => { setCurrentScreen(id); setMobileMenuOpen(false); };
  const goHome = () => setCurrentScreen('home');

  const platformFeatures = [
    { id: 'notes',       icon: BookOpen,      title: 'Study Notes',      description: 'Upload and manage study materials and notes for your students',           color: 'from-blue-500 to-cyan-500',     stats: '45 Notes',      tag: 'Popular',   component: <NotesManager /> },
    { id: 'assignments', icon: FileText,       title: 'Assignments',      description: 'Create and grade assignments with AI-powered assistance',                color: 'from-purple-500 to-pink-500',   stats: '12 Pending',    tag: 'Active',    component: <AssignmentManager /> },
    { id: 'students',    icon: Users,          title: 'Students',         description: 'Monitor progress, attendance, and performance analytics',                color: 'from-green-500 to-emerald-500', stats: '150 Active',    tag: 'Dashboard', component: <StudentDashboard /> },
    { id: 'ai-assistant',icon: Brain,          title: 'AI Assistant',     description: 'Get instant help with lesson plans, content creation, and strategies',  color: 'from-indigo-500 to-purple-500', stats: '24/7 Available', tag: 'AI Powered',component: <AIAssistant /> },
    { id: 'library',     icon: Play,           title: 'Video Library',    description: 'Upload and organize your recorded lecture videos',                      color: 'from-rose-500 to-pink-500',     stats: '45 Videos',     tag: 'On Demand', component: <VideoLibraryManager /> },
    { id: 'doubts',      icon: MessageSquare,  title: 'Student Doubts',   description: 'Answer questions and provide guidance 24/7',                            color: 'from-yellow-500 to-orange-500', stats: '23 New',        tag: 'Active',    component: <DoubtManager /> },
    { id: 'chat',        icon: MessageSquare,  title: 'Teacher Chat',     description: 'Connect and collaborate with fellow teachers',                          color: 'from-cyan-500 to-blue-500',     stats: 'Live Chat',     tag: 'New',       component: <TeacherChat /> },
    { id: 'schedule',    icon: Calendar,       title: 'Schedule',         description: 'Manage your teaching calendar and sessions',                            color: 'from-teal-500 to-cyan-500',     stats: '5 Today',       tag: 'Planner',   component: <ScheduleManager /> },
  ];

  const stats = [
    { value: '150',  label: 'Total Students', icon: Users       },
    { value: '4.8',  label: 'Avg Rating',     icon: Star        },
    { value: '₹45K', label: 'This Month',     icon: DollarSign  },
    { value: '95%',  label: 'Success Rate',   icon: Trophy      },
  ];

  const currentFeature = platformFeatures.find(f => f.id === currentScreen);

  // ── Shared User Menu Dropdown ──
  const UserMenuDropdown = () => (
    <div className={`absolute right-0 mt-2 w-56 sm:w-64 rounded-xl shadow-2xl border py-2 z-50 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`px-4 py-3 border-b ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            {userProfile?.avatar
              ? <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-base sm:text-lg">{session?.user?.name?.[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{session?.user?.name}</p>
            <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {[
        { icon: Edit,     label: 'Edit Profile', onClick: () => { setShowEditProfile(true); setShowUserMenu(false); } },
        { icon: Settings, label: 'Settings',     onClick: () => { setShowSettings(true);    setShowUserMenu(false); } },
      ].map(({ icon: Icon, label, onClick }) => (
        <button key={label} onClick={onClick}
          className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${dm ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
          <Icon className="w-4 h-4" />{label}
        </button>
      ))}

      <button onClick={toggleDarkMode}
        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${dm ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
        {dm ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        {dm ? 'Light Mode' : 'Dark Mode'}
      </button>

      <div className={`my-1 border-t ${dm ? 'border-gray-700' : 'border-gray-200'}`} />

      <button onClick={() => { router.push('/student'); setShowUserMenu(false); }}
        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${dm ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
        <Eye className="w-4 h-4" />Switch to Student View
      </button>

      <button onClick={handleLogout}
        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-red-500 transition-colors ${dm ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
        <LogOut className="w-4 h-4" />Logout
      </button>
    </div>
  );

  // ── Loading ──
  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50'}`}>
        <div className="text-center px-4">
          <div className="relative mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20">
            <div className={`absolute inset-0 rounded-full border-4 ${dm ? 'border-purple-900' : 'border-purple-100'}`} />
            <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
            </div>
          </div>
          <p className={`font-semibold text-base sm:text-lg ${dm ? 'text-gray-200' : 'text-gray-700'}`}>Loading Teacher Portal...</p>
          <p className={`text-sm mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  // ── Feature Screen ──
  if (currentScreen !== 'home' && currentFeature) {
    return (
      <div className={`min-h-screen transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        {/* Feature Nav */}
        <nav className={`sticky top-0 z-50 shadow-lg backdrop-blur-lg ${dm ? 'bg-gray-800/95' : 'bg-white/95'}`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">

              {/* Back button */}
              <button onClick={goHome}
                className={`flex items-center gap-2 font-semibold transition-colors group flex-shrink-0 ${dm ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'}`}>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${dm ? 'bg-gray-700 group-hover:bg-indigo-900' : 'bg-gray-100 group-hover:bg-indigo-100'}`}>
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="hidden sm:inline text-sm sm:text-base">Back to Home</span>
              </button>

              {/* Feature title */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-center">
                <div className={`w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br ${currentFeature.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <currentFeature.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="hidden sm:block min-w-0">
                  <h1 className={`text-base sm:text-lg font-bold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{currentFeature.title}</h1>
                  <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{currentFeature.description}</p>
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={toggleDarkMode}
                  className={`p-2 rounded-xl hover:scale-110 transition-all ${dm ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
                  {dm ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                <button onClick={goHome} className="hidden md:flex items-center gap-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center"><CoachingLogo /></div>
                  <span className={`font-bold text-base lg:text-xl ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Intense Learners</span>
                </button>

                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all text-xs sm:text-sm">
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline truncate max-w-[80px] sm:max-w-[120px]">{session?.user?.name}</span>
                  </button>
                  {showUserMenu && <UserMenuDropdown />}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Feature Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className={`rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`bg-gradient-to-r ${currentFeature.color} p-4 sm:p-6 lg:p-8`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{currentFeature.title}</h2>
                    {currentFeature.tag && <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-xs font-bold">{currentFeature.tag}</span>}
                  </div>
                  <p className="text-white/90 text-xs sm:text-sm lg:text-base">{currentFeature.description}</p>
                </div>
                <div className="bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex-shrink-0">
                  <p className="text-white font-semibold text-xs sm:text-sm">{currentFeature.stats}</p>
                </div>
              </div>
            </div>

            <div className="p-0">{currentFeature.component}</div>

            <div className={`p-4 sm:p-6 border-t-2 ${dm ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <button onClick={goHome} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors text-sm sm:text-base">
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />Return to Dashboard
              </button>
            </div>
          </div>
        </div>

        {showEditProfile && <EditProfileModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} userProfile={userProfile} onUpdate={handleProfileUpdate} darkMode={dm} userRole="TEACHER" />}
        {showSettings    && <SettingsModal    isOpen={showSettings}    onClose={() => setShowSettings(false)}    darkMode={dm} onDarkModeToggle={toggleDarkMode} />}
      </div>
    );
  }

  // ── Home / Dashboard ───────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors ${dm ? 'bg-gray-900' : 'bg-white'}`}>

      {/* ── Navbar ── */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? `${dm ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg shadow-lg py-2 sm:py-3` : 'bg-transparent py-3 sm:py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center">
                <CoachingLogo />
              </div>
              <div>
                <span className={`text-base sm:text-xl lg:text-2xl font-bold ${scrolled ? (dm ? 'text-gray-100' : 'text-gray-900') : 'text-white'}`}>
                  Intense Learners
                </span>
                <div className={`text-[10px] sm:text-xs hidden sm:block ${scrolled ? (dm ? 'text-gray-400' : 'text-gray-600') : 'text-purple-200'}`}>
                  Teacher Portal
                </div>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {[
                { href: '#features', label: 'Features'  },
                { href: '#stats',    label: 'Analytics' },
              ].map(({ href, label }) => (
                <a key={label} href={href}
                  className={`font-medium transition-colors text-sm lg:text-base ${scrolled ? (dm ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600') : 'text-white/90 hover:text-white'}`}>
                  {label}
                </a>
              ))}

              <button onClick={toggleDarkMode}
                className={`p-2 rounded-xl hover:scale-110 transition-all ${scrolled ? (dm ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600') : 'bg-white/15 text-white hover:bg-white/25'}`}>
                {dm ? <Sun className="w-4 h-4 lg:w-5 lg:h-5" /> : <Moon className="w-4 h-4 lg:w-5 lg:h-5" />}
              </button>

              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all text-sm lg:text-base">
                  <UserIcon className="w-4 h-4" />{session?.user?.name}
                </button>
                {showUserMenu && <UserMenuDropdown />}
              </div>
            </div>

            {/* Mobile: dark toggle + hamburger */}
            <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
              <button onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all ${scrolled ? (dm ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600') : 'bg-white/15 text-white hover:bg-white/25'}`}>
                {dm ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors">
                {mobileMenuOpen
                  ? <X    className={`w-5 h-5 sm:w-6 sm:h-6 ${scrolled ? (dm ? 'text-gray-100' : 'text-gray-900') : 'text-white'}`} />
                  : <Menu className={`w-5 h-5 sm:w-6 sm:h-6 ${scrolled ? (dm ? 'text-gray-100' : 'text-gray-900') : 'text-white'}`} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className={`lg:hidden mt-3 sm:mt-4 rounded-2xl shadow-2xl p-4 sm:p-6 border ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex flex-col gap-3 sm:gap-4">
                {[
                  { href: '#features', label: 'Features'  },
                  { href: '#stats',    label: 'Analytics' },
                ].map(({ href, label }) => (
                  <a key={label} href={href} onClick={() => setMobileMenuOpen(false)}
                    className={`font-medium py-1.5 text-sm sm:text-base ${dm ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'}`}>{label}</a>
                ))}

                <div className={`border-t pt-3 sm:pt-4 ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      {userProfile?.avatar
                        ? <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white font-bold">{session?.user?.name?.[0]}</span>}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{session?.user?.name}</p>
                      <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{session?.user?.email}</p>
                    </div>
                  </div>
                </div>

                {[
                  { icon: Edit,     label: 'Edit Profile',          onClick: () => { setShowEditProfile(true);  setMobileMenuOpen(false); } },
                  { icon: Settings, label: 'Settings',               onClick: () => { setShowSettings(true);    setMobileMenuOpen(false); } },
                  { icon: Eye,      label: 'Switch to Student View', onClick: () => { router.push('/student');  setMobileMenuOpen(false); } },
                ].map(({ icon: Icon, label, onClick }) => (
                  <button key={label} onClick={onClick}
                    className={`flex items-center gap-2 font-medium py-1.5 text-sm sm:text-base ${dm ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'}`}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}

                <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-400 font-medium py-1.5 text-sm sm:text-base">
                  <LogOut className="w-4 h-4" />Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <div className={`relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-28 ${
        dm
          ? 'bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950'
          : 'bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900'
      }`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute top-20 left-10 w-40 h-40 sm:w-64 sm:h-64 lg:w-72 lg:h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 sm:w-64 sm:h-64 lg:w-72 lg:h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6 border border-white/20 text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
              <span className="font-semibold">Professional Teaching Dashboard</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Welcome back,
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text  mt-1 sm:mt-2">
                {session?.user?.name?.split(' ')[0]}! 👋
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-xl text-purple-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
              You have <span className="font-bold text-white">45 notes</span> uploaded and{' '}
              <span className="font-bold text-white">23 new questions</span> to answer. Keep inspiring minds!
            </p>

            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 mb-6 sm:mb-10 justify-center">
              <button onClick={() => openFeature('notes')}
                className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />Manage Notes
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => openFeature('assignments')}
                className="group bg-white/10 backdrop-blur-lg text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 border-2 border-white/20">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />Create Assignment
              </button>
            </div>

            {/* Teacher avatar + rating — with real images */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 justify-center">
              <div className="flex -space-x-2 sm:-space-x-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-900 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0">
                    <Image
                      src={`/students/student${i}.jpg`}
                      alt={`Student ${i}`}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        t.style.display = 'none';
                        if (t.parentElement) {
                          t.parentElement.innerHTML = `<span class="w-full h-full flex items-center justify-center text-white font-bold text-xs">${String.fromCharCode(64 + i)}</span>`;
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-yellow-400 mb-0.5 sm:mb-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />)}
                </div>
                <p className="text-purple-200 text-xs sm:text-sm font-medium">4.8 Average Rating from 150 Students</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div id="stats" className="mt-10 sm:mt-14 lg:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 sm:gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-3 sm:p-5 lg:p-6 border border-white/20 text-center hover:bg-white/15 transition-all">
                <div className="inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-white/20 rounded-xl mb-2 sm:mb-3">
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5 sm:mb-1">{stat.value}</div>
                <div className="text-purple-200 text-xs sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Teaching Tools ── */}
      <div id="features" className={`py-14 sm:py-20 lg:py-28 ${dm ? 'bg-gray-900' : 'bg-gradient-to-b from-white via-gray-50 to-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14 lg:mb-16">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 text-xs sm:text-sm ${dm ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" /><span className="font-semibold">COMPLETE TEACHING TOOLKIT</span>
            </div>
            <h2 className={`text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 px-4 ${dm ? 'text-white' : 'text-gray-900'}`}>
              Everything You Need
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-1 sm:mt-2">
                To Teach Effectively
              </span>
            </h2>
            <p className={`text-sm sm:text-base lg:text-xl max-w-3xl mx-auto px-4 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              Powerful tools designed for educators to manage classes, track progress, and inspire students
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {platformFeatures.map((feature) => (
              <button key={feature.id} onClick={() => openFeature(feature.id)}
                className={`group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-indigo-500 overflow-hidden text-left w-full ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>

                {feature.tag && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">
                    {feature.tag}
                  </div>
                )}

                <div className={`inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl mb-3 sm:mb-4 lg:mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                </div>

                <h3 className={`text-sm sm:text-base lg:text-xl font-bold mb-1.5 sm:mb-2 lg:mb-3 group-hover:text-indigo-600 transition-colors ${dm ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                  {feature.description}
                </p>

                <div className={`flex items-center justify-between pt-3 border-t ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                  <span className={`text-[10px] sm:text-xs font-medium ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{feature.stats}</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                </div>

                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className={`py-10 sm:py-14 lg:py-16 ${dm ? 'bg-gray-950' : 'bg-gray-900'} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                <CoachingLogo />
              </div>
              <div>
                <span className="text-lg sm:text-xl lg:text-2xl font-bold">Intense Learners</span>
                <div className="text-xs text-gray-400">Teacher Portal</div>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6 text-xs sm:text-sm lg:text-base max-w-2xl mx-auto">
              Empowering educators with AI-powered tools to inspire and educate the next generation.
            </p>
          </div>

          <div className="border-t border-gray-800 pt-5 sm:pt-8 mt-6 sm:mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <p className="text-gray-400 text-center sm:text-left">
                © 2026 Intense Learners Technologies Pvt. Ltd. All rights reserved.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-6 text-gray-400 text-center justify-center">
                <span>Made with ❤️ for Teachers</span>
                <span className="hidden sm:inline">•</span>
                <span>Intense Learners</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Modals ── */}
      {showEditProfile && <EditProfileModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} userProfile={userProfile} onUpdate={handleProfileUpdate} darkMode={dm} userRole="TEACHER" />}
      {showSettings    && <SettingsModal    isOpen={showSettings}    onClose={() => setShowSettings(false)}    darkMode={dm} onDarkModeToggle={toggleDarkMode} />}
    </div>
  );
}