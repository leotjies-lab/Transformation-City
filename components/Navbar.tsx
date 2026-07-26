
import React, { useState, useEffect } from 'react';
import { NAV_ITEMS } from '../constants';

interface NavbarProps {
  onNavigate: (path: string) => void;
  currentView: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20 || currentView !== 'home');
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // If it's a direct page link or we need to switch view to home for a hash
    if (href.startsWith('/') || href.includes('#')) {
      e.preventDefault();
      onNavigate(href);
      setIsOpen(false);
    }
  };

  const isScrolled = scrolled || currentView !== 'home';

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => onNavigate('/')}
            className="flex items-center space-x-3 group"
          >
            <div className="bg-[#d32f2f] w-12 h-12 rounded-lg flex items-center justify-center font-black text-white text-xl shadow-lg group-hover:scale-105 transition-transform">
              TCC
            </div>
            <div className={`leading-none text-left font-black transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
              TRANSFORMATION<br/>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">City Church</span>
            </div>
          </button>

          <div className="hidden md:flex items-center space-x-8">
            {NAV_ITEMS.map((item) => (
              <a 
                key={item.label}
                href={item.href}
                onClick={(e) => handleLinkClick(e, item.href)}
                className={`font-bold text-sm uppercase tracking-widest transition-colors hover:text-[#d32f2f] ${
                  isScrolled ? 'text-gray-700' : 'text-white'
                } ${item.href.includes(currentView) && currentView !== 'home' ? 'text-[#d32f2f]' : ''}`}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/admin"
              onClick={(e) => handleLinkClick(e, '/admin')}
              className="bg-[#d32f2f] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-all shadow-md"
            >
              Admin
            </a>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`${isScrolled ? 'text-gray-900' : 'text-white'}`}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`md:hidden bg-white transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-screen py-4' : 'max-h-0'}`}>
        <div className="px-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleLinkClick(e, item.href)}
              className={`block px-4 py-3 text-gray-700 hover:text-[#d32f2f] font-black uppercase tracking-widest text-sm border-b border-gray-50 ${
                item.href.includes(currentView) && currentView !== 'home' ? 'text-[#d32f2f]' : ''
              }`}
            >
              {item.label}
            </a>
          ))}
          <a
            href="/admin"
            onClick={(e) => handleLinkClick(e, '/admin')}
            className="block px-4 py-3 text-[#d32f2f] hover:text-red-700 font-black uppercase tracking-widest text-sm"
          >
            TCC Admin Portal
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
