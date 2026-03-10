// src/api/dashboardapi.js
// Dashboard-specific API calls - Fixed to work with existing backend

const BASE_URL = "http://127.0.0.1:8000/api";

const getToken = () => localStorage.getItem('access') || '';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    
    if (response.status === 401) {
      errorMessage = 'Authentication failed. Please login again.';
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      window.location.href = '/login';
    } else {
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorData.message || `Error ${response.status}`;
      } catch {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
    }
    
    throw new Error(errorMessage);
  }
  
  return await response.json();
};

// ==================== DASHBOARD DATA OPERATIONS ====================

/**
 * Get all public listings (for browsing) - Fixed to use existing backend endpoint
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} Array of listing objects
 */
export const getAllListings = async (filters = {}) => {
  const token = getToken();
  const queryParams = new URLSearchParams();
  
  // Add filter parameters (backend may not support all filtering yet)
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.condition) queryParams.append('condition', filters.condition);
  if (filters.min_price) queryParams.append('min_price', filters.min_price);
  if (filters.max_price) queryParams.append('max_price', filters.max_price);
  if (filters.location) queryParams.append('location', filters.location);
  if (filters.ordering) queryParams.append('ordering', filters.ordering);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.page_size) queryParams.append('page_size', filters.page_size);
  
  // Use the existing listings endpoint (returns all listings)
  const url = `${BASE_URL}/listings/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
};

/**
 * Get trending listings - Fallback to recent listings for now
 * @returns {Promise<Array>} Array of trending listing objects
 */
export const getTrendingListings = async () => {
  // Since trending endpoint doesn't exist, get all listings and return the most recent ones
  try {
    const allListings = await getAllListings({ ordering: '-created_at', page_size: 6 });
    return Array.isArray(allListings) ? allListings : allListings.results || [];
  } catch (error) {
    console.warn('Trending listings not available, returning empty array:', error);
    return [];
  }
};

/**
 * Get recent listings - Fallback to regular listings
 * @returns {Promise<Array>} Array of recent listing objects
 */
export const getRecentListings = async () => {
  // Since recent endpoint doesn't exist, get all listings ordered by creation date
  try {
    const allListings = await getAllListings({ ordering: '-created_at', page_size: 8 });
    return Array.isArray(allListings) ? allListings : allListings.results || [];
  } catch (error) {
    console.warn('Recent listings not available, returning empty array:', error);
    return [];
  }
};

/**
 * Get saved/bookmarked items for current user - Placeholder until implemented
 * @returns {Promise<Array>} Array of saved listing objects
 */
export const getSavedItems = async () => {
  // Saved items feature not implemented in backend yet
  console.warn('Saved items feature not implemented in backend yet');
  return [];
};

/**
 * Save/bookmark an item - Placeholder until implemented
 * @param {string} listingId - Listing ID to save
 * @returns {Promise<Object>} Save response
 */
export const saveItem = async (listingId) => {
  // Saved items feature not implemented in backend yet
  console.warn('Save item feature not implemented in backend yet');
  return { success: false, message: 'Save feature not yet available' };
};

/**
 * Unsave/unbookmark an item - Placeholder until implemented
 * @param {string} listingId - Listing ID to unsave
 * @returns {Promise<Object>} Unsave response
 */
export const unsaveItem = async (listingId) => {
  // Saved items feature not implemented in backend yet
  console.warn('Unsave item feature not implemented in backend yet');
  return { success: false, message: 'Unsave feature not yet available' };
};

/**
 * Get shopping cart items - Placeholder until implemented
 * @returns {Promise<Array>} Array of cart item objects
 */
export const getCartItems = async () => {
  // Cart feature not implemented in backend yet
  console.warn('Cart feature not implemented in backend yet');
  return [];
};

/**
 * Add item to cart - Placeholder until implemented
 * @param {string} listingId - Listing ID to add to cart
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} Add to cart response
 */
export const addToCart = async (listingId, quantity = 1) => {
  // Cart feature not implemented in backend yet
  console.warn('Add to cart feature not implemented in backend yet');
  return { success: false, message: 'Cart feature not yet available' };
};

/**
 * Update cart item quantity - Placeholder until implemented
 * @param {string} cartItemId - Cart item ID
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>} Update response
 */
export const updateCartItem = async (cartItemId, quantity) => {
  console.warn('Update cart feature not implemented in backend yet');
  return { success: false, message: 'Cart update feature not yet available' };
};

/**
 * Remove item from cart - Placeholder until implemented
 * @param {string} cartItemId - Cart item ID to remove
 * @returns {Promise<Object>} Remove response
 */
export const removeFromCart = async (cartItemId) => {
  console.warn('Remove from cart feature not implemented in backend yet');
  return { success: false, message: 'Cart removal feature not yet available' };
};

/**
 * Get categories - Fallback with default categories
 * @returns {Promise<Array>} Array of category objects
 */
export const getCategories = async () => {
  // Categories endpoint doesn't exist yet, return default categories
  console.warn('Categories endpoint not available, using fallback categories');
  return [
    { id: 'books', name: 'Books & Textbooks', count: 0 },
    { id: 'electronics', name: 'Electronics', count: 0 },
    { id: 'clothing', name: 'Clothing & Fashion', count: 0 },
    { id: 'furniture', name: 'Furniture', count: 0 },
    { id: 'services', name: 'Services', count: 0 },
    { id: 'sports', name: 'Sports & Recreation', count: 0 },
    { id: 'food', name: 'Food & Dining', count: 0 },
    { id: 'other', name: 'Other', count: 0 }
  ];
};

/**
 * Get listing stats for seller dashboard - Placeholder
 * @returns {Promise<Object>} Stats object with views, inquiries, etc.
 */
export const getListingStats = async () => {
  console.warn('Listing stats feature not implemented in backend yet');
  return {
    total_listings: 0,
    total_views: 0,
    total_inquiries: 0,
    total_sales: 0
  };
};

/**
 * Get buyer inquiries for seller - Placeholder
 * @returns {Promise<Array>} Array of inquiry objects
 */
export const getBuyerInquiries = async () => {
  console.warn('Buyer inquiries feature not implemented in backend yet');
  return [];
};

/**
 * Reply to buyer inquiry - Placeholder
 * @param {string} inquiryId - Inquiry ID
 * @param {string} message - Reply message
 * @returns {Promise<Object>} Reply response
 */
export const replyToInquiry = async (inquiryId, message) => {
  console.warn('Reply to inquiry feature not implemented in backend yet');
  return { success: false, message: 'Inquiry reply feature not yet available' };
};

/**
 * Contact seller about listing - Placeholder
 * @param {string} listingId - Listing ID
 * @param {string} message - Message to seller
 * @returns {Promise<Object>} Contact response
 */
export const contactSeller = async (listingId, message) => {
  console.warn('Contact seller feature not implemented in backend yet');
  return { success: false, message: 'Contact seller feature not yet available' };
};

/**
 * Get campus locations/areas - Fallback with default locations
 * @returns {Promise<Array>} Array of location objects
 */
export const getCampusLocations = async () => {
  // Locations endpoint doesn't exist yet, return default KU locations
  console.warn('Locations endpoint not available, using fallback locations');
  return [
    { id: 'main_campus', name: 'Main Campus' },
    { id: 'lower_kabete', name: 'Lower Kabete' },
    { id: 'upper_kabete', name: 'Upper Kabete' },
    { id: 'hostels', name: 'Student Hostels' },
    { id: 'library', name: 'Library Area' },
    { id: 'sports_complex', name: 'Sports Complex' },
    { id: 'agriculture', name: 'Agriculture Faculty' },
    { id: 'engineering', name: 'Engineering Faculty' }
  ];
};

/**
 * Search listings with advanced filters - Use regular listings endpoint
 * @param {Object} searchParams - Search and filter parameters
 * @returns {Promise<Object>} Search results with pagination
 */
export const searchListings = async (searchParams) => {
  // Use the regular getAllListings function for search since search endpoint doesn't exist
  try {
    const results = await getAllListings(searchParams);
    
    // If results is an array, wrap it in pagination format
    if (Array.isArray(results)) {
      return {
        results: results,
        count: results.length,
        next: null,
        previous: null
      };
    }
    
    // If it's already in pagination format, return as is
    return results;
  } catch (error) {
    console.warn('Search listings failed, returning empty results:', error);
    return {
      results: [],
      count: 0,
      next: null,
      previous: null
    };
  }
};

/**
 * Get listing view count and increment - Placeholder
 * @param {string} listingId - Listing ID
 * @returns {Promise<Object>} View response
 */
export const viewListing = async (listingId) => {
  console.warn('View listing tracking not implemented in backend yet');
  return { success: false, message: 'View tracking not yet available' };
};

/**
 * Mark listing as sold - Placeholder
 * @param {string} listingId - Listing ID
 * @returns {Promise<Object>} Update response
 */
export const markAsSold = async (listingId) => {
  console.warn('Mark as sold feature not implemented in backend yet');
  return { success: false, message: 'Mark as sold feature not yet available' };
};

/**
 * Get dashboard summary data - Placeholder
 * @returns {Promise<Object>} Dashboard summary with various metrics
 */
export const getDashboardSummary = async () => {
  console.warn('Dashboard summary feature not implemented in backend yet');
  return {
    total_listings: 0,
    active_listings: 0,
    total_views: 0,
    total_inquiries: 0,
    this_month_sales: 0,
    pending_orders: 0
  };
};
