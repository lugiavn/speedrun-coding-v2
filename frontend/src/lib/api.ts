import { API_BASE_URL, JWT_CONFIG } from './config';

/**
 * Custom fetch wrapper with authentication and error handling
 */
export async function fetchAPI<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false // Added to prevent infinite refresh loops
): Promise<T> {
  // Determine if this is an absolute URL or a relative path
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Get the token from storage if available
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem(JWT_CONFIG.tokenKey) 
    : null;
  
  // Prepare headers with proper typing
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle errors
  if (!response.ok) {
    // Handle 401 Unauthorized - could trigger token refresh flow
    if (response.status === 401 && !isRetry) { // Only attempt refresh if not already a retry
      console.log('Access token expired or invalid. Attempting refresh...');
      const currentRefreshToken = auth.getRefreshToken();
      if (currentRefreshToken) {
        try {
          // Type assertion for the response of refreshToken
          const refreshResponse = await api.auth.refreshToken(currentRefreshToken) as { access: string; refresh?: string };
          auth.setToken(refreshResponse.access, refreshResponse.refresh);
          console.log('Token refreshed successfully. Retrying original request...');
          // Retry the original request with the new token
          // Preserve original options, but the new token will be picked up automatically
          return fetchAPI<T>(endpoint, options, true); // Pass true for isRetry
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          auth.clearTokens(); // Clear tokens if refresh fails
          // Optionally redirect to login or show a global message
          // window.location.href = '/login'; 
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        console.error('No refresh token available. User needs to log in.');
        auth.clearTokens(); // Ensure tokens are cleared if no refresh token
        throw new Error('Authentication required. Please log in.');
      }
    }
    
    // Try to get error details from response
    let errorMessage = `API request failed with status: ${response.status}`;
    try {
      // Convert response.body (ReadableStream) to text
      const errorText = await response.text();
      if (errorText) {
        errorMessage += ` - ${errorText}`;
      }
    } catch (textError) {
      console.error('Failed to read error response body:', textError);
    }
    throw new Error(errorMessage);
  }
  
  // Parse JSON response
  const data = await response.json();
  return data as T;
}

/**
 * Authentication helpers
 */
export const auth = {
  // Store JWT token in localStorage
  setToken(token: string, refreshToken?: string): void {
    localStorage.setItem(JWT_CONFIG.tokenKey, token);
    if (refreshToken) {
      localStorage.setItem(JWT_CONFIG.refreshTokenKey, refreshToken);
    }
  },
  
  // Get the current token
  getToken(): string | null {
    return localStorage.getItem(JWT_CONFIG.tokenKey);
  },
  
  // Get the refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(JWT_CONFIG.refreshTokenKey);
  },
  
  // Clear tokens (logout)
  clearTokens(): void {
    localStorage.removeItem(JWT_CONFIG.tokenKey);
    localStorage.removeItem(JWT_CONFIG.refreshTokenKey);
  },
  
  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

/**
 * API endpoints for different resources
 */
export const api = {
  // Problems
  problems: {
    list: (query?: string) => fetchAPI(`/problems${query ? query : '/'}`),
    getById: (id: number) => fetchAPI(`/problems/${id}/`),
    getBySlug: (slug: string) => fetchAPI(`/problems/?slug=${slug}`),
    create: (data: any) => fetchAPI('/problems/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (idOrSlug: string | number, data: any) => fetchAPI(`/problems/${idOrSlug}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    // We might also need a delete method later
    // delete: (idOrSlug: string | number) => fetchAPI(`/problems/${idOrSlug}/`, {
    //   method: 'DELETE',
    // }),
  },
  
  // Submissions
  submissions: {
    create: (data: any) => fetchAPI('/submissions/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    list: () => fetchAPI('/submissions/'),
    getById: (id: number) => fetchAPI(`/submissions/${id}/`),
    getStats: () => fetchAPI('/submissions/stats/'),
    getForProblem: (problemId: number) => fetchAPI(`/submissions/?problem_id=${problemId}`),
  },
  
  // Users
  users: {
    me: () => fetchAPI('/users/me/'),
    register: (data: any) => fetchAPI('/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    changePassword: (data: { current_password: string; new_password: string }) => 
      fetchAPI('/change-password/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  
  // Authentication
  auth: {
    login: (username: string, password: string) => 
      fetchAPI('/token/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    refreshToken: (refreshToken: string) => 
      fetchAPI('/token/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh: refreshToken }),
      }),
  }
};

/**
 * Simple fetcher function for SWR
 */
export const fetcher = (url: string) => fetchAPI(url); 