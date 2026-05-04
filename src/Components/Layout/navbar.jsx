// components/navigation/Navbar.jsx
import React from 'react';
import { Sun, Moon, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/Themecontext'; // Add this import

const Navbar = ({ scrolled }) => {
  const { darkMode, toggleTheme } = useTheme(); // Get from context
  
  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled 
        ? darkMode 
          ? 'bg-gray-900/90 backdrop-blur-lg shadow-xl' 
          : 'bg-white/90 backdrop-blur-lg shadow-lg'
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/kuuza-logo.png" alt="KUuza" className="h-14 w-auto object-contain" />
          <div className="leading-none">
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              KU<span className="text-emerald-500">uza</span>
            </h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Kenyatta University Official Marketplace
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleTheme} // Use toggleTheme from context
            className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700 text-yellow-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="flex space-x-3">
            <Link to="/login" className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
              Login
            </Link>
            <Link 
              to="/signup" 
              className={`px-6 py-2 rounded-lg font-medium ${
                darkMode
                  ? 'bg-transparent border-2 border-cyan-400 hover:bg-cyan-400/10 text-cyan-400'
                  : 'bg-transparent border-2 border-cyan-600 hover:bg-cyan-600/10 text-cyan-700'
              }`}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;