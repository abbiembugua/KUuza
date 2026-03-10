import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import {
  ShoppingCart, TrendingUp, Package, Eye, Loader,
  Star, MapPin, ArrowRight, Plus, ChevronRight,
  BookOpen, Laptop, Shirt, Armchair, Dumbbell,
  Pizza, Wrench, Box, ShoppingBag
} from 'lucide-react';
import {
  getAllListings,
  getTrendingListings,
  getRecentListings,
  getCartItems,
  getCategories,
  getCampusLocations,
  addToCart,
  viewListing,
} from '../api/dashboardapi';
import { showToast } from '../Services/toastService';

const IntegratedDashboard = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [trendingListings, setTrendingListings] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const categoryData = [
    { id: 'books', name: 'Books', icon: '📚', lucide: BookOpen, color: 'from-amber-400 to-orange-500' },
    { id: 'electronics', name: 'Electronics', icon: '💻', lucide: Laptop, color: 'from-blue-400 to-blue-600' },
    { id: 'clothing', name: 'Clothing', icon: '👕', lucide: Shirt, color: 'from-pink-400 to-rose-500' },
    { id: 'furniture', name: 'Furniture', icon: '🪑', lucide: Armchair, color: 'from-emerald-400 to-emerald-600' },
    { id: 'sports', name: 'Sports', icon: '⚽', lucide: Dumbbell, color: 'from-violet-400 to-purple-600' },
    { id: 'food', name: 'Food', icon: '🍕', lucide: Pizza, color: 'from-red-400 to-red-600' },
    { id: 'services', name: 'Services', icon: '🔧', lucide: Wrench, color: 'from-teal-400 to-teal-600' },
    { id: 'other', name: 'Other', icon: '📦', lucide: Box, color: 'from-gray-400 to-gray-600' },
  ];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [cartData, trendingData, recentData, allData] = await Promise.all([
          getCartItems(),
          getTrendingListings().catch(() => []),
          getRecentListings().catch(() => []),
          getAllListings({ page_size: 50 }).catch(() => []),
        ]);

        setCartItems(cartData || []);

        const trending = Array.isArray(trendingData)
          ? trendingData
          : trendingData?.results || [];
        setTrendingListings(trending.slice(0, 10));

        const recent = Array.isArray(recentData)
          ? recentData
          : recentData?.results || [];
        setRecentListings(recent.slice(0, 10));

        const all = Array.isArray(allData) ? allData : allData?.results || [];
        const mine = all.filter(item => item.seller?.id === user?.id);
        setMyListings(mine);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleAddToCart = async (e, listing) => {
    e.stopPropagation();
    try {
      await addToCart(listing.id);
      const updatedCart = await getCartItems();
      setCartItems(updatedCart);
      showToast(`${listing.title} added to cart`, 'success');
    } catch (error) {
      showToast('Unable to add to cart at the moment', 'error');
    }
  };

  const handleViewListing = async (listingId) => {
    try { await viewListing(listingId); } catch {}
    navigate(`/listing/${listingId}`);
  };

  const stats = [
    {
      label: 'Cart Items',
      value: cartItems.length,
      icon: ShoppingCart,
      gradient: 'from-emerald-500 to-emerald-600',
      bg: darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50',
      text: 'text-emerald-600',
      link: '/cart'
    },
    {
      label: 'My Listings',
      value: myListings.length,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50',
      text: 'text-blue-600',
      link: '/my-listings'
    },
    {
      label: 'Items Sold',
      value: myListings.filter(l => l.is_sold).length,
      icon: TrendingUp,
      gradient: 'from-violet-500 to-violet-600',
      bg: darkMode ? 'bg-violet-900/30' : 'bg-violet-50',
      text: 'text-violet-600',
      link: '/my-listings'
    },
    {
      label: 'Purchases',
      value: 0,
      icon: ShoppingBag,
      gradient: 'from-orange-500 to-orange-600',
      bg: darkMode ? 'bg-orange-900/30' : 'bg-orange-50',
      text: 'text-orange-600',
      link: '/purchases'
    },
  ];

  const quickActions = [
    {
      label: 'Sell Something',
      description: 'List an item for sale',
      icon: Plus,
      gradient: 'from-emerald-500 to-emerald-700',
      link: '/sell'
    },
    {
      label: 'My Listings',
      description: 'Manage your active listings',
      icon: Package,
      gradient: 'from-blue-500 to-blue-700',
      link: '/my-listings'
    },
    {
      label: 'My Purchases',
      description: 'View your order history',
      icon: ShoppingBag,
      gradient: 'from-violet-500 to-violet-700',
      link: '/purchases'
    },
  ];

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <DashboardNavbar
        onSearch={(q) => navigate(`/browse?search=${q}`)}
        searchQuery=""
        setSearchQuery={() => {}}
        cartItemsCount={cartItems.length}
      />

      <div className="h-16" />

      {/* Hero Welcome Section */}
      <div className={`relative overflow-hidden ${
        darkMode
          ? 'bg-gradient-to-r from-gray-900 via-emerald-950 to-gray-900'
          : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500'
      }`}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 bg-white transform translate-x-20 -translate-y-20" />
        <div className="absolute bottom-0 left-16 w-48 h-48 rounded-full opacity-10 bg-white transform translate-y-12" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-5 bg-white" />

        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-200 text-sm font-medium mb-1 opacity-90">
                {new Date().toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-3xl font-bold text-white mb-1">
                Hey, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
              </h1>
              <p className="text-emerald-100 text-sm opacity-80">
                Discover great deals from your campus community
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl cursor-pointer transition-all text-white font-medium"
                onClick={() => navigate('/cart')}
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-sm">Cart ({cartItems.length})</span>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                onClick={() => navigate(stat.link)}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} 
                  border rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.text}`} />
                  </div>
                  <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
                <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stat.value}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.link)}
                  className={`flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl bg-gradient-to-r ${action.gradient} text-white shadow-lg`}
                >
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-base">{action.label}</p>
                    <p className="text-sm opacity-75">{action.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto opacity-70" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Browse by Category */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Browse by Category
            </h2>
            <button
              onClick={() => navigate('/browse')}
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {categoryData.map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/browse?category=${cat.id}`)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg ${
                  darkMode
                    ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700'
                    : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-lg shadow-md`}>
                  {cat.icon}
                </div>
                <span className={`text-xs font-medium text-center leading-tight ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending Now */}
        <HorizontalScrollSection
          title="🔥 Trending on Campus"
          listings={trendingListings}
          darkMode={darkMode}
          onView={handleViewListing}
          onAddToCart={handleAddToCart}
          onViewAll={() => navigate('/browse?ordering=most_viewed')}
          emptyMessage="No trending listings yet"
        />

        {/* Recently Listed */}
        <HorizontalScrollSection
          title="🆕 Just Listed"
          listings={recentListings}
          darkMode={darkMode}
          onView={handleViewListing}
          onAddToCart={handleAddToCart}
          onViewAll={() => navigate('/browse?ordering=newest')}
          emptyMessage="No recent listings yet"
        />

        {/* My Active Listings */}
        {myListings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📦 Your Active Listings
              </h2>
              <button
                onClick={() => navigate('/my-listings')}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Manage all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {myListings.slice(0, 4).map(item => (
                <div
                  key={item.id}
                  onClick={() => handleViewListing(item.id)}
                  className={`rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
                  }`}
                >
                  <div className="relative h-32">
                    <img
                      src={item.images?.[0]?.image || '/placeholder.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.is_sold && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-sm bg-red-600 px-2 py-1 rounded-full">SOLD</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className={`text-sm font-semibold line-clamp-1 mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.title}
                    </p>
                    <p className="text-emerald-600 font-bold text-sm">KSh {item.price?.toLocaleString()}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Eye className="w-3 h-3" />
                      {item.view_count || 0} views
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* Horizontal Scroll Section Component */
const HorizontalScrollSection = ({ title, listings, darkMode, onView, onAddToCart, onViewAll, emptyMessage }) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
      <button
        onClick={onViewAll}
        className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
      >
        View all <ArrowRight className="w-4 h-4" />
      </button>
    </div>

    {listings.length === 0 ? (
      <div className={`text-center py-8 rounded-2xl border-2 border-dashed ${
        darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
      }`}>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    ) : (
      <div
        className="flex gap-4 overflow-x-auto pb-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {listings.map(item => (
          <div
            key={item.id}
            onClick={() => onView(item.id)}
            className={`flex-shrink-0 w-44 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
            }`}
          >
            <div className="relative h-36">
              <img
                src={item.images?.[0]?.image || '/placeholder.jpg'}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              {item.is_sold && (
                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  SOLD
                </div>
              )}
            </div>
            <div className="p-3">
              <p className={`text-xs font-semibold line-clamp-2 mb-1.5 leading-snug ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {item.title}
              </p>
              <p className="text-emerald-600 font-bold text-sm mb-2">
                KSh {item.price?.toLocaleString() || 'Neg.'}
              </p>
              <div className={`flex items-center gap-1 mb-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="w-4 h-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs" style={{ fontSize: '8px' }}>
                    {item.seller?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="truncate">{item.seller?.full_name?.split(' ')[0] || 'Seller'}</span>
                <Star className="w-3 h-3 text-yellow-500 fill-current ml-auto flex-shrink-0" />
              </div>
              {!item.is_sold && (
                <button
                  onClick={(e) => onAddToCart(e, item)}
                  className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg text-xs font-medium transition-all"
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default IntegratedDashboard;