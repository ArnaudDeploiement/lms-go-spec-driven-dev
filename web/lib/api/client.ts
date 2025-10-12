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

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  settings?: Record<string, any>;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  status?: string;
  settings?: Record<string, any>;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  role?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface UserFilter {
  role?: string;
  status?: string;
}

export interface CourseResponse {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  version: number;
  metadata: Record<string, any> | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseRequest {
  title: string;
  slug: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CourseFilter {
  status?: string;
}

export interface ModuleResponse {
  id: string;
  course_id: string;
  title: string;
  module_type: string;
  content_id?: string | null;
  position: number;
  duration_seconds: number;
  status: string;
  data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleRequest {
  title: string;
  module_type: string;
  content_id?: string | null;
  duration_seconds?: number;
  data?: Record<string, any>;
}

export interface EnrollmentResponse {
  id: string;
  course_id: string;
  user_id: string;
  group_id?: string | null;
  status: string;
  progress: number;
  metadata: Record<string, any> | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnrollRequest {
  course_id: string;
  user_id: string;
  group_id?: string | null;
  metadata?: Record<string, any>;
}

export interface UpdateEnrollmentRequest {
  status?: string;
  progress?: number;
  metadata?: Record<string, any>;
  group_id?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface EnrollmentFilter {
  course_id?: string;
  user_id?: string;
  group_id?: string;
  status?: string;
}

export interface GroupResponse {
  id: string;
  course_id?: string | null;
  name: string;
  description: string;
  capacity?: number | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupRequest {
  course_id?: string | null;
  name: string;
  description: string;
  capacity?: number | null;
  metadata?: Record<string, any>;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  capacity?: number | null;
  metadata?: Record<string, any>;
}

export interface GroupFilter {
  course_id?: string;
}

export interface ContentResponse {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  storage_key: string;
}

export interface CreateContentRequest {
  name: string;
  mime_type: string;
  size_bytes: number;
  metadata?: Record<string, any>;
}

export interface FinalizeContentRequest {
  name?: string;
  mime_type?: string;
  size_bytes?: number;
  metadata?: Record<string, any>;
}

export interface UploadLinkResponse {
  content: ContentResponse;
  upload_url: string;
  expires_at: string;
}

export interface DownloadLinkResponse {
  download_url: string;
  expires_at: string;
}

export interface ProgressResponse {
  module_id: string;
  title: string;
  module_type: string;
  position: number;
  status: string;
  score: number;
  attempts: number;
  started_at?: string | null;
  completed_at?: string | null;
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

  // ============ ORGANIZATION ENDPOINTS ============

  async listOrganizations(status?: string): Promise<OrganizationResponse[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/orgs${query}`);
  }

  async createOrganization(data: CreateOrganizationRequest): Promise<OrganizationResponse> {
    return this.request('/orgs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrganization(id: string): Promise<OrganizationResponse> {
    return this.request(`/orgs/${id}`);
  }

  async updateOrganization(id: string, data: UpdateOrganizationRequest): Promise<OrganizationResponse> {
    return this.request(`/orgs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async archiveOrganization(id: string): Promise<void> {
    await this.request(`/orgs/${id}`, { method: 'DELETE' });
  }

  async activateOrganization(id: string): Promise<void> {
    await this.request(`/orgs/${id}/activate`, { method: 'POST' });
  }

  // ============ COURSE ENDPOINTS ============

  async getCourses(orgId: string, filter: CourseFilter = {}): Promise<CourseResponse[]> {
    const query = filter.status ? `?status=${encodeURIComponent(filter.status)}` : '';
    return this.request(`/courses${query}`, {
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  async getCourse(orgId: string, courseId: string): Promise<CourseResponse> {
    return this.request(`/courses/${courseId}`, {
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  async createCourse(orgId: string, data: CreateCourseRequest): Promise<CourseResponse> {
    return this.request('/courses', {
      method: 'POST',
      headers: {
        'X-Org-ID': orgId,
      },
      body: JSON.stringify(data),
    });
  }

  async updateCourse(orgId: string, courseId: string, data: UpdateCourseRequest): Promise<CourseResponse> {
    return this.request(`/courses/${courseId}`, {
      method: 'PATCH',
      headers: {
        'X-Org-ID': orgId,
      },
      body: JSON.stringify(data),
    });
  }

  async publishCourse(orgId: string, courseId: string): Promise<void> {
    await this.request(`/courses/${courseId}/publish`, {
      method: 'POST',
      headers: { 'X-Org-ID': orgId },
    });
  }

  async unpublishCourse(orgId: string, courseId: string): Promise<void> {
    await this.request(`/courses/${courseId}/unpublish`, {
      method: 'POST',
      headers: { 'X-Org-ID': orgId },
    });
  }

  async archiveCourse(orgId: string, courseId: string): Promise<void> {
    await this.request(`/courses/${courseId}`, {
      method: 'DELETE',
      headers: { 'X-Org-ID': orgId },
    });
  }

  async deleteCourse(orgId: string, courseId: string): Promise<void> {
    await this.request(`/courses/${courseId}/hard`, {
      method: 'DELETE',
      headers: { 'X-Org-ID': orgId },
    });
  }

  async listModules(orgId: string, courseId: string): Promise<ModuleResponse[]> {
    return this.request(`/courses/${courseId}/modules`, {
      headers: { 'X-Org-ID': orgId },
    });
  }

  async createModule(orgId: string, courseId: string, data: ModuleRequest): Promise<ModuleResponse> {
    const payload: Record<string, any> = {
      title: data.title,
      module_type: data.module_type,
    };
    if (data.content_id !== undefined) payload.content_id = data.content_id;
    if (data.duration_seconds !== undefined) payload.duration_seconds = data.duration_seconds;
    if (data.data !== undefined) payload.data = data.data;

    return this.request(`/courses/${courseId}/modules`, {
      method: 'POST',
      headers: { 'X-Org-ID': orgId },
      body: JSON.stringify(payload),
    });
  }

  async updateModule(orgId: string, moduleId: string, data: ModuleRequest): Promise<ModuleResponse> {
    const payload: Record<string, any> = {
      title: data.title,
      module_type: data.module_type,
    };
    if (data.content_id !== undefined) payload.content_id = data.content_id;
    if (data.duration_seconds !== undefined) payload.duration_seconds = data.duration_seconds;
    if (data.data !== undefined) payload.data = data.data;

    return this.request(`/courses/modules/${moduleId}`, {
      method: 'PATCH',
      headers: { 'X-Org-ID': orgId },
      body: JSON.stringify(payload),
    });
  }

  async deleteModule(orgId: string, moduleId: string): Promise<void> {
    await this.request(`/courses/modules/${moduleId}`, {
      method: 'DELETE',
      headers: { 'X-Org-ID': orgId },
    });
  }

  async reorderModules(orgId: string, courseId: string, moduleIds: string[]): Promise<void> {
    await this.request(`/courses/${courseId}/modules/reorder`, {
      method: 'POST',
      headers: { 'X-Org-ID': orgId },
      body: JSON.stringify({ module_ids: moduleIds }),
    });
  }

  // ============ ENROLLMENT ENDPOINTS ============

  async getEnrollments(orgId: string, filter: EnrollmentFilter = {}): Promise<EnrollmentResponse[]> {
    const params = new URLSearchParams();
    if (filter.user_id) params.set('user_id', filter.user_id);
    if (filter.course_id) params.set('course_id', filter.course_id);
    if (filter.group_id) params.set('group_id', filter.group_id);
    if (filter.status) params.set('status', filter.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/enrollments${query}`, {
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  async createEnrollment(orgId: string, data: EnrollRequest): Promise<EnrollmentResponse> {
    return this.request('/enrollments', {
      method: 'POST',
      headers: {
        'X-Org-ID': orgId,
      },
      body: JSON.stringify(data),
    });
  }

  async updateEnrollment(orgId: string, enrollmentId: string, data: UpdateEnrollmentRequest): Promise<EnrollmentResponse> {
    return this.request(`/enrollments/${enrollmentId}`, {
      method: 'PATCH',
      headers: {
        'X-Org-ID': orgId,
      },
      body: JSON.stringify(data),
    });
  }

  async cancelEnrollment(orgId: string, enrollmentId: string): Promise<void> {
    await this.request(`/enrollments/${enrollmentId}`, {
      method: 'DELETE',
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  async listGroups(orgId: string, filter: GroupFilter = {}): Promise<GroupResponse[]> {
    const params = new URLSearchParams();
    if (filter.course_id) params.set('course_id', filter.course_id);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/enrollments/groups${query}`, {
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  async createGroup(orgId: string, data: CreateGroupRequest): Promise<GroupResponse> {
    return this.request('/enrollments/groups', {
      method: 'POST',
      headers: { 'X-Org-ID': orgId },
      body: JSON.stringify(data),
    });
  }

  async updateGroup(orgId: string, groupId: string, data: UpdateGroupRequest): Promise<GroupResponse> {
    return this.request(`/enrollments/groups/${groupId}`, {
      method: 'PATCH',
      headers: { 'X-Org-ID': orgId },
      body: JSON.stringify(data),
    });
  }

  async deleteGroup(orgId: string, groupId: string): Promise<void> {
    await this.request(`/enrollments/groups/${groupId}`, {
      method: 'DELETE',
      headers: { 'X-Org-ID': orgId },
    });
  }

  // ============ USER ENDPOINTS ============

  async listUsers(orgId: string, filter: UserFilter = {}): Promise<UserResponse[]> {
    const params = new URLSearchParams();
    if (filter.role) params.set('role', filter.role);
    if (filter.status) params.set('status', filter.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/users${query}`, {
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  async createUser(orgId: string, data: CreateUserRequest): Promise<UserResponse> {
    return this.request('/users', {
      method: 'POST',
      headers: { 'X-Org-ID': orgId },
      body: JSON.stringify(data),
    });
  }

  async getUser(orgId: string, userId: string): Promise<UserResponse> {
    return this.request(`/users/${userId}`, {
      headers: { 'X-Org-ID': orgId },
    });
  }

  async updateUser(orgId: string, userId: string, data: UpdateUserRequest): Promise<UserResponse> {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      headers: { 'X-Org-ID': orgId },
      body: JSON.stringify(data),
    });
  }

  async deactivateUser(orgId: string, userId: string): Promise<void> {
    await this.request(`/users/${userId}`, {
      method: 'DELETE',
      headers: { 'X-Org-ID': orgId },
    });
  }

  async activateUser(orgId: string, userId: string): Promise<void> {
    await this.request(`/users/${userId}/activate`, {
      method: 'POST',
      headers: { 'X-Org-ID': orgId },
    });
  }

  // ============ PROGRESS ENDPOINTS ============

  async getProgress(orgId: string, enrollmentId: string): Promise<ProgressResponse[]> {
    return this.request(`/enrollments/${enrollmentId}/progress`, {
      headers: {
        'X-Org-ID': orgId,
      },
    });
  }

  async startModule(orgId: string, enrollmentId: string, moduleId: string): Promise<any> {
    return this.request(`/enrollments/${enrollmentId}/progress/start`, {
      method: 'POST',
      headers: {
        'X-Org-ID': orgId,
      },
      body: JSON.stringify({ module_id: moduleId }),
    });
  }

  async completeModule(orgId: string, enrollmentId: string, moduleId: string, score?: number): Promise<any> {
    return this.request(`/enrollments/${enrollmentId}/progress/complete`, {
      method: 'POST',
      headers: {
        'X-Org-ID': orgId,
      },
      body: JSON.stringify({
        module_id: moduleId,
        score,
      }),
    });
  }

  // ============ CONTENT ENDPOINTS ============

  async listContents(orgId: string): Promise<ContentResponse[]> {
    return this.request('/contents', {
      headers: { 'X-Org-ID': orgId },
    });
  }

  async createContent(orgId: string, data: CreateContentRequest): Promise<UploadLinkResponse> {
    return this.request('/contents', {
      method: 'POST',
      headers: { 'X-Org-ID': orgId },
      body: JSON.stringify(data),
    });
  }

  async getContent(orgId: string, contentId: string): Promise<ContentResponse> {
    return this.request(`/contents/${contentId}`, {
      headers: { 'X-Org-ID': orgId },
    });
  }

  async finalizeContent(orgId: string, contentId: string, data: FinalizeContentRequest): Promise<ContentResponse> {
    return this.request(`/contents/${contentId}/finalize`, {
      method: 'POST',
      headers: { 'X-Org-ID': orgId },
      body: JSON.stringify(data),
    });
  }

  async archiveContent(orgId: string, contentId: string): Promise<void> {
    await this.request(`/contents/${contentId}`, {
      method: 'DELETE',
      headers: { 'X-Org-ID': orgId },
    });
  }

  async getDownloadLink(orgId: string, contentId: string): Promise<DownloadLinkResponse> {
    return this.request(`/contents/${contentId}/download`, {
      headers: { 'X-Org-ID': orgId },
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };
