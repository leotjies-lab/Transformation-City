
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
import Footer from './components/Footer';

type View = 'home' | 'activities' | 'transformation-life';

const getViewFromPath = (path: string): View => {
  if (path.includes('/activities')) return 'activities';
  if (path.includes('/transformation-life')) return 'transformation-life';
  return 'home';
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(() => {
    return getViewFromPath(window.location.pathname);
  });

  const handleLocationChange = useCallback(() => {
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

  const renderContent = () => {
    switch (currentView) {
      case 'activities': 
        return <ActivitiesPage />;
      case 'transformation-life': 
        return <TransformationLifePage onNavigate={navigate} />;
      default:
        return (
          <>
            <Hero />
            <About />
            <NextSteps />
            <Ministries />
            <Services />
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
