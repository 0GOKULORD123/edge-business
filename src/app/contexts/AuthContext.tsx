import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, requestsAPI, inviteAPI } from '../services/api';
import { supabase } from '/utils/supabase/client';

export interface User {
  id: string;
  username: string;
  email?: string;
  purpose?: string;
  credits: number;
  status: 'pending' | 'active' | 'suspended';
  selectedPlan?: string;
  isAdmin: boolean;
  walletAddress?: string;
}

export interface ReviewRequest {
  id: string;
  userId: string;
  username: string;
  type: 'add' | 'remove';
  status: 'submitted' | 'awaiting_agent' | 'accepted' | 'processing' | 'completed' | 'failed';
  creditsUsed: number;
  createdAt: string;
  updatedAt: string;
  
  // Add Reviews specific
  businessName?: string;
  businessLink?: string;
  location?: string;
  reviewTone?: string;
  keywords?: string[];
  specialInstructions?: string;
  reviewCount?: number;
  spreadOverTime?: boolean;
  mediaFiles?: { name: string; url: string; type: string }[];
  
  // Remove Reviews specific
  selectedReviews?: {
    id: string;
    reviewer: string;
    rating: number;
    text: string;
    date: string;
  }[];
  evidenceFiles?: { name: string; url: string; type: string }[];
  
  // Messaging
  messages?: {
    id: string;
    from: 'admin' | 'user';
    text: string;
    timestamp: string;
  }[];
  uploadMethod?: 'scan' | 'manual';
  manualFiles?: { name: string; url: string; type: string }[];
  businessData?: {
    name: string;
    address: string;
    rating: number;
    totalReviews: number;
    placeId: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasAcceptedInvite: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: Partial<User> & { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  acceptInvite: (code: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  addCredits: (amount: number) => Promise<void>;
  refreshUser: () => Promise<void>;

  // Request management
  createRequest: (request: Omit<ReviewRequest, 'id' | 'userId' | 'username' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getRequests: (userId?: string) => Promise<ReviewRequest[]>;
  updateRequest: (requestId: string, updates: Partial<ReviewRequest>) => Promise<void>;
  addRequestMessage: (requestId: string, message: string, from: 'admin' | 'user') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasAcceptedInvite, setHasAcceptedInvite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from sessionStorage (temporary storage for current session)
    const storedUser = sessionStorage.getItem('edge_user');
    const storedInvite = localStorage.getItem('edge_invite_accepted');

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Refresh user data from backend
      refreshUserData(parsedUser.id);
    }
    if (storedInvite) {
      setHasAcceptedInvite(true);
    }

    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !storedUser) {
        // We have a Supabase session but no local user - fetch user data
        authAPI.getUser(session.user.id).then((userData) => {
          setUser(userData);
          sessionStorage.setItem('edge_user', JSON.stringify(userData));
        }).catch((error) => {
          console.error('Failed to fetch user data from session:', error);
        });
      }
    });

    setLoading(false);
  }, []);

  const refreshUserData = async (userId: string) => {
    try {
      if (userId === 'admin-001') {
        return; // Admin doesn't need refresh
      }
      const userData = await authAPI.getUser(userId);
      setUser(userData);
      sessionStorage.setItem('edge_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Try to login through backend API (which handles username lookup and admin login)
      const response = await authAPI.login(username, password);
      if (response.success) {
        setUser(response.user);
        sessionStorage.setItem('edge_user', JSON.stringify(response.user));

        // Store session if available
        if (response.session) {
          sessionStorage.setItem('edge_session', JSON.stringify(response.session));
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();

    setUser(null);
    sessionStorage.removeItem('edge_user');
    sessionStorage.removeItem('edge_session');
  };

  const register = async (userData: Partial<User> & { username: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    }
  };

  const acceptInvite = async (code: string): Promise<boolean> => {
    try {
      const response = await inviteAPI.validateCode(code);
      if (response.valid) {
        setHasAcceptedInvite(true);
        localStorage.setItem('edge_invite_accepted', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to validate invite code:', error);
      return false;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const response = await authAPI.updateUser(user.id, updates);
      if (response.success) {
        const updatedUser = response.user;
        setUser(updatedUser);
        sessionStorage.setItem('edge_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const addCredits = async (amount: number) => {
    if (!user) return;
    await updateUser({ credits: user.credits + amount });
  };

  const refreshUser = async () => {
    if (user) {
      await refreshUserData(user.id);
    }
  };

  // Request management
  const createRequest = async (request: Omit<ReviewRequest, 'id' | 'userId' | 'username' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const response = await requestsAPI.create({
        ...request,
        userId: user?.id || '',
        username: user?.username || '',
      });
      return response.request.id;
    } catch (error) {
      console.error('Failed to create request:', error);
      throw error;
    }
  };

  const getRequests = async (userId?: string): Promise<ReviewRequest[]> => {
    try {
      return await requestsAPI.getAll(userId);
    } catch (error) {
      console.error('Failed to get requests:', error);
      return [];
    }
  };

  const updateRequest = async (requestId: string, updates: Partial<ReviewRequest>) => {
    try {
      await requestsAPI.update(requestId, updates);
    } catch (error) {
      console.error('Failed to update request:', error);
      throw error;
    }
  };

  const addRequestMessage = async (requestId: string, message: string, from: 'admin' | 'user') => {
    try {
      await requestsAPI.addMessage(requestId, message, from, user?.id);
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        hasAcceptedInvite,
        loading,
        login,
        logout,
        register,
        acceptInvite,
        updateUser,
        addCredits,
        refreshUser,

        // Request management
        createRequest,
        getRequests,
        updateRequest,
        addRequestMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}