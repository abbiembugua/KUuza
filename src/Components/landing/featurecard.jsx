// components/landing/FeatureCard.jsx
import React from 'react';

const FeatureCard = ({ feature, darkMode }) => {
  const { icon: Icon, title, description, color } = feature;
  return (
    <div className={`p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl ${darkMode ? 'bg-gray-900/50 border border-gray-800 hover:border-emerald-500/30' : 'bg-white border border-gray-200 hover:border-emerald-300'}`}>
      <div className={`p-4 rounded-xl w-fit mb-6 ${darkMode ? `bg-${color}-500/20` : `bg-${color}-100`}`}>
        <Icon className={`w-8 h-8 ${darkMode ? `text-${color}-400` : `text-${color}-600`}`} />
      </div>
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{description}</p>
    </div>
  );
};

export default FeatureCard;
