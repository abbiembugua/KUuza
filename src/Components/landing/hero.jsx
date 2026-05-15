import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/Themecontext';

// Bubble positions generated once per mount so they never jump on re-render
const Bubbles = ({ darkMode }) => {
  const items = useMemo(
    () =>
      Array.from({ length: 18 }, () => ({
        left:  `${Math.random() * 100}%`,
        top:   `${Math.random() * 100}%`,
        size:  `${Math.random() * 110 + 50}px`,
        delay: `${(Math.random() * 4).toFixed(1)}s`,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {items.map((b, i) => (
        <div
          key={i}
          className={`absolute rounded-full animate-pulse ${
            darkMode ? 'bg-emerald-400/10' : 'bg-cyan-400/20'
          }`}
          style={{ left: b.left, top: b.top, width: b.size, height: b.size, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
};

const Hero = () => {
  const { darkMode } = useTheme();
  const navigate     = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className={`relative pt-32 pb-28 px-6 overflow-hidden transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Bubbles sit behind content */}
      <Bubbles darkMode={darkMode} />

      <div className="container mx-auto text-center max-w-4xl relative z-10">
        <h1
          className={`font-display text-6xl md:text-8xl font-black leading-tight mb-6
            transition-all duration-700 ease-out
            ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
            ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Uza Hapa,
          <br />
          <span className="text-emerald-500">Pata Hapa</span>
        </h1>

        <p
          className={`text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed
            transition-all duration-700 ease-out
            ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          style={{ transitionDelay: '180ms' }}
        >
          The marketplace built for KU students exclusively. Buy and sell to
          people who are part of your community.
        </p>

        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center items-center
            transition-all duration-700 ease-out
            ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '340ms' }}
        >
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg rounded-xl
              shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-105 active:scale-100"
          >
            Sign in with Student Email
          </button>
          <a
            href="#how-it-works"
            className={`font-semibold text-lg underline-offset-4 hover:underline transition-colors ${
              darkMode ? 'text-emerald-400' : 'text-emerald-700'
            }`}
          >
            Learn more →
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;