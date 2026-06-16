'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import React, { useState, useEffect, useRef } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { 
  Brain, Trophy, Users, Video, Target, Menu, X, 
  ArrowRight, Play, MessageSquare, CreditCard, 
  GraduationCap, Clock, Star,
  ChevronRight, Zap, Award, Shield, Sparkles,
  Calendar, FileText, UserCheck, Globe, Headphones, Lock,
  ArrowLeft, Home, LogOut, User as UserIcon, Eye, EyeOff, 
  Mail, Chrome, AlertCircle, CheckCircle2, Settings, Edit,
  Moon, Sun, BookOpen, Twitter, Facebook, Instagram, Linkedin, Youtube,
  KeyRound, CheckCircle, Send, LogIn, UserPlus
} from 'lucide-react';

// Import your components
import StudentAssignmentDashboard from "@/components/assignments/AssignmentCard";
import NotesLibrary from "@/components/student/NotesLibrary";
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

// ─── Coaching Logo ─────────────────────────────────────────────────────────────
function CoachingLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <Image src="/coaching-icon.png" alt="Intense Learners" width={48} height={48} className={className} priority />
  );
}

// ─── Social icons map ──────────────────────────────────────────────────────────
const socialIcons: Record<string, React.ReactNode> = {
  facebook:  <Facebook className="w-4 h-4" />,
  Chrome:    <Chrome   className="w-4 h-4" />,
  Instagram: <Instagram className="w-4 h-4" />,
  youtube:   <Youtube  className="w-4 h-4" />,
};
const socialLinks: Record<string, string> = {
  facebook:  'https://www.facebook.com/share/1E77DTHG5w/',
  Chrome:    'https://maps.app.goo.gl/ByExkEywvFAxG84c9?g_st=aw',
  Instagram: 'https://www.instagram.com/intense_learners?igsh=MTVtNTV2Znd6cGVrZQ==',
  youtube:   'https://youtube.com/@intense_learners?si=PKpm1w_PnuAImiYG',
};

