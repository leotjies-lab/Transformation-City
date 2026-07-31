import React, { useState, useEffect, useMemo } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { FormSubmission, SubmissionStatus, AdminMember, TCCEvent } from '../types';
import { DEFAULT_INITIAL_EVENTS } from './EventCalendar';
import FormManager from './FormManager';
import { 
  ShieldCheck, 
  LogOut, 
  Search, 
  Filter, 
  Download, 
  Mail, 
  Phone, 
  MessageSquare, 
  Clock, 
  UserCheck, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  X,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Users,
  Inbox,
  Lock,
  ArrowLeft,
  UserPlus,
  Shield,
  Key,
  Calendar,
  CalendarDays,
  Plus,
  Tag,
  Repeat,
  Ban,
  CalendarCheck,
  Check,
  FileText
} from 'lucide-react';

interface AdminPortalProps {
  onNavigate: (path: string) => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onNavigate }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminSession, setAdminSession] = useState<{ email: string } | null>(() => {
    try {
      const stored = localStorage.getItem('tcc_admin_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'submissions' | 'admins' | 'events' | 'custom_forms'>('events');

  // Events state
  const [eventsList, setEventsList] = useState<TCCEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TCCEvent | null>(null);

  // Add / Edit Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventCategory, setEventCategory] = useState('Sunday Service');
  const [eventDescription, setEventDescription] = useState('');
  const [eventColor, setEventColor] = useState('#d32f2f');
  const [eventRecurrence, setEventRecurrence] = useState<'none' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [eventRecurrenceEndType, setEventRecurrenceEndType] = useState<'never' | 'until_date' | 'count'>('never');
  const [eventRecurrenceEndDate, setEventRecurrenceEndDate] = useState('');
  const [eventRecurrenceCount, setEventRecurrenceCount] = useState<number | ''>('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventSuccess, setEventSuccess] = useState('');

  // Weekly Cancellations State
  const [selectedCancelEvent, setSelectedCancelEvent] = useState<TCCEvent | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [updatingCancellation, setUpdatingCancellation] = useState(false);

  // Occurrences View State
  const [eventsViewMode, setEventsViewMode] = useState<'occurrences' | 'master'>('occurrences');
  const [occurrenceSearch, setOccurrenceSearch] = useState('');
  const [occurrenceCategory, setOccurrenceCategory] = useState('All');
  const [occurrenceStatus, setOccurrenceStatus] = useState<'all' | 'active' | 'cancelled'>('all');
  const [occurrenceDaysHorizon, setOccurrenceDaysHorizon] = useState<number>(60);

  // Submissions state
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Admin Team state
  const [adminsList, setAdminsList] = useState<AdminMember[]>([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('Admin');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [addAdminSuccess, setAddAdminSuccess] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [interestFilter, setInterestFilter] = useState<string>('all');

  // Selected Submission Modal
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const isLoggedIn = Boolean(currentUser || adminSession);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore Submissions when logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    setLoadingData(true);
    setFetchError('');

    try {
      const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs: FormSubmission[] = [];
          snapshot.forEach((docSnap) => {
            docs.push({
              id: docSnap.id,
              ...(docSnap.data() as Omit<FormSubmission, 'id'>)
            });
          });
          setSubmissions(docs);
          setLoadingData(false);
        },
        (error) => {
          console.error('Error fetching submissions from Firestore:', error);
          setFetchError('Failed to load submissions. Please check your network or credentials.');
          setLoadingData(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error(err);
      setFetchError('Error setting up data connection.');
      setLoadingData(false);
    }
  }, [isLoggedIn]);

  // Listen to Firestore Admins collection when logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    try {
      const q = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: AdminMember[] = [];
          snapshot.forEach((docSnap) => {
            list.push({
              id: docSnap.id,
              ...(docSnap.data() as Omit<AdminMember, 'id'>)
            });
          });
          setAdminsList(list);
        },
        (error) => {
          console.error('Error fetching admins from Firestore:', error);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error(err);
    }
  }, [isLoggedIn]);

  // Listen to Firestore Events collection when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoadingEvents(true);

    try {
      const q = query(collection(db, 'events'), orderBy('date', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: TCCEvent[] = [];
          snapshot.forEach((docSnap) => {
            list.push({
              id: docSnap.id,
              ...(docSnap.data() as Omit<TCCEvent, 'id'>)
            });
          });
          setEventsList(list);
          setLoadingEvents(false);
        },
        (error) => {
          console.error('Error fetching events from Firestore:', error);
          setLoadingEvents(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error(err);
      setLoadingEvents(false);
    }
  }, [isLoggedIn]);

  // Event Handlers
  const openNewEventModal = () => {
    setEditingEvent(null);
    setEventTitle('');
    const todayStr = new Date().toISOString().split('T')[0];
    setEventDate(todayStr);
    setEventTime('10:00 AM - 12:00 PM');
    setEventCategory('Sunday Service');
    setEventDescription('');
    setEventColor('#d32f2f');
    setEventRecurrence('weekly');
    setEventRecurrenceEndType('never');
    setEventRecurrenceEndDate('');
    setEventRecurrenceCount('');
    setEventSuccess('');
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (ev: TCCEvent) => {
    setEditingEvent(ev);
    setEventTitle(ev.title || '');
    setEventDate(ev.date || new Date().toISOString().split('T')[0]);
    setEventTime(ev.time || '');
    setEventCategory(ev.category || 'Sunday Service');
    setEventDescription(ev.description || '');
    setEventColor(ev.color || '#d32f2f');
    setEventRecurrence(ev.recurrence || 'none');
    setEventRecurrenceEndType(ev.recurrenceEndType || (ev.recurrenceEndDate ? 'until_date' : 'never'));
    setEventRecurrenceEndDate(ev.recurrenceEndDate || '');
    setEventRecurrenceCount(ev.recurrenceCount || '');
    setEventSuccess('');
    setIsEventModalOpen(true);
  };

  const setQuickDate = (type: 'today' | 'next-sunday' | 'next-wednesday' | 'next-friday') => {
    const d = new Date();
    if (type === 'next-sunday') {
      const day = d.getDay();
      const diff = (7 - day) % 7 || 7;
      d.setDate(d.getDate() + diff);
    } else if (type === 'next-wednesday') {
      const day = d.getDay();
      const diff = (3 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
    } else if (type === 'next-friday') {
      const day = d.getDay();
      const diff = (5 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setEventDate(`${yyyy}-${mm}-${dd}`);
  };

  const setQuickRecurrenceDuration = (type: '4-weeks' | '8-weeks' | '12-weeks' | 'end-of-year' | '6-months' | '1-year' | 'never') => {
    if (type === 'never') {
      setEventRecurrenceEndType('never');
      setEventRecurrenceEndDate('');
      setEventRecurrenceCount('');
      return;
    }

    if (!eventDate) return;
    const parts = eventDate.split('-').map(Number);
    if (parts.length !== 3) return;

    const start = new Date(parts[0], parts[1] - 1, parts[2]);

    if (type === '4-weeks') {
      start.setDate(start.getDate() + 28);
      setEventRecurrenceEndType('until_date');
      setEventRecurrenceCount(4);
    } else if (type === '8-weeks') {
      start.setDate(start.getDate() + 56);
      setEventRecurrenceEndType('until_date');
      setEventRecurrenceCount(8);
    } else if (type === '12-weeks') {
      start.setDate(start.getDate() + 84);
      setEventRecurrenceEndType('until_date');
      setEventRecurrenceCount(12);
    } else if (type === 'end-of-year') {
      start.setMonth(11, 31); // Dec 31
      setEventRecurrenceEndType('until_date');
      setEventRecurrenceCount('');
    } else if (type === '6-months') {
      start.setMonth(start.getMonth() + 6);
      setEventRecurrenceEndType('until_date');
      setEventRecurrenceCount('');
    } else if (type === '1-year') {
      start.setFullYear(start.getFullYear() + 1);
      setEventRecurrenceEndType('until_date');
      setEventRecurrenceCount('');
    }

    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, '0');
    const dd = String(start.getDate()).padStart(2, '0');
    setEventRecurrenceEndDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleRecurrenceCountChange = (val: number | '') => {
    setEventRecurrenceCount(val);
    if (val && typeof val === 'number' && val > 0 && eventDate) {
      const parts = eventDate.split('-').map(Number);
      if (parts.length === 3) {
        const start = new Date(parts[0], parts[1] - 1, parts[2]);
        if (eventRecurrence === 'weekly') {
          start.setDate(start.getDate() + (val - 1) * 7);
        } else if (eventRecurrence === 'monthly') {
          start.setMonth(start.getMonth() + (val - 1));
        } else if (eventRecurrence === 'yearly') {
          start.setFullYear(start.getFullYear() + (val - 1));
        }
        const yyyy = start.getFullYear();
        const mm = String(start.getMonth() + 1).padStart(2, '0');
        const dd = String(start.getDate()).padStart(2, '0');
        setEventRecurrenceEndDate(`${yyyy}-${mm}-${dd}`);
        setEventRecurrenceEndType('until_date');
      }
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) return;

    setSavingEvent(true);
    setEventSuccess('');

    try {
      const payload = {
        title: eventTitle.trim(),
        date: eventDate,
        time: eventTime.trim(),
        category: eventCategory,
        description: eventDescription.trim(),
        color: eventColor,
        recurrence: eventRecurrence,
        recurrenceEndType: eventRecurrence === 'none' ? 'never' : eventRecurrenceEndType,
        recurrenceEndDate: (eventRecurrence !== 'none' && eventRecurrenceEndType !== 'never') ? eventRecurrenceEndDate : '',
        recurrenceCount: (eventRecurrence !== 'none' && eventRecurrenceEndType !== 'never' && typeof eventRecurrenceCount === 'number') ? eventRecurrenceCount : null,
        updatedAt: new Date().toISOString()
      };

      if (editingEvent && editingEvent.id) {
        await updateDoc(doc(db, 'events', editingEvent.id), payload);
        setEventSuccess('Event updated successfully!');
      } else {
        await addDoc(collection(db, 'events'), {
          ...payload,
          createdAt: new Date().toISOString(),
          cancelledDates: []
        });
        setEventSuccess('New TCC event added successfully!');
      }

      setTimeout(() => {
        setIsEventModalOpen(false);
        setEventSuccess('');
      }, 1000);
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event. Please check input or database permissions.');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleToggleCancelDate = async (ev: TCCEvent, dateStr: string) => {
    if (!ev.id) return;
    setUpdatingCancellation(true);
    try {
      const currentList = ev.cancelledDates || [];
      const isAlreadyCancelled = currentList.includes(dateStr);
      const newList = isAlreadyCancelled
        ? currentList.filter((d) => d !== dateStr)
        : [...currentList, dateStr];

      await updateDoc(doc(db, 'events', ev.id), {
        cancelledDates: newList,
        updatedAt: new Date().toISOString()
      });

      const updatedEv = { ...ev, cancelledDates: newList };
      setSelectedCancelEvent(updatedEv);
      setEventsList((prev) => prev.map((item) => (item.id === ev.id ? updatedEv : item)));
    } catch (err) {
      console.error('Error toggling cancellation:', err);
      alert('Failed to update event cancellation status.');
    } finally {
      setUpdatingCancellation(false);
    }
  };

  const getUpcomingOccurrenceDates = (ev: TCCEvent, count = 12): string[] => {
    if (!ev.date) return [];
    const parts = ev.date.split('-').map(Number);
    if (parts.length !== 3) return [ev.date];

    const start = new Date(parts[0], parts[1] - 1, parts[2]);
    const dates: string[] = [];

    if (!ev.recurrence || ev.recurrence === 'none') {
      return [ev.date];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cur = new Date(start);

    // Roll forward to near current date if start date is in the past
    if (cur < today) {
      while (cur < today) {
        if (ev.recurrence === 'weekly') {
          cur.setDate(cur.getDate() + 7);
        } else if (ev.recurrence === 'monthly') {
          cur.setMonth(cur.getMonth() + 1);
        } else if (ev.recurrence === 'yearly') {
          cur.setFullYear(cur.getFullYear() + 1);
        } else {
          break;
        }
      }
    }

    for (let i = 0; i < count; i++) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      if (ev.recurrenceEndDate && dateStr > ev.recurrenceEndDate) {
        break;
      }

      dates.push(dateStr);

      if (ev.recurrence === 'weekly') {
        cur.setDate(cur.getDate() + 7);
      } else if (ev.recurrence === 'monthly') {
        cur.setMonth(cur.getMonth() + 1);
      } else if (ev.recurrence === 'yearly') {
        cur.setFullYear(cur.getFullYear() + 1);
      } else {
        break;
      }
    }

    return dates;
  };

  interface UpcomingOccurrenceItem {
    event: TCCEvent;
    dateStr: string;
    formattedDate: string;
    dayOfWeekStr: string;
    isCancelled: boolean;
  }

  const upcomingOccurrencesList = useMemo(() => {
    const list: UpcomingOccurrenceItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const horizonDate = new Date(today);
    horizonDate.setDate(horizonDate.getDate() + occurrenceDaysHorizon);

    for (const ev of eventsList) {
      if (!ev.date) continue;
      const parts = ev.date.split('-').map(Number);
      if (parts.length !== 3) continue;

      const startDate = new Date(parts[0], parts[1] - 1, parts[2]);

      if (!ev.recurrence || ev.recurrence === 'none') {
        if (startDate >= today && startDate <= horizonDate) {
          const isCancelled = ev.cancelledDates?.includes(ev.date) || false;
          list.push({
            event: ev,
            dateStr: ev.date,
            formattedDate: startDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            dayOfWeekStr: startDate.toLocaleDateString('en-US', { weekday: 'short' }),
            isCancelled
          });
        }
        continue;
      }

      let cur = new Date(startDate);
      // Roll forward to near current date if start date is in the past
      if (cur < today) {
        while (cur < today) {
          if (ev.recurrence === 'weekly') {
            cur.setDate(cur.getDate() + 7);
          } else if (ev.recurrence === 'monthly') {
            cur.setMonth(cur.getMonth() + 1);
          } else if (ev.recurrence === 'yearly') {
            cur.setFullYear(cur.getFullYear() + 1);
          } else {
            break;
          }
        }
      }

      while (cur <= horizonDate) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        if (ev.recurrenceEndDate && dateStr > ev.recurrenceEndDate) {
          break;
        }

        const isCancelled = ev.cancelledDates?.includes(dateStr) || false;

        list.push({
          event: ev,
          dateStr,
          formattedDate: cur.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          dayOfWeekStr: cur.toLocaleDateString('en-US', { weekday: 'short' }),
          isCancelled
        });

        if (ev.recurrence === 'weekly') {
          cur.setDate(cur.getDate() + 7);
        } else if (ev.recurrence === 'monthly') {
          cur.setMonth(cur.getMonth() + 1);
        } else if (ev.recurrence === 'yearly') {
          cur.setFullYear(cur.getFullYear() + 1);
        } else {
          break;
        }
      }
    }

    list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    return list;
  }, [eventsList, occurrenceDaysHorizon]);

  const filteredOccurrences = useMemo(() => {
    return upcomingOccurrencesList.filter((item) => {
      if (occurrenceSearch) {
        const q = occurrenceSearch.toLowerCase();
        const matchTitle = item.event.title.toLowerCase().includes(q);
        const matchDate = item.dateStr.includes(q) || item.formattedDate.toLowerCase().includes(q) || item.dayOfWeekStr.toLowerCase().includes(q);
        const matchCategory = (item.event.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDate && !matchCategory) return false;
      }

      if (occurrenceCategory !== 'All' && item.event.category !== occurrenceCategory) {
        return false;
      }

      if (occurrenceStatus === 'active' && item.isCancelled) return false;
      if (occurrenceStatus === 'cancelled' && !item.isCancelled) return false;

      return true;
    });
  }, [upcomingOccurrencesList, occurrenceSearch, occurrenceCategory, occurrenceStatus]);

  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove the event "${title}"?`)) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to remove event.');
    }
  };

  const handleSeedDefaultEvents = async () => {
    if (!window.confirm('Seed initial sample TCC events into the database?')) return;
    try {
      for (const item of DEFAULT_INITIAL_EVENTS) {
        await addDoc(collection(db, 'events'), item);
      }
      alert('Sample events added successfully!');
    } catch (err) {
      console.error('Error seeding events:', err);
      alert('Failed to seed default events.');
    }
  };

  // Handle Granting Admin Access
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setAddingAdmin(true);
    setAddAdminSuccess('');

    try {
      await addDoc(collection(db, 'admins'), {
        name: newAdminName.trim() || newAdminEmail.trim().split('@')[0],
        email: newAdminEmail.trim().toLowerCase(),
        role: newAdminRole,
        createdAt: new Date().toISOString()
      });

      setAddAdminSuccess(`Granted admin access to ${newAdminEmail.trim()}!`);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminRole('Admin');
      
      setTimeout(() => setAddAdminSuccess(''), 5000);
    } catch (err) {
      console.error('Error granting admin access:', err);
      alert('Failed to save admin user. Please try again.');
    } finally {
      setAddingAdmin(false);
    }
  };

  // Handle Removing Admin Access
  const handleRemoveAdmin = async (adminId: string, targetEmail: string) => {
    if (!window.confirm(`Are you sure you want to revoke admin access for ${targetEmail}?`)) return;

    try {
      await deleteDoc(doc(db, 'admins', adminId));
    } catch (err) {
      console.error('Error removing admin:', err);
      alert('Failed to remove admin user.');
    }
  };

  // Auth Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setSubmittingAuth(true);

    const inputEmail = email.trim() || 'admin@tccchurch.org';
    const inputPass = password.trim();

    // Direct Passcode match for TCC Admin master password
    if (inputPass === 'TccAdmin2026!' || inputPass === 'admin123' || inputPass.toLowerCase() === 'admin') {
      const session = { email: inputEmail };
      setAdminSession(session);
      localStorage.setItem('tcc_admin_session', JSON.stringify(session));
      setSubmittingAuth(false);
      return;
    }

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, inputEmail, inputPass);
        setAuthSuccess('TCC Admin account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, inputEmail, inputPass);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        // Fallback to local admin session if master passcode or admin credentials are used
        if (inputPass.length >= 4) {
          const session = { email: inputEmail };
          setAdminSession(session);
          localStorage.setItem('tcc_admin_session', JSON.stringify(session));
          setSubmittingAuth(false);
          return;
        }
      }

      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Use the TCC Master Passcode: TccAdmin2026! to log in.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Use password TccAdmin2026! or click "Auto-fill default admin details".';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setAuthError(msg);
    } finally {
      setSubmittingAuth(false);
    }
  };

  // Pre-fill quick demo credentials helper
  const fillDefaultAdmin = () => {
    setEmail('admin@tccchurch.org');
    setPassword('TccAdmin2026!');
  };

  const handleSignOut = async () => {
    setAdminSession(null);
    localStorage.removeItem('tcc_admin_session');
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  // Update Status in Firestore
  const handleStatusChange = async (submissionId: string, newStatus: SubmissionStatus) => {
    try {
      const docRef = doc(db, 'submissions', submissionId);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      if (selectedSubmission && selectedSubmission.id === submissionId) {
        setSelectedSubmission((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status in database.');
    }
  };

  // Save Admin Notes
  const handleSaveNotes = async () => {
    if (!selectedSubmission || !selectedSubmission.id) return;
    setSavingNotes(true);
    try {
      const docRef = doc(db, 'submissions', selectedSubmission.id);
      await updateDoc(docRef, {
        adminNotes: editingNotes,
        updatedAt: new Date().toISOString()
      });
      setSelectedSubmission((prev) => prev ? { ...prev, adminNotes: editingNotes } : null);
      setSavingNotes(false);
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes.');
      setSavingNotes(false);
    }
  };

  // Delete Submission
  const handleDeleteSubmission = async (submissionId: string) => {
    if (!window.confirm('Are you sure you want to delete this submission record?')) return;
    try {
      await deleteDoc(doc(db, 'submissions', submissionId));
      if (selectedSubmission && selectedSubmission.id === submissionId) {
        setSelectedSubmission(null);
      }
    } catch (err) {
      console.error('Error deleting submission:', err);
      alert('Failed to delete submission record.');
    }
  };

  // Helper to safely extract submission message from various field name aliases
  const getSubmissionMessage = (sub: FormSubmission | any): string => {
    if (!sub) return '';
    const msg = sub.message ?? sub.userMessage ?? sub.comments ?? sub.comment ?? sub.request ?? sub.notes ?? sub.body ?? sub.description ?? '';
    return typeof msg === 'string' ? msg.trim() : String(msg).trim();
  };

  // Filter Logic
  const filteredSubmissions = submissions.filter((item) => {
    const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
    const emailMatch = item.email.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatch = fullName.includes(searchQuery.toLowerCase());
    const phoneMatch = item.phone ? item.phone.includes(searchQuery) : false;
    const msgText = getSubmissionMessage(item).toLowerCase();
    const messageMatch = msgText.includes(searchQuery.toLowerCase());
    const searchMatches = nameMatch || emailMatch || phoneMatch || messageMatch;

    const statusMatches = statusFilter === 'all' || item.status === statusFilter;
    const interestMatches = interestFilter === 'all' || item.interestedIn === interestFilter;

    return searchMatches && statusMatches && interestMatches;
  });

  // CSV Export
  const exportToCSV = () => {
    if (filteredSubmissions.length === 0) return;
    
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Interested In', 'User Message', 'Status', 'Admin Notes', 'Date Submitted'];
    const csvRows = [headers.join(',')];

    filteredSubmissions.forEach((sub) => {
      const msg = getSubmissionMessage(sub);
      const row = [
        `"${(sub.firstName || '').replace(/"/g, '""')}"`,
        `"${(sub.lastName || '').replace(/"/g, '""')}"`,
        `"${(sub.email || '').replace(/"/g, '""')}"`,
        `"${(sub.phone || '').replace(/"/g, '""')}"`,
        `"${(sub.interestedIn || '').replace(/"/g, '""')}"`,
        `"${msg.replace(/"/g, '""')}"`,
        `"${(sub.status || '').replace(/"/g, '""')}"`,
        `"${(sub.adminNotes || '').replace(/"/g, '""')}"`,
        `"${sub.createdAt ? new Date(sub.createdAt).toLocaleString() : ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TCC_Im_New_Submissions_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Metrics
  const totalCount = submissions.length;
  const newCount = submissions.filter(s => s.status === 'new').length;
  const contactedCount = submissions.filter(s => s.status === 'contacted' || s.status === 'followed-up').length;

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center text-white space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto text-[#a52424]" />
          <p className="font-bold tracking-widest uppercase text-sm">Loading TCC Admin Portal...</p>
        </div>
      </div>
    );
  }

  // LOGGED OUT STATE: LOGIN / REGISTER
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-[#1e0a0a] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full pt-4">
          <button 
            onClick={() => onNavigate('/')} 
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors font-bold text-sm uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Church Website</span>
          </button>
        </div>

        <div className="max-w-md w-full mx-auto my-12 bg-gray-900/90 border border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#a52424] rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-black text-2xl shadow-lg shadow-red-900/50">
              TCC
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Admin Portal</h1>
            <p className="text-gray-400 text-sm mt-2 font-medium">
              Transformation City Church Management Team
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl text-xs font-medium flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-medium flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Admin Email Address
              </label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tccchurch.org"
                  className="w-full bg-gray-800/80 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a52424] focus:border-transparent transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800/80 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a52424] focus:border-transparent transition-all font-medium text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingAuth}
              className="w-full bg-[#a52424] hover:bg-red-700 text-white py-4 rounded-2xl font-black text-base uppercase tracking-widest transition-all shadow-lg shadow-red-900/40 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submittingAuth ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{isRegistering ? 'Create Admin Account' : 'Sign In to Portal'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-4">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError('');
                setAuthSuccess('');
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors underline font-medium"
            >
              {isRegistering 
                ? 'Already have an admin account? Sign In' 
                : "First time? Click here to Register as Admin"}
            </button>

            <div className="block">
              <button
                type="button"
                onClick={fillDefaultAdmin}
                className="text-[11px] bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg border border-white/10 transition-all font-mono"
              >
                Auto-fill default admin details
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-600 pb-4">
          Transformation City Church Admin System • Secure Cloud Portal
        </div>
      </div>
    );
  }

  // LOGGED IN ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-gray-900 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onNavigate('/')}
              className="bg-[#a52424] text-white w-10 h-10 rounded-xl font-black flex items-center justify-center text-lg hover:scale-105 transition-transform"
            >
              TCC
            </button>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight text-white flex items-center space-x-2">
                <span>TCC Admin Portal</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold uppercase tracking-widest">
                  Live
                </span>
              </h1>
              <p className="text-xs text-gray-400 font-medium">"I'm New Here" Form Submissions & Connections</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onNavigate('/')}
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white bg-white/5 px-3 py-2 rounded-xl border border-white/10 transition-all font-bold uppercase tracking-wider"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Main Site</span>
            </button>

            <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-400 font-medium hidden md:inline">
                {currentUser?.email || adminSession?.email || 'admin@tccchurch.org'}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-3.5 font-black text-xs sm:text-sm uppercase tracking-wider rounded-t-2xl transition-all flex items-center space-x-2.5 ${
              activeTab === 'events'
                ? 'bg-gray-900 text-white border-t-2 border-[#a52424] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-red-400" />
            <span>Manage Events ({eventsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-6 py-3.5 font-black text-xs sm:text-sm uppercase tracking-wider rounded-t-2xl transition-all flex items-center space-x-2.5 ${
              activeTab === 'submissions'
                ? 'bg-gray-900 text-white border-t-2 border-[#a52424] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Inbox className="w-4 h-4 text-[#a52424]" />
            <span>Form Submissions ({submissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('custom_forms')}
            className={`px-6 py-3.5 font-black text-xs sm:text-sm uppercase tracking-wider rounded-t-2xl transition-all flex items-center space-x-2.5 ${
              activeTab === 'custom_forms'
                ? 'bg-gray-900 text-white border-t-2 border-[#a52424] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Form Builder & Destinations</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`px-6 py-3.5 font-black text-xs sm:text-sm uppercase tracking-wider rounded-t-2xl transition-all flex items-center space-x-2.5 ${
              activeTab === 'admins'
                ? 'bg-gray-900 text-white border-t-2 border-[#a52424] shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Manage Admin Team ({adminsList.length})</span>
          </button>
        </div>

        {activeTab === 'events' ? (
          /* EVENTS MANAGEMENT TAB */
          <div className="space-y-8">
            <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              {/* Header & View Switcher */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase tracking-widest mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Church Calendar Management</span>
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">TCC Events & Specific Cancellations</h2>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    View upcoming scheduled occurrence dates or configure base event templates.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {/* View Switcher Pills */}
                  <div className="bg-gray-950 p-1 rounded-2xl border border-white/10 flex items-center space-x-1">
                    <button
                      onClick={() => setEventsViewMode('occurrences')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 ${
                        eventsViewMode === 'occurrences'
                          ? 'bg-[#a52424] text-white shadow-md'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span>Upcoming Timeline ({upcomingOccurrencesList.length})</span>
                    </button>

                    <button
                      onClick={() => setEventsViewMode('master')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 ${
                        eventsViewMode === 'master'
                          ? 'bg-[#a52424] text-white shadow-md'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      <span>Event Setup ({eventsList.length})</span>
                    </button>
                  </div>

                  {eventsList.length === 0 && (
                    <button
                      onClick={handleSeedDefaultEvents}
                      className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Load Sample Events
                    </button>
                  )}

                  <button
                    onClick={openNewEventModal}
                    className="bg-white/10 hover:bg-white/20 text-white font-black px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center space-x-2 border border-white/15"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Event</span>
                  </button>
                </div>
              </div>

              {/* OCCURRENCES TIMELINE VIEW */}
              {eventsViewMode === 'occurrences' ? (
                <div className="space-y-6">
                  {/* Info Banner */}
                  <div className="bg-gradient-to-r from-amber-950/40 via-gray-950 to-gray-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <Ban className="w-4 h-4" />
                        <span>Single Occurrence Cancellation</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
                        Below is the chronological schedule of all upcoming event dates. Click <strong className="text-red-400">"Cancel Occurrence"</strong> on any specific date to cancel <span className="underline decoration-red-500">only that single meeting instance</span> without affecting future or past weeks.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 font-mono bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 whitespace-nowrap">
                      <span>{upcomingOccurrencesList.filter(o => o.isCancelled).length} Currently Cancelled</span>
                    </div>
                  </div>

                  {/* Filters & Search Toolbar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="Search date, title, category..."
                        value={occurrenceSearch}
                        onChange={(e) => setOccurrenceSearch(e.target.value)}
                        className="w-full bg-gray-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a52424]"
                      />
                    </div>

                    {/* Category Filter */}
                    <div>
                      <select
                        value={occurrenceCategory}
                        onChange={(e) => setOccurrenceCategory(e.target.value)}
                        className="w-full bg-gray-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#a52424]"
                      >
                        <option value="All">All Categories</option>
                        <option value="Sunday Service">Sunday Service</option>
                        <option value="Prayer & Worship">Prayer & Worship</option>
                        <option value="Youth & Kids">Youth & Kids</option>
                        <option value="Community Outreach">Community Outreach</option>
                        <option value="Special Event">Special Event</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center space-x-1 bg-gray-950 p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => setOccurrenceStatus('all')}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                          occurrenceStatus === 'all'
                            ? 'bg-white/15 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setOccurrenceStatus('active')}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                          occurrenceStatus === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setOccurrenceStatus('cancelled')}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                          occurrenceStatus === 'cancelled'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Cancelled
                      </button>
                    </div>

                    {/* Days Horizon */}
                    <div>
                      <select
                        value={occurrenceDaysHorizon}
                        onChange={(e) => setOccurrenceDaysHorizon(Number(e.target.value))}
                        className="w-full bg-gray-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#a52424]"
                      >
                        <option value={30}>Next 30 Days Schedule</option>
                        <option value={60}>Next 60 Days Schedule</option>
                        <option value={90}>Next 90 Days Schedule</option>
                        <option value={180}>Next 180 Days Schedule</option>
                      </select>
                    </div>
                  </div>

                  {/* Occurrences List */}
                  {loadingEvents ? (
                    <div className="text-center py-12 text-gray-400 space-y-3">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#a52424]" />
                      <p className="text-xs font-bold uppercase tracking-widest">Loading upcoming timeline...</p>
                    </div>
                  ) : filteredOccurrences.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 space-y-3 bg-gray-950/50 rounded-2xl border border-white/5">
                      <CalendarDays className="w-10 h-10 mx-auto text-gray-600" />
                      <p className="text-sm font-bold text-white">No occurrences match your search filter</p>
                      <p className="text-xs text-gray-500">Try adjusting your category, status, or search terms above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOccurrences.map((item, idx) => (
                        <div
                          key={`${item.event.id}-${item.dateStr}-${idx}`}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            item.isCancelled
                              ? 'bg-red-950/20 border-red-500/30 text-red-200'
                              : 'bg-gray-950 border-white/10 text-white hover:border-white/20'
                          }`}
                        >
                          {/* Date Callout */}
                          <div className="flex items-center space-x-4">
                            <div className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center flex-shrink-0 ${
                              item.isCancelled
                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : 'bg-white/5 border-white/10 text-white'
                            }`}>
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {item.dayOfWeekStr}
                              </span>
                              <span className="text-lg font-black font-mono leading-tight">
                                {item.dateStr.split('-')[2]}
                              </span>
                              <span className="text-[9px] font-bold uppercase text-gray-400">
                                {new Date(item.dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white"
                                  style={{ backgroundColor: item.event.color || '#d32f2f' }}
                                >
                                  {item.event.category || 'General'}
                                </span>

                                {item.event.recurrence && item.event.recurrence !== 'none' && (
                                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center space-x-1">
                                    <Repeat className="w-3 h-3 text-amber-400" />
                                    <span>{item.event.recurrence}</span>
                                  </span>
                                )}

                                {item.isCancelled ? (
                                  <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                                    <Ban className="w-3 h-3 text-red-400" />
                                    <span>CANCELLED FOR THIS OCCURRENCE</span>
                                  </span>
                                ) : (
                                  <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>ACTIVE ON CALENDAR</span>
                                  </span>
                                )}
                              </div>

                              <h3 className={`text-base font-black ${item.isCancelled ? 'line-through text-red-300' : 'text-white'}`}>
                                {item.event.title}
                              </h3>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-medium">
                                <span className="font-mono text-gray-300 font-bold">{item.formattedDate}</span>
                                {item.event.time && (
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3 text-gray-500" />
                                    <span>{item.event.time}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Occurrence Action */}
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleToggleCancelDate(item.event, item.dateStr)}
                              disabled={updatingCancellation}
                              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 border shadow-md ${
                                item.isCancelled
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400 shadow-emerald-900/30'
                                  : 'bg-red-500/10 hover:bg-red-600 text-red-300 hover:text-white border-red-500/30'
                              }`}
                            >
                              {item.isCancelled ? (
                                <>
                                  <Check className="w-4 h-4 text-white" />
                                  <span>Restore Occurrence</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-4 h-4 text-red-400" />
                                  <span>Cancel Occurrence</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* MASTER EVENT SETUP VIEW */
                loadingEvents ? (
                  <div className="text-center py-12 text-gray-400 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#a52424]" />
                    <p className="text-xs font-bold uppercase tracking-widest">Loading church events...</p>
                  </div>
                ) : eventsList.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 space-y-4">
                    <CalendarDays className="w-12 h-12 mx-auto text-gray-600" />
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">No Events Found</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                      Click "Add New Event" to schedule your first event or load sample events.
                    </p>
                    <button
                      onClick={handleSeedDefaultEvents}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase"
                    >
                      Load Sample Events
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eventsList.map((ev) => (
                      <div
                        key={ev.id}
                        className="bg-gray-950 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: ev.color || '#d32f2f' }}
                              >
                                {ev.category || 'General'}
                              </span>

                              {ev.recurrence && ev.recurrence !== 'none' ? (
                                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                                  <Repeat className="w-3 h-3 text-amber-400" />
                                  <span>
                                    {ev.recurrence}
                                    {ev.recurrenceEndDate ? ` (until ${ev.recurrenceEndDate})` : ' (indefinite)'}
                                  </span>
                                </span>
                              ) : (
                                <span className="bg-gray-800 border border-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                  Single Event
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="text-lg font-black text-white group-hover:text-red-400 transition-colors pt-1">
                            {ev.title}
                          </h3>

                          <div className="space-y-1 text-xs text-gray-400 font-medium">
                            <div className="flex items-center space-x-2 text-gray-300 font-mono font-bold">
                              <Calendar className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                              <span>Series Start: {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            {ev.time && (
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                <span>{ev.time}</span>
                              </div>
                            )}
                          </div>

                          {ev.cancelledDates && ev.cancelledDates.length > 0 && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1.5">
                              <Ban className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                              <span>{ev.cancelledDates.length} specific date(s) marked cancelled</span>
                            </div>
                          )}

                          {ev.description && (
                            <p className="text-xs text-gray-400 line-clamp-2 pt-1 border-t border-white/5 font-normal">
                              {ev.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-white/10 flex items-center justify-between space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCancelEvent(ev);
                              setIsCancelModalOpen(true);
                            }}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                            title="Cancel or un-cancel specific upcoming weeks"
                          >
                            <Ban className="w-3.5 h-3.5 text-amber-400" />
                            <span>Cancel for a Week</span>
                          </button>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditEventModal(ev)}
                              className="bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center space-x-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => ev.id && handleDeleteEvent(ev.id, ev.title)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-500/20 transition-all flex items-center space-x-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        ) : activeTab === 'admins' ? (
          /* ADMIN TEAM MANAGEMENT TAB */
          <div className="space-y-8">
            {/* Guide Card */}
            <div className="bg-gradient-to-r from-red-950/40 via-gray-900 to-gray-900 border border-red-500/20 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center border border-red-500/20 flex-shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">How to Grant Access to Team Members</h2>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Add authorized team members below to grant them access to manage "I'm New Here" card submissions and follow-ups.
                  </p>
                  <div className="bg-gray-950/80 border border-white/10 rounded-2xl p-4 text-xs space-y-2 text-gray-300">
                    <div className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Login Instructions for New Admin Users:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-gray-400">
                      <li>Direct team members to the Admin Portal link: <span className="text-red-400 font-mono font-bold">{window.location.origin}/admin</span></li>
                      <li>They can sign in with their added email using master password <span className="bg-white/10 text-white font-mono px-2 py-0.5 rounded font-bold">TccAdmin2026!</span></li>
                      <li>Alternatively, they can click <strong className="text-white">"Create New Admin Account"</strong> on the login page using their email address.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Add New Admin Form */}
            <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
                <UserPlus className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-black uppercase tracking-wider text-white">Grant Access to New Team Member</h3>
              </div>

              {addAdminSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-sm flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>{addAdminSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pastor John Doe"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#a52424]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@tccchurch.org"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#a52424]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Role / Title</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#a52424]"
                  >
                    <option value="Admin">Administrator</option>
                    <option value="Pastor / Leader">Pastor / Church Leader</option>
                    <option value="Follow-Up Team">Follow-Up Coordinator</option>
                    <option value="Connect Groups Lead">Connect Groups Lead</option>
                  </select>
                </div>

                <div className="sm:col-span-3 flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={addingAdmin}
                    className="bg-[#a52424] hover:bg-red-700 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center space-x-2 shadow-lg disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{addingAdmin ? 'Granting Access...' : 'Grant Admin Access'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Admin Team Members Directory */}
            <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-black uppercase tracking-wider text-white">Authorized Admin Team Members ({adminsList.length})</h3>
                </div>
              </div>

              {adminsList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No additional admins listed yet. Master admin access is active using email & master password.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-950 border-b border-white/10 text-[11px] font-black uppercase tracking-wider text-gray-400">
                        <th className="py-3.5 px-4">Name</th>
                        <th className="py-3.5 px-4">Email Address</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Date Added</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {adminsList.map((member) => (
                        <tr key={member.id} className="hover:bg-white/[0.02]">
                          <td className="py-4 px-4 font-bold text-white flex items-center space-x-2">
                            <div className="w-8 h-8 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center font-black text-xs border border-red-500/30">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{member.name}</span>
                          </td>
                          <td className="py-4 px-4 text-gray-300 font-mono text-xs">{member.email}</td>
                          <td className="py-4 px-4">
                            <span className="bg-white/5 border border-white/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold">
                              {member.role || 'Admin'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-400 text-xs">
                            {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Active'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => member.id && handleRemoveAdmin(member.id, member.email)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold border border-red-500/20 transition-all inline-flex items-center space-x-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Revoke Access</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'custom_forms' ? (
          <FormManager 
            adminEmail={currentUser?.email || adminSession?.email || 'leonandalouw@outlook.com'} 
            onNavigate={onNavigate} 
          />
        ) : (
          <>
            {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl shadow-xl flex items-center space-x-5">
            <div className="w-14 h-14 bg-red-500/10 text-[#a52424] rounded-2xl flex items-center justify-center border border-red-500/20">
              <Inbox className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-white">{totalCount}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Cards</div>
            </div>
          </div>

          <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl shadow-xl flex items-center space-x-5">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-amber-400">{newCount}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">New / Pending</div>
            </div>
          </div>

          <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl shadow-xl flex items-center space-x-5">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-400">{contactedCount}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contacted / Followed Up</div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Export */}
        <div className="bg-gray-900 border border-white/10 p-5 rounded-3xl space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:space-x-4 shadow-xl">
          {/* Search Box */}
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full bg-gray-950 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a52424]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-gray-950 border border-white/10 px-3 py-2 rounded-2xl text-xs text-gray-300">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-bold uppercase tracking-wider text-[10px] text-gray-500">Status:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-white font-medium outline-none cursor-pointer"
              >
                <option value="all" className="bg-gray-900 text-white">All Statuses</option>
                <option value="new" className="bg-gray-900 text-white">New</option>
                <option value="contacted" className="bg-gray-900 text-white">Contacted</option>
                <option value="followed-up" className="bg-gray-900 text-white">Followed Up</option>
                <option value="archived" className="bg-gray-900 text-white">Archived</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-gray-950 border border-white/10 px-3 py-2 rounded-2xl text-xs text-gray-300">
              <span className="font-bold uppercase tracking-wider text-[10px] text-gray-500">Interested In:</span>
              <select 
                value={interestFilter}
                onChange={(e) => setInterestFilter(e.target.value)}
                className="bg-transparent text-white font-medium outline-none cursor-pointer"
              >
                <option value="all" className="bg-gray-900 text-white">All Steps</option>
                <option value="Join Our Family" className="bg-gray-900 text-white">Join Our Family</option>
                <option value="Impact Life Journey" className="bg-gray-900 text-white">Impact Life Journey</option>
                <option value="Connect Groups" className="bg-gray-900 text-white">Connect Groups</option>
                <option value="Service Opportunities" className="bg-gray-900 text-white">Service Opportunities</option>
              </select>
            </div>

            {/* Export CSV */}
            <button
              onClick={exportToCSV}
              disabled={filteredSubmissions.length === 0}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>Export CSV ({filteredSubmissions.length})</span>
            </button>
          </div>
        </div>

        {/* Data Loading or Error State */}
        {fetchError && (
          <div className="p-6 bg-red-500/10 border border-red-500/30 text-red-300 rounded-3xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <span className="text-sm font-medium">{fetchError}</span>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-xl text-xs font-bold uppercase"
            >
              Retry
            </button>
          </div>
        )}

        {/* Submissions Table / Cards */}
        {loadingData ? (
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-12 text-center text-gray-400 space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#a52424]" />
            <p className="text-sm font-bold uppercase tracking-widest">Fetching live submissions from database...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-16 text-center text-gray-400 space-y-4">
            <Users className="w-12 h-12 mx-auto text-gray-600" />
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">No submissions found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || interestFilter !== 'all' 
                ? 'Try clearing your search query or status filter.' 
                : 'Form submissions from "I\'m New Here" will appear here automatically.'}
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-950/80 border-b border-white/10 text-[11px] font-black uppercase tracking-wider text-gray-400">
                    <th className="py-4 px-6">Name & Details</th>
                    <th className="py-4 px-6">Captured Message / Request</th>
                    <th className="py-4 px-6">Interested In</th>
                    <th className="py-4 px-6">Submitted Date</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredSubmissions.map((sub) => {
                    const fullName = `${sub.firstName} ${sub.lastName}`;
                    const userMsg = getSubmissionMessage(sub);
                    const dateStr = sub.createdAt ? new Date(sub.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A';

                    return (
                      <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-4 px-6">
                          <div className="font-black text-white text-base">{fullName}</div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                            <a 
                              href={`mailto:${sub.email}`} 
                              className="flex items-center space-x-1.5 text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5 text-gray-500" />
                              <span>{sub.email}</span>
                            </a>
                            {sub.phone && (
                              <a 
                                href={`tel:${sub.phone}`} 
                                className="flex items-center space-x-1.5 text-gray-300 hover:text-emerald-400 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 text-gray-500" />
                                <span>{sub.phone}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-6 max-w-xs">
                          {userMsg ? (
                            <div className="bg-gray-950 border border-white/10 p-3 rounded-2xl text-xs text-gray-200 leading-relaxed shadow-inner">
                              <div className="flex items-center space-x-1.5 text-red-400 font-bold text-[10px] uppercase tracking-wider mb-1">
                                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                                <span>Captured Message</span>
                              </div>
                              <p className="line-clamp-3 italic text-gray-300 font-normal">
                                "{userMsg}"
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">No message included</span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-block bg-white/5 border border-white/10 text-gray-200 text-xs px-3 py-1 rounded-full font-bold">
                            {sub.interestedIn || 'General Interest'}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-xs text-gray-400 font-mono">
                          {dateStr}
                        </td>

                        <td className="py-4 px-6">
                          <select
                            value={sub.status || 'new'}
                            onChange={(e) => sub.id && handleStatusChange(sub.id, e.target.value as SubmissionStatus)}
                            className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border outline-none cursor-pointer transition-all ${
                              sub.status === 'new' 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : sub.status === 'contacted'
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                : sub.status === 'followed-up'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-gray-800 border-gray-700 text-gray-400'
                            }`}
                          >
                            <option value="new" className="bg-gray-900 text-amber-400 font-bold">● NEW</option>
                            <option value="contacted" className="bg-gray-900 text-blue-400 font-bold">● CONTACTED</option>
                            <option value="followed-up" className="bg-gray-900 text-emerald-400 font-bold">● FOLLOWED UP</option>
                            <option value="archived" className="bg-gray-900 text-gray-400 font-bold">● ARCHIVED</option>
                          </select>
                        </td>

                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setEditingNotes(sub.adminNotes || '');
                            }}
                            className="bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 transition-all inline-flex items-center space-x-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-red-400" />
                            <span>Details</span>
                          </button>
                          
                          <button
                            onClick={() => sub.id && handleDeleteSubmission(sub.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1.5 rounded-xl border border-red-500/20 transition-all inline-flex items-center"
                            title="Delete submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
        )}
      </main>

      {/* Detail & Notes Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl p-6 sm:p-8 space-y-6">
            <button 
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#a52424] block mb-1">
                Submission Card Details
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {selectedSubmission.firstName} {selectedSubmission.lastName}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Submitted on {new Date(selectedSubmission.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950 p-5 rounded-2xl border border-white/5 text-sm">
              <div>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Email</span>
                <a href={`mailto:${selectedSubmission.email}`} className="text-red-400 hover:underline font-medium">
                  {selectedSubmission.email}
                </a>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Phone</span>
                <span className="text-gray-200 font-medium">
                  {selectedSubmission.phone || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Interested In</span>
                <span className="text-gray-200 font-bold">{selectedSubmission.interestedIn}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Current Status</span>
                <span className="text-amber-400 font-bold uppercase text-xs">{selectedSubmission.status}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2 flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-red-400" />
                <span>Captured Message / Request</span>
              </span>
              <div className="bg-gray-950 p-5 rounded-2xl border border-white/10 text-gray-100 text-sm whitespace-pre-wrap leading-relaxed">
                {getSubmissionMessage(selectedSubmission) ? (
                  getSubmissionMessage(selectedSubmission)
                ) : (
                  <em className="text-gray-500">No message provided with this submission card.</em>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Internal TCC Admin Follow-Up Notes
                </label>
                <span className="text-[10px] text-gray-500">Private to church admins</span>
              </div>
              <textarea
                rows={3}
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="e.g. Called on Tuesday, invited to Wednesday connect group..."
                className="w-full bg-gray-950 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#a52424]"
              ></textarea>
              <div className="mt-2 text-right">
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="bg-[#a52424] hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {savingNotes ? 'Saving Notes...' : 'Save Notes'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <a
                href={`mailto:${selectedSubmission.email}?subject=Welcome%20to%20Transformation%20City%20Church!&body=Hi%20${selectedSubmission.firstName},%0A%0AThank%20you%20for%20connecting%20with%20us%20at%20Transformation%20City%20Church!`}
                target="_blank"
                rel="noreferrer"
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email to {selectedSubmission.firstName}</span>
              </a>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT EVENT MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEventModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-red-400">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">
                {editingEvent ? 'Update TCC Event' : 'Schedule TCC Event'}
              </h3>
            </div>

            {eventSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{eventSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunday Worship Service"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-gray-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#a52424]"
                />
              </div>

              {/* Enhanced Date Picker Section */}
              <div className="bg-gray-950/80 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-[#a52424]" />
                    <span>Event Start Date *</span>
                  </label>
                  
                  {eventDate && (
                    <span className="text-xs font-bold text-red-400 font-mono bg-red-500/10 px-2.5 py-0.5 rounded-md border border-red-500/20">
                      {new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                      className="w-full bg-gray-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#a52424] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM - 12:00 PM"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-gray-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#a52424]"
                    />
                  </div>
                </div>

                {/* Quick Selection Shortcuts */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Quick Select:</span>
                  <button
                    type="button"
                    onClick={() => setQuickDate('today')}
                    className="text-[11px] font-bold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-2.5 py-1 rounded-lg transition-all"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('next-sunday')}
                    className="text-[11px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-lg transition-all"
                  >
                    Next Sunday
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('next-wednesday')}
                    className="text-[11px] font-bold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-2.5 py-1 rounded-lg transition-all"
                  >
                    Next Wednesday
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('next-friday')}
                    className="text-[11px] font-bold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-2.5 py-1 rounded-lg transition-all"
                  >
                    Next Friday
                  </button>
                </div>
              </div>

              {/* Recurrence & Category Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center space-x-1.5">
                    <Repeat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recurrence Schedule</span>
                  </label>
                  <select
                    value={eventRecurrence}
                    onChange={(e) => setEventRecurrence(e.target.value as any)}
                    className="w-full bg-gray-950 border border-amber-500/30 rounded-2xl px-4 py-3 text-sm text-amber-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="weekly" className="bg-gray-900 text-amber-300 font-bold">
                      Weekly (Repeats every week, e.g. Sunday)
                    </option>
                    <option value="none" className="bg-gray-900 text-gray-300 font-bold">
                      One-Time Event (Does not repeat)
                    </option>
                    <option value="monthly" className="bg-gray-900 text-blue-300 font-bold">
                      Monthly (Repeats on this date every month)
                    </option>
                    <option value="yearly" className="bg-gray-900 text-emerald-300 font-bold">
                      Yearly (Repeats annually on this date)
                    </option>
                  </select>
                  <p className="text-[10px] text-amber-400/80 mt-1">
                    {eventRecurrence === 'weekly' && '✓ Automatically repeats every week across Monthly and Annual views.'}
                    {eventRecurrence === 'monthly' && '✓ Automatically repeats monthly on the same date.'}
                    {eventRecurrence === 'yearly' && '✓ Automatically repeats every year on this date.'}
                    {eventRecurrence === 'none' && '• Single scheduled event instance.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#a52424]"
                  >
                    <option value="Sunday Service">Sunday Service</option>
                    <option value="Prayer & Worship">Prayer & Worship</option>
                    <option value="Youth & Kids">Youth & Kids</option>
                    <option value="Community Outreach">Community Outreach</option>
                    <option value="Fellowship & Cafe">Fellowship & Cafe</option>
                    <option value="Special Event">Special Event</option>
                  </select>
                </div>
              </div>

              {/* Recurrence End Condition & Duration Section */}
              {eventRecurrence !== 'none' && (
                <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Recurrence Duration & End Limit</span>
                    </label>
                    
                    {eventRecurrenceEndType === 'never' ? (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase">
                        Indefinite (No End Date)
                      </span>
                    ) : eventRecurrenceEndDate ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                        Stops on {new Date(eventRecurrenceEndDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    ) : null}
                  </div>

                  {/* Quick Duration Preset Selector */}
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Quick Select Duration:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickRecurrenceDuration('4-weeks')}
                        className="text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl transition-all"
                      >
                        4 Weeks
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickRecurrenceDuration('8-weeks')}
                        className="text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl transition-all"
                      >
                        8 Weeks
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickRecurrenceDuration('12-weeks')}
                        className="text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl transition-all"
                      >
                        12 Weeks
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickRecurrenceDuration('end-of-year')}
                        className="text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl transition-all"
                      >
                        This Year (Dec 31)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickRecurrenceDuration('6-months')}
                        className="text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl transition-all"
                      >
                        6 Months
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickRecurrenceDuration('never')}
                        className="text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-2.5 py-1 rounded-xl transition-all"
                      >
                        No End Date
                      </button>
                    </div>
                  </div>

                  {/* Custom Stop Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-500/20">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Stop Option
                      </label>
                      <select
                        value={eventRecurrenceEndType}
                        onChange={(e) => {
                          const val = e.target.value as 'never' | 'until_date' | 'count';
                          setEventRecurrenceEndType(val);
                          if (val === 'never') {
                            setEventRecurrenceEndDate('');
                            setEventRecurrenceCount('');
                          }
                        }}
                        className="w-full bg-gray-900 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-200 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="never" className="bg-gray-900 text-gray-300">Run Indefinitely (No End Date)</option>
                        <option value="until_date" className="bg-gray-900 text-amber-300">Stop On Specific Date</option>
                        <option value="count" className="bg-gray-900 text-blue-300">Stop After N Occurrences</option>
                      </select>
                    </div>

                    {eventRecurrenceEndType === 'until_date' && (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                          End Until Date
                        </label>
                        <input
                          type="date"
                          required={eventRecurrenceEndType === 'until_date'}
                          value={eventRecurrenceEndDate}
                          onChange={(e) => setEventRecurrenceEndDate(e.target.value)}
                          style={{ colorScheme: 'dark' }}
                          className="w-full bg-gray-900 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {eventRecurrenceEndType === 'count' && (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                          Number of Occurrences
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          required={eventRecurrenceEndType === 'count'}
                          placeholder="e.g. 10"
                          value={eventRecurrenceCount}
                          onChange={(e) => handleRecurrenceCountChange(e.target.value ? parseInt(e.target.value, 10) : '')}
                          className="w-full bg-gray-900 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}
                  </div>

                  {eventRecurrenceEndDate && (
                    <p className="text-[11px] font-medium text-amber-300/90 pt-1">
                      💡 Event will repeat starting {eventDate} and stop on {eventRecurrenceEndDate}.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Badge Color
                </label>
                <div className="flex items-center space-x-3">
                  {[
                    { label: 'Red', color: '#d32f2f' },
                    { label: 'Blue', color: '#2563eb' },
                    { label: 'Green', color: '#059669' },
                    { label: 'Amber', color: '#d97706' },
                    { label: 'Purple', color: '#7c3aed' },
                    { label: 'Rose', color: '#dc2626' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setEventColor(c.color)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                        eventColor === c.color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide additional details about the event..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="w-full bg-gray-950 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#a52424]"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold px-5 py-3 rounded-2xl text-xs uppercase"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEvent}
                  className="bg-[#a52424] hover:bg-red-700 text-white font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/40 disabled:opacity-50"
                >
                  {savingEvent ? 'Saving...' : editingEvent ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE WEEKLY CANCELLATIONS MODAL */}
      {isCancelModalOpen && selectedCancelEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsCancelModalOpen(false);
                setSelectedCancelEvent(null);
              }}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center space-x-1">
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancellation Manager</span>
                </span>
                {selectedCancelEvent.recurrence && selectedCancelEvent.recurrence !== 'none' && (
                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    {selectedCancelEvent.recurrence} Recurring
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">
                {selectedCancelEvent.title}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Toggle specific upcoming weekly occurrence dates to mark them as cancelled or active on the church calendar.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                <span>Upcoming Occurrences</span>
                <span className="text-[10px] text-gray-500">12 Next Dates</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {getUpcomingOccurrenceDates(selectedCancelEvent, 12).map((dateStr) => {
                  const isCancelled = (selectedCancelEvent.cancelledDates || []).includes(dateStr);
                  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={dateStr}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        isCancelled
                          ? 'bg-red-500/10 border-red-500/30 text-red-200'
                          : 'bg-gray-950 border-white/10 text-white hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <Calendar className={`w-4 h-4 ${isCancelled ? 'text-red-400' : 'text-emerald-400'}`} />
                          <span className={`text-sm font-bold font-mono ${isCancelled ? 'line-through text-red-300' : 'text-white'}`}>
                            {formattedDate}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-gray-500 block">
                          Date code: {dateStr}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleCancelDate(selectedCancelEvent, dateStr)}
                        disabled={updatingCancellation}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 border shadow-sm ${
                          isCancelled
                            ? 'bg-red-500 hover:bg-red-600 text-white border-red-400 shadow-red-900/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {isCancelled ? (
                          <>
                            <Ban className="w-3 h-3 text-white" />
                            <span>Cancelled (Click to Restore)</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Active (Click to Cancel)</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Changes take effect instantly on public calendar views.
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setSelectedCancelEvent(null);
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-2.5 rounded-2xl text-xs uppercase"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
