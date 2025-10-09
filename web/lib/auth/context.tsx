"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, SignupRequest, LoginRequest, SignupResponse } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  role: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (data: SignupRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated from localStorage
    const storedUser = localStorage.getItem('user');
    const storedOrg = localStorage.getItem('organization');

    if (storedUser && storedOrg) {
      setUser(JSON.parse(storedUser));
      setOrganization(JSON.parse(storedOrg));
    }

    setIsLoading(false);
  }, []);

  const signup = async (data: SignupRequest) => {
    try {
      const response = await apiClient.signup(data);

      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
      };

      const orgData: Organization = {
        id: response.organization.id,
        name: response.organization.name,
        slug: response.organization.slug,
      };

      setUser(userData);
      setOrganization(orgData);

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('organization', JSON.stringify(orgData));
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      await apiClient.login(data);

      // After login, we need to fetch user data
      // For now, we'll store minimal data
      // TODO: Add a /me endpoint to fetch current user
      const userData: User = {
        id: 'temp', // Will be replaced by /me endpoint
        email: data.email,
        role: 'learner',
      };

      const orgData: Organization = {
        id: data.organization_id,
        name: 'Organization', // Will be replaced by /me endpoint
        slug: 'org',
      };

      setUser(userData);
      setOrganization(orgData);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('organization', JSON.stringify(orgData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
  };

  const value: AuthContextType = {
    user,
    organization,
    isLoading,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
