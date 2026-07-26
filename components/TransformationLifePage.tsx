
import React, { useEffect } from 'react';

interface Props {
  onNavigate: (path: string) => void;
}

const TransformationLifePage: React.FC<Props> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    {
      number: '01',
      title: 'Live from the Source – Christ',
      content: 'Transformation begins with a shift in posture. To live from the Source means maintaining a daily awareness of our total dependence on God. This is the foundation of an "Impact Life," where we recognize that we cannot fulfill our purpose while distanced from Him. By humbling ourselves before the Lord, we allow Him to lift us up and empower us.'
    },
    {
      number: '02',
      title: 'Live the Word',
      content: 'We believe the Word of God is like a seed that has the potential to glorify God through our lives. Living the Word means allowing that seed to germinate and produce tangible fruit—specifically the characteristics of love, joy, peace, patience, and self-control. This step ensures that our lives are a witness to others, as people "see" the truth of the Word through our transformed actions.'
    },
    {
      number: '03',
      title: 'Pray in Faith',
      content: 'Prayer is the engine of a transformed life. It is through prayer that we ask for the boldness to speak God\'s word and the grace to be used as His instruments. When we pray in faith, we invite God to cooperate with us mightily, sometimes even supporting our testimony through healing and wonders.'
    },
    {
      number: '04',
      title: 'Fellowship with Believers',
      content: 'This step is the "first crossbar" of the impactor’s cross, focusing on our relationship with people as a direct outflow of our relationship with God. Fellowship is more than a social association; it is a discipline of sincere, deep love from the heart.',
      details: [
        { subtitle: 'The Twofold Process', text: 'Transformation happens when we realize our dependence on others (allowing God to use them in our lives) and when we allow God to use us in the lives of others.' },
        { subtitle: 'A Culture of Care', text: 'By accepting, protecting, and supporting one another, we create a community that the world craves to be part of.' }
      ]
    },
    {
      number: '05',
      title: 'Testify to the World',
      content: 'The final discipline is to share the "wonderful gift of salvation" with those around us. We believe that every believer has a unique personal testimony that is irrefutable because it is based on personal experience. To testify effectively, we "sharpen our ax" by preparing to share three things:',
      list: [
        'Where we were before we were found.',
        'How God saved us.',
        'Where we are now as children of God.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1490730141103-6ac27d020028?auto=format&fit=crop&q=80&w=1920" 
            alt="New Beginnings" 
            className="w-full h-full object-cover brightness-[0.3]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-none">
            LIVE A <br/>
            <span className="text-church-red italic">TRANSFORMATION</span> LIFE
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 font-light tracking-[0.2em] uppercase max-w-3xl mx-auto">
            Our daily commitment to follow Jesus
          </p>
        </div>
      </section>

      {/* Intro Narrative */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gray-50 p-12 rounded-[3rem] border-l-8 border-church-red shadow-xl">
            <p className="text-2xl md:text-3xl font-medium text-gray-900 leading-relaxed mb-8 text-left">
              "To Live a Transformation Life is the definitive step in our church’s strategy, representing a daily commitment to follow Jesus and serve as God’s transformation agent in our city."
            </p>
            <div className="text-lg text-gray-600 space-y-4 leading-relaxed text-left">
              <p>This journey is not for the perfect, but for ordinary people who choose to live extraordinary lives through the strength that Christ provides.</p>
              <p>The process of living a transformed life is built upon five core disciplines that move us from internal growth to external impact. Below are the steps in this life-changing process:</p>
            </div>
          </div>
        </div>
      </section>

      {/* Five Disciplines */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {steps.map((step, index) => (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start group">
                <div className="lg:col-span-2 flex justify-center lg:justify-start">
                  <div className="w-24 h-24 bg-church-red rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-red-500/30 transform transition-transform group-hover:scale-110">
                    {step.number}
                  </div>
                </div>
                <div className="lg:col-span-10">
                  <h3 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 uppercase tracking-tight group-hover:text-church-red transition-colors text-left">
                    {step.title}
                  </h3>
                  <p className="text-xl text-gray-600 leading-relaxed mb-8 text-left">
                    {step.content}
                  </p>
                  
                  {step.details && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      {step.details.map((detail, dIdx) => (
                        <div key={dIdx} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-left">
                          <h4 className="text-church-red font-black uppercase tracking-widest text-sm mb-3">
                            {detail.subtitle}
                          </h4>
                          <p className="text-gray-700 leading-relaxed">{detail.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.list && (
                    <ul className="space-y-4 mt-8">
                      {step.list.map((item, lIdx) => (
                        <li key={lIdx} className="flex items-center text-lg text-gray-700 font-medium text-left">
                          <span className="w-6 h-6 rounded-full bg-church-red/10 text-church-red flex items-center justify-center mr-4 flex-shrink-0">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Daily Decision */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-8 uppercase tracking-tighter">The Daily Decision</h2>
          <div className="space-y-8 mb-12">
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed font-light">
              Living a Transformation Life is an intentional decision to make today matter. Because time is a borrowed gift, we embrace every opportunity to do good, especially to the family of believers.
            </p>
            <div className="p-10 bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 shadow-2xl transform hover:scale-[1.02] transition-transform">
              <p className="text-2xl md:text-3xl italic font-bold text-church-red mb-4">
                "As you take this step, you will find that love and service are inseparable."
              </p>
              <p className="text-lg text-gray-400">
                As you step out in faith to be a blessing, you will witness the miracle of growth in your own life.
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('/#services')}
            className="px-16 py-6 bg-church-red text-white font-black text-xl rounded-full hover:bg-red-700 transition-all shadow-2xl shadow-red-600/20 uppercase tracking-[0.2em]"
          >
            JOIN THE MISSION
          </button>
        </div>
      </section>
    </div>
  );
};

export default TransformationLifePage;
