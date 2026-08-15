import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { TCCEvent } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Tag, 
  X, 
  Filter, 
  Sparkles, 
  Grid, 
  List, 
  CalendarPlus,
  ArrowRight,
  Repeat,
  Ban,
  CalendarDays,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const DEFAULT_INITIAL_EVENTS: Omit<TCCEvent, 'id'>[] = [
  {
    title: 'Sunday Worship & Word',
    date: '2026-07-26',
    time: '09:00 AM - 11:00 AM',
    category: 'Sunday Service',
    description: 'Join us for an uplifting morning of dynamic worship, prophetic teaching, and community fellowship.',
    color: '#d32f2f',
    recurrence: 'weekly',
    cancelledDates: [],
    createdAt: new Date().toISOString()
  },
  {
    title: 'Wednesday Midweek Prayer Night',
    date: '2026-07-29',
    time: '07:00 PM - 08:30 PM',
    category: 'Prayer & Worship',
    description: 'Gathering together to seek God in fervent prayer for our church, families, and city.',
    color: '#2563eb',
    recurrence: 'weekly',
    cancelledDates: [],
    createdAt: new Date().toISOString()
  },
  {
    title: 'Identity Youth Friday Rally',
    date: '2026-07-31',
    time: '06:30 PM - 09:00 PM',
    category: 'Youth & Kids',
    description: 'High-energy youth worship, real conversations, games, and fellowship for teens.',
    color: '#dc2626',
    recurrence: 'weekly',
    cancelledDates: [],
    createdAt: new Date().toISOString()
  },
  {
    title: 'Saturday Morning Intercession',
    date: '2026-08-01',
    time: '07:00 AM - 08:00 AM',
    category: 'Prayer & Worship',
    description: 'Early morning prayer watch starting our month with strategic prayer.',
    color: '#2563eb',
    recurrence: 'monthly',
    cancelledDates: [],
    createdAt: new Date().toISOString()
  },
  {
    title: 'Community Outreach & Food Drive',
    date: '2026-08-08',
    time: '10:00 AM - 02:00 PM',
    category: 'Community Outreach',
    description: 'Serving our local community with free food packs, clothing drive, and prayers of hope.',
    color: '#059669',
    recurrence: 'none',
    cancelledDates: [],
    createdAt: new Date().toISOString()
  },
  {
    title: 'Night of Prophetic Worship & Healing',
    date: '2026-08-14',
    time: '07:00 PM - 09:30 PM',
    category: 'Special Event',
    description: 'An extended evening of unhurried worship, prayer ministry, and physical healing prayers.',
    color: '#7c3aed',
    recurrence: 'none',
    cancelledDates: [],
    createdAt: new Date().toISOString()
  },
  {
    title: 'Couples & Family Fellowship',
    date: '2026-08-22',
    time: '05:00 PM - 08:00 PM',
    category: 'Fellowship & Cafe',
    description: 'An encouraging evening for married couples and families with dinner, games, and table talks.',
    color: '#d97706',
    recurrence: 'monthly',
    cancelledDates: [],
    createdAt: new Date().toISOString()
  },
  {
    title: 'Little Lights Kids Summer Fun Day',
    date: '2026-08-29',
    time: '11:00 AM - 03:00 PM',
    category: 'Youth & Kids',
    description: 'Water slides, bouncy castles, games, and Bible adventure stories for all children!',
    color: '#059669',
    recurrence: 'none',
    cancelledDates: [],
    createdAt: new Date().toISOString()
  },
  {
    title: 'TCC Transformation Conference 2026',
    date: '2026-09-11',
    time: '06:00 PM - 09:00 PM',
    category: 'Special Event',
    description: 'Annual 3-day spiritual empowerment conference featuring guest speakers and worship teams.',
    color: '#7c3aed',
    recurrence: 'yearly',
    cancelledDates: [],
    createdAt: new Date().toISOString()
  }
];

