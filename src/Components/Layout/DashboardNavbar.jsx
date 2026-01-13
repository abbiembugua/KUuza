// Components/Layout/DashboardNavbar.jsx
import React, { useState } from 'react';
import {
  Home,
  Search,
  PlusCircle,
  ShoppingBasket,
  Bell,
  MessageCircle,
  User,
  Sun,
  Moon,
  Menu,
  X,
  PersonStanding,
  LogOut,
  ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/Themecontext'; // Add this import
import { useAuth } from '../../context/AuthContext';

const DashboardNavbar = () => { // Remove darkMode and setDarkMode from props
  const { darkMode, toggleTheme } = useTheme(); // Get from context
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();


  const navLinks = [
    { label: 'Home', icon: <Home size={20} />, to: '/dashboard' },
    { label: 'Browse', icon: <Search size={20} />, to: '/browse' },
    { label: 'Sell', icon: <PlusCircle size={20} />, to: '/sell' },
    { label: 'Needs', icon: <PersonStanding size={20} />, to: '/needs' },
    { label: 'Cart', icon: <ShoppingBasket size={20} />, to: '/cart' },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 border-b ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <ShoppingBag
                size={22}
                className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}
              />
            </div>
            <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              KU<span className="text-emerald-500">uza</span>
            </span>
          </Link>

          {/* Main Navigation */}
          <div className="flex items-center gap-2 lg:gap-6">
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition
                  ${darkMode
                    ? 'text-gray-300 hover:bg-gray-800 hover:text-emerald-400'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-emerald-600'
                  }`}
              >
                {link.icon}
                <span className="hidden lg:inline text-sm font-medium">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">

            {/* Theme Toggle - FIXED */}
            <button
              onClick={toggleTheme} // Use toggleTheme from context
              className={`p-2 rounded-full transition ${
                darkMode
                  ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Messages (desktop only) */}
            <Link to="/messages" className={`relative hidden lg:block ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <MessageCircle size={20} />
              <span className="absolute -top-1 -right-2 text-xs bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
                1
              </span>
            </Link>

            {/* Notifications (desktop only) */}
            <Link to="/notifications" className={`relative hidden lg:block ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <Bell size={20} />
              <span className="absolute -top-1 -right-2 text-xs bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
                2
              </span>
            </Link>

            {/* Profile (desktop only) */}
            <Link to="/profile" className={`hidden lg:block ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <User size={20} />
            </Link>

            {/* Logout */}
            <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900"
            title="Logout"
    >
      <LogOut className="w-6 h-6 text-red-500" />
    </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              {mobileOpen ? <X size={26} /> : <Menu size={26} />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className={`lg:hidden border-t ${
            darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="px-4 py-3 space-y-2">
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg
                  ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            <Link 
              to="/profile" 
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User size={18} />
              Profile
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default DashboardNavbar;