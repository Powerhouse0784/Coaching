'use client';
import { useRouter } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { 
  Rocket, Brain, Trophy, Users, Video, Target, Menu, X, 
  ArrowRight, Play, MessageSquare, CreditCard, 
  GraduationCap, Clock, Star,
  ChevronRight, Zap, Award, Shield, Sparkles,
  Calendar, FileText, UserCheck, Globe, Headphones, Lock,
  ArrowLeft, Home, LogOut, User as UserIcon, Eye, EyeOff, 
  Mail, Chrome, AlertCircle, CheckCircle2, Settings, Edit,
  Moon, Sun
} from 'lucide-react';

// Import your components
import StudentAssignmentDashboard from "@/components/assignments/AssignmentCard";
import LiveClasses from "@/components/live class/LiveClass";
import PaymentDemo from "@/components/payment/PaymentCheck";
import StudyPlanner from "@/components/study planner/Study";
import TeacherInterface from "@/components/teacher/TeacherInterface";
import VideoPlayer from "@/components/player/VideoPlayer";
import QuizInterface from "@/components/quiz/QuizInterface";
import DoubtComponent from "@/components/doubt/DoubtComponent";

// Import modals
import EditProfileModal from '@/components/modals/EditProfileModal/Editprofilemodal';
import SettingsModal from '@/components/modals/SettingsModal/Settingsmodal';

// Types
interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}


