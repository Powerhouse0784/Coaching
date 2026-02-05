'use client';
import React, { useState } from 'react';
import { 
  Calendar, Clock, Brain, Sparkles, CheckCircle, Play, Book, Target,
  BookOpen, Code, FileText, Trophy, TrendingUp, AlertCircle, Download,
  Share2, Printer, BarChart3, Lightbulb, Bookmark, ArrowRight, ExternalLink,
  Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Task {
  time: string;
  task: string;
  type: 'theory' | 'practice' | 'project' | 'break' | 'review';
  duration: string;
  resources: string[];
  link?: string; // Optional link for the task
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
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      if (data.success && data.plan) {
        setStudyPlan(data.plan);
        setExpandedDays(new Set([0])); // Expand first day by default
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
    if (newExpanded.has(dayIndex)) {
      newExpanded.delete(dayIndex);
    } else {
      newExpanded.add(dayIndex);
    }
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
                tIndex === taskIndex
                  ? { ...task, completed: !task.completed }
                  : task
              )
            }
          : day
      )
    };
    setStudyPlan(newPlan);
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'theory': return <BookOpen size={16} />;
      case 'practice': return <Code size={16} />;
      case 'project': return <Trophy size={16} />;
      case 'review': return <FileText size={16} />;
      case 'break': return <Clock size={16} />;
      default: return <Book size={16} />;
    }
  };

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'theory': return 'bg-blue-100 text-blue-700';
      case 'practice': return 'bg-green-100 text-green-700';
      case 'project': return 'bg-purple-100 text-purple-700';
      case 'review': return 'bg-orange-100 text-orange-700';
      case 'break': return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const totalTasks = studyPlan ? studyPlan.schedule.reduce((acc: number, day) => acc + day.tasks.length, 0) : 0;
  const completedTasks = studyPlan ? studyPlan.schedule.reduce((acc: number, day) => 
    acc + day.tasks.filter(task => task.completed).length, 0
  ) : 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const completedDays = studyPlan ? studyPlan.schedule.filter(day => 
    day.tasks.every(task => task.completed)
  ).length : 0;

  const exportPlan = () => {
    if (!studyPlan) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header with gradient effect (using colored rectangles)
    doc.setFillColor(147, 51, 234); // Purple
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(studyPlan.title, pageWidth / 2, 20, { align: 'center' });
    
    // Description
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(studyPlan.description, pageWidth / 2, 30, { align: 'center' });
    
    yPosition = 50;

    // Overview Section
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

    // Daily Schedule
    studyPlan.schedule.forEach((day, dayIndex) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      // Day Header
      doc.setFillColor(243, 244, 246); // Light gray
      doc.rect(10, yPosition - 5, pageWidth - 20, 12, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(88, 28, 135); // Purple
      doc.text(`Day ${day.day}: ${day.title}`, 15, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(`Focus: ${day.focus}`, 15, yPosition);
      yPosition += 8;

      // Objectives
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Objectives:', 15, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      day.objectives.forEach((obj) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${obj}`, 20, yPosition);
        yPosition += 4;
      });
      yPosition += 3;

      // Tasks
      doc.setFont('helvetica', 'bold');
      doc.text('Schedule:', 15, yPosition);
      yPosition += 5;

      day.tasks.forEach((task) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

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

      // Milestone
      yPosition += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Milestone:', 15, yPosition);
      yPosition += 4;
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(22, 163, 74); // Green
      const milestoneText = doc.splitTextToSize(day.milestone, pageWidth - 40);
      doc.text(milestoneText, 20, yPosition);
      yPosition += milestoneText.length * 4 + 8;
      doc.setTextColor(0, 0, 0);
    });

    // Tips Section
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Study Tips', 15, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    studyPlan.tips.forEach((tip) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      const tipText = doc.splitTextToSize(`• ${tip}`, pageWidth - 30);
      doc.text(tipText, 15, yPosition);
      yPosition += tipText.length * 4 + 2;
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated by AI Study Planner | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    doc.save(`Study-Plan-${formData.days}days-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full mb-4 shadow-sm">
            <Sparkles size={16} />
            <span className="text-sm font-medium">Powered by Advanced AI</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            AI Study Planner
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get a personalized, adaptive study schedule tailored to your learning style and goals
          </p>
        </div>

        {!studyPlan ? (
          /* Planning Form */
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="space-y-6">
                {/* Error Display */}
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Topics */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <Brain className="inline mr-2" size={16} />
                    What do you want to learn?
                  </label>
                  <textarea
                    value={formData.topics}
                    onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                    placeholder="E.g., React Hooks, TypeScript, Next.js App Router, Tailwind CSS, State Management"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    💡 Tip: Be specific! The more details you provide, the better your study plan will be.
                  </p>
                </div>

                {/* Duration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Calendar className="inline mr-2" size={16} />
                      Study Duration
                    </label>
                    <select
                      value={formData.days}
                      onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <Clock className="inline mr-2" size={16} />
                      Daily Study Time
                    </label>
                    <select
                      value={formData.hoursPerDay}
                      onChange={(e) => setFormData({ ...formData, hoursPerDay: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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

                {/* Level Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    <Target className="inline mr-2" size={16} />
                    Your Current Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'beginner', label: 'Beginner', desc: 'Just starting out' },
                      { value: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
                      { value: 'advanced', label: 'Advanced', desc: 'Deep knowledge' }
                    ].map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, level: level.value as FormData['level'] })}
                        className={`py-4 px-4 rounded-xl font-medium transition-all ${
                          formData.level === level.value
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="text-base">{level.label}</div>
                        <div className="text-xs opacity-80 mt-1">{level.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <Trophy className="inline mr-2" size={16} />
                    Your Learning Goal (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    placeholder="E.g., Build a full-stack e-commerce app, Get job-ready, Pass certification exam"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="text-purple-600 flex-shrink-0" size={20} />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Your plan will include:</p>
                      <ul className="space-y-1 text-xs">
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
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Your Personalized Plan...
                    </>
                  ) : (
                    <>
                      <Brain size={20} />
                      Generate AI Study Plan
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  Powered by Groq Llama 3.3 70B • Free • No credit card required
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Study Plan Display */
          <div className="space-y-6">
            {/* Plan Overview Header */}
            <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-2xl p-8 text-white shadow-2xl">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-3 text-sm">
                    <Sparkles size={14} />
                    <span>AI Generated</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">{studyPlan.title}</h2>
                  <p className="text-purple-100 text-lg">{studyPlan.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={exportPlan}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition flex items-center gap-2"
                  >
                    <Download size={16} />
                    Export
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyPlan(null)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition"
                  >
                    New Plan
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Calendar className="w-8 h-8 mb-2" />
                  <p className="text-2xl font-bold">{formData.days}</p>
                  <p className="text-sm text-purple-100">Total Days</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Clock className="w-8 h-8 mb-2" />
                  <p className="text-2xl font-bold">{studyPlan.totalHours}h</p>
                  <p className="text-sm text-purple-100">Study Hours</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Trophy className="w-8 h-8 mb-2" />
                  <p className="text-2xl font-bold">{completedDays}/{formData.days}</p>
                  <p className="text-sm text-purple-100">Days Done</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <TrendingUp className="w-8 h-8 mb-2" />
                  <p className="text-2xl font-bold">{Math.round(progress)}%</p>
                  <p className="text-sm text-purple-100">Progress</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 size={20} />
                  Overall Progress
                </h3>
                <span className="text-sm text-gray-600">
                  {completedTasks} / {totalTasks} tasks completed
                </span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              {progress > 0 && (
                <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  Great job! Keep up the momentum!
                </p>
              )}
            </div>

            {/* Daily Schedule */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={24} />
                Daily Schedule
              </h3>
              
              {studyPlan.schedule.map((day, dayIndex) => {
                const dayCompleted = day.tasks.every(t => t.completed);
                const dayProgress = (day.tasks.filter(t => t.completed).length / day.tasks.length) * 100;
                const isExpanded = expandedDays.has(dayIndex);

                return (
                  <div 
                    key={dayIndex} 
                    className={`bg-white rounded-xl shadow-sm overflow-hidden border-2 transition-all ${
                      dayCompleted ? 'border-green-200' : 'border-transparent'
                    }`}
                  >
                    {/* Day Header - Clickable */}
                    <button
                      type="button"
                      onClick={() => toggleDay(dayIndex)}
                      className="w-full bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b hover:from-purple-100 hover:to-blue-100 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {dayCompleted ? (
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle size={20} className="text-white" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-white border-2 border-purple-300 rounded-full flex items-center justify-center font-bold text-purple-600 flex-shrink-0">
                              {day.day}
                            </div>
                          )}
                          
                          <div className="text-left">
                            <h4 className="text-lg font-bold text-gray-900">
                              Day {day.day}: {day.title}
                            </h4>
                            <p className="text-sm text-gray-600">{day.focus}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right hidden md:block">
                            <div className="text-sm font-medium text-gray-700">
                              {day.tasks.filter(t => t.completed).length}/{day.tasks.length} tasks
                            </div>
                            <div className="text-xs text-gray-500">{Math.round(dayProgress)}% complete</div>
                          </div>
                          
                          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <ArrowRight size={20} className="text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-300" 
                          style={{ width: `${dayProgress}%` }} 
                        />
                      </div>
                    </button>

                    {/* Day Content - Expandable */}
                    {isExpanded && (
                      <div className="p-6 space-y-6">
                        {/* Objectives */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Target size={16} className="text-blue-600" />
                            Learning Objectives
                          </h5>
                          <ul className="space-y-1">
                            {day.objectives.map((obj, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Tasks */}
                        <div className="space-y-3">
                          {day.tasks.map((task, taskIndex) => (
                            <div
                              key={taskIndex}
                              className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                                task.completed 
                                  ? 'bg-green-50 border border-green-200' 
                                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                              }`}
                            >
                              {/* Status Indicator (not clickable) */}
                              <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all border-gray-300">
                                {task.completed && (
                                  <CheckCircle size={20} className="text-green-600" />
                                )}
                              </div>

                              {/* Task Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Clock size={14} className="text-gray-400 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-600">{task.time}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getTaskColor(task.type)}`}>
                                    {getTaskIcon(task.type)}
                                    {task.type}
                                  </span>
                                  <span className="text-xs text-gray-500">({task.duration})</span>
                                </div>
                                
                                <p className={`font-medium mb-2 ${
                                  task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                                }`}>
                                  {task.task}
                                </p>

                                {/* Resources */}
                                {task.resources && task.resources.length > 0 && (
                                  <div className="flex items-start gap-2 mt-2">
                                    <Bookmark size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 flex flex-wrap gap-2">
                                      {task.resources.map((resource, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-600"
                                        >
                                          {resource}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2 flex-shrink-0">
                                {/* Start Button - Only for non-break tasks with links */}
                                {task.type !== 'break' && task.link && !task.completed && (
                                  <a
                                    href={task.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                                  >
                                    <Play size={14} />
                                    Start
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                                
                                {/* Mark Complete Button - For ALL tasks including breaks */}
                                {!task.completed ? (
                                  <button 
                                    type="button"
                                    onClick={() => toggleTask(dayIndex, taskIndex)}
                                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                                  >
                                    <Check size={14} />
                                    Complete
                                  </button>
                                ) : (
                                  <button 
                                    type="button"
                                    onClick={() => toggleTask(dayIndex, taskIndex)}
                                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                                  >
                                    <Check size={14} />
                                    Undo
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Milestone */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Trophy size={16} className="text-purple-600" />
                            Day {day.day} Milestone
                          </h5>
                          <p className="text-sm text-gray-700">{day.milestone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tips & Resources Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Study Tips */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lightbulb size={20} className="text-yellow-600" />
                  Study Tips
                </h3>
                <ul className="space-y-3">
                  {studyPlan.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="text-purple-600 font-bold flex-shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Resources */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen size={20} className="text-blue-600" />
                  Recommended Resources
                </h3>
                <div className="space-y-4">
                  {Object.entries(studyPlan.resources).map(([category, items]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 capitalize">{category}</h4>
                      <ul className="space-y-1">
                        {items.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-blue-600">→</span>
                            {item}
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
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target size={20} />
                  Weekly Goals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studyPlan.weeklyGoals.map((goal, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <p className="text-sm">{goal}</p>
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