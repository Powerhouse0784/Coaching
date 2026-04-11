'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Plus, Trash2, Users, Video,
  ChevronLeft, ChevronRight, BookOpen, StickyNote,
  X, Star, Repeat, Edit2, Menu, Info, Zap
} from 'lucide-react';

// ── Type Definitions ──────────────────────────────────────────────────────────
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
type ItemType  = 'class' | 'exam' | 'note' | 'holiday';
interface EditingItem { id: number; type: ItemType; [key: string]: any; }

// ── Dark Mode Hook (mirrors AIAssistant exactly) ──────────────────────────────
function useDarkMode() {
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dm;
}

// ── Indian School Holidays 2026 ───────────────────────────────────────────────
const INDIAN_HOLIDAYS: Holiday[] = [
  { date: '2026-01-26', name: 'Republic Day',      type: 'national' },
  { date: '2026-03-14', name: 'Holi',              type: 'festival' },
  { date: '2026-04-02', name: 'Ram Navami',         type: 'festival' },
  { date: '2026-04-10', name: 'Good Friday',        type: 'festival' },
  { date: '2026-04-21', name: 'Mahavir Jayanti',    type: 'festival' },
  { date: '2026-05-01', name: 'May Day',            type: 'national' },
  { date: '2026-05-23', name: 'Buddha Purnima',     type: 'festival' },
  { date: '2026-07-07', name: 'Eid ul-Fitr',        type: 'festival' },
  { date: '2026-08-15', name: 'Independence Day',   type: 'national' },
  { date: '2026-08-19', name: 'Janmashtami',        type: 'festival' },
  { date: '2026-09-02', name: 'Ganesh Chaturthi',   type: 'festival' },
  { date: '2026-09-13', name: 'Eid ul-Adha',        type: 'festival' },
  { date: '2026-10-02', name: 'Gandhi Jayanti',     type: 'national' },
  { date: '2026-10-15', name: 'Dussehra',           type: 'festival' },
  { date: '2026-11-04', name: 'Diwali',             type: 'festival' },
  { date: '2026-11-05', name: 'Govardhan Puja',     type: 'festival' },
  { date: '2026-11-19', name: 'Guru Nanak Jayanti', type: 'festival' },
  { date: '2026-12-25', name: 'Christmas',          type: 'festival' },
];

const STORAGE_KEYS = {
  CLASSES:        'schedule_classes',
  EXAMS:          'schedule_exams',
  NOTES:          'schedule_notes',
  HOLIDAYS:       'schedule_holidays',
  SUNDAY_CLASSES: 'schedule_sunday_classes',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ScheduleManager() {
  const dm = useDarkMode();

  const [currentDate,   setCurrentDate]   = useState(new Date());
  const [selectedDate,  setSelectedDate]  = useState<Date | null>(null);
  const [activeModal,   setActiveModal]   = useState<ModalType>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [classes, setClasses] = useState<ClassSchedule[]>(() => {
    if (typeof window !== 'undefined') { const s = localStorage.getItem(STORAGE_KEYS.CLASSES); return s ? JSON.parse(s) : []; } return [];
  });
  const [exams, setExams] = useState<ExamSchedule[]>(() => {
    if (typeof window !== 'undefined') { const s = localStorage.getItem(STORAGE_KEYS.EXAMS); return s ? JSON.parse(s) : []; } return [];
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window !== 'undefined') { const s = localStorage.getItem(STORAGE_KEYS.NOTES); return s ? JSON.parse(s) : []; } return [];
  });
  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>(() => {
    if (typeof window !== 'undefined') { const s = localStorage.getItem(STORAGE_KEYS.HOLIDAYS); return s ? JSON.parse(s) : []; } return [];
  });
  const [sundayClasses, setSundayClasses] = useState<string[]>(() => {
    if (typeof window !== 'undefined') { const s = localStorage.getItem(STORAGE_KEYS.SUNDAY_CLASSES); return s ? JSON.parse(s) : []; } return [];
  });
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);

  const [classForm, setClassForm] = useState({
    title: '', subject: '', date: '', time: '', duration: '',
    students: '', type: 'live' as 'live' | 'recorded' | 'hybrid',
    recurring: 'none' as 'weekly' | 'daily' | 'none', link: '',
  });
  const [examForm, setExamForm] = useState({
    title: '', subject: '', date: '', time: '', duration: '',
    type: 'internal' as 'board' | 'internal' | 'quiz' | 'assignment', syllabus: '',
  });
  const [noteForm,    setNoteForm]    = useState({ title: '', content: '', date: '', priority: 'medium' as 'high' | 'medium' | 'low' });
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', reason: '' });

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.CLASSES,        JSON.stringify(classes));        }, [classes]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.EXAMS,          JSON.stringify(exams));          }, [exams]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.NOTES,          JSON.stringify(notes));          }, [notes]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.HOLIDAYS,       JSON.stringify(customHolidays)); }, [customHolidays]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYS.SUNDAY_CLASSES, JSON.stringify(sundayClasses));  }, [sundayClasses]);

  // ── Helpers ──
  const formatDate = (date: Date | string | null): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const isToday    = (s: string) => s === formatDate(new Date());
  const getHoliday = (s: string): Holiday | undefined =>
    INDIAN_HOLIDAYS.find(h => h.date === s) || customHolidays.find(h => h.date === s);
  const getDayEvents = (s: string) => ({
    classes: classes.filter(c => c.date === s),
    exams:   exams.filter(e => e.date === s),
    notes:   notes.filter(n => n.date === s),
    holiday: getHoliday(s),
  });
  const isSunday = (date: Date | string) => (typeof date === 'string' ? new Date(date) : date).getDay() === 0;

  // ── CRUD ──
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const nc: ClassSchedule = {
      id: editingItem?.id || Date.now(), title: classForm.title, subject: classForm.subject,
      date: classForm.date, time: classForm.time, duration: classForm.duration,
      students: parseInt(classForm.students) || 0, type: classForm.type,
      recurring: classForm.recurring, link: classForm.link || undefined,
      color: `hsl(${Math.random() * 360},70%,60%)`,
    };
    if (editingItem) setClasses(classes.map(c => c.id === editingItem.id ? nc : c));
    else {
      setClasses([...classes, nc]);
      if (isSunday(classForm.date) && !sundayClasses.includes(classForm.date))
        setSundayClasses([...sundayClasses, classForm.date]);
    }
    setSelectedDate(null); resetForm('class');
  };
  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    const ne: ExamSchedule = { id: editingItem?.id || Date.now(), title: examForm.title, subject: examForm.subject, date: examForm.date, time: examForm.time, duration: examForm.duration, type: examForm.type, syllabus: examForm.syllabus };
    if (editingItem) setExams(exams.map(x => x.id === editingItem.id ? ne : x));
    else setExams([...exams, ne]);
    setSelectedDate(null); resetForm('exam');
  };
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    const nn: Note = { id: editingItem?.id || Date.now(), title: noteForm.title, content: noteForm.content, date: noteForm.date, priority: noteForm.priority };
    if (editingItem) setNotes(notes.map(n => n.id === editingItem.id ? nn : n));
    else setNotes([...notes, nn]);
    setSelectedDate(null); resetForm('note');
  };
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    const nh: CustomHoliday = { id: editingItem?.id || Date.now(), date: holidayForm.date, name: holidayForm.name, reason: holidayForm.reason };
    if (editingItem) setCustomHolidays(customHolidays.map(h => h.id === editingItem.id ? nh : h));
    else setCustomHolidays([...customHolidays, nh]);
    setSelectedDate(null); resetForm('holiday');
  };
  const resetForm = (type: ItemType) => {
    setActiveModal(null); setEditingItem(null);
    if (type === 'class')   setClassForm({ title: '', subject: '', date: '', time: '', duration: '', students: '', type: 'live', recurring: 'none', link: '' });
    if (type === 'exam')    setExamForm({ title: '', subject: '', date: '', time: '', duration: '', type: 'internal', syllabus: '' });
    if (type === 'note')    setNoteForm({ title: '', content: '', date: '', priority: 'medium' });
    if (type === 'holiday') setHolidayForm({ name: '', date: '', reason: '' });
  };
  const handleEdit = (item: any, type: ItemType) => {
    setEditingItem({ ...item, type });
    if (type === 'class') { setClassForm({ title: item.title, subject: item.subject, date: item.date, time: item.time, duration: item.duration, students: item.students.toString(), type: item.type, recurring: item.recurring, link: item.link || '' }); setActiveModal('class'); }
    else if (type === 'exam')    { setExamForm(item);                                                                           setActiveModal('exam');    }
    else if (type === 'note')    { setNoteForm(item);                                                                           setActiveModal('note');    }
    else if (type === 'holiday') { setHolidayForm({ name: item.name, date: item.date, reason: item.reason });                   setActiveModal('holiday'); }
  };
  const handleDelete = (id: number, type: ItemType) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    if (type === 'class')   { setClasses(classes.filter(c => c.id !== id));               setSelectedDate(null); }
    if (type === 'exam')    { setExams(exams.filter(e => e.id !== id));                    setSelectedDate(null); }
    if (type === 'note')    { setNotes(notes.filter(n => n.id !== id));                    setSelectedDate(null); }
    if (type === 'holiday') { setCustomHolidays(customHolidays.filter(h => h.id !== id)); setSelectedDate(null); }
  };

  // ── Calendar ──
  const renderCalendar = () => {
    const year = currentDate.getFullYear(), month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} className="aspect-square" />);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      const ev = getDayEvents(dateStr);
      const hasEv = ev.classes.length > 0 || ev.exams.length > 0 || ev.notes.length > 0 || ev.holiday;
      const isSun = isSunday(date);
      const hasSunCls = sundayClasses.includes(dateStr);
      let cc = '';
      if (isToday(dateStr)) cc = 'bg-blue-600 text-white ring-2 ring-blue-300';
      else if (ev.exams.length > 0)         cc = dm ? 'bg-red-900/40 text-red-200 border-2 border-red-700'    : 'bg-red-50 text-red-900 border-2 border-red-300';
      else if (ev.holiday && !hasSunCls)    cc = dm ? 'bg-orange-900/30 text-orange-200'                      : 'bg-orange-50 text-orange-900';
      else if (isSun && hasSunCls && ev.classes.length > 0) cc = dm ? 'bg-green-900/30 text-green-200 border border-green-700' : 'bg-green-50 text-green-900 border border-green-300';
      else if (isSun && !hasSunCls)         cc = dm ? 'bg-gray-800 text-gray-600'                             : 'bg-gray-100 text-gray-400';
      else if (ev.classes.length > 0)       cc = dm ? 'bg-blue-900/30 text-blue-200'                          : 'bg-blue-50 text-blue-900';
      else cc = dm ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700';

      days.push(
        <button key={day} onClick={() => setSelectedDate(date)}
          className={`aspect-square p-0.5 sm:p-1 lg:p-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative group ${cc}`}>
          <div className="text-center">
            <div className="mb-0.5">{day}</div>
            <div className="flex justify-center gap-0.5">
              {ev.classes.length > 0 && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full" />}
              {ev.exams.length   > 0 && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full" />}
              {ev.notes.length   > 0 && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-yellow-500 rounded-full" />}
              {ev.holiday           && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-orange-500 rounded-full" />}
            </div>
          </div>
          {hasEv && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl whitespace-nowrap pointer-events-none">
              {ev.holiday            && <div>🎉 {ev.holiday.name}</div>}
              {ev.exams.length   > 0 && <div>📝 {ev.exams.length} exam(s)</div>}
              {ev.classes.length > 0 && <div>📚 {ev.classes.length} class(es)</div>}
              {ev.notes.length   > 0 && <div>📌 {ev.notes.length} note(s)</div>}
            </div>
          )}
        </button>
      );
    }
    return days;
  };

  const changeMonth = (d: number) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + d, 1));
  const todayClasses  = classes.filter(c => c.date === formatDate(new Date()));
  const upcomingExams = exams.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);
  const selectedEvents = selectedDate ? getDayEvents(formatDate(selectedDate)) : null;

  // ── Style tokens ──
  const card     = `rounded-xl border-2 shadow-lg ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`;
  const inputCls = `w-full px-3 py-2 sm:py-2.5 border-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`;
  const labelCls = `block text-xs sm:text-sm font-medium mb-1 ${dm ? 'text-gray-300' : 'text-gray-700'}`;
  const cancelBtn = `px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-colors text-sm sm:text-base ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
  const iconBtn  = (color?: string) => `p-1.5 sm:p-2 rounded-xl transition-colors ${color ?? (dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}`;
  const heading  = `font-bold ${dm ? 'text-white' : 'text-gray-900'}`;

  const priorityCls = (p: 'high'|'medium'|'low') => {
    if (p === 'high')   return dm ? 'bg-red-900/30 border-red-700 text-red-200'         : 'bg-red-50 border-red-200 text-red-900';
    if (p === 'medium') return dm ? 'bg-yellow-900/30 border-yellow-700 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-900';
    return dm ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-900';
  };

  // ── Modal wrapper ──
  const ModalWrap = ({ children }: { children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className={`${dm ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl`}>
        {children}
      </div>
    </div>
  );
  const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
    <div className={`sticky top-0 ${dm ? 'bg-gray-800' : 'bg-white'} flex items-center justify-between p-4 sm:p-6 pb-3 border-b-2 ${dm ? 'border-gray-700' : 'border-gray-100'} rounded-t-2xl`}>
      <h3 className={`text-lg sm:text-xl font-bold ${heading}`}>{title}</h3>
      <button onClick={onClose} className={iconBtn()}><X className="w-5 h-5" /></button>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-blue-50'}`}>

      {/* ── Header ── */}
      <header className={`border-b-2 sticky top-0 z-40 shadow-sm transition-colors ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`lg:hidden p-2 rounded-xl transition-colors ${dm ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className={`text-lg sm:text-2xl font-bold truncate ${heading}`}>Schedule Manager</h1>
                <p className={`text-xs sm:text-sm hidden sm:block ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Manage your teaching calendar</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {([['Class','class','bg-blue-600 hover:bg-blue-700'],['Exam','exam','bg-red-600 hover:bg-red-700'],['Note','note','bg-yellow-600 hover:bg-yellow-700']] as const).map(([label, modal, color]) => (
                <button key={label} onClick={() => setActiveModal(modal as ModalType)}
                  className={`px-2.5 sm:px-4 py-2 sm:py-2.5 ${color} text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm`}>
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex gap-4 lg:gap-6 relative">

          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">

            {/* Calendar */}
            <div className={`${card} p-3 sm:p-5 lg:p-6`}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`text-base sm:text-xl font-bold ${heading}`}>
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button onClick={() => setCurrentDate(new Date())}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition">Today</button>
                  <button onClick={() => changeMonth(-1)} className={iconBtn()}><ChevronLeft  className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                  <button onClick={() => changeMonth(1)}  className={iconBtn()}><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
                  <div key={d} className={`text-center text-xs sm:text-sm font-semibold py-1 sm:py-2 ${i === 0 ? 'text-red-500' : dm ? 'text-gray-400' : 'text-gray-600'}`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">{renderCalendar()}</div>
              <div className={`mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 flex flex-wrap gap-3 sm:gap-4 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                {[['bg-blue-500','Class'],['bg-red-500','Exam'],['bg-yellow-500','Note'],['bg-orange-500','Holiday']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${c}`} />
                    <span className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Classes */}
            {todayClasses.length > 0 && (
              <div className={`${card} p-4 sm:p-5 lg:p-6`}>
                <h3 className={`font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2 ${heading}`}>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />Today's Classes
                </h3>
                <div className="space-y-3">
                  {todayClasses.map(cls => (
                    <div key={cls.id} className={`p-3 sm:p-4 rounded-xl border-2 ${dm ? 'bg-blue-900/20 border-blue-800' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h4 className={`font-bold text-sm sm:text-base truncate ${dm ? 'text-blue-200' : 'text-gray-900'}`}>{cls.title}</h4>
                            {cls.recurring !== 'none' && (
                              <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 flex-shrink-0 ${dm ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                                <Repeat className="w-3 h-3" />{cls.recurring}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs sm:text-sm mb-2 ${dm ? 'text-blue-300' : 'text-gray-600'}`}>Subject: {cls.subject}</p>
                          <div className={`flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm ${dm ? 'text-blue-400' : 'text-gray-600'}`}>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.time}</span>
                            <span>Duration: {cls.duration}h</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cls.students} students</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {cls.link && (
                            <a href={cls.link} target="_blank" rel="noopener noreferrer"
                              className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors shadow-md">
                              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </a>
                          )}
                          <button onClick={() => handleEdit(cls, 'class')} className={iconBtn()}><Edit2  className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                          <button onClick={() => handleDelete(cls.id, 'class')} className={iconBtn(dm ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-100 text-red-600')}><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Date */}
            {selectedDate && selectedEvents && (
              <div className={`${card} p-4 sm:p-5 lg:p-6`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                  <h3 className={`font-bold text-sm sm:text-lg flex items-center gap-2 min-w-0 ${heading}`}>
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                    <span className="truncate">{selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </h3>
                  <button onClick={() => setSelectedDate(null)} className={iconBtn()}><X className="w-4 h-4" /></button>
                </div>

                {selectedEvents.holiday && (
                  <div className={`mb-4 p-3 sm:p-4 rounded-xl border-2 ${dm ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
                    <h4 className={`font-bold text-sm sm:text-base ${dm ? 'text-orange-200' : 'text-orange-900'}`}>🎉 {selectedEvents.holiday.name}</h4>
                    {selectedEvents.holiday.reason && <p className={`text-xs sm:text-sm mt-1 ${dm ? 'text-orange-300' : 'text-orange-700'}`}>{selectedEvents.holiday.reason}</p>}
                  </div>
                )}

                {selectedEvents.classes.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`font-semibold text-sm sm:text-base mb-2 ${heading}`}>Classes ({selectedEvents.classes.length})</h4>
                    <div className="space-y-2">
                      {selectedEvents.classes.map(cls => (
                        <div key={cls.id} className={`p-3 rounded-xl border-2 ${dm ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h5 className={`font-bold text-sm truncate ${dm ? 'text-blue-200' : 'text-blue-900'}`}>{cls.title}</h5>
                              <p className={`text-xs ${dm ? 'text-blue-300' : 'text-blue-700'}`}>Subject: {cls.subject}</p>
                              <div className={`flex flex-wrap gap-2 text-xs mt-1 ${dm ? 'text-blue-400' : 'text-blue-600'}`}>
                                <span>⏰ {cls.time}</span><span>⏱️ {cls.duration}h</span><span>👥 {cls.students}</span><span className="capitalize">📹 {cls.type}</span>
                              </div>
                              {cls.link && <a href={cls.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">🔗 Join Meeting</a>}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => handleEdit(cls, 'class')} className={iconBtn()}><Edit2 className="w-3 h-3" /></button>
                              <button onClick={() => handleDelete(cls.id, 'class')} className={iconBtn(dm ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-100 text-red-600')}><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvents.exams.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`font-semibold text-sm sm:text-base mb-2 ${heading}`}>Exams ({selectedEvents.exams.length})</h4>
                    <div className="space-y-2">
                      {selectedEvents.exams.map(exam => (
                        <div key={exam.id} className={`p-3 rounded-xl border-2 ${dm ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h5 className={`font-bold text-sm truncate ${dm ? 'text-red-200' : 'text-red-900'}`}>{exam.title}</h5>
                              <p className={`text-xs ${dm ? 'text-red-300' : 'text-red-700'}`}>Subject: {exam.subject}</p>
                              <div className={`flex flex-wrap gap-2 text-xs mt-1 ${dm ? 'text-red-400' : 'text-red-600'}`}>
                                <span>⏰ {exam.time}</span><span>⏱️ {exam.duration}h</span><span className="capitalize">📋 {exam.type}</span>
                              </div>
                              <p className={`text-xs mt-1 ${dm ? 'text-red-400' : 'text-red-600'}`}>Syllabus: {exam.syllabus}</p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => handleEdit(exam, 'exam')} className={iconBtn()}><Edit2 className="w-3 h-3" /></button>
                              <button onClick={() => handleDelete(exam.id, 'exam')} className={iconBtn(dm ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-100 text-red-600')}><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvents.notes.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`font-semibold text-sm sm:text-base mb-2 ${heading}`}>Notes ({selectedEvents.notes.length})</h4>
                    <div className="space-y-2">
                      {selectedEvents.notes.map(note => (
                        <div key={note.id} className={`p-3 border-2 rounded-xl ${priorityCls(note.priority)}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-bold text-sm truncate">{note.title}</h5>
                                <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full capitalize flex-shrink-0">{note.priority}</span>
                              </div>
                              <p className="text-xs">{note.content}</p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => handleEdit(note, 'note')} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><Edit2 className="w-3 h-3" /></button>
                              <button onClick={() => handleDelete(note.id, 'note')} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedEvents.classes.length && !selectedEvents.exams.length && !selectedEvents.notes.length && !selectedEvents.holiday && (
                  <p className={`text-center py-6 text-sm ${dm ? 'text-gray-500' : 'text-gray-500'}`}>No events scheduled for this day</p>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className={`
            fixed lg:static inset-y-0 right-0 z-40
            w-72 sm:w-80 lg:w-72 xl:w-80 flex-shrink-0
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            overflow-y-auto lg:overflow-visible
            ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-blue-50'}
            lg:bg-transparent pt-16 lg:pt-0 px-3 lg:px-0 pb-6
          `}>
            <div className="space-y-4 sm:space-y-6">

              <button onClick={() => setIsSidebarOpen(false)}
                className={`lg:hidden absolute top-4 right-4 p-2 rounded-xl transition-colors ${iconBtn()}`}>
                <X className="w-5 h-5" />
              </button>

              {/* Upcoming Exams */}
              <div className={`${card} p-4 sm:p-5`}>
                <h3 className={`font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base ${heading}`}>
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />Upcoming Exams
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {upcomingExams.length > 0 ? upcomingExams.map(exam => (
                    <div key={exam.id} className={`p-3 rounded-xl border-2 ${dm ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start justify-between mb-1 gap-2">
                        <h4 className={`font-bold text-sm truncate ${dm ? 'text-red-200' : 'text-red-900'}`}>{exam.title}</h4>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => handleEdit(exam, 'exam')} className={iconBtn()}><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleDelete(exam.id, 'exam')} className={iconBtn(dm ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-200')}><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <p className={`text-xs mb-1 ${dm ? 'text-red-300' : 'text-red-700'}`}>{exam.subject}</p>
                      <div className={`flex items-center gap-2 text-xs ${dm ? 'text-red-400' : 'text-red-600'}`}>
                        <Calendar className="w-3 h-3" />{new Date(exam.date).toLocaleDateString()}
                        <Clock className="w-3 h-3 ml-1" />{exam.time}
                      </div>
                    </div>
                  )) : <p className={`text-sm text-center py-4 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>No upcoming exams</p>}
                </div>
              </div>

              {/* Notes */}
              <div className={`${card} p-4 sm:p-5`}>
                <h3 className={`font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base ${heading}`}>
                  <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />Notes
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {notes.length > 0 ? notes.slice(0, 5).map(note => (
                    <div key={note.id} className={`p-3 border-2 rounded-xl ${priorityCls(note.priority)}`}>
                      <div className="flex items-start justify-between mb-1 gap-2">
                        <h4 className="font-bold text-sm truncate">{note.title}</h4>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => handleEdit(note, 'note')} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => handleDelete(note.id, 'note')} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <p className="text-xs mb-2 line-clamp-2">{note.content}</p>
                      <div className="text-xs opacity-75">{new Date(note.date).toLocaleDateString()}</div>
                    </div>
                  )) : <p className={`text-sm text-center py-4 ${dm ? 'text-gray-500' : 'text-gray-500'}`}>No notes yet</p>}
                </div>
              </div>

              {/* Holidays */}
              <div className={`${card} p-4 sm:p-5`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className={`font-bold flex items-center gap-2 text-sm sm:text-base ${heading}`}>
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />Holidays
                  </h3>
                  <button onClick={() => setActiveModal('holiday')} className={iconBtn()}><Plus className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[...INDIAN_HOLIDAYS, ...customHolidays]
                    .filter(h => new Date(h.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 8)
                    .map((holiday, idx) => (
                      <div key={idx} className={`p-2 rounded-xl border-2 ${dm ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-xs sm:text-sm truncate ${dm ? 'text-orange-200' : 'text-orange-900'}`}>{holiday.name}</p>
                            <p className={`text-xs ${dm ? 'text-orange-400' : 'text-orange-600'}`}>{new Date(holiday.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                          </div>
                          {'id' in holiday && holiday.id && (
                            <button onClick={() => handleDelete(holiday.id!, 'holiday')} className={iconBtn()}><Trash2 className="w-3 h-3" /></button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Tips */}
              <div className={`border-2 rounded-xl p-4 sm:p-5 ${dm ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm mb-1.5 ${heading}`}>Quick Tips</h4>
                    {['Click any date to see its events','Sunday classes override holiday coloring','Use recurring for weekly classes'].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1">
                        <Zap className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className={`text-xs ${dm ? 'text-blue-300' : 'text-gray-700'}`}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MODALS ══ */}

      {activeModal === 'class' && (
        <ModalWrap>
          <ModalHeader title={`${editingItem ? 'Edit' : 'Add'} Class`} onClose={() => resetForm('class')} />
          <form onSubmit={handleAddClass} className="p-4 sm:p-6 pt-4 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div><label className={labelCls}>Title *</label><input type="text" required value={classForm.title}    onChange={e => setClassForm({...classForm, title: e.target.value})}    placeholder="Physics – Wave Optics" className={inputCls} /></div>
              <div><label className={labelCls}>Subject *</label><input type="text" required value={classForm.subject}  onChange={e => setClassForm({...classForm, subject: e.target.value})}  placeholder="Physics"             className={inputCls} /></div>
              <div><label className={labelCls}>Date *</label><input type="date" required value={classForm.date}     onChange={e => setClassForm({...classForm, date: e.target.value})}     className={inputCls} /></div>
              <div><label className={labelCls}>Time *</label><input type="time" required value={classForm.time}     onChange={e => setClassForm({...classForm, time: e.target.value})}     className={inputCls} /></div>
              <div><label className={labelCls}>Duration (hours) *</label><input type="number" required step="0.5" value={classForm.duration}  onChange={e => setClassForm({...classForm, duration: e.target.value})}  placeholder="2" className={inputCls} /></div>
              <div><label className={labelCls}>Students</label><input type="number" value={classForm.students}  onChange={e => setClassForm({...classForm, students: e.target.value})}  placeholder="50" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Type *</label>
                <select value={classForm.type} onChange={e => setClassForm({...classForm, type: e.target.value as any})} className={inputCls}>
                  <option value="live">Live</option><option value="recorded">Recorded</option><option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Recurring</label>
                <select value={classForm.recurring} onChange={e => setClassForm({...classForm, recurring: e.target.value as any})} className={inputCls}>
                  <option value="none">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            <div><label className={labelCls}>Meeting Link</label><input type="url" value={classForm.link} onChange={e => setClassForm({...classForm, link: e.target.value})} placeholder="https://meet.google.com/..." className={inputCls} /></div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg text-sm sm:text-base">{editingItem ? 'Update' : 'Add'} Class</button>
              <button type="button" onClick={() => resetForm('class')} className={cancelBtn}>Cancel</button>
            </div>
          </form>
        </ModalWrap>
      )}

      {activeModal === 'exam' && (
        <ModalWrap>
          <ModalHeader title={`${editingItem ? 'Edit' : 'Add'} Exam`} onClose={() => resetForm('exam')} />
          <form onSubmit={handleAddExam} className="p-4 sm:p-6 pt-4 space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div><label className={labelCls}>Title *</label><input type="text" required value={examForm.title}    onChange={e => setExamForm({...examForm, title: e.target.value})}    placeholder="Physics Board Exam" className={inputCls} /></div>
              <div><label className={labelCls}>Subject *</label><input type="text" required value={examForm.subject}  onChange={e => setExamForm({...examForm, subject: e.target.value})}  placeholder="Physics"            className={inputCls} /></div>
              <div><label className={labelCls}>Date *</label><input type="date" required value={examForm.date}     onChange={e => setExamForm({...examForm, date: e.target.value})}     className={inputCls} /></div>
              <div><label className={labelCls}>Time *</label><input type="time" required value={examForm.time}     onChange={e => setExamForm({...examForm, time: e.target.value})}     className={inputCls} /></div>
              <div><label className={labelCls}>Duration (hours) *</label><input type="number" required step="0.5" value={examForm.duration}  onChange={e => setExamForm({...examForm, duration: e.target.value})}  placeholder="3" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Type *</label>
                <select value={examForm.type} onChange={e => setExamForm({...examForm, type: e.target.value as any})} className={inputCls}>
                  <option value="internal">Internal Test</option><option value="board">Board Exam</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option>
                </select>
              </div>
            </div>
            <div><label className={labelCls}>Syllabus *</label><textarea required rows={3} value={examForm.syllabus} onChange={e => setExamForm({...examForm, syllabus: e.target.value})} placeholder="Chapters 1–15, Topics…" className={inputCls} /></div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 py-2.5 sm:py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all shadow-lg text-sm sm:text-base">{editingItem ? 'Update' : 'Add'} Exam</button>
              <button type="button" onClick={() => resetForm('exam')} className={cancelBtn}>Cancel</button>
            </div>
          </form>
        </ModalWrap>
      )}

      {activeModal === 'note' && (
        <ModalWrap>
          <ModalHeader title={`${editingItem ? 'Edit' : 'Add'} Note`} onClose={() => resetForm('note')} />
          <form onSubmit={handleAddNote} className="p-4 sm:p-6 pt-4 space-y-3 sm:space-y-4">
            <div><label className={labelCls}>Title *</label><input type="text" required value={noteForm.title}   onChange={e => setNoteForm({...noteForm, title: e.target.value})}   placeholder="Prepare Lab Equipment" className={inputCls} /></div>
            <div><label className={labelCls}>Content *</label><textarea required rows={4} value={noteForm.content} onChange={e => setNoteForm({...noteForm, content: e.target.value})} placeholder="Add details…" className={inputCls} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div><label className={labelCls}>Date *</label><input type="date" required value={noteForm.date} onChange={e => setNoteForm({...noteForm, date: e.target.value})} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Priority *</label>
                <select value={noteForm.priority} onChange={e => setNoteForm({...noteForm, priority: e.target.value as any})} className={inputCls}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 py-2.5 sm:py-3 bg-yellow-600 text-white rounded-xl font-medium hover:bg-yellow-700 transition-all shadow-lg text-sm sm:text-base">{editingItem ? 'Update' : 'Add'} Note</button>
              <button type="button" onClick={() => resetForm('note')} className={cancelBtn}>Cancel</button>
            </div>
          </form>
        </ModalWrap>
      )}

      {activeModal === 'holiday' && (
        <ModalWrap>
          <ModalHeader title={`${editingItem ? 'Edit' : 'Add'} Custom Holiday`} onClose={() => resetForm('holiday')} />
          <form onSubmit={handleAddHoliday} className="p-4 sm:p-6 pt-4 space-y-3 sm:space-y-4">
            <div><label className={labelCls}>Name *</label><input type="text" required value={holidayForm.name}   onChange={e => setHolidayForm({...holidayForm, name: e.target.value})}   placeholder="School Annual Day"              className={inputCls} /></div>
            <div><label className={labelCls}>Date *</label><input type="date" required value={holidayForm.date}   onChange={e => setHolidayForm({...holidayForm, date: e.target.value})}   className={inputCls} /></div>
            <div><label className={labelCls}>Reason *</label><textarea required rows={3} value={holidayForm.reason} onChange={e => setHolidayForm({...holidayForm, reason: e.target.value})} placeholder="Annual function and prize distribution" className={inputCls} /></div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 py-2.5 sm:py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all shadow-lg text-sm sm:text-base">{editingItem ? 'Update' : 'Add'} Holiday</button>
              <button type="button" onClick={() => resetForm('holiday')} className={cancelBtn}>Cancel</button>
            </div>
          </form>
        </ModalWrap>
      )}

    </div>
  );
}