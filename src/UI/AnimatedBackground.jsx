// components/ui/AnimatedBackground.jsx
import React from 'react';

const AnimatedBackground = ({ darkMode }) => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className={`absolute rounded-full animate-pulse ${
          darkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/15'
        }`}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 100 + 50}px`,
          height: `${Math.random() * 100 + 50}px`,
          animationDelay: `${Math.random() * 5}s`,
        }}
      />
    ))}
  </div>
);

export default AnimatedBackground;
