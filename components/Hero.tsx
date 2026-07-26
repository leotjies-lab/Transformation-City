
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden py-16 sm:py-20">
      {/* Background Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/id/452/1920/1080" 
          alt="Worship Background" 
          className="w-full h-full object-cover brightness-[0.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-none sm:leading-tight">
          ORDINARY PEOPLE<br/>
          <span className="text-church-red italic">EXTRAORDINARY</span> LIVES
        </h1>
        <p className="text-base sm:text-xl md:text-2xl text-gray-200 mb-8 sm:mb-10 font-light max-w-2xl mx-auto">
          Welcome to Transformation City Church. A community where your journey with God and your relationships with others are at the heart of everything we do.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a 
            href="#about" 
            className="w-full sm:w-auto px-8 py-4 bg-church-red text-white rounded-full font-bold text-base sm:text-lg hover:bg-red-700 transition-all transform hover:scale-105"
          >
            Start Your Journey
          </a>
          <a 
            href="#services" 
            className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/30 rounded-full font-bold text-base sm:text-lg hover:bg-white/20 transition-all"
          >
            Sunday Service @ 9am
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;
