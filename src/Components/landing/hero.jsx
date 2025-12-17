// components/landing/Hero.jsx
import React from 'react';
import { Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

const Hero = ({ darkMode }) => {
  const stats = [
    { label: 'Verified Students', value: '10K+' },
    { label: 'Active Listings', value: '2.5K+' },
    { label: 'Secure Transactions', value: '98%' },
    { label: 'AI-Powered', value: '100%' },
  ];

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="container mx-auto text-center max-w-4xl">
        <div className={`inline-flex items-center space-x-2 mb-6 px-4 py-2 rounded-full ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className={`text-sm font-medium ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
            Powered by AI • Secure • KU Verified
          </span>
        </div>

        <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Connect. <span className="text-emerald-500">Trade.</span> Thrive.<br />
          <span className={`${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Only at Kenyatta University</span>
        </h1>

        <p className={`text-xl mb-10 max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          A secure, AI-enhanced web-based marketplace designed exclusively for KU students 
          to buy, sell, and exchange goods & services within campus. Verified. Trusted. Student-Focused.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button className={`group px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 ${darkMode ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'}`}>
            Start Trading Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className={`group px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white' : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 shadow-lg'}`}>
            Watch Demo
          </button>
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto p-6 rounded-2xl backdrop-blur-lg ${darkMode ? 'bg-gray-900/50 border border-gray-800' : 'bg-white/50 border border-white/80'}`}>
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className={`text-3xl font-bold mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{stat.value}</div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
