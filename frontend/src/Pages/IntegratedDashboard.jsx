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
  const [cartItems, setCartItems] = useState([]);
  const [trendingListings, setTrendingListings] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [soldItems, setSoldItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
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
        setLoading(false);
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

        <div>
          <StatsStrip
            darkMode={darkMode}
            cartCount={cartItems.length}
            myListingsCount={myListings.length}
            soldCount={soldItems.length}
            purchasesCount={purchases.length}
          />
        </div>

        {/* Explore KUuza */}
        <div>
          <button
            onClick={() => navigate('/browse')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
              darkMode
                ? 'bg-gray-800 border-gray-600 text-gray-200 hover:border-emerald-500 hover:text-emerald-400'
                : 'bg-white border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600'
            }`}
          >
            Explore KUuza →
          </button>

        </div>

        <div className="space-y-5">
          <HorizontalScrollSection
            title="Trending on Campus"
            listings={trendingListings}
            darkMode={darkMode}
            onView={handleViewListing}
            onViewAll={() => navigate('/browse?ordering=most_viewed')}
            emptyMessage="No trending listings yet"
            loading={loading}
          />

          <HorizontalScrollSection
            title="Just Listed"
            listings={recentListings}
            darkMode={darkMode}
            onView={handleViewListing}
            onViewAll={() => navigate('/browse?ordering=newest')}
            emptyMessage="No recent listings yet"
            loading={loading}
          />

          <MyListingsPreview
            listings={myListings}
            darkMode={darkMode}
            onView={handleViewListing}
          />
        </div>

      </div>
    </div>
  );
};

export default IntegratedDashboard;