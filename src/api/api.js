
// Add request interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 error and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        
        const response = await api.post('/token/refresh/', {
          refresh: refreshToken
        });
        
        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API helper functions
const listingsAPI = {
  getAll: (params = {}) => api.get('/listings/', { params }),
  getOne: (id) => api.get(`/listings/${id}/`),
  create: (data) => api.post('/listings/', data),
  update: (id, data) => api.put(`/listings/${id}/`, data),
  delete: (id) => api.delete(`/listings/${id}/`),
  getMyListings: () => api.get('/listings/my-listings/'),
  getDrafts: () => api.get('/listings/drafts/'),
  publish: (id) => api.post(`/listings/${id}/publish/`),
  markSold: (id) => api.post(`/listings/${id}/mark-sold/`),
};

const pickupLocationsAPI = {
  getAll: () => api.get('/pickup-locations/'),
};

const aiAPI = {
  getSuggestions: (data) => api.post('/ai/suggestions/', data),
};

const uploadAPI = {
  uploadImage: (formData) => api.post('/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

const authAPI = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  register: (data) => api.post('/auth/register/', data),
  logout: (data) => api.post('/auth/logout/', data),
  getUser: () => api.get('/auth/user/'),
};

export {
  api,
  listingsAPI,
  pickupLocationsAPI,
  aiAPI,
  uploadAPI,
  authAPI
};

export default api;