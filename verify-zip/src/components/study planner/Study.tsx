'use client';
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Brain, Sparkles, CheckCircle, Play, Book, Target,
  BookOpen, Code, FileText, Trophy, TrendingUp, AlertCircle, Download,
  Share2, Printer, BarChart3, Lightbulb, Bookmark, ArrowRight, ExternalLink,
  Check, ChevronDown, ChevronUp, Zap, Layers, Star
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Task {
  time: string;
  task: string;
  type: 'theory' | 'practice' | 'project' | 'break' | 'review';
  duration: string;
  resources: string[];
  link?: string;
  completed: boolean;
}

interface DaySchedule {
  day: number;
  title: string;
  focus: string;
  objectives: string[];
  tasks: Task[];
  milestone: string;
}

interface StudyPlan {
  title: string;
  description: string;
  totalHours: number;
  schedule: DaySchedule[];
  weeklyGoals: string[];
  tips: string[];
  resources: {
    documentation: string[];
    tutorials: string[];
    practice: string[];
  };
}

interface FormData {
  topics: string;
  days: number;
  hoursPerDay: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  goal: string;
}

const AIStudyPlanner = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const [formData, setFormData] = useState<FormData>({
    topics: '',
    days: 7,
    hoursPerDay: 2,
    level: 'intermediate',
    goal: ''
  });

  // ── Dark mode detection (same pattern as AssignmentCard) ──
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const dm = darkMode;

  const generatePlan = async () => {
    if (!formData.topics.trim()) {
      setError('Please enter topics to learn');
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate plan');
      if (data.success && data.plan) {
        setStudyPlan(data.plan);
        setExpandedDays(new Set([0]));
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Generate plan error:', error);
      setError(error.message || 'Failed to generate plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayIndex)) newExpanded.delete(dayIndex);
    else newExpanded.add(dayIndex);
    setExpandedDays(newExpanded);
  };

  const toggleTask = (dayIndex: number, taskIndex: number) => {
    if (!studyPlan) return;
    const newPlan = {
      ...studyPlan,
      schedule: studyPlan.schedule.map((day, dIndex) =>
        dIndex === dayIndex
          ? {
              ...day,
              tasks: day.tasks.map((task, tIndex) =>
                tIndex === taskIndex ? { ...task, completed: !task.completed } : task
              )
            }
          : day
      )
    };
    setStudyPlan(newPlan);
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'theory':   return <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'practice': return <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'project':  return <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'review':   return <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      case 'break':    return <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
      default:         return <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
    }
  };

  const getTaskColor = (type: string) => {
    if (dm) {
      switch (type) {
        case 'theory':   return 'bg-blue-900 text-blue-300 border-blue-800';
        case 'practice': return 'bg-green-900 text-green-300 border-green-800';
        case 'project':  return 'bg-purple-900 text-purple-300 border-purple-800';
        case 'review':   return 'bg-orange-900 text-orange-300 border-orange-800';
        case 'break':    return 'bg-slate-700 text-slate-300 border-slate-600';
        default:         return 'bg-blue-900 text-blue-300 border-blue-800';
      }
    } else {
      switch (type) {
        case 'theory':   return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'practice': return 'bg-green-100 text-green-700 border-green-200';
        case 'project':  return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'review':   return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'break':    return 'bg-slate-100 text-slate-700 border-slate-200';
        default:         return 'bg-blue-100 text-blue-700 border-blue-200';
      }
    }
  };

  const totalTasks = studyPlan ? studyPlan.schedule.reduce((acc, day) => acc + day.tasks.length, 0) : 0;
  const completedTasks = studyPlan
    ? studyPlan.schedule.reduce((acc, day) => acc + day.tasks.filter(t => t.completed).length, 0)
    : 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const completedDays = studyPlan
    ? studyPlan.schedule.filter(day => day.tasks.every(t => t.completed)).length
    : 0;

  const exportPlan = () => {
    if (!studyPlan) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    doc.setFillColor(147, 51, 234);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(studyPlan.title, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(studyPlan.description, pageWidth / 2, 30, { align: 'center' });
    yPosition = 50;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Study Plan Overview', 15, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Days: ${formData.days}`, 15, yPosition);
    doc.text(`Hours per Day: ${formData.hoursPerDay}`, 80, yPosition);
    doc.text(`Total Hours: ${studyPlan.totalHours}`, 145, yPosition);
    yPosition += 6;
    doc.text(`Level: ${formData.level}`, 15, yPosition);
    doc.text(`Topics: ${formData.topics}`, 80, yPosition);
    yPosition += 10;

    studyPlan.schedule.forEach((day) => {
      if (yPosition > pageHeight - 60) { doc.addPage(); yPosition = 20; }
      doc.setFillColor(243, 244, 246);
      doc.rect(10, yPosition - 5, pageWidth - 20, 12, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(88, 28, 135);
      doc.text(`Day ${day.day}: ${day.title}`, 15, yPosition);
      yPosition += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`Focus: ${day.focus}`, 15, yPosition);
      yPosition += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Objectives:', 15, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      day.objectives.forEach((obj) => {
        if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; }
        doc.text(`• ${obj}`, 20, yPosition);
        yPosition += 4;
      });
      yPosition += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Schedule:', 15, yPosition);
      yPosition += 5;
      day.tasks.forEach((task) => {
        if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; }
        doc.setFont('helvetica', 'normal');
        const taskText = `${task.time} - ${task.task} (${task.type}, ${task.duration})`;
        const splitText = doc.splitTextToSize(taskText, pageWidth - 40);
        doc.text(splitText, 20, yPosition);
        yPosition += splitText.length * 4 + 2;
        if (task.resources && task.resources.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`Resources: ${task.resources.join(', ')}`, 25, yPosition);
          yPosition += 4;
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
        }
      });
      yPosition += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Milestone:', 15, yPosition);
      yPosition += 4;
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(22, 163, 74);
      const milestoneText = doc.splitTextToSize(day.milestone, pageWidth - 40);
      doc.text(milestoneText, 20, yPosition);
      yPosition += milestoneText.length * 4 + 8;
      doc.setTextColor(0, 0, 0);
    });

    if (yPosition > pageHeight - 40) { doc.addPage(); yPosition = 20; }
    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Study Tips', 15, yPosition);
    yPosition += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    studyPlan.tips.forEach((tip) => {
      if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; }
      const tipText = doc.splitTextToSize(`• ${tip}`, pageWidth - 30);
      doc.text(tipText, 15, yPosition);
      yPosition += tipText.length * 4 + 2;
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by AI Study Planner | Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    doc.save(`Study-Plan-${formData.days}days-${Date.now()}.pdf`);
  };

  // ── Level config ──
  const levels = [
    {
      value: 'beginner',
      // Full label for md+, short for sm, icon for xs
      labelFull: 'Beginner',
      labelShort: 'Beginner',
      desc: 'Just starting out',
      descShort: 'Starting out',
      icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,
      emoji: '🌱',
    },
    {
      value: 'intermediate',
      labelFull: 'Intermediate',
      labelShort: 'Mid-level',
      desc: 'Some experience',
      descShort: 'Some exp.',
      icon: <Layers className="w-4 h-4 sm:w-5 sm:h-5" />,
      emoji: '⚡',
    },
    {
      value: 'advanced',
      labelFull: 'Advanced',
      labelShort: 'Advanced',
      desc: 'Deep knowledge',
      descShort: 'Expert',
      icon: <Star className="w-4 h-4 sm:w-5 sm:h-5" />,
      emoji: '🚀',
    },
  ];

  return (
    <div className={`min-h-screen p-3 sm:p-4 md:p-6 transition-colors duration-300 ${
      dm
        ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-blue-950'
        : 'bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50'
    }`}>
      <div className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8">

        {/* ── Header ── */}
        <div className="text-center mb-8 sm:mb-12">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-3 sm:mb-4 shadow-sm text-xs sm:text-sm ${
            dm
              ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 text-purple-300'
              : 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700'
          }`}>
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-medium">Powered by Advanced AI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 sm:mb-4 px-4">
            AI Study Planner
          </h1>
          <p className={`text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4 ${dm ? 'text-slate-400' : 'text-slate-600'}`}>
            Get a personalized, adaptive study schedule tailored to your learning style and goals
          </p>
        </div>

        {!studyPlan ? (
          /* ── Planning Form ── */
          <div className="max-w-3xl mx-auto px-3 sm:px-0">
            <div className={`rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border ${
              dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="space-y-4 sm:space-y-6">

                {/* Error */}
                {error && (
                  <div className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl text-sm border ${
                    dm ? 'bg-red-950 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                {/* Topics */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${dm ? 'text-white' : 'text-slate-900'}`}>
                    <Brain className="inline mr-2 w-4 h-4" />
                    What do you want to learn?
                  </label>
                  <textarea
                    value={formData.topics}
                    onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                    placeholder="E.g., React Hooks, TypeScript, Next.js App Router, Tailwind CSS, State Management"
                    rows={4}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-base outline-none transition-all ${
                      dm
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <p className={`mt-2 text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                    💡 Tip: Be specific! The more details you provide, the better your study plan will be.
                  </p>
                </div>

                {/* Duration Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${dm ? 'text-white' : 'text-slate-900'}`}>
                      <Calendar className="inline mr-2 w-4 h-4" />
                      Study Duration
                    </label>
                    <select
                      value={formData.days}
                      onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm sm:text-base font-semibold ${
                        dm ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value={3}>3 Days (Crash Course)</option>
                      <option value={7}>7 Days (1 Week)</option>
                      <option value={14}>14 Days (2 Weeks)</option>
                      <option value={21}>21 Days (3 Weeks)</option>
                      <option value={30}>30 Days (1 Month)</option>
                      <option value={60}>60 Days (2 Months)</option>
                      <option value={90}>90 Days (3 Months)</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${dm ? 'text-white' : 'text-slate-900'}`}>
                      <Clock className="inline mr-2 w-4 h-4" />
                      Daily Study Time
                    </label>
                    <select
                      value={formData.hoursPerDay}
                      onChange={(e) => setFormData({ ...formData, hoursPerDay: parseInt(e.target.value) })}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm sm:text-base font-semibold ${
                        dm ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value={1}>1 Hour (Light)</option>
                      <option value={2}>2 Hours (Moderate)</option>
                      <option value={3}>3 Hours (Focused)</option>
                      <option value={4}>4 Hours (Intensive)</option>
                      <option value={6}>6 Hours (Full-time)</option>
                      <option value={8}>8 Hours (Bootcamp)</option>
                    </select>
                  </div>
                </div>

                {/* ── Level Selection — FIXED for mobile ── */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${dm ? 'text-white' : 'text-slate-900'}`}>
                    <Target className="inline mr-2 w-4 h-4" />
                    Your Current Level
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {levels.map((level) => {
                      const selected = formData.level === level.value;
                      return (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, level: level.value as FormData['level'] })}
                          className={`relative flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-3 sm:py-4 px-1 sm:px-3 rounded-xl font-medium transition-all text-center ${
                            selected
                              ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg scale-[1.03] ring-2 ring-purple-400 ring-offset-2 ring-offset-transparent'
                              : dm
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-2 border-slate-600'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                          }`}
                        >
                          {/* Emoji — always visible, large on mobile */}
                          <span className="text-xl sm:text-lg leading-none">{level.emoji}</span>

                          {/* Label: short on xs, full on sm+ */}
                          <span className="font-bold text-xs sm:text-sm leading-tight">
                            <span className="sm:hidden">{level.labelShort}</span>
                            <span className="hidden sm:inline">{level.labelFull}</span>
                          </span>

                          {/* Desc: hidden on xs, visible on sm+ */}
                          <span className={`hidden sm:block text-[10px] leading-tight opacity-80`}>
                            {level.desc}
                          </span>

                          {selected && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5 text-purple-600" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${dm ? 'text-white' : 'text-slate-900'}`}>
                    <Trophy className="inline mr-2 w-4 h-4" />
                    Your Learning Goal (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    placeholder="E.g., Build a full-stack e-commerce app"
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm sm:text-base ${
                      dm
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Info Box */}
                <div className={`rounded-xl p-3 sm:p-4 border ${
                  dm
                    ? 'bg-gradient-to-r from-purple-950 to-blue-950 border-purple-800'
                    : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100'
                }`}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Lightbulb className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 mt-0.5 ${dm ? 'text-purple-400' : 'text-purple-600'}`} />
                    <div className={`text-xs sm:text-sm ${dm ? 'text-slate-300' : 'text-slate-700'}`}>
                      <p className="font-medium mb-1">Your plan will include:</p>
                      <ul className={`space-y-0.5 sm:space-y-1 text-[11px] sm:text-xs ${dm ? 'text-slate-400' : 'text-slate-600'}`}>
                        <li>• Day-by-day structured schedule with time blocks</li>
                        <li>• Theory, practice, and hands-on projects</li>
                        <li>• Regular breaks and review sessions</li>
                        <li>• Curated learning resources and milestones</li>
                        <li>• Progress tracking and completion status</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generatePlan}
                  disabled={generating || !formData.topics.trim()}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-sm sm:text-base md:text-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 sm:gap-3"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Generating Your Personalized Plan...</span>
                      <span className="sm:hidden">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Generate AI Study Plan</span>
                      <span className="sm:hidden">Generate Plan</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </button>

                <p className={`text-center text-[10px] sm:text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
                  Powered by Groq Llama 3.3 70B • Free • No credit card required
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ── Study Plan Display ── */
          <div className="space-y-4 sm:space-y-6">

            {/* Plan Overview Header */}
            <div className={`rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-2xl ${
              dm
                ? 'bg-gradient-to-br from-purple-800 via-purple-900 to-blue-800'
                : 'bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600'
            }`}>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 sm:px-3 bg-white/20 rounded-full mb-2 sm:mb-3 text-xs sm:text-sm">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>AI Generated</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">{studyPlan.title}</h2>
                  <p className="text-purple-100 text-sm sm:text-base md:text-lg">{studyPlan.description}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={exportPlan}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Export</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyPlan(null)}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition text-xs sm:text-sm font-medium"
                  >
                    New Plan
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {[
                  { icon: Calendar,   label: 'Total Days',   value: formData.days },
                  { icon: Clock,      label: 'Study Hours',  value: `${studyPlan.totalHours}h` },
                  { icon: Trophy,     label: 'Days Done',    value: `${completedDays}/${formData.days}` },
                  { icon: TrendingUp, label: 'Progress',     value: `${Math.round(progress)}%` }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white/10 rounded-xl p-2.5 sm:p-3 md:p-4">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mb-1 sm:mb-2" />
                    <p className="text-lg sm:text-xl md:text-2xl font-bold">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-purple-100">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className={`rounded-xl shadow-sm p-4 sm:p-6 border-2 ${
              dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${dm ? 'text-white' : 'text-slate-900'}`}>
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Overall Progress</span>
                  <span className="sm:hidden">Progress</span>
                </h3>
                <span className={`text-xs sm:text-sm ${dm ? 'text-slate-400' : 'text-slate-600'}`}>
                  {completedTasks}/{totalTasks} tasks
                </span>
              </div>
              <div className={`h-3 sm:h-4 rounded-full overflow-hidden ${dm ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress > 0 && (
                <p className={`text-xs sm:text-sm mt-2 sm:mt-3 flex items-center gap-2 ${dm ? 'text-slate-400' : 'text-slate-600'}`}>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  Great job! Keep up the momentum!
                </p>
              )}
            </div>

            {/* Daily Schedule */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className={`text-xl sm:text-2xl font-bold flex items-center gap-2 px-1 ${dm ? 'text-white' : 'text-slate-900'}`}>
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                Daily Schedule
              </h3>

              {studyPlan.schedule.map((day, dayIndex) => {
                const dayCompleted = day.tasks.every(t => t.completed);
                const dayProgress = (day.tasks.filter(t => t.completed).length / day.tasks.length) * 100;
                const isExpanded = expandedDays.has(dayIndex);

                return (
                  <div
                    key={dayIndex}
                    className={`rounded-xl shadow-sm overflow-hidden border-2 transition-all ${
                      dayCompleted
                        ? dm ? 'border-green-700' : 'border-green-200'
                        : dm ? 'border-slate-700' : 'border-slate-200'
                    } ${dm ? 'bg-slate-800' : 'bg-white'}`}
                  >
                    {/* Day Header */}
                    <button
                      type="button"
                      onClick={() => toggleDay(dayIndex)}
                      className={`w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b-2 transition text-left ${
                        dm
                          ? 'bg-gradient-to-r from-purple-950 to-blue-950 border-slate-700 hover:from-purple-900 hover:to-blue-900'
                          : 'bg-gradient-to-r from-purple-50 to-blue-50 border-slate-200 hover:from-purple-100 hover:to-blue-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                          {dayCompleted ? (
                            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                          ) : (
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border-2 border-purple-400 rounded-full flex items-center justify-center font-bold text-purple-500 flex-shrink-0 text-xs sm:text-sm ${
                              dm ? 'bg-slate-700' : 'bg-white'
                            }`}>
                              {day.day}
                            </div>
                          )}
                          <div className="text-left min-w-0 flex-1">
                            <h4 className={`text-sm sm:text-base md:text-lg font-bold truncate ${dm ? 'text-white' : 'text-slate-900'}`}>
                              Day {day.day}: {day.title}
                            </h4>
                            <p className={`text-xs sm:text-sm truncate ${dm ? 'text-slate-400' : 'text-slate-600'}`}>{day.focus}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <div className={`text-xs sm:text-sm font-medium ${dm ? 'text-slate-300' : 'text-slate-700'}`}>
                              {day.tasks.filter(t => t.completed).length}/{day.tasks.length}
                            </div>
                            <div className={`text-[10px] sm:text-xs ${dm ? 'text-slate-500' : 'text-slate-500'}`}>{Math.round(dayProgress)}%</div>
                          </div>
                          <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${dm ? 'text-slate-400' : 'text-slate-400'} ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      {/* Mini progress */}
                      <div className={`mt-2 sm:mt-3 h-1 sm:h-1.5 rounded-full overflow-hidden ${dm ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${dayProgress}%` }}
                        />
                      </div>
                    </button>

                    {/* Day Content */}
                    {isExpanded && (
                      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">

                        {/* Objectives */}
                        <div className={`rounded-lg p-3 sm:p-4 border-2 ${
                          dm ? 'bg-blue-950 border-blue-800' : 'bg-blue-50 border-blue-100'
                        }`}>
                          <h5 className={`font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base ${dm ? 'text-white' : 'text-slate-900'}`}>
                            <Target className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${dm ? 'text-blue-400' : 'text-blue-600'}`} />
                            Learning Objectives
                          </h5>
                          <ul className="space-y-1 sm:space-y-1.5">
                            {day.objectives.map((obj, idx) => (
                              <li key={idx} className={`text-xs sm:text-sm flex items-start gap-2 ${dm ? 'text-slate-300' : 'text-slate-700'}`}>
                                <span className={`mt-0.5 flex-shrink-0 ${dm ? 'text-blue-400' : 'text-blue-600'}`}>•</span>
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Tasks */}
                        <div className="space-y-2 sm:space-y-3">
                          {day.tasks.map((task, taskIndex) => (
                            <div
                              key={taskIndex}
                              className={`flex flex-col sm:flex-row items-start gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 rounded-lg transition-all border-2 ${
                                task.completed
                                  ? dm ? 'bg-green-950 border-green-800' : 'bg-green-50 border-green-200'
                                  : dm ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {/* Task Content */}
                              <div className="flex-1 min-w-0 w-full">
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                                  <Clock className={`w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 ${dm ? 'text-slate-400' : 'text-slate-400'}`} />
                                  <span className={`text-xs sm:text-sm font-medium ${dm ? 'text-slate-300' : 'text-slate-600'}`}>{task.time}</span>
                                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 border ${getTaskColor(task.type)}`}>
                                    {getTaskIcon(task.type)}
                                    <span className="hidden sm:inline">{task.type}</span>
                                  </span>
                                  <span className={`text-[10px] sm:text-xs ${dm ? 'text-slate-400' : 'text-slate-500'}`}>({task.duration})</span>
                                </div>

                                <p className={`font-medium mb-1.5 sm:mb-2 text-xs sm:text-sm ${
                                  task.completed
                                    ? dm ? 'text-slate-500 line-through' : 'text-slate-400 line-through'
                                    : dm ? 'text-white' : 'text-slate-900'
                                }`}>
                                  {task.task}
                                </p>

                                {/* Resources — FIXED overflow */}
                                {task.resources && task.resources.length > 0 && (
                                  <div className="flex items-start gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                                    <Bookmark className={`w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 flex-shrink-0 ${dm ? 'text-purple-400' : 'text-purple-600'}`} />
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 min-w-0">
                                      {task.resources.map((resource, idx) => (
                                        <span
                                          key={idx}
                                          className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border break-all ${
                                            dm
                                              ? 'bg-slate-600 border-slate-500 text-slate-300'
                                              : 'bg-white border-slate-200 text-slate-600'
                                          }`}
                                        >
                                          {resource}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 w-full sm:w-auto sm:flex-col flex-shrink-0">
                                {task.type !== 'break' && task.link && !task.completed && (
                                  <a
                                    href={task.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs sm:text-sm font-medium flex items-center justify-center gap-1 whitespace-nowrap min-w-0"
                                  >
                                    <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                    <span className="truncate">Start</span>
                                    <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                  </a>
                                )}
                                {!task.completed ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleTask(dayIndex, taskIndex)}
                                    className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs sm:text-sm font-medium flex items-center justify-center gap-1 whitespace-nowrap"
                                  >
                                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span className="hidden sm:inline">Complete</span>
                                    <span className="sm:hidden">Done</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleTask(dayIndex, taskIndex)}
                                    className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm font-medium flex items-center justify-center gap-1 whitespace-nowrap text-white ${
                                      dm ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-500 hover:bg-slate-600'
                                    }`}
                                  >
                                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    Undo
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Milestone */}
                        <div className={`rounded-lg p-3 sm:p-4 border-2 ${
                          dm
                            ? 'bg-gradient-to-r from-purple-950 to-blue-950 border-purple-800'
                            : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100'
                        }`}>
                          <h5 className={`font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base ${dm ? 'text-white' : 'text-slate-900'}`}>
                            <Trophy className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${dm ? 'text-purple-400' : 'text-purple-600'}`} />
                            Day {day.day} Milestone
                          </h5>
                          <p className={`text-xs sm:text-sm ${dm ? 'text-slate-300' : 'text-slate-700'}`}>{day.milestone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tips & Resources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Study Tips */}
              <div className={`rounded-xl shadow-sm p-4 sm:p-6 border-2 ${
                dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 ${dm ? 'text-white' : 'text-slate-900'}`}>
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  Study Tips
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  {studyPlan.tips.map((tip, idx) => (
                    <li key={idx} className={`flex items-start gap-2 sm:gap-3 text-xs sm:text-sm ${dm ? 'text-slate-300' : 'text-slate-700'}`}>
                      <span className={`font-bold flex-shrink-0 ${dm ? 'text-purple-400' : 'text-purple-600'}`}>•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources — FIXED overflow */}
              <div className={`rounded-xl shadow-sm p-4 sm:p-6 border-2 ${
                dm ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 ${dm ? 'text-white' : 'text-slate-900'}`}>
                  <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 ${dm ? 'text-blue-400' : 'text-blue-600'}`} />
                  Recommended Resources
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {Object.entries(studyPlan.resources).map(([category, items]) => (
                    <div key={category}>
                      <h4 className={`text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 capitalize ${dm ? 'text-slate-300' : 'text-slate-700'}`}>{category}</h4>
                      <ul className="space-y-1 sm:space-y-1.5">
                        {items.map((item, idx) => (
                          <li key={idx} className={`text-xs sm:text-sm flex items-start gap-2 min-w-0 ${dm ? 'text-slate-400' : 'text-slate-600'}`}>
                            <span className={`flex-shrink-0 mt-0.5 ${dm ? 'text-blue-400' : 'text-blue-600'}`}>→</span>
                            {/* FIXED: break-all on the text so long URLs don't overflow */}
                            <span className="break-all min-w-0">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Goals */}
            {studyPlan.weeklyGoals && studyPlan.weeklyGoals.length > 0 && (
              <div className={`rounded-xl p-4 sm:p-6 text-white ${
                dm
                  ? 'bg-gradient-to-br from-purple-800 to-blue-800'
                  : 'bg-gradient-to-br from-purple-600 to-blue-600'
              }`}>
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  Weekly Goals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {studyPlan.weeklyGoals.map((goal, idx) => (
                    <div key={idx} className="bg-white/10 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIStudyPlanner;