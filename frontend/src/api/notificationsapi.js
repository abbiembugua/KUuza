const API_BASE = 'http://127.0.0.1:8000/api';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('access') || ''}`,
});

export const getNotifications = async () => {
  const response = await fetch(`${API_BASE}/notifications/`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to load notifications');
  }

  const result = await response.json();
  return Array.isArray(result) ? result : result?.results || [];
};

export const dismissNotification = async (notificationId) => {
  const response = await fetch(`${API_BASE}/notifications/${notificationId}/dismiss/`, {
    method: 'PATCH',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Unable to dismiss notification');
  }

  return response.json().catch(() => ({}));
};
