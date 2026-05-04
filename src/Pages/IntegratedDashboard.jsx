import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import {
  DashboardHero,
  StatsStrip,
  HorizontalScrollSection,
  MyListingsPreview,
} from '../Components/Dashboard';
import {
  getTrendingListings,
  getRecentListings,
  getCartItems,
  getMyTransactions,
  getMyAllListings,
  viewListing,
} from '../api/dashboardapi';

const IntegratedDashboard = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [exploreOpen, setExploreOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [trendingListings, setTrendingListings] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [cartData, trendingData, recentData, transactionsData, myAllListingsData] =
          await Promise.all([
            getCartItems(),
            getTrendingListings().catch(() => []),
            getRecentListings().catch(() => []),
            getMyTransactions().catch(() => []),
            getMyAllListings().catch(() => []),
          ]);

        setCartItems(cartData || []);

        // Transactions → purchases / sales
        const transactions = Array.isArray(transactionsData)
          ? transactionsData
          : transactionsData?.results || [];
        setPurchases(transactions.filter((t) => t.buyer === user.id));
        setSoldItems(
          transactions.filter(
            (t) => t.seller === user.id && ['completed', 'auto_completed'].includes(t.status)
          )
        );

        const toArray = (d) => (Array.isArray(d) ? d : d?.results || []);
        setTrendingListings(toArray(trendingData).slice(0, 10));
        setRecentListings(toArray(recentData).slice(0, 10));
        setMyListings(toArray(myAllListingsData));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleViewListing = async (listingId) => {
    try { await viewListing(listingId); } catch {}
    navigate(`/listings/${listingId}`);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <DashboardNavbar
        onSearch={(q) => navigate(`/browse?search=${encodeURIComponent(q)}`)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartItemsCount={cartItems.length}
      />

      <div className="h-16" />

      <DashboardHero darkMode={darkMode} user={user} cartCount={cartItems.length} />

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-12 space-y-6">

        {/* At a glance tag + stats */}
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 ${
            darkMode
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            At a glance
          </span>
          <StatsStrip
            darkMode={darkMode}
            isLoading={isLoading}
            cartCount={cartItems.length}
            myListingsCount={myListings.length}
            soldCount={soldItems.length}
            purchasesCount={purchases.length}
          />
        </div>

        {/* Explore KUuza */}
        <div>
          <button
            onClick={() => setExploreOpen(o => !o)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
              exploreOpen
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : darkMode
                  ? 'bg-gray-800 border-gray-600 text-gray-200 hover:border-emerald-500 hover:text-emerald-400'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600'
            }`}
          >
            Explore KUuza
            <span className={`text-base leading-none transition-transform duration-200 ${exploreOpen ? 'rotate-180 inline-block' : ''}`}>
              ↓
            </span>
          </button>

          {exploreOpen && (
            <div className="flex flex-wrap gap-2.5 mt-3">
              {[
                { id: 'all',            label: 'All listings'   },
                { id: 'books',          label: 'Books'          },
                { id: 'electronics',    label: 'Electronics'    },
                { id: 'fashion',        label: 'Fashion'        },
                { id: 'furniture',      label: 'Furniture'      },
                { id: 'food_beverages', label: 'Food'           },
                { id: 'beauty',         label: 'Beauty'         },
                { id: 'other',          label: 'Other'          },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.id === 'all' ? '/browse' : `/browse?category=${cat.id}`)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-150 ${
                    darkMode
                      ? 'bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400'
                      : 'bg-transparent border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <HorizontalScrollSection
            title="Trending on Campus"
            listings={trendingListings}
            isLoading={isLoading}
            darkMode={darkMode}
            onView={handleViewListing}
            onViewAll={() => navigate('/browse?ordering=most_viewed')}
            emptyMessage="No trending listings yet"
          />

          <HorizontalScrollSection
            title="Just Listed"
            listings={recentListings}
            isLoading={isLoading}
            darkMode={darkMode}
            onView={handleViewListing}
            onViewAll={() => navigate('/browse?ordering=newest')}
            emptyMessage="No recent listings yet"
          />

          {!isLoading && (
            <MyListingsPreview
              listings={myListings}
              darkMode={darkMode}
              onView={handleViewListing}
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default IntegratedDashboard;