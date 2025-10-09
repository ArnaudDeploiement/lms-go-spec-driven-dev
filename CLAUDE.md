# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LMS Go** is an open-source Learning Management System built in Go, following a specification-driven approach. The project is multi-tenant by design, organized as a monorepo with separate API and worker binaries.

## Development Commands

### Setup & Dependencies
```bash
make tidy          # Update Go module dependencies
npm install        # Install Node.js dependencies for Tailwind
npm run build:css  # Build Tailwind CSS assets (if modifying UI)
```

### Testing & Quality
```bash
make test          # Run all Go tests with local cache
make fmt           # Format Go code
make lint          # Run golangci-lint
```

### Running Locally
```bash
# Run API server (port 8080)
GOCACHE=$(pwd)/.cache/go-build go run ./cmd/api

# Run worker
GOCACHE=$(pwd)/.cache/go-build go run ./cmd/worker

# Or use Docker Compose (requires .env file)
cp .env.example .env
make up            # Build and start all services (api, worker, postgres, redis, minio)
make down          # Stop and remove volumes
```

### Code Generation
```bash
make generate      # Regenerate ent code from schemas
```

## Architecture

### Multi-Tenant Design
All application resources are scoped to organizations (`org_id`). Most API endpoints require the `X-Org-ID` header for tenant isolation. The middleware `httpmiddleware.TenantFromHeader` extracts and validates organization context.

### Project Structure
- **`cmd/api`**: HTTP API server entry point. Initializes services, registers routes (JSON REST + server-side HTML)
- **`cmd/worker`**: Background worker process (currently placeholder ticker; future async jobs)
- **`internal/`**: Business logic organized by domain
  - **`ent/`**: Database schema and generated ORM code (EntGo)
  - **`ent/schema/`**: Schema definitions for entities (organization, user, course, module, enrollment, content, etc.)
  - **Domain packages** (e.g., `auth`, `course`, `user`, `enrollment`, `progress`, `content`, `organization`):
    - `service.go`: Business logic
    - `errors.go`: Domain-specific errors
    - `service_test.go`: Unit tests
  - **`http/api/`**: JSON REST handlers (organized by domain)
  - **`http/ui/`**: Server-side rendered HTML handlers using Go templates (`html/template`) with Tailwind CSS
  - **`http/middleware/`**: HTTP middleware (tenant resolution, etc.)
  - **`platform/`**: Infrastructure abstractions
    - `database/`: Ent client initialization, migrations
    - `storage/`: MinIO/S3 client for object storage
  - **`app/config/`**: Application configuration loading

### Service Layer Pattern
Services follow a consistent structure:
1. **Service struct** holds dependencies (ent client, config)
2. **Constructor** (`NewService`) initializes service
3. **Methods** implement business operations with validation
4. **Errors** use domain-specific error types defined in `errors.go`

Example: `internal/course/service.go` handles course CRUD, publishing, module management.

### HTTP Routing
Routes are mounted in `cmd/api/main.go`:
- **JSON API**: `/orgs`, `/users`, `/courses`, `/enrollments`, `/contents` (require tenant context)
- **Auth**: `/auth/register`, `/auth/login`, `/auth/refresh` (public)
- **UI**: `/` (home), `/learn/*` (learner views), `/admin/*` (admin views)
- **Health**: `/healthz`, `/readyz`

The router uses **chi** for routing with middleware stack (RequestID, Logger, Recoverer, CORS).

### Database & ORM
- **EntGo** is used for schema-first ORM
- Schemas are defined in `internal/ent/schema/*.go`
- Run `make generate` after modifying schemas to regenerate code
- Migrations are applied automatically on startup via `database.Migrate()` (calls `client.Schema.Create()`)

### Authentication
- **JWT-based** authentication with access tokens (15m) and refresh tokens (72h)
- Password hashing uses **bcrypt**
- Service: `internal/auth/service.go`
- Configuration: `JWT_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`

