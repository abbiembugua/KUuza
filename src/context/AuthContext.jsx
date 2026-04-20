import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthStorage, getCurrentUser, logout as logoutApi } from "../api/authapi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("access");

    if (!accessToken) {
      setLoading(false);
      return;
    }

    setToken(accessToken);

    getCurrentUser()
      .then((currentUser) => {
        if (currentUser?.is_email_verified === false) {
          clearAuthStorage();
          setUser(null);
          setToken(null);
          return;
        }

        setUser(currentUser);
      })
      .catch(() => {
        clearAuthStorage();
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.warn("Logout API failed, clearing session anyway");
    }

    clearAuthStorage();
    setUser(null);
    setToken(null);
    navigate("/");
  };

  const refreshUser = async () => {
    const latestUser = await getCurrentUser();
    setUser(latestUser);
    return latestUser;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
