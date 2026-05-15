import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Edit2, Trash2, Plus, Eye, Package, LayoutGrid, List,
  Search, X, ArrowLeft, SlidersHorizontal, Archive, ArchiveRestore,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import { useTheme } from '../context/Themecontext';
import { useAuth } from '../context/AuthContext';
import * as listingsApi from '../api/listingsapi';
import ListingCard from '../Components/Listings/ListingCard';
import EditListingModal from '../Components/view_listings/editconfirm';
import DeleteConfirmModal from '../Components/view_listings/deleteconfirm';
import { Toaster, toast } from 'react-hot-toast';


const EMPTY_FILTERS = {
  status:       '',
  is_draft:     '',
  listing_type: '',
  category:     '',
  ordering:     '-created_at',
};

const CATEGORIES = [
  { value: 'books',          label: 'Academics' },
  { value: 'electronics',    label: 'Electronics' },
  { value: 'fashion',        label: 'Fashion' },
  { value: 'furniture',      label: 'Furniture' },
  { value: 'food_beverages', label: 'Food & Beverages' },
  { value: 'beauty',         label: 'Beauty' },
  { value: 'stationery',     label: 'Stationery & Supplies' },
  { value: 'sports',         label: 'Sports & Fitness' },
  { value: 'tutoring',       label: 'Tutoring & Academics' },
  { value: 'printing',       label: 'Printing & Photocopying' },
  { value: 'design',         label: 'Design & Creative' },
  { value: 'tech_repair',    label: 'Tech & Repairs' },
  { value: 'laundry',        label: 'Laundry & Cleaning' },
  { value: 'photography',    label: 'Photography & Video' },
  { value: 'other',          label: 'Other' },
];

const activeFilterCount = (f) =>
  Object.entries(f).filter(([k, v]) => v !== '' && k !== 'ordering' && k !== 'search').length;

