import React, { createContext, useState, useEffect, useMemo } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Use "token" to match your backend
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Login function
  const login = (token, userData) => {
    console.log("Setting auth token:", token.substring(0, 15) + "...");
    console.log("Setting user data:", userData);
    
    setAuthToken(token);
    setUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Set default Authorization header for all future requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  // Logout function
  const logout = () => {
    console.log("Logging out user");
    
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Remove Authorization header
    delete axios.defaults.headers.common["Authorization"];
  };

  // Check for token and user on app load
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    console.log("Auth initialization - Token exists:", !!storedToken);

    if (storedToken && storedUser) {
      try {
        setAuthToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Set axios default header with token
        axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      } catch (err) {
        console.error("Error parsing stored user data:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      authToken,
      user,
      loading,
      error,
      login,
      logout,
    }),
    [authToken, user, loading, error]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthContext;