const CATEGORIES = [
  'All',
  'Sunday Service',
  'Prayer & Worship',
  'Youth & Kids',
  'Community Outreach',
  'Fellowship & Cafe',
  'Special Event'
];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to expand single and recurring events for a specific date string (YYYY-MM-DD)
export function getEventsForDateStr(dateStr: string, allEvents: TCCEvent[]): TCCEvent[] {
  const targetDate = new Date(dateStr + 'T00:00:00');
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDayNum = targetDate.getDate();
  const targetDayOfWeek = targetDate.getDay();

  const results: TCCEvent[] = [];

  for (const ev of allEvents) {
    if (!ev.date) continue;
    const evDate = new Date(ev.date + 'T00:00:00');

    let matches = false;

    if (ev.date === dateStr) {
      matches = true;
    } else if (ev.recurrence === 'weekly' && targetDate >= evDate) {
      if (targetDayOfWeek === evDate.getDay()) {
        matches = true;
      }
    } else if (ev.recurrence === 'monthly' && targetDate >= evDate) {
      if (targetDayNum === evDate.getDate()) {
        matches = true;
      }
    } else if (ev.recurrence === 'yearly' && targetDate >= evDate) {
      if (targetMonth === evDate.getMonth() && targetDayNum === evDate.getDate()) {
        matches = true;
      }
    }

    // Check if recurrence has an end date limit
    if (matches && ev.recurrenceEndDate && dateStr > ev.recurrenceEndDate) {
      matches = false;
    }

    if (matches) {
      const isCancelledThisWeek = ev.cancelledDates?.includes(dateStr) || false;
      results.push({
        ...ev,
        date: dateStr, // set instance date
        isCancelled: isCancelledThisWeek
      });
    }
  }

  return results;
}