const LoginPage: React.FC<{ onSwitchToRegister: () => void; onBack?: () => void }> = ({ onSwitchToRegister, onBack }) => {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const result = await signIn('credentials', {
      email,
      password,
      role,
      redirect: false,
    });

    if (result?.error) {
      if (result.error.includes('registered as')) {
        setError(result.error);
      } else if (result.error === 'Invalid credentials') {
        setError('User not found or invalid password. Please check your credentials.');
      } else if (result.error === 'Account is deactivated') {
        setError('Your account has been deactivated. Please contact support.');
      } else {
        setError(result.error);
      }
    } else if (result?.ok) {
      // ✅ IMPORTANT: Wait for session to be ready before redirecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ✅ Use window.location instead of router.push for hard refresh
      if (role === 'TEACHER') {
        window.location.href = '/teacher';
      } else {
        window.location.href = '/student';
      }
    }
  } catch (err: any) {
    setError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 font-semibold mb-4 transition-colors group"
          >
            <div className="w-10 h-10 bg-white group-hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-colors shadow-md">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span>Back to Home</span>
          </button>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">EE</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to continue learning</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button 
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 px-4 hover:bg-gray-50 transition-colors mb-6"
          >
            <Chrome className="w-5 h-5" />
            <span className="font-medium text-gray-700">Continue with Google</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">I am a:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === 'STUDENT'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <GraduationCap className={`w-6 h-6 mx-auto mb-2 ${role === 'STUDENT' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="font-semibold text-sm">Student</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('TEACHER')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === 'TEACHER'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <UserCheck className={`w-6 h-6 mx-auto mb-2 ${role === 'TEACHER' ? 'text-purple-500' : 'text-gray-400'}`} />
                  <p className="font-semibold text-sm">Teacher</p>
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3 font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <button onClick={onSwitchToRegister} className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign up for free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Register Component with Role Selection
// Updated Register Component with Teacher Code Verification
// Add this to replace your RegisterPage component

const RegisterPage: React.FC<{ onSwitchToLogin: () => void; onBack?: () => void }> = ({ onSwitchToLogin, onBack }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [teacherCode, setTeacherCode] = useState<string>(''); // ✅ NEW: Teacher code state
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

  const TEACHER_REGISTRATION_CODE = 'P8YGJCVR2'; // ✅ Teacher code constant

  const handleChange = (field: keyof FormData, value: string): void => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    // ✅ NEW: Validate teacher code if role is TEACHER
    if (role === 'TEACHER') {
      if (!teacherCode.trim()) {
        setError('Please enter the teacher registration code');
        return;
      }
      if (teacherCode.trim() !== TEACHER_REGISTRATION_CODE) {
        setError('Invalid teacher registration code. Please contact administration for the correct code.');
        return;
      }
    }

    setLoading(true);

    try {
      // Register the user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: role,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(registerData.error || 'Registration failed');
      }

      setSuccess(`${role === 'STUDENT' ? 'Student' : 'Teacher'} account created successfully! Logging you in...`);

      // Auto-login after registration
      setTimeout(async () => {
        try {
          const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            role: role,
            redirect: false,
          });

          if (result?.error) {
            setError('Registration successful but auto-login failed. Please login manually.');
            setTimeout(() => onSwitchToLogin(), 2000);
          } else if (result?.ok) {
            // Wait for session
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Hard redirect
            if (role === 'TEACHER') {
              window.location.href = '/teacher';
            } else {
              window.location.href = '/student';
            }
          }
        } catch (err: any) {
          setError('Registration successful. Please login manually.');
          setTimeout(() => onSwitchToLogin(), 2000);
        }
      }, 1000);
    } catch (err: any) {
      if (err.message.includes('Email already registered')) {
        setError('This email is already registered. Please login instead.');
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 font-semibold mb-4 transition-colors group"
          >
            <div className="w-10 h-10 bg-white group-hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-colors shadow-md">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span>Back to Home</span>
          </button>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">EE</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600 mt-2">Start your journey today</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 px-4 hover:bg-gray-50 transition-colors mb-6"
          >
            <Chrome className="w-5 h-5" />
            <span className="font-medium text-gray-700">Sign up with Google</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or register with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">I want to register as:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRole('STUDENT');
                    setTeacherCode(''); // Clear teacher code when switching to student
                    setError('');
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === 'STUDENT'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <GraduationCap className={`w-6 h-6 mx-auto mb-2 ${role === 'STUDENT' ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="font-semibold text-sm">Student</p>
                  <p className="text-xs mt-1 text-gray-500">Learn and grow</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('TEACHER');
                    setError('');
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === 'TEACHER'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <UserCheck className={`w-6 h-6 mx-auto mb-2 ${role === 'TEACHER' ? 'text-purple-500' : 'text-gray-400'}`} />
                  <p className="font-semibold text-sm">Teacher</p>
                  <p className="text-xs mt-1 text-gray-500">Teach and inspire</p>
                </button>
              </div>
            </div>

            {/* ✅ NEW: Teacher Code Input (Only shown when TEACHER is selected) */}
            {role === 'TEACHER' && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Teacher Registration Code *
                </label>
                <input
                  type="text"
                  value={teacherCode}
                  onChange={(e) => {
                    setTeacherCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="Enter teacher code"
                  required
                  className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white"
                  maxLength={20}
                />
                <p className="text-xs text-purple-700 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Contact administration to get the teacher registration code
                </p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Create a strong password"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">I agree to the Terms of Service and Privacy Policy</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl py-3 font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="text-purple-600 hover:text-purple-700 font-semibold">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Main Protected Landing Page Component
const ProtectedLanding = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen, authScreen]);

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
          setProfileLoading(false);
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
    setCurrentScreen('home');
    setShowUserMenu(false);
  };

  const handleBackToHome = () => {
    setAuthScreen(null);
  };

  const handleProfileUpdate = async (updatedData: any) => {
    setUserProfile(updatedData);
    await update();
  };

  const switchToTeacherView = () => {
    router.push('/teacher');
  };

  const platformFeatures = [
    {
      id: 'live-classes',
      icon: Video,
      title: 'Live Interactive Classes',
      description: 'Join HD video sessions with real-time screen sharing, polls, and interactive whiteboard',
      color: 'from-blue-500 to-cyan-500',
      stats: '500+ Daily Sessions',
      tag: 'Most Popular',
      component: <LiveClasses />
    },
    {
  id: 'assignments',
  icon: FileText,
  title: 'Smart Assignments',
  description: 'AI-powered assignment system with automatic grading and detailed feedback',
  color: 'from-purple-500 to-pink-500',
  stats: '10K+ Completed',
  tag: 'Top Rated',
  component: <StudentAssignmentDashboard />
},
    {
      id: 'study-planner',
      icon: Brain,
      title: 'AI Study Planner',
      description: 'Get personalized study schedules based on your goals, pace, and performance',
      color: 'from-indigo-500 to-purple-500',
      stats: '95% Success Rate',
      tag: 'AI Powered',
      component: <StudyPlanner />
    },
    {
      id: 'teacher',
      icon: UserCheck,
      title: 'Teacher Dashboard',
      description: 'Comprehensive management tools for educators to track and mentor students',
      color: 'from-orange-500 to-red-500',
      stats: '200+ Teachers',
      tag: 'Professional',
      component: <TeacherInterface />
    },
    {
      id: 'quizzes',
      icon: Target,
      title: 'Practice & Mock Tests',
      description: 'Unlimited quizzes with instant AI evaluation and performance analytics',
      color: 'from-green-500 to-teal-500',
      stats: '50K+ Questions',
      tag: 'Exam Ready',
      component: <QuizInterface />
    },
    {
      id: 'videos',
      icon: Play,
      title: 'Video Library',
      description: 'Access thousands of high-quality recorded lectures available 24/7',
      color: 'from-rose-500 to-pink-500',
      stats: '1M+ Hours Watched',
      tag: 'On Demand',
      component: <VideoPlayer />
    },
    {
      id: 'doubts',
      icon: MessageSquare,
      title: 'Instant Doubt Solving',
      description: 'Get answers from AI tutor instantly or connect with expert mentors',
      color: 'from-yellow-500 to-orange-500',
      stats: '24/7 Available',
      tag: 'Always Active',
      component: <DoubtComponent />
    },
    {
      id: 'payments',
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Safe and encrypted payment gateway with multiple payment options',
      color: 'from-emerald-500 to-green-500',
      stats: 'Bank-Level Security',
      tag: 'Protected',
      component: <PaymentDemo />
    }
  ];

  const stats = [
    { value: '50K+', label: 'Active Students', icon: Users },
    { value: '95%', label: 'Success Rate', icon: Trophy },
    { value: '200+', label: 'Expert Teachers', icon: GraduationCap },
    { value: '24/7', label: 'Support', icon: Clock }
  ];

  const testimonials = [
    {
      name: 'Rahul Sharma',
      role: 'JEE Advanced AIR 247',
      image: 'RS',
      text: 'The AI study planner completely transformed my preparation. I went from struggling with time management to securing a top 300 rank. The personalized schedule kept me on track every single day.',
      rating: 5,
      course: 'JEE Advanced 2024'
    },
    {
      name: 'Priya Patel',
      role: 'NEET AIR 156',
      image: 'PP',
      text: 'Live classes with instant doubt solving made all the difference. The teachers are incredibly supportive and the AI tutor helped me understand complex topics at 2 AM when I needed it most!',
      rating: 5,
      course: 'NEET 2024'
    },
    {
      name: 'Amit Kumar',
      role: 'JEE Mains 99.8%ile',
      image: 'AK',
      text: 'The mock test series is the best I\'ve used. AI-powered analytics helped me identify weak areas and the adaptive difficulty kept challenging me. Worth every penny!',
      rating: 5,
      course: 'JEE Mains 2024'
    }
  ];

  const benefits = [
    { icon: Shield, text: 'Industry-leading security' },
    { icon: Globe, text: 'Learn from anywhere' },
    { icon: Award, text: 'Certified courses' },
    { icon: Headphones, text: '24/7 support' },
    { icon: Lock, text: 'Privacy guaranteed' },
    { icon: Zap, text: 'Instant access' }
  ];

  const openFeature = (featureId: string) => {
    if (!session) {
      setAuthScreen('register');
      return;
    }
    setCurrentScreen(featureId);
  };

  const goHome = () => {
    setCurrentScreen('home');
  };

  const currentFeature = platformFeatures.find(f => f.id === currentScreen);

  // Show auth screens
  if (authScreen === 'login') {
    return <LoginPage onSwitchToRegister={() => setAuthScreen('register')} onBack={handleBackToHome} />;
  }

  if (authScreen === 'register') {
    return <RegisterPage onSwitchToLogin={() => setAuthScreen('login')} onBack={handleBackToHome} />;
  }

  // Feature screen (protected)
  if (currentScreen !== 'home' && currentFeature && session) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        {/* Feature Navigation */}
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
                    <span className="hidden sm:inline">{session.user?.name}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-2xl border py-2 z-50`}>
                      <div className={`px-4 py-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            {userProfile?.avatar ? (
                              <img src={userProfile.avatar} alt={session.user?.name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-lg">{session.user?.name?.[0]}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{session.user?.name}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{session.user?.email}</p>
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

                      {/* Teacher View - Only for Teachers */}
                      {session?.user?.role === 'TEACHER' && (
                        <button
                          onClick={() => { switchToTeacherView(); setShowUserMenu(false); }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-left ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                        >
                          <UserCheck className="w-4 h-4" />
                          <span className="text-sm">Teacher View</span>
                        </button>
                      )}

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

    // Home/Landing Screen - COMPLETE VERSION
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
                  EduElite
                </span>
                <div className={`text-xs ${scrolled ? (darkMode ? 'text-gray-400' : 'text-gray-600') : 'text-purple-200'} hidden sm:block`}>
                  AI-Powered Learning
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <a href="#platform" className={`font-medium transition-colors ${
                scrolled ? (darkMode ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600') : 'text-white/90 hover:text-white'
              }`}>Features</a>
              <a href="#how-it-works" className={`font-medium transition-colors ${
                scrolled ? (darkMode ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600') : 'text-white/90 hover:text-white'
              }`}>How It Works</a>
              <a href="#testimonials" className={`font-medium transition-colors ${
                scrolled ? (darkMode ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600') : 'text-white/90 hover:text-white'
              }`}>Success Stories</a>
              
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-white/10 text-white'} hover:scale-110 transition-all`}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {session ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all"
                  >
                    <UserIcon className="w-4 h-4" />
                    {session.user?.name}
                  </button>
                  
                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-2xl border py-2 z-50`}>
                      <div className={`px-4 py-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            {userProfile?.avatar ? (
                              <img src={userProfile.avatar} alt={session.user?.name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-lg">{session.user?.name?.[0]}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{session.user?.name}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{session.user?.email}</p>
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

                      {/* Teacher View - Only for Teachers */}
                      {session?.user?.role === 'TEACHER' && (
                        <button
                          onClick={() => { switchToTeacherView(); setShowUserMenu(false); }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-left ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                        >
                          <UserCheck className="w-4 h-4" />
                          <span className="text-sm">Teacher View</span>
                        </button>
                      )}

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
              ) : (
                <button 
                  onClick={() => setAuthScreen('register')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all"
                >
                  Start Free Trial
                </button>
              )}
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
                <a href="#platform" className={`${darkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'} font-medium py-2`} onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#how-it-works" className={`${darkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'} font-medium py-2`} onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                <a href="#testimonials" className={`${darkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'} font-medium py-2`} onClick={() => setMobileMenuOpen(false)}>Success Stories</a>
                
                {session ? (
                  <>
                    <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                          {userProfile?.avatar ? (
                            <img src={userProfile.avatar} alt={session.user?.name || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-lg">{session.user?.name?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{session.user?.name}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{session.user?.email}</p>
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

                    {/* Teacher View - Only for Teachers */}
                    {session?.user?.role === 'TEACHER' && (
                      <button
                        onClick={() => { switchToTeacherView(); setMobileMenuOpen(false); }}
                        className={`flex items-center gap-2 ${darkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'} font-medium py-2`}
                      >
                        <UserCheck className="w-4 h-4" />
                        Teacher View
                      </button>
                    )}

                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium py-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { setAuthScreen('register'); setMobileMenuOpen(false); }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all"
                  >
                    Start Free Trial
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

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

        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-32">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-48 h-48 sm:w-72 sm:h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6 border border-white/20 text-xs sm:text-sm">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  <span className="font-semibold">India's Most Advanced AI Learning Platform</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                  Master Your Exams with
                  <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent mt-2">
                    AI-Powered Precision
                  </span>
                </h1>
                
                <p className="text-base sm:text-lg lg:text-xl text-purple-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Join 50,000+ students achieving their dreams with personalized AI study plans, live expert classes, and 24/7 intelligent support.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-10 justify-center lg:justify-start">
                  {session ? (
                    <button 
                      onClick={() => openFeature('study-planner')}
                      className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => setAuthScreen('register')}
                      className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      Start Learning Free
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                  <button className="group bg-white/10 backdrop-blur-lg text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 border-2 border-white/20">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                    Watch Demo
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center lg:justify-start">
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
                    <p className="text-purple-200 text-xs sm:text-sm font-medium">50,000+ Happy Students</p>
                  </div>
                </div>
              </div>

              <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur-3xl opacity-20 animate-pulse" />
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-6 lg:p-8 border border-white/20 shadow-2xl">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-4 lg:p-6 mb-4 lg:mb-6">
                    <div className="flex items-center justify-between mb-3 lg:mb-4">
                      <span className="text-white font-semibold text-xs sm:text-sm">Live Now</span>
                      <span className="flex items-center gap-2 bg-red-500 text-white px-2 lg:px-3 py-1 rounded-full text-xs font-semibold">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        1,247 watching
                      </span>
                    </div>
                    <div className="aspect-video bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl flex items-center justify-center mb-3 lg:mb-4 relative overflow-hidden">
                      <Play className="w-12 h-12 lg:w-16 lg:h-16 text-white opacity-80" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 lg:p-4">
                        <div className="flex items-center gap-2 text-white text-xs">
                          <Clock className="w-3 h-3" />
                          <span>2:34:12</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-white font-bold text-base lg:text-lg mb-1">Advanced Physics - Thermodynamics</h3>
                    <p className="text-purple-200 text-xs sm:text-sm">Dr. Rajesh Sharma • JEE Advanced Batch</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 lg:p-4 border border-white/20">
                      <Brain className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-400 mb-2" />
                      <p className="text-white font-bold text-base lg:text-lg">AI Tutor</p>
                      <p className="text-purple-200 text-xs">Instant Answers</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 lg:p-4 border border-white/20">
                      <Target className="w-6 h-6 lg:w-8 lg:h-8 text-green-400 mb-2" />
                      <p className="text-white font-bold text-base lg:text-lg">Mock Tests</p>
                      <p className="text-purple-200 text-xs">Unlimited Access</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 text-center hover:bg-white/15 transition-all">
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

        {/* Platform Features */}
        <div id="platform" className="py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-white via-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 text-xs sm:text-sm">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-semibold">COMPLETE LEARNING ECOSYSTEM</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
                Access Our Entire
                <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
                  Learning Platform
                </span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                {session ? 'Click any card below to explore our powerful tools' : 'Sign up to unlock all features and start your learning journey'}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {platformFeatures.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => openFeature(feature.id)}
                  className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100 hover:border-indigo-500 overflow-hidden text-left w-full"
                >
                  {!session && (
                    <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur-sm text-white p-1.5 rounded-lg">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                  
                  {feature.tag && (
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold">
                      {feature.tag}
                    </div>
                  )}

                  <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl mb-3 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg ${!session ? 'opacity-50' : ''}`}>
                    <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>

                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">{feature.stats}</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                  </div>

                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
                </button>
              ))}
            </div>

            {!session && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setAuthScreen('register')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
                >
                  <Lock className="w-5 h-5" />
                  Sign Up to Unlock All Features
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div id="how-it-works" className="py-16 sm:py-20 lg:py-28 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
                Get Started in <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">3 Simple Steps</span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-4">Your journey to success begins here</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 relative">
              <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" style={{ top: '4rem' }} />
              
              {[
                { step: '01', title: 'Create Account', desc: 'Sign up in 30 seconds and tell us your goals', icon: GraduationCap, color: 'from-blue-500 to-cyan-500' },
                { step: '02', title: 'AI Personalization', desc: 'Get your custom study plan powered by AI', icon: Brain, color: 'from-purple-500 to-pink-500' },
                { step: '03', title: 'Start Learning', desc: 'Access all features and begin your journey', icon: Rocket, color: 'from-orange-500 to-red-500' }
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-200">
                    <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${item.color} rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-lg`}>
                      <item.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-100 mb-3 sm:mb-4">{item.step}</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div id="testimonials" className="py-16 sm:py-20 lg:py-28 bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">Real Success Stories</h2>
              <p className="text-base sm:text-lg lg:text-xl text-purple-200 px-4">From students who trusted EduElite</p>
            </div>

            <div className="max-w-5xl mx-auto relative min-h-[400px] sm:min-h-[350px]">
              {testimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  className={`transition-all duration-700 ${idx === activeTestimonial ? 'opacity-100 scale-100 relative' : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'}`}
                >
                  <div className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-white/20 shadow-2xl">
                    <div className="flex text-yellow-400 mb-4 sm:mb-6 justify-center lg:justify-start">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                      ))}
                    </div>
                    <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-white mb-6 sm:mb-8 leading-relaxed font-light">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-left">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg flex-shrink-0">
                        {testimonial.image}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg sm:text-xl">{testimonial.name}</div>
                        <div className="text-purple-200 font-medium text-sm sm:text-base">{testimonial.role}</div>
                        <div className="text-purple-300 text-xs sm:text-sm">{testimonial.course}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2 sm:gap-3 mt-8 sm:mt-10">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`transition-all rounded-full ${idx === activeTestimonial ? 'bg-white w-10 sm:w-12 h-2.5 sm:h-3' : 'bg-white/30 hover:bg-white/50 w-2.5 sm:w-3 h-2.5 sm:h-3'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-2 sm:mb-3">
                    <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">{benefit.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-16 sm:py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2Mi1oMnYtMnptMC00djJoMnYtMnptMC00djJoMnYtMnptMC00djJoMnYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
          
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 px-4">
              Ready to Transform Your Future?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-purple-100 mb-8 sm:mb-10 max-w-3xl mx-auto px-4">
              Join 50,000+ students already learning with EduElite. Start your free trial today—no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              {session ? (
                <button
                  onClick={() => openFeature('study-planner')}
                  className="group bg-white text-purple-900 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center justify-center gap-2 sm:gap-3"
                >
                  Go to Your Dashboard
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={() => setAuthScreen('register')}
                  className="group bg-white text-purple-900 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center justify-center gap-2 sm:gap-3"
                >
                  Start Free Trial Now
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              <button className="bg-white/10 backdrop-blur-lg text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2 sm:gap-3 border-2 border-white/30">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                Book a Demo
              </button>
            </div>
            <p className="text-purple-200 mt-4 sm:mt-6 text-xs sm:text-sm px-4">✓ 14-day free trial  ✓ No credit card required  ✓ Cancel anytime</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-8 sm:mb-12">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Rocket className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-xl sm:text-2xl font-bold">EduElite</span>
                    <div className="text-xs text-gray-400">AI-Powered Learning</div>
                  </div>
                </div>
                <p className="text-gray-400 leading-relaxed mb-6 text-sm sm:text-base">
                  Transforming education through artificial intelligence and expert teaching. Join thousands of students achieving their dreams.
                </p>
                <div className="flex gap-3">
                  {['twitter', 'facebook', 'instagram', 'linkedin'].map((social) => (
                    <button key={social} className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                      <div className="w-5 h-5 bg-white/20 rounded" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base sm:text-lg mb-4">Platform</h4>
                <ul className="space-y-3 text-gray-400 text-sm sm:text-base">
                  <li><button onClick={() => openFeature('live-classes')} className="hover:text-white transition-colors">Live Classes</button></li>
                  <li><button onClick={() => openFeature('assignments')} className="hover:text-white transition-colors">Assignments</button></li>
                  <li><button onClick={() => openFeature('study-planner')} className="hover:text-white transition-colors">AI Study Planner</button></li>
                  <li><button onClick={() => openFeature('quizzes')} className="hover:text-white transition-colors">Mock Tests</button></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-base sm:text-lg mb-4">Resources</h4>
                <ul className="space-y-3 text-gray-400 text-sm sm:text-base">
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-base sm:text-lg mb-4">Legal</h4>
                <ul className="space-y-3 text-gray-400 text-sm sm:text-base">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 sm:pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm sm:text-base">
                <p className="text-gray-400 text-center md:text-left">
                  © 2026 EduElite Technologies Pvt. Ltd. All rights reserved.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-gray-400 text-center">
                  <span>Made with ❤️ in India</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Trusted by 50,000+ students</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  export default ProtectedLanding;