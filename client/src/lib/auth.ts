import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";

// User interface
interface User {
  id: number;
  username: string;
  fullName: string;
  position: string;
  office: string;
  role: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Default context
const defaultContext: AuthContextType = {
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
};

// Create context
const AuthContext = createContext(defaultContext);

// Export hook for using auth
export const useAuth = () => useContext(AuthContext);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        
        if (token) {
          // Set the token in headers for the request
          const headers = new Headers();
          headers.append("Authorization", `Bearer ${token}`);
          
          const response = await fetch("/api/auth/me", {
            headers,
            credentials: "include",
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Clear token if invalid
            localStorage.removeItem("authToken");
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("authToken");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await response.json();
      
      // Save token to localStorage
      localStorage.setItem("authToken", data.token);
      
      // Set user data
      setUser(data.user);
      
      // Set the auth header for all future requests
      const headers = new Headers();
      headers.append("Authorization", `Bearer ${data.token}`);
      
      // Verify the token works by making a request to /api/auth/me
      const verifyResponse = await fetch("/api/auth/me", {
        headers,
        credentials: "include",
      });
      
      if (!verifyResponse.ok) {
        throw new Error("Authentication verification failed");
      }
      
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      
      // Clear token and user data
      localStorage.removeItem("authToken");
      setUser(null);
      
      // Clear all queries
      queryClient.clear();
    } catch (error) {
      console.error("Logout error:", error);
      
      // Still remove auth data even if the request fails
      localStorage.removeItem("authToken");
      setUser(null);
    }
  };

  return React.createElement(AuthContext.Provider, {
    value: {
      user,
      isLoading,
      login,
      logout
    }
  }, children);
}