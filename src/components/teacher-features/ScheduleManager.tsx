'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, Trash2, Users, Video, 
  ChevronLeft, ChevronRight, BookOpen, StickyNote,
  X, Star, Repeat, Edit2, Menu
} from 'lucide-react';

// Type Definitions
interface ClassSchedule {
  id: number;
  title: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  students: number;
  type: 'live' | 'recorded' | 'hybrid';
  recurring: 'weekly' | 'daily' | 'none';
  link?: string;
  color: string;
}

interface ExamSchedule {
  id: number;
  title: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  type: 'board' | 'internal' | 'quiz' | 'assignment';
  syllabus: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

interface CustomHoliday {
  id: number;
  date: string;
  name: string;
  reason: string;
}

interface Holiday {
  date: string;
  name: string;
  type?: string;
  reason?: string;
  id?: number;
}

type ModalType = 'class' | 'exam' | 'note' | 'holiday' | null;
type ItemType = 'class' | 'exam' | 'note' | 'holiday';

interface EditingItem {
  id: number;
  type: ItemType;
  [key: string]: any;
}

// Indian School Holidays 2026
const INDIAN_HOLIDAYS: Holiday[] = [
  { date: '2026-01-26', name: 'Republic Day', type: 'national' },
  { date: '2026-03-14', name: 'Holi', type: 'festival' },
  { date: '2026-04-02', name: 'Ram Navami', type: 'festival' },
  { date: '2026-04-10', name: 'Good Friday', type: 'festival' },
  { date: '2026-04-21', name: 'Mahavir Jayanti', type: 'festival' },
  { date: '2026-05-01', name: 'May Day', type: 'national' },
  { date: '2026-05-23', name: 'Buddha Purnima', type: 'festival' },
  { date: '2026-07-07', name: 'Eid ul-Fitr', type: 'festival' },
  { date: '2026-08-15', name: 'Independence Day', type: 'national' },
  { date: '2026-08-19', name: 'Janmashtami', type: 'festival' },
  { date: '2026-09-02', name: 'Ganesh Chaturthi', type: 'festival' },
  { date: '2026-09-13', name: 'Eid ul-Adha', type: 'festival' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { date: '2026-10-15', name: 'Dussehra', type: 'festival' },
  { date: '2026-11-04', name: 'Diwali', type: 'festival' },
  { date: '2026-11-05', name: 'Govardhan Puja', type: 'festival' },
  { date: '2026-11-19', name: 'Guru Nanak Jayanti', type: 'festival' },
  { date: '2026-12-25', name: 'Christmas', type: 'festival' },
];

const STORAGE_KEYS = {
  CLASSES: 'schedule_classes',
  EXAMS: 'schedule_exams',
  NOTES: 'schedule_notes',
  HOLIDAYS: 'schedule_holidays',
  SUNDAY_CLASSES: 'schedule_sunday_classes'
};

export default function ScheduleManager() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Load data from localStorage
  const [classes, setClasses] = useState<ClassSchedule[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [exams, setExams] = useState<ExamSchedule[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.EXAMS);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [sundayClasses, setSundayClasses] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.SUNDAY_CLASSES);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);

  // Form states
  const [classForm, setClassForm] = useState({
    title: '', subject: '', date: '', time: '', duration: '',
    students: '', type: 'live' as 'live' | 'recorded' | 'hybrid', 
    recurring: 'none' as 'weekly' | 'daily' | 'none', link: ''
  });

  const [examForm, setExamForm] = useState({
    title: '', subject: '', date: '', time: '', duration: '',
    type: 'internal' as 'board' | 'internal' | 'quiz' | 'assignment', syllabus: ''
  });

  const [noteForm, setNoteForm] = useState({
    title: '', content: '', date: '', priority: 'medium' as 'high' | 'medium' | 'low'
  });