export const EventCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<TCCEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'month-agenda' | 'annual'>('week');
  
  // Selected Event or Selected Day for Modal View
  const [selectedEvent, setSelectedEvent] = useState<TCCEvent | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<{ dateStr: string; items: TCCEvent[] } | null>(null);

  // Fetch Events Realtime
  useEffect(() => {
    setLoading(true);
    const path = 'events';
    try {
      const q = query(collection(db, path), orderBy('date', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const list: TCCEvent[] = [];
          snapshot.forEach((docSnap) => {
            list.push({
              id: docSnap.id,
              ...(docSnap.data() as Omit<TCCEvent, 'id'>)
            });
          });

          // If database is empty, seed initial events automatically
          if (list.length === 0 && snapshot.empty) {
            console.log('Seeding initial default events into Firestore...');
            try {
              for (const item of DEFAULT_INITIAL_EVENTS) {
                await addDoc(collection(db, 'events'), item);
              }
            } catch (seedErr) {
              console.error('Failed to seed events:', seedErr);
            }
          } else {
            setEvents(list);
          }
          setLoading(false);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, path);
          // Fallback to default initial events if offline/error
          setEvents(DEFAULT_INITIAL_EVENTS as TCCEvent[]);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setEvents(DEFAULT_INITIAL_EVENTS as TCCEvent[]);
      setLoading(false);
    }
  }, []);

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers for week/month/annual
  const prevPeriod = () => {
    if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else if (viewMode === 'annual') {
      setCurrentDate(new Date(year - 1, month, 1));
    } else {
      // 'month' or 'month-agenda'
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else if (viewMode === 'annual') {
      setCurrentDate(new Date(year + 1, month, 1));
    } else {
      // 'month' or 'month-agenda'
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filter events by selected category
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'All') return events;
    return events.filter(e => e.category === selectedCategory);
  }, [events, selectedCategory]);

  // Helper to get start of week (Sunday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day; // Sunday is 0
    return new Date(date.setDate(diff));
  };

  // Generate 7 days for the current week
  const weekDays = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    const days: Array<{
      date: Date;
      dateStr: string;
      dayName: string;
      dayNum: number;
      monthName: string;
      isToday: boolean;
      events: TCCEvent[];
    }> = [];

    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const dStr = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;

      const dayEvs = getEventsForDateStr(dateStr, filteredEvents);

      days.push({
        date: d,
        dateStr,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()],
        dayNum: d.getDate(),
        monthName: MONTH_NAMES[d.getMonth()],
        isToday: dateStr === todayStr,
        events: dayEvs
      });
    }
    return days;
  }, [currentDate, filteredEvents]);

  // Total events this week
  const totalWeeklyEvents = useMemo(() => {
    return weekDays.reduce((acc, curr) => acc + curr.events.length, 0);
  }, [weekDays]);

  // Week header formatted string
  const weekRangeTitle = useMemo(() => {
    if (weekDays.length < 7) return '';
    const first = weekDays[0];
    const last = weekDays[6];

    if (first.monthName === last.monthName) {
      return `${first.monthName} ${first.dayNum} – ${last.dayNum}, ${last.date.getFullYear()}`;
    }
    return `${first.monthName.slice(0, 3)} ${first.dayNum} – ${last.monthName.slice(0, 3)} ${last.dayNum}, ${last.date.getFullYear()}`;
  }, [weekDays]);

  // Monthly Agenda Days
  const monthAgendaDays = useMemo(() => {
    const list: Array<{
      date: Date;
      dateStr: string;
      dayName: string;
      dayNum: number;
      monthName: string;
      isToday: boolean;
      events: TCCEvent[];
    }> = [];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      const dayDate = new Date(year, month, d);
      const dayEvs = getEventsForDateStr(dateStr, filteredEvents);

      if (dayEvs.length > 0) {
        list.push({
          date: dayDate,
          dateStr,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayDate.getDay()],
          dayNum: d,
          monthName: MONTH_NAMES[month],
          isToday: dateStr === todayStr,
          events: dayEvs
        });
      }
    }
    return list;
  }, [year, month, filteredEvents]);

  const totalMonthAgendaEvents = useMemo(() => {
    return monthAgendaDays.reduce((acc, curr) => acc + curr.events.length, 0);
  }, [monthAgendaDays]);

  // Generate Days Grid for Current Month (including recurring expansions)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dayNum: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isToday: boolean;
      events: TCCEvent[];
    }> = [];

    // Previous month padding days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const pDay = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, pDay);
      const yStr = prevDate.getFullYear();
      const mStr = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(pDay).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;

      const pEvents = getEventsForDateStr(dateStr, filteredEvents);

      days.push({
        dayNum: pDay,
        isCurrentMonth: false,
        dateStr,
        isToday: false,
        events: pEvents
      });
    }

    // Current month days
    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;

      const dayEvents = getEventsForDateStr(dateStr, filteredEvents);

      days.push({
        dayNum: d,
        isCurrentMonth: true,
        dateStr,
        isToday: dateStr === todayStr,
        events: dayEvents
      });
    }

    // Next month padding days to complete grid
    const remainingCells = (42 - days.length) % 7;
    for (let n = 1; n <= remainingCells; n++) {
      const nextDate = new Date(year, month + 1, n);
      const yStr = nextDate.getFullYear();
      const mStr = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(n).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;

      const nEvents = getEventsForDateStr(dateStr, filteredEvents);

      days.push({
        dayNum: n,
        isCurrentMonth: false,
        dateStr,
        isToday: false,
        events: nEvents
      });
    }

    return days;
  }, [year, month, filteredEvents]);

  // Annual Overview Data for 12 months
  const annualMonthsData = useMemo(() => {
    return MONTH_NAMES.map((mName, mIdx) => {
      const daysInM = new Date(year, mIdx + 1, 0).getDate();
      const firstDay = new Date(year, mIdx, 1).getDay();
      
      let totalEvents = 0;
      const monthDays: Array<{ dayNum: number; dateStr: string; events: TCCEvent[] }> = [];

      for (let d = 1; d <= daysInM; d++) {
        const mStr = String(mIdx + 1).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        const dateStr = `${year}-${mStr}-${dStr}`;
        const dayEvs = getEventsForDateStr(dateStr, filteredEvents);

        if (dayEvs.length > 0) totalEvents += dayEvs.length;

        monthDays.push({
          dayNum: d,
          dateStr,
          events: dayEvs
        });
      }

      return {
        monthName: mName,
        monthIdx: mIdx,
        firstDay,
        daysInM,
        totalEvents,
        monthDays
      };
    });
  }, [year, filteredEvents]);

  // Category Color Map
  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case 'Sunday Service':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'Prayer & Worship':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'Youth & Kids':
        return 'bg-rose-500/10 text-rose-600 border-rose-200';
      case 'Community Outreach':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'Fellowship & Cafe':
        return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case 'Special Event':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getEventDotColor = (category?: string, customColor?: string) => {
    if (customColor) return customColor;
    switch (category) {
      case 'Sunday Service': return '#d32f2f';
      case 'Prayer & Worship': return '#2563eb';
      case 'Youth & Kids': return '#dc2626';
      case 'Community Outreach': return '#059669';
      case 'Fellowship & Cafe': return '#d97706';
      case 'Special Event': return '#7c3aed';
      default: return '#4b5563';
    }
  };

  const handleDayClick = (dayItem: { dateStr: string; events: TCCEvent[] }) => {
    if (dayItem.events.length === 1) {
      setSelectedEvent(dayItem.events[0]);
    } else if (dayItem.events.length > 1) {
      setSelectedDateEvents({ dateStr: dayItem.dateStr, items: dayItem.events });
    }
  };

  // Export / Add to Google Calendar helper
  const getGoogleCalendarUrl = (event: TCCEvent) => {
    const title = encodeURIComponent(event.title + (event.isCancelled ? ' (CANCELLED)' : ''));
    const details = encodeURIComponent(event.description || '');
    
    // Format YYYYMMDD
    const cleanDate = event.date ? event.date.replace(/-/g, '') : '';
    const dates = `${cleanDate}/${cleanDate}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
  };

  return (
    <div id="calendar-section" className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-4 sm:p-8 space-y-8">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center space-x-2 text-[#d32f2f] font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4" />
            <span>TCC Events Calendar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span>
              {viewMode === 'week' 
                ? weekRangeTitle
                : viewMode === 'annual' 
                ? `Annual Calendar ${year}` 
                : `${MONTH_NAMES[month]} ${year}`}
            </span>
          </h2>
        </div>

        {/* Navigation & View Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Nav controls */}
          <div className="flex items-center bg-gray-100 rounded-2xl p-1 border border-gray-200">
            <button
              onClick={prevPeriod}
              className="p-2.5 rounded-xl hover:bg-white text-gray-700 hover:text-black transition-all shadow-sm"
              title={viewMode === 'week' ? "Previous Week" : viewMode === 'annual' ? "Previous Year" : "Previous Month"}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={goToToday}
              className="px-4 py-2 font-black text-xs uppercase tracking-wider text-gray-700 hover:text-[#d32f2f] hover:bg-white rounded-xl transition-all"
            >
              {viewMode === 'week' ? 'This Week' : 'Today'}
            </button>

            <button
              onClick={nextPeriod}
              className="p-2.5 rounded-xl hover:bg-white text-gray-700 hover:text-black transition-all shadow-sm"
              title={viewMode === 'week' ? "Next Week" : viewMode === 'annual' ? "Next Year" : "Next Month"}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week / Month / Monthly Agenda / Annual Toggle */}
          <div className="flex items-center bg-gray-100 rounded-2xl p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'week' 
                  ? 'bg-[#d32f2f] text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Weekly</span>
            </button>

            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'month' 
                  ? 'bg-[#d32f2f] text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Monthly</span>
            </button>

            <button
              onClick={() => setViewMode('month-agenda')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'month-agenda' 
                  ? 'bg-[#d32f2f] text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="whitespace-nowrap">Monthly Agenda</span>
            </button>

            <button
              onClick={() => setViewMode('annual')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'annual' 
                  ? 'bg-[#d32f2f] text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Annual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1 flex-shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* WEEKLY AGENDA VIEW (DEFAULT) */}
      {viewMode === 'week' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
            <span>Weekly Schedule: {weekRangeTitle}</span>
            <span className="bg-red-50 text-[#d32f2f] px-3 py-1 rounded-full font-black">
              {totalWeeklyEvents} {totalWeeklyEvents === 1 ? 'Event' : 'Events'} This Week
            </span>
          </div>

          <div className="space-y-4">
            {weekDays.map((dayItem) => {
              const hasEvents = dayItem.events.length > 0;

              return (
                <div 
                  key={dayItem.dateStr}
                  className={`rounded-3xl border transition-all overflow-hidden ${
                    dayItem.isToday 
                      ? 'bg-white border-red-200 ring-2 ring-[#d32f2f]/20 shadow-lg' 
                      : 'bg-gray-50/70 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-start gap-4 sm:gap-6">
                    {/* Day Column */}
                    <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2 md:w-44 flex-shrink-0">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-black uppercase tracking-wider ${
                            dayItem.isToday ? 'text-[#d32f2f]' : 'text-gray-500'
                          }`}>
                            {dayItem.dayName}
                          </span>
                          {dayItem.isToday && (
                            <span className="text-[10px] bg-[#d32f2f] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-0.5">
                          {dayItem.monthName.slice(0, 3)} {dayItem.dayNum}
                        </div>
                      </div>

                      <div className="text-xs font-bold text-gray-400">
                        {hasEvents ? `${dayItem.events.length} scheduled` : 'No events'}
                      </div>
                    </div>

                    {/* Events List for this day */}
                    <div className="flex-grow space-y-3">
                      {!hasEvents ? (
                        <div className="py-3 px-4 rounded-2xl bg-white/60 border border-gray-100 text-xs font-medium text-gray-400 italic">
                          No scheduled services or activities for this day.
                        </div>
                      ) : (
                        dayItem.events.map((ev, evIdx) => (
                          <div
                            key={`${ev.id || ev.title}-${dayItem.dateStr}-${evIdx}`}
                            onClick={() => setSelectedEvent(ev)}
                            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              ev.isCancelled
                                ? 'bg-red-50/50 border-red-200 hover:bg-red-50'
                                : 'bg-white border-gray-200 hover:border-[#d32f2f]/40 hover:shadow-md'
                            }`}
                          >
                            <div className="space-y-2 flex-grow">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(ev.category)}`}>
                                  {ev.category || 'Event'}
                                </span>

                                {ev.recurrence && ev.recurrence !== 'none' && (
                                  <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-gray-200">
                                    <Repeat className="w-3 h-3 text-gray-500" />
                                    <span>Repeats {ev.recurrence}</span>
                                  </span>
                                )}

                                {ev.isCancelled && (
                                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                    <Ban className="w-3 h-3" />
                                    <span>Cancelled This Week</span>
                                  </span>
                                )}
                              </div>

                              <h4 className={`text-lg font-black transition-colors ${
                                ev.isCancelled ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-[#d32f2f]'
                              }`}>
                                {ev.title}
                              </h4>

                              {ev.description && (
                                <p className="text-xs sm:text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed max-w-2xl">
                                  {ev.description}
                                </p>
                              )}
                            </div>

                            {/* Time & Action */}
                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              {ev.time && (
                                <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                                  <Clock className="w-3.5 h-3.5 text-[#d32f2f]" />
                                  <span>{ev.time}</span>
                                </div>
                              )}

                              <div className="flex items-center space-x-1 text-xs font-black text-[#d32f2f] group-hover:translate-x-1 transition-transform">
                                <span>Details</span>
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CALENDAR MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div className="space-y-2">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center border-b border-gray-100 pb-3">
            {DAY_NAMES.map((d) => (
              <div key={d} className="font-black text-xs uppercase tracking-widest text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((dayItem, idx) => {
              const hasEvents = dayItem.events.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => hasEvents && handleDayClick(dayItem)}
                  className={`min-h-[90px] sm:min-h-[115px] p-1.5 sm:p-2.5 rounded-2xl border transition-all flex flex-col justify-between group ${
                    !dayItem.isCurrentMonth 
                      ? 'bg-gray-50/50 border-gray-100 text-gray-300' 
                      : dayItem.isToday 
                      ? 'bg-red-50/50 border-red-200 text-gray-900 ring-2 ring-[#d32f2f]/30' 
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-lg text-gray-800'
                  } ${hasEvents ? 'cursor-pointer hover:bg-red-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-black rounded-lg w-6 h-6 flex items-center justify-center ${
                      dayItem.isToday 
                        ? 'bg-[#d32f2f] text-white shadow-md' 
                        : dayItem.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                    }`}>
                      {dayItem.dayNum}
                    </span>

                    {hasEvents && (
                      <span className="text-[10px] font-black bg-red-100 text-[#d32f2f] px-1.5 py-0.5 rounded-full">
                        {dayItem.events.length}
                      </span>
                    )}
                  </div>

                  {/* Render Event Dots or Titles */}
                  <div className="mt-1 space-y-1 overflow-hidden flex-grow">
                    {dayItem.events.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id ? `${ev.id}-${ev.date}` : ev.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className={`text-[10px] sm:text-xs font-bold truncate px-1.5 py-1 rounded-md text-white shadow-sm flex items-center justify-between space-x-1 hover:opacity-90 transition-opacity ${
                          ev.isCancelled ? 'line-through opacity-60 bg-gray-500' : ''
                        }`}
                        style={{ backgroundColor: ev.isCancelled ? '#6b7280' : getEventDotColor(ev.category, ev.color) }}
                      >
                        <div className="flex items-center space-x-1 truncate">
                          {ev.recurrence && ev.recurrence !== 'none' && (
                            <Repeat className="w-2.5 h-2.5 flex-shrink-0 text-white/80" />
                          )}
                          <span className="truncate">{ev.title}</span>
                        </div>

                        {ev.isCancelled && (
                          <span className="text-[8px] bg-red-800 text-white font-black px-1 rounded uppercase flex-shrink-0">
                            Cancelled
                          </span>
                        )}
                      </div>
                    ))}

                    {dayItem.events.length > 2 && (
                      <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 text-center">
                        +{dayItem.events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MONTHLY AGENDA VIEW */}
      {viewMode === 'month-agenda' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
            <span>Monthly Agenda: {MONTH_NAMES[month]} {year}</span>
            <span className="bg-red-50 text-[#d32f2f] px-3 py-1 rounded-full font-black">
              {totalMonthAgendaEvents} {totalMonthAgendaEvents === 1 ? 'Event' : 'Events'} in {MONTH_NAMES[month]}
            </span>
          </div>

          {monthAgendaDays.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="text-lg font-bold text-gray-700">No events scheduled for {MONTH_NAMES[month]} {year}</h4>
              <p className="text-xs text-gray-400">Try navigating to another month or changing category filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {monthAgendaDays.map((dayItem) => (
                <div 
                  key={dayItem.dateStr}
                  className={`rounded-3xl border transition-all overflow-hidden ${
                    dayItem.isToday 
                      ? 'bg-white border-red-200 ring-2 ring-[#d32f2f]/20 shadow-lg' 
                      : 'bg-gray-50/70 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-start gap-4 sm:gap-6">
                    {/* Day Column */}
                    <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2 md:w-44 flex-shrink-0">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-black uppercase tracking-wider ${
                            dayItem.isToday ? 'text-[#d32f2f]' : 'text-gray-500'
                          }`}>
                            {dayItem.dayName}
                          </span>
                          {dayItem.isToday && (
                            <span className="text-[10px] bg-[#d32f2f] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-0.5">
                          {dayItem.monthName.slice(0, 3)} {dayItem.dayNum}
                        </div>
                      </div>

                      <div className="text-xs font-bold text-gray-400">
                        {dayItem.events.length} {dayItem.events.length === 1 ? 'event' : 'events'}
                      </div>
                    </div>

                    {/* Events List for this day */}
                    <div className="flex-grow space-y-3">
                      {dayItem.events.map((ev, evIdx) => (
                        <div
                          key={`${ev.id || ev.title}-${dayItem.dateStr}-${evIdx}`}
                          onClick={() => setSelectedEvent(ev)}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            ev.isCancelled
                              ? 'bg-red-50/50 border-red-200 hover:bg-red-50'
                              : 'bg-white border-gray-200 hover:border-[#d32f2f]/40 hover:shadow-md'
                          }`}
                        >
                          <div className="space-y-2 flex-grow">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(ev.category)}`}>
                                {ev.category || 'Event'}
                              </span>

                              {ev.recurrence && ev.recurrence !== 'none' && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-gray-200">
                                  <Repeat className="w-3 h-3 text-gray-500" />
                                  <span>Repeats {ev.recurrence}</span>
                                </span>
                              )}

                              {ev.isCancelled && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                  <Ban className="w-3 h-3" />
                                  <span>Cancelled This Week</span>
                                </span>
                              )}
                            </div>

                            <h4 className={`text-lg font-black transition-colors ${
                              ev.isCancelled ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-[#d32f2f]'
                            }`}>
                              {ev.title}
                            </h4>

                            {ev.description && (
                              <p className="text-xs sm:text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed max-w-2xl">
                                {ev.description}
                              </p>
                            )}
                          </div>

                          {/* Time & Action */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                            {ev.time && (
                              <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                                <Clock className="w-3.5 h-3.5 text-[#d32f2f]" />
                                <span>{ev.time}</span>
                              </div>
                            )}

                            <div className="flex items-center space-x-1 text-xs font-black text-[#d32f2f] group-hover:translate-x-1 transition-transform">
                              <span>Details</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANNUAL 12-MONTH CALENDAR OVERVIEW */}
      {viewMode === 'annual' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              {year} Full Year Calendar Overview
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Browse all 12 months. Click any month or date to view scheduled recurring and special events.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {annualMonthsData.map((mObj) => (
              <div
                key={mObj.monthName}
                className="bg-gray-50/80 border border-gray-200 rounded-3xl p-4 space-y-3 hover:bg-white hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <button
                    onClick={() => {
                      setCurrentDate(new Date(year, mObj.monthIdx, 1));
                      setViewMode('month');
                    }}
                    className="font-black text-base text-gray-900 hover:text-[#d32f2f] transition-colors"
                  >
                    {mObj.monthName}
                  </button>

                  <span className="text-[10px] font-black uppercase bg-red-100 text-[#d32f2f] px-2 py-0.5 rounded-full">
                    {mObj.totalEvents} {mObj.totalEvents === 1 ? 'event' : 'events'}
                  </span>
                </div>

                {/* Mini Month Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, dIdx) => (
                    <span key={dIdx} className="text-[9px] font-black text-gray-400">
                      {d}
                    </span>
                  ))}

                  {/* Empty cells before month start */}
                  {Array.from({ length: mObj.firstDay }).map((_, i) => (
                    <span key={`empty-${i}`} className="h-6" />
                  ))}

                  {mObj.monthDays.map((dObj) => {
                    const hasEvs = dObj.events.length > 0;
                    const hasCancelled = dObj.events.some(e => e.isCancelled);

                    return (
                      <button
                        key={dObj.dateStr}
                        onClick={() => {
                          if (hasEvs) handleDayClick(dObj);
                        }}
                        disabled={!hasEvs}
                        className={`h-6 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
                          hasEvs 
                            ? hasCancelled
                              ? 'bg-gray-300 text-gray-700 font-black hover:scale-110'
                              : 'bg-[#d32f2f] text-white font-black hover:scale-110 shadow-sm'
                            : 'text-gray-600'
                        }`}
                        title={hasEvs ? `${dObj.events.length} event(s) on ${dObj.dateStr}` : undefined}
                      >
                        {dObj.dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SINGLE EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 space-y-6 p-6 sm:p-8 relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${getCategoryBadgeClass(selectedEvent.category)}`}>
                  {selectedEvent.category || 'TCC Event'}
                </span>

                {selectedEvent.recurrence && selectedEvent.recurrence !== 'none' && (
                  <span className="text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-800 px-3 py-1 rounded-full flex items-center gap-1 border border-amber-200">
                    <Repeat className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Repeats {selectedEvent.recurrence}
                      {selectedEvent.recurrenceEndDate
                        ? ` until ${new Date(selectedEvent.recurrenceEndDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                        : ' (Indefinite)'}
                    </span>
                  </span>
                )}
              </div>

              {selectedEvent.isCancelled && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>Notice: This event is CANCELLED for this week.</span>
                </div>
              )}

              <h3 className={`text-2xl sm:text-3xl font-black leading-tight ${selectedEvent.isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {selectedEvent.title}
              </h3>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3 text-sm">
              <div className="flex items-center space-x-3 text-gray-700 font-bold">
                <CalendarIcon className="w-5 h-5 text-[#d32f2f]" />
                <span>
                  {selectedEvent.date 
                    ? new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Date TBD'}
                </span>
              </div>

              {selectedEvent.time && (
                <div className="flex items-center space-x-3 text-gray-600 font-medium">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>{selectedEvent.time}</span>
                </div>
              )}
            </div>

            {selectedEvent.description && (
              <div className="space-y-1">
                <h5 className="text-xs font-black uppercase text-gray-400 tracking-wider">Event Details</h5>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={getGoogleCalendarUrl(selectedEvent)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-[#d32f2f] hover:bg-red-700 text-white font-black py-3.5 px-4 rounded-2xl text-xs uppercase tracking-widest text-center transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Add to Google Calendar</span>
              </a>

              <button
                onClick={() => setSelectedEvent(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTIPLE EVENTS DAY LIST MODAL */}
      {selectedDateEvents && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => setSelectedDateEvents(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-black uppercase tracking-widest text-[#d32f2f]">
                Events on {new Date(selectedDateEvents.dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <h3 className="text-2xl font-black text-gray-900 mt-1">Scheduled Events</h3>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-modal-scroll">
              {selectedDateEvents.items.map((ev, idx) => (
                <div
                  key={`${ev.id || ev.title}-${idx}`}
                  onClick={() => {
                    setSelectedDateEvents(null);
                    setSelectedEvent(ev);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    ev.isCancelled 
                      ? 'bg-red-50/50 border-red-200 hover:bg-red-50' 
                      : 'bg-gray-50 hover:bg-red-50 border-gray-100 hover:border-red-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(ev.category)}`}>
                        {ev.category || 'Event'}
                      </span>
                      {ev.isCancelled && (
                        <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded uppercase">
                          Cancelled
                        </span>
                      )}
                    </div>
                    <h4 className={`font-black text-base ${ev.isCancelled ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-[#d32f2f]'}`}>
                      {ev.title}
                    </h4>
                    {ev.time && <p className="text-xs text-gray-500 font-medium">{ev.time}</p>}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#d32f2f] transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
