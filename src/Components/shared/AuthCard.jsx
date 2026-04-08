import React from 'react';

const AuthCard = ({ darkMode, className = '', children }) => {
  return (
    <div
      className={`p-8 rounded-3xl shadow-2xl backdrop-blur-sm ${
        darkMode
          ? 'bg-gray-900/80 border border-gray-800'
          : 'bg-white/90 border border-gray-200/50'
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default AuthCard;
