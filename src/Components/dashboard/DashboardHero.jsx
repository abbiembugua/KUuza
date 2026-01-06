import React from 'react';
import { Search } from 'lucide-react';

const DashboardHero = ({ darkMode, searchQuery, setSearchQuery }) => {
  return (
    <div className={`relative ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900 border-b border-gray-800' 
        : 'bg-gradient-to-br from-emerald-50 via-white to-cyan-50 border-b border-gray-200'
    } pt-24 pb-12`}>
      
      <div className="absolute inset-0 opacity-5">
        <div className={`absolute inset-0 ${
          darkMode
            ? 'bg-[radial-gradient(circle,#10b981_1px,transparent_1px)]'
            : 'bg-[radial-gradient(circle,#059669_1px,transparent_1px)]'
        } bg-[size:30px_30px]`}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-8">
          <h1 className={`text-3xl sm:text-4xl font-black mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome to <span className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}>KU Marketplace</span>
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Buy and sell with fellow KU students safely and easily
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Search className={`absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for items, books, electronics, services..."
              className={`w-full pl-16 pr-32 py-4 rounded-2xl text-lg transition-all duration-300 ${
                darkMode
                  ? 'bg-gray-900/80 border border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500'
                  : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500 shadow-lg'
              } focus:ring-2 focus:ring-emerald-500/20`}
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;