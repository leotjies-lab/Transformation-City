
export interface NavItem {
  label: string;
  href: string;
  subItems?: NavItem[];
}

export interface Ministry {
  title: string;
  description: string;
  icon: string;
}

export interface WeeklyActivity {
  day: string;
  time: string;
  title: string;
  description?: string;
  color?: string;
}

export type SubmissionStatus = 'new' | 'contacted' | 'followed-up' | 'archived';

export interface FormSubmission {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  interestedIn: string;
  message?: string;
  userMessage?: string;
  comments?: string;
  request?: string;
  status: SubmissionStatus;
  adminNotes?: string;
  createdAt: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
}

export interface AdminMember {
  id?: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface TCCEvent {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  category?: string;
  description?: string;
  color?: string;
  recurrence?: 'none' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndType?: 'never' | 'until_date' | 'count';
  recurrenceEndDate?: string; // YYYY-MM-DD where recurrence stops
  recurrenceCount?: number; // Number of occurrences if count based
  cancelledDates?: string[]; // Array of YYYY-MM-DD strings where event is cancelled
  isCancelled?: boolean; // For single event instance cancellation
  createdAt?: string;
  updatedAt?: string;
}
