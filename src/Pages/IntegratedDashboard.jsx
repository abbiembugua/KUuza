import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import {
  DashboardHero,
  StatsStrip,
  CategoryGrid,
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

      <DashboardHero darkMode={darkMode} user={user} />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        <StatsStrip
          darkMode={darkMode}
          isLoading={isLoading}
          cartCount={cartItems.length}
          myListingsCount={myListings.length}
          soldCount={soldItems.length}
          purchasesCount={purchases.length}
        />

        <CategoryGrid darkMode={darkMode} />

        <HorizontalScrollSection
          title="🔥 Trending on Campus"
          listings={trendingListings}
          isLoading={isLoading}
          darkMode={darkMode}
          onView={handleViewListing}
          onViewAll={() => navigate('/browse?ordering=most_viewed')}
          emptyMessage="No trending listings yet"
        />

        <HorizontalScrollSection
          title="🆕 Just Listed"
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
  );
};

export default IntegratedDashboard;