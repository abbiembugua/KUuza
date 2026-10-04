const API_BASE = 'http://localhost:8000/api';

const postReport = async (body) => {
  const token = localStorage.getItem('access');
  if (!token) throw new Error('You must be logged in to submit a report.');

  const res = await fetch(`${API_BASE}/reports/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.listing?.[0] || data.reported_user_id?.[0] || data.non_field_errors?.[0] ||
      data.reason?.[0] || data.detail || data.error || 'Failed to submit report.'
    );
  }
  return data;
};

export const submitReport = ({ listingId, reason, details }) =>
  postReport({ listing: listingId, reason, details: details || '' });

export const submitSellerReport = ({ sellerId, reason, details }) =>
  postReport({ reported_user_id: sellerId, reason, details: details || '' });
