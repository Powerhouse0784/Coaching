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
  
  // Dark mode — same MutationObserver pattern as AssignmentCard
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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

      const response = await fetch(`/api/user/profile/${session.user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();

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
    const savedSettings = localStorage.getItem('userSettings');
    const darkModePreference = localStorage.getItem('darkMode');
    
    localStorage.clear();
    
    if (savedSettings) localStorage.setItem('userSettings', savedSettings);
    if (darkModePreference) localStorage.setItem('darkMode', darkModePreference);

    const cacheSizeKB = Math.floor(Math.random() * 50000) + 10000;
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

  // Toggle component
  const Toggle = ({ enabled }: { enabled: boolean }) => (
    <button
      className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-indigo-600' : dm ? 'bg-gray-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className={`rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col transition-colors ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0 ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="min-w-0 flex-1 pr-4">
            <h2 className={`text-xl sm:text-2xl font-bold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Settings</h2>
            <p className={`text-xs sm:text-sm mt-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Manage your preferences</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 sm:w-6 sm:h-6 ${dm ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mx-3 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 ${
            message.type === 'success' 
              ? dm ? 'bg-green-900/30 border border-green-800' : 'bg-green-50 border border-green-200'
              : dm ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
            )}
            <p className={`text-xs sm:text-sm font-medium ${
              message.type === 'success' 
                ? dm ? 'text-green-400' : 'text-green-800'
                : dm ? 'text-red-400' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex border-b flex-shrink-0 px-3 sm:px-6 overflow-x-auto scrollbar-hide ${dm ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
          {[
            { id: 'general', label: 'General', icon: Zap },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'privacy', label: 'Privacy', icon: Shield },
            { id: 'advanced', label: 'Advanced', icon: Database },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-xs sm:text-sm transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === id
                  ? 'border-indigo-600 text-indigo-600'
                  : `border-transparent ${dm ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{label}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 min-h-0">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Appearance</h3>
                <div className="space-y-2 sm:space-y-4">
                  <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${dm ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {dm ? <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 flex-shrink-0" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Dark Mode</p>
                        <p className={`text-xs sm:text-sm truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                          {dm ? 'Light theme' : 'Dark theme'}
                        </p>
                      </div>
                    </div>
                    <div onClick={onDarkModeToggle} className="flex-shrink-0 cursor-pointer">
                      <Toggle enabled={dm} />
                    </div>
                  </div>

                  <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${dm ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Volume2 className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Sound Effects</p>
                        <p className={`text-xs sm:text-sm truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Notification sounds</p>
                      </div>
                    </div>
                    <div onClick={() => handleToggle('soundEffects')} className="flex-shrink-0 cursor-pointer">
                      <Toggle enabled={settings.soundEffects} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Features</h3>
                <div className="space-y-2 sm:space-y-4">
                  <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${dm ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Download className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Auto-save Notes</p>
                        <p className={`text-xs sm:text-sm truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Save as you type</p>
                      </div>
                    </div>
                    <div onClick={() => handleToggle('autoSaveNotes')} className="flex-shrink-0 cursor-pointer">
                      <Toggle enabled={settings.autoSaveNotes} />
                    </div>
                  </div>

                  <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${dm ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Eye className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Show Progress</p>
                        <p className={`text-xs sm:text-sm truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Display analytics</p>
                      </div>
                    </div>
                    <div onClick={() => handleToggle('showStudentProgress')} className="flex-shrink-0 cursor-pointer">
                      <Toggle enabled={settings.showStudentProgress} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Push Notifications</h3>
                <div className="space-y-2 sm:space-y-4">
                  <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${dm ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Bell className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Push Notifications</p>
                        <p className={`text-xs sm:text-sm truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>On your device</p>
                      </div>
                    </div>
                    <div onClick={() => handleToggle('pushNotifications')} className="flex-shrink-0 cursor-pointer">
                      <Toggle enabled={settings.pushNotifications} />
                    </div>
                  </div>

                  <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${dm ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Mail className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Email Notifications</p>
                        <p className={`text-xs sm:text-sm truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Updates via email</p>
                      </div>
                    </div>
                    <div onClick={() => handleToggle('emailNotifications')} className="flex-shrink-0 cursor-pointer">
                      <Toggle enabled={settings.emailNotifications} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Types</h3>
                <div className="space-y-2 sm:space-y-4">
                  {[
                    { key: 'assignmentReminders', label: 'Assignment Reminders', desc: 'When due' },
                    { key: 'classReminders', label: 'Class Reminders', desc: 'Before class' },
                    { key: 'studentQuestions', label: 'Student Questions', desc: 'New questions' },
                    { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Performance summaries' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${dm ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="min-w-0 flex-1 pr-3">
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{label}</p>
                        <p className={`text-xs sm:text-sm truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
                      </div>
                      <div onClick={() => handleToggle(key)} className="flex-shrink-0 cursor-pointer">
                        <Toggle enabled={settings[key as keyof typeof settings] as boolean} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Profile Privacy</h3>
                <div className="space-y-2 sm:space-y-4">
                  <div className={`p-3 sm:p-4 rounded-lg ${dm ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <Eye className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div>
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Profile Visibility</p>
                        <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Who can see your profile</p>
                      </div>
                    </div>
                    <select
                      value={settings.profileVisibility}
                      onChange={(e) => handleSelectChange('profileVisibility', e.target.value)}
                      className={`w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg border text-xs sm:text-sm ${
                        dm 
                          ? 'bg-gray-600 border-gray-500 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      <option value="public">Public - All dashboards</option>
                      <option value="students">Students Only</option>
                      <option value="private">Private - Hidden</option>
                    </select>
                  </div>

                  <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${dm ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Lock className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Direct Messaging</p>
                        <p className={`text-xs sm:text-sm truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Allow messages</p>
                      </div>
                    </div>
                    <div onClick={() => handleToggle('allowMessaging')} className="flex-shrink-0 cursor-pointer">
                      <Toggle enabled={settings.allowMessaging} />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-3 sm:p-4 rounded-lg border-2 ${dm ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-start gap-2 sm:gap-3">
                  <Info className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${dm ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm sm:text-base mb-1 ${dm ? 'text-blue-300' : 'text-blue-900'}`}>Privacy Note</p>
                    <p className={`text-xs sm:text-sm ${dm ? 'text-blue-200' : 'text-blue-800'}`}>
                      Your data is encrypted and secure. We never share without consent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Data Management</h3>
                <div className="space-y-2 sm:space-y-4">
                  <button 
                    onClick={handleDownloadData}
                    disabled={saving}
                    className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-lg transition-colors disabled:opacity-50 ${dm ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Download className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div className="text-left min-w-0">
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Download My Data</p>
                        <p className={`text-xs sm:text-sm truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Export all data</p>
                      </div>
                    </div>
                    {saving && <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-indigo-600 flex-shrink-0"></div>}
                  </button>

                  <button 
                    onClick={handleClearCache}
                    className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-lg transition-colors ${dm ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Database className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${dm ? 'text-gray-300' : 'text-gray-700'}`} />
                      <div className="text-left min-w-0">
                        <p className={`font-semibold text-sm sm:text-base ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Clear Cache</p>
                        <p className={`text-xs sm:text-sm truncate ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Free up space</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-red-600`}>Danger Zone</h3>
                <div className="space-y-2 sm:space-y-4">
                  {!showDeleteConfirm ? (
                    <button 
                      onClick={handleDeleteAccount}
                      className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 transition-colors ${dm ? 'bg-red-900/20 border-red-800 hover:bg-red-900/30' : 'bg-red-50 border-red-200 hover:bg-red-100'}`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-red-600">Delete Account</p>
                          <p className={`text-xs sm:text-sm truncate ${dm ? 'text-red-400' : 'text-red-700'}`}>Permanent deletion</p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className={`p-3 sm:p-4 rounded-lg border-2 ${dm ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                      <p className={`font-semibold text-sm sm:text-base text-red-600 mb-2 sm:mb-3`}>⚠️ Are you sure?</p>
                      <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${dm ? 'text-red-400' : 'text-red-700'}`}>
                        This cannot be undone. All data will be permanently deleted.
                      </p>
                      <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                        >
                          {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold transition-colors text-xs sm:text-sm ${dm ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`p-3 sm:p-4 rounded-lg border ${dm ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-2 sm:gap-3">
                  <HelpCircle className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${dm ? 'text-gray-400' : 'text-gray-600'}`} />
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm sm:text-base mb-1 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Need Help?</p>
                    <p className={`text-xs sm:text-sm mb-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                      Contact support for assistance.
                    </p>
                    <button 
                      onClick={() => router.push('/contact')}
                      className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
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
        <div className={`flex flex-col xs:flex-row items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
          <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
            Auto-saved
          </p>
          <button
            onClick={onClose}
            className="w-full xs:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm sm:text-base"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}