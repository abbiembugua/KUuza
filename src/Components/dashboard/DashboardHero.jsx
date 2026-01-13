import React from 'react';
import { Search } from 'lucide-react';
import { useTheme } from '../../context/Themecontext';
import { useAuth } from '../../context/AuthContext';


const DashboardHero = ({ searchQuery, setSearchQuery }) => {
  const { darkMode } = useTheme(); 
  const { user } = useAuth();

 
  return (
    <div
      className={`
        relative pt-24 pb-12 border-b
        ${darkMode
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border-gray-800'
          : 'bg-gradient-to-br from-emerald-50 via-white to-cyan-50 border-gray-200'}
      `}
    >
      {/* Background Pattern */}
      <div className={`absolute inset-0 ${darkMode ? 'opacity-10' : 'opacity-20'}`}>
        <div
          className={`
            absolute inset-0
            bg-[radial-gradient(circle,#34d399_1px,transparent_1px)]
            bg-[size:32px_32px]
          `}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-8">
         <h1 className={`text-3xl sm:text-4xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Hello{' '}
        <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
         {user?.full_name || "there"}
         </span>
         , ready to browse?
        </h1>

         <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
    Buy and sell with fellow KU students safely and easily
     </p>
      </div>


        {/* Search Bar */}
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Search
              className={`absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6
                ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for items, books, electronics, services..."
              className={`
                w-full pl-16 pr-32 py-4 rounded-2xl text-lg transition-all duration-300
                ${darkMode
                  ? 'bg-gray-900/80 text-white placeholder-gray-500 border-gray-700 focus:border-emerald-400 focus:ring-emerald-400/20'
                  : 'bg-white text-gray-900 placeholder-gray-400 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20'}
                border focus:ring-2 backdrop-blur-md
              `}
            />

            <button
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                px-6 py-2 rounded-xl font-semibold
                bg-gradient-to-r from-emerald-500 to-cyan-500
                text-white hover:scale-105
                shadow-lg shadow-emerald-500/20
                transition-all duration-300
              "
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;
