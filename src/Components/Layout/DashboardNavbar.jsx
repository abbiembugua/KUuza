// Components/Layout/DashboardNavbar.jsx
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
  Plus, Sun, Moon
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

  
  const [searchFocused, setSearchFocused] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  const handleSearch = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchQuery);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    logout();
  };

  const dismissNotification = async (notificationId) => {
    try {
      await dismissNotificationApi(notificationId);
      setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
    } catch (error) {
      console.error('Unable to dismiss notification', error);
    }
  };

  const downloadReceiptFromNotification = async (notification) => {
    const response = await fetch(`${API_BASE}/transactions/${notification.transaction_id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Unable to load receipt details');
    }

    const transaction = await response.json();

    generateReceipt({
      listing: {
        id: transaction.listing,
        title: transaction.listing_title,
        seller_name: transaction.seller_name,
        listing_type: transaction.listing_type,
        price: transaction.agreed_price,
      },
      transaction,
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

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 border-b ${
        darkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
      } backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">

          {/* Logo Section - Farthest Left */}
          <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <ShoppingBag className={`w-6 h-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                KU<span className="text-emerald-500">uza</span>
              </h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Kenyatta University Official Marketplace
              </p>
            </div>
          </Link>

          {/* Navigation Links - Moved after logo */}
          <div className="hidden md:flex items-center gap-6 ml-8">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home size={18} />
              Home
            </Link>
            
            <Link
              to="/browse"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Search size={18} />
              Browse
            </Link>
          </div>

          {/* Center Search Bar */}
          <div className="flex-1 max-w-md mx-6">
            <div className={`relative transition-all duration-200 ${
              searchFocused ? 'transform scale-105' : ''
            }`}>
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search items, books, services..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  darkMode
                    ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-700 focus:border-emerald-500'
                    : 'bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-200 focus:border-emerald-500'
                } border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                  searchFocused ? 'shadow-lg' : 'shadow-sm'
                }`}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
    onClick={toggleTheme}
    className={`p-2.5 rounded-xl transition-colors ${
      darkMode
        ? 'text-yellow-400 hover:bg-gray-800'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
  </button>
            
            {/* Sell Something Button */}
            <Link
              to="/sell"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Sell Something</span>
              <span className="sm:hidden">Sell</span>
            </Link>

            {/* Shopping Cart */}
            <Link
              to="/cart"
              className={`relative p-2.5 rounded-xl transition-colors ${
                darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag size={20} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={handleOpenNotifications}
              className={`relative p-2.5 rounded-xl transition-colors ${
                darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* User Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center gap-2 p-1 rounded-xl transition-colors ${
                  userDropdownOpen
                    ? darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <ChevronDown size={16} className={`transition-transform ${
                  userDropdownOpen ? 'rotate-180' : ''
                } ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border backdrop-blur-md ${
                  darkMode
                    ? 'bg-gray-900/95 border-gray-700'
                    : 'bg-white/95 border-gray-200'
                }`}>
                  <div className="p-2">
                    {/* User Info */}
                    <div className={`px-3 py-2 border-b ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <p className={`font-medium text-sm ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user?.full_name || 'User'}
                      </p>
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {user?.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          darkMode
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <User size={16} />
                        My Profile
                      </Link>

                      <Link
                        to="/my-listings"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          darkMode
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Package size={16} />
                        My Listings
                      </Link>

                      <Link
                        to="/purchases"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          darkMode
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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
