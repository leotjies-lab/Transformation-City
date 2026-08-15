
import React from 'react';
import { WEEKLY_ACTIVITIES } from '../constants';
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
            Events & Weekly Activities
          </h1>
          <p className="text-lg text-gray-500 font-medium leading-relaxed">
            Discover upcoming TCC events, monthly gatherings, and weekly connect opportunities. Toggle months below or view our weekly rhythm.
          </p>
        </div>

        {/* Interactive Month Calendar View */}
        <EventCalendar />

        {/* Weekly Recurring Schedule Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-xl space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              Weekly Rhythm & Activities
            </h2>
            <p className="text-gray-500 font-medium">
              Regular weekly services and ministry practice times at Transformation City Church.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {WEEKLY_ACTIVITIES.map((activity, index) => (
              <div 
                key={index} 
                className="group relative flex flex-col md:flex-row items-center bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:bg-white hover:shadow-xl hover:border-transparent transition-all duration-300"
              >
                <div className="flex-shrink-0 w-full md:w-56 mb-4 md:mb-0">
                  <span className={`inline-block px-5 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-widest shadow-md ${activity.color}`}>
                    {activity.day}
                  </span>
                </div>

                <div className="flex-shrink-0 w-full md:w-44 text-center md:text-left mb-3 md:mb-0">
                  <span className="text-2xl font-black text-gray-900 tracking-tight">{activity.time}</span>
                </div>

                <div className="flex-grow text-center md:text-left md:pl-6">
                  <h4 className="text-xl font-black text-gray-900 mb-1 group-hover:text-[#d32f2f] transition-colors">{activity.title}</h4>
                  {activity.description && (
                    <p className="text-gray-500 font-medium text-sm italic">{activity.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesPage;
