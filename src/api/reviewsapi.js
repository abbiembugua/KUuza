const BASE_URL = 'http://127.0.0.1:8000/api';

const getToken = () => localStorage.getItem('access') || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.results || [];
};

// ── Generic list with query params ────────────────────────────────────────────
export async function getReviews(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.append(key, value);
  });

  const response = await fetch(
    `${BASE_URL}/reviews/${query.toString() ? `?${query}` : ''}`,
    { headers: authHeaders() }
  );

  if (!response.ok) throw new Error('Could not load reviews');
  return normalizeCollection(await response.json());
}

// ── Reviews RECEIVED by a specific user ───────────────────────────────────────
// Hits GET /api/reviews/for_user/{userId}/
// Pass { asSeller: true } to return only reviews from transactions where the
// user was the seller (buyer-reviewing-seller feedback only).
export async function getReviewsForUser(userId, { asSeller = false, asBuyer = false } = {}) {
  if (!userId) return [];

  const params = new URLSearchParams();
  if (asSeller) params.append('as_seller', 'true');
  if (asBuyer)  params.append('as_buyer',  'true');
  const query = params.toString() ? `?${params}` : '';

  const response = await fetch(`${BASE_URL}/reviews/for_user/${userId}/${query}`, {
    headers: authHeaders(),
  });

  if (!response.ok) throw new Error('Could not load seller reviews');
  return normalizeCollection(await response.json());
}

// ── Aggregated rating summary — computed in DB, not the browser ───────────────
// Hits GET /api/reviews/summary/{userId}/
// Returns { average_rating, total_reviews, score_breakdown }
export async function getReviewSummary(userId) {
  if (!userId) {
    return { average_rating: 0, total_reviews: 0, score_breakdown: {} };
  }

  const response = await fetch(`${BASE_URL}/reviews/summary/${userId}/`, {
    headers: authHeaders(),
  });

  if (!response.ok) throw new Error('Could not load review summary');
  return await response.json(); // already shaped correctly by the backend
}

// ── Reviews the logged-in user has WRITTEN ────────────────────────────────────
// Hits GET /api/reviews/by_me/
export async function getMyGivenReviews() {
  const response = await fetch(`${BASE_URL}/reviews/by_me/`, {
    headers: authHeaders(),
  });

  if (!response.ok) throw new Error('Could not load your given reviews');
  return normalizeCollection(await response.json());
}

// ── Update a review the logged-in user has written ───────────────────────────
// Hits PATCH /api/reviews/{id}/
export async function updateReview(reviewId, data) {
  const response = await fetch(`${BASE_URL}/reviews/${reviewId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Could not update review');
  return response.json();
}

// ── Delete a review the logged-in user has written ────────────────────────────
// Hits DELETE /api/reviews/{id}/
export async function deleteReview(reviewId) {
  const response = await fetch(`${BASE_URL}/reviews/${reviewId}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Could not delete review');
}

// ── Check / fetch review for a specific transaction ───────────────────────────
export async function getReviewForTransaction(transactionId) {
  if (!transactionId) return null;

  const response = await fetch(
    `${BASE_URL}/reviews/check/?transaction_id=${transactionId}`,
    { headers: authHeaders() }
  );

  if (!response.ok) throw new Error('Could not check review status');

  const data = await response.json();
  if (!data?.has_reviewed) return null;

  // If the check endpoint embeds the review object, use it directly
  if (data.review) return data.review;

  // Otherwise do a second fetch scoped to this transaction
  const reviews = await getReviews({ transaction_id: transactionId });
  return reviews[0] || null;
}