// ── Dot-button list (like browse page type selector) ─────────────────────────
function ButtonGroup({ options, value, onChange, darkMode }) {
  return (
    <div className="space-y-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors text-left ${
            value === opt.value
              ? 'bg-emerald-500 text-white'
              : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            value === opt.value ? 'bg-white' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
          }`} />
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const MyListingsPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { darkMode } = useTheme();
  const { user }  = useAuth();
  const autoOpenedEditRef = useRef(false);
  const debounceRef       = useRef(null);

  const [listings,          setListings]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [viewMode,          setViewMode]          = useState('grid');
  const [showSidebar,       setShowSidebar]       = useState(false);
  const [filters,           setFilters]           = useState(EMPTY_FILTERS);
  const [searchInput,       setSearchInput]       = useState('');

  const [editingListing,    setEditingListing]    = useState(null);
  const [deletingListing,   setDeletingListing]   = useState(null);
  const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [totalActive,       setTotalActive]       = useState(0);

  // ── Fetch — only search + ordering go to the backend ─────────────────────
  const fetchListings = useCallback(async (search, ordering) => {
    try {
      setLoading(true);
      const data = await listingsApi.getMyListings({ search, ordering });
      setListings(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      toast.error(err.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchListings(searchInput, filters.ordering),
      searchInput ? 350 : 0,
    );
    return () => clearTimeout(debounceRef.current);
  }, [searchInput, filters.ordering, fetchListings]);

  // ── Client-side filtering ─────────────────────────────────────────────────
  const displayListings = useMemo(() => listings.filter(item => {
    if (filters.status       && item.status       !== filters.status)                     return false;
    if (filters.is_draft     !== '' && String(item.is_draft) !== filters.is_draft)        return false;
    if (filters.listing_type && item.listing_type !== filters.listing_type)               return false;
    if (filters.category     && item.category     !== filters.category)                   return false;
    return true;
  }), [listings, filters.status, filters.is_draft, filters.listing_type, filters.category]);

  useEffect(() => {
    listingsApi.getMyListings({ status: 'active', is_draft: 'false' })
      .then(data => setTotalActive(Array.isArray(data) ? data.length : (data.results?.length ?? 0)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const editListingId = location.state?.editListingId;
    if (!editListingId || autoOpenedEditRef.current || listings.length === 0) return;
    const target = listings.find(item => String(item.id) === String(editListingId));
    if (!target) return;
    autoOpenedEditRef.current = true;
    handleEdit(target);
    navigate(location.pathname, { replace: true, state: {} });
  }, [listings, location.pathname, location.state, navigate]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearAll  = () => { setFilters(EMPTY_FILTERS); setSearchInput(''); };
  const numFiltered = displayListings.length;
  const numActive = activeFilterCount(filters);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleEdit = (listing) => { setEditingListing(listing); setIsEditModalOpen(true); };

  const handleSaveEdit = async (updatedData) => {
    try {
      await listingsApi.updateListing(editingListing.id, updatedData);
      toast.success('Listing updated!');
      setIsEditModalOpen(false);
      setEditingListing(null);
      fetchListings({ ...filters, search: searchInput });
    } catch (err) { toast.error(err.message || 'Failed to update'); }
  };

  const handleDeleteClick   = (listing) => { setDeletingListing(listing); setIsDeleteModalOpen(true); };
  const handleConfirmDelete = async () => {
    try {
      await listingsApi.deleteListing(deletingListing.id);
      toast.success('Listing deleted!');
      setIsDeleteModalOpen(false);
      setDeletingListing(null);
      fetchListings({ ...filters, search: searchInput });
    } catch (err) { toast.error(err.message || 'Failed to delete'); }
  };

  const handleTogglePublish = async (listing) => {
    try {
      await listingsApi.updateListing(listing.id, { is_draft: !listing.is_draft });
      toast.success(!listing.is_draft ? 'Moved to drafts' : 'Published!');
      fetchListings({ ...filters, search: searchInput });
    } catch (err) { toast.error(err.message || 'Failed to update'); }
  };

  const handleArchive = async (listing) => {
    try {
      if (listing.status === 'deactivated') {
        await listingsApi.reactivateListing(listing.id);
        toast.success('Listing reactivated!');
      } else {
        await listingsApi.archiveListing(listing.id);
        toast.success('Listing archived — hidden from buyers.');
      }
      fetchListings(searchInput, filters.ordering);
    } catch (err) { toast.error(err.message || 'Failed to update listing'); }
  };

  // ── Style shortcuts ────────────────────────────────────────────────────────
  const selectCls = `w-full px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
    darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
  }`;
  const divider = <div className={`my-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />;

  // ── Sidebar content (shared between desktop panel and mobile drawer) ───────
  const sidebarContent = (
    <div className={`rounded-xl border p-3 sticky top-[7.5rem] ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold text-sm flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <SlidersHorizontal size={14} className="text-emerald-500" />
          Filters
          {numActive > 0 && (
            <span className="ml-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {numActive}
            </span>
          )}
        </h3>
        {(numActive > 0 || searchInput) && (
          <button onClick={clearAll} className="text-xs text-emerald-600 hover:text-emerald-500 font-medium">
            Reset all
          </button>
        )}
      </div>

      {/* ── Type ── */}
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type</p>
      <ButtonGroup
        darkMode={darkMode}
        value={filters.listing_type}
        onChange={(v) => setFilter('listing_type', v)}
        options={[{ value: '', label: 'All types' }, { value: 'good', label: 'Goods' }, { value: 'service', label: 'Services' }]}
      />

      {divider}

      {/* ── Status ── */}
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
      <ButtonGroup
        darkMode={darkMode}
        value={filters.status}
        onChange={(v) => setFilter('status', v)}
        options={[{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'sold', label: 'Sold' }, { value: 'deactivated', label: 'Deactivated' }]}
      />

      {divider}

      {/* ── Visibility ── */}
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Visibility</p>
      <ButtonGroup
        darkMode={darkMode}
        value={filters.is_draft}
        onChange={(v) => setFilter('is_draft', v)}
        options={[{ value: '', label: 'All' }, { value: 'false', label: 'Published' }, { value: 'true', label: 'Drafts' }]}
      />

      {divider}

      {/* ── Category ── */}
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Category</p>
      <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} className={selectCls}>
        <option value="">All categories</option>
        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster toastOptions={{ style: { borderRadius: '10px', padding: '14px' } }} />
      <DashboardNavbar />

      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4">

          {/* ── Header ── */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className={`p-2 rounded-xl transition-colors ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-white hover:bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Listings</h1>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {loading ? 'Loading…' : `${numFiltered} listing${numFiltered !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/sell')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              New listing
            </button>
          </div>


          {/* ── Top controls ── */}
          <div className={`rounded-2xl p-3 mb-5 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
          }`}>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search your listings…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`w-full pl-9 pr-8 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    darkMode ? 'bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-600' : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400'
                  }`}
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={filters.ordering}
                onChange={(e) => setFilter('ordering', e.target.value)}
                className={`px-2.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  darkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <option value="-created_at">Newest first</option>
                <option value="created_at">Oldest first</option>
                <option value="-price">Price: high → low</option>
                <option value="price">Price: low → high</option>
                <option value="-views_count">Most viewed</option>
              </select>

              {/* View mode */}
              <div className={`flex rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : darkMode ? 'bg-gray-900 text-gray-400 hover:text-gray-200' : 'bg-white text-gray-500 hover:text-gray-700'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-emerald-600 text-white' : darkMode ? 'bg-gray-900 text-gray-400 hover:text-gray-200' : 'bg-white text-gray-500 hover:text-gray-700'}`}
                >
                  <List size={16} />
                </button>
              </div>

              {/* Mobile: open sidebar */}
              <button
                onClick={() => setShowSidebar(true)}
                className={`relative lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  numActive > 0
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : darkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                <SlidersHorizontal size={14} />
                Filters
                {numActive > 0 && (
                  <span className="bg-white text-emerald-700 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {numActive}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Main layout: sidebar + content ── */}
          <div className="flex gap-5 items-start">

            {/* Mobile overlay */}
            {showSidebar && (
              <div
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setShowSidebar(false)}
              />
            )}

            {/* ── Sidebar ── */}
            <aside className={`
              fixed top-0 left-0 h-full z-50 w-72 overflow-y-auto transition-transform duration-300 p-4
              lg:static lg:z-auto lg:h-auto lg:w-56 lg:flex-shrink-0 lg:translate-x-0 lg:overflow-visible lg:p-0
              ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
              ${darkMode ? 'bg-gray-900 lg:bg-transparent' : 'bg-white lg:bg-transparent'}
            `}>
              {/* Mobile close */}
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filters</span>
                <button onClick={() => setShowSidebar(false)}>
                  <X size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>

              {sidebarContent}
            </aside>

            {/* ── Listings ── */}
            <div className="flex-1 min-w-0">

              {loading && (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
                </div>
              )}

              {!loading && displayListings.length === 0 && numActive === 0 && !searchInput && (
                <div className={`rounded-2xl p-16 text-center ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'}`}>
                  <Package size={40} className="mx-auto mb-4 text-gray-400" />
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>No listings yet</h3>
                  <p className={`mb-5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create your first listing to start selling.</p>
                  <button onClick={() => navigate('/sell')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors">
                    <Plus size={16} /> Create listing
                  </button>
                </div>
              )}

              {!loading && displayListings.length === 0 && (numActive > 0 || searchInput) && (
                <div className={`rounded-2xl p-12 text-center ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'}`}>
                  <p className={`font-semibold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>No listings match these filters</p>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting or clearing your filters.</p>
                  <button onClick={clearAll} className="inline-flex items-center gap-1.5 text-sm text-emerald-500 hover:text-emerald-400 font-medium">
                    <X size={14} /> Clear all filters
                  </button>
                </div>
              )}

              {/* Grid view */}
              {!loading && displayListings.length > 0 && viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {displayListings.map(listing => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onEdit={() => handleEdit(listing)}
                      onDelete={() => handleDeleteClick(listing)}
                      onTogglePublish={() => handleTogglePublish(listing)}
                      onArchive={() => handleArchive(listing)}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              )}

              {/* List view */}
              {!loading && displayListings.length > 0 && viewMode === 'list' && (
                <div className="space-y-2">
                  {displayListings.map(listing => (
                    <div
                      key={listing.id}
                      className={`rounded-2xl p-3 flex items-center gap-3 ${
                        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
                      }`}
                    >
                      {listing.images?.length > 0 ? (
                        <img src={listing.images[0].image} alt={listing.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Package size={20} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{listing.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            KES {listing.price ? Number(listing.price).toLocaleString() : 'Negotiable'}
                          </p>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
                            listing.is_draft
                              ? darkMode ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                              : darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {listing.is_draft ? 'Draft' : 'Published'}
                          </span>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                            {listing.status}
                          </span>
                          {listing.views_count !== undefined && (
                            <span className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              <Eye size={11} /> {listing.views_count}
                            </span>
                          )}
                          <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            {new Date(listing.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleTogglePublish(listing)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            listing.is_draft
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {listing.is_draft ? 'Publish' : 'Unpublish'}
                        </button>
                        <button onClick={() => handleEdit(listing)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleArchive(listing)}
                          title={listing.status === 'deactivated' ? 'Reactivate' : 'Archive'}
                          className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400' : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600'}`}
                        >
                          {listing.status === 'deactivated' ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                        </button>
                        <button onClick={() => handleDeleteClick(listing)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && editingListing && (
        <EditListingModal
          listing={editingListing}
          onClose={() => { setIsEditModalOpen(false); setEditingListing(null); }}
          onSave={handleSaveEdit}
          darkMode={darkMode}
        />
      )}

      {isDeleteModalOpen && deletingListing && (
        <DeleteConfirmModal
          listing={deletingListing}
          onClose={() => { setIsDeleteModalOpen(false); setDeletingListing(null); }}
          onConfirm={handleConfirmDelete}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default MyListingsPage;
