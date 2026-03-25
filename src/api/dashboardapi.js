// src/api/dashboardapi.js
// Fixed version — correct token key, differentiated trending/recent, working filters

const BASE_URL = 'http://127.0.0.1:8000/api';

// ── IMPORTANT: match exactly what your AuthContext stores ─────────────────────
const getToken = () => localStorage.getItem('access') || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization:  `Bearer ${getToken()}`,
});

const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
    let msg = `Error ${response.status}`;
    try {
      const err = await response.json();
      msg = err.detail || err.error || err.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return response.json();
};

// ── Listings ──────────────────────────────────────────────────────────────────

export const getAllListings = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search)    params.append('search',    filters.search);
  if (filters.category)  params.append('category',  filters.category);
  if (filters.listing_type) params.append('listing_type', filters.listing_type);
  if (filters.condition) params.append('condition', filters.condition);
  if (filters.status)    params.append('status',    filters.status || 'active');
  if (filters.ordering)  params.append('ordering',  filters.ordering);
  if (filters.page)      params.append('page',      filters.page);
  if (filters.page_size) params.append('page_size', filters.page_size);

  const url = `${BASE_URL}/listings/${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return handleResponse(res);
};

// Trending = most viewed listings
export const getTrendingListings = async () => {
  try {
    const data = await getAllListings({
      ordering:  '-views_count',
      page_size: 10,
      status:    'active',
    });
    const arr = Array.isArray(data) ? data : data?.results || [];
    const withViews = arr.filter(l => l.views_count > 0);
    return withViews.length > 0 ? withViews : arr.slice(0, 6);
  } catch {
    return [];
  }
};

// Recent = newest listings by creation date
export const getRecentListings = async () => {
  try {
    const data = await getAllListings({
      ordering:  '-created_at',
      page_size: 10,
      status:    'active',
    });
    const arr = Array.isArray(data) ? data : data?.results || [];
    return arr;
  } catch {
    return [];
  }
};

export const viewListing = async (listingId) => {
  try {
    await fetch(`${BASE_URL}/listings/${listingId}/increment_views/`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  } catch {}
};

// ── Cart ──────────────────────────────────────────────────────────────────────

export async function getCartItems() {
  const res = await fetch(`${BASE_URL}/cart/`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Could not load cart');
  const data = await res.json();
  return data.items || [];
}

export async function getCart() {
  const res = await fetch(`${BASE_URL}/cart/`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Could not load cart');
  return res.json();
}

export async function addToCart(listingId, quantity = 1) {
  const res = await fetch(`${BASE_URL}/cart/add/`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify({ listing_id: listingId, quantity }),
  });
  if (!res.ok) {
    let msg = 'Could not add to cart';
    try {
      const err = await res.json();
      msg = err.error || err.non_field_errors?.[0] || err.listing?.[0] || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function updateCartItem(cartItemId, quantity) {
  const res = await fetch(`${BASE_URL}/cart/items/${cartItemId}/`, {
    method:  'PATCH',
    headers: authHeaders(),
    body:    JSON.stringify({ quantity }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Could not update cart item');
  }
  return res.json();
}

export async function removeFromCart(cartItemId) {
  const res = await fetch(`${BASE_URL}/cart/items/${cartItemId}/`, {
    method:  'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Could not remove item');
  return true;
}

export async function clearCart() {
  const res = await fetch(`${BASE_URL}/cart/`, {
    method:  'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Could not clear cart');
  return true;
}

export async function checkCartAvailability() {
  const res = await fetch(`${BASE_URL}/cart/check_availability/`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Could not check availability');
  return res.json();
}

// ── Categories (static — matches your database values exactly) ───────────────

export const getCategories = async () => [
  { id: 'books',          name: 'Books & Textbooks' },
  { id: 'electronics',    name: 'Electronics' },
  { id: 'fashion',        name: 'Fashion' },
  { id: 'furniture',      name: 'Furniture' },
  { id: 'food_beverages', name: 'Food & Beverages' },
  { id: 'services',       name: 'Services' },
  { id: 'other',          name: 'Other' },
];

// ── Campus locations (static) ─────────────────────────────────────────────────

export const getCampusLocations = async () => [
  { id: 'main_gate',      name: 'KU Main Gate' },
  { id: 'student_centre', name: 'Student Centre' },
  { id: 'ksit',           name: 'KSIT Building' },
  { id: 'bssc',           name: 'BSSC' },
  { id: 'library',        name: 'Main Library' },
  { id: 'hostels',        name: 'Hostels Area' },
  { id: 'cafeteria',      name: 'Main Cafeteria' },
];

// ── Transactions (Purchases & Sold Items) ──────────────────────────────────────

export const getMyTransactions = async (params = {}) => {
  /**
   * Get all transactions for the current user
   * @param {Object} params - Query parameters (role, status, etc.)
   * @returns {Promise<Array>} List of transactions
   */
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/transactions/${query ? `?${query}` : ''}`;
    const res = await fetch(url, { headers: authHeaders() });
    
    if (!res.ok) {
      if (res.status === 404) {
        console.log('Transactions endpoint not found - no transactions yet');
        return [];
      }
      throw new Error('Could not load transactions');
    }
    const data = await res.json();
    return data.results || data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const getPurchases = async () => {
  return getMyTransactions({ role: 'buyer' });
};

export const getSoldItems = async () => {
  return getMyTransactions({ role: 'seller', status: 'completed' });
};

export const getSales = async () => {
  return getMyTransactions({ role: 'seller' });
};

export const getCompletedSales = async () => {
  return getMyTransactions({ role: 'seller', status: 'completed' });
};

export const getPendingTransactions = async () => {
  return getMyTransactions({ status: 'pending' });
};

// ── Pending Reviews ──────────────────────────────────────────────────────

export const getPendingReviews = async () => {
  /**
   * Get transactions that need reviews
   */
  try {
    const res = await fetch(`${BASE_URL}/transactions/pending_reviews/`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Could not load pending reviews');
    const data = await res.json();
    return data.results || data;
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    return [];
  }
};

// ── Placeholders (features not yet built) ─────────────────────────────────────

export const getSavedItems    = async () => [];
export const saveItem         = async () => ({ success: false });
export const unsaveItem       = async () => ({ success: false });
export const getListingStats  = async () => ({
  total_listings: 0, total_views: 0, total_sales: 0
});
export const getBuyerInquiries = async () => [];
export const replyToInquiry    = async () => ({ success: false });
export const contactSeller     = async () => ({ success: false });
export const getDashboardSummary = async () => ({
  total_listings: 0, active_listings: 0, total_views: 0, pending_orders: 0
});

export const markAsSold = async () => ({ success: false });

export const searchListings = async (params) => {
  try {
    const data = await getAllListings(params);
    if (Array.isArray(data)) return { results: data, count: data.length, next: null };
    return data;
  } catch {
    return { results: [], count: 0, next: null };
  }
};

// Add this to your dashboardapi.js file (at the end, before the placeholders)

export const getMyAllListings = async (params = {}) => {
  /**
   * Get ALL listings for the current user (including drafts, sold, deactivated)
   * @param {Object} params - Query parameters (status, is_draft, etc.)
   * @returns {Promise<Array>} List of all user's listings
   */
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/listings/my_listings/${query ? `?${query}` : ''}`;
    const res = await fetch(url, { 
      headers: authHeaders() 
    });
    
    if (!res.ok) throw new Error('Could not load your listings');
    const data = await res.json();
    return data.results || data;
  } catch (error) {
    console.error('Error fetching my listings:', error);
    return [];
  }
};