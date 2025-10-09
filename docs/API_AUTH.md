# Authentication API Documentation

This document describes the authentication endpoints available for the LMS Go frontend (Next.js).

## Base URL

```
http://localhost:8080/auth
```

## Endpoints

### 1. Signup (Initial Organization Creation)

Creates a new organization with an initial admin user. This is the primary endpoint for new users signing up to the platform.

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "org_name": "My Organization",
  "org_slug": "my-organization",  // Optional, generated from org_name if not provided
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "metadata": {  // Optional
    "source": "web",
    "referral": "google"
  }
}
```

**Response (201 Created):**
```json
{
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Organization",
    "slug": "my-organization"
  },
  "user": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "email": "admin@example.com",
    "role": "admin"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-10-09T12:00:00Z"
}
```

**Cookie Support:**
Add `?use_cookies=true` to the endpoint to also set httpOnly cookies:
```
POST /auth/signup?use_cookies=true
```

This will set two httpOnly cookies:
- `access_token` (expires with the token, ~15min)
- `refresh_token` (expires after 72h)

**Error Responses:**
- `400 Bad Request`: Invalid payload (missing required fields)
- `409 Conflict`: Email or organization slug already exists
- `500 Internal Server Error`: Server error

---

### 2. Login

Authenticates an existing user and returns JWT tokens.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "organization_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-10-09T12:00:00Z"
}
```

**Cookie Support:**
Add `?use_cookies=true` to also set httpOnly cookies (recommended for web applications).

**Error Responses:**
- `400 Bad Request`: Invalid payload
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account inactive
- `500 Internal Server Error`: Server error

---

### 3. Refresh Token

Obtains new access and refresh tokens using a valid refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Alternative (Cookie-based):**
If using cookies, you can send an empty body and the refresh token will be read from the `refresh_token` cookie:
```json
{}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-10-09T12:15:00Z"
}
```

**Cookie Support:**
Add `?use_cookies=true` to refresh the httpOnly cookies.

**Error Responses:**
- `400 Bad Request`: Missing refresh token
- `401 Unauthorized`: Invalid or expired refresh token
- `500 Internal Server Error`: Server error

---

### 4. Forgot Password (Placeholder)

Initiates a password reset process. **Note:** This is currently a placeholder endpoint that always returns success without sending emails.

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Si un compte existe avec cet email, un lien de réinitialisation sera envoyé"
}
```

---

### 5. Register (User in Existing Organization)

Registers a new user within an existing organization. **Note:** This requires an existing organization ID.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "organization_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "role": "learner",  // Optional, defaults to "learner"
  "metadata": {}  // Optional
}
```

**Response (201 Created):**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "organization_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "role": "learner",
  "status": "active"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid payload or organization_id
- `409 Conflict`: Email already used
- `500 Internal Server Error`: Server error

---

## JWT Token Details

### Access Token
- **Lifetime:** 15 minutes (configurable via `ACCESS_TOKEN_TTL`)
- **Usage:** Include in `Authorization` header as `Bearer <token>` for API requests
- **Claims:**
  - `sub`: User ID
  - `organization_id`: Organization ID
  - `role`: User role (admin, designer, tutor, learner)
  - `token_type`: "access"
  - `exp`: Expiration timestamp
  - `iat`: Issued at timestamp

### Refresh Token
- **Lifetime:** 72 hours (configurable via `REFRESH_TOKEN_TTL`)
- **Usage:** Use to obtain new access/refresh tokens via `/auth/refresh`
- **Claims:**
  - `sub`: User ID
  - `organization_id`: Organization ID
  - `role`: User role
  - `token_type`: "refresh"
  - `refresh_token_id`: Unique ID for token rotation
  - `exp`: Expiration timestamp
  - `iat`: Issued at timestamp

---

## Authentication Flow Recommendations

### For Web Applications (Next.js)

**Recommended:** Use cookie-based authentication with httpOnly cookies.

1. **Initial Signup:**
   ```javascript
   const response = await fetch('/auth/signup?use_cookies=true', {
     method: 'POST',
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       org_name: 'My Company',
       email: 'admin@example.com',
       password: 'SecurePass123!'
     })
   });

   const data = await response.json();
   // Tokens are automatically stored in httpOnly cookies
   // You can also store organization/user data in localStorage if needed
   ```

2. **Login:**
   ```javascript
   const response = await fetch('/auth/login?use_cookies=true', {
     method: 'POST',
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       organization_id: orgId,
       email: 'user@example.com',
       password: 'SecurePass123!'
     })
   });
   ```

3. **Authenticated Requests:**
   ```javascript
   // Cookies are sent automatically with credentials: 'include'
   const response = await fetch('/api/courses', {
     credentials: 'include',
     headers: {
       'X-Org-ID': organizationId  // Multi-tenant header
     }
   });
   ```

4. **Auto Refresh:**
   ```javascript
   // When access token expires (401), refresh automatically
   const refreshResponse = await fetch('/auth/refresh?use_cookies=true', {
     method: 'POST',
     credentials: 'include',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({})
   });
   ```

### For Mobile/Desktop Applications

Use token-based authentication and store tokens securely:

1. Store `access_token` in memory
2. Store `refresh_token` securely (keychain/keystore)
3. Include access token in Authorization header:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## Security Considerations

1. **Always use HTTPS in production** to protect tokens in transit
2. **Cookie settings:**
   - `HttpOnly`: Prevents JavaScript access to cookies
   - `Secure`: Only sent over HTTPS
   - `SameSite=Strict`: Prevents CSRF attacks
3. **Token rotation:** Each refresh generates a new refresh token, invalidating the old one
4. **Password requirements:** Enforce strong passwords in your frontend validation
5. **Rate limiting:** Consider implementing rate limiting for auth endpoints in production

---

## Common Integration Patterns

### Next.js Middleware for Authentication

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};
```

### Axios Interceptor for Token Refresh

```typescript
// api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.post('/auth/refresh?use_cookies=true', {}, {
          withCredentials: true
        });
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## Testing

Use the provided test suite in `internal/http/api/auth_handler_test.go` for integration testing examples.

Example curl commands:

```bash
# Signup
curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "org_name": "Test Organization",
    "email": "admin@test.com",
    "password": "SecurePass123!"
  }'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@test.com",
    "password": "SecurePass123!"
  }'

# Refresh
curl -X POST http://localhost:8080/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

## Support

For issues or questions, please refer to the project repository or create an issue on GitHub.
