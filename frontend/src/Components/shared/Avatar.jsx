import React from 'react';

const Avatar = ({ src, name, size = 'w-8 h-8', textSize = 'text-sm', className = '' }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'avatar'}
        className={`${size} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }
  return (
    <div className={`${size} rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 ${className}`}>
      <span className={`text-white font-semibold ${textSize}`}>
        {(name || '?').charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

export default Avatar;
