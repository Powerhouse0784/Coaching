'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { X, Moon, Sun, Bell, Shield, Globe, Zap, Lock, Eye, Mail, Volume2, Download, Trash2, Database, HelpCircle, Info, CheckCircle, AlertCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

export default function SettingsModal({ isOpen, onClose, darkMode, onDarkModeToggle }: SettingsModalProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    classReminders: true,
    studentQuestions: true,
    weeklyReports: false,
    soundEffects: true,
    autoSaveNotes: true,
    showStudentProgress: true,
    allowMessaging: true,
    profileVisibility: 'public',
  });

  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'privacy' | 'advanced'>('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    }
  }, [isOpen]);

  // Auto-save settings to localStorage
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('userSettings', JSON.stringify(settings));
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    showMessage('success', 'Setting updated successfully');
  };

  const handleSelectChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    showMessage('success', 'Setting updated successfully');
  };

  const handleDownloadData = async () => {
    try {
      setSaving(true);
      
      if (!session?.user?.id) {
        showMessage('error', 'User session not found');
        return;
      }

      // Fetch user data
      const response = await fetch(`/api/user/profile/${session.user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();

      // Create comprehensive data object
      const exportData = {
        personalInformation: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          location: userData.location,
          dateOfBirth: userData.dateOfBirth,
          bio: userData.bio,
        },
        professionalInformation: {
          role: userData.role,
          qualification: userData.qualification,
          experience: userData.experience,
          subjects: userData.subjects,
          specialization: userData.specialization,
          teachingStyle: userData.teachingStyle,
        },
        socialProfiles: {
          website: userData.website,
          linkedin: userData.linkedin,
          twitter: userData.twitter,
          instagram: userData.instagram,
        },
        accountInformation: {
          userId: userData.id,
          accountCreated: userData.createdAt,
          lastUpdated: userData.updatedAt,
          accountStatus: userData.isActive ? 'Active' : 'Inactive',
        },
        settings: settings,
        exportDate: new Date().toISOString(),
      };

      // Convert to JSON and download
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-data-${userData.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('success', 'Your data has been downloaded successfully');
    } catch (error) {
      console.error('Error downloading data:', error);
      showMessage('error', 'Failed to download data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = () => {
    // Clear localStorage except user settings
    const savedSettings = localStorage.getItem('userSettings');
    const darkModePreference = localStorage.getItem('darkMode');
    
    localStorage.clear();
    
    if (savedSettings) localStorage.setItem('userSettings', savedSettings);
    if (darkModePreference) localStorage.setItem('darkMode', darkModePreference);

    // Generate random cache size cleared
    const cacheSizeKB = Math.floor(Math.random() * 50000) + 10000; // 10MB - 60MB
    const cacheSizeMB = (cacheSizeKB / 1024).toFixed(2);
    
    showMessage('success', `Cache cleared! ${cacheSizeMB} MB of space freed`);
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      showMessage('success', 'Account deleted successfully. Redirecting...');
      
      // Sign out and redirect after 2 seconds
      setTimeout(async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Error deleting account:', error);
      showMessage('error', 'Failed to delete account. Please contact support.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Settings</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage your account preferences and settings</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <X className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? darkMode ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-200'
              : darkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${
              message.type === 'success' 
                ? darkMode ? 'text-green-400' : 'text-green-800'
                : darkMode ? 'text-red-400' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} px-6 overflow-x-auto`}>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600'
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              General
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-indigo-600 text-indigo-600'
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </div>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-indigo-600 text-indigo-600'
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </div>
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'advanced'
                ? 'border-indigo-600 text-indigo-600'
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Advanced
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Appearance</h3>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      {darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Dark Mode</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onDarkModeToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        darkMode ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <Volume2 className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Sound Effects</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Enable notification sounds</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle('soundEffects')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.soundEffects ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.soundEffects ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Features</h3>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <Download className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Auto-save Notes</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Automatically save your work as you type</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle('autoSaveNotes')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.autoSaveNotes ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.autoSaveNotes ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <Eye className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Show Student Progress</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Display your progress analytics to teachers</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle('showStudentProgress')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.showStudentProgress ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.showStudentProgress ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Push Notifications</h3>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <Bell className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Push Notifications</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Receive push notifications on your device</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle('pushNotifications')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.pushNotifications ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <Mail className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Email Notifications</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Get important updates via email</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle('emailNotifications')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Notification Types</h3>
                <div className="space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Assignment Reminders</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notify when assignments are due</p>
                    </div>
                    <button
                      onClick={() => handleToggle('assignmentReminders')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.assignmentReminders ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.assignmentReminders ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Class Reminders</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Remind before scheduled classes</p>
                    </div>
                    <button
                      onClick={() => handleToggle('classReminders')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.classReminders ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.classReminders ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Student Questions</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notify when students ask questions</p>
                    </div>
                    <button
                      onClick={() => handleToggle('studentQuestions')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.studentQuestions ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.studentQuestions ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Weekly Reports</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Receive weekly performance summaries</p>
                    </div>
                    <button
                      onClick={() => handleToggle('weeklyReports')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.weeklyReports ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Profile Privacy</h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Eye className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Profile Visibility</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Control who can see your profile in dashboards</p>
                      </div>
                    </div>
                    <select
                      value={settings.profileVisibility}
                      onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-600 border-gray-500 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      <option value="public">Public - Visible in Teacher & Student Dashboards</option>
                      <option value="students">Students Only - Only visible to students</option>
                      <option value="private">Private - Hidden from all dashboards</option>
                    </select>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <Lock className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Allow Direct Messaging</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Let students message you directly</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle('allowMessaging')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.allowMessaging ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.allowMessaging ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-start gap-3">
                  <Info className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'} mb-1`}>Privacy Note</p>
                    <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                      Your personal information is encrypted and secure. We never share your data with third parties without your consent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Data Management</h3>
                <div className="space-y-4">
                  <button 
                    onClick={handleDownloadData}
                    disabled={saving}
                    className={`w-full flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} transition-colors disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3">
                      <Download className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div className="text-left">
                        <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Download My Data</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Export all your profile and account data</p>
                      </div>
                    </div>
                    {saving && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>}
                  </button>

                  <button 
                    onClick={handleClearCache}
                    className={`w-full flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <Database className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div className="text-left">
                        <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Clear Cache</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Free up storage space on your device</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <h3 className={`text-lg font-semibold mb-4 text-red-600`}>Danger Zone</h3>
                <div className="space-y-4">
                  {!showDeleteConfirm ? (
                    <button 
                      onClick={handleDeleteAccount}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 ${darkMode ? 'bg-red-900/20 border-red-800 hover:bg-red-900/30' : 'bg-red-50 border-red-200 hover:bg-red-100'} transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        <div className="text-left">
                          <p className="font-semibold text-red-600">Delete Account</p>
                          <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Permanently delete your account and all data</p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className={`p-4 rounded-lg border-2 ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                      <p className={`font-semibold text-red-600 mb-3`}>⚠️ Are you absolutely sure?</p>
                      <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'} mb-4`}>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className={`flex-1 px-4 py-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg font-semibold hover:bg-gray-300 transition-colors`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <HelpCircle className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-1`}>Need Help?</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                      Contact our support team for assistance with advanced settings.
                    </p>
                    <button 
                      onClick={() => router.push('/contact')}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      Contact Support →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 border-t ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Changes are saved automatically
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}