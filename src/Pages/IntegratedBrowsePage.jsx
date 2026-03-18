import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import { 
  Search, Grid, List, ShoppingCart, Star, 
  ChevronLeft, ChevronRight, MapPin, Clock, User, 
  SlidersHorizontal, X, Eye, Loader, ArrowLeft, Package
} from 'lucide-react';
import {
  getAllListings,
  getCategories,
  getCampusLocations,
  getCartItems,
  addToCart,
  viewListing,
  searchListings
} from '../api/dashboardapi';
import { showToast } from '../Services/toastService';

const IntegratedBrowsePage = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams.get('min_price')) || 0, 
    parseInt(searchParams.get('max_price')) || 100000
  ]);
  const [sortBy, setSortBy] = useState(searchParams.get('ordering') || 'newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || 'all');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || 'all');
  
  // Data states
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(12);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Enhanced categories with icons
  const categoryData = [
    { id: 'all', name: 'All Items', icon: '🛍️', count: 0 },
    { id: 'books', name: 'Books & Textbooks', icon: '📚', count: 0 },
    { id: 'electronics', name: 'Electronics', icon: '💻', count: 0 },
    { id: 'clothing', name: 'Clothing & Fashion', icon: '👕', count: 0 },
    { id: 'furniture', name: 'Furniture', icon: '🪑', count: 0 },
    { id: 'sports', name: 'Sports & Recreation', icon: '⚽', count: 0 },
    { id: 'food', name: 'Food & Beverages', icon: '🍕', count: 0 },
    { id: 'services', name: 'Services', icon: '🔧', count: 0 },
    { id: 'other', name: 'Other', icon: '📦', count: 0 }
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'price_low', label: 'Price Low → High' },
    { value: 'price_high', label: 'Price High → Low' },
    { value: 'most_viewed', label: 'Most Viewed' }
  ];

  // Condition options
  const conditions = [
    { value: 'all', label: 'All Conditions' },
    { value: 'new', label: 'Brand New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [categoriesData, locationsData, cartData] = await Promise.all([
          getCategories(),
          getCampusLocations(),
          getCartItems()
        ]);

        setCategories(categoryData);
        setLocations(locationsData);
        setCartItems(cartData);

        await loadListings();
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load listings when filters change
  useEffect(() => {
    if (!isLoading) {
      loadListings();
    }
  }, [searchQuery, selectedCategory, selectedCondition, selectedLocation, priceRange, sortBy, currentPage]);

  const getSortOrderingValue = (sortValue) => {
    switch (sortValue) {
      case 'newest': return '-created_at';
      case 'oldest': return 'created_at';
      case 'price_low': return 'price';
      case 'price_high': return '-price';
      case 'most_viewed': return '-view_count';
      default: return '-created_at';
    }
  };

  const loadListings = async () => {
    setIsLoadingMore(true);
    try {
      const filters = {
        search: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        condition: selectedCondition !== 'all' ? selectedCondition : undefined,
        location: selectedLocation !== 'all' ? selectedLocation : undefined,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 100000 ? priceRange[1] : undefined,
        ordering: getSortOrderingValue(sortBy),
        page: currentPage,
        page_size: itemsPerPage
      };

      const response = await searchListings(filters);
      
      setListings(response.results || []);
      setTotalCount(response.count || 0);
      setTotalPages(Math.ceil((response.count || 0) / itemsPerPage));
      
      // Update URL params
      updateURLParams(filters);
      
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const updateURLParams = (filters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== 'all') {
        params.append(key, value);
      }
    });
    setSearchParams(params);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleAddToCart = async (listing) => {
    try {
      await addToCart(listing.id);
      const updatedCart = await getCartItems();
      setCartItems(updatedCart);
      showToast(`${listing.title} added to cart`, 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Unable to add to cart at the moment', 'error');
    }
  };

  const handleViewListing = async (listingId) => {
    try {
      await viewListing(listingId);
    } catch (error) {
      console.error('Error recording view:', error);
    }
    navigate(`/listings/${listingId}`);
  };

  const isOwner = (sellerId) => user?.id === sellerId;

  const getConditionBadgeColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'new': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'like_new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'good': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'fair': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getContextualHeader = () => {
    if (searchQuery) {
      return `Search results for "${searchQuery}"`;
    }
    if (selectedCategory !== 'all') {
      const category = categoryData.find(cat => cat.id === selectedCategory);
      return `${category?.name || 'Category'} Browse`;
    }
    return 'Browse All Listings';
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading marketplace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <DashboardNavbar 
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartItemsCount={cartItems.length}
      />
      <div className="h-16" />


      {/* Welcome Strip */}
      <div className={`sticky top-16 z-30 border-b ${
        darkMode 
          ? 'bg-gray-900/95 border-gray-800' 
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              onClick={() => navigate('/cart')}>
                <span className="text-sm font-medium">Cart: {cartItems.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Category Filter Pills */}
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              .flex::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {categoryData.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all whitespace-nowrap transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-200'
                }`}
              >
                <span className="text-base">{category.icon}</span>
                <span className="text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Sort Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isLoadingMore ? (
                'Loading...'
              ) : (
                `Showing ${listings.length} of ${totalCount} results`
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-300'
                  : 'bg-white border-gray-200 text-gray-700'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showFilters 
                  ? 'bg-emerald-600 text-white' 
                  : darkMode 
                    ? 'bg-gray-800 text-gray-300 border-gray-700' 
                    : 'bg-white text-gray-700 border-gray-200'
              } border hover:shadow-md`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            {/* View Toggle */}
            <div className={`flex rounded-lg overflow-hidden border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white'
                    : darkMode
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-white text-gray-600'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white'
                    : darkMode
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-white text-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className={`mb-6 p-6 rounded-xl border ${
            darkMode 
              ? 'bg-gray-800/80 border-gray-700' 
              : 'bg-white/90 border-gray-200'
          } backdrop-blur-md`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Price Range */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Price Range (KSh)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0] || ''}
                    onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-900 border-gray-200'
                    } border focus:ring-2 focus:ring-emerald-500`}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1] === 100000 ? '' : priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 100000])}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-900 border-gray-200'
                    } border focus:ring-2 focus:ring-emerald-500`}
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Condition
                </label>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-white text-gray-900 border-gray-200'
                  } border focus:ring-2 focus:ring-emerald-500`}
                >
                  {conditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Pickup Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-white text-gray-900 border-gray-200'
                  } border focus:ring-2 focus:ring-emerald-500`}
                >
                  <option value="all">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Apply Button */}
              <div className="flex items-end">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-colors font-medium text-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(selectedCategory !== 'all' || selectedCondition !== 'all' || selectedLocation !== 'all') && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategory !== 'all' && (
              <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <span>{categoryData.find(c => c.id === selectedCategory)?.name}</span>
                <button onClick={() => setSelectedCategory('all')} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCondition !== 'all' && (
              <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <span>{conditions.find(c => c.value === selectedCondition)?.label}</span>
                <button onClick={() => setSelectedCondition('all')} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedLocation !== 'all' && (
              <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <span>{locations.find(l => l.id === selectedLocation)?.name}</span>
                <button onClick={() => setSelectedLocation('all')} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedCondition('all');
                setSelectedLocation('all');
              }}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Main Content */}
        <div>
          {/* Section Header */}
          <div className="mb-6">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {getContextualHeader()}
            </h2>
          </div>

          {/* Loading State */}
          {isLoadingMore && (
            <div className="flex justify-center items-center h-32">
              <Loader className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          )}

          {/* Listings Grid/List */}
          {!isLoadingMore && (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-4'
            }>
              {listings.map(item => (
                <div
                  key={item.id}
                  className={`${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 ${
                    viewMode === 'list' ? 'flex' : ''
                  } ${item.is_sold ? 'opacity-60 saturate-50 cursor-not-allowed' : ''}`}
                  onClick={!item.is_sold ? () => handleViewListing(item.id) : undefined}
                >
                  {/* SOLD Ribbon */}
                  {item.is_sold && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10 transform -rotate-12">
                      SOLD
                    </div>
                  )}

                  <div className={`relative ${viewMode === 'list' ? 'w-48' : ''}`}>
                    <img
                      src={item.images?.[0]?.image || '/placeholder.jpg'}
                      alt={item.title}
                      className={`${
                        viewMode === 'grid' 
                          ? 'w-full h-48' 
                          : 'w-48 h-full'
                      } object-cover rounded-t-xl ${viewMode === 'list' ? 'rounded-l-xl rounded-t-none' : ''}`}
                    />
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        darkMode ? 'bg-gray-900/80 text-gray-200' : 'bg-white/90 text-gray-700'
                      } backdrop-blur-sm`}>
                        {categoryData.find(cat => cat.id === item.category)?.icon} {item.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    {/* Posted Time */}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`font-semibold mb-2 line-clamp-2 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h3>

                    {/* Description (List view only) */}
                    {viewMode === 'list' && (
                      <p className={`text-sm mb-3 line-clamp-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {item.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mb-3">
                      <span className="text-xl font-bold text-emerald-600">
                        KSh {item.price?.toLocaleString() || 'Negotiable'}
                      </span>
                      {item.negotiable && (
                        <span className={`ml-2 text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          (Negotiable)
                        </span>
                      )}
                    </div>

                    {/* Condition Badge */}
                    {item.condition && (
                      <div className="mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getConditionBadgeColor(item.condition)
                        }`}>
                          {item.condition}
                        </span>
                      </div>
                    )}

                    {/* Seller Info */}
                    <div className={`flex items-center justify-between mb-3 pb-3 border-b ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {item.seller?.full_name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <span className={`text-sm font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {item.seller?.full_name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.seller?.rating || '4.5'}
                        </span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className={`flex items-center justify-between mb-3 text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{item.location?.name || 'Campus'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{item.view_count || 0}</span>
                      </span>
                    </div>

                    {/* Action Button */}
                    {!isOwner(item.seller?.id) && !item.is_sold && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        className="w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-colors font-medium text-sm"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoadingMore && listings.length === 0 && (
            <div className="text-center py-12">
              <Package className={`w-24 h-24 mx-auto mb-4 ${
                darkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className={`text-xl font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                No listings found
              </h3>
              <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Try adjusting your filters or search query
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedCondition('all');
                  setSelectedLocation('all');
                  setPriceRange([0, 100000]);
                }}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {!isLoadingMore && listings.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${
                  currentPage === 1
                    ? darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                } transition-colors`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                const pageNumber = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
                if (pageNumber > totalPages) return null;
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === pageNumber
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white'
                        : darkMode
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${
                  currentPage === totalPages
                    ? darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                } transition-colors`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegratedBrowsePage;
