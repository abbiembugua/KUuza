const ADMIN_API = 'http://localhost:8000/api/admin-panel';

const adminHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('admin_access')}`,
});

const handleResponse = async (res) => {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || 'Request failed');
  return data;
};

export const adminLogin = async (email, password) => {
  const res = await fetch('http://localhost:8000/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || 'Login failed');

  const user = data.user || data;
  if (!user?.is_staff) throw new Error('Access denied. Admin accounts only.');

  const access = data.access || data.tokens?.access;
  const refresh = data.refresh || data.tokens?.refresh;
  if (!access || !refresh) throw new Error('No tokens returned.');

  localStorage.setItem('admin_access', access);
  localStorage.setItem('admin_refresh', refresh);
  return user;
};

export const adminLogout = () => {
  localStorage.removeItem('admin_access');
  localStorage.removeItem('admin_refresh');
};

export const fetchDashboardStats = async () => {
  const res = await fetch(`${ADMIN_API}/dashboard/`, { headers: adminHeaders() });
  return handleResponse(res);
};

export const fetchAdminListings = async () => {
  const res = await fetch(`${ADMIN_API}/listings/`, { headers: adminHeaders() });
  return handleResponse(res);
};

export const removeListing = async (id) => {
  const res = await fetch(`${ADMIN_API}/listings/${id}/`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  return handleResponse(res);
};

export const fetchAdminUsers = async () => {
  const res = await fetch(`${ADMIN_API}/users/`, { headers: adminHeaders() });
  return handleResponse(res);
};

export const suspendUser = async (id) => {
  const res = await fetch(`${ADMIN_API}/users/${id}/suspend/`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  return handleResponse(res);
};

export const reactivateUser = async (id) => {
  const res = await fetch(`${ADMIN_API}/users/${id}/reactivate/`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  return handleResponse(res);
};

export const fetchAdminReports = async () => {
  const res = await fetch(`${ADMIN_API}/reports/`, { headers: adminHeaders() });
  return handleResponse(res);
};

export const dismissReport = async (id) => {
  const res = await fetch(`${ADMIN_API}/reports/${id}/dismiss/`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  return handleResponse(res);
};

export const reportRemoveListing = async (id) => {
  const res = await fetch(`${ADMIN_API}/reports/${id}/remove_listing/`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  return handleResponse(res);
};

export const reportSuspendUser = async (id) => {
  const res = await fetch(`${ADMIN_API}/reports/${id}/suspend_user/`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  return handleResponse(res);
};

export const fetchAdminSellers = async () => {
  const res = await fetch(`${ADMIN_API}/sellers/`, { headers: adminHeaders() });
  return handleResponse(res);
};

export const revokeSellerVerification = async (id) => {
  const res = await fetch(`${ADMIN_API}/sellers/${id}/revoke/`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  return handleResponse(res);
};
