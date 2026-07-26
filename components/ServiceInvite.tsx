
import React from 'react';

const ServiceInvite: React.FC = () => {
  return (
    <section className="py-32 bg-[#a52424] text-white relative overflow-hidden">
      {/* Decorative abstract circles copied from The Journey styling */}
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full pointer-events-none"></div>
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-white/5 rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-5xl md:text-8xl font-[900] mb-8 uppercase tracking-tighter leading-none">
          Join Our <br className="md:hidden" />
          Sunday Service
        </h2>
        <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto font-medium mb-12">
          Experience a culture of service and powerful testimony. There is a seat waiting for you.
        </p>
        <div className="inline-block px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full font-black text-lg uppercase tracking-widest">
          9:00 AM • BRACKENHURST
        </div>
      </div>
    </section>
  );
};

export default ServiceInvite;
