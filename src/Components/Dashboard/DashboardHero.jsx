import React from 'react';

const DashboardHero = ({ darkMode, user }) => {
  return (
    <div className={`relative overflow-hidden ${
      darkMode
        ? 'bg-gradient-to-r from-gray-900 via-emerald-950 to-gray-900'
        : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500'
    }`}>
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 bg-white transform translate-x-20 -translate-y-20" />
      <div className="absolute bottom-0 left-16 w-48 h-48 rounded-full opacity-10 bg-white transform translate-y-12" />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-5 bg-white" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div>
          <p className="text-emerald-200 text-sm font-medium mb-1 opacity-90">
            {new Date().toLocaleDateString('en-KE', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h1 className="text-3xl font-bold text-white mb-1">
            Hey, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-emerald-100 text-sm opacity-80">
            Discover great deals from your campus community
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;