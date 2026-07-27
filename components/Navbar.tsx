
import React, { useState, useEffect } from 'react';
import { NAV_ITEMS } from '../constants';
import TCCLogo from './TCCLogo';

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
        isScrolled ? 'bg-white shadow-md py-2.5' : 'bg-gray-950/80 backdrop-blur-md py-3.5 border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center min-w-0 gap-4">
          {/* Logo Button */}
          <button 
            onClick={() => onNavigate('/')}
            className="flex-shrink-0 text-left focus:outline-none"
            aria-label="Transformation City Church Home"
          >
            <TCCLogo variant={isScrolled ? 'light' : 'dark'} className="h-10 sm:h-12" />
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-3 xl:space-x-6 flex-shrink-0">
            {NAV_ITEMS.map((item) => (
              <a 
                key={item.label}
                href={item.href}
                onClick={(e) => handleLinkClick(e, item.href)}
                className={`font-black text-xs xl:text-sm uppercase tracking-wider transition-colors whitespace-nowrap hover:text-[#d32f2f] px-1 py-1 ${
                  isScrolled ? 'text-gray-800' : 'text-gray-100'
                } ${item.href.includes(currentView) && currentView !== 'home' ? 'text-[#d32f2f]' : ''}`}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/admin"
              onClick={(e) => handleLinkClick(e, '/admin')}
              className="bg-[#d32f2f] text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-all shadow-md whitespace-nowrap flex-shrink-0"
            >
              Admin
            </a>
          </div>

          {/* Mobile / Tablet Hamburger Toggle */}
          <div className="lg:hidden flex items-center flex-shrink-0">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-xl focus:outline-none ${isScrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
              aria-label="Toggle navigation menu"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`lg:hidden bg-white shadow-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-screen border-t border-gray-100 py-4' : 'max-h-0'}`}>
        <div className="px-5 space-y-2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleLinkClick(e, item.href)}
              className={`block px-4 py-3 text-gray-800 hover:text-[#d32f2f] font-black uppercase tracking-wider text-sm border-b border-gray-100 transition-colors ${
                item.href.includes(currentView) && currentView !== 'home' ? 'text-[#d32f2f]' : ''
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2">
            <a
              href="/admin"
              onClick={(e) => handleLinkClick(e, '/admin')}
              className="block w-full text-center bg-[#d32f2f] text-white py-3 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-red-700 transition-all shadow-md"
            >
              TCC Admin Portal
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
