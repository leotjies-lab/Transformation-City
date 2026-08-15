
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

export type EmailDeliveryStatus = 'sent' | 'failed' | 'pending' | 'submitted_only' | 'db_only';

export type SubmissionStatus = 'new' | 'contacted' | 'followed-up' | 'archived';

export type FormFieldType = 'text' | 'textarea' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'date';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
}

export type FormDestination = 'save' | 'email' | 'save_and_email';

export interface CustomForm {
  id?: string;
  title: string;
  description?: string;
  ownerEmail: string;
  destination: FormDestination;
  fields: FormField[];
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomFormSubmission {
  id?: string;
  formId: string;
  formTitle: string;
  ownerEmail?: string;
  destination?: FormDestination;
  answers: Record<string, any>; // field id or label -> submitted value
  status: SubmissionStatus;
  emailDeliveryStatus?: EmailDeliveryStatus;
  emailDispatchedAt?: string;
  emailError?: string;
  emailMessageId?: string;
  adminNotes?: string;
  createdAt: string;
}

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
  emailDeliveryStatus?: EmailDeliveryStatus;
  emailDispatchedAt?: string;
  emailError?: string;
  emailMessageId?: string;
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

export interface Sermon {
  id?: string;
  title: string;
  speaker: string;
  sermonDate: string; // YYYY-MM-DD
  theme?: string;
  series?: string;
  audioLength?: string; // e.g. "45:30"
  description?: string;
  scripture?: string;
  driveFileId?: string;
  driveFileName?: string;
  audioUrl: string; // Stream URL
  downloadUrl?: string; // Direct download link
  driveWebViewLink?: string;
  fileSize?: string;
  isPublished: boolean; // Checkbox to make available on front end
  isArchived?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DriveAudioFile {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
}


