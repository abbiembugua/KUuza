import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import BackButton from '../Components/shared/BackButton';
import SellerRow from '../Components/shared/SellerRow';
import {
  Grid, List, ChevronLeft, ChevronRight,
  MapPin, SlidersHorizontal, X, Eye, Package,
} from 'lucide-react';
import PageSpinner from '../Components/shared/PageSpinner';
import { getCartItems, addToCart, viewListing, searchListings } from '../api/dashboardapi';
import { showToast } from '../Services/toastService';

const CATEGORY_OPTIONS = [
  { id: 'all',            shortLabel: 'All',          types: ['all', 'good', 'service'] },
  { id: 'books',          shortLabel: 'Academics',    types: ['good'] },
  { id: 'electronics',    shortLabel: 'Electronics',  types: ['good'] },
  { id: 'fashion',        shortLabel: 'Fashion',      types: ['good', 'service'] },
  { id: 'furniture',      shortLabel: 'Furniture',    types: ['good'] },
  { id: 'food_beverages', shortLabel: 'Food',         types: ['good', 'service'] },
  { id: 'beauty',         shortLabel: 'Beauty & Acc.', types: ['good', 'service'] },
  { id: 'stationery',     shortLabel: 'Stationery',   types: ['good'] },
  { id: 'sports',         shortLabel: 'Sports',       types: ['good'] },
  { id: 'tutoring',       shortLabel: 'Tutoring',     types: ['service'] },
  { id: 'printing',       shortLabel: 'Printing',     types: ['service'] },
  { id: 'design',         shortLabel: 'Design',       types: ['service'] },
  { id: 'tech_repair',    shortLabel: 'Tech Repair',  types: ['service'] },
  { id: 'laundry',        shortLabel: 'Laundry',      types: ['service'] },
  { id: 'photography',    shortLabel: 'Photography',  types: ['service'] },
  { id: 'other',          shortLabel: 'Other',        types: ['good', 'service'] },
];

const CONDITION_OPTIONS = [
  { value: 'new',      label: 'New'      },
  { value: 'like_new', label: 'Like New' },
  { value: 'used',     label: 'Used'     },
  { value: 'fair',     label: 'Fair'     },
];

const SORT_OPTIONS = [
  { value: 'newest',      label: 'Newest first'      },
  { value: 'oldest',      label: 'Oldest first'      },
  { value: 'price_low',   label: 'Price: Low → High' },
  { value: 'price_high',  label: 'Price: High → Low' },
  { value: 'most_viewed', label: 'Most viewed'       },
];

const normalizeSortParam = (p) => {
  switch (p) {
    case 'oldest':     case 'created_at':    return 'oldest';
    case 'price_low':  case 'price':         return 'price_low';
    case 'price_high': case '-price':        return 'price_high';
    case 'most_viewed':case '-views_count':  return 'most_viewed';
    default:                                  return 'newest';
  }
};

