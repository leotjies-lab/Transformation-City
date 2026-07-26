
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
  status: SubmissionStatus;
  adminNotes?: string;
  createdAt: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
}
