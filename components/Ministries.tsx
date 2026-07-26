
import React from 'react';
import { MINISTRIES } from '../constants';

const Ministries: React.FC = () => {
  return (
    <section id="ministries" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <h2 className="text-sm font-bold tracking-widest text-church-red uppercase mb-2">Our Ministries</h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Transformation Through Connection & Service
            </h3>
            <p className="text-lg text-gray-600">
              We believe love is a verb. We are called to serve one another humbly in love, putting aside our own preferences for the community.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MINISTRIES.map((ministry, index) => (
            <div 
              key={index} 
              className="group bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-4xl mb-6 bg-gray-50 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:bg-church-red/10 transition-colors">
                {ministry.icon}
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">{ministry.title}</h4>
              <p className="text-gray-500 leading-relaxed">
                {ministry.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Ministries;
