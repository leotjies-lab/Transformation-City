import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CustomForm, CustomFormSubmission, FormField } from '../types';
import { 
  X, 
  Send, 
  CheckCircle2, 
  Mail, 
  Database, 
  AlertCircle, 
  Clock, 
  FileText,
  Calendar,
  CheckSquare,
  Radio,
  ChevronDown,
  Sparkles
} from 'lucide-[#lucide-icon]' ;
import { 
  X as CloseIcon, 
  Send as SendIcon, 
  CheckCircle2 as CheckIcon, 
  Mail as MailIcon, 
  Database as DbIcon, 
  AlertCircle as AlertIcon, 
  FileText as FileIcon,
  Sparkles as SparklesIcon,
  ExternalLink
} from 'lucide-react';

interface CustomFormFillerProps {
  form: CustomForm;
  onClose?: () => void;
  onSubmitted?: (submission: CustomFormSubmission) => void;
  isOpen?: boolean;
  inline?: boolean;
}

export const CustomFormFiller: React.FC<CustomFormFillerProps> = ({
  form,
  onClose,
  onSubmitted,
  isOpen = true,
  inline = false,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailTriggered, setEmailTriggered] = useState(false);
  const [mailtoUrl, setMailtoUrl] = useState<string | null>(null);

  if (!isOpen && !inline) return null;

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }
  };

  const handleCheckboxToggle = (fieldId: string, option: string) => {
    const current: string[] = Array.isArray(answers[fieldId]) ? answers[fieldId] : [];
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    handleInputChange(fieldId, updated);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    form.fields.forEach((field) => {
      const val = answers[field.id];
      if (field.required) {
        if (val === undefined || val === null || val === '') {
          newErrors[field.id] = `${field.label} is required`;
        } else if (Array.isArray(val) && val.length === 0) {
          newErrors[field.id] = `Please select at least one option`;
        }
      }

      if (val && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(val))) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildMailtoLink = () => {
    const subject = encodeURIComponent(`[TCC Form Submission] ${form.title}`);
    let bodyText = `New submission for form: ${form.title}\nSubmitted on: ${new Date().toLocaleString()}\n\n-- SUBMITTED RESPONSES --\n\n`;

    form.fields.forEach((f) => {
      const ans = answers[f.id];
      let formattedVal = 'N/A';
      if (Array.isArray(ans)) {
        formattedVal = ans.join(', ');
      } else if (ans !== undefined && ans !== null && ans !== '') {
        formattedVal = String(ans);
      }
      bodyText += `${f.label}:\n${formattedVal}\n\n`;
    });

    bodyText += `---\nSent via Transformation City Church Form Management System`;
    return `mailto:${form.ownerEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const initialEmailStatus = form.destination === 'save' ? 'db_only' : 'pending';

    const submissionData: CustomFormSubmission = {
      formId: form.id || 'local',
      formTitle: form.title || 'Untitled Form',
      ownerEmail: form.ownerEmail || '',
      destination: form.destination || 'save',
      answers: answers || {},
      status: 'new',
      emailDeliveryStatus: initialEmailStatus,
      createdAt: new Date().toISOString(),
    };

    const sanitizedSubmission = JSON.parse(JSON.stringify(submissionData));

    const url = buildMailtoLink();
    setMailtoUrl(url);

    try {
      let createdDocId: string | null = null;
      // 1. Save to Database if destination includes 'save' or 'save_and_email'
      if (form.destination === 'save' || form.destination === 'save_and_email' || !form.destination) {
        try {
          const docRef = await addDoc(collection(db, 'custom_submissions'), sanitizedSubmission);
          submissionData.id = docRef.id;
          createdDocId = docRef.id;
        } catch (dbErr) {
          console.warn('Firestore write warning (falling back to local state):', dbErr);
        }
      }

      // 2. Dispatch submission to backend API to email the form administrator
      const readableAnswers: Record<string, any> = {};
      form.fields.forEach((field) => {
        const val = answers[field.id];
        const label = field.label || field.id;
        if (Array.isArray(val)) {
          readableAnswers[label] = val.join(', ');
        } else {
          readableAnswers[label] = val !== undefined && val !== null ? String(val) : '';
        }
      });

      if (form.destination === 'email' || form.destination === 'save_and_email') {
        try {
          const res = await fetch('/api/submit-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              formId: form.id,
              formTitle: form.title || 'Form Submission',
              ownerEmail: form.ownerEmail || 'leonandalouw@outlook.com',
              destination: form.destination,
              answers: readableAnswers,
              createdAt: submissionData.createdAt,
            }),
          });
          const resData = await res.json();
          if (res.ok && resData.success) {
            setEmailTriggered(true);
            if (createdDocId) {
              await updateDoc(doc(db, 'custom_submissions', createdDocId), {
                emailDeliveryStatus: 'sent',
                emailDispatchedAt: new Date().toISOString(),
                emailMessageId: resData.messageId || null
              }).catch(() => {});
            }
          } else {
            if (createdDocId) {
              await updateDoc(doc(db, 'custom_submissions', createdDocId), {
                emailDeliveryStatus: 'failed',
                emailError: resData.error || 'Email dispatch endpoint returned failure'
              }).catch(() => {});
            }
          }
        } catch (apiErr: any) {
          console.warn('Backend email dispatch error:', apiErr);
          if (createdDocId) {
            await updateDoc(doc(db, 'custom_submissions', createdDocId), {
              emailDeliveryStatus: 'failed',
              emailError: apiErr.message || 'Network dispatch error'
            }).catch(() => {});
          }
        }
      }

      setSubmitted(true);
      if (onSubmitted) {
        onSubmitted(submissionData);
      }
    } catch (err) {
      console.error('Error submitting custom form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldInput = (field: FormField) => {
    const value = answers[field.id] || '';
    const hasError = !!errors[field.id];

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'Enter details...'}
            rows={4}
            className={`w-full bg-gray-900 border ${
              hasError ? 'border-red-500' : 'border-gray-700'
            } rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a52424] transition-all`}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full bg-gray-900 border ${
              hasError ? 'border-red-500' : 'border-gray-700'
            } rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#a52424] transition-all`}
          >
            <option value="" className="bg-gray-900 text-white font-medium">
              {field.placeholder || '-- Select an option --'}
            </option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt} className="bg-gray-900 text-white font-medium">
                {opt}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        const selectedCheckboxes: string[] = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2 mt-1">
            {field.options?.map((opt, idx) => (
              <label
                key={idx}
                className="flex items-center space-x-3 p-3 bg-gray-900/60 border border-gray-800 rounded-xl hover:bg-gray-800/80 cursor-pointer transition-all"
              >
                <input
                  type="checkbox"
                  checked={selectedCheckboxes.includes(opt)}
                  onChange={() => handleCheckboxToggle(field.id, opt)}
                  className="w-4 h-4 rounded text-[#a52424] focus:ring-[#a52424] bg-gray-950 border-gray-700"
                />
                <span className="text-sm text-gray-200">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2 mt-1">
            {field.options?.map((opt, idx) => (
              <label
                key={idx}
                className="flex items-center space-x-3 p-3 bg-gray-900/60 border border-gray-800 rounded-xl hover:bg-gray-800/80 cursor-pointer transition-all"
              >
                <input
                  type="radio"
                  name={field.id}
                  checked={value === opt}
                  onChange={() => handleInputChange(field.id, opt)}
                  className="w-4 h-4 text-[#a52424] focus:ring-[#a52424] bg-gray-950 border-gray-700"
                />
                <span className="text-sm text-gray-200">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full bg-gray-900 border ${
              hasError ? 'border-red-500' : 'border-gray-700'
            } rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#a52424] transition-all`}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'e.g. name@example.com'}
            className={`w-full bg-gray-900 border ${
              hasError ? 'border-red-500' : 'border-gray-700'
            } rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a52424] transition-all`}
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'e.g. +27 82 123 4567'}
            className={`w-full bg-gray-900 border ${
              hasError ? 'border-red-500' : 'border-gray-700'
            } rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a52424] transition-all`}
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || 'Your answer'}
            className={`w-full bg-gray-900 border ${
              hasError ? 'border-red-500' : 'border-gray-700'
            } rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#a52424] transition-all`}
          />
        );
    }
  };

  const formContent = (
    <div className="bg-gray-950 border border-white/10 text-gray-100 rounded-3xl p-6 md:p-8 max-w-2xl w-full mx-auto shadow-2xl relative overflow-hidden">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="bg-[#a52424]/20 text-red-400 border border-[#a52424]/30 text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold">
              Transformation City Church Form
            </span>
            {form.destination === 'save' && (
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium inline-flex items-center space-x-1">
                <DbIcon className="w-3 h-3" />
                <span>Saved to Database</span>
              </span>
            )}
            {form.destination === 'email' && (
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium inline-flex items-center space-x-1">
                <MailIcon className="w-3 h-3" />
                <span>Emailed to Form Owner</span>
              </span>
            )}
            {form.destination === 'save_and_email' && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium inline-flex items-center space-x-1">
                <SparklesIcon className="w-3 h-3" />
                <span>Database & Email</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">{form.title}</h2>
          {form.description && (
            <p className="text-sm text-gray-400 mt-1">{form.description}</p>
          )}
        </div>

        {onClose && !inline && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
            aria-label="Close form"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {submitted ? (
        <div className="py-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
            <CheckIcon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              Submission Received!
            </h3>
            <p className="text-sm text-gray-300 max-w-md mx-auto">
              Thank you for completing <span className="text-white font-bold">{form.title}</span>. Your details have been successfully processed.
            </p>
          </div>

          {(form.destination === 'email' || form.destination === 'save_and_email') && mailtoUrl && (
            <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-4 max-w-md mx-auto space-y-3 text-left">
              <div className="flex items-start space-x-3 text-amber-400">
                <MailIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold uppercase tracking-wider text-amber-300">
                    Destination: {form.ownerEmail}
                  </p>
                  <p className="text-gray-300">
                    This form is configured to notify the form owner. If your email client did not launch automatically, click below:
                  </p>
                </div>
              </div>

              <a
                href={mailtoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Email Draft for Form Owner</span>
              </a>
            </div>
          )}

          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setAnswers({});
              }}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Submit Another Response
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-[#a52424] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md"
              >
                Close
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destination Notification Box */}
          <div className="bg-gray-900/80 border border-white/5 rounded-2xl p-3.5 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-2">
              <MailIcon className="w-4 h-4 text-red-400" />
              <span>
                Form Owner Recipient: <strong className="text-gray-200">{form.ownerEmail}</strong>
              </span>
            </div>
            <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-gray-400 uppercase">
              {form.destination.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {form.fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  {field.label}{' '}
                  {field.required ? (
                    <span className="text-red-400 ml-0.5">*</span>
                  ) : (
                    <span className="text-gray-500 font-normal lowercase">(optional)</span>
                  )}
                </label>

                {field.helpText && (
                  <p className="text-xs text-gray-400 italic mb-1">{field.helpText}</p>
                )}

                {renderFieldInput(field)}

                {errors[field.id] && (
                  <p className="text-xs text-red-400 flex items-center space-x-1 mt-1 font-medium">
                    <AlertIcon className="w-3.5 h-3.5" />
                    <span>{errors[field.id]}</span>
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
            {onClose && !inline && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-8 py-3.5 bg-[#a52424] hover:bg-red-700 text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-red-900/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <SendIcon className="w-4 h-4" />
                  <span>Submit Form</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (inline) {
    return formContent;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {formContent}
    </div>
  );
};

export default CustomFormFiller;
