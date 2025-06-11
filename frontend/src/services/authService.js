import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from './apiClient';

const AuthContext = createContext(null);

// Service functions
const authService = {
  // Login for registered user
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      //backend returns token_type as "registered"
      if (response.data.tokens && response.data.tokens.access_token && response.data.token_type === "registered") {
        localStorage.setItem('accessToken', response.data.tokens.access_token);
        localStorage.setItem('tokenType', 'registered'); // Lưu loại token
        if (response.data.tokens.refresh_token) {
          localStorage.setItem('refreshToken', response.data.tokens.refresh_token);
        }
        // Return user info if available, or entire response
        return response.data; 
      }
      // Handle case where no token is received or token type is invalid
      throw new Error('Login failed or invalid token type received.');
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      // Call logout API if token exists (guest or registered)
      if (localStorage.getItem('accessToken')) {
        await apiClient.get('/auth/logout'); // Endpoint now handles both guest and user
      }
    } catch (error) {
      // Backend error should not prevent logout at client
      console.error('Logout API error:', error.response?.data || error.message);
    } finally {
      // Always delete tokens and session info from localStorage when logging out
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenType'); // Delete token type
      localStorage.removeItem('guestId'); // Delete guestId if it exists
    }
  },

  // Check if user is authenticated (is registered user)
  isAuthenticated: () => {
    const tokenType = localStorage.getItem('tokenType');
    return localStorage.getItem('accessToken') !== null && tokenType === 'registered';
  },

  // Check if guest session is active
  isGuestSessionActive: () => {
    const tokenType = localStorage.getItem('tokenType');
    return localStorage.getItem('accessToken') !== null && tokenType === 'guest';
  },
  
  // Get current user/guest info from backend
  getCurrentUser: async () => {
    if (!localStorage.getItem('accessToken')) {
      return null; // No token, no need to call API
    }
    try {
      const response = await apiClient.get('/auth/whoami');
      return response.data.user_info; // Backend trả về user_info { type, id/guest_id, username, email? }
    } catch (error) {
      console.error('Get current user error:', error.response?.data || error.message);
      // The new interceptor in apiClient will handle 401 errors (token refresh or logout).
      // No need to call logout from here anymore for 401.
      // We might still want to logout for other specific errors if needed.
      if (error.response && error.response.status === 422) {
         // 422 might still indicate a malformed token that won't be a 401
         await authService.logout(); // delete invalid token
      }
      return null; // Or throw error depending on how component handles this
    }
  },

  // Initiate guest session (replace old loginAsGuest)
  initiateGuestSession: async () => {
    try {
      // Call new endpoint on backend
      const response = await apiClient.post('/auth/api/v1/guest/session/initiate');
      // Backend returns token_type as "guest"
      if (response.data.access_token && response.data.token_type === "guest") {
        localStorage.setItem('accessToken', response.data.access_token);
        localStorage.setItem('tokenType', 'guest'); // Lưu loại token là guest
        if(response.data.guest_id) {
            localStorage.setItem('guestId', response.data.guest_id); // Lưu guestId nếu backend trả về
        }
        // Guest does not have refresh token
        localStorage.removeItem('refreshToken'); 
        return response.data; 
      }
      // Handle case where no token is received or token type is invalid
      throw new Error('Guest session initiation failed or invalid token type received.');
    } catch (error) {
      console.error('Guest session initiation error:', error.response?.data || error.message);
      throw error;
    }
  }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkUser = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(authService.isAuthenticated());
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkUser();
    }, [checkUser]);

    const login = async (email, password) => {
        const response = await authService.login(email, password);
        await checkUser();
        return response;
    };

    const logout = async () => {
        await authService.logout();
        await checkUser();
    };
    
    const initiateGuestSession = async () => {
        const response = await authService.initiateGuestSession();
        await checkUser();
        return response;
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        initiateGuestSession,
        register: authService.register,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default authService;