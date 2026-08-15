
import React from 'react';

const Services: React.FC = () => {
  return (
    <section id="services" className="py-24 bg-[#a52424] text-white relative overflow-hidden">
      {/* Decorative abstract circles */}
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full pointer-events-none"></div>
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-white/5 rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Sunday Morning Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase text-white/80 mb-2">
                SUNDAY MORNING
              </h2>
              <div className="text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-black leading-none text-white whitespace-nowrap tracking-tight">
                09:00 AM
              </div>
            </div>

            <ul className="space-y-5">
              {[
                'Christ focus worship',
                'Practical Bible teaching',
                'Little Lights (kids ministry)'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mr-5 shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-lg sm:text-xl text-white/90 font-medium leading-relaxed pt-2 justify-center">
              Don't run off too quickly! We’d love to catch up over coffee right after the morning service.
            </p>
          </div>

          {/* Location & Map Card - Styled with dark theme from screenshot 1 */}
          <div className="bg-[#181e29] rounded-[2.5rem] p-8 sm:p-10 md:p-12 shadow-2xl relative border border-white/10 flex flex-col items-center text-center overflow-hidden">
            {/* Subtle decorative glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#d32f2f]/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex items-center justify-center space-x-3 mb-6 relative z-10">
              <svg className="w-6 h-6 text-[#d32f2f] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <h3 className="text-sm font-bold uppercase text-[#d32f2f] tracking-[0.3em]">WHERE WE MEET</h3>
            </div>
            
            <p className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight text-white relative z-10">Brackenhurst, Alberton</p>
            <address className="not-italic text-gray-300 mb-6 text-base sm:text-lg leading-relaxed max-w-sm mx-auto relative z-10">
              120A McBride Street, Brackenhurst, Alberton, South Africa
            </address>

            <div className="w-full max-w-sm mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-sm text-gray-300 flex flex-col items-center font-medium relative z-10">
              <p className="flex items-center space-x-2">
                <span className="text-[#d32f2f] font-bold">Email:</span>
                <a href="mailto:tcc.bracken@gmail.com" className="hover:text-white transition-colors">tcc.bracken@gmail.com</a>
              </p>
              <p className="flex items-center space-x-2">
                <span className="text-[#d32f2f] font-bold">Phone:</span>
                <a href="tel:0825580141" className="hover:text-white transition-colors font-bold">082 558 0141</a>
              </p>
            </div>

            <a 
              href="https://www.google.com/maps/search/120A+McBride+Street,+Brackenhurst,+Alberton" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3.5 bg-[#a52424] hover:bg-red-700 text-white font-black rounded-full transition-all shadow-xl shadow-red-950/50 uppercase tracking-wider text-sm relative z-10"
            >
              Get Directions
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Services;

