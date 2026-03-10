import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/Themecontext';
import { 
  Home, Search, ShoppingCart, User, Plus,
  Grid, Heart, Package, Settings, LogOut, ShoppingBag, Bell, MessageCircle
} from 'lucide-react';

const MobileNavBar = ({ cartItemsCount = 0 }) => {
  const { darkMode } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: Home, 
      path: '/dashboard',
      activeColor: 'text-emerald-500'
    },
    { 
      id: 'browse', 
      label: 'Browse', 
      icon: Search, 
      path: '/browse',
      activeColor: 'text-emerald-500'
    },
    { 
      id: 'create', 
      label: 'Sell', 
      icon: Plus, 
      path: null,
      activeColor: 'text-emerald-500',
      special: true
    },
    { 
      id: 'cart', 
      label: 'Cart', 
      icon: ShoppingCart, 
      path: '/cart',
      activeColor: 'text-emerald-500',
      badge: cartItemsCount
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User, 
      path: '/profile',
      activeColor: 'text-emerald-500'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavClick = (item) => {
    if (item.special) {
      setShowCreateOptions(!showCreateOptions);
    } else {
      navigate(item.path);
    }
  };

  // Don't render anything if not on mobile
  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Bottom Navigation - Only shows on mobile */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      } border-t`}>
        <div className="flex justify-around items-center py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = item.path && isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`flex flex-col items-center justify-center p-2 relative transition-all ${
                  item.special 
                    ? 'transform hover:scale-110' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg'
                }`}
              >
                {item.special ? (
                  // Special Sell Button with KUuza color scheme
                  <div className="relative">
                    <div className={`p-3 rounded-full ${
                      showCreateOptions
                        ? 'bg-emerald-500 rotate-45'
                        : 'bg-emerald-500'
                    } shadow-lg transition-all duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Icon className={`w-6 h-6 ${
                        active 
                          ? item.activeColor
                          : darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                      {item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${
                      active 
                        ? item.activeColor
                        : darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item.label}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Create Options Popup */}
        {showCreateOptions && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowCreateOptions(false)}
            />
            <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-2xl shadow-2xl p-4 z-50 min-w-[200px]`}>
              <button
                onClick={() => {
                  navigate('/sell');
                  setShowCreateOptions(false);
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <div className={`p-1.5 rounded-md ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                  <Package className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="font-medium">Sell Item</span>
              </button>
              <button
                onClick={() => {
                  navigate('/needs');
                  setShowCreateOptions(false);
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <div className={`p-1.5 rounded-md ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                  <Search className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="font-medium">Post Need</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Spacer to prevent content from going under nav */}
      <div className="h-16"></div>

      {/* Optional: Desktop version removed since we only want mobile */}
    </>
  );
};

export default MobileNavBar;