const getSortOrderingValue = (s) => {
  switch (s) {
    case 'oldest':      return 'created_at';
    case 'price_low':   return 'price';
    case 'price_high':  return '-price';
    case 'most_viewed': return '-views_count';
    default:            return '-created_at';
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

const ITEMS_PER_PAGE = 20;
const getAvailableQuantity = (item) => Number(item?.quantity ?? item?.listing_quantity ?? 0);
const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return String(value.id || value.uuid || value.pk || '');
  return String(value);
};

const TYPE_TABS = [
  { value: 'all',     label: 'All'      },
  { value: 'good',    label: 'Goods'    },
  { value: 'service', label: 'Services' },
];

const IntegratedBrowsePage = () => {
  const { darkMode } = useTheme();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode,            setViewMode]            = useState('grid');
  const [searchQuery,         setSearchQuery]         = useState(searchParams.get('search') || '');
  const [selectedCategory,    setSelectedCategory]    = useState(searchParams.get('category') || 'all');
  const [selectedListingType, setSelectedListingType] = useState(searchParams.get('listing_type') || 'all');
  const [selectedCondition,   setSelectedCondition]   = useState(searchParams.get('condition') || 'all');
  const [minPrice,            setMinPrice]            = useState(searchParams.get('min_price') || '');
  const [maxPrice,            setMaxPrice]            = useState(searchParams.get('max_price') || '');
  const [sortBy,              setSortBy]              = useState(normalizeSortParam(searchParams.get('ordering')));
  const [showFilters,         setShowFilters]         = useState(false);

  const [listings,    setListings]    = useState([]);
  const [cartItems,   setCartItems]   = useState([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10) || 1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);

  useEffect(() => {
    getCartItems().then(data => setCartItems(data || [])).catch(() => {});
  }, []);

  const loadListings = useCallback(async (page) => {
    setIsLoading(true);
    try {
      const filters = {
        search:       searchQuery || undefined,
        category:     selectedCategory    !== 'all' ? selectedCategory    : undefined,
        listing_type: selectedListingType !== 'all' ? selectedListingType : undefined,
        condition:    selectedListingType === 'service' || selectedCondition === 'all' ? undefined : selectedCondition,
        min_price:    minPrice ? Number(minPrice) : undefined,
        max_price:    maxPrice ? Number(maxPrice) : undefined,
        ordering:     getSortOrderingValue(sortBy),
        page,
        page_size:    ITEMS_PER_PAGE,
      };

      const response = await searchListings(filters);
      setListings(response.results || []);
      setTotalCount(response.count || 0);
      setTotalPages(Math.max(1, Math.ceil((response.count || 0) / ITEMS_PER_PAGE)));

      const params = new URLSearchParams();
      if (searchQuery)                        params.set('search',       searchQuery);
      if (selectedCategory    !== 'all')      params.set('category',     selectedCategory);
      if (selectedListingType !== 'all')      params.set('listing_type', selectedListingType);
      if (selectedCondition   !== 'all' && selectedListingType !== 'service') params.set('condition', selectedCondition);
      if (minPrice)                           params.set('min_price',    minPrice);
      if (maxPrice)                           params.set('max_price',    maxPrice);
      if (sortBy !== 'newest')                params.set('ordering',     sortBy);
      if (page > 1)                           params.set('page',         String(page));
      setSearchParams(params, { replace: true });
    } catch (err) {
      console.error('Error loading listings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedListingType, selectedCondition, minPrice, maxPrice, sortBy, setSearchParams]);

  // When filters change, reset to page 1 and reload
  useEffect(() => {
    setCurrentPage(1);
    loadListings(1);
  }, [searchQuery, selectedCategory, selectedListingType, selectedCondition, minPrice, maxPrice, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleTypeChange = (type) => {
    setSelectedListingType(type);
    if (type === 'service') setSelectedCondition('all');
    const cat = CATEGORY_OPTIONS.find(c => c.id === selectedCategory);
    if (cat && !cat.types.includes(type) && type !== 'all') setSelectedCategory('all');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedListingType('all');
    setSelectedCondition('all');
    setMinPrice('');
    setMaxPrice('');
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

  const isOwner = (sellerId) => normalizeId(user?.id) === normalizeId(sellerId);

  const isService = selectedListingType === 'service';

  const visibleCategories = CATEGORY_OPTIONS.filter(c =>
    selectedListingType === 'all' ? true : c.types.includes(selectedListingType)
  );

  const hasActiveFilters =
    selectedCategory !== 'all' || selectedListingType !== 'all' ||
    selectedCondition !== 'all' || minPrice || maxPrice;

  const getContextualHeader = () => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    if (selectedListingType === 'service') return 'Browse Services';
    if (selectedListingType === 'good') return 'Browse Goods';
    return 'Browse All Listings';
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
    darkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500' : 'bg-white text-gray-900 border-gray-200 placeholder-gray-400'
  }`;

  const SidebarPanel = () => (
    <div className={`rounded-xl border p-4 sticky top-36 space-y-5 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold flex items-center gap-2 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="text-xs text-emerald-600 hover:text-emerald-500 font-medium">
            Reset all
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sort by</p>
        <div className="space-y-0.5">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors ${
                sortBy === opt.value
                  ? 'bg-emerald-500 text-white font-medium'
                  : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sortBy === opt.value ? 'bg-white' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />

      {/* Price */}
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Price (KSh)</p>
        <div className="space-y-2">
          <input type="number" placeholder="Min price" value={minPrice} onChange={e => setMinPrice(e.target.value)} className={inputCls} />
          <input type="number" placeholder="Max price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Condition — goods only */}
      {!isService && (
        <>
          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Condition</p>
            <select
              value={selectedCondition}
              onChange={e => setSelectedCondition(e.target.value)}
              className={`w-full px-2.5 py-1.5 rounded-lg text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <option value="all">Any condition</option>
              {CONDITION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar
        onSearch={v => setSearchQuery(v)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartItemsCount={cartItems.length}
      />
      <div className="h-16" />

      {/* ── Sticky top bar ── */}
      <div className={`sticky top-16 z-20 border-b ${
        darkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
      } backdrop-blur-md`}>

        {/* Row 1: Back + Type tabs + mobile filter button */}
        <div className="max-w-7xl mx-auto px-4 pt-2 pb-1 flex items-center">
          <div className="flex-1 flex justify-start">
            <BackButton darkMode={darkMode} onClick={() => navigate(-1)} />
          </div>

          <div className={`flex items-center rounded-xl p-1 gap-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {TYPE_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => handleTypeChange(tab.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  selectedListingType === tab.value
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setShowFilters(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium lg:hidden border ${
                hasActiveFilters
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters{hasActiveFilters ? ' •' : ''}
            </button>
          </div>
        </div>

        {/* Row 2: Category chips (only when Goods or Services selected) */}
        {selectedListingType !== 'all' && (
          <div className="max-w-7xl mx-auto px-4 pb-2">
            <div className="flex justify-center gap-2 overflow-x-auto flex-nowrap scrollbar-none">
              {visibleCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-150 ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : darkMode
                        ? 'border-gray-700 text-gray-400 hover:border-emerald-500 hover:text-emerald-400'
                        : 'border-gray-300 text-gray-500 hover:border-emerald-500 hover:text-emerald-600'
                  }`}
                >
                  {cat.shortLabel}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-5 pb-10">
        <div className="flex gap-6">

          {/* Mobile overlay */}
          {showFilters && (
            <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setShowFilters(false)} />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed top-0 left-0 h-full z-50 w-72 overflow-y-auto transition-transform duration-300 p-4
            lg:static lg:z-auto lg:h-auto lg:w-56 lg:flex-shrink-0 lg:translate-x-0 lg:overflow-visible lg:p-0
            ${showFilters ? 'translate-x-0' : '-translate-x-full'}
            ${darkMode ? 'bg-gray-900 lg:bg-transparent' : 'bg-white lg:bg-transparent'}
          `}>
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filters</span>
              <button onClick={() => setShowFilters(false)}>
                <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
            <SidebarPanel />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {isLoading ? 'Loading…' : `${totalCount} result${totalCount !== 1 ? 's' : ''}`}
              </p>
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

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategory !== 'all' && (
                  <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {CATEGORY_OPTIONS.find(c => c.id === selectedCategory)?.shortLabel}
                    <button onClick={() => setSelectedCategory('all')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedCondition !== 'all' && !isService && (
                  <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {CONDITION_OPTIONS.find(c => c.value === selectedCondition)?.label}
                    <button onClick={() => setSelectedCondition('all')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {minPrice && (
                  <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    Min KSh {Number(minPrice).toLocaleString()}
                    <button onClick={() => setMinPrice('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {maxPrice && (
                  <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    Max KSh {Number(maxPrice).toLocaleString()}
                    <button onClick={() => setMaxPrice('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {sortBy !== 'newest' && (
                  <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                    <button onClick={() => setSortBy('newest')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                <button onClick={resetFilters} className="text-xs text-emerald-600 hover:text-emerald-500 font-medium">
                  Clear all
                </button>
              </div>
            )}

            <h2 className={`text-lg font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {getContextualHeader()}
            </h2>

            {isLoading && listings.length === 0 && <PageSpinner />}

            {listings.length > 0 && (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                  : 'space-y-4'
              }>
                {listings.map(item => {
                  const isOutOfStock  = item.listing_type !== 'service' && getAvailableQuantity(item) <= 0;
                  const isMarkedSold  = item.status === 'sold';
                  const isUnavailable = item.listing_type === 'service' ? isMarkedSold : isOutOfStock;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleViewListing(item.id)}
                      className={`relative rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 ${
                        viewMode === 'list' ? 'flex' : ''
                      } ${darkMode ? 'bg-gray-800' : 'bg-white'} ${
                        isUnavailable ? 'opacity-60 saturate-50' : ''
                      } ${isOwner(item.seller) ? 'ring-2 ring-emerald-500' : ''}`}
                    >
                      {isUnavailable && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold z-10 -rotate-12">
                          {item.listing_type === 'service' ? 'UNAVAILABLE' : 'OUT'}
                        </div>
                      )}

                      <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                        <img
                          src={item.images?.[0]?.image || '/placeholder.jpg'}
                          alt={item.title}
                          className={`object-cover ${viewMode === 'grid' ? 'w-full h-32 rounded-t-xl' : 'w-48 h-full rounded-l-xl'}`}
                        />
                        {isOwner(item.seller) ? (
                          <div className="absolute top-2 right-2 bg-emerald-700 text-white px-2 py-0.5 rounded-full text-xs font-bold tracking-wide shadow z-10">
                            YOUR LISTING
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2">
                            <span className={`px-1.5 py-0.5 rounded-md text-xs font-medium backdrop-blur-sm ${
                              darkMode ? 'bg-gray-900/80 text-gray-200' : 'bg-white/90 text-gray-700'
                            }`}>
                              {CATEGORY_OPTIONS.find(c => c.id === item.category)?.shortLabel || item.category}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={`p-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        {viewMode === 'list' && (
                          <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        )}
                        <h3 className={`text-xs font-semibold mb-1.5 line-clamp-2 leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.title}
                        </h3>
                        {viewMode === 'list' && (
                          <p className={`text-sm mb-2 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.description}
                          </p>
                        )}
                        <div className="mb-1.5">
                          <span className="text-sm font-bold text-emerald-600">
                            {item.price ? `KSh ${parseFloat(item.price).toLocaleString('en-KE')}` : 'Price on request'}
                          </span>
                        </div>
                        {item.condition && (
                          <div className="mb-1.5">
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getConditionBadgeColor(item.condition)}`}>
                              {item.condition}
                            </span>
                          </div>
                        )}
                        <div className={`mb-2 pb-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <SellerRow
                            sellerName={item.seller_name}
                            averageRating={item.average_rating}
                            totalReviews={item.total_reviews}
                            darkMode={darkMode}
                          />
                        </div>
                        <div className={`flex items-center justify-between mb-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.area_of_operation || 'Campus'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.views_count || 0}
                          </span>
                        </div>
                        {item.listing_type !== 'service' && (
                          <p className={`mb-2 text-xs font-medium ${isOutOfStock ? 'text-red-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {isOutOfStock ? 'Out of stock' : `${getAvailableQuantity(item)} available`}
                          </p>
                        )}
                        {!isUnavailable && (
                          <button
                            onClick={e => { e.stopPropagation(); handleViewListing(item.id); }}
                            className={`w-full px-2 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                              darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-emerald-400'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            View details →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoading && listings.length === 0 && (
              <div className="text-center py-16">
                <Package className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>No listings found</h3>
                <p className={`text-sm mb-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Try adjusting your filters or search query
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {!isLoading && listings.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => { const p = Math.max(currentPage - 1, 1); setCurrentPage(p); loadListings(p); }}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
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
                      onClick={() => { setCurrentPage(page); loadListings(page); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-emerald-600 text-white'
                          : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => { const p = Math.min(currentPage + 1, totalPages); setCurrentPage(p); loadListings(p); }}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? darkMode ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedBrowsePage;