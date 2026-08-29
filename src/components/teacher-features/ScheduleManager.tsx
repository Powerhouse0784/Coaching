'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2, Calendar as CalendarIcon,
  Clock, BookOpen, CalendarDays, PartyPopper, Edit2,
} from 'lucide-react';

interface ScheduleSession {
  id: string;
  title: string;
  subject: string;
  class: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  color: string;
  notes: string | null;
}

interface CustomHoliday {
  id: string;
  title: string;
  date: string;
}

interface NationalHoliday {
  title: string;
  date: string;
  tentative?: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#14b8a6', '#eab308'];

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function isValidTime(t: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);
}

export default function ScheduleManager() {
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
  const [nationalHolidays, setNationalHolidays] = useState<NationalHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduleSession | null>(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  const fetchData = useCallback(async (year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/schedule?year=${year}`);
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
        setCustomHolidays(data.customHolidays);
        setNationalHolidays(data.nationalHolidays);
      }
    } catch (e) {
      console.error('Error fetching schedule:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(viewYear);
  }, [viewYear, fetchData]);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, { title: string; isCustom: boolean; tentative?: boolean }>();
    nationalHolidays.forEach((h) => map.set(h.date, { title: h.title, isCustom: false, tentative: h.tentative }));
    customHolidays.forEach((h) => map.set(h.date.slice(0, 10), { title: h.title, isCustom: true }));
    return map;
  }, [nationalHolidays, customHolidays]);

  const sessionsByDayOfWeek = useMemo(() => {
    const map = new Map<number, ScheduleSession[]>();
    sessions.forEach((s) => {
      if (!map.has(s.dayOfWeek)) map.set(s.dayOfWeek, []);
      map.get(s.dayOfWeek)!.push(s);
    });
    map.forEach((list) => list.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [sessions]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: { day: number | null; dateKey: string | null }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateKey: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, dateKey: toDateKey(viewYear, viewMonth, d) });
    return cells;
  }, [viewYear, viewMonth]);

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateKey(toDateKey(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const selectedDayOfWeek = selectedDateKey ? new Date(selectedDateKey + 'T00:00:00').getDay() : null;
  const selectedSessions = selectedDayOfWeek !== null ? (sessionsByDayOfWeek.get(selectedDayOfWeek) || []) : [];
  const selectedHoliday = selectedDateKey ? holidaysByDate.get(selectedDateKey) : null;

  const totalWeeklySessions = sessions.length;
  const holidaysThisMonth = calendarCells.filter((c) => c.dateKey && holidaysByDate.has(c.dateKey)).length;

  const handleSaveSession = async (payload: Omit<ScheduleSession, 'id'> & { id?: string }) => {
    try {
      const res = await fetch('/api/teacher/schedule', {
        method: payload.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.id ? payload : { ...payload, type: 'session' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData(viewYear);
        setShowSessionModal(false);
        setEditingSession(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    try {
      await fetch(`/api/teacher/schedule?type=session&id=${id}`, { method: 'DELETE' });
      fetchData(viewYear);
      setShowSessionModal(false);
      setEditingSession(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveHoliday = async (title: string, date: string) => {
    try {
      const res = await fetch('/api/teacher/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'holiday', title, date }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData(viewYear);
        setShowHolidayModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Delete this holiday?')) return;
    try {
      await fetch(`/api/teacher/schedule?type=holiday&id=${id}`, { method: 'DELETE' });
      fetchData(viewYear);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-teal-600 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Teaching Schedule</h1>
            <p className="text-sm text-muted-foreground">Manage your classes and holidays</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHolidayModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 border-2 border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition"
          >
            <PartyPopper className="w-4 h-4" /> Add Holiday
          </button>
          <button
            onClick={() => { setEditingSession(null); setShowSessionModal(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 rounded-xl text-sm font-semibold text-white hover:bg-teal-700 transition"
          >
            <Plus className="w-4 h-4" /> New Session
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-foreground">{totalWeeklySessions}</p>
          <p className="text-xs text-muted-foreground">Weekly Sessions</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center mb-2">
            <PartyPopper className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-xl font-bold text-foreground">{holidaysThisMonth}</p>
          <p className="text-xs text-muted-foreground">Holidays This Month</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center mb-2">
            <CalendarIcon className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xl font-bold text-foreground">{new Set(sessions.map((s) => s.subject)).size}</p>
          <p className="text-xs text-muted-foreground">Subjects Taught</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-secondary rounded-lg transition">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="text-center">
              <h2 className="font-bold text-foreground text-lg">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
              <button onClick={goToToday} className="text-xs text-teal-600 font-semibold hover:underline">
                Jump to Today
              </button>
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-secondary rounded-lg transition">
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-border">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center py-2 text-xs font-semibold text-muted-foreground">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarCells.map((cell, idx) => {
              if (!cell.day) return <div key={idx} className="aspect-square border-b border-r border-border" />;
              const isToday = cell.dateKey === toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
              const isSelected = cell.dateKey === selectedDateKey;
              const holiday = holidaysByDate.get(cell.dateKey!);
              const dow = new Date(cell.dateKey! + 'T00:00:00').getDay();
              const daySessions = sessionsByDayOfWeek.get(dow) || [];

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  className={`aspect-square border-b border-r border-border p-1.5 flex flex-col items-start text-left transition relative
                    ${isSelected ? 'bg-teal-50 ring-2 ring-inset ring-teal-500' : 'hover:bg-secondary'}
                    ${holiday ? 'bg-orange-50' : ''}
                  `}
                >
                  <span className={`text-xs font-semibold ${isToday ? 'bg-teal-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-foreground'}`}>
                    {cell.day}
                  </span>
                  {holiday && (
                    <span className="text-[9px] text-orange-700 font-medium mt-0.5 leading-tight line-clamp-2">
                      🎉 {holiday.title}
                    </span>
                  )}
                  <div className="flex flex-wrap gap-0.5 mt-auto">
                    {daySessions.slice(0, 3).map((s) => (
                      <span key={s.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="bg-card border border-border rounded-2xl p-4 h-fit">
          {selectedDateKey ? (
            <>
              <h3 className="font-bold text-foreground mb-1">
                {DAY_NAMES_FULL[selectedDayOfWeek!]}, {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </h3>
              {selectedHoliday && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl p-2.5 mb-3 mt-2">
                  <PartyPopper className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="text-sm font-medium text-orange-800 flex-1">{selectedHoliday.title}</span>
                  {selectedHoliday.tentative && (
                    <span className="text-[10px] bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded-full">Tentative</span>
                  )}
                  {selectedHoliday.isCustom && (
                    <button
                      onClick={() => {
                        const h = customHolidays.find((x) => x.date.slice(0, 10) === selectedDateKey);
                        if (h) handleDeleteHoliday(h.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-2 mt-3">
                {selectedSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No sessions scheduled for this day.</p>
                ) : (
                  selectedSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setEditingSession(s); setShowSessionModal(true); }}
                      className="w-full text-left rounded-xl p-3 border-2 hover:opacity-90 transition"
                      style={{ borderColor: s.color + '55', backgroundColor: s.color + '10' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-foreground">{s.title}</span>
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /> {s.startTime} - {s.endTime}
                      </div>
                      <div className="flex gap-1.5 mt-1.5">
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-border">{s.subject}</span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-border">{s.class}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={() => { setEditingSession(null); setShowSessionModal(true); }}
                className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-border rounded-xl text-sm font-semibold text-muted-foreground hover:border-teal-400 hover:text-teal-600 transition"
              >
                <Plus className="w-4 h-4" /> Add Session for This Day
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Tap a date on the calendar to see or add sessions.</p>
            </div>
          )}
        </div>
      </div>

      {showSessionModal && (
        <SessionModal
          session={editingSession}
          defaultDayOfWeek={selectedDayOfWeek ?? today.getDay()}
          onClose={() => { setShowSessionModal(false); setEditingSession(null); }}
          onSave={handleSaveSession}
          onDelete={editingSession ? () => handleDeleteSession(editingSession.id) : undefined}
        />
      )}
      {showHolidayModal && (
        <HolidayModal
          defaultDate={selectedDateKey || toDateKey(today.getFullYear(), today.getMonth(), today.getDate())}
          onClose={() => setShowHolidayModal(false)}
          onSave={handleSaveHoliday}
        />
      )}
    </div>
  );
}

function SessionModal({
  session, defaultDayOfWeek, onClose, onSave, onDelete,
}: {
  session: ScheduleSession | null;
  defaultDayOfWeek: number;
  onClose: () => void;
  onSave: (payload: any) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(session?.title ?? '');
  const [subject, setSubject] = useState(session?.subject ?? '');
  const [className, setClassName] = useState(session?.class ?? '');
  const [dayOfWeek, setDayOfWeek] = useState(session?.dayOfWeek ?? defaultDayOfWeek);
  const [startTime, setStartTime] = useState(session?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(session?.endTime ?? '10:00');
  const [color, setColor] = useState(session?.color ?? COLORS[0]);
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !subject.trim() || !className.trim()) return setError('Please fill in title, subject, and class');
    if (!isValidTime(startTime) || !isValidTime(endTime)) return setError('Enter times as HH:MM (24-hour)');
    if (startTime >= endTime) return setError('End time must be after start time');
    onSave({ id: session?.id, title, subject, class: className, dayOfWeek, startTime, endTime, color, notes });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background">
          <h3 className="font-bold text-foreground">{session ? 'Edit Session' : 'New Session'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5">{error}</p>}

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Physics Live Class"
              className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground bg-card" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Subject *</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Physics"
                className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground bg-card" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Class *</label>
              <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class 12"
                className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground bg-card" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">Day</label>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((d, idx) => (
                <button key={d} onClick={() => setDayOfWeek(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${dayOfWeek === idx ? 'bg-teal-600 text-white' : 'bg-secondary text-foreground'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Start Time *</label>
              <input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="09:00"
                className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground bg-card" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">End Time *</label>
              <input value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="10:00"
                className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground bg-card" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">Color Tag</label>
            <div className="flex gap-2.5">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional notes…"
              className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground bg-card resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border sticky bottom-0 bg-background">
          {onDelete && (
            <button onClick={onDelete} className="w-12 border-2 border-red-300 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="flex-1 border-2 border-border rounded-xl py-2.5 text-sm font-semibold text-foreground hover:bg-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 bg-teal-600 rounded-xl py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
            {session ? 'Save Changes' : 'Add Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

function HolidayModal({ defaultDate, onClose, onSave }: { defaultDate: string; onClose: () => void; onSave: (title: string, date: string) => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !date) return setError('Please enter a title and date');
    onSave(title, date);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-foreground">Add Custom Holiday</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5">{error}</p>}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Institute Anniversary"
              className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground bg-card" />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm text-foreground bg-card" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="flex-1 border-2 border-border rounded-xl py-2.5 text-sm font-semibold text-foreground hover:bg-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 bg-teal-600 rounded-xl py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
            Add Holiday
          </button>
        </div>
      </div>
    </div>
  );
}