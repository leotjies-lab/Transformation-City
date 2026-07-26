
import React, { useState } from 'react';

const NextSteps: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const steps = [
    { id: 1, title: 'Join Our Family', desc: 'Find a place where you truly belong.' },
    { id: 2, title: 'Experience the Impact Life Journey', desc: 'Learn what it means to follow Christ in your world.' },
    { id: 3, title: 'Be Part of a Connect Group', desc: 'Engage in supportive, life-changing relationships.' },
    { id: 4, title: 'Live a Transformation Life', desc: "Reflecting God's glory in your world." },
  ];

  return (
    <section id="the-journey" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="text-left">
            <h2 className="text-5xl md:text-6xl font-[900] text-[#0f172a] mb-8 uppercase tracking-tighter">
              The Journey
            </h2>
            <div className="space-y-6">
              <p className="text-xl text-gray-500 leading-relaxed font-medium">
                Whether you are just starting or already matured in your relationship with Christ and looking for a place to call home, we invite you to join us in this wonderful, life changing journey. 
              </p>
              <p className="text-xl text-gray-500 leading-relaxed font-medium">
                We invite you to join us as we follow Christ, aligning our thoughts and will with His.</p>
            </div>
          </div>

          <div className="relative">
            {/* The Red Card Container */}
            <div className="bg-[#a52424] p-10 md:p-14 rounded-[3.5rem] text-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative overflow-hidden">
              {/* Decorative abstract circle as seen in image */}
              <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-white/5 rounded-full pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              
              <h3 className="text-4xl font-black mb-12 uppercase tracking-tighter text-white">The Journey</h3>
              
              <ul className="space-y-10 mb-14 relative z-10">
                {steps.map((step) => (
                  <li key={step.id} className="flex items-start space-x-6 group">
                    <span className="flex-shrink-0 w-11 h-11 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg group-hover:bg-white group-hover:text-[#a52424] transition-all duration-300">
                      {step.id}
                    </span>
                    <div>
                      <h4 className="text-2xl font-black leading-tight tracking-tight">{step.title}</h4>
                      <p className="text-white/80 text-base mt-1.5 font-medium">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-white text-[#a52424] py-6 rounded-[1.5rem] font-black text-xl hover:bg-gray-100 transition-all transform hover:scale-[1.02] shadow-xl uppercase tracking-widest relative z-10"
              >
                I'm New Here
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal & Sign-up Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div className="p-8 md:p-12">
              <h3 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Start The Journey</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Tell us a little about yourself and which step of the journey you're interested in taking. We'd love to connect and welcome you to the family!
              </p>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">First Name</label>
                    <input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-church-red focus:border-transparent outline-none transition-all" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Last Name</label>
                    <input type="text" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-church-red focus:border-transparent outline-none transition-all" placeholder="Doe" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Email Address</label>
                  <input type="email" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-church-red focus:border-transparent outline-none transition-all" placeholder="john@example.com" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Interested In</label>
                  <select className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-church-red focus:border-transparent outline-none transition-all appearance-none">
                    <option>Join Our Family</option>
                    <option>Impact Life Journey</option>
                    <option>Connect Groups</option>
                    <option>Service Opportunities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Any Message?</label>
                  <textarea rows={4} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-church-red focus:border-transparent outline-none transition-all" placeholder="I'd love to know more about..."></textarea>
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    alert('Thank you! Someone from TCC will reach out to you shortly.');
                    setIsModalOpen(false);
                  }}
                  className="w-full bg-church-red text-white py-5 rounded-2xl font-black text-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest"
                >
                  Send Journey Request
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default NextSteps;
