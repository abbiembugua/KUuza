import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout as logoutApi } from "../api/authapi";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // ✅ Add token state
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setToken(accessToken); // ✅ Set token in state

    getCurrentUser()
      .then(setUser)
      .catch(() => {
        setUser(null);
        setToken(null); // ✅ Clear token on error
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.warn("Logout API failed, clearing session anyway");
    }

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
    setToken(null); // ✅ Clear token state
    navigate("/");
  };

  // ✅ Provide token in context
  return (
    <AuthContext.Provider value={{ user, token, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);