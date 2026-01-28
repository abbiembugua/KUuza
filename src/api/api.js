// api.js
const BASE_URL = "http://127.0.0.1:8000/api";

const getToken = (token) => {
  // ✅ Look for 'access' token (JWT) instead of 'token'
  return token || localStorage.getItem('access') || '';
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    
    if (response.status === 401) {
      errorMessage = 'Authentication failed. Please login again.';
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      window.location.href = '/login'; // Redirect to login
    } else {
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || `Error ${response.status}`;
      } catch {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
    }
    
    throw new Error(errorMessage);
  }
  
  return await response.json();
};

export const createListing = async (listingData, token) => {
  const authToken = getToken(token);
  
  console.log('Creating listing with token:', authToken ? 'Token exists' : 'No token');
  
  const response = await fetch(`${BASE_URL}/listings/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`, // ✅ Bearer for JWT
    },
    body: JSON.stringify(listingData),
  });
  
  return handleResponse(response);
};

export const uploadListingImages = async (listingId, files, token) => {
  const authToken = getToken(token);
  const formData = new FormData();
  
  files.forEach(file => formData.append('images', file));

  const response = await fetch(`${BASE_URL}/listings/${listingId}/upload_images/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`, // ✅ Bearer for JWT
    },
    body: formData,
  });
  
  return handleResponse(response);
};

export const refineListingWithAI = async (title, category, description, token) => {
  const authToken = getToken(token);
  
  console.log('Refining with token:', authToken ? 'Token exists' : 'No token');
  
  const response = await fetch(`${BASE_URL}/listings/refine_item/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`, // ✅ Bearer for JWT
    },
    body: JSON.stringify({ title, category, description }),
  });
  
  return handleResponse(response);
};