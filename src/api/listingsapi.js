// src/Services/api/listingsApi.js
// API calls for listings management

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

// ==================== GET OPERATIONS ====================

/**
 * Get all listings for current user
 * @returns {Promise<Array>} Array of listing objects
 */
export const getMyListings = async (params = {}) => {
  const token = getToken();
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== '' && val !== null && val !== undefined) query.append(key, val);
  });
  const qs = query.toString();

  const response = await fetch(`${BASE_URL}/listings/my_listings/${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return handleResponse(response);
};

/**
 * Get single listing by ID
 * @param {string} listingId - Listing ID
 * @returns {Promise<Object>} Listing object
 */
export const getListingById = async (listingId) => {
  const token = getToken();
  
  const response = await fetch(`${BASE_URL}/listings/${listingId}/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return handleResponse(response);
};

// ==================== CREATE OPERATIONS ====================

/**
 * Create new listing
 * @param {Object} listingData - Listing data
 * @returns {Promise<Object>} Created listing with ID
 */
export const createListing = async (listingData) => {
  const token = getToken();
  
  const response = await fetch(`${BASE_URL}/listings/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(listingData),
  });
  
  return handleResponse(response);
};

/**
 * Upload images for listing
 * @param {string} listingId - Listing ID
 * @param {File[]} files - Image files
 * @returns {Promise<Object>} Upload response
 */
export const uploadListingImages = async (listingId, files) => {
  const token = getToken();
  const formData = new FormData();
  
  files.forEach(file => formData.append('images', file));

  const response = await fetch(`${BASE_URL}/listings/${listingId}/upload_images/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  return handleResponse(response);
};

// ==================== UPDATE OPERATIONS ====================

/**
 * Update listing
 * @param {string} listingId - Listing ID
 * @param {Object} updatedData - Updated listing data
 * @returns {Promise<Object>} Updated listing
 */
export const updateListing = async (listingId, updatedData) => {
  const token = getToken();
  
  const response = await fetch(`${BASE_URL}/listings/${listingId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updatedData),
  });
  
  return handleResponse(response);
};

/**
 * Publish a draft listing
 * @param {string} listingId - Listing ID
 * @returns {Promise<Object>} Updated listing
 */
export const publishDraft = async (listingId) => {
  return updateListing(listingId, { is_draft: false });
};

/**
 * Convert published listing to draft
 * @param {string} listingId - Listing ID
 * @returns {Promise<Object>} Updated listing
 */
export const convertToDraft = async (listingId) => {
  return updateListing(listingId, { is_draft: true });
};

// ==================== ARCHIVE / REACTIVATE ====================

export const archiveListing = async (listingId) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/listings/${listingId}/deactivate/`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse(response);
};

export const reactivateListing = async (listingId) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/listings/${listingId}/reactivate/`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return handleResponse(response);
};

// ==================== DELETE OPERATIONS ====================

/**
 * Delete listing permanently
 * @param {string} listingId - Listing ID
 * @returns {Promise<Object>} Delete response
 */
export const deleteListing = async (listingId) => {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/listings/${listingId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 204) {
    return { success: true, message: 'Listing deleted successfully' };
  }

  return handleResponse(response);
};

// ==================== IMAGE OPERATIONS ====================

/**
 * Delete a single image from a listing
 * @param {string} listingId - Listing ID
 * @param {number} imageId   - ListingImage ID
 */
export const deleteListingImage = async (listingId, imageId) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}/listings/${listingId}/images/${imageId}/`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (response.status === 204) return { success: true };
  return handleResponse(response);
};

// ==================== AI OPERATIONS ====================

/**
 * Refine listing with AI
 * @param {string} title - Listing title
 * @param {string} category - Listing category
 * @param {string} description - Listing description
 * @returns {Promise<Object>} AI suggestions
 */
export const refineListingWithAI = async (title, category, description) => {
  const token = getToken();
  
  const response = await fetch(`${BASE_URL}/listings/refine_item/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ title, category, description }),
  });
  
  return handleResponse(response);
};

// ==================== FILTER OPERATIONS ====================

/**
 * Get published listings only
 * @returns {Promise<Array>} Published listings
 */
export const getPublishedListings = async () => {
  const allListings = await getMyListings();
  return allListings.filter(listing => !listing.is_draft);
};

/**
 * Get draft listings only
 * @returns {Promise<Array>} Draft listings
 */
export const getDraftListings = async () => {
  const allListings = await getMyListings();
  return allListings.filter(listing => listing.is_draft);
};
