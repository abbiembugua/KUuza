import React, { useState } from 'react';
import {
  Home,
  Search,
  PlusCircle,
  ShoppingBag,
  Bell,
  MessageCircle,
  User,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardNavbar = ({ darkMode, setDarkMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Home', icon: <Home size={18} />, to: '/' },
    { label: 'Browse', icon: <Search size={18} />, to: '/browse' },
    { label: 'Sell', icon: <PlusCircle size={18} />, to: '/sell' },
    { label: 'My Listings', icon: <ShoppingBag size={18} />, to: '/my-listings' },
    { label: 'Orders', icon: <ShoppingBag size={18} />, to: '/orders' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 border-b
      ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="text-white w-5 h-5" />
            </div>
            <span className={`font-semibold hidden sm:block
              ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              KU Marketplace
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.to}
                className={`flex items-center gap-2 font-medium
                  ${darkMode
                    ? 'text-gray-300 hover:text-indigo-400'
                    : 'text-gray-600 hover:text-indigo-600'}`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-4">

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition
                ${darkMode
                  ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Messages */}
            <Link to="/messages" className="relative">
              <MessageCircle
                className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                size={22}
              />
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                1
              </span>
            </Link>

            {/* Notifications */}
            <Link to="/notifications" className="relative text-indigo-600">
              <Bell size={22} />
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                2
              </span>
            </Link>

            {/* Profile */}
            <Link to="/profile">
              <User
                size={22}
                className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden
              ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={`lg:hidden border-t
          ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="px-4 py-3 space-y-2">

            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg
                  ${darkMode
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            {/* Theme Toggle (Mobile) */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg
                ${darkMode
                  ? 'text-yellow-300 hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>

            <Link to="/profile" className="flex items-center gap-3 px-3 py-2">
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