### Object Storage
- Uses **MinIO** (S3-compatible) for content uploads
- Client wrapper in `internal/platform/storage/`
- Content service generates pre-signed URLs for uploads/downloads
- Configuration: `MINIO_ENDPOINT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET`, `MINIO_USE_SSL`

## Domain Model Relationships

- **Organizations** contain Users, Courses, Contents (multi-tenant isolation)
- **Users** belong to one Organization, have Roles (admin, designer, tutor, learner)
- **Courses** contain ordered Modules, have status (draft, published)
- **Modules** reference Contents, have types (scorm, pdf, video, article, quiz)
- **Enrollments** link Users to Courses, optionally to Groups
- **ModuleProgress** tracks learner progress per module (not_started, in_progress, completed)
- **Groups** allow batch enrollment management

## Testing Strategy

- **Unit tests**: Each service has `service_test.go` with business logic tests
- **Integration tests**: HTTP handlers test full request/response cycle
- Target coverage: ≥60% global, ≥80% for critical services (auth, RBAC)
- Use `testify` for assertions and mocking
- Tests use local cache: `GOCACHE=$(pwd)/.cache/go-build`

## Running Tests

```bash
# All tests
make test

# Specific package
GOCACHE=$(pwd)/.cache/go-build go test ./internal/auth/...

# With coverage
GOCACHE=$(pwd)/.cache/go-build go test -cover ./...
```

## Key Configuration

Environment variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing key (change before production)
- `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`: Token lifetimes
- `MINIO_ENDPOINT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET`, `MINIO_USE_SSL`: Object storage config

## Development Workflow

1. **Modify schemas**: Edit files in `internal/ent/schema/`
2. **Regenerate code**: `make generate`
3. **Write business logic**: Implement in service layer
4. **Add handlers**: Create HTTP handlers in `internal/http/api/` or `internal/http/ui/`
5. **Write tests**: Add `*_test.go` files with unit/integration tests
6. **Format & lint**: `make fmt && make lint`
7. **Run tests**: `make test`

## Project Phases

The project follows a phased roadmap (see `specs/lms-go-backlog.md`):
- **Phase 0** (✅ Complete): Setup, CI/CD, basic auth, UI shell
- **Phase 1** (✅ Complete): MVP learning path (orgs, users, courses, modules, enrollments, progress)
- **Phase 2** (Planned): Tracking, quizzes, reporting, async jobs, notifications
- **Phase 3** (Planned): Advanced RBAC, audit logs, observability, production hardening

## API Conventions

- Most endpoints require `X-Org-ID` header for tenant scoping
- JSON request/response bodies
- Standard HTTP status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found, etc.)
- Errors return JSON with `error` field
- See README.md for full API endpoint list

## UI Rendering

- Server-side rendering with Go templates (`html/template`)
- Templates in `internal/http/ui/templates/`
- Tailwind CSS via CDN (no build step required for basic usage)
- Handlers in `internal/http/ui/` (e.g., `learner_handler.go`, `admin_handler.go`)

## Useful Patterns

### Adding a New Domain
1. Create package under `internal/` (e.g., `internal/foo/`)
2. Define ent schema in `internal/ent/schema/foo.go`
3. Run `make generate`
4. Implement service in `internal/foo/service.go`
5. Add errors in `internal/foo/errors.go`
6. Write tests in `internal/foo/service_test.go`
7. Create handler in `internal/http/api/foo_handler.go`
8. Mount routes in `cmd/api/main.go`

### Adding an Endpoint
1. Add method to service (e.g., `service.CreateFoo()`)
2. Add handler method (e.g., `handler.Create()`)
3. Register route in `Mount()` method or `cmd/api/main.go`
4. Add integration test

### Tenant Context
Use `httpmiddleware.TenantFromHeader` middleware to extract `orgID` from `X-Org-ID` header. It populates request context with `tenant.OrgIDKey`. Access in handlers via `tenant.OrgIDFromContext(ctx)`.
