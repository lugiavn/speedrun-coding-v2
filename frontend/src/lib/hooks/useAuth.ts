import { useState, useEffect, useCallback } from 'react';
import { api, auth } from '../api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Load user data if token exists
  const loadUser = useCallback(async () => {
    if (!auth.isAuthenticated()) {
      setState((prev: AuthState) => ({ ...prev, isLoading: false, isAuthenticated: false }));
      return;
    }

    setState((prev: AuthState) => ({ ...prev, isLoading: true }));
    
    try {
      const user = await api.users.me();
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      console.error('Failed to load user:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: 'Failed to load user data',
      });
      // Clear invalid tokens
      auth.clearTokens();
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Login function
  const login = async ({ username, password }: LoginCredentials) => {
    setState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.auth.login(username, password);
      const { access, refresh } = response as AuthResponse;
      
      // Store tokens
      auth.setToken(access, refresh);
      
      // Load user data
      await loadUser();
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setState((prev: AuthState) => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Invalid username or password' 
      }));
      return false;
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    setState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Add password_confirm field required by the backend
      const registerData = {
        ...data,
        password_confirm: data.password
      };
      
      await api.users.register(registerData);
      
      // Auto login after registration
      return await login({
        username: data.username,
        password: data.password,
      });
    } catch (error) {
      console.error('Registration failed:', error);
      setState((prev: AuthState) => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Registration failed. Please try again.' 
      }));
      return false;
    }
  };

  // Logout function
  const logout = useCallback(() => {
    auth.clearTokens();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    login,
    register,
    logout,
  };
} 