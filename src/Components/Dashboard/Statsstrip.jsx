import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, TrendingUp, Package, ShoppingBag } from 'lucide-react';

const useCountUp = (target, duration = 600) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
};

const StatItem = ({ stat, darkMode, isLast }) => {
  const navigate = useNavigate();
  const count = useCountUp(stat.value);

  return (
    <button
      onClick={() => navigate(stat.link)}
      className={`group relative flex-1 flex items-center justify-center gap-3 py-4 px-4 transition-all duration-200
        ${!isLast ? `border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}` : ''}
        ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
      `}
    >
      {/* coloured left accent bar on hover */}
      <span className={`absolute left-0 top-1/4 h-1/2 w-0.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${stat.accent}`} />

      <div className={`p-2 rounded-lg transition-transform duration-200 group-hover:scale-110 ${stat.bg}`}>
        <stat.icon className={`w-4 h-4 ${stat.color}`} />
      </div>

      <div className="text-left">
        <p className={`text-2xl font-bold leading-none tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {count}
        </p>
        <p className={`text-sm font-medium mt-0.5 hidden sm:block ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {stat.label}
        </p>
      </div>
    </button>
  );
};

const StatsStrip = ({ darkMode, cartCount, myListingsCount, soldCount, purchasesCount }) => {
  const stats = [
    {
      label: 'Cart',
      value: cartCount,
      icon: ShoppingCart,
      color: 'text-emerald-600',
      bg: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50',
      accent: 'bg-emerald-500',
      link: '/cart',
    },
    {
      label: 'Listings',
      value: myListingsCount,
      icon: Package,
      color: 'text-blue-600',
      bg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50',
      accent: 'bg-blue-500',
      link: '/my-listings',
    },
    {
      label: 'Purchases',
      value: purchasesCount,
      icon: ShoppingBag,
      color: 'text-orange-600',
      bg: darkMode ? 'bg-orange-500/10' : 'bg-orange-50',
      accent: 'bg-orange-500',
      link: '/purchases?tab=buyer',
    },
    {
      label: 'Sold',
      value: soldCount,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: darkMode ? 'bg-violet-500/10' : 'bg-violet-50',
      accent: 'bg-violet-500',
      link: '/purchases?tab=seller',
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
          darkMode
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        }`}>
          At a glance
        </span>
      </div>

      <div className={`flex items-stretch rounded-xl border overflow-hidden ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {stats.map((stat, i) => (
          <StatItem
            key={stat.label}
            stat={stat}
            darkMode={darkMode}
            isLast={i === stats.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default StatsStrip;
