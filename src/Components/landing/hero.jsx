// components/landing/Hero.jsx
import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/Themecontext';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  
  const stats = [
    { label: 'Verified Students', value: '10K+' },
    { label: 'Active Listings', value: '2.5K+' },
    { label: 'Secure Transactions', value: '98%' },
    { label: 'AI-Powered', value: '100%' },
  ];
const handleSignIn = () => {
    navigate('/login'); // or '/login' depending on your route path
  };

  return (
    <section className={`pt-32 pb-20 px-6 transition-colors duration-200 ${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="container mx-auto text-center max-w-4xl">
        <div className={`inline-flex items-center space-x-2 mb-6 px-4 py-2 rounded-full transition-colors duration-200 ${
          darkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'
        }`}>
          <span className={`text-sm font-medium transition-colors duration-200 ${
            darkMode ? 'text-emerald-300' : 'text-emerald-700'
          }`}>
            Powered by AI • Secure • KU Verified
          </span>
        </div>

        <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight transition-colors duration-200 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Connect. <span className="text-emerald-500">Trade.</span> Thrive.<br />
          <span className={`transition-colors duration-200 ${
            darkMode ? 'text-cyan-400' : 'text-cyan-600'
          }`}>
            Only at Kenyatta University
          </span>
        </h1>

        <p className={`text-xl mb-10 max-w-2xl mx-auto transition-colors duration-200 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          A secure, AI-enhanced web-based marketplace designed exclusively for KU students 
          to buy, sell, and exchange goods & services within campus. Verified. Trusted. Student-Focused.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button 
           onClick={handleSignIn}
          className={`group px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 ${
            darkMode 
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
          }`}>
            Sign in with student ID
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto p-6 rounded-2xl backdrop-blur-lg transition-colors duration-200 ${
          darkMode 
            ? 'bg-gray-900/50 border border-gray-800 shadow-lg shadow-gray-900/50'
            : 'bg-white/50 border border-white/80 shadow-lg shadow-gray-200/30'
        }`}>
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className={`text-3xl font-bold mb-1 transition-colors duration-200 ${
                darkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {stat.value}
              </div>
              <div className={`text-sm transition-colors duration-200 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;