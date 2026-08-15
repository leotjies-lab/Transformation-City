
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Ministries from './components/Ministries';
import NextSteps from './components/NextSteps';
import ServiceInvite from './components/ServiceInvite';
import ActivitiesPage from './components/ActivitiesPage';
import TransformationLifePage from './components/TransformationLifePage';
import SermonsPage from './components/SermonsPage';
import AdminPortal from './components/AdminPortal';
import Footer from './components/Footer';

type View = 'home' | 'activities' | 'transformation-life' | 'sermons' | 'admin';

const getViewFromPath = (path: string): View => {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const searchParams = new URLSearchParams(search);
  const redirectPath = searchParams.get('p') || '';
  const combined = (path + ' ' + redirectPath).toLowerCase();

  if (combined.includes('admin')) return 'admin';
  if (combined.includes('activities') || combined.includes('gatherings')) return 'activities';
  if (combined.includes('transformation-life')) return 'transformation-life';
  if (combined.includes('sermons')) return 'sermons';
  return 'home';
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(() => {
    return getViewFromPath(window.location.pathname);
  });

  const handleLocationChange = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectPath = searchParams.get('p');
    if (redirectPath) {
      const cleanPath = redirectPath.startsWith('/') ? redirectPath : '/' + redirectPath;
      window.history.replaceState({}, '', cleanPath);
    }

    const path = window.location.pathname;
    const hash = window.location.hash;
    const nextView = getViewFromPath(path);

    setCurrentView(nextView);

    if (hash) {
      // If we have a hash, wait for the component to mount/render then scroll
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    
    // Initial check
    handleLocationChange();

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [handleLocationChange]);

  const navigate = (path: string) => {
    // Basic router logic: handle home sections (/#about) and pages (/activities)
    if (path.startsWith('/#')) {
      const hash = path.substring(1); // e.g., #about
      if (window.location.pathname !== '/') {
        // We are on a different page, need to go home first
        window.history.pushState({}, '', '/');
        window.location.hash = hash;
      } else {
        // Just change hash on current page
        window.location.hash = hash;
      }
    } else {
      // Standard page transition
      window.history.pushState({}, '', path);
    }
    
    // Trigger view sync
    handleLocationChange();
  };

  if (currentView === 'admin') {
    return <AdminPortal onNavigate={navigate} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'activities': 
        return <ActivitiesPage />;
      case 'transformation-life': 
        return <TransformationLifePage onNavigate={navigate} />;
      case 'sermons':
        return <SermonsPage onNavigate={navigate} />;
      default:
        return (
          <>
            <Hero />
            <About />
            <Ministries />
            <Services />
            <NextSteps />
            <ServiceInvite />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar onNavigate={navigate} currentView={currentView} />
      <main>
        {renderContent()}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
};

export default App;

