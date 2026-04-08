import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import BackButton from '../Components/shared/BackButton';
import SellerRow from '../Components/shared/SellerRow';
import {
  Grid, List, ChevronLeft, ChevronRight,
  MapPin, SlidersHorizontal, X, Eye, Loader, Package
} from 'lucide-react';
import {
  getCartItems, addToCart, viewListing, searchListings
} from '../api/dashboardapi';
import { showToast } from '../Services/toastService';

const CATEGORY_OPTIONS = [
  { id: 'all',            name: 'All Items',           shortLabel: 'All'         },
  { id: 'books',          name: 'Books & Textbooks',   shortLabel: 'Books'       },
  { id: 'electronics',    name: 'Electronics',         shortLabel: 'Electronics' },
  { id: 'fashion',        name: 'Clothing & Fashion',  shortLabel: 'Fashion'     },
  { id: 'furniture',      name: 'Furniture',           shortLabel: 'Furniture'   },
  { id: 'food_beverages', name: 'Food & Beverages',    shortLabel: 'Food'        },
  { id: 'beauty',         name: 'Beauty',              shortLabel: 'Beauty'      },
  { id: 'other',          name: 'Other',               shortLabel: 'Other'       },
];

const CONDITION_OPTIONS = [
  { value: 'all',      label: 'All Conditions' },
  { value: 'new',      label: 'Brand New'      },
  { value: 'like_new', label: 'Like New'       },
  { value: 'used',     label: 'Used'           },
  { value: 'fair',     label: 'Fair'           },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest'              },
  { value: 'oldest',     label: 'Oldest'              },
  { value: 'price_low',  label: 'Price Low to High'   },
  { value: 'price_high', label: 'Price High to Low'   },
  { value: 'most_viewed',label: 'Most Viewed'         },
];

const normalizeSortParam = (p) => {
  switch (p) {
    case 'oldest':    case 'created_at':   return 'oldest';
    case 'price_low': case 'price':        return 'price_low';
    case 'price_high':case '-price':       return 'price_high';
    case 'most_viewed':case '-views_count':return 'most_viewed';
    default:                               return 'newest';
  }
};

const getSortOrderingValue = (s) => {
  switch (s) {
    case 'oldest':     return 'created_at';
    case 'price_low':  return 'price';
    case 'price_high': return '-price';
    case 'most_viewed':return '-views_count';
    default:           return '-created_at';
  }
};

const getConditionBadgeColor = (condition) => {
  switch (condition?.toLowerCase()) {
    case 'new':      return 'bg-green-100 text-green-800';
    case 'like_new': return 'bg-blue-100 text-blue-800';
    case 'used':     return 'bg-yellow-100 text-yellow-800';
    case 'fair':     return 'bg-orange-100 text-orange-800';
    default:         return 'bg-gray-100 text-gray-800';
  }
};

const ITEMS_PER_PAGE = 12;

