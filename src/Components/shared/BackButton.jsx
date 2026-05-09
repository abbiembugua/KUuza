import React from 'react';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ darkMode, onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick || (() => window.history.back())}
    className={`p-2 rounded-xl transition-colors ${
      darkMode
        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
    } ${className}`.trim()}
  >
    <ArrowLeft size={18} />
  </button>
);

export default BackButton;
