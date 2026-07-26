
import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-church-red uppercase mb-2">Our Vision</h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              Being God’s Transformation Agent in our City
            </h3>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              We are committed to a journey of growth, focusing on three primary goals. 
            </p>
            
            <div className="space-y-6">
              {[
                { title: 'Knowing God', desc: 'Grow together in our knowledge of Christ.' },
                { title: 'Loving People', desc: 'With a sincere and heartfelt devotion that reflects Christ.' },
                { title: 'Transforming World', desc: 'Go and be transformation in every sphere of our city.' }
              ].map((goal, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="bg-church-red/10 p-2 rounded-lg mt-1">
                    <svg className="w-5 h-5 text-church-red" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{goal.title}</h4>
                    <p className="text-gray-500">{goal.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl"></div>
            <div className="bg-gray-900 text-white p-8 md:p-12 rounded-3xl relative z-10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-church-red/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="text-3xl font-bold mb-6 italic">The Transformation Life</h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                Defined by a deep, daily awareness of our dependence on God. We believe a transformation life is twofold: Daily allowing God to transform us and allowing Him to use us daily to transform our world. We refer to "Bloom where we are planted".
              </p>
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl italic text-lg">
                "Fellowship is more than a social association; it is a discipline of truly loving and supporting our fellow believers."
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-church-red rounded-3xl -z-0"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