const IntegratedBrowsePage = () => {
  const { darkMode } = useTheme();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode,             setViewMode]             = useState('grid');
  const [searchQuery,          setSearchQuery]          = useState(searchParams.get('search') || '');
  const [selectedCategory,     setSelectedCategory]     = useState(searchParams.get('category') || 'all');
  const [selectedListingType,  setSelectedListingType]  = useState(searchParams.get('listing_type') || 'all');
  const [selectedCondition,    setSelectedCondition]    = useState(searchParams.get('condition') || 'all');
  const [priceRange,           setPriceRange]           = useState([
    parseInt(searchParams.get('min_price') || '0', 10)      || 0,
    parseInt(searchParams.get('max_price') || '100000', 10) || 100000,
  ]);
  const [sortBy,       setSortBy]       = useState(normalizeSortParam(searchParams.get('ordering')));
  const [showFilters,  setShowFilters]  = useState(false);

  const [listings,      setListings]      = useState([]);
  const [cartItems,     setCartItems]     = useState([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [currentPage,   setCurrentPage]   = useState(parseInt(searchParams.get('page') || '1', 10) || 1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalCount,    setTotalCount]    = useState(0);

  // Load cart once on mount
  useEffect(() => {
    getCartItems().then(data => setCartItems(data || [])).catch(() => {});
  }, []);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedListingType, selectedCondition, priceRange, sortBy]);

  // Fetch listings whenever page or filters change
  useEffect(() => {
    loadListings();
  }, [currentPage, searchQuery, selectedCategory, selectedListingType, selectedCondition, priceRange, sortBy]);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const filters = {
        search:       searchQuery || undefined,
        category:     selectedCategory     !== 'all' ? selectedCategory     : undefined,
        listing_type: selectedListingType  !== 'all' ? selectedListingType  : undefined,
        condition:    selectedListingType === 'service' || selectedCondition === 'all'
                        ? undefined : selectedCondition,
        min_price:    priceRange[0] > 0       ? priceRange[0] : undefined,
        max_price:    priceRange[1] < 100000  ? priceRange[1] : undefined,
        ordering:     getSortOrderingValue(sortBy),
        page:         currentPage,
        page_size:    ITEMS_PER_PAGE,
      };

      const response = await searchListings(filters);
      setListings(response.results || []);
      setTotalCount(response.count || 0);
      setTotalPages(Math.max(1, Math.ceil((response.count || 0) / ITEMS_PER_PAGE)));

      // Sync URL params
      const params = new URLSearchParams();
      if (searchQuery)                                           params.set('search',       searchQuery);
      if (selectedCategory     !== 'all')                        params.set('category',      selectedCategory);
      if (selectedListingType  !== 'all')                        params.set('listing_type',  selectedListingType);
      if (selectedListingType  !== 'service' && selectedCondition !== 'all')
                                                                 params.set('condition',     selectedCondition);
      if (priceRange[0] > 0)      params.set('min_price', String(priceRange[0]));
      if (priceRange[1] < 100000) params.set('max_price', String(priceRange[1]));
      if (sortBy !== 'newest')    params.set('ordering',  sortBy);
      if (currentPage > 1)        params.set('page',      String(currentPage));
      setSearchParams(params);
    } catch (err) {
      console.error('Error loading listings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange    = (v) => { setSelectedCategory(v);    };
  const handleListingTypeChange = (v) => { setSelectedListingType(v); if (v === 'service') setSelectedCondition('all'); };
  const handleConditionChange   = (v) => { setSelectedCondition(v);   };
  const handlePriceChange       = (v) => { setPriceRange(v);          };
  const handleSortChange        = (v) => { setSortBy(v);              };
  const handleSearch            = (v) => { setSearchQuery(v);         };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedListingType('all');
    setSelectedCondition('all');
    setPriceRange([0, 100000]);
    setSortBy('newest');
  };

  const handleAddToCart = async (listing) => {
    try {
      await addToCart(listing.id);
      const updated = await getCartItems();
      setCartItems(updated);
      showToast(`${listing.title} added to cart`, 'success');
    } catch {
      showToast('Unable to add to cart', 'error');
    }
  };

  const handleViewListing = async (listingId) => {
    try { await viewListing(listingId); } catch {}
    navigate(`/listings/${listingId}`);
  };

  const isOwner = (sellerId) => user?.id === sellerId;

  const getContextualHeader = () => {
    if (searchQuery) return `Search results for "${searchQuery}"`;
    if (selectedListingType === 'service') return 'Browse Services';
    if (selectedCategory !== 'all') {
      const cat = CATEGORY_OPTIONS.find(c => c.id === selectedCategory);
      return `${cat?.name || 'Category'} Browse`;
    }
    return 'Browse All Listings';
  };

  const hasActiveFilters =
    selectedCategory !== 'all' || selectedListingType !== 'all' ||
    selectedCondition !== 'all' || priceRange[0] > 0 || priceRange[1] < 100000;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <DashboardNavbar
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartItemsCount={cartItems.length}
      />
      <div className="h-16" />

      {/* Sticky sub-header */}
      <div className={`sticky top-16 z-30 border-b ${
        darkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
      } backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <BackButton darkMode={darkMode} label="Back" onClick={() => navigate(-1)} className="px-3 py-1.5 shadow-none" />
          <div
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => navigate('/cart')}
          >
            Cart: {cartItems.length}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Category pills */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          {CATEGORY_OPTIONS.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                  : darkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-200'
              }`}
            >
              {cat.shortLabel}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isLoading ? 'Loading...' : `Showing ${listings.length} of ${totalCount} results`}
          </p>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={e => handleSortChange(e.target.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all hover:shadow-md ${
                showFilters
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : darkMode
                    ? 'bg-gray-800 text-gray-300 border-gray-700'
                    : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            <div className={`flex rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {['grid', 'list'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 transition-colors ${
                    viewMode === mode
                      ? 'bg-emerald-600 text-white'
                      : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
                  }`}
                >
                  {mode === 'grid' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className={`mb-6 p-6 rounded-xl border backdrop-blur-md ${
            darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Listing Type</label>
                <select
                  value={selectedListingType}
                  onChange={e => handleListingTypeChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 ${
                    darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-200'
                  }`}
                >
                  <option value="all">All Types</option>
                  <option value="good">Goods</option>
                  <option value="service">Services</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Condition</label>
                <select
                  value={selectedCondition}
                  onChange={e => handleConditionChange(e.target.value)}
                  disabled={selectedListingType === 'service'}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 ${
                    darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-200'
                  }`}
                >
                  {CONDITION_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Price Range (KSh)</label>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="Min"
                    value={priceRange[0] || ''}
                    onChange={e => handlePriceChange([Number(e.target.value) || 0, priceRange[1]])}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 ${
                      darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-200'
                    }`}
                  />
                  <input
                    type="number" placeholder="Max"
                    value={priceRange[1] === 100000 ? '' : priceRange[1]}
                    onChange={e => handlePriceChange([priceRange[0], Number(e.target.value) || 100000])}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-emerald-500 ${
                      darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-200'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategory !== 'all' && (
              <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-100 text-emerald-700'}`}>
                {CATEGORY_OPTIONS.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => handleCategoryChange('all')} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedListingType !== 'all' && (
              <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-100 text-emerald-700'}`}>
                {selectedListingType === 'service' ? 'Services' : 'Goods'}
                <button onClick={() => handleListingTypeChange('all')} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedCondition !== 'all' && selectedListingType !== 'service' && (
              <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-100 text-emerald-700'}`}>
                {CONDITION_OPTIONS.find(c => c.value === selectedCondition)?.label}
                <button onClick={() => handleConditionChange('all')} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            )}
            {priceRange[0] > 0 && (
              <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-100 text-emerald-700'}`}>
                Min KSh {priceRange[0].toLocaleString()}
                <button onClick={() => handlePriceChange([0, priceRange[1]])} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            )}
            {priceRange[1] < 100000 && (
              <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-100 text-emerald-700'}`}>
                Max KSh {priceRange[1].toLocaleString()}
                <button onClick={() => handlePriceChange([priceRange[0], 100000])} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={resetFilters} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Clear all</button>
          </div>
        )}

        {/* Header */}
        <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {getContextualHeader()}
        </h2>

        {/* Loading spinner (initial load) */}
        {isLoading && listings.length === 0 && (
          <div className="flex justify-center items-center h-32">
            <Loader className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        )}

        {/* Listings grid/list */}
        {listings.length > 0 && (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {listings.map(item => (
              <div
                key={item.id}
                onClick={() => handleViewListing(item.id)}
                className={`relative rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 ${
                  viewMode === 'list' ? 'flex' : ''
                } ${darkMode ? 'bg-gray-800' : 'bg-white'} ${
                  item.status === 'sold' ? 'opacity-60 saturate-50 pointer-events-none' : ''
                }`}
              >
                {item.status === 'sold' && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10 -rotate-12">
                    SOLD
                  </div>
                )}

                {/* Image */}
                <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                  <img
                    src={item.images?.[0]?.image || '/placeholder.jpg'}
                    alt={item.title}
                    className={`object-cover ${
                      viewMode === 'grid'
                        ? 'w-full h-48 rounded-t-xl'
                        : 'w-48 h-full rounded-l-xl'
                    }`}
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${
                      darkMode ? 'bg-gray-900/80 text-gray-200' : 'bg-white/90 text-gray-700'
                    }`}>
                      {CATEGORY_OPTIONS.find(c => c.id === item.category)?.shortLabel || item.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>

                  <h3 className={`font-semibold mb-2 line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </h3>

                  {viewMode === 'list' && (
                    <p className={`text-sm mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                  )}

                  <div className="mb-3">
                    <span className="text-xl font-bold text-emerald-600">
                      {item.price
                        ? `KSh ${parseFloat(item.price).toLocaleString('en-KE')}`
                        : 'Negotiable'}
                    </span>
                    {item.negotiable && (
                      <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>(Negotiable)</span>
                    )}
                  </div>

                  {item.condition && (
                    <div className="mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionBadgeColor(item.condition)}`}>
                        {item.condition}
                      </span>
                    </div>
                  )}

                  {/* Seller row — shared component */}
                  <div className={`mb-3 pb-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <SellerRow
                      sellerName={item.seller_name}
                      averageRating={item.average_rating}
                      totalReviews={item.total_reviews}
                      darkMode={darkMode}
                    />
                  </div>

                  <div className={`flex items-center justify-between mb-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.area_of_operation || 'Campus'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.views_count || 0}
                    </span>
                  </div>

                  {!isOwner(item.seller) && item.status !== 'sold' && (
                    <button
                      onClick={e => { e.stopPropagation(); handleAddToCart(item); }}
                      className="w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && listings.length === 0 && (
          <div className="text-center py-12">
            <Package className={`w-24 h-24 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-xl font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>No listings found</h3>
            <p className={`mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Try adjusting your filters or search query</p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && listings.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white'
                      : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default IntegratedBrowsePage;