// ─── Forgot Password Page ──────────────────────────────────────────────────────
const ForgotPasswordPage: React.FC<{ onBack: () => void; darkMode: boolean }> = ({ onBack, darkMode }) => {
  const dm = darkMode;
  const [step, setStep]       = useState<'email' | 'sent'>('email');
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setStep('sent');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      <div className="w-full max-w-md">
        <button onClick={onBack} className={`flex items-center gap-2 font-semibold mb-4 sm:mb-6 transition-colors group ${dm ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'}`}>
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors shadow-md ${dm ? 'bg-gray-800 group-hover:bg-indigo-900' : 'bg-white group-hover:bg-indigo-100'}`}>
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-sm sm:text-base">Back to Sign In</span>
        </button>

        <div className={`rounded-2xl shadow-xl p-6 sm:p-8 border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="text-center mb-6 sm:mb-8">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${dm ? 'bg-indigo-900' : 'bg-indigo-100'}`}>
              <KeyRound className={`w-7 h-7 sm:w-8 sm:h-8 ${dm ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <h1 className={`text-xl sm:text-2xl font-bold mb-1.5 ${dm ? 'text-white' : 'text-gray-900'}`}>
              {step === 'email' ? 'Forgot Password?' : 'Check Your Email'}
            </h1>
            <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              {step === 'email'
                ? "No worries! Enter your email and we'll send you reset instructions."
                : `We've sent a password reset link to ${email}`}
            </p>
          </div>

          {step === 'email' ? (
            <>
              {error && (
                <div className={`mb-5 p-3 sm:p-4 rounded-xl flex items-center gap-3 border ${dm ? 'bg-red-950 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" required
                      className={`w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-2.5 sm:py-3 font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                    : <><Send className="w-4 h-4" />Send Reset Link</>}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto flex items-center justify-center ${dm ? 'bg-green-900' : 'bg-green-100'}`}>
                <CheckCircle className={`w-8 h-8 sm:w-10 sm:h-10 ${dm ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                Click the link in the email to reset your password. If you don't see it, check your spam folder.
              </p>
              <button onClick={() => setStep('email')}
                className={`text-xs sm:text-sm font-semibold transition-colors ${dm ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
                Didn't receive it? Try again
              </button>
            </div>
          )}

          <p className={`text-center text-xs sm:text-sm mt-5 sm:mt-6 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
            Remembered your password?{' '}
            <button onClick={onBack} className={`font-semibold ${dm ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Login Page ────────────────────────────────────────────────────────────────
const LoginPage: React.FC<{ onSwitchToRegister: () => void; onBack?: () => void; darkMode: boolean }> = ({ onSwitchToRegister, onBack, darkMode }) => {
  const dm = darkMode;
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [role, setRole]                 = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [showForgot, setShowForgot]     = useState(false);

  if (showForgot) return <ForgotPasswordPage onBack={() => setShowForgot(false)} darkMode={dm} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const result = await signIn('credentials', { email, password, role, redirect: false });
      if (result?.error) {
        if (result.error.includes('registered as')) setError(result.error);
        else if (result.error === 'Invalid credentials') setError('User not found or invalid password. Please check your credentials.');
        else if (result.error === 'Account is deactivated') setError('Your account has been deactivated. Please contact support.');
        else setError(result.error);
      } else if (result?.ok) {
        await new Promise(r => setTimeout(r, 500));
        window.location.href = role === 'TEACHER' ? '/teacher' : '/student';
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      <div className="w-full max-w-md">
        {onBack && (
          <button onClick={onBack} className={`flex items-center gap-2 font-semibold mb-4 transition-colors group ${dm ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'}`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors shadow-md ${dm ? 'bg-gray-800 group-hover:bg-indigo-900' : 'bg-white group-hover:bg-indigo-100'}`}>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-sm sm:text-base">Back to Home</span>
          </button>
        )}

        <div className={`rounded-2xl shadow-xl p-6 sm:p-8 border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-13 h-13 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center"><CoachingLogo /></div>
            <h1 className={`text-xl sm:text-2xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Welcome Back</h1>
            <p className={`mt-1.5 text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Sign in to continue learning</p>
          </div>

          {error && (
            <div className={`mb-5 p-3 sm:p-4 rounded-xl flex items-center gap-3 border ${dm ? 'bg-red-950 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <p className="text-xs sm:text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 sm:mb-3 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>I am a:</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  { val: 'STUDENT', icon: GraduationCap, label: 'Student' },
                  { val: 'TEACHER', icon: UserCheck,     label: 'Teacher' },
                ].map(({ val, icon: Icon, label }) => (
                  <button key={val} type="button" onClick={() => setRole(val as any)}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-center ${
                      role === val
                        ? val === 'STUDENT'
                          ? dm ? 'border-blue-500 bg-blue-900/40 text-blue-300' : 'border-blue-500 bg-blue-50 text-blue-700'
                          : dm ? 'border-purple-500 bg-purple-900/40 text-purple-300' : 'border-purple-500 bg-purple-50 text-purple-700'
                        : dm ? 'border-gray-600 hover:border-gray-500 text-gray-400' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 ${role === val ? (val === 'STUDENT' ? 'text-blue-500' : 'text-purple-500') : 'text-gray-400'}`} />
                    <p className="font-semibold text-xs sm:text-sm">{label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  className={`w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`} />
              </div>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required
                  className={`w-full pl-10 sm:pl-11 pr-12 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${dm ? 'border-gray-600' : ''}`} />
                <span className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Remember me</span>
              </label>
              <button type="button" onClick={() => setShowForgot(true)}
                className={`text-xs sm:text-sm font-medium transition-colors ${dm ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-2.5 sm:py-3 font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-sm sm:text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className={`text-center text-xs sm:text-sm mt-5 sm:mt-6 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
            Don't have an account?{' '}
            <button onClick={onSwitchToRegister} className={`font-semibold ${dm ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>Sign up for free</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Register Page ─────────────────────────────────────────────────────────────
const RegisterPage: React.FC<{ onSwitchToLogin: () => void; onBack?: () => void; darkMode: boolean }> = ({ onSwitchToLogin, onBack, darkMode }) => {
  const dm = darkMode;
  const [formData, setFormData]           = useState<FormData>({ name: '', email: '', password: '', confirmPassword: '' });
  const [role, setRole]                   = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [teacherCode, setTeacherCode]     = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const TEACHER_REGISTRATION_CODE = 'P8YGJCVR2';

  const handleChange = (field: keyof FormData, value: string) => { setFormData({ ...formData, [field]: value }); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match!'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters long'); return; }
    if (!agreedToTerms) { setError('Please agree to the Terms of Service and Privacy Policy'); return; }
    if (role === 'TEACHER') {
      if (!teacherCode.trim()) { setError('Please enter the teacher registration code'); return; }
      if (teacherCode.trim() !== TEACHER_REGISTRATION_CODE) { setError('Invalid teacher registration code.'); return; }
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccess(`${role === 'STUDENT' ? 'Student' : 'Teacher'} account created! Logging you in...`);
      setTimeout(async () => {
        try {
          const result = await signIn('credentials', { email: formData.email, password: formData.password, role, redirect: false });
          if (result?.error) { setError('Registration successful but auto-login failed. Please login manually.'); setTimeout(() => onSwitchToLogin(), 2000); }
          else if (result?.ok) { await new Promise(r => setTimeout(r, 500)); window.location.href = role === 'TEACHER' ? '/teacher' : '/student'; }
        } catch { setError('Registration successful. Please login manually.'); setTimeout(() => onSwitchToLogin(), 2000); }
      }, 1000);
    } catch (err: any) {
      setError(err.message.includes('Email already registered') ? 'This email is already registered. Please login instead.' : err.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'}`}>
      <div className="w-full max-w-md">
        {onBack && (
          <button onClick={onBack} className={`flex items-center gap-2 font-semibold mb-4 transition-colors group ${dm ? 'text-gray-300 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'}`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors shadow-md ${dm ? 'bg-gray-800 group-hover:bg-indigo-900' : 'bg-white group-hover:bg-indigo-100'}`}>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-sm sm:text-base">Back to Home</span>
          </button>
        )}

        <div className={`rounded-2xl shadow-xl p-6 sm:p-8 border-2 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-13 h-13 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center"><CoachingLogo /></div>
            <h1 className={`text-xl sm:text-2xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Create Account</h1>
            <p className={`mt-1.5 text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Start your journey today</p>
          </div>

          {error   && <div className={`mb-4 p-3 sm:p-4 rounded-xl flex items-center gap-3 border ${dm ? 'bg-red-950 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}><AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /><p className="text-xs sm:text-sm">{error}</p></div>}
          {success && <div className={`mb-4 p-3 sm:p-4 rounded-xl flex items-center gap-3 border ${dm ? 'bg-green-950 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-600'}`}><CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" /><p className="text-xs sm:text-sm">{success}</p></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 sm:mb-3 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>I want to register as:</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  { val: 'STUDENT', icon: GraduationCap, label: 'Student', sub: 'Learn and grow'    },
                  { val: 'TEACHER', icon: UserCheck,     label: 'Teacher', sub: 'Teach and inspire' },
                ].map(({ val, icon: Icon, label, sub }) => (
                  <button key={val} type="button" onClick={() => { setRole(val as any); setTeacherCode(''); setError(''); }}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-center ${
                      role === val
                        ? val === 'STUDENT'
                          ? dm ? 'border-blue-500 bg-blue-900/40 text-blue-300' : 'border-blue-500 bg-blue-50 text-blue-700'
                          : dm ? 'border-purple-500 bg-purple-900/40 text-purple-300' : 'border-purple-500 bg-purple-50 text-purple-700'
                        : dm ? 'border-gray-600 hover:border-gray-500 text-gray-400' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 ${role === val ? (val === 'STUDENT' ? 'text-blue-500' : 'text-purple-500') : 'text-gray-400'}`} />
                    <p className="font-semibold text-xs sm:text-sm">{label}</p>
                    <p className="text-[10px] sm:text-xs mt-0.5 opacity-70">{sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {role === 'TEACHER' && (
              <div className={`rounded-xl p-3 sm:p-4 border-2 ${dm ? 'bg-purple-950 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
                <label className={`block text-xs sm:text-sm font-medium mb-2 flex items-center gap-2 ${dm ? 'text-purple-300' : 'text-purple-900'}`}>
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Teacher Registration Code *
                </label>
                <input type="text" value={teacherCode} onChange={e => { setTeacherCode(e.target.value.toUpperCase()); setError(''); }} placeholder="Enter teacher code" required
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-purple-300 text-gray-900'}`} maxLength={20} />
                <p className={`text-[10px] sm:text-xs mt-2 flex items-center gap-1 ${dm ? 'text-purple-400' : 'text-purple-700'}`}>
                  <AlertCircle className="w-3 h-3" />Contact administration to get the teacher registration code
                </p>
              </div>
            )}

            {[
              { field: 'name',  label: 'Full Name',     type: 'text',  placeholder: 'John Doe',       icon: UserIcon },
              { field: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', icon: Mail    },
            ].map(({ field, label, type, placeholder, icon: Icon }) => (
              <div key={field}>
                <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input type={type} value={(formData as any)[field]} onChange={e => handleChange(field as keyof FormData, e.target.value)} placeholder={placeholder} required
                    className={`w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`} />
                </div>
              </div>
            ))}

            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => handleChange('password', e.target.value)} placeholder="Create a strong password" required minLength={6}
                  className={`w-full pl-10 sm:pl-11 pr-12 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} placeholder="Confirm your password" required
                  className={`w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm sm:text-base ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`} />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                className={`w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 ${dm ? 'border-gray-600' : 'border-gray-300'}`} />
              <span className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>I agree to the Terms of Service and Privacy Policy</span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl py-2.5 sm:py-3 font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-sm sm:text-base">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className={`text-center text-xs sm:text-sm mt-5 sm:mt-6 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className={`font-semibold ${dm ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}>Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── User Dropdown Menu ────────────────────────────────────────────────────────
function UserMenu({ session, darkMode, toggleDarkMode, onEditProfile, onSettings, onSwitchTeacher, onLogout, userProfile }: any) {
  const dm = darkMode;
  return (
    <div className={`absolute right-0 mt-2 w-60 sm:w-64 rounded-xl shadow-2xl border py-2 z-50 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`px-4 py-3 border-b ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            {userProfile?.avatar
              ? <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-base sm:text-lg">{session.user?.name?.[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{session.user?.name}</p>
            <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{session.user?.email}</p>
          </div>
        </div>
      </div>
      {[
        { icon: Edit,     label: 'Edit Profile', onClick: onEditProfile },
        { icon: Settings, label: 'Settings',     onClick: onSettings    },
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
      {session?.user?.role === 'TEACHER' && (
        <button onClick={onSwitchTeacher}
          className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${dm ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
          <UserCheck className="w-4 h-4" />Teacher View
        </button>
      )}
      <button onClick={onLogout}
        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-red-500 transition-colors ${dm ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
        <LogOut className="w-4 h-4" />Logout
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const ProtectedLanding = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [authScreen, setAuthScreen]         = useState<'login' | 'register' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled]             = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [currentScreen, setCurrentScreen]   = useState('home');
  const [showUserMenu, setShowUserMenu]     = useState(false);
  const [darkMode, setDarkMode]             = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings]     = useState(false);
  const [userProfile, setUserProfile]       = useState<any>(null);

  // ── ref for the user-menu trigger button (desktop + feature screen) ──
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside of it
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    // small delay so the open-click itself doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [showUserMenu]);

  // Close mobile menu when clicking outside of it
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [mobileMenuOpen]);

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
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const interval = setInterval(() => setActiveTestimonial(p => (p + 1) % 3), 5000);
    return () => { window.removeEventListener('scroll', handleScroll); clearInterval(interval); };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [currentScreen, authScreen]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch(`/api/user/profile/${session.user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUserProfile(data); })
        .catch(() => {});
    }
  }, [session, status]);

  const handleLogout = async () => { await signOut({ callbackUrl: '/' }); setCurrentScreen('home'); setShowUserMenu(false); };
  const handleProfileUpdate = async (data: any) => { setUserProfile(data); await update(); };

  const platformFeatures = [
    { id: 'notes',         icon: BookOpen,      title: 'Study Notes Library',   description: 'Access comprehensive study materials and notes shared by expert teachers', color: 'from-blue-500 to-cyan-500',     tag: 'Most Popular',  component: <NotesLibrary /> },
    { id: 'assignments',   icon: FileText,      title: 'Smart Assignments',     description: 'AI-powered assignment system with automatic grading and detailed feedback', color: 'from-purple-500 to-pink-500',   tag: 'Top Rated',     component: <StudentAssignmentDashboard /> },
    { id: 'study-planner', icon: Brain,         title: 'AI Study Planner',      description: 'Get personalized study schedules based on your goals, pace, and performance', color: 'from-indigo-500 to-purple-500', tag: 'AI Powered',    component: <StudyPlanner /> },
    { id: 'teacher',       icon: UserCheck,     title: 'Teacher Dashboard',     description: 'Comprehensive management tools for educators to track and mentor students', color: 'from-orange-500 to-red-500',    tag: 'Professional',  component: <TeacherInterface /> },
    { id: 'quizzes',       icon: Target,        title: 'Practice & Mock Tests', description: 'Unlimited quizzes with instant AI evaluation and performance analytics',   color: 'from-green-500 to-teal-500',    tag: 'Exam Ready',    component: <QuizInterface /> },
    { id: 'videos',        icon: Play,          title: 'Video Library',         description: 'Access high-quality recorded lectures available 24/7',                    color: 'from-rose-500 to-pink-500',     tag: 'On Demand',     component: <VideoPlayer /> },
    { id: 'doubts',        icon: MessageSquare, title: 'Instant Doubt Solving', description: 'Get answers from AI tutor instantly or connect with expert mentors',      color: 'from-yellow-500 to-orange-500', tag: 'Always Active', component: <DoubtComponent /> },
    { id: 'payments',      icon: CreditCard,    title: 'Secure Payments',       description: 'Safe and encrypted payment gateway with multiple payment options',        color: 'from-emerald-500 to-green-500', tag: 'Protected',     component: <PaymentDemo /> },
  ];

  const stats = [
    { value: '100+', label: 'Active Students', icon: Users        },
    { value: '95%',  label: 'Success Rate',    icon: Trophy       },
    { value: '4',    label: 'Expert Teachers', icon: GraduationCap },
    { value: '24/7', label: 'Support',         icon: Clock        },
  ];

  const testimonials = [
    {
      name: 'Tanzeel', role: 'JEE Aspirant', image: '/testimonials/student1.jpg', initials: 'T',
      text: 'It is not just an ordinary coaching centre. It is very different. where every teacher is fully dedicated to teach the students. I know the teachers personally. It is more then so call worth it.....',
      rating: 5, course: 'JEE Mains 2025',
    },
    {
      name: 'Amit Sharma', role: 'Student', image: '/testimonials/student2.jpg', initials: 'AS',
      text: 'Best institute for all subjects 👌',
      rating: 5, course: 'NEET 2024',
    },
    {
      name: 'Yash', role: 'Student', image: '/testimonials/student3.jpg', initials: 'Y',
      text: "I've had a fantastic experience at this institute. The faculty is highly knowledgeable and always willing to go the extra mile to ensure students understand the concepts. Highly recommended for anyone looking to excel in their studies!",
      rating: 5, course: 'JEE Mains 2024',
    },
  ];

  const benefits = [
    { icon: Shield,     text: 'Industry-leading security' },
    { icon: Globe,      text: 'Learn from anywhere'       },
    { icon: Award,      text: 'Certified courses'         },
    { icon: Headphones, text: '24/7 support'              },
    { icon: Lock,       text: 'Privacy guaranteed'        },
    { icon: Zap,        text: 'Instant access'            },
  ];

  const openFeature = (id: string) => { if (!session) { setAuthScreen('register'); return; } setCurrentScreen(id); };
  const goHome = () => setCurrentScreen('home');
  const currentFeature = platformFeatures.find(f => f.id === currentScreen);
  const handleBookDemo = () => { router.push('/contact'); };

  const userMenuProps = {
    session, darkMode, toggleDarkMode,
    onEditProfile:   () => { setShowEditProfile(true); setShowUserMenu(false); setMobileMenuOpen(false); },
    onSettings:      () => { setShowSettings(true);    setShowUserMenu(false); setMobileMenuOpen(false); },
    onSwitchTeacher: () => { router.push('/teacher');  setShowUserMenu(false); setMobileMenuOpen(false); },
    onLogout:        () => { handleLogout();            setMobileMenuOpen(false); },
    userProfile,
  };

  if (authScreen === 'login')    return <LoginPage    onSwitchToRegister={() => setAuthScreen('register')} onBack={() => setAuthScreen(null)} darkMode={dm} />;
  if (authScreen === 'register') return <RegisterPage onSwitchToLogin={() => setAuthScreen('login')}       onBack={() => setAuthScreen(null)} darkMode={dm} />;

  // ── Feature Screen ──────────────────────────────────────────────────────────
  if (currentScreen !== 'home' && currentFeature && session) {
    return (
      <div className={`min-h-screen transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        <nav className={`sticky top-0 z-50 shadow-lg ${dm ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <button onClick={goHome}
                className={`flex items-center gap-2 font-semibold transition-colors group flex-shrink-0 ${dm ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'}`}>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${dm ? 'bg-gray-700 group-hover:bg-indigo-900' : 'bg-gray-100 group-hover:bg-indigo-100'}`}>
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="hidden sm:inline text-sm sm:text-base">Back to Home</span>
              </button>
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-center">
                <div className={`w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br ${currentFeature.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <currentFeature.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="hidden sm:block min-w-0">
                  <h1 className={`text-base sm:text-lg font-bold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{currentFeature.title}</h1>
                  <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{currentFeature.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={toggleDarkMode}
                  className={`p-2 rounded-xl hover:scale-110 transition-all ${dm ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
                  {dm ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                <button onClick={goHome} className="hidden md:flex items-center gap-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center"><CoachingLogo /></div>
                  <span className={`font-bold text-base lg:text-xl ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Intense Learners</span>
                </button>
                {/* ── User menu (feature screen) ── */}
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setShowUserMenu(v => !v)}
                    className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all text-xs sm:text-sm">
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline truncate max-w-[80px] sm:max-w-[120px]">{session.user?.name}</span>
                  </button>
                  {showUserMenu && <UserMenu {...userMenuProps} />}
                </div>
              </div>
            </div>
          </div>
        </nav>

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

        {showEditProfile && <EditProfileModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} userProfile={userProfile} onUpdate={handleProfileUpdate} darkMode={dm} />}
        {showSettings    && <SettingsModal    isOpen={showSettings}    onClose={() => setShowSettings(false)}    darkMode={dm} onDarkModeToggle={toggleDarkMode} />}
      </div>
    );
  }

  // ── Home / Landing Screen ───────────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors ${dm ? 'bg-gray-900' : 'bg-white'}`}>

      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? `${dm ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-lg shadow-lg py-2 sm:py-3` : 'bg-transparent py-3 sm:py-4'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8" ref={mobileMenuRef}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center"><CoachingLogo /></div>
              <div>
                <span className={`text-base sm:text-xl lg:text-2xl font-bold ${scrolled ? (dm ? 'text-gray-100' : 'text-gray-900') : 'text-white'}`}>Intense Learners</span>
                <div className={`text-[10px] sm:text-xs hidden sm:block ${scrolled ? (dm ? 'text-gray-400' : 'text-gray-600') : 'text-purple-200'}`}>Learn with intensity</div>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {[
                { href: '#platform',     label: 'Features'       },
                ...(!session ? [{ href: '#how-it-works', label: 'How It Works' }] : []),
                { href: '#testimonials', label: 'Success Stories' },
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
              {session ? (
                /* ── Desktop user menu ── */
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setShowUserMenu(v => !v)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all text-sm lg:text-base">
                    <UserIcon className="w-4 h-4" />{session.user?.name}
                  </button>
                  {showUserMenu && <UserMenu {...userMenuProps} />}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => setAuthScreen('login')}
                    className="flex items-center gap-2 border-2 border-white/30 text-white px-5 py-2 rounded-xl font-semibold hover:bg-white/10 transition-all text-sm lg:text-base">
                    <LogIn className="w-4 h-4" />Login
                  </button>
                  <button onClick={() => setAuthScreen('register')}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all text-sm lg:text-base">
                    <UserPlus className="w-4 h-4" />Register
                  </button>
                </div>
              )}
            </div>

            {/* Mobile right side */}
            <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
              <button onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all ${scrolled ? (dm ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600') : 'bg-white/15 text-white hover:bg-white/25'}`}>
                {dm ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button onClick={() => setMobileMenuOpen(v => !v)} className="p-2 rounded-lg hover:bg-gray-100/10 transition-colors">
                {mobileMenuOpen
                  ? <X    className={`w-5 h-5 sm:w-6 sm:h-6 ${scrolled ? (dm ? 'text-gray-100' : 'text-gray-900') : 'text-white'}`} />
                  : <Menu className={`w-5 h-5 sm:w-6 sm:h-6 ${scrolled ? (dm ? 'text-gray-100' : 'text-gray-900') : 'text-white'}`} />}
              </button>
            </div>
          </div>

          {/* Mobile menu panel — inside the ref'd container so outside-clicks work */}
          {mobileMenuOpen && (
            <div className={`lg:hidden mt-3 sm:mt-4 rounded-2xl shadow-2xl p-4 sm:p-6 border ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex flex-col gap-3 sm:gap-4">
                {[
                  { href: '#platform',     label: 'Features'       },
                  ...(!session ? [{ href: '#how-it-works', label: 'How It Works' }] : []),
                  { href: '#testimonials', label: 'Success Stories' },
                ].map(({ href, label }) => (
                  <a key={label} href={href} onClick={() => setMobileMenuOpen(false)}
                    className={`font-medium py-1.5 text-sm sm:text-base ${dm ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'}`}>{label}</a>
                ))}
                {session ? (
                  <>
                    <div className={`border-t pt-3 sm:pt-4 ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          {userProfile?.avatar
                            ? <img src={userProfile.avatar} alt="" className="w-full h-full object-cover" />
                            : <span className="text-white font-bold">{session.user?.name?.[0]}</span>}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{session.user?.name}</p>
                          <p className={`text-xs truncate ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{session.user?.email}</p>
                        </div>
                      </div>
                    </div>
                    {[
                      { icon: Edit,     label: 'Edit Profile', onClick: userMenuProps.onEditProfile },
                      { icon: Settings, label: 'Settings',     onClick: userMenuProps.onSettings    },
                    ].map(({ icon: Icon, label, onClick }) => (
                      <button key={label} onClick={onClick}
                        className={`flex items-center gap-2 font-medium py-1.5 text-sm sm:text-base ${dm ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'}`}>
                        <Icon className="w-4 h-4" />{label}
                      </button>
                    ))}
                    {session?.user?.role === 'TEACHER' && (
                      <button onClick={userMenuProps.onSwitchTeacher}
                        className={`flex items-center gap-2 font-medium py-1.5 text-sm sm:text-base ${dm ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-700 hover:text-indigo-600'}`}>
                        <UserCheck className="w-4 h-4" />Teacher View
                      </button>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-400 font-medium py-1.5 text-sm sm:text-base">
                      <LogOut className="w-4 h-4" />Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { setAuthScreen('login'); setMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 border-2 border-indigo-600 text-indigo-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-50 transition-all text-sm sm:text-base">
                      <LogIn className="w-4 h-4" />Login
                    </button>
                    <button onClick={() => { setAuthScreen('register'); setMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:shadow-xl transition-all text-sm sm:text-base">
                      <UserPlus className="w-4 h-4" />Register
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Modals */}
      {showEditProfile && <EditProfileModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} userProfile={userProfile} onUpdate={handleProfileUpdate} darkMode={dm} />}
      {showSettings    && <SettingsModal    isOpen={showSettings}    onClose={() => setShowSettings(false)}    darkMode={dm} onDarkModeToggle={toggleDarkMode} />}

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="absolute top-20 left-10 w-40 h-40 sm:w-64 sm:h-64 lg:w-72 lg:h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 sm:w-64 sm:h-64 lg:w-72 lg:h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6 border border-white/20 text-xs sm:text-sm">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                <span className="font-semibold">India's Most Advanced AI Learning Platform</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                Learn with
                <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent mt-1 sm:mt-2">Intensity</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-xl text-purple-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Join 100+ students achieving their dreams with personalized AI study plans, live expert classes, and 24/7 intelligent support.
              </p>
              <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 mb-6 sm:mb-10 justify-center lg:justify-start">
                <button onClick={() => session ? openFeature('study-planner') : setAuthScreen('register')}
                  className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                  {session ? 'Go to Dashboard' : 'Start Learning Free'}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={handleBookDemo} className="group bg-white/10 backdrop-blur-lg text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 border-2 border-white/20">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />Book a Demo
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-6 justify-center lg:justify-start">
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
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            target.parentElement.innerHTML = `<span class="w-full h-full flex items-center justify-center text-white font-bold text-xs">${String.fromCharCode(64 + i)}</span>`;
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
                  <p className="text-purple-200 text-xs sm:text-sm font-medium">100+ Happy Students</p>
                </div>
              </div>
            </div>

            {/* Hero card */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur-3xl opacity-20 animate-pulse" />
              <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-6 lg:p-8 border border-white/20 shadow-2xl">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-4 lg:p-6 mb-4 lg:mb-6">
                  <div className="aspect-video rounded-xl overflow-hidden relative">
                    <video src="/hero-video.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-blue-900/40 to-transparent pointer-events-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  {[
                    { icon: Brain,  label: 'AI Tutor',   sub: 'Instant Answers',  color: 'text-yellow-400' },
                    { icon: Target, label: 'Mock Tests',  sub: 'Unlimited Access', color: 'text-green-400'  },
                  ].map(({ icon: Icon, label, sub, color }) => (
                    <div key={label} className="bg-white/10 backdrop-blur-lg rounded-xl p-3 lg:p-4 border border-white/20">
                      <Icon className={`w-6 h-6 lg:w-8 lg:h-8 ${color} mb-2`} />
                      <p className="text-white font-bold text-base lg:text-lg">{label}</p>
                      <p className="text-purple-200 text-xs">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 sm:mt-14 lg:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 sm:gap-6">
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

      {/* Platform Features */}
      <div id="platform" className={`py-14 sm:py-20 lg:py-28 ${dm ? 'bg-gray-900' : 'bg-gradient-to-b from-white via-gray-50 to-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14 lg:mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 text-xs sm:text-sm">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" /><span className="font-semibold">COMPLETE LEARNING ECOSYSTEM</span>
            </div>
            <h2 className={`text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 px-4 ${dm ? 'text-white' : 'text-gray-900'}`}>
              Access Our Entire
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-1 sm:mt-2">Learning Platform</span>
            </h2>
            <p className={`text-sm sm:text-base lg:text-xl max-w-3xl mx-auto px-4 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              {session ? 'Click any card below to explore our powerful tools' : 'Sign up to unlock all features and start your learning journey'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {platformFeatures.map((feature) => (
              <button key={feature.id} onClick={() => openFeature(feature.id)}
                className={`group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-indigo-500 overflow-hidden text-left w-full ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                {!session && <div className="absolute top-3 left-3 bg-gray-900/80 text-white p-1.5 rounded-lg"><Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>}
                {feature.tag && <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">{feature.tag}</div>}
                <div className={`inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl mb-3 sm:mb-4 lg:mb-5 group-hover:scale-110 transition-transform shadow-lg ${!session ? 'opacity-50' : ''}`}>
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className={`text-sm sm:text-base lg:text-xl font-bold mb-1.5 sm:mb-2 lg:mb-3 group-hover:text-indigo-600 transition-colors ${dm ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                <p className={`text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{feature.description}</p>
                <div className={`flex items-center justify-end pt-3 border-t ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
              </button>
            ))}
          </div>

          {!session && (
            <div className="text-center mt-10 sm:mt-12">
              <button onClick={() => setAuthScreen('register')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl hover:scale-105 transition-all">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />Sign Up to Unlock All Features<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      {!session && (
        <div id="how-it-works" className="py-14 sm:py-20 lg:py-28 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14 lg:mb-16">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
                Get Started in <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">3 Simple Steps</span>
              </h2>
              <p className="text-sm sm:text-base lg:text-xl text-gray-600 px-4">Your journey to success begins here</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 sm:gap-8 lg:gap-12 relative">
              <div className="hidden sm:block absolute top-10 sm:top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
              {[
                { step: '01', title: 'Create Account',     desc: 'Sign up in 30 seconds and tell us your goals',  icon: GraduationCap, color: 'from-blue-500 to-cyan-500'   },
                { step: '02', title: 'AI Personalization', desc: 'Get your custom study plan powered by AI',       icon: Brain,         color: 'from-purple-500 to-pink-500' },
                { step: '03', title: 'Start Learning',     desc: 'Access all features and begin your journey',     icon: Zap,           color: 'from-orange-500 to-red-500'  },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-200">
                  <div className={`inline-flex items-center justify-center w-14 h-14 lg:w-20 lg:h-20 bg-gradient-to-br ${item.color} rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-lg`}>
                    <item.icon className="w-7 h-7 lg:w-10 lg:h-10 text-white" />
                  </div>
                  <div className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-100 mb-2 sm:mb-4">{item.step}</div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm lg:text-base leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Testimonials */}
      <div id="testimonials" className="py-14 sm:py-20 lg:py-28 bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14 lg:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-6 px-4">Real Success Stories</h2>
            <p className="text-sm sm:text-base lg:text-xl text-purple-200 px-4">From students who trusted Intense Learners</p>
          </div>
          <div className="max-w-4xl lg:max-w-5xl mx-auto relative min-h-[380px] sm:min-h-[340px]">
            {testimonials.map((t, idx) => (
              <div key={idx} className={`transition-all duration-700 ${idx === activeTestimonial ? 'opacity-100 scale-100 relative' : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'}`}>
                <div className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-12 border border-white/20 shadow-2xl">
                  <div className="flex text-yellow-400 mb-4 sm:mb-6 justify-center lg:justify-start">
                    {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 fill-current" />)}
                  </div>
                  <p className="text-base sm:text-xl lg:text-2xl xl:text-3xl text-white mb-5 sm:mb-8 leading-relaxed font-light">"{t.text}"</p>
                  <div className="flex items-center gap-3 sm:gap-4 flex-col sm:flex-row text-center sm:text-left">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Image src={t.image} alt={t.name} width={64} height={64} className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            target.parentElement.innerHTML = `<span class="text-white font-bold text-lg sm:text-xl lg:text-2xl">${t.initials}</span>`;
                          }
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-white font-bold text-base sm:text-lg lg:text-xl">{t.name}</div>
                      <div className="text-purple-200 font-medium text-xs sm:text-sm lg:text-base">{t.role}</div>
                      <div className="text-purple-300 text-[10px] sm:text-xs lg:text-sm">{t.course}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 sm:gap-3 mt-6 sm:mt-10">
            {testimonials.map((_, idx) => (
              <button key={idx} onClick={() => setActiveTestimonial(idx)}
                className={`transition-all rounded-full ${idx === activeTestimonial ? 'bg-white w-8 sm:w-10 lg:w-12 h-2 sm:h-2.5 lg:h-3' : 'bg-white/30 hover:bg-white/50 w-2 sm:w-2.5 lg:w-3 h-2 sm:h-2.5 lg:h-3'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className={`py-10 sm:py-14 lg:py-16 ${dm ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-5 lg:gap-6">
            {benefits.map((b, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-2">
                  <b.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className={`text-[10px] sm:text-xs lg:text-sm font-medium ${dm ? 'text-gray-400' : 'text-gray-700'}`}>{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-14 sm:py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2Mi1oMnYtMnptMC00djJoMnYtMnptMC00djJoMnYtMnptMC00djJoMnYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 px-4">Ready to Transform Your Future?</h2>
          <p className="text-sm sm:text-base lg:text-xl xl:text-2xl text-purple-100 mb-7 sm:mb-10 max-w-3xl mx-auto px-4">
            Join 100+ students already learning with Intense Learners. Start your free trial today.
          </p>
          <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center px-4">
            <button onClick={() => session ? openFeature('study-planner') : setAuthScreen('register')}
              className="group bg-white text-purple-900 px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-5 rounded-xl font-bold text-base sm:text-lg lg:text-xl hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center justify-center gap-2 sm:gap-3">
              {session ? 'Go to Your Dashboard' : 'Start Free Trial Now'}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={handleBookDemo} className="bg-white/10 backdrop-blur-lg text-white px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-5 rounded-xl font-bold text-base sm:text-lg lg:text-xl hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2 sm:gap-3 border-2 border-white/30">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />Book a Demo
            </button>
          </div>
          <p className="text-purple-200 mt-4 sm:mt-6 text-xs sm:text-sm px-4">✓ 5-day free trial &nbsp;&nbsp;&nbsp; ✓ Cancel anytime</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 sm:py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0"><CoachingLogo /></div>
                <div>
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold">Intense Learners</span>
                  <div className="text-xs text-gray-400">Learn with intensity</div>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-5 text-xs sm:text-sm lg:text-base">
                Transforming education through artificial intelligence and expert teaching. Join Hundreds of students achieving their dreams.
              </p>
              <div className="flex gap-3">
                {Object.entries(socialLinks).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors text-gray-400 hover:text-white"
                    aria-label={platform}>
                    {socialIcons[platform]}
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Platform', items: [
                { label: 'Study Notes',      id: 'notes'        },
                { label: 'Assignments',      id: 'assignments'  },
                { label: 'AI Study Planner', id: 'study-planner'},
                { label: 'Mock Tests',       id: 'quizzes'      },
              ]},
              { title: 'Resources', links: ['Blog', 'Help Center', 'Community', 'Contact Us'] },
              { title: 'Legal',     links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">{col.title}</h4>
                <ul className="space-y-2 sm:space-y-3 text-gray-400 text-xs sm:text-sm lg:text-base">
                  {(col as any).items
                    ? (col as any).items.map((item: any) => (
                        <li key={item.label}><button onClick={() => openFeature(item.id)} className="hover:text-white transition-colors">{item.label}</button></li>
                      ))
                    : (col as any).links?.map((l: string) => (
                        <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                      ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-5 sm:pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <p className="text-gray-400 text-center sm:text-left">© 2026 Intense Learners. All rights reserved.</p>
              <div className="flex flex-wrap gap-2 sm:gap-6 text-gray-400 text-center justify-center">
                <span>Made with ❤️ in India</span>
                <span className="hidden sm:inline">•</span>
                <span>Trusted by 100+ students</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProtectedLanding;