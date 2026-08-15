
import React from 'react';
import { Check } from 'lucide-react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-[#a52424] text-white relative overflow-hidden scroll-mt-0">
      {/* Decorative abstract circles */}
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full pointer-events-none"></div>
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-white/5 rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-white/80 mb-2">Our Vision</h2>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
              As a church, to be God’s Transformation Agent in our City
            </h3>
            <p className="text-base sm:text-lg text-white/90 mb-6 leading-relaxed">
              We are committed to a journey of growth, focusing on three primary goals:
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mt-0.5 shadow-md">
                  <Check className="w-5 h-5 text-white stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white leading-snug">Knowing God</h4>
                  <p className="text-sm text-white/80">Grow together in our knowledge of Christ.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mt-0.5 shadow-md">
                  <Check className="w-5 h-5 text-white stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white leading-snug">Loving People</h4>
                  <p className="text-sm text-white/80">With a sincere and heartfelt devotion that reflects Christ.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center mt-0.5 shadow-md">
                  <Check className="w-5 h-5 text-white stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white leading-snug">Transforming our City</h4>
                  <p className="text-sm text-white/80">Go and be transformation in every sphere of our city.</p>
                </div>
              </div>
            </div>

            <p className="text-base sm:text-lg text-white/90 leading-relaxed">
              Through worshipping together, serving our neighbors, and building deep relationships, we desire to reflect God's love and make a lasting impact in our city.
            </p>
          </div>

          <div id="the-transformation-life" className="relative scroll-mt-28">
            <div className="bg-[#181e29] rounded-[2.5rem] p-8 sm:p-10 md:p-12 shadow-2xl relative border border-white/10 flex flex-col items-center text-center overflow-hidden z-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-church-red/20 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <h3 className="text-3xl sm:text-4xl font-bold mb-6 italic text-white relative z-10">The Transformation Life</h3>
              <p className="text-gray-300 leading-relaxed max-w-lg mx-auto text-base sm:text-lg relative z-10">
                Defined by a deep, daily awareness of our dependence on God. We believe a transformation life is twofold. Daily allowing God to transform us and allowing Him to use us daily to transform our world. We refer to "Bloom where we are planted".
              </p>
            </div>
            <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-white/20 rounded-[2.5rem] pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
