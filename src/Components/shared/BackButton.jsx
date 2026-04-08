import React from 'react';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ darkMode, label = 'Back', onClick, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick || (() => window.history.back())}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
        darkMode
          ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-200'
          : 'bg-white/80 hover:bg-white text-gray-700 shadow-md'
      } backdrop-blur-sm ${className}`.trim()}
    >
      <ArrowLeft size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );
};

export default BackButton;
