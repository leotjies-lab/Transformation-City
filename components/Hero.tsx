
import React from 'react';

const heroBg = 'https://picsum.photos/id/452/1920/1080';

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden py-16 sm:py-20 bg-gray-950">
      {/* Background Overlay with Worship Atmosphere */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Worship Background" 
          className="w-full h-full object-cover brightness-[0.35] contrast-[1.05]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/40 to-gray-950/80"></div>
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight sm:leading-none">
          <span className="font-hero-light font-light tracking-[0.12em] sm:tracking-[0.18em] uppercase text-2xl sm:text-4xl md:text-5xl lg:text-6xl block text-gray-100">
            Ordinary People
          </span>
          <span className="font-hero-brush text-church-red font-bold normal-case text-5xl sm:text-7xl md:text-8xl lg:text-9xl block my-1 sm:my-2 tracking-wide transform -rotate-1 drop-shadow-lg">
            Extraordinary
          </span>
          <span className="font-hero-light font-light tracking-[0.12em] sm:tracking-[0.18em] uppercase text-2xl sm:text-4xl md:text-5xl lg:text-6xl block text-gray-100">
            Lives
          </span>
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

