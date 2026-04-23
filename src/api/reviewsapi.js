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

// ── Reviews RECEIVED by a specific seller ─────────────────────────────────────
// Hits GET /api/reviews/for_user/{userId}/
export async function getReviewsForUser(userId) {
  if (!userId) return [];

  const response = await fetch(`${BASE_URL}/reviews/for_user/${userId}/`, {
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