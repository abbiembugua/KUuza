import React, { useMemo } from 'react';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/Themecontext';

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

// Full footer used on the landing page
export const LandingFooter = () => {
  const { darkMode } = useTheme();
  return (
    <footer id="contact" className={`relative overflow-hidden pt-14 pb-8 px-6 transition-colors duration-300 ${
      darkMode ? 'bg-gray-800' : 'bg-gray-50'
    }`}>
      <Bubbles darkMode={darkMode} />
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img src="/kuuza-logo.png" alt="KUuza" className="h-10 w-10 rounded-xl" />
              <span className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                KU<span className="text-emerald-500">uza</span>
              </span>
            </div>
            <p className="text-amber-500 font-medium text-sm pl-0.5">Uza Hapa, Pata Hapa</p>
          </div>
          <a
            href="mailto:hello.kuuza@gmail.com"
            className={`text-sm font-medium transition-colors duration-200 ${
              darkMode ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-500 hover:text-emerald-600'
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

// Compact footer used on all app pages
const AppFooter = () => {
  const { darkMode } = useTheme();

  const links = [
    { to: '/browse',      label: 'Browse' },
    { to: '/sell',        label: 'Sell' },
    { to: '/my-listings', label: 'My Listings' },
    { to: '/purchases',   label: 'Transactions' },
    { to: '/profile',     label: 'Profile' },
  ];

  return (
    <footer className={`mt-auto border-t ${
      darkMode
        ? 'bg-gray-900 border-gray-800'
        : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img src="/kuuza-logo.png" alt="KUuza" className="h-7 w-7 rounded-lg" />
          <span className={`text-base font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            KU<span className="text-emerald-500">uza</span>
          </span>
          <span className={`text-xs ml-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            · Uza Hapa, Pata Hapa
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-5 flex-wrap justify-center">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-xs font-medium transition-colors ${
                darkMode
                  ? 'text-gray-500 hover:text-emerald-400'
                  : 'text-gray-400 hover:text-emerald-600'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Email */}
        <a
          href="mailto:hello.kuuza@gmail.com"
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            darkMode
              ? 'text-gray-500 hover:text-emerald-400'
              : 'text-gray-400 hover:text-emerald-600'
          }`}
        >
          <Mail size={12} />
          hello.kuuza@gmail.com
        </a>
      </div>
    </footer>
  );
};

export default AppFooter;