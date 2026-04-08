// components/landing/CTA.jsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/Themecontext';
import { useNavigate } from 'react-router-dom';

const CTA = () => {
  const { darkMode } = useTheme();
  const navigate=useNavigate();

  const handleSignup =()=>{
    navigate('/signup');
  };
  
  return (
    <section className={`py-20 px-6 transition-colors duration-200 ${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="container mx-auto">
        <div className={`max-w-4xl mx-auto rounded-3xl p-12 text-center transition-colors duration-200 ${
          darkMode
            ? 'bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border border-emerald-500/20 shadow-2xl shadow-gray-900/50'
            : 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-200 shadow-2xl shadow-gray-200/30'
        }`}>
          <h2 className={`text-4xl font-bold mb-6 transition-colors duration-200 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Ready to Join the World class University's<br />
            <span className="text-emerald-500">Student Marketplace</span>?
          </h2>
          <p className={`text-xl mb-10 max-w-2xl mx-auto transition-colors duration-200 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Connect with thousands of verified KU students. Buy, sell, and trade securely within our trusted campus community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
            onClick={handleSignup}
            className={`px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 ${
              darkMode
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30'
            }`}>
              Create Free Account
            </button>
            <button className={`px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 ${
              darkMode
                ? 'bg-transparent border-2 border-cyan-400 hover:bg-cyan-400/10 text-cyan-400'
                : 'bg-transparent border-2 border-cyan-600 hover:bg-cyan-600/10 text-cyan-700'
            }`}>
              Learn More
            </button>
          </div>
          <div className="mt-10 flex items-center justify-center space-x-4">
            <CheckCircle className={`w-5 h-5 transition-colors duration-200 ${
              darkMode ? 'text-emerald-400' : 'text-emerald-600'
            }`} />
            <span className={`transition-colors duration-200 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No hidden fees • M-Pesa integration • 24/7 support
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;