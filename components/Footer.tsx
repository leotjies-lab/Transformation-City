
import React from 'react';
import TCCLogo from './TCCLogo';

interface FooterProps {
  onNavigate: (path: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-gray-950 text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 lg:col-span-1">
            <button 
              onClick={(e) => handleNav(e as any, '/')}
              className="mb-8 block text-left focus:outline-none"
            >
              <TCCLogo variant="dark" className="h-14" />
            </button>
            <p className="text-gray-400 mb-8 leading-relaxed text-lg">
              Ordinary people living extraordinary lives. Transforming our world by sharing the hope and power we have received.
            </p>
            <div className="flex space-x-4">
              {['facebook', 'instagram', 'youtube'].map((social) => (
                <a key={social} href="#" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#d32f2f] transition-all transform hover:scale-110">
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-current opacity-70"></div>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-black mb-8 uppercase tracking-widest text-white/50">Navigation</h4>
            <ul className="space-y-4 text-gray-400 font-bold">
              <li><a href="/" onClick={(e) => handleNav(e, '/')} className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/activities" onClick={(e) => handleNav(e, '/activities')} className="hover:text-white transition-colors">Weekly Activities</a></li>
              <li><a href="/#about" onClick={(e) => handleNav(e, '/')} className="hover:text-white transition-colors">Our Vision</a></li>
              <li><a href="/#ministries" onClick={(e) => handleNav(e, '/')} className="hover:text-white transition-colors">Ministries</a></li>
              <li>
                <a href="/admin" onClick={(e) => handleNav(e, '/admin')} className="text-[#a52424] hover:text-red-400 transition-colors inline-flex items-center space-x-1">
                  <span>TCC Admin Portal</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-black mb-8 uppercase tracking-widest text-white/50">Services</h4>
            <ul className="space-y-5 text-gray-400">
              <li><span className="text-white font-black block text-lg">Sunday Service</span> 09:00 AM</li>
              <li><span className="text-white font-black block text-lg">Little Lights</span> 09:00 AM</li>
              <li><span className="text-white font-black block text-lg">Youth Night</span> Fri 06:30 PM</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-black mb-8 uppercase tracking-widest text-white/50">Contact</h4>
            <ul className="space-y-6 text-gray-400">
              <li className="flex items-start">
                <svg className="w-6 h-6 mr-4 mt-1 text-[#d32f2f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                <span className="text-lg">120A McBride St,<br/>Brackenhurst, Alberton, SA</span>
              </li>
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-4 text-[#d32f2f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span className="text-lg">info@tccchurch.org</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-12 text-center text-gray-500 text-sm font-medium">
          <p className="mb-2 uppercase tracking-widest">&copy; {new Date().getFullYear()} Transformation City Church</p>
          <p className="italic text-gray-600">You can do all things through Him who gives you strength. Welcome Home.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
