import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Home,
  Search,
  Bell,
  ShoppingBag,
  Shield,
  ChevronDown,
  User,
  Package,
  ShoppingCart,
  LogOut,
  Plus,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/Themecontext';
import { useAuth } from '../../context/AuthContext';
import { dismissNotification as dismissNotificationApi, getNotifications } from '../../api/notificationsapi';
import { generateReceipt } from '../Checkout/generateReceipt';
import NotificationsDrawer from '../shared/NotificationsDrawer';

const API_BASE = 'http://127.0.0.1:8000/api';

const formatNotificationTime = (value) => {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

const DashboardNavbar = ({ onSearch, searchQuery, setSearchQuery, cartItemsCount = 0 }) => {
  const { darkMode, toggleTheme } = useTheme();
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();

  const [searchFocused, setSearchFocused]     = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications]     = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);

  const dropdownRef = useRef(null);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchQuery);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change / resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }
    setNotificationsLoading(true);
    try {
      const items = await getNotifications();
      setNotifications(items.map((item) => ({
        ...item,
        time: formatNotificationTime(item.created_at),
      })));
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }
    loadNotifications();
  }, [token, loadNotifications]);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    closeMobileMenu();
    logout();
  };

  const dismissNotification = async (notificationId) => {
    try {
      await dismissNotificationApi(notificationId);
      setNotifications((current) => current.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Unable to dismiss notification', error);
    }
  };

  const downloadReceiptFromNotification = async (notification) => {
    const response = await fetch(`${API_BASE}/transactions/${notification.transaction_id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Unable to load receipt details');
    const transaction = await response.json();
    generateReceipt({
      listing: {
        id: transaction.listing,
        title: transaction.listing_title,
        seller_name: transaction.seller_name,
        listing_type: transaction.listing_type,
        price: transaction.agreed_price,
      },
      transaction: { ...transaction, downloaded_by_name: user?.full_name },
      scheduledDate: transaction.scheduled_date,
      paymentMethod: transaction.payment_method,
      contact: null,
    });
  };

  const openNotification = async (notification) => {
    try {
      if (notification.notification_type === 'receipt_ready') {
        await downloadReceiptFromNotification(notification);
        toast.success('Receipt downloaded.');
        await dismissNotification(notification.id);
        setNotificationsOpen(false);
        navigate('/purchases?tab=buyer');
        return;
      }
      await dismissNotification(notification.id);
      setNotificationsOpen(false);
      navigate('/purchases?tab=seller');
    } catch (error) {
      console.error('Unable to open notification', error);
      toast.error('Could not open this notification right now.');
    }
  };

  const handleOpenNotifications = async () => {
    setNotificationsOpen(true);
    await loadNotifications();
  };

  const navLinkClass = `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    darkMode
      ? 'text-gray-300 hover:text-white hover:bg-gray-800'
      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
  }`;

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 border-b ${
        darkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
      } backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-3 md:px-4">

          {/* ── Main row ── */}
          <div className="h-16 flex items-center gap-2 md:gap-0 justify-between">

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`md:hidden p-2 rounded-xl transition-colors flex-shrink-0 ${
                darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
              <img src="/kuuza-logo.png" alt="KUuza" className="h-12 w-auto object-contain" />
              <div className="leading-none">
                <h1 className={`text-lg md:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  KU<span className="text-emerald-500">uza</span>
                </h1>
                <p className={`hidden md:block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Kenyatta University Official Marketplace
                </p>
              </div>
            </Link>

            {/* Nav links — desktop only */}
            <div className="hidden md:flex items-center gap-6 ml-8">
              <Link to="/dashboard" className={navLinkClass}>
                <Home size={18} />
                Home
              </Link>
              <Link to="/browse" className={navLinkClass}>
                <Search size={18} />
                Browse
              </Link>
            </div>

            {/* Search bar */}
            <div className={`flex-1 mx-2 md:mx-6 md:max-w-md transition-all duration-200 ${
              searchFocused ? 'scale-[1.02]' : ''
            }`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                  onKeyPress={handleSearch}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search..."
                  className={`w-full pl-9 pr-3 py-2 md:py-2.5 rounded-xl text-sm transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                    darkMode
                      ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-700 focus:border-emerald-500'
                      : 'bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-200 focus:border-emerald-500'
                  } ${searchFocused ? 'shadow-lg' : 'shadow-sm'}`}
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">

              {/* Theme toggle — desktop only (mobile: in hamburger menu) */}
              <button
                onClick={toggleTheme}
                className={`hidden md:flex p-2.5 rounded-xl transition-colors ${
                  darkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Sell — desktop only (mobile: in hamburger menu) */}
              <Link
                to="/sell"
                className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus size={16} />
                Sell Something
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className={`relative p-2 md:p-2.5 rounded-xl transition-colors ${
                  darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ShoppingBag size={20} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <button
                type="button"
                onClick={handleOpenNotifications}
                className={`relative p-2 md:p-2.5 rounded-xl transition-colors ${
                  darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* User avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 p-1 rounded-xl transition-colors ${
                    userDropdownOpen
                      ? darkMode ? 'bg-gray-800' : 'bg-gray-100'
                      : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`hidden md:block transition-transform ${userDropdownOpen ? 'rotate-180' : ''} ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  />
                </button>

                {userDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-52 rounded-xl shadow-lg border backdrop-blur-md ${
                    darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'
                  }`}>
                    <div className="p-2">
                      <div className={`px-3 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`font-medium text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {user?.full_name || 'User'}
                        </p>
                        <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user?.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            darkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <User size={16} />
                          My Profile
                        </Link>

                        <Link
                          to="/my-listings"
                          onClick={() => setUserDropdownOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            darkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Package size={16} />
                          My Listings
                        </Link>

                        <Link
                          to="/purchases"
                          onClick={() => setUserDropdownOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            darkMode ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <ShoppingCart size={16} />
                          Purchases
                        </Link>

                        <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut size={16} />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Mobile menu ── */}
          {mobileMenuOpen && (
            <div className={`md:hidden border-t pb-3 pt-2 space-y-1 ${
              darkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <Link to="/dashboard" onClick={closeMobileMenu} className={navLinkClass}>
                <Home size={18} />
                Home
              </Link>

              <Link to="/browse" onClick={closeMobileMenu} className={navLinkClass}>
                <Search size={18} />
                Browse
              </Link>

              <Link to="/my-listings" onClick={closeMobileMenu} className={navLinkClass}>
                <Package size={18} />
                My Listings
              </Link>

              <Link to="/purchases" onClick={closeMobileMenu} className={navLinkClass}>
                <ShoppingCart size={18} />
                Purchases
              </Link>

              <div className={`border-t pt-2 mt-1 space-y-1 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                {/* Sell CTA */}
                <Link
                  to="/sell"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700"
                >
                  <Plus size={18} />
                  Sell Something
                </Link>

                {/* Theme toggle */}
                <button
                  onClick={() => { toggleTheme(); closeMobileMenu(); }}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  {darkMode ? 'Light mode' : 'Dark mode'}
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <NotificationsDrawer
        darkMode={darkMode}
        isOpen={notificationsOpen}
        notifications={notifications}
        isLoading={notificationsLoading}
        onClose={() => setNotificationsOpen(false)}
        onDismiss={dismissNotification}
        onOpenNotification={openNotification}
      />
    </>
  );
};

export default DashboardNavbar;
