
import React from 'react';
import { WEEKLY_ACTIVITIES } from '../constants';

const ActivitiesPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight">
            Weekly Activities
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Our week is filled with opportunities to connect, grow, and serve together. There is a place for you here.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {WEEKLY_ACTIVITIES.map((activity, index) => (
            <div 
              key={index} 
              className="group relative flex flex-col md:flex-row items-center bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:bg-white hover:shadow-2xl hover:border-transparent transition-all duration-500"
            >
              <div className="flex-shrink-0 w-full md:w-64 mb-6 md:mb-0">
                <span className={`inline-block px-6 py-2 rounded-full text-white text-sm font-black uppercase tracking-widest shadow-lg ${activity.color} shadow-${activity.color.split('-')[1]}-500/20`}>
                  {activity.day}
                </span>
              </div>

              <div className="flex-shrink-0 w-full md:w-48 text-center md:text-left mb-4 md:mb-0">
                <span className="text-4xl font-black text-gray-900 tracking-tight">{activity.time}</span>
              </div>

              <div className="flex-grow text-center md:text-left md:pl-8">
                <h4 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-[#d32f2f] transition-colors">{activity.title}</h4>
                {activity.description && (
                  <p className="text-gray-500 font-medium text-lg italic">{activity.description}</p>
                )}
              </div>

              <div className="hidden lg:block">
                 <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#d32f2f] group-hover:text-white transition-all duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                 </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 p-12 bg-[#d32f2f] rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl font-black mb-6">Upcoming Special Events</h3>
              <p className="text-white/80 text-xl leading-relaxed">
                Keep an eye out for our upcoming seminars, community outreach days, and special worship nights. 
                Follow our social media pages to stay updated in real-time!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex-1 bg-white text-[#d32f2f] py-4 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all shadow-xl">
                SYNC CALENDAR
              </button>
              <button className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-lg hover:bg-gray-900 transition-all shadow-xl">
                LATEST NEWS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesPage;
