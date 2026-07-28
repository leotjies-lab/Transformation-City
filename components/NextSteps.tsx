
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, Loader2 } from 'lucide-react';

const NextSteps: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interestedIn, setInterestedIn] = useState('Join Our Family');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const steps = [
    { id: 1, title: 'Join Our Family', desc: 'Find a place where you truly belong.' },
    { id: 2, title: 'Experience the Impact Life Journey', desc: 'Learn what it means to follow Christ in your world.' },
    { id: 3, title: 'Be Part of a Connect Group', desc: 'Engage in supportive, life-changing relationships.' },
    { id: 4, title: 'Live a Transformation Life', desc: "Reflecting God's glory in your world." },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMsg('Please fill in your first name, last name, and email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const trimmedMessage = message.trim();
      await addDoc(collection(db, 'submissions'), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        interestedIn,
        message: trimmedMessage,
        userMessage: trimmedMessage,
        comments: trimmedMessage,
        request: trimmedMessage,
        status: 'new',
        createdAt: new Date().toISOString(),
      });

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
    setInterestedIn('Join Our Family');
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
            <h2 className="text-sm font-bold tracking-widest text-red-400 uppercase mb-2">Our Pathway</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              The Journey
            </h3>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Whether you are just starting or already matured in your relationship with Christ, we invite you to join us in this wonderful, life changing journey. 
            </p>

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-gray-300 italic text-base">
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
                className="w-full bg-white text-[#a52424] py-3.5 px-6 rounded-2xl font-black text-base md:text-lg hover:bg-gray-100 transition-all transform hover:scale-[1.01] shadow-lg uppercase tracking-wider relative z-10"
              >
                I'm New Here
              </button>
            </div>
            <div className="absolute -bottom-0 -right-0 w-full h-full border-2 border-[#a52424] rounded-3xl opacity-20 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Detail Modal & Sign-up Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button 
              onClick={handleCloseModal}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="p-8 md:p-12">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter">
                    Welcome to the Family!
                  </h3>
                  <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                    Thank you, <span className="font-bold text-gray-900">{firstName}</span>! Your request has been saved and sent directly to the TCC team. Someone will be in touch with you shortly.
                  </p>
                  <button
                    onClick={handleCloseModal}
                    className="bg-[#a52424] text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-lg uppercase tracking-wider"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Start The Journey</h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    Tell us a little about yourself and which step of the journey you're interested in taking. We'd love to connect and welcome you to the family!
                  </p>

                  {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#a52424] focus:border-transparent outline-none transition-all" 
                          placeholder="John" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#a52424] focus:border-transparent outline-none transition-all" 
                          placeholder="Doe" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#a52424] focus:border-transparent outline-none transition-all" 
                          placeholder="john@example.com" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Phone Number
                        </label>
                        <input 
                          type="tel" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#a52424] focus:border-transparent outline-none transition-all" 
                          placeholder="+27 82 123 4567" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Interested In</label>
                      <select 
                        value={interestedIn}
                        onChange={(e) => setInterestedIn(e.target.value)}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#a52424] focus:border-transparent outline-none transition-all appearance-none"
                      >
                        <option value="Join Our Family">Join Our Family</option>
                        <option value="Impact Life Journey">Impact Life Journey</option>
                        <option value="Connect Groups">Connect Groups</option>
                        <option value="Service Opportunities">Service Opportunities</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Any Message?</label>
                      <textarea 
                        rows={4} 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#a52424] focus:border-transparent outline-none transition-all" 
                        placeholder="I'd love to know more about..."
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#a52424] text-white py-5 rounded-2xl font-black text-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest flex items-center justify-center space-x-2 disabled:opacity-60"
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

