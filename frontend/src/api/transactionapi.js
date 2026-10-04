const API_BASE = 'http://127.0.0.1:8000/api';

const patch = async (url, token, body = {}) => {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Request failed');
  }
  return res.json();
};

export const markComplete      = (id, token) => patch(`${API_BASE}/transactions/${id}/mark_complete/`, token);
export const cancelTransaction = (id, token) => patch(`${API_BASE}/transactions/${id}/cancel/`, token);
export const confirmReceipt    = (id, token) => patch(`${API_BASE}/transactions/${id}/confirm_receipt/`, token);
export const resolveDispute    = (id, token) => patch(`${API_BASE}/transactions/${id}/resolve_dispute/`, token);

export const disputeTransaction = (id, token, reason) =>
  patch(`${API_BASE}/transactions/${id}/dispute/`, token, { reason });

export const submitSellerResponse = (id, token, response) =>
  patch(`${API_BASE}/transactions/${id}/submit_seller_response/`, token, { response });

export const fetchContactDetails = async (listingId, token) => {
  const res = await fetch(`${API_BASE}/listings/${listingId}/contact_details/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not retrieve contact details');
  return res.json();
};
