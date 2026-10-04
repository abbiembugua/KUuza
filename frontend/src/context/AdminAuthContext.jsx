import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogout } from '../api/adminapi';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_access');
    if (!token) {
      setAdminLoading(false);
      return;
    }
    // Validate token by hitting the dashboard endpoint
    fetch('http://localhost:8000/api/admin-panel/dashboard/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          // Token is valid; restore a minimal user marker
          setAdminUser({ is_staff: true });
        } else {
          adminLogout();
        }
      })
      .catch(() => adminLogout())
      .finally(() => setAdminLoading(false));
  }, []);

  const logout = () => {
    adminLogout();
    setAdminUser(null);
    navigate('/kuuza-control/');
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, setAdminUser, adminLoading, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
