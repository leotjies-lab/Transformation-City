
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
            {NAV_ITEMS.map((item) => {
              if (item.subItems && item.subItems.length > 0) {
                return (
                  <div key={item.label} className="relative group">
                    <a
                      href={item.href}
                      onClick={(e) => handleLinkClick(e, item.href)}
                      className={`font-black text-xs xl:text-sm uppercase tracking-wider transition-colors whitespace-nowrap hover:text-[#d32f2f] px-1 py-1 flex items-center space-x-1 ${
                        isScrolled ? 'text-gray-800' : 'text-gray-100'
                      } ${item.href.includes(currentView) && currentView !== 'home' ? 'text-[#d32f2f]' : ''}`}
                    >
                      <span>{item.label}</span>
                      <svg className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </a>

                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-gray-900 border border-white/10 rounded-2xl p-2 shadow-2xl min-w-[180px] space-y-1">
                        {item.subItems.map((sub) => (
                          <a
                            key={sub.label}
                            href={sub.href}
                            onClick={(e) => handleLinkClick(e, sub.href)}
                            className="block px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-200 hover:text-white hover:bg-red-600/30 rounded-xl transition-all"
                          >
                            {sub.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              const isJoinUs = item.label.toLowerCase() === 'join us';
              return (
                <a 
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  className={`font-black text-xs xl:text-sm uppercase tracking-wider transition-colors whitespace-nowrap px-1 py-1 ${
                    isJoinUs
                      ? isScrolled 
                        ? 'text-[#a52424] hover:text-[#801b1b]' 
                        : 'text-red-400 hover:text-red-300'
                      : isScrolled 
                        ? 'text-gray-800 hover:text-[#d32f2f]' 
                        : 'text-gray-100 hover:text-[#d32f2f]'
                  } ${!isJoinUs && item.href.includes(currentView) && currentView !== 'home' ? 'text-[#d32f2f]' : ''}`}
                >
                  {item.label}
                </a>
              );
            })}
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
          {NAV_ITEMS.map((item) => {
            const isJoinUs = item.label.toLowerCase() === 'join us';
            return (
              <div key={item.label} className="border-b border-gray-100 last:border-b-0 pb-2">
                <a
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  className={`block px-4 py-2.5 font-black uppercase tracking-wider text-sm transition-colors ${
                    isJoinUs 
                      ? 'text-[#a52424] hover:text-[#801b1b]' 
                      : 'text-gray-800 hover:text-[#d32f2f]'
                  } ${!isJoinUs && item.href.includes(currentView) && currentView !== 'home' ? 'text-[#d32f2f]' : ''}`}
                >
                  {item.label}
                </a>
                {item.subItems && item.subItems.length > 0 && (
                  <div className="pl-6 space-y-1 my-1">
                    {item.subItems.map((sub) => (
                      <a
                        key={sub.label}
                        href={sub.href}
                        onClick={(e) => handleLinkClick(e, sub.href)}
                        className="block px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-[#d32f2f] bg-gray-50 rounded-lg"
                      >
                        • {sub.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
