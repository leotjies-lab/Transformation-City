
import React from 'react';

const Services: React.FC = () => {
  return (
    <section id="services" className="py-24 bg-[#1a1f2c] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          
          {/* Sunday Morning Info - Replicating provided image style */}
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">SUNDAY MORNING</h2>
            <div className="text-7xl md:text-8xl font-black leading-none mb-6">
              09:00 AM
            </div>
            
            <p className="text-xl text-gray-400 font-medium">
              Come early for fellowship at the Connect Café (08:20 AM).
            </p>

            <ul className="space-y-6 mt-12">
              {[
                'Worship',
                'Practical Bible Teaching',
                'Little Lights (Kids Ministry)'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#a52a2a] flex items-center justify-center mr-6 shadow-lg shadow-red-900/40">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-gray-100">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Location & Map Card */}
          <div className="bg-[#242a38] rounded-[2.5rem] p-10 md:p-14 shadow-2xl relative border border-white/5">
            <div className="mb-8">
               <svg className="w-8 h-8 text-church-red opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <h3 className="text-sm font-bold mb-4 uppercase text-[#d32f2f] tracking-[0.3em]">WHERE WE MEET</h3>
            <p className="text-4xl md:text-5xl font-black mb-6 leading-tight">Brackenhurst,<br/>Alberton</p>
            <address className="not-italic text-gray-400 mb-10 text-lg leading-relaxed max-w-xs">
              120A McBride Street,<br/>
              Brackenhurst, Alberton,<br/>
              South Africa
            </address>
            <a 
              href="https://www.google.com/maps/search/120A+McBride+Street,+Brackenhurst,+Alberton" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3 bg-[#a52a2a] text-white font-bold rounded-full hover:bg-red-700 transition-all shadow-xl shadow-red-950/30"
            >
              Get Directions
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
