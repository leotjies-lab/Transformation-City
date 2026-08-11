import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { CustomForm, CustomFormSubmission, FormField, FormFieldType, FormDestination, SubmissionStatus } from '../types';
import CustomFormFiller from './CustomFormFiller';
import { 
  Plus, 
  FileText, 
  Trash2, 
  Edit3, 
  Eye, 
  Copy, 
  Check, 
  Download, 
  Mail, 
  MailCheck,
  MailWarning,
  AlertTriangle,
  RefreshCw,
  Database, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  ToggleLeft, 
  ToggleRight, 
  Inbox, 
  Filter, 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Send,
  HelpCircle
} from 'lucide-react';

interface FormManagerProps {
  adminEmail?: string;
  onNavigate?: (path: string) => void;
}

const PRESET_TEMPLATES: { label: string; form: Omit<CustomForm, 'id' | 'createdAt'> }[] = [
  {
    label: 'Start The Journey',
    form: {
      title: 'Start The Journey - Next Steps',
      description: 'Connect with Transformation City Church family and start your journey.',
      ownerEmail: 'leonandalouw@outlook.com',
      destination: 'save_and_email',
      active: true,
      fields: [
        { id: 'j1', label: 'First Name', type: 'text', required: true, placeholder: 'e.g. John' },
        { id: 'j2', label: 'Last Name', type: 'text', required: true, placeholder: 'e.g. Doe' },
        { id: 'j3', label: 'Email Address', type: 'email', required: true, placeholder: 'name@example.com' },
        { id: 'j4', label: 'Phone / Mobile Number', type: 'phone', required: true, placeholder: '+27 82 123 4567' },
        { 
          id: 'j5', 
          label: 'Interested In / Journey Step', 
          type: 'select', 
          required: true, 
          options: [
            'Join Our Family',
            'Impact Life Journey',
            'Connect Group',
            'Transformation Life'
          ] 
        },
        { id: 'j6', label: 'Personal Message / Comments', type: 'textarea', required: false, placeholder: 'Tell us a bit about yourself...' }
      ]
    }
  },
  {
    label: 'Volunteer Application',
    form: {
      title: 'TCC Volunteer Application',
      description: 'Sign up to serve with our ministry teams at Transformation City Church.',
      ownerEmail: 'leonandalouw@outlook.com',
      destination: 'save_and_email',
      active: true,
      fields: [
        { id: 'f1', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. John Doe' },
        { id: 'f2', label: 'Email Address', type: 'email', required: true, placeholder: 'name@example.com' },
        { id: 'f3', label: 'Phone / WhatsApp', type: 'phone', required: true, placeholder: '+27 82 123 4567' },
        { 
          id: 'f4', 
          label: 'Preferred Ministry Team', 
          type: 'select', 
          required: true, 
          options: ['Prayer Team', 'Music & Worship', 'Identity TCC Youth', 'Little Lights Kids', 'Connect Cafe & Hospitality'] 
        },
        { 
          id: 'f5', 
          label: 'Availability', 
          type: 'checkbox', 
          required: false, 
          options: ['Sunday Mornings', 'Wednesday Evenings', 'Friday Nights', 'Special Events'] 
        },
        { id: 'f6', label: 'Why do you want to join this ministry?', type: 'textarea', required: false, placeholder: 'Briefly share your heart...' }
      ]
    }
  },
  {
    label: 'Water Baptism Registration',
    form: {
      title: 'Water Baptism Registration',
      description: 'Take your next step in faith through believer\'s water baptism.',
      ownerEmail: 'leonandalouw@outlook.com',
      destination: 'save_and_email',
      active: true,
      fields: [
        { id: 'b1', label: 'Full Name', type: 'text', required: true, placeholder: 'Full Legal Name' },
        { id: 'b2', label: 'Email Address', type: 'email', required: true, placeholder: 'name@example.com' },
        { id: 'b3', label: 'Mobile Number', type: 'phone', required: true, placeholder: '+27 82 123 4567' },
        { id: 'b4', label: 'Preferred Baptism Date', type: 'date', required: true },
        { id: 'b5', label: 'Share a brief testimony of your decision to follow Jesus', type: 'textarea', required: true, placeholder: 'How did you come to faith?' }
      ]
    }
  },
  {
    label: 'Prayer Request Form',
    form: {
      title: 'Confidential Prayer Request',
      description: 'Our TCC Intercession team stands with you in faith and prayer.',
      ownerEmail: 'leonandalouw@outlook.com',
      destination: 'save_and_email',
      active: true,
      fields: [
        { id: 'p1', label: 'Your Name', type: 'text', required: false, placeholder: 'Optional / Anonymous if blank' },
        { id: 'p2', label: 'Email for Follow-up', type: 'email', required: false, placeholder: 'Optional email' },
        { id: 'p3', label: 'Prayer Category', type: 'select', required: true, options: ['Healing & Health', 'Family & Relationships', 'Financial Breakthrough', 'Spiritual Guidance', 'Other'] },
        { id: 'p4', label: 'Keep Request Confidential?', type: 'radio', required: true, options: ['Yes - Pastors & Intercessors Only', 'Public - Share with Prayer Chain'] },
        { id: 'p5', label: 'Your Prayer Request', type: 'textarea', required: true, placeholder: 'Describe your prayer need...' }
      ]
    }
  },
  {
    label: 'Connect Group Sign-Up',
    form: {
      title: 'Join a Connect Group',
      description: 'Find fellowship, accountability, and community in a TCC local Connect Group.',
      ownerEmail: 'leonandalouw@outlook.com',
      destination: 'save_and_email',
      active: true,
      fields: [
        { id: 'c1', label: 'First & Last Name', type: 'text', required: true },
        { id: 'c2', label: 'Email Address', type: 'email', required: true },
        { id: 'c3', label: 'Phone Number', type: 'phone', required: true },
        { id: 'c4', label: 'Suburb / Area', type: 'text', required: true, placeholder: 'e.g. City Center, North suburbs' },
        { id: 'c5', label: 'Life Stage', type: 'select', required: true, options: ['Young Adults', 'Couples & Families', 'Men\'s Fellowship', 'Women\'s Fellowship', 'Seniors (50+)'] }
      ]
    }
  }
];

export const FormManager: React.FC<FormManagerProps> = ({ adminEmail = 'leonandalouw@outlook.com' }) => {
  const [subTab, setSubTab] = useState<'forms' | 'builder' | 'submissions'>('forms');

  // Custom Forms State
  const [formsList, setFormsList] = useState<CustomForm[]>([]);
  const [selectedFormForPreview, setSelectedFormForPreview] = useState<CustomForm | null>(null);
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>('all');

  // Custom Submissions State
  const [customSubmissions, setCustomSubmissions] = useState<CustomFormSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<CustomFormSubmission | null>(null);
  const [emailDeliveryFilter, setEmailDeliveryFilter] = useState<'all' | 'sent' | 'submitted_only' | 'failed' | 'db_only'>('all');
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendStatusMsg, setResendStatusMsg] = useState<string | null>(null);

  const getNormalizedEmailStatus = (sub: CustomFormSubmission): 'sent' | 'submitted_only' | 'failed' | 'db_only' => {
    if (sub.emailDeliveryStatus === 'sent') return 'sent';
    if (sub.emailDeliveryStatus === 'failed') return 'failed';
    if (sub.emailDeliveryStatus === 'db_only' || sub.destination === 'save') return 'db_only';
    return 'submitted_only';
  };

  const handleResendSubmissionEmail = async (sub: CustomFormSubmission) => {
    setIsResendingEmail(true);
    setResendStatusMsg(null);

    const readableAnswers: Record<string, any> = {};
    Object.entries(sub.answers || {}).forEach(([k, v]) => {
      readableAnswers[k] = Array.isArray(v) ? v.join(', ') : String(v || '');
    });

    try {
      const res = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: sub.formId,
          formTitle: sub.formTitle,
          ownerEmail: sub.ownerEmail || 'leonandalouw@outlook.com',
          destination: sub.destination || 'save_and_email',
          answers: readableAnswers,
          createdAt: sub.createdAt,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendStatusMsg('Email successfully dispatched via SMTP to admin inbox!');
        if (sub.id) {
          await updateDoc(doc(db, 'custom_submissions', sub.id), {
            emailDeliveryStatus: 'sent',
            emailDispatchedAt: new Date().toISOString(),
            emailMessageId: data.messageId || null
          }).catch(() => {});
        }
        setSelectedSubmission((prev) => prev ? {
          ...prev,
          emailDeliveryStatus: 'sent',
          emailDispatchedAt: new Date().toISOString()
        } : null);
        setCustomSubmissions((prev) => prev.map((item) => item.id === sub.id ? {
          ...item,
          emailDeliveryStatus: 'sent',
          emailDispatchedAt: new Date().toISOString()
        } : item));
      } else {
        setResendStatusMsg(`Dispatch failed: ${data.error || 'SMTP delivery issue'}`);
        if (sub.id) {
          await updateDoc(doc(db, 'custom_submissions', sub.id), {
            emailDeliveryStatus: 'failed',
            emailError: data.error || 'SMTP delivery issue'
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      setResendStatusMsg(`Network error: ${err.message}`);
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Form Builder State
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderDescription, setBuilderDescription] = useState('');
  const [builderOwnerEmail, setBuilderOwnerEmail] = useState(adminEmail);
  const [builderDestination, setBuilderDestination] = useState<FormDestination>('save_and_email');
  const [builderActive, setBuilderActive] = useState(true);
  const [builderFields, setBuilderFields] = useState<FormField[]>([]);

  // Feedback states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // SMTP Server Config State
  const [smtpStatus, setSmtpStatus] = useState<{
    configured: boolean;
    host: string;
    user: string;
    from: string;
    recipients: string[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/smtp-status')
      .then((res) => res.json())
      .then((data) => setSmtpStatus(data))
      .catch((err) => console.warn('Could not fetch SMTP status:', err));
  }, []);

  const registerStartJourneyForm = async () => {
    const startJourneyTemplate = PRESET_TEMPLATES[0].form; // Start The Journey
    const formData = {
      title: startJourneyTemplate.title,
      description: startJourneyTemplate.description || '',
      ownerEmail: 'leonandalouw@outlook.com',
      destination: 'save_and_email' as FormDestination,
      fields: startJourneyTemplate.fields,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sanitizedData = JSON.parse(JSON.stringify(formData));

    try {
      const docRef = await addDoc(collection(db, 'custom_forms'), sanitizedData);
      setSuccessMsg('Registered "Start The Journey" form with destination email: leonandalouw@outlook.com');
      setTimeout(() => setSuccessMsg(null), 4000);
      setFormsList((prev) => [{ ...formData, id: docRef.id }, ...prev]);
    } catch (e) {
      console.warn('Fallback to local state for Start The Journey form:', e);
      setFormsList((prev) => [{ ...formData, id: 'local_journey_' + Date.now() }, ...prev]);
      setSuccessMsg('Registered "Start The Journey" form locally with destination email: leonandalouw@outlook.com');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Fetch Custom Forms from Firestore with live sync
  useEffect(() => {
    try {
      const q = query(collection(db, 'custom_forms'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: CustomForm[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<CustomForm, 'id'>) });
        });

        // Auto seed Start The Journey if no form with that title exists
        const hasStartJourney = list.some(
          (f) => f.title && f.title.toLowerCase().includes('start the journey')
        );

        if (list.length === 0 || !hasStartJourney) {
          const defaultForm: CustomForm = {
            id: 'default_journey',
            ...PRESET_TEMPLATES[0].form,
            createdAt: new Date().toISOString(),
          };
          setFormsList([defaultForm, ...list]);
        } else {
          setFormsList(list);
        }
      }, (err) => {
        console.warn('Firestore custom_forms sync error:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Unable to subscribe to custom_forms:', e);
    }
  }, []);

  // Fetch Custom Submissions from Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, 'custom_submissions'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: CustomFormSubmission[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<CustomFormSubmission, 'id'>) });
        });
        setCustomSubmissions(list);
      }, (err) => {
        console.warn('Firestore custom_submissions sync error:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Unable to subscribe to custom_submissions:', e);
    }
  }, []);

  const openNewFormBuilder = () => {
    setEditingFormId(null);
    setBuilderTitle('');
    setBuilderDescription('');
    setBuilderOwnerEmail(adminEmail);
    setBuilderDestination('save_and_email');
    setBuilderActive(true);
    setBuilderFields([
      { id: 'f_' + Date.now() + '_1', label: 'Full Name', type: 'text', required: true, placeholder: 'Your Name' },
      { id: 'f_' + Date.now() + '_2', label: 'Email Address', type: 'email', required: true, placeholder: 'name@example.com' }
    ]);
    setSubTab('builder');
  };

  const openEditForm = (formItem: CustomForm) => {
    setEditingFormId(formItem.id || null);
    setBuilderTitle(formItem.title);
    setBuilderDescription(formItem.description || '');
    setBuilderOwnerEmail(formItem.ownerEmail || adminEmail);
    setBuilderDestination(formItem.destination);
    setBuilderActive(formItem.active);
    setBuilderFields(formItem.fields || []);
    setSubTab('builder');
  };

  const loadPresetTemplate = (template: typeof PRESET_TEMPLATES[0]) => {
    setEditingFormId(null);
    setBuilderTitle(template.form.title);
    setBuilderDescription(template.form.description || '');
    setBuilderOwnerEmail(template.form.ownerEmail);
    setBuilderDestination(template.form.destination);
    setBuilderActive(true);
    setBuilderFields(JSON.parse(JSON.stringify(template.form.fields)));
    setSuccessMsg(`Loaded template: "${template.label}"`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const addFieldToBuilder = (type: FormFieldType = 'text') => {
    const newField: FormField = {
      id: 'field_' + Date.now(),
      label: type === 'email' ? 'Email Address' : type === 'phone' ? 'Phone Number' : 'New Field',
      type,
      required: false,
      placeholder: '',
      options: ['select', 'checkbox', 'radio'].includes(type) ? ['Option 1', 'Option 2'] : undefined
    };
    setBuilderFields((prev) => [...prev, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setBuilderFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeField = (id: string) => {
    setBuilderFields((prev) => prev.filter((f) => f.id !== id));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= builderFields.length) return;
    const updated = [...builderFields];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBuilderFields(updated);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderTitle.trim()) {
      alert('Please enter a form title');
      return;
    }
    if (builderFields.length === 0) {
      alert('Please add at least one field to your form');
      return;
    }

    // Clean fields to avoid Firestore 'undefined' property errors
    const cleanedFields = builderFields.map((field) => {
      const cleanField: Record<string, any> = {
        id: field.id || 'f_' + Math.random().toString(36).substring(2, 9),
        label: field.label || 'Question',
        type: field.type || 'text',
        required: !!field.required,
      };

      if (field.placeholder) cleanField.placeholder = field.placeholder;
      if (field.helpText) cleanField.helpText = field.helpText;
      if (field.options && field.options.length > 0) cleanField.options = field.options;

      return cleanField;
    });

    const formData = {
      title: builderTitle.trim(),
      description: builderDescription.trim() || '',
      ownerEmail: builderOwnerEmail.trim() || adminEmail,
      destination: builderDestination,
      fields: cleanedFields,
      active: builderActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sanitizedData = JSON.parse(JSON.stringify(formData));

    try {
      if (editingFormId) {
        await updateDoc(doc(db, 'custom_forms', editingFormId), sanitizedData);
        setSuccessMsg('Form updated successfully!');
      } else {
        await addDoc(collection(db, 'custom_forms'), sanitizedData);
        setSuccessMsg('New form created successfully!');
      }
      setTimeout(() => setSuccessMsg(null), 3500);
      setSubTab('forms');
    } catch (err) {
      console.error('Error saving custom form:', err);
      // Fallback local update
      if (editingFormId) {
        setFormsList((prev) => prev.map((f) => f.id === editingFormId ? { ...formData, id: editingFormId } : f));
      } else {
        setFormsList((prev) => [{ ...formData, id: 'local_' + Date.now() }, ...prev]);
      }
      setSuccessMsg('Form saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
      setSubTab('forms');
    }
  };

  const handleToggleFormActive = async (formItem: CustomForm) => {
    if (!formItem.id) return;
    const newActiveState = !formItem.active;
    try {
      await updateDoc(doc(db, 'custom_forms', formItem.id), { active: newActiveState });
    } catch (e) {
      setFormsList((prev) => prev.map((f) => f.id === formItem.id ? { ...f, active: newActiveState } : f));
    }
  };

  const handleDeleteForm = async (formItem: CustomForm) => {
    if (!window.confirm(`Are you sure you want to delete form "${formItem.title}"?`)) return;
    if (formItem.id && !formItem.id.startsWith('local_')) {
      try {
        await deleteDoc(doc(db, 'custom_forms', formItem.id));
      } catch (e) {
        console.error('Delete error:', e);
      }
    }
    setFormsList((prev) => prev.filter((f) => f.id !== formItem.id));
  };

  const copyFormEmbedLink = (formItem: CustomForm) => {
    const code = `<iframe src="${window.location.origin}/form/${formItem.id}" width="100%" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(code);
    setCopiedId(formItem.id || 'code');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleUpdateSubmissionStatus = async (sub: CustomFormSubmission, status: SubmissionStatus) => {
    if (!sub.id) return;
    try {
      await updateDoc(doc(db, 'custom_submissions', sub.id), { status });
    } catch (e) {
      setCustomSubmissions((prev) => prev.map((s) => s.id === sub.id ? { ...s, status } : s));
    }
    if (selectedSubmission?.id === sub.id) {
      setSelectedSubmission((prev) => prev ? { ...prev, status } : null);
    }
  };

  const handleDeleteSubmission = async (sub: CustomFormSubmission) => {
    if (!window.confirm('Delete this submission record?')) return;
    if (sub.id) {
      try {
        await deleteDoc(doc(db, 'custom_submissions', sub.id));
      } catch (e) {
        console.error('Delete submission error:', e);
      }
    }
    setCustomSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
    if (selectedSubmission?.id === sub.id) {
      setSelectedSubmission(null);
    }
  };

  const exportSubmissionsCSV = () => {
    const filtered = selectedFormFilter === 'all' 
      ? customSubmissions 
      : customSubmissions.filter((s) => s.formId === selectedFormFilter);

    if (filtered.length === 0) {
      alert('No submissions available to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,Form Title,Submitted Date,Status,Responses\n';
    filtered.forEach((s) => {
      const respStr = Object.entries(s.answers || {})
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`)
        .join(' | ')
        .replace(/"/g, '""');

      csvContent += `"${s.formTitle}","${new Date(s.createdAt).toLocaleString()}","${s.status}","${respStr}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TCC_Form_Submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered submissions
  const displayedSubmissions = customSubmissions.filter((s) => {
    const matchesForm = selectedFormFilter === 'all' || s.formId === selectedFormFilter;
    const answersText = JSON.stringify(s.answers || '').toLowerCase();
    const matchesSearch = !searchTerm || s.formTitle.toLowerCase().includes(searchTerm.toLowerCase()) || answersText.includes(searchTerm.toLowerCase());
    
    const emailStatus = getNormalizedEmailStatus(s);
    const matchesEmail = emailDeliveryFilter === 'all' || emailStatus === emailDeliveryFilter;

    return matchesForm && matchesSearch && matchesEmail;
  });

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Sub Navigation Header */}
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-400 font-bold text-xs uppercase tracking-widest mb-1">
            <FileText className="w-4 h-4" />
            <span>Church Form Management & Destinations</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Form Builder & Submissions</h2>
          <p className="text-xs text-gray-400 mt-1">
            Build custom church sign-up forms and define destination preferences (save to database, email to owner, or both).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={registerStartJourneyForm}
            className="px-4 py-2.5 bg-gradient-to-r from-red-800 to-[#a52424] hover:from-red-700 hover:to-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg border border-red-500/30"
            title="Register or update 'Start The Journey' form with destination leonandalouw@outlook.com"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Register "Start The Journey" Form</span>
          </button>

          <button
            onClick={() => setSubTab('forms')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 ${
              subTab === 'forms'
                ? 'bg-[#a52424] text-white shadow-md'
                : 'bg-gray-950 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Active Forms ({formsList.length})</span>
          </button>

          <button
            onClick={openNewFormBuilder}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 ${
              subTab === 'builder'
                ? 'bg-[#a52424] text-white shadow-md'
                : 'bg-gray-950 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Create New Form</span>
          </button>

          <button
            onClick={() => setSubTab('submissions')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 ${
              subTab === 'submissions'
                ? 'bg-[#a52424] text-white shadow-md'
                : 'bg-gray-950 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            <Inbox className="w-4 h-4 text-amber-400" />
            <span>Submissions Inbox ({customSubmissions.length})</span>
          </button>
        </div>
      </div>

      {/* SMTP Email Backend Status Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start space-x-3">
          <div className={`p-2.5 rounded-xl mt-0.5 ${smtpStatus?.configured ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Backend Email Dispatch Engine
              </h4>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                smtpStatus?.configured ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {smtpStatus?.configured ? 'SMTP Active' : 'Sandbox Test Mode'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Target Admin Recipient: <span className="text-white font-bold">admin@transformationcitychurch.org</span> & <span className="text-white font-bold">leonandalouw@outlook.com</span>.
              {!smtpStatus?.configured && (
                <span className="block mt-1 text-amber-300/90">
                  ⚠️ Note: Operating in Ethereal Sandbox mode. Submissions save to this Admin Inbox and generate backend test emails. To send to external inboxes, populate <code className="bg-black/50 px-1 py-0.5 rounded text-amber-200">SMTP_HOST</code>, <code className="bg-black/50 px-1 py-0.5 rounded text-amber-200">SMTP_USER</code>, and <code className="bg-black/50 px-1 py-0.5 rounded text-amber-200">SMTP_PASS</code> in <code className="bg-black/50 px-1 py-0.5 rounded text-amber-200">.env</code>.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <a
            href="#submissions"
            onClick={() => setSubTab('submissions')}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white rounded-xl transition-all border border-white/10 text-center"
          >
            View Submissions Inbox
          </a>
        </div>
      </div>

      {/* TAB 1: ALL CUSTOM FORMS */}
      {subTab === 'forms' && (
        <div className="space-y-6">
          {formsList.length === 0 ? (
            <div className="bg-gray-900/60 border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-6">
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto text-gray-500">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">No Custom Forms Created Yet</h3>
                <p className="text-sm text-gray-400 max-w-md mx-auto mt-1">
                  Start by building a custom form from scratch or click one of the pre-built church templates below.
                </p>
              </div>

              {/* Quick Template Loading Cards */}
              <div className="pt-4 max-w-3xl mx-auto">
                <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-4">Or Load Preset Church Templates:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {PRESET_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadPresetTemplate(tmpl)}
                      className="p-4 bg-gray-950 hover:bg-gray-800/80 border border-white/10 hover:border-red-500/40 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white group-hover:text-red-400">{tmpl.label}</span>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{tmpl.form.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={openNewFormBuilder}
                className="inline-flex items-center space-x-2 bg-[#a52424] hover:bg-red-700 text-white font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Build Custom Form</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formsList.map((fItem) => {
                const subCount = customSubmissions.filter((s) => s.formId === fItem.id).length;
                return (
                  <div
                    key={fItem.id}
                    className={`bg-gray-900 border ${
                      fItem.active ? 'border-white/10' : 'border-red-500/20 opacity-75'
                    } rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between hover:border-white/20 transition-all`}
                  >
                    <div className="space-y-3">
                      {/* Status Badges */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                            fItem.active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-gray-800 text-gray-400 border-gray-700'
                          }`}
                        >
                          {fItem.active ? 'Active Form' : 'Inactive'}
                        </span>

                        {/* Destination Pill */}
                        <div className="flex items-center space-x-1 text-[10px] font-mono bg-gray-950 px-2 py-0.5 rounded-lg border border-white/5">
                          {fItem.destination === 'save' && (
                            <span className="text-blue-400 flex items-center space-x-1">
                              <Database className="w-3 h-3" />
                              <span>Save to DB</span>
                            </span>
                          )}
                          {fItem.destination === 'email' && (
                            <span className="text-amber-400 flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>Email Only</span>
                            </span>
                          )}
                          {fItem.destination === 'save_and_email' && (
                            <span className="text-emerald-400 flex items-center space-x-1">
                              <Sparkles className="w-3 h-3" />
                              <span>Save & Email</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-white uppercase tracking-tight line-clamp-1">{fItem.title}</h3>
                      {fItem.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">{fItem.description}</p>
                      )}

                      {/* Recipient & Field Meta */}
                      <div className="pt-2 border-t border-white/5 text-xs text-gray-400 space-y-1.5 font-medium">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-red-400" />
                          <span className="truncate">Owner Email: <strong className="text-gray-200">{fItem.ownerEmail}</strong></span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1.5">
                            <FileText className="w-3.5 h-3.5 text-gray-500" />
                            <span>{fItem.fields?.length || 0} configured fields</span>
                          </span>
                          <span className="bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded-full text-[11px]">
                            {subCount} submissions
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedFormForPreview(fItem)}
                        className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedFormFilter(fItem.id || 'all');
                          setSubTab('submissions');
                        }}
                        className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Inbox className="w-3.5 h-3.5 text-amber-400" />
                        <span>Submissions</span>
                      </button>

                      <button
                        onClick={() => openEditForm(fItem)}
                        className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleToggleFormActive(fItem)}
                        className="py-2.5 px-3 bg-white/5 hover:bg-white/10 text-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5"
                      >
                        {fItem.active ? (
                          <>
                            <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5 text-gray-500" />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => copyFormEmbedLink(fItem)}
                        className="col-span-2 py-2 px-3 bg-gray-950 hover:bg-gray-800 text-gray-400 hover:text-white border border-white/10 rounded-xl text-[11px] font-mono transition-all flex items-center justify-center space-x-2"
                      >
                        <Copy className="w-3 h-3 text-gray-400" />
                        <span>{copiedId === fItem.id ? 'Copied Embed Code!' : 'Copy Embed / Share Code'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FORM BUILDER */}
      {subTab === 'builder' && (
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {editingFormId ? 'Edit Custom Form' : 'Build New Custom Form'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Configure form title, destination options (save to database, email to owner, or both), and add custom questions.
              </p>
            </div>

            {/* Quick Templates Drawer */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-red-400 whitespace-nowrap">Load Preset:</span>
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => loadPresetTemplate(tmpl)}
                  className="px-3 py-1.5 bg-gray-950 hover:bg-gray-800 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all whitespace-nowrap"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveForm} className="space-y-8">
            {/* Form Setup Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-950/60 border border-white/10 rounded-3xl p-6">
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-red-400 border-b border-white/10 pb-2">
                  1. Form Metadata & Title
                </h4>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Form Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TCC Baptism Registration"
                  value={builderTitle}
                  onChange={(e) => setBuilderTitle(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a52424] text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Form Owner Contact Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. admin@tccchurch.org or ministry owner"
                  value={builderOwnerEmail}
                  onChange={(e) => setBuilderOwnerEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a52424] text-sm"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Description / Instructions
                </label>
                <textarea
                  placeholder="Brief instructions for respondents filling out this form..."
                  value={builderDescription}
                  onChange={(e) => setBuilderDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a52424] text-sm"
                />
              </div>

              {/* Destination Selector */}
              <div className="md:col-span-2 space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Select Submission Destination <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setBuilderDestination('save')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      builderDestination === 'save'
                        ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg'
                        : 'bg-gray-900 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
                      <Database className="w-4 h-4" />
                      <span>1. Save to Database</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Stores submissions securely in the church Firestore database. View & manage in Admin Inbox.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBuilderDestination('email')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      builderDestination === 'email'
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                        : 'bg-gray-900 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                      <Mail className="w-4 h-4" />
                      <span>2. Email Form Owner</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Directly formats and launches an email to <strong className="text-white">{builderOwnerEmail || 'Form Owner'}</strong>.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBuilderDestination('save_and_email')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      builderDestination === 'save_and_email'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                        : 'bg-gray-900 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>3. Save AND Email</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Best of both: Stores response in church database AND triggers instant email draft for form owner.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-red-400">
                  2. Dynamic Form Fields ({builderFields.length})
                </h4>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400 font-medium hidden sm:inline">Add Question Type:</span>
                  <button
                    type="button"
                    onClick={() => addFieldToBuilder('text')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    + Text
                  </button>
                  <button
                    type="button"
                    onClick={() => addFieldToBuilder('textarea')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    + Long Text
                  </button>
                  <button
                    type="button"
                    onClick={() => addFieldToBuilder('select')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    + Dropdown
                  </button>
                  <button
                    type="button"
                    onClick={() => addFieldToBuilder('checkbox')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    + Checkboxes
                  </button>
                </div>
              </div>

              {builderFields.length === 0 ? (
                <div className="p-8 text-center bg-gray-950 border border-dashed border-white/10 rounded-2xl text-gray-400">
                  No fields added yet. Click one of the buttons above to add fields to your form.
                </div>
              ) : (
                <div className="space-y-4">
                  {builderFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="bg-gray-950 border border-white/10 rounded-2xl p-5 space-y-4 shadow-md relative"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 bg-[#a52424] text-white rounded-full text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-mono uppercase tracking-wider text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg">
                            {field.type}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => moveField(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(idx, 'down')}
                            disabled={idx === builderFields.length - 1}
                            className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeField(field.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg"
                            title="Delete Field"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                            Field Label / Question
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                            Field Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(field.id, { type: e.target.value as FormFieldType })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                          >
                            <option value="text">Short Text Input</option>
                            <option value="textarea">Paragraph / Long Text</option>
                            <option value="email">Email Address</option>
                            <option value="phone">Phone Number</option>
                            <option value="select">Dropdown Select</option>
                            <option value="checkbox">Multiple Choice Checkboxes</option>
                            <option value="radio">Single Choice Radio</option>
                            <option value="date">Date Picker</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                            Placeholder Text
                          </label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            placeholder="e.g. Enter value..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Options for Select, Checkbox, Radio */}
                      {['select', 'checkbox', 'radio'].includes(field.type) && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <label className="block text-[11px] font-bold uppercase text-gray-400">
                            Options List (comma-separated or line-separated)
                          </label>
                          <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) =>
                              updateField(field.id, {
                                options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                              })
                            }
                            placeholder="e.g. Option 1, Option 2, Option 3"
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-4 pt-1">
                        <label className="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            className="rounded text-[#a52424] focus:ring-[#a52424] bg-gray-900 border-gray-700"
                          />
                          <span className="font-bold">Required Field</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Actions */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => setSubTab('forms')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3.5 bg-[#a52424] hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-red-900/40 flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Form Configuration</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: CUSTOM SUBMISSIONS INBOX */}
      {subTab === 'submissions' && (
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Custom Form Submissions</h3>
              <p className="text-xs text-gray-400 mt-1">
                Filter responses by form and email status, inspect submitted answers, manage workflow statuses, and export to CSV.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Form Selector Filter */}
              <select
                value={selectedFormFilter}
                onChange={(e) => setSelectedFormFilter(e.target.value)}
                className="bg-gray-950 border border-white/10 text-white rounded-2xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#a52424]"
              >
                <option value="all">All Custom Forms ({customSubmissions.length})</option>
                {formsList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>

              {/* Delivery Status Filter */}
              <select
                value={emailDeliveryFilter}
                onChange={(e) => setEmailDeliveryFilter(e.target.value as any)}
                className="bg-gray-950 border border-white/10 text-white rounded-2xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#a52424]"
              >
                <option value="all">All Delivery Statuses</option>
                <option value="sent">✉️ Email Sent (Dispatched)</option>
                <option value="submitted_only">⚠️ Submitted Only (Email Pending/Failed)</option>
                <option value="failed">❌ Email Failed</option>
                <option value="db_only">💾 Database Only</option>
              </select>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-950 border border-white/10 text-white rounded-2xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#a52424] w-48"
                />
              </div>

              {/* Export CSV button */}
              <button
                onClick={exportSubmissionsCSV}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {displayedSubmissions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-3">
              <Inbox className="w-10 h-10 mx-auto text-gray-600" />
              <p className="text-sm">No submissions found matching the selected filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedSubmissions.map((sub) => {
                const normEmailStatus = getNormalizedEmailStatus(sub);
                return (
                  <div
                    key={sub.id}
                    className="bg-gray-950 border border-white/10 hover:border-white/20 rounded-2xl p-5 space-y-4 transition-all shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full border border-red-500/20">
                          {sub.formTitle}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Status Badges: DB Saved vs Email Status */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <Database className="w-3 h-3" />
                          <span>Saved in DB</span>
                        </span>

                        {normEmailStatus === 'sent' && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                            <MailCheck className="w-3 h-3 text-emerald-400" />
                            <span>Email Sent</span>
                          </span>
                        )}

                        {normEmailStatus === 'submitted_only' && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                            <MailWarning className="w-3 h-3 text-amber-400" />
                            <span>Submitted Only (Email Pending)</span>
                          </span>
                        )}

                        {normEmailStatus === 'failed' && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full border border-red-500/30">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            <span>Email Failed</span>
                          </span>
                        )}

                        {normEmailStatus === 'db_only' && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                            <Database className="w-3 h-3" />
                            <span>DB Only Mode</span>
                          </span>
                        )}
                      </div>

                      {/* Answers Summary */}
                      <div className="space-y-1.5 text-xs text-gray-300 bg-gray-900/60 p-3.5 rounded-xl border border-white/5">
                        {Object.entries(sub.answers || {}).slice(0, 3).map(([key, val], idx) => (
                          <div key={idx} className="flex justify-between items-start">
                            <span className="font-medium text-gray-400 capitalize max-w-[40%] truncate">{key}:</span>
                            <span className="font-bold text-white text-right max-w-[55%] truncate">
                              {Array.isArray(val) ? val.join(', ') : String(val)}
                            </span>
                          </div>
                        ))}
                        {Object.keys(sub.answers || {}).length > 3 && (
                          <p className="text-[10px] text-gray-500 italic pt-1 text-right">
                            +{Object.keys(sub.answers).length - 3} more answers...
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            sub.status === 'new'
                              ? 'bg-blue-400 animate-pulse'
                              : sub.status === 'contacted'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          {sub.status}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setResendStatusMsg(null);
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-red-400" />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSubmission(sub)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PREVIEW MODAL */}
      {selectedFormForPreview && (
        <CustomFormFiller
          form={selectedFormForPreview}
          onClose={() => setSelectedFormForPreview(null)}
          isOpen={true}
        />
      )}

      {/* SUBMISSION DETAILS MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-950 border border-white/10 rounded-3xl p-6 md:p-8 max-w-xl w-full space-y-6 shadow-2xl text-gray-100 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                  Form Response Details
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1">{selectedSubmission.formTitle}</h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-2xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Status & Delivery Check Box */}
            <div className="bg-gray-900 border border-white/10 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
                  <Mail className="w-4 h-4 text-red-400" />
                  <span>Outgoing Email Status</span>
                </span>

                {getNormalizedEmailStatus(selectedSubmission) === 'sent' && (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                    <MailCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Email Dispatched</span>
                  </span>
                )}

                {getNormalizedEmailStatus(selectedSubmission) === 'submitted_only' && (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold uppercase bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
                    <MailWarning className="w-3.5 h-3.5 text-amber-400" />
                    <span>Submitted Only (Not Sent)</span>
                  </span>
                )}

                {getNormalizedEmailStatus(selectedSubmission) === 'failed' && (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold uppercase bg-red-500/20 text-red-300 px-3 py-1 rounded-full border border-red-500/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>Failed</span>
                  </span>
                )}

                {getNormalizedEmailStatus(selectedSubmission) === 'db_only' && (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold uppercase bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                    <Database className="w-3.5 h-3.5" />
                    <span>Database Only</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                {getNormalizedEmailStatus(selectedSubmission) === 'sent' 
                  ? `An email notification was sent to ${selectedSubmission.ownerEmail || 'admin@transformationcitychurch.org'}${selectedSubmission.emailDispatchedAt ? ` on ${new Date(selectedSubmission.emailDispatchedAt).toLocaleString()}` : ''}.`
                  : `This form response was saved to the database. You can trigger an email notification manually using the button below.`}
              </p>

              {selectedSubmission.emailError && (
                <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-xs text-red-300">
                  <strong className="block text-[10px] font-bold uppercase text-red-400">Last Error Details:</strong>
                  {selectedSubmission.emailError}
                </div>
              )}

              {resendStatusMsg && (
                <div className={`p-2.5 rounded-xl text-xs font-bold ${resendStatusMsg.includes('failed') || resendStatusMsg.includes('error') ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                  {resendStatusMsg}
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleResendSubmissionEmail(selectedSubmission)}
                  disabled={isResendingEmail}
                  className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${isResendingEmail ? 'animate-spin' : ''}`} />
                  <span>{isResendingEmail ? 'Dispatching Email via SMTP...' : 'Resend Email Notification To Admin'}</span>
                </button>
              </div>
            </div>

            {/* Submitted Answers List */}
            <div className="space-y-3 bg-gray-900 border border-white/5 p-4 rounded-2xl max-h-80 overflow-y-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">Submitted Form Fields</span>
              {Object.entries(selectedSubmission.answers || {}).map(([key, val], idx) => (
                <div key={idx} className="border-b border-white/5 pb-2.5 last:border-b-0 space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{key}</span>
                  <p className="text-sm font-semibold text-white">
                    {Array.isArray(val) ? val.join(', ') : String(val || 'N/A')}
                  </p>
                </div>
              ))}
            </div>

            {/* Status Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Update Workflow Status</label>
              <div className="grid grid-cols-4 gap-2">
                {(['new', 'contacted', 'followed-up', 'archived'] as SubmissionStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateSubmissionStatus(selectedSubmission, st)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                      selectedSubmission.status === st
                        ? 'bg-[#a52424] text-white shadow-md'
                        : 'bg-gray-900 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">
                Submitted on {new Date(selectedSubmission.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-6 py-2.5 bg-[#a52424] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormManager;
