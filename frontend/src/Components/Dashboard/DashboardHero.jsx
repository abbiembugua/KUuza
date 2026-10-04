import React from 'react';
import { useNavigate } from 'react-router-dom';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const DashboardHero = ({ darkMode, user, cartCount = 0 }) => {
  const navigate = useNavigate();
  const firstName = user?.full_name?.split(' ')[0] || 'Student';

  const subLine = cartCount > 0
    ? { text: `You have ${cartCount} item${cartCount !== 1 ? 's' : ''} waiting in your cart.`, link: '/cart', linkLabel: 'View cart' }
    : { text: 'Discover great deals from your campus community.', link: null };

  return (
    <div className={`relative overflow-hidden ${
      darkMode
        ? 'bg-gradient-to-r from-gray-900 via-emerald-950 to-gray-900'
        : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500'
    }`}>
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 bg-white transform translate-x-20 -translate-y-20 pointer-events-none" />
      <div className="absolute bottom-0 left-16 w-48 h-48 rounded-full opacity-10 bg-white transform translate-y-12 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-5 bg-white pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-7 relative z-10">
        <p className="text-emerald-200 text-sm font-medium mb-1 opacity-90">
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">
          {getGreeting()}, {firstName}.
        </h1>
        <p className="text-emerald-100 text-sm opacity-80">
          {subLine.text}
          {subLine.link && (
            <button
              onClick={() => navigate(subLine.link)}
              className="ml-2 underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity"
            >
              {subLine.linkLabel} →
            </button>
          )}
        </p>
      </div>
    </div>
  );
};

export default DashboardHero;
