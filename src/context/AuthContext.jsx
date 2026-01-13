import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout as logoutApi } from "../api/authapi";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // ✅ added

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // ✅ added (does NOT remove anything)
  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.warn("Logout API failed, clearing session anyway");
    }

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
    navigate("/"); // landing / home page
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
