'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, Save, Mail, Phone, MapPin, Briefcase, Link as LinkIcon, Calendar, Github, Linkedin, Twitter, Globe, Upload, User, Award, BookOpen } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdate: (data: any) => void;
  darkMode: boolean;
  userRole?: string; // Add user role to determine tab visibility
}

export default function EditProfileModal({ isOpen, onClose, userProfile, onUpdate, darkMode, userRole }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    bio: userProfile?.bio || '',
    location: userProfile?.location || '',
    dateOfBirth: userProfile?.dateOfBirth ? new Date(userProfile.dateOfBirth).toISOString().split('T')[0] : '',
    qualification: userProfile?.qualification || '',
    experience: userProfile?.experience || '',
    subjects: userProfile?.subjects || '',
    specialization: userProfile?.specialization || '',
    teachingStyle: userProfile?.teachingStyle || '',
    website: userProfile?.website || '',
    linkedin: userProfile?.linkedin || '',
    twitter: userProfile?.twitter || '',
    instagram: userProfile?.instagram || '',
  });

  const [avatarPreview, setAvatarPreview] = useState(userProfile?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'social'>('personal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is a teacher
  const isTeacher = userRole === 'TEACHER' || userProfile?.role === 'TEACHER';

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = avatarPreview;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', avatarFile);

        const uploadResponse = await fetch('/api/user/upload-avatar', {
          method: 'POST',
          body: formDataUpload,
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          avatarUrl = url;
        }
      }

      // Update profile
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          avatar: avatarUrl,
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        onUpdate(updatedProfile);
        onClose();
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Edit Profile</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              {isTeacher 
                ? 'Update your personal and professional information' 
                : 'Update your personal information and social links'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <X className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} px-6`}>
          {/* Personal Info Tab - Always visible */}
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'personal'
                ? 'border-indigo-600 text-indigo-600'
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Info
            </div>
          </button>

          {/* Professional Tab - Only for Teachers */}
          {isTeacher && (
            <button
              onClick={() => setActiveTab('professional')}
              className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
                activeTab === 'professional'
                  ? 'border-indigo-600 text-indigo-600'
                  : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Professional
              </div>
            </button>
          )}

          {/* Social Links Tab - Always visible */}
          <button
            onClick={() => setActiveTab('social')}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'social'
                ? 'border-indigo-600 text-indigo-600'
                : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Social Links
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Avatar Section - Visible on all tabs */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Click the camera icon to upload a new photo
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                  Recommended: Square image, at least 400x400px
                </p>
              </div>
            </div>

            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name *
                      </div>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email *
                      </div>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </div>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date of Birth
                      </div>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </div>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none`}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            )}

            {/* Professional Info Tab - Only visible for Teachers */}
            {activeTab === 'professional' && isTeacher && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Qualification
                      </div>
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="Ph.D. in Computer Science"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Years of Experience
                      </div>
                    </label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="10+ years"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Subjects
                      </div>
                    </label>
                    <input
                      type="text"
                      name="subjects"
                      value={formData.subjects}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="Mathematics, Physics, Chemistry"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Specialization
                      </div>
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="JEE/NEET Preparation"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Teaching Style & Philosophy
                  </label>
                  <textarea
                    name="teachingStyle"
                    value={formData.teachingStyle}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none`}
                    placeholder="Describe your teaching methodology, approach, and philosophy..."
                  />
                </div>
              </div>
            )}

            {/* Social Links Tab */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Website
                      </div>
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </div>
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </div>
                    </label>
                    <input
                      type="url"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Instagram
                      </div>
                    </label>
                    <input
                      type="url"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${darkMode ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'} border`}>
                  <p className={`text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    <strong>Tip:</strong> {isTeacher 
                      ? 'Adding your social profiles helps students and parents learn more about your teaching approach and credentials.' 
                      : 'Connect your social profiles to showcase your personality and interests!'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-end gap-3 p-6 border-t ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${
                darkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}