import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/Themecontext';

const CTA = () => {
  const { darkMode } = useTheme();
  const navigate     = useNavigate();
  const ref          = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="join"
      ref={ref}
      className={`py-28 px-6 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}
    >
      <div
        className={`container mx-auto max-w-3xl text-center
          transition-all duration-700 ease-out
          ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <h2
          className={`font-display text-4xl md:text-5xl font-black mb-5 leading-tight ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Your campus{' '}
          <span className="text-emerald-500">marketplace</span>
          <br />is waiting.
        </h2>

        <p
          className={`text-lg mb-10 max-w-xl mx-auto leading-relaxed ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          Join KU students already buying and selling textbooks, clothes,
          food, and services — all on campus, all verified.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="group px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold
              text-lg rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-300
              hover:scale-105 active:scale-100 flex items-center justify-center gap-2"
          >
            Sign in with School Email
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/signup')}
            className={`px-8 py-4 border-2 font-bold text-lg rounded-xl
              transition-all duration-300 hover:scale-105 active:scale-100 ${
              darkMode
                ? 'border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400'
                : 'border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-600'
            }`}
          >
            Create an account
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
