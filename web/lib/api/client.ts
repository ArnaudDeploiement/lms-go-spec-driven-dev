/**
 * API Client with automatic token refresh
 * Handles authentication and provides a clean interface for API calls
 */

export interface ApiError {
  error: string;
  status: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export interface SignupRequest {
  org_name: string;
  org_slug?: string;
  email: string;
  password: string;
  metadata?: Record<string, any>;
}

export interface SignupResponse extends AuthTokens {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface LoginRequest {
  organization_id: string;
  email: string;
  password: string;
}

export interface LoginResponse extends AuthTokens {}

export interface RefreshResponse extends AuthTokens {}

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  /**
   * ✅ En dev : tout passe par le proxy Next (/api → http://api:8080)
   *   → plus besoin de NEXT_PUBLIC_API_URL ni de CORS
   */
  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      credentials: 'include', // include cookies (same-site)
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 - attempt token refresh
      if (response.status === 401 && !endpoint.includes('/auth/')) {
        await this.refreshToken();
        // Retry original request
        const retryResponse = await fetch(url, config);
        if (!retryResponse.ok) {
          throw await this.handleError(retryResponse);
        }
        return await retryResponse.json();
      }

      if (!response.ok) {
        throw await this.handleError(response);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message === 'Failed to fetch') {
        throw {
          error: 'Impossible de se connecter au serveur',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  private async handleError(response: Response): Promise<ApiError> {
    try {
      const data = await response.json();
      return {
        error: data.error || response.statusText,
        status: response.status,
      };
    } catch {
      return {
        error: response.statusText || 'Une erreur est survenue',
        status: response.status,
      };
    }
  }

  /**
   * Refresh authentication tokens
   */
  private async refreshToken(): Promise<void> {
    // Prevent multiple concurrent refresh requests
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        await fetch(`${this.baseUrl}/auth/refresh?use_cookies=true`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      } catch (error) {
        // If refresh fails, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ============ AUTH ENDPOINTS ============

  async signup(data: SignupRequest): Promise<SignupResponse> {
    return this.request<SignupResponse>('/auth/signup?use_cookies=true', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login?use_cookies=true', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async me(): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/auth/me');
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore errors
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // ============ COURSE ENDPOINTS ============

  async getCourses(orgId: string): Promise<any[]> {
    return this.request('/courses', {
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  async getCourse(orgId: string, courseId: string): Promise<any> {
    return this.request(`/courses/${courseId}`, {
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  // ============ ENROLLMENT ENDPOINTS ============

  async getEnrollments(orgId: string, userId?: string): Promise<any[]> {
    const query = userId ? `?user_id=${userId}` : '';
    return this.request(`/enrollments${query}`, {
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  async enrollInCourse(orgId: string, courseId: string): Promise<any> {
    return this.request(`/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  // ============ PROGRESS ENDPOINTS ============

  async getProgress(orgId: string, enrollmentId: string): Promise<any> {
    return this.request(`/enrollments/${enrollmentId}/progress`, {
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  async updateProgress(
    orgId: string,
    enrollmentId: string,
    moduleId: string,
    status: 'in_progress' | 'completed'
  ): Promise<any> {
    return this.request(`/enrollments/${enrollmentId}/progress`, {
      method: 'POST',
      headers: {
        'X-Org-ID': orgId,
      },
      body: JSON.stringify({ module_id: moduleId, status }),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };
