
import React from 'react';
import EventCalendar from './EventCalendar';

const ActivitiesPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[#d32f2f] font-black uppercase tracking-widest text-xs bg-red-100 px-4 py-1.5 rounded-full inline-block mb-4">
            Calendar & Schedule
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight mb-4">
            Events & Activities
          </h1>
          <p className="text-lg text-gray-500 font-medium leading-relaxed">
            Discover upcoming events, monthly gatherings, and weekly connect opportunities. Explore our weekly schedule, monthly calendar, and annual events.
          </p>
        </div>

        {/* Interactive Events Calendar */}
        <EventCalendar />
      </div>
    </div>
  );
};

export default ActivitiesPage;
