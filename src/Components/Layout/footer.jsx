import React, { useMemo } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useTheme } from '../../context/Themecontext';

// Stable bubble positions generated once per mount
const Bubbles = ({ darkMode }) => {
  const items = useMemo(
    () =>
      Array.from({ length: 12 }, () => ({
        left:  `${Math.random() * 100}%`,
        top:   `${Math.random() * 100}%`,
        size:  `${Math.random() * 90 + 40}px`,
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
            darkMode ? 'bg-emerald-400/8' : 'bg-cyan-400/15'
          }`}
          style={{ left: b.left, top: b.top, width: b.size, height: b.size, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
};

const Footer = () => {
  const { darkMode } = useTheme();

  return (
    <footer className={`relative overflow-hidden pt-14 pb-8 px-6 transition-colors duration-300 ${
      darkMode ? 'bg-gray-800' : 'bg-gray-50'
    }`}>
      <Bubbles darkMode={darkMode} />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
          {/* Wordmark + slogan */}
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                <ShoppingBag className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <span className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                KU<span className="text-emerald-500">uza</span>
              </span>
            </div>
            <p className="text-amber-500 font-medium text-sm pl-0.5">
              Uza Hapa, Pata Hapa
            </p>
          </div>

          {/* Contact email */}
          <a
            href="mailto:hello.kuuza@gmail.com"
            className={`text-sm font-medium transition-colors duration-200 ${
              darkMode
                ? 'text-gray-400 hover:text-emerald-400'
                : 'text-gray-500 hover:text-emerald-600'
            }`}
          >
            hello.kuuza@gmail.com
          </a>
        </div>

        <div className={`border-t pt-6 text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Built at Kenyatta University, for Kenyatta University.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;