'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Save, Mail, Phone, MapPin, Briefcase, Link as LinkIcon, Calendar, Github, Linkedin, Twitter, Globe, Upload, User, Award, BookOpen } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdate: (data: any) => void;
  darkMode: boolean;
  userRole?: string;
}

export default function EditProfileModal({ isOpen, onClose, userProfile, onUpdate, darkMode, userRole }: EditProfileModalProps) {
  // Dark mode — same MutationObserver pattern
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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

  // Calculate max date (user must be at least 5 years old)
  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  };

  // Calculate min date (reasonable minimum age - 150 years ago)
  const getMinDate = () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 150, today.getMonth(), today.getDate());
    return minDate.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className={`rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col transition-colors ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0 ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="min-w-0 flex-1 pr-4">
            <h2 className={`text-xl sm:text-2xl font-bold truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Edit Profile</h2>
            <p className={`text-xs sm:text-sm mt-1 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              {isTeacher 
                ? 'Update your personal and professional information' 
                : 'Update your personal information and social links'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 sm:w-6 sm:h-6 ${dm ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b px-3 sm:px-6 overflow-x-auto scrollbar-hide flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-xs sm:text-sm transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'personal'
                ? 'border-indigo-600 text-indigo-600'
                : `border-transparent ${dm ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Personal</span>
            </div>
          </button>

          {isTeacher && (
            <button
              onClick={() => setActiveTab('professional')}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-xs sm:text-sm transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'professional'
                  ? 'border-indigo-600 text-indigo-600'
                  : `border-transparent ${dm ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Professional</span>
              </div>
            </button>
          )}

          <button
            onClick={() => setActiveTab('social')}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 font-semibold text-xs sm:text-sm transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'social'
                ? 'border-indigo-600 text-indigo-600'
                : `border-transparent ${dm ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Social</span>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            {/* Avatar Section */}
            <div className={`flex flex-col items-center gap-3 sm:gap-4 pb-4 sm:pb-6 border-b ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
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
                <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                  Click camera to upload photo
                </p>
                <p className={`text-[10px] sm:text-xs mt-1 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
                  Square image, 400x400px min, max 5MB
                </p>
              </div>
            </div>

            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Full Name *
                      </div>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Email *
                      </div>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Phone Number
                      </div>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Date of Birth
                      </div>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    />
                    <p className={`text-[10px] sm:text-xs mt-1 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
                      You must be at least 5 years old
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Location
                      </div>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                      dm 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none`}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            )}

            {/* Professional Info Tab */}
            {activeTab === 'professional' && isTeacher && (
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Qualification
                      </div>
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="Ph.D. in Computer Science"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Experience
                      </div>
                    </label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="10+ years"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Subjects
                      </div>
                    </label>
                    <input
                      type="text"
                      name="subjects"
                      value={formData.subjects}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="Mathematics, Physics, Chemistry"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Specialization
                      </div>
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="JEE/NEET Preparation"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                    Teaching Style & Philosophy
                  </label>
                  <textarea
                    name="teachingStyle"
                    value={formData.teachingStyle}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                      dm 
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
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Website
                      </div>
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        LinkedIn
                      </div>
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Twitter
                      </div>
                    </label>
                    <input
                      type="url"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Instagram
                      </div>
                    </label>
                    <input
                      type="url"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleInputChange}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm sm:text-base ${
                        dm 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>
                </div>

                <div className={`p-3 sm:p-4 rounded-lg border ${dm ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
                  <p className={`text-xs sm:text-sm ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    <strong>Tip:</strong> {isTeacher 
                      ? 'Adding your social profiles helps students and parents learn more about your teaching approach and credentials.' 
                      : 'Connect your social profiles to showcase your personality and interests!'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex flex-col xs:flex-row items-stretch xs:items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 border-t flex-shrink-0 ${dm ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                dm 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
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