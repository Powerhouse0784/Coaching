'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { KeyRound, Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowLeft, Loader } from 'lucide-react';
import Image from 'next/image';

function CoachingLogo() {
  return (
    <Image src="/coaching-icon.png" alt="Intense Learners" width={48} height={48} priority />
  );
}

// ── Inner component that uses useSearchParams ─────────────────────────────────
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [step,            setStep]            = useState<'form' | 'success' | 'invalid'>('form');
  const [error,           setError]           = useState('');

  // Basic guard — if no token/email in URL, show invalid state
  useEffect(() => {
    if (!token || !email) {
      setStep('invalid');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setStep('success');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Password strength indicator ──
  const getStrength = () => {
    if (!password) return { label: '', color: '', width: '0%' };
    if (password.length < 6)  return { label: 'Too short', color: 'bg-red-500',    width: '25%' };
    if (password.length < 8)  return { label: 'Weak',      color: 'bg-orange-500', width: '40%' };
    if (password.length < 10) return { label: 'Fair',      color: 'bg-yellow-500', width: '60%' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password))
      return { label: 'Strong', color: 'bg-green-500', width: '100%' };
    return { label: 'Good',   color: 'bg-blue-500',   width: '80%' };
  };

  const strength = getStrength();

  // ── Invalid link state ──
  if (step === 'invalid') {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Invalid Reset Link</h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-2.5 sm:py-3 font-semibold hover:shadow-lg transition-all text-sm sm:text-base">
          Back to Sign In
        </button>
      </div>
    );
  }

  // ── Success state ──
  if (step === 'success') {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center">
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Password Updated!</h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-2.5 sm:py-3 font-semibold hover:shadow-lg transition-all text-sm sm:text-base">
          Sign In Now
        </button>
      </div>
    );
  }

  // ── Reset form ──
  return (
    <>
      {error && (
        <div className="mb-5 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Email display */}
      <div className="mb-5 p-3 sm:p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
        <p className="text-xs sm:text-sm text-indigo-700">
          Setting new password for: <strong className="font-semibold">{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New password */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              minLength={6}
              className="w-full pl-10 sm:pl-11 pr-12 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm sm:text-base text-gray-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>

          {/* Strength bar */}
          {password && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className={`text-[10px] sm:text-xs mt-1 font-medium ${
                strength.label === 'Strong' ? 'text-green-600' :
                strength.label === 'Good'   ? 'text-blue-600'  :
                strength.label === 'Fair'   ? 'text-yellow-600': 'text-orange-600'
              }`}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-gray-700">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
              className={`w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm sm:text-base text-gray-900 ${
                confirmPassword && confirmPassword !== password
                  ? 'border-red-300 bg-red-50'
                  : confirmPassword && confirmPassword === password
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200'
              }`}
            />
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="text-[10px] sm:text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
          {confirmPassword && confirmPassword === password && (
            <p className="text-[10px] sm:text-xs text-green-500 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />Passwords match
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || password !== confirmPassword || password.length < 6}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-2.5 sm:py-3 font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm sm:text-base mt-2">
          {loading
            ? <><Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />Updating Password...</>
            : <><KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />Set New Password</>}
        </button>
      </form>
    </>
  );
}

// ── Page wrapper ───────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Back link */}
        <a href="/"
          className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 font-semibold mb-4 transition-colors group w-fit">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white group-hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-colors shadow-md">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-sm sm:text-base">Back to Home</span>
        </a>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-13 h-13 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center">
              <CoachingLogo />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Set New Password</h1>
            <p className="text-gray-600 mt-1.5 text-xs sm:text-sm">
              Choose a strong password to secure your account
            </p>
          </div>

          {/* Suspense boundary required because useSearchParams needs it in Next.js 13+ */}
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>

        </div>
      </div>
    </div>
  );
}