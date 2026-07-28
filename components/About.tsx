
import React from 'react';
import { Check } from 'lucide-react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-church-red uppercase mb-2">Our Vision</h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
              As a church, to be God’s Transformation Agent in our City
            </h3>
            <p className="text-base sm:text-lg text-gray-600 mb-5 leading-relaxed">
              We are committed to a journey of growth, focusing on three primary goals.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3.5">
                <Check className="w-5 h-5 text-church-red flex-shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <h4 className="text-base font-bold text-gray-900">Knowing God</h4>
                  <p className="text-sm text-gray-600">Grow together in our knowledge of Christ.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <Check className="w-5 h-5 text-church-red flex-shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <h4 className="text-base font-bold text-gray-900">Loving People</h4>
                  <p className="text-sm text-gray-600">With a sincere and heartfelt devotion that reflects Christ.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <Check className="w-5 h-5 text-church-red flex-shrink-0 mt-0.5 stroke-[2.5]" />
                <div>
                  <h4 className="text-base font-bold text-gray-900">Transforming World</h4>
                  <p className="text-sm text-gray-600">Go and be transformation in every sphere of our city.</p>
                </div>
              </div>
            </div>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Through worshipping together, serving our neighbors, and building deep relationships, we desire to reflect God's love and make a lasting impact in our city.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl"></div>
            <div className="bg-gray-900 text-white p-8 md:p-12 rounded-3xl relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-church-red/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="text-3xl font-bold mb-6 italic">The Transformation Life</h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                Defined by a deep, daily awareness of our dependence on God. We believe a transformation life is twofold; Daily allowing God to transform us and allowing Him to use us daily to transform our world. We refer to "Bloom where we are planted".
              </p>
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl italic text-lg">
                "Fellowship is more than a social association; it is a discipline of truly loving and supporting our fellow believers."
              </div>
            </div>
            <div className="absolute -bottom-0 -right-0 w-full h-full border-2 border-church-red rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
