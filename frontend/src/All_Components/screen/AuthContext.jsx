import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Remove the refresh token interceptor
  useEffect(() => {
    // Only set up the authorization header interceptor
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Cleanup function
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setLoading(false);
          setUser(null);
          return;
        }
        const { data } = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Auth check successful, setting user:", data.user);
        setUser(data.user);
      } catch (err) {
        console.error("Auth check failed:", err);
        
        // If it's a 401 error, just clear the token
        if (err.response?.status === 401) {
          localStorage.removeItem("accessToken");
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    setUser(null);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/users/login`,
        credentials
      );
      if (data.token && data.user) {
        localStorage.setItem("accessToken", data.token);
        setUser(data.user);
        console.log("Login successful, user set:", data.user);
        return { success: true };
      } else {
        throw new Error("Invalid login response");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      console.error("Login failed:", msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/users/register`,
        payload
      );
      if (data.token && data.user) {
        localStorage.setItem("accessToken", data.token);
        setUser(data.user);
        console.log("Registration successful, user set:", data.user);
        return { success: true };
      } else {
        throw new Error("Invalid register response");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
      console.error("Registration failed:", msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setError(null);
    console.log("Logout successful, navigating to /login");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}