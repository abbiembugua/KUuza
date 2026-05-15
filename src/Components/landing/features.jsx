import React, { useEffect, useRef, useState } from 'react';
import { Camera, BadgeCheck, Smartphone, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/Themecontext';

const pillars = [
  {
    Icon: Camera,
    label: 'List in seconds',
    copy: 'Snap a photo, write a title, and your listing is live. Done.',
  },
  {
    Icon: BadgeCheck,
    label: 'Students only',
    copy: 'Your student ID is your key. Every buyer and seller is a verified KU student.',
  },
{
    Icon: Smartphone,
    label: 'Pay with M-Pesa',
    copy: "No cash, no stress. Pay instantly through M-Pesa the moment you find what you need.",
  },
  {
    Icon: Sparkles,
    label: 'AI-powered listings',
    copy: "Not sure how to describe what you're selling? Let AI write your listing for you.",
  },
];

const Features = () => {
  const { darkMode } = useTheme();
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={ref}
      className={`py-24 px-6 transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <div className="container mx-auto max-w-6xl">
        {/* Section header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ease-out ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h2 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            How it Works
          </h2>
          <p className={`mt-3 text-base max-w-md mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Everything you need to buy and sell on campus, in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {pillars.map(({ Icon, label, copy }, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center text-center p-8 rounded-2xl border
                transition-all duration-700 ease-out
                ${darkMode
                  ? 'bg-gray-700/60 border-gray-600/40 hover:bg-gray-700 hover:border-emerald-500/30'
                  : 'bg-gray-50 border-gray-100 hover:bg-emerald-50/60 hover:border-emerald-200'}
                hover:shadow-md
                ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${idx * 120 + 150}ms` }}
            >
              <div className={`mb-5 p-3.5 rounded-2xl ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
                <Icon className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
              </div>
              <h3 className={`text-base font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {label}
              </h3>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;