  const [holidayForm, setHolidayForm] = useState({
    name: '', date: '', reason: ''
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    }
  }, [classes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    }
  }, [exams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    }
  }, [notes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(customHolidays));
    }
  }, [customHolidays]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SUNDAY_CLASSES, JSON.stringify(sundayClasses));
    }
  }, [sundayClasses]);

  // Helper functions
  const formatDate = (date: Date | string | null): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    // Format as YYYY-MM-DD in local timezone
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (dateStr: string): boolean => {
    return dateStr === formatDate(new Date());
  };

  const isHoliday = (dateStr: string): boolean => {
    return INDIAN_HOLIDAYS.some((h: Holiday) => h.date === dateStr) || 
           customHolidays.some((h: CustomHoliday) => h.date === dateStr);
  };

  const getHoliday = (dateStr: string): Holiday | undefined => {
    return INDIAN_HOLIDAYS.find((h: Holiday) => h.date === dateStr) || 
           customHolidays.find((h: CustomHoliday) => h.date === dateStr);
  };

  const getDayEvents = (dateStr: string) => {
    return {
      classes: classes.filter((c: ClassSchedule) => c.date === dateStr),
      exams: exams.filter((e: ExamSchedule) => e.date === dateStr),
      notes: notes.filter((n: Note) => n.date === dateStr),
      holiday: getHoliday(dateStr)
    };
  };

  const isSunday = (date: Date | string): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.getDay() === 0;
  };

  // CRUD Operations
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const newClass: ClassSchedule = {
      id: editingItem?.id || Date.now(),
      title: classForm.title,
      subject: classForm.subject,
      date: classForm.date,
      time: classForm.time,
      duration: classForm.duration,
      students: parseInt(classForm.students) || 0,
      type: classForm.type,
      recurring: classForm.recurring,
      link: classForm.link || undefined,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };

    if (editingItem) {
      setClasses(classes.map((c: ClassSchedule) => c.id === editingItem.id ? newClass : c));
    } else {
      setClasses([...classes, newClass]);
      if (isSunday(classForm.date) && !sundayClasses.includes(classForm.date)) {
        setSundayClasses([...sundayClasses, classForm.date]);
      }
    }

    // Close selected date panel to refresh calendar
    setSelectedDate(null);
    resetForm('class');
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam: ExamSchedule = {
      id: editingItem?.id || Date.now(),
      title: examForm.title,
      subject: examForm.subject,
      date: examForm.date,
      time: examForm.time,
      duration: examForm.duration,
      type: examForm.type,
      syllabus: examForm.syllabus
    };

    if (editingItem) {
      setExams(exams.map((e: ExamSchedule) => e.id === editingItem.id ? newExam : e));
    } else {
      setExams([...exams, newExam]);
    }

    setSelectedDate(null);
    resetForm('exam');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    const newNote: Note = {
      id: editingItem?.id || Date.now(),
      title: noteForm.title,
      content: noteForm.content,
      date: noteForm.date,
      priority: noteForm.priority
    };

    if (editingItem) {
      setNotes(notes.map((n: Note) => n.id === editingItem.id ? newNote : n));
    } else {
      setNotes([...notes, newNote]);
    }

    setSelectedDate(null);
    resetForm('note');
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    const newHoliday: CustomHoliday = {
      id: editingItem?.id || Date.now(),
      date: holidayForm.date,
      name: holidayForm.name,
      reason: holidayForm.reason
    };

    if (editingItem) {
      setCustomHolidays(customHolidays.map((h: CustomHoliday) => h.id === editingItem.id ? newHoliday : h));
    } else {
      setCustomHolidays([...customHolidays, newHoliday]);
    }

    setSelectedDate(null);
    resetForm('holiday');
  };

  const resetForm = (type: ItemType) => {
    setActiveModal(null);
    setEditingItem(null);
    if (type === 'class') {
      setClassForm({ title: '', subject: '', date: '', time: '', duration: '', students: '', type: 'live', recurring: 'none', link: '' });
    } else if (type === 'exam') {
      setExamForm({ title: '', subject: '', date: '', time: '', duration: '', type: 'internal', syllabus: '' });
    } else if (type === 'note') {
      setNoteForm({ title: '', content: '', date: '', priority: 'medium' });
    } else if (type === 'holiday') {
      setHolidayForm({ name: '', date: '', reason: '' });
    }
  };

  const handleEdit = (item: any, type: ItemType) => {
    setEditingItem({ ...item, type });
    if (type === 'class') {
      setClassForm({
        title: item.title,
        subject: item.subject,
        date: item.date,
        time: item.time,
        duration: item.duration,
        students: item.students.toString(),
        type: item.type,
        recurring: item.recurring,
        link: item.link || ''
      });
      setActiveModal('class');
    } else if (type === 'exam') {
      setExamForm(item);
      setActiveModal('exam');
    } else if (type === 'note') {
      setNoteForm(item);
      setActiveModal('note');
    } else if (type === 'holiday') {
      setHolidayForm({ name: item.name, date: item.date, reason: item.reason });
      setActiveModal('holiday');
    }
  };

  const handleDelete = (id: number, type: ItemType) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    if (type === 'class') {
      setClasses(classes.filter((c: ClassSchedule) => c.id !== id));
      // Close selected date panel to force calendar re-render
      setSelectedDate(null);
    }
    else if (type === 'exam') {
      setExams(exams.filter((e: ExamSchedule) => e.id !== id));
      setSelectedDate(null);
    }
    else if (type === 'note') {
      setNotes(notes.filter((n: Note) => n.id !== id));
      setSelectedDate(null);
    }
    else if (type === 'holiday') {
      setCustomHolidays(customHolidays.filter((h: CustomHoliday) => h.id !== id));
      setSelectedDate(null);
    }
  };

  // Calendar rendering
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      const events = getDayEvents(dateStr);
      const hasEvents = events.classes.length > 0 || events.exams.length > 0 || events.notes.length > 0 || events.holiday;
      const isSundayDate = isSunday(date);
      const hasSundayClass = sundayClasses.includes(dateStr);

      // Determine color priority: today > exam > holiday > sunday-class > regular-class
      let colorClass = '';
      
      if (isToday(dateStr)) {
        colorClass = 'bg-blue-600 text-white ring-2 ring-blue-300';
      } else if (events.exams.length > 0) {
        colorClass = 'bg-red-50 text-red-900 border-2 border-red-300';
      } else if (events.holiday && !hasSundayClass) {
        colorClass = 'bg-orange-50 text-orange-900';
      } else if (isSundayDate && hasSundayClass && events.classes.length > 0) {
        colorClass = 'bg-green-50 text-green-900 border border-green-300';
      } else if (isSundayDate && !hasSundayClass) {
        colorClass = 'bg-gray-100 text-gray-400';
      } else if (events.classes.length > 0) {
        colorClass = 'bg-blue-50 text-blue-900';
      } else {
        colorClass = 'hover:bg-gray-100';
      }

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`aspect-square p-2 rounded-lg text-sm font-medium transition-all relative group ${colorClass}`}
        >
          <div className="text-center">
            <div className="mb-1">{day}</div>
            <div className="flex justify-center gap-1">
              {events.classes.length > 0 && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
              {events.exams.length > 0 && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
              {events.notes.length > 0 && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />}
              {events.holiday && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
            </div>
          </div>

          {hasEvents && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl whitespace-nowrap">
              {events.holiday && <div>🎉 {events.holiday.name}</div>}
              {events.exams.length > 0 && <div>📝 {events.exams.length} exam(s)</div>}
              {events.classes.length > 0 && <div>📚 {events.classes.length} class(es)</div>}
              {events.notes.length > 0 && <div>📌 {events.notes.length} note(s)</div>}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const todayClasses = classes.filter((c: ClassSchedule) => c.date === formatDate(new Date()));
  const upcomingExams = exams
    .filter((e: ExamSchedule) => new Date(e.date) >= new Date())
    .sort((a: ExamSchedule, b: ExamSchedule) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Selected date events
  const selectedEvents = selectedDate ? getDayEvents(formatDate(selectedDate)) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Schedule Manager</h1>
                <p className="text-sm text-gray-600">Manage your teaching calendar</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveModal('class')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Class</span>
              </button>
              <button
                onClick={() => setActiveModal('exam')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Exam</span>
              </button>
              <button
                onClick={() => setActiveModal('note')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Note</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {/* Calendar Controls */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day: string) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {renderCalendar()}
              </div>
            </div>

            {/* Today's Classes */}
            {todayClasses.length > 0 && (
              <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Today's Classes
                </h3>
                <div className="space-y-3">
                  {todayClasses.map((cls: ClassSchedule) => (
                    <div key={cls.id} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-gray-900">{cls.title}</h4>
                            {cls.recurring !== 'none' && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                                <Repeat className="w-3 h-3" />
                                {cls.recurring}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Subject: {cls.subject}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {cls.time}
                            </span>
                            <span>Duration: {cls.duration}h</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {cls.students} students
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {cls.link && (
                            <a
                              href={cls.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
                            >
                              <Video className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleEdit(cls, 'class')}
                            className="p-2 hover:bg-blue-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cls.id, 'class')}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Date Details */}
            {selectedDate && selectedEvents && (
              <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>

                {selectedEvents.holiday && (
                  <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-bold text-orange-900">🎉 {selectedEvents.holiday.name}</h4>
                    {selectedEvents.holiday.reason && (
                      <p className="text-sm text-orange-700 mt-1">{selectedEvents.holiday.reason}</p>
                    )}
                  </div>
                )}

                {selectedEvents.classes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Classes ({selectedEvents.classes.length})</h4>
                    <div className="space-y-2">
                      {selectedEvents.classes.map((cls: ClassSchedule) => (
                        <div key={cls.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-bold text-blue-900">{cls.title}</h5>
                              <p className="text-sm text-blue-700">Subject: {cls.subject}</p>
                              <div className="flex items-center gap-3 text-xs text-blue-600 mt-1">
                                <span>⏰ {cls.time}</span>
                                <span>⏱️ {cls.duration}h</span>
                                <span>👥 {cls.students}</span>
                                <span className="capitalize">📹 {cls.type}</span>
                              </div>
                              {cls.link && (
                                <a href={cls.link} target="_blank" rel="noopener noreferrer" 
                                   className="text-xs text-blue-600 hover:underline mt-1 block">
                                  🔗 Join Meeting
                                </a>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => handleEdit(cls, 'class')} className="p-1 hover:bg-blue-100 rounded">
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDelete(cls.id, 'class')} className="p-1 hover:bg-red-100 text-red-600 rounded">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvents.exams.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Exams ({selectedEvents.exams.length})</h4>
                    <div className="space-y-2">
                      {selectedEvents.exams.map((exam: ExamSchedule) => (
                        <div key={exam.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-bold text-red-900">{exam.title}</h5>
                              <p className="text-sm text-red-700">Subject: {exam.subject}</p>
                              <div className="flex items-center gap-3 text-xs text-red-600 mt-1">
                                <span>⏰ {exam.time}</span>
                                <span>⏱️ {exam.duration}h</span>
                                <span className="capitalize">📋 {exam.type}</span>
                              </div>
                              <p className="text-xs text-red-600 mt-1">Syllabus: {exam.syllabus}</p>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => handleEdit(exam, 'exam')} className="p-1 hover:bg-red-100 rounded">
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDelete(exam.id, 'exam')} className="p-1 hover:bg-red-200 rounded">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvents.notes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Notes ({selectedEvents.notes.length})</h4>
                    <div className="space-y-2">
                      {selectedEvents.notes.map((note: Note) => {
                        const priorityColors = {
                          high: 'bg-red-50 border-red-200 text-red-900',
                          medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
                          low: 'bg-green-50 border-green-200 text-green-900'
                        };
                        return (
                          <div key={note.id} className={`p-3 border rounded-lg ${priorityColors[note.priority]}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-bold text-sm">{note.title}</h5>
                                  <span className="text-xs px-2 py-0.5 bg-white/50 rounded-full capitalize">{note.priority}</span>
                                </div>
                                <p className="text-xs">{note.content}</p>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => handleEdit(note, 'note')} className="p-1 hover:bg-white/50 rounded">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDelete(note.id, 'note')} className="p-1 hover:bg-white/50 rounded">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedEvents.classes.length === 0 && selectedEvents.exams.length === 0 && 
                 selectedEvents.notes.length === 0 && !selectedEvents.holiday && (
                  <p className="text-gray-500 text-center py-4">No events scheduled for this day</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className={`lg:block ${isSidebarOpen ? 'block' : 'hidden'} space-y-6`}>
            {/* Upcoming Exams */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-red-600" />
                Upcoming Exams
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {upcomingExams.length > 0 ? (
                  upcomingExams.map((exam: ExamSchedule) => (
                    <div key={exam.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-sm text-red-900">{exam.title}</h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(exam, 'exam')}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id, 'exam')}
                            className="p-1 hover:bg-red-200 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-red-700 mb-1">{exam.subject}</p>
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <Calendar className="w-3 h-3" />
                        {new Date(exam.date).toLocaleDateString()}
                        <Clock className="w-3 h-3 ml-2" />
                        {exam.time}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No upcoming exams</p>
                )}
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-yellow-600" />
                Notes
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notes.slice(0, 5).map((note: Note) => {
                  const priorityColors = {
                    high: 'bg-red-50 border-red-200 text-red-900',
                    medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
                    low: 'bg-green-50 border-green-200 text-green-900'
                  };
                  return (
                    <div key={note.id} className={`p-3 border rounded-lg ${priorityColors[note.priority]}`}>
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold text-sm">{note.title}</h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(note, 'note')}
                            className="p-1 hover:bg-white/50 rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id, 'note')}
                            className="p-1 hover:bg-white/50 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs mb-2">{note.content}</p>
                      <div className="text-xs opacity-75">
                        {new Date(note.date).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Holidays */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-600" />
                  Holidays
                </h3>
                <button
                  onClick={() => setActiveModal('holiday')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {[...INDIAN_HOLIDAYS, ...customHolidays]
                  .filter((h: Holiday | CustomHoliday) => new Date(h.date) >= new Date())
                  .sort((a: Holiday | CustomHoliday, b: Holiday | CustomHoliday) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 8)
                  .map((holiday: Holiday | CustomHoliday, idx: number) => (
                    <div key={idx} className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-orange-900">{holiday.name}</p>
                          <p className="text-xs text-orange-600">
                            {new Date(holiday.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                        {'id' in holiday && holiday.id && (
                          <button
                            onClick={() => handleDelete(holiday.id!, 'holiday')}
                            className="p-1 hover:bg-orange-100 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Class Modal */}
      {activeModal === 'class' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingItem ? 'Edit' : 'Add'} Class</h3>
              <button onClick={() => resetForm('class')} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={classForm.title}
                    onChange={(e) => setClassForm({...classForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Physics - Wave Optics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={classForm.subject}
                    onChange={(e) => setClassForm({...classForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Physics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={classForm.date}
                    onChange={(e) => setClassForm({...classForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input
                    type="time"
                    required
                    value={classForm.time}
                    onChange={(e) => setClassForm({...classForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours) *</label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    value={classForm.duration}
                    onChange={(e) => setClassForm({...classForm, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Students</label>
                  <input
                    type="number"
                    value={classForm.students}
                    onChange={(e) => setClassForm({...classForm, students: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={classForm.type}
                    onChange={(e) => setClassForm({...classForm, type: e.target.value as 'live' | 'recorded' | 'hybrid'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="live">Live</option>
                    <option value="recorded">Recorded</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recurring</label>
                  <select
                    value={classForm.recurring}
                    onChange={(e) => setClassForm({...classForm, recurring: e.target.value as 'weekly' | 'daily' | 'none'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                <input
                  type="url"
                  value={classForm.link}
                  onChange={(e) => setClassForm({...classForm, link: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                  {editingItem ? 'Update' : 'Add'} Class
                </button>
                <button type="button" onClick={() => resetForm('class')} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Exam Modal */}
      {activeModal === 'exam' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingItem ? 'Edit' : 'Add'} Exam</h3>
              <button onClick={() => resetForm('exam')} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddExam} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={examForm.title}
                    onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Physics Board Exam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={examForm.subject}
                    onChange={(e) => setExamForm({...examForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Physics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={examForm.date}
                    onChange={(e) => setExamForm({...examForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input
                    type="time"
                    required
                    value={examForm.time}
                    onChange={(e) => setExamForm({...examForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours) *</label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    value={examForm.duration}
                    onChange={(e) => setExamForm({...examForm, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={examForm.type}
                    onChange={(e) => setExamForm({...examForm, type: e.target.value as 'board' | 'internal' | 'quiz' | 'assignment'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="internal">Internal Test</option>
                    <option value="board">Board Exam</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Syllabus *</label>
                <textarea
                  required
                  rows={3}
                  value={examForm.syllabus}
                  onChange={(e) => setExamForm({...examForm, syllabus: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Chapters 1-15, Topics..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition">
                  {editingItem ? 'Update' : 'Add'} Exam
                </button>
                <button type="button" onClick={() => resetForm('exam')} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {activeModal === 'note' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingItem ? 'Edit' : 'Add'} Note</h3>
              <button onClick={() => resetForm('note')} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Prepare Lab Equipment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  required
                  rows={4}
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Add details..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={noteForm.date}
                    onChange={(e) => setNoteForm({...noteForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select
                    value={noteForm.priority}
                    onChange={(e) => setNoteForm({...noteForm, priority: e.target.value as 'high' | 'medium' | 'low'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition">
                  {editingItem ? 'Update' : 'Add'} Note
                </button>
                <button type="button" onClick={() => resetForm('note')} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Custom Holiday Modal */}
      {activeModal === 'holiday' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{editingItem ? 'Edit' : 'Add'} Custom Holiday</h3>
              <button onClick={() => resetForm('holiday')} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({...holidayForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="School Annual Day"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({...holidayForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={holidayForm.reason}
                  onChange={(e) => setHolidayForm({...holidayForm, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Annual function and prize distribution"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition">
                  {editingItem ? 'Update' : 'Add'} Holiday
                </button>
                <button type="button" onClick={() => resetForm('holiday')} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}