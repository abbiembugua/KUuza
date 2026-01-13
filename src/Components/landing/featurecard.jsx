// components/landing/FeatureCard.jsx
import React from 'react';
import { useTheme } from '../../context/Themecontext';

const FeatureCard = ({ feature }) => {
  const { darkMode } = useTheme();
  const { icon: Icon, title, description, color } = feature;
  
  const colorClasses = {
    emerald: {
      bg: darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100',
      text: darkMode ? 'text-emerald-400' : 'text-emerald-600'
    },
    cyan: {
      bg: darkMode ? 'bg-cyan-500/20' : 'bg-cyan-100',
      text: darkMode ? 'text-cyan-400' : 'text-cyan-600'
    }
  };

  return (
    <div className={`p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
      darkMode 
        ? 'bg-gray-900/50 border border-gray-800 hover:border-emerald-500/30'
        : 'bg-white border border-gray-200 hover:border-emerald-300 shadow-lg'
    }`}>
      <div className={`p-4 rounded-xl w-fit mb-6 ${colorClasses[color].bg}`}>
        <Icon className={`w-8 h-8 ${colorClasses[color].text}`} />
      </div>
      <h3 className={`text-xl font-bold mb-3 transition-colors duration-200 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {title}
      </h3>
      <p className={`transition-colors duration-200 ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;