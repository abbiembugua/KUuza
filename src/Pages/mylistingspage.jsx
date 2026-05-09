import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Plus, Eye, Package, LayoutGrid, List, Search, X, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import { useTheme } from '../context/Themecontext';
import { useAuth } from '../context/AuthContext';
import * as listingsApi from '../api/listingsapi';
import ListingCard from '../Components/Listings/ListingCard';
import EditListingModal from '../Components/view_listings/editconfirm';
import DeleteConfirmModal from '../Components/view_listings/deleteconfirm';
import { Toaster, toast } from 'react-hot-toast';

const MyListingsPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { darkMode } = useTheme();
  const { user }  = useAuth();
  const autoOpenedEditRef = useRef(false);

  const [listings,         setListings]         = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [filter,           setFilter]           = useState('all');
  const [sortBy,           setSortBy]           = useState('newest');
  const [viewMode,         setViewMode]         = useState('grid');
  const [searchTerm,       setSearchTerm]       = useState('');

  const [editingListing,    setEditingListing]    = useState(null);
  const [deletingListing,   setDeletingListing]   = useState(null);
  const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => { fetchListings(); }, []);

  useEffect(() => {
    const editListingId = location.state?.editListingId;
    if (!editListingId || autoOpenedEditRef.current || listings.length === 0) return;
    const target = listings.find(item => String(item.id) === String(editListingId));
    if (!target) return;
    autoOpenedEditRef.current = true;
    handleEdit(target);
    navigate(location.pathname, { replace: true, state: {} });
  }, [listings, location.pathname, location.state, navigate]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await listingsApi.getMyListings();
      setListings(data);
      applyFiltersAndSort(data, filter, sortBy, searchTerm);
    } catch (error) {
      toast.error(error.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFiltersAndSort(listings, filter, sortBy, searchTerm);
  }, [filter, sortBy, searchTerm, listings]);

  const applyFiltersAndSort = (data, selectedFilter, selectedSort, search) => {
    let result = [...data];
    if (selectedFilter === 'published') result = result.filter(l => !l.is_draft);
    else if (selectedFilter === 'draft') result = result.filter(l => l.is_draft);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
      );
    }
    switch (selectedSort) {
      case 'newest':     result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case 'oldest':     result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case 'price-high': result.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)); break;
      case 'price-low':  result.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)); break;
      default: break;
    }
    setFilteredListings(result);
  };

  const handleEdit = (listing) => { setEditingListing(listing); setIsEditModalOpen(true); };

  const handleSaveEdit = async (updatedData) => {
    try {
      await listingsApi.updateListing(editingListing.id, updatedData);
      toast.success('Listing updated successfully!');
      setIsEditModalOpen(false);
      setEditingListing(null);
      fetchListings();
    } catch (error) {
      toast.error(error.message || 'Failed to update listing');
    }
  };

  const handleDeleteClick  = (listing) => { setDeletingListing(listing); setIsDeleteModalOpen(true); };

  const handleConfirmDelete = async () => {
    try {
      await listingsApi.deleteListing(deletingListing.id);
      toast.success('Listing deleted successfully!');
      setIsDeleteModalOpen(false);
      setDeletingListing(null);
      fetchListings();
    } catch (error) {
      toast.error(error.message || 'Failed to delete listing');
    }
  };

  const handleTogglePublish = async (listing) => {
    try {
      const newStatus = !listing.is_draft;
      await listingsApi.updateListing(listing.id, { is_draft: newStatus });
      toast.success(newStatus ? 'Moved to drafts' : 'Published successfully!');
      fetchListings();
    } catch (error) {
      toast.error(error.message || 'Failed to update listing status');
    }
  };

  const selectCls = `px-2.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
    darkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
  }`;

  const emptyState = filteredListings.length === 0 && !loading;
  const noResults  = listings.length > 0 && filteredListings.length === 0 && !loading;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster toastOptions={{ style: { borderRadius: '10px', padding: '14px' } }} />
      <DashboardNavbar />

      <div className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4">

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
                  Manage your marketplace listings
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

          {/* ── Controls ── */}
          <div className={`rounded-2xl p-3 mb-4 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
          }`}>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search listings…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-8 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    darkMode
                      ? 'bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-600'
                      : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400'
                  }`}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Status */}
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className={selectCls}>
                <option value="all">All listings</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              {/* Sort */}
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price-high">Price: high → low</option>
                <option value="price-low">Price: low → high</option>
              </select>

              {/* View mode — icon buttons */}
              <div className={`flex rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : darkMode ? 'bg-gray-900 text-gray-400 hover:text-gray-200' : 'bg-white text-gray-500 hover:text-gray-700'}`}
                  title="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-emerald-600 text-white' : darkMode ? 'bg-gray-900 text-gray-400 hover:text-gray-200' : 'bg-white text-gray-500 hover:text-gray-700'}`}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>

              {/* Count */}
              <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {filteredListings.length} shown
              </p>
            </div>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
            </div>
          )}

          {/* ── Empty state ── */}
          {emptyState && (
            <div className={`rounded-2xl p-16 text-center ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'}`}>
              <Package size={40} className="mx-auto mb-4 text-gray-400" />
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>No listings yet</h3>
              <p className={`mb-5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create your first listing to start selling.</p>
              <button onClick={() => navigate('/sell')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors">
                <Plus size={16} /> Create listing
              </button>
            </div>
          )}

          {/* ── No results ── */}
          {noResults && (
            <div className={`rounded-2xl p-12 text-center ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'}`}>
              <p className={`font-semibold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>No results found</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting your search or filters.</p>
            </div>
          )}

          {/* ── Grid view ── */}
          {!loading && filteredListings.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onEdit={() => handleEdit(listing)}
                  onDelete={() => handleDeleteClick(listing)}
                  onTogglePublish={() => handleTogglePublish(listing)}
                  darkMode={darkMode}
                />
              ))}
            </div>
          )}

          {/* ── List view ── */}
          {!loading && filteredListings.length > 0 && viewMode === 'list' && (
            <div className="space-y-2">
              {filteredListings.map(listing => (
                <div
                  key={listing.id}
                  className={`rounded-2xl p-3 flex items-center gap-3 ${
                    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
                  }`}
                >
                  {/* Thumbnail */}
                  {listing.images?.length > 0 ? (
                    <img
                      src={listing.images[0].image}
                      alt={listing.title}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <Package size={20} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {listing.title}
                    </p>
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
                      {listing.views_count !== undefined && (
                        <span className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Eye size={11} />
                          {listing.views_count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
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
                    <button
                      onClick={() => handleEdit(listing)}
                      className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(listing)}
                      className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
