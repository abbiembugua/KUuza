// src/Pages/MyListingsPage.jsx
// View, edit, and delete user's listings

import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, ArrowLeft, Eye, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import { useTheme } from '../context/Themecontext';
import { useAuth } from '../context/AuthContext';
import * as listingsApi from '../api/listingsapi';
import ListingCard from '../Components/Listings/ListingCard'
import EditListingModal from '../Components/view_listings/editconfirm'
import DeleteConfirmModal from '../Components/view_listings/deleteconfirm';
import { Toaster, toast } from 'react-hot-toast'; // Add this import

const MyListingsPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  
  // State
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, published, draft
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price-high, price-low
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [editingListing, setEditingListing] = useState(null);
  const [deletingListing, setDeletingListing] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ==================== LOAD LISTINGS ====================
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await listingsApi.getMyListings();
      setListings(data);
      applyFiltersAndSort(data, filter, sortBy, searchTerm);
    } catch (error) {
      toast.error(error.message || 'Failed to load listings', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1f2937',
          border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        }
      });
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== FILTERING & SORTING ====================
  useEffect(() => {
    applyFiltersAndSort(listings, filter, sortBy, searchTerm);
  }, [filter, sortBy, searchTerm, listings]);

  const applyFiltersAndSort = (data, selectedFilter, selectedSort, search) => {
    let result = [...data];

    // Filter by status
    if (selectedFilter === 'published') {
      result = result.filter(listing => !listing.is_draft);
    } else if (selectedFilter === 'draft') {
      result = result.filter(listing => listing.is_draft);
    }

    // Search by title or description
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(listing =>
        listing.title.toLowerCase().includes(searchLower) ||
        listing.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    switch (selectedSort) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'price-high':
        result.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        break;
      case 'price-low':
        result.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        break;
      default:
        break;
    }

    setFilteredListings(result);
  };

  // ==================== EDIT LISTING ====================
  const handleEdit = (listing) => {
    setEditingListing(listing);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await listingsApi.updateListing(editingListing.id, updatedData);
      toast.success('Listing updated successfully!', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1f2937',
          border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        }
      });
      setIsEditModalOpen(false);
      setEditingListing(null);
      fetchListings(); // Refresh list
    } catch (error) {
      toast.error(error.message || 'Failed to update listing', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        }
      });
    }
  };

  // ==================== DELETE LISTING ====================
  const handleDeleteClick = (listing) => {
    setDeletingListing(listing);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await listingsApi.deleteListing(deletingListing.id);
      toast.success('Listing deleted successfully!', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1f2937',
          border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        }
      });
      setIsDeleteModalOpen(false);
      setDeletingListing(null);
      fetchListings(); // Refresh list
    } catch (error) {
      toast.error(error.message || 'Failed to delete listing', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        }
      });
    }
  };

  // ==================== PUBLISH/UNPUBLISH ====================
  const handleTogglePublish = async (listing) => {
    try {
      const newStatus = !listing.is_draft;
      await listingsApi.updateListing(listing.id, { is_draft: newStatus });
      
      const message = newStatus ? 'Moved to drafts' : 'Published successfully!';
      toast.success(message, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1f2937',
          border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        }
      });
      fetchListings(); // Refresh list
    } catch (error) {
      toast.error(error.message || 'Failed to update listing status', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        }
      });
    }
  };

  // ==================== UI STATE ====================
  const handleBack = () => {
    navigate(-1);
  };

  const handleCreateNew = () => {
    navigate('/sell');
  };

  const emptyState = filteredListings.length === 0 && !loading;
  const noResults = listings.length > 0 && filteredListings.length === 0 && !loading;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Add Toaster container */}
      <Toaster 
        toastOptions={{
          className: '',
          style: {
            borderRadius: '10px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
      
      <DashboardNavbar />

      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBack}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-6 transition-colors ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  My Listings
                </h1>
                <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage and view all your marketplace listings
                </p>
              </div>

              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                Create New Listing
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 mb-8`}>
            
            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full p-3 rounded-xl border-2 transition-all ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500'
                    : 'bg-white border-gray-300 focus:border-emerald-500'
                } focus:outline-none`}
              />
            </div>

            {/* Filters & Sort */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Filter by Status */}
              <div>
                <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={`w-full p-2 rounded-lg border-2 transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                      : 'bg-white border-gray-300 focus:border-emerald-500'
                  } focus:outline-none`}
                >
                  <option value="all">All Listings</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`w-full p-2 rounded-lg border-2 transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                      : 'bg-white border-gray-300 focus:border-emerald-500'
                  } focus:outline-none`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                </select>
              </div>

              {/* View Mode */}
              <div>
                <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  View
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 p-2 rounded-lg font-semibold transition-all ${
                      viewMode === 'grid'
                        ? 'bg-emerald-600 text-white'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 p-2 rounded-lg font-semibold transition-all ${
                      viewMode === 'list'
                        ? 'bg-emerald-600 text-white'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div>
                <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Results
                </label>
                <div className={`p-2 rounded-lg text-center font-semibold ${
                  darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
                }`}>
                  {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'}
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          )}

          {/* Empty State */}
          {emptyState && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-16 text-center`}>
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                No listings yet
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Create your first listing to start selling!
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all"
              >
                <Plus size={20} />
                Create First Listing
              </button>
            </div>
          )}

          {/* No Results */}
          {noResults && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-16 text-center`}>
              <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                No results found
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {/* Listings Grid View */}
          {!loading && filteredListings.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Listings List View */}
          {!loading && filteredListings.length > 0 && viewMode === 'list' && (
            <div className="space-y-4">
              {filteredListings.map(listing => (
                <div
                  key={listing.id}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {listing.images && listing.images.length > 0 && (
                      <img
                        src={listing.images[0].image}
                        alt={listing.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {listing.title}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {listing.category} • KES {listing.price || 'Negotiable'}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            listing.is_draft
                              ? darkMode
                                ? 'bg-yellow-900 text-yellow-200'
                                : 'bg-yellow-100 text-yellow-800'
                              : darkMode
                              ? 'bg-green-900 text-green-200'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {listing.is_draft ? '📝 Draft' : '✅ Published'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(listing)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(listing)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingListing && (
        <EditListingModal
          listing={editingListing}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingListing(null);
          }}
          onSave={handleSaveEdit}
          darkMode={darkMode}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingListing && (
        <DeleteConfirmModal
          listing={deletingListing}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingListing(null);
          }}
          onConfirm={handleConfirmDelete}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default MyListingsPage;