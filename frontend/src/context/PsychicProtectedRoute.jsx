// src/context/PsychicProtectedRoute.jsx - FIXED VERSION
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePsychicAuth } from "@/context/PsychicAuthContext";

export default function PsychicProtectedRoute({ children }) {
  const { isAuthenticated, loading, initialCheckDone, psychic } = usePsychicAuth();
  const location = useLocation();
  const [checkingToken, setCheckingToken] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(null);

  // Function to validate token
 // In PsychicProtectedRoute.jsx - UPDATE validation
const validateToken = async () => {
  const token = localStorage.getItem('psychicToken');
  if (!token) {
    setHasValidToken(false);
    return false;
  }

  try {
    // Try to decode the token to check role
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const decoded = JSON.parse(jsonPayload);
    console.log("🔍 Token validation - decoded:", decoded);
    
    // Check if token has the correct role
    if (decoded.role !== 'psychic') {
      console.log("❌ Token missing psychic role");
      localStorage.removeItem('psychicToken');
      localStorage.removeItem('psychicId');
      localStorage.removeItem('psychicName');
      setHasValidToken(false);
      return false;
    }

    // Check expiration
    const isExpired = decoded.exp && Date.now() >= decoded.exp * 1000;
    if (isExpired) {
      console.log("❌ Token expired");
      localStorage.removeItem('psychicToken');
      localStorage.removeItem('psychicId');
      localStorage.removeItem('psychicName');
      setHasValidToken(false);
      return false;
    }

    console.log("✅ Token is valid with role:", decoded.role);
    setHasValidToken(true);
    return true;
  } catch (error) {
    console.error("❌ Token validation error:", error);
    localStorage.removeItem('psychicToken');
    localStorage.removeItem('psychicId');
    localStorage.removeItem('psychicName');
    setHasValidToken(false);
    return false;
  }
};

  // Check token validity on mount and when location changes
  useEffect(() => {
    const checkTokenValidity = async () => {
      if (checkingToken) return;
      
      setCheckingToken(true);
      const isValid = await validateToken();
      setCheckingToken(false);
      
      console.log("Token validity check result:", isValid);
    };

    checkTokenValidity();
  }, [location.pathname]);

  // Debug logging
  useEffect(() => {
    console.log("PsychicProtectedRoute Debug:", {
      loading,
      initialCheckDone,
      isAuthenticated,
      hasPsychic: !!psychic,
      hasValidToken,
      psychicId: psychic?._id,
      currentPath: location.pathname,
      psychicTokenExists: !!localStorage.getItem('psychicToken'),
      userTokenExists: !!localStorage.getItem('accessToken') // Check if user token is interfering
    });

    // Check if user token is interfering with psychic auth
    const userToken = localStorage.getItem('accessToken');
    const psychicToken = localStorage.getItem('psychicToken');
    
    if (userToken && !psychicToken && location.pathname.startsWith('/psychic')) {
      console.warn("⚠️ User token found but no psychic token - this might cause conflicts");
    }
  }, [loading, initialCheckDone, isAuthenticated, psychic, hasValidToken, location.pathname]);

  // Show loading only on initial check
  if (loading && !initialCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
        <div className="text-white text-2xl flex items-center gap-4">
          <div className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Loading psychic portal...</span>
        </div>
      </div>
    );
  }

  // If we're checking token validity, show loading
  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-[#3B5EB7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Check if we have a VALID token
  const token = localStorage.getItem('psychicToken');
  const hasToken = !!token;
  
  // If no token or invalid token, redirect to login
  if ((!hasToken || hasValidToken === false) && initialCheckDone) {
    console.log("Redirecting to login: No valid token found");
    
    // Clear any psychic-related data
    localStorage.removeItem('psychicToken');
    localStorage.removeItem('psychicId');
    localStorage.removeItem('psychicName');
    
    return <Navigate 
      to="/psychic/login" 
      state={{ from: location.pathname }} 
      replace 
    />;
  }

  // If we have a token but psychic is null (refresh case), show loading
  if (hasToken && !psychic && initialCheckDone && hasValidToken !== false) {
    console.log("Has valid token but psychic is null - loading psychic data");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-[#3B5EB7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Restoring session...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  if (isAuthenticated && psychic) {
    return <>{children}</>;
  }

  // If still loading, show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-[#3B5EB7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Default: redirect to login
  console.log("Default redirect to login - no valid authentication found");
  return <Navigate 
    to="/psychic/login" 
    state={{ from: location.pathname }} 
    replace 
  />;
}