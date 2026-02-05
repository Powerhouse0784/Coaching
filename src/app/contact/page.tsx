'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, 
  MessageSquare, Clock, ArrowLeft, Linkedin, Twitter, 
  Instagram, Facebook, HelpCircle, User, Briefcase,
  X, Minimize2, Maximize2, Bot, Sparkles, Loader2
} from 'lucide-react';

export default function ContactPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // AI Chatbot States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! 👋 I\'m your AI assistant. How can I help you today? I can answer questions about our courses, pricing, enrollment, or anything else about EduElite!'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user?.name || '',
        email: session.user?.email || '',
      }));
    }
  }, [session]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitted(true);
      setFormData({
        name: session?.user?.name || '',
        email: session?.user?.email || '',
        subject: '',
        category: 'general',
        message: '',
      });

      setTimeout(() => setSubmitted(false), 5000);

    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again or contact support directly.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      value: 'support@eduelite.com',
      description: 'Send us an email anytime',
      color: 'from-blue-500 to-cyan-500',
      link: 'mailto:support@eduelite.com'
    },
    {
      icon: Phone,
      title: 'Call Us',
      value: '+91 98104 93309',
      description: 'Mon-Fri from 9am to 6pm',
      color: 'from-green-500 to-emerald-500',
      link: 'tel:+919810493309'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      value: 'Sohna, Haryana, India',
      description: 'Come say hello at our office',
      color: 'from-purple-500 to-pink-500',
      link: 'https://maps.google.com/?q=Sohna,Haryana,India'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      value: '9:00 AM - 6:00 PM',
      description: 'Monday to Friday',
      color: 'from-orange-500 to-red-500',
      link: null
    }
  ];

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Report a Bug' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'teaching', label: 'Become a Teacher' },
  ];

  const faqs = [
    {
      question: 'How quickly do you respond?',
      answer: 'We aim to respond to all inquiries within 24 hours during business days.'
    },
    {
      question: 'Can I schedule a demo call?',
      answer: 'Yes! Mention it in your message and we\'ll arrange a convenient time.'
    },
    {
      question: 'Do you offer phone support?',
      answer: 'Phone support is available for premium users. Contact us to learn more.'
    }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 border-gray-200'} border-b sticky top-0 z-40 backdrop-blur-xl bg-opacity-95`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors group"
          >
            <div className={`w-10 h-10 ${darkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-100 group-hover:bg-indigo-100'} rounded-xl flex items-center justify-center transition-all duration-300`}>
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-full mb-6 animate-pulse">
            <MessageSquare className="w-4 h-4" />
            <span className="font-semibold text-sm">24/7 AI Support Available</span>
          </div>
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600`}>
            Let's Connect
          </h1>
          <p className={`text-lg sm:text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Have questions? We're here to help. Send us a message or chat with our AI assistant for instant answers.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactInfo.map((info, idx) => (
            <a
              key={idx}
              href={info.link || '#'}
              target={info.link?.startsWith('http') ? '_blank' : undefined}
              rel={info.link?.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border-2 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer ${!info.link && 'pointer-events-none'}`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                <info.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-1`}>{info.title}</h3>
              <p className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'} mb-1`}>{info.value}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{info.description}</p>
            </a>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border-2 p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Send Us a Message</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Online</span>
                </div>
              </div>
              
              {submitted && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-400">Message Sent Successfully! ✨</p>
                    <p className="text-sm text-green-700 dark:text-green-500">We'll get back to you within 24 hours.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="group">
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Your Name *
                      </div>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300`}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="group">
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </div>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300`}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Category *
                    </div>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300`}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="group">
                  <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Subject *
                    </div>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-lg border-2 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300`}
                    placeholder="How can we help you?"
                  />
                </div>

                <div className="group">
                  <label className={`block text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all duration-300`}
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* FAQs */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border-2 p-6 hover:shadow-xl transition-shadow duration-300`}>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <h3 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Quick FAQs</h3>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="group">
                    <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'} text-sm mb-1 group-hover:text-indigo-600 transition-colors`}>{faq.question}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border-2 p-6 hover:shadow-xl transition-shadow duration-300`}>
              <h3 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Follow Us</h3>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-400 dark:text-blue-400 rounded-lg flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Office Hours */}
            <div className={`${darkMode ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-800' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'} rounded-2xl border-2 p-6 hover:shadow-xl transition-shadow duration-300`}>
              <Clock className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>Office Hours</h3>
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} space-y-1`}>
                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p>Saturday: 10:00 AM - 4:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group z-50"
        >
          <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {chatOpen && (
        <div className={`fixed bottom-6 right-6 ${chatMinimized ? 'w-80' : 'w-96'} ${chatMinimized ? 'h-16' : 'h-[600px]'} ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 z-50`}>
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">AI Assistant</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChatMinimized(!chatMinimized)}
                className="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                {chatMinimized ? <Maximize2 className="w-4 h-4 text-white" /> : <Minimize2 className="w-4 h-4 text-white" />}
              </button>
              <button
                onClick={() => setChatOpen(false)}
                className="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {!chatMinimized && (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                        : darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'
                    }`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-semibold text-indigo-500">AI Assistant</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        <span className="text-sm text-gray-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask me anything..."
                    disabled={chatLoading}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50`}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}