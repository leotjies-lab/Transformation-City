
import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, Loader2, ChevronDown, Check, X, Sparkles } from 'lucide-react';
import { safeFetchJson } from '../utils/apiHelper';

const INTERESTED_OPTIONS = [
  'Join Our Family',
  'Impact Life Journey',
  'Connect Group',
  'Transformation Life'
];

const NextSteps: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interestedIn, setInterestedIn] = useState<string[]>(['Join Our Family']);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const steps = [
    { id: 1, title: 'Join Our Family', desc: 'Experience the wonder to belong in a loving multicultural family.' },
    { id: 2, title: 'Experience the Impact Life Journey', desc: 'Learn what it means to follow Christ in your world.' },
    { id: 3, title: 'Be Part of a Connect Group', desc: 'Engage in supportive, life-changing relationships.' },
    { id: 4, title: 'Live a Transformation Life', desc: "Reflecting God's glory in your world." },
  ];

  const toggleOption = (opt: string) => {
    if (interestedIn.includes(opt)) {
      if (interestedIn.length > 1) {
        setInterestedIn(interestedIn.filter((item) => item !== opt));
      }
    } else {
      setInterestedIn([...interestedIn, opt]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMsg('Please fill in your first name, last name, and email.');
      return;
    }

    if (interestedIn.length === 0) {
      setErrorMsg('Please select at least one option from "Interested In".');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const trimmedMessage = message.trim();
      const interestedInStr = interestedIn.join(', ');

      const submissionPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        interestedIn: interestedInStr,
        message: trimmedMessage,
        userMessage: trimmedMessage,
        comments: trimmedMessage,
        request: trimmedMessage,
        status: 'new',
        emailDeliveryStatus: 'pending',
        createdAt: new Date().toISOString(),
      };

      // 1. Save to submissions collection
      const docRef = await addDoc(collection(db, 'submissions'), submissionPayload);

      // 2. Dispatch to backend API to email church administrators
      try {
        const payload = {
          formTitle: 'Start The Journey - Connection Card',
          ownerEmail: 'admin@transformationcitychurch.org',
          destination: 'save_and_email',
          recipients: ['admin@transformationcitychurch.org', 'leonandalouw@outlook.com'],
          answers: {
            'First Name': firstName.trim(),
            'Last Name': lastName.trim(),
            'Email Address': email.trim().toLowerCase(),
            'Phone Number': phone.trim() || 'Not provided',
            'Interested In': interestedInStr,
            'Message / Notes': trimmedMessage || 'None'
          },
          createdAt: submissionPayload.createdAt,
        };

        // Try native PHP mailer first for Hostinger hosting, then API endpoint
        let res = await safeFetchJson('/submit-form.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          res = await safeFetchJson('/api/submit-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }

        if (res.ok && res.data?.success) {
          const sentUpdate = {
            emailDeliveryStatus: 'sent',
            emailDispatchedAt: new Date().toISOString(),
            emailMessageId: res.data.messageId || 'php-socket-dispatch',
            emailError: null
          };
          await updateDoc(doc(db, 'submissions', docRef.id), sentUpdate).catch(() => {});
        } else {
          const failUpdate = {
            emailDeliveryStatus: 'failed',
            emailError: res.error || res.data?.error || 'Hostinger SMTP dispatch issue'
          };
          await updateDoc(doc(db, 'submissions', docRef.id), failUpdate).catch(() => {});
        }
      } catch (apiErr: any) {
        console.warn('Backend email dispatch warning:', apiErr);
        const failUpdate = {
          emailDeliveryStatus: 'failed',
          emailError: apiErr.message || 'Network dispatch error'
        };
        await updateDoc(doc(db, 'submissions', docRef.id), failUpdate).catch(() => {});
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Error adding submission to database:', err);
      setIsSubmitting(false);
      setErrorMsg('Unable to save your request right now. Please try again.');
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setInterestedIn(['Join Our Family']);
    setIsDropdownOpen(false);
    setMessage('');
    setIsSubmitted(false);
    setErrorMsg('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <section id="the-journey" className="py-24 bg-[#181e29] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-red-400 uppercase mb-2">Your next step</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              The Journey
            </h3>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Whether you are just starting or already matured in your relationship with Christ, we invite you to join us in this wonderful, life changing journey. 
            </p>

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-gray-300 italic text-base text-center">
              "Connecting with our community is the best way to discover your gifts and experience real life transformation together."
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
            {/* The Red Card Container */}
            <div className="bg-[#a52424] text-white p-8 md:p-10 rounded-3xl relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              
              <ul className="space-y-5 mb-8 relative z-10">
                {steps.map((step) => (
                  <li key={step.id} className="flex items-start space-x-4 group">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm group-hover:bg-white group-hover:text-[#a52424] transition-all duration-300">
                      {step.id}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-base md:text-lg leading-snug">{step.title}</h4>
                      <p className="text-white/80 text-sm mt-0.5">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-white text-church-red py-3.5 px-6 rounded-2xl font-black text-base md:text-lg hover:bg-gray-100 transition-all transform hover:scale-[1.01] shadow-lg uppercase tracking-wider relative z-10"
              >
                Join us on the journey
              </button>
            </div>
            <div className="absolute -bottom-0 -right-0 w-full h-full border-2 border-church-red rounded-3xl opacity-20 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Detail Modal & Sign-up Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto p-4 sm:p-6 md:p-8 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col relative shadow-2xl overflow-hidden my-auto border border-gray-100">
            <button 
              onClick={handleCloseModal}
              className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20 text-gray-400 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full shadow-sm"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="p-6 sm:p-8 md:p-10 overflow-y-auto custom-modal-scroll overscroll-contain">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter">
                    Welcome to the Family!
                  </h3>
                  <p className="text-gray-600 text-base sm:text-lg mb-8 max-w-md mx-auto">
                    Thank you, <span className="font-bold text-gray-900">{firstName}</span>! Your request has been saved and sent directly to the TCC team. Someone will be in touch with you shortly.
                  </p>
                  <button
                    onClick={handleCloseModal}
                    className="bg-[#a52424] text-white px-8 py-3.5 rounded-2xl font-black text-base sm:text-lg hover:bg-red-700 transition-all shadow-lg uppercase tracking-wider"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="pr-10">
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Start The Journey</h3>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
                      Tell us a little about yourself and which step of the journey you're interested in taking. We'd love to connect and welcome you to the family!
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-900 mb-1.5 uppercase tracking-wide">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-100 border border-gray-200 dark:border-gray-300 rounded-2xl text-gray-900 dark:text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#a52424] focus:bg-white focus:border-transparent outline-none transition-all text-sm sm:text-base font-semibold shadow-sm" 
                          placeholder="John" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-900 mb-1.5 uppercase tracking-wide">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-100 border border-gray-200 dark:border-gray-300 rounded-2xl text-gray-900 dark:text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#a52424] focus:bg-white focus:border-transparent outline-none transition-all text-sm sm:text-base font-semibold shadow-sm" 
                          placeholder="Doe" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-900 mb-1.5 uppercase tracking-wide">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-100 border border-gray-200 dark:border-gray-300 rounded-2xl text-gray-900 dark:text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#a52424] focus:bg-white focus:border-transparent outline-none transition-all text-sm sm:text-base font-semibold shadow-sm" 
                          placeholder="john@example.com" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-900 mb-1.5 uppercase tracking-wide">
                          Phone Number
                        </label>
                        <input 
                          type="tel" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-100 border border-gray-200 dark:border-gray-300 rounded-2xl text-gray-900 dark:text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#a52424] focus:bg-white focus:border-transparent outline-none transition-all text-sm sm:text-base font-semibold shadow-sm" 
                          placeholder="+27 82 123 4567" 
                        />
                      </div>
                    </div>

                    {/* Interested In Multi-Select Dropdown Menu */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-900 uppercase tracking-wide">
                          Interested In <span className="text-red-500">*</span>
                        </label>
                      </div>

                      {/* Dropdown Header Trigger Box */}
                      <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full min-h-[50px] px-4 py-2.5 bg-gray-50 dark:bg-gray-100 border border-gray-200 dark:border-gray-300 rounded-2xl text-gray-900 dark:text-gray-900 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:border-[#a52424]"
                      >
                        <div className="flex flex-wrap gap-1.5 items-center pr-2">
                          {interestedIn.length === 0 ? (
                            <span className="text-gray-400 text-sm font-medium">Select steps from dropdown...</span>
                          ) : (
                            interestedIn.map((item) => (
                              <span
                                key={item}
                                className="inline-flex items-center space-x-1.5 bg-red-100 text-[#a52424] font-bold text-xs px-2.5 py-1 rounded-xl border border-red-200"
                              >
                                <span>{item}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOption(item);
                                  }}
                                  className="hover:text-red-900 p-0.5 rounded-full"
                                  title="Remove selection"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 text-gray-600 flex-shrink-0 ml-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Select</span>
                          <ChevronDown className={`w-5 h-5 text-gray-700 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#a52424]' : ''}`} />
                        </div>
                      </div>

                      {/* Dropdown Options List */}
                      {isDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-64 overflow-y-auto custom-modal-scroll">
                          <div className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-100 mb-1 flex justify-between items-center">
                            <span>Available Steps</span>
                            <span className="text-red-700 font-bold">{interestedIn.length} Selected</span>
                          </div>
                          {INTERESTED_OPTIONS.map((option) => {
                            const isSelected = interestedIn.includes(option);
                            return (
                              <div
                                key={option}
                                onClick={() => toggleOption(option)}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-red-50 text-[#a52424] border border-red-200 shadow-sm'
                                    : 'text-gray-900 hover:bg-gray-100'
                                }`}
                              >
                                <span className="flex items-center space-x-3">
                                  <span className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                    isSelected ? 'bg-[#a52424] border-[#a52424] text-white' : 'border-gray-400 bg-white'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </span>
                                  <span className="text-gray-900">{option}</span>
                                </span>
                                {isSelected && <span className="text-xs font-black text-[#a52424]">Selected</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-900 mb-1.5 uppercase tracking-wide">Any Message?</label>
                      <textarea 
                        rows={3} 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-100 border border-gray-200 dark:border-gray-300 rounded-2xl text-gray-900 dark:text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#a52424] focus:bg-white focus:border-transparent outline-none transition-all text-sm sm:text-base font-medium shadow-sm" 
                        placeholder="I'd love to know more about..."
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#a52424] text-white py-4 rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest flex items-center justify-center space-x-2 disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Saving to TCC System...</span>
                        </>
                      ) : (
                        <span>Send Journey Request</span>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default NextSteps;

