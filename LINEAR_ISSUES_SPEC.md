# Linear Issues Specification - LMS Go Project

**Generated**: 2025-10-10
**Project**: LMS Go - Learning Management System
**Current Phase**: Phase 1 Complete, Phase 2 Planning

---

## Project Context

- **Status**: Functional with partial UI redesign complete
- **Backend**: Go-based API with Ent ORM, multi-tenant architecture
- **Frontend**: Next.js application with Tailwind CSS
- **Phase 0**: Complete (Setup, CI/CD, basic auth, UI shell)
- **Phase 1**: Complete (MVP learning path - orgs, users, courses, modules, enrollments, progress)
- **Current Need**: UI/UX redesign to Vercel-style and Phase 2 features

---

## PRIORITY 1 - UI/UX (High Priority)

### Issue #1: [Design] Redesign Learner Catalog Page (/learn)

**Priority**: High (2)
**Estimate**: 3 points
**Labels**: design, frontend, phase-1

**Description**:
Apply Vercel-inspired design system to the learner catalog page, replacing the current dark theme with a clean, professional light interface.

**Current State**:
- Dark theme with glass effects and gradients
- Complex visual styling that doesn't match Vercel aesthetic
- Located at `/web/app/learn/page.tsx`

**Tasks**:
- [ ] Replace dark theme with light Vercel-style design (white background, subtle grays)
- [ ] Create minimalist course cards with subtle shadows and hover effects
- [ ] Add statistics section showing enrolled courses, completed courses, and in-progress courses
- [ ] Separate content into "My Courses" and "Available Courses" sections
- [ ] Implement responsive design for mobile and tablet viewports
- [ ] Use Vercel design classes from `globals.css` (`.vercel-card-hover`, `.vercel-btn-primary`, etc.)
- [ ] Remove all gradient backgrounds and glassmorphism effects
- [ ] Add smooth micro-interactions with Framer Motion

**Acceptance Criteria**:
- Background is pure white (#ffffff)
- Course cards use `.vercel-card-hover` with subtle border and shadow
- Statistics are displayed with icons and clear typography
- Progress bars are clean and minimalist
- All interactive elements have smooth hover states
- Design matches Vercel's aesthetic (vercel.com/design)
- Page is fully responsive across all breakpoints

**Files to Modify**:
- `/home/arnaud/project/lms-go/web/app/learn/page.tsx`
- `/home/arnaud/project/lms-go/web/app/globals.css` (reference design system)

**References**:
- Design system: `/web/app/globals.css`
- Status doc: `/STATUS_FINAL.md`
- Redesign summary: `/REDESIGN_SUMMARY.md`

---

### Issue #2: [Design] Redesign Course Detail Page (/learn/course/[id])

**Priority**: High (2)
**Estimate**: 3 points
**Labels**: design, frontend, phase-1

**Description**:
Modernize the course detail page with Vercel design system, creating a clean and professional interface for learners viewing course information and modules.

**Current State**:
- Uses shadcn/ui components but doesn't fully match Vercel aesthetic
- Located at `/web/app/learn/course/[id]/page.tsx`

**Tasks**:
- [ ] Design clean header section with course title, description, and metadata
- [ ] Implement elegant progress bar showing course completion percentage
- [ ] Create module list with card-based design and clear status indicators
- [ ] Add refined enrollment button with loading states
- [ ] Ensure mobile-responsive layout with proper touch targets
- [ ] Replace any remaining dark theme elements with light design
- [ ] Add breadcrumb navigation for better UX
- [ ] Implement smooth transitions between states (enrolled, not enrolled, completed)

**Acceptance Criteria**:
- Header is clean with proper typography hierarchy
- Progress bar is prominent and visually appealing
- Module cards show clear status (not started, in progress, completed)
- Enrollment button has clear call-to-action
- Layout adapts seamlessly to mobile screens
- All colors use Vercel palette (black, white, grays, accent blue)
- Loading states are handled gracefully

**Files to Modify**:
- `/home/arnaud/project/lms-go/web/app/learn/course/[id]/page.tsx`

---

### Issue #3: [Design] Redesign Admin Dashboard (/admin)

**Priority**: Medium (3)
**Estimate**: 5 points
**Labels**: design, frontend, admin, phase-1

**Description**:
Transform the admin dashboard from gaming/fintech style to professional corporate design. Remove excessive colors, gradients, and glassmorphism in favor of a clean, accessible interface.

**Current State**:
- Gaming/fintech inspired with heavy gradients (indigo/cyan/purple)
- Glassmorphism effects throughout
- Very dark background (gray-950 to slate-900)
- Decorative icons (Sparkles) that don't fit corporate context
- Located at `/web/app/admin/page.tsx`

**Problems to Fix**:
- Too many colored gradients
- Glassmorphism effects are excessive
- Very dark background not suitable for corporate use
- Badges and buttons are overly colorful
- Animations are too complex

**Target Design**:
- Clean white or slate-50 background
- Neutral palette: grays and professional blue
- Subtle borders instead of glassmorphism
- Professional typography without emojis
- Generous whitespace
- High contrast for WCAG AA compliance

**Tasks**:
- [ ] Replace dark backgrounds with white or light gray (#f8f9fa)
- [ ] Remove all glassmorphism effects and backdrop blur
- [ ] Simplify color palette to neutrals (black, white, grays)
- [ ] Update statistics cards with clean borders instead of shadows
- [ ] Replace colorful badges with subtle gray variants
- [ ] Remove decorative icons (Sparkles, etc.)
- [ ] Simplify button styles to use `.vercel-btn-primary` and `.vercel-btn-secondary`
- [ ] Add clear statistics overview section at top
- [ ] Improve course list layout with 2-column grid
- [ ] Add clear action buttons (View, Publish, Archive) with consistent styling
- [ ] Ensure proper contrast ratios for accessibility (WCAG AA)
- [ ] Test with accessibility tools (axe DevTools)

**Acceptance Criteria**:
- Background is white or very light gray
- No gradients or glassmorphism effects remain
- All text meets WCAG AA contrast requirements (4.5:1 minimum)
- Statistics cards are clean and professional
- Course cards use subtle borders and shadows only
- Buttons follow Vercel design pattern (black primary, bordered secondary)
- Layout is clean with generous spacing
- All colors come from defined Vercel palette in globals.css

**Files to Modify**:
- `/home/arnaud/project/lms-go/web/app/admin/page.tsx`

**References**:
- Issue tracker: `/specs/ISSUES_TRACKER.md` (DESIGN-001)
- Admin design doc: `/web/ADMIN_DESIGN_IMPROVEMENTS.md`

---

### Issue #4: [Design] Redesign Course Creation Wizard (/admin/courses/new)

**Priority**: Medium (3)
**Estimate**: 5 points
**Labels**: design, frontend, admin, phase-1

**Description**:
Create a professional step-by-step course creation wizard with Vercel design system, improving the user experience for admins creating courses.

**Current State**:
- Modern slate theme but doesn't match overall Vercel aesthetic
- Located at `/web/app/admin/courses/new/page.tsx`

**Tasks**:
- [ ] Design multi-step form with clear progress indication
- [ ] Implement elegant drag & drop file upload interface
- [ ] Add module preview section showing course structure
- [ ] Apply professional Vercel styling throughout
- [ ] Improve form validation feedback with clear error messages
- [ ] Add loading states for file uploads with progress indicators
- [ ] Create confirmation step before final submission
- [ ] Ensure mobile-friendly interaction patterns

**Acceptance Criteria**:
- Multi-step wizard has clear progress indicator
- Each step is focused and not overwhelming
- Drag & drop upload is intuitive with visual feedback
- File uploads show progress with cancel option
- Module preview updates in real-time as modules are added
- Form validation provides helpful error messages
- Success state clearly indicates course was created
- Mobile users can complete entire flow comfortably

**Files to Modify**:
- `/home/arnaud/project/lms-go/web/app/admin/courses/new/page.tsx`

---

### Issue #5: [Design] Redesign Global Navigation Component

**Priority**: Low (4)
**Estimate**: 2 points
**Labels**: design, frontend, component

**Description**:
Update the global navigation component to match Vercel design system with a modern, clean interface.

**Tasks**:
- [ ] Create fixed header with subtle blur effect on scroll
- [ ] Implement user menu dropdown with profile options
- [ ] Add breadcrumbs navigation for nested pages
- [ ] Design mobile-responsive hamburger menu
- [ ] Add smooth transitions for menu open/close
- [ ] Ensure consistent styling with Vercel aesthetic
- [ ] Add active state indicators for current page
- [ ] Implement keyboard navigation support

**Acceptance Criteria**:
- Header stays fixed at top with backdrop blur
- User menu opens smoothly with all options visible
- Breadcrumbs show current location in app hierarchy
- Mobile menu is accessible and easy to use
- Navigation is keyboard accessible
- Active page is clearly indicated
- All styling uses Vercel design classes

**Files to Modify**:
- `/home/arnaud/project/lms-go/web/components/layout/navigation.tsx`

---

## PRIORITY 2 - Phase 1 Completion (Medium Priority)

### Issue #6: [Frontend] Next.js Learner Application - Complete Implementation (T-1.8)

**Priority**: Medium (3)
**Estimate**: 5 points
**Labels**: frontend, phase-1, testing
**Dependencies**: Issues #1, #2, #5 (Design issues)

**Description**:
Complete the Next.js learner application with all remaining features, polish, and comprehensive testing to finish Phase 1 objectives.

**Tasks**:
- [ ] Finalize all learner views (catalog, course detail, module viewer)
- [ ] Implement responsive sidebar with smooth animations
- [ ] Add loading states for all async operations
- [ ] Implement error boundaries for graceful error handling
- [ ] Add comprehensive tests (Playwright for e2e, Vitest/RTL for components)
- [ ] Ensure all micro-interactions are working smoothly
- [ ] Optimize bundle size and performance
- [ ] Add proper meta tags for SEO
- [ ] Test on various devices and browsers
- [ ] Add accessibility improvements (ARIA labels, keyboard nav)

**Acceptance Criteria**:
- All learner views are complete and polished
- Sidebar animates smoothly on open/close
- Loading states prevent confusion during async operations
- Error boundaries catch and display errors gracefully
- Test coverage ≥70% for frontend components
- e2e tests cover critical user flows
- Lighthouse score ≥90 for performance
- All pages are keyboard navigable
- Works correctly on Chrome, Firefox, Safari, and Edge

**Files to Review**:
- `/home/arnaud/project/lms-go/web/app/learn/**`
- `/home/arnaud/project/lms-go/web/components/**`

---

### Issue #7: [Testing] End-to-End Test Suite (T-1.9)

**Priority**: Medium (3)
**Estimate**: 3 points
**Labels**: testing, phase-1, quality

**Description**:
Create comprehensive end-to-end test scenarios covering the complete user journey from authentication through enrollment to module completion.

**Tasks**:
- [ ] Setup e2e test infrastructure with Playwright
- [ ] Create test fixtures and seed data scripts
- [ ] Implement authentication flow tests (signup, login, logout, refresh)
- [ ] Implement enrollment flow tests (browse, enroll, access course)
- [ ] Implement module progression tests (start, progress, complete)
- [ ] Add tests for error scenarios and edge cases
- [ ] Integrate tests into CI pipeline
- [ ] Generate test coverage reports
- [ ] Achieve ≥60% global code coverage
- [ ] Document test patterns and conventions

**Acceptance Criteria**:
- Playwright is configured and running in CI
- All critical user flows have e2e tests
- Tests run reliably without flakiness
- Test data is seeded consistently
- Coverage reports are generated automatically
- Global code coverage ≥60%
- Test documentation is clear and accessible
- Tests run in parallel for faster execution

**Test Scenarios**:
1. Auth Flow: Register → Login → Access protected page → Logout
2. Enrollment Flow: Browse catalog → View course detail → Enroll → Access modules
3. Progress Flow: Start module → Mark in progress → Complete module → See progress
4. Admin Flow: Create course → Add modules → Upload content → Publish course

---

## PRIORITY 3 - Phase 2 Features (Medium Priority)

### Issue #8: [Feature] Quiz Engine (T-2.1)

**Priority**: Medium (3)
**Estimate**: 5 points
**Labels**: backend, feature, phase-2, quiz

**Description**:
Implement a comprehensive quiz module system with multiple question types, attempt tracking, and automatic grading functionality.

**Tasks**:
- [ ] Create database models for questions (MCQ, True/False, short answer)
- [ ] Create quiz and quiz_attempt tables in Ent schema
- [ ] Implement quiz attempt tracking with timestamps
- [ ] Add question randomization logic
- [ ] Create automatic grading system for objective questions
- [ ] Build quiz creation API endpoints (POST /quizzes, PATCH /quizzes/{id})
- [ ] Build quiz attempt API endpoints (POST /quizzes/{id}/attempts, GET /attempts/{id})
- [ ] Return score and feedback on submission
- [ ] Add validation for quiz structure (minimum questions, question types)
- [ ] Write comprehensive unit tests for grading logic
- [ ] Add integration tests for quiz workflow

**Models**:
```go
type Quiz struct {
    ID          uuid.UUID
    OrgID       uuid.UUID
    Title       string
    Description string
    PassScore   int        // Minimum score to pass (percentage)
    TimeLimit   *int       // Optional time limit in minutes
    Questions   []*Question
}

type Question struct {
    ID          uuid.UUID
    QuizID      uuid.UUID
    Type        string     // "mcq", "true_false", "short_answer"
    Text        string
    Options     []string   // For MCQ
    CorrectAnswer string
    Points      int
}

type QuizAttempt struct {
    ID          uuid.UUID
    QuizID      uuid.UUID
    UserID      uuid.UUID
    Answers     map[string]string
    Score       int
    Passed      bool
    StartedAt   time.Time
    CompletedAt *time.Time
}
```

**API Endpoints**:
- `POST /quizzes` - Create quiz
- `GET /quizzes/{id}` - Get quiz (without answers for learners)
- `PATCH /quizzes/{id}` - Update quiz
- `DELETE /quizzes/{id}` - Delete quiz
- `POST /quizzes/{id}/attempts` - Start quiz attempt
- `PUT /quizzes/{id}/attempts/{attemptId}` - Submit quiz attempt
- `GET /quizzes/{id}/attempts/{attemptId}` - Get attempt results

**Acceptance Criteria**:
- All question types (MCQ, T/F, short answer) are supported
- Question randomization works correctly
- Grading is accurate for all question types
- Time limits are enforced (if set)
- Multiple attempts are tracked separately
- Score and feedback are returned immediately
- Unit test coverage ≥80% for quiz service
- Integration tests cover full quiz workflow

**Files to Create/Modify**:
- `/home/arnaud/project/lms-go/internal/ent/schema/quiz.go`
- `/home/arnaud/project/lms-go/internal/ent/schema/question.go`
- `/home/arnaud/project/lms-go/internal/ent/schema/quiz_attempt.go`
- `/home/arnaud/project/lms-go/internal/quiz/service.go`
- `/home/arnaud/project/lms-go/internal/quiz/service_test.go`
- `/home/arnaud/project/lms-go/internal/http/api/quiz_handler.go`

**References**:
- Backlog: `/specs/lms-go-backlog.md` (T-2.1)

---

### Issue #9: [Feature] Activity Tracking (T-2.2)

**Priority**: Medium (3)
**Estimate**: 4 points
**Labels**: backend, feature, phase-2, analytics

**Description**:
Implement comprehensive activity and time tracking system to monitor learner engagement and provide data for reporting.

**Tasks**:
- [ ] Create events table for activity logging in Ent schema
- [ ] Define event types (module_start, module_complete, time_spent, etc.)
- [ ] Track time spent per module with periodic updates
- [ ] Record module status changes (not_started → in_progress → completed)
- [ ] Instrument frontend with tracking events
- [ ] Implement backend event processing and storage
- [ ] Add time aggregation for progress reports
- [ ] Create API endpoints for retrieving user activity
- [ ] Optimize event storage with proper indexes
- [ ] Add data retention policies for old events
- [ ] Write unit tests for event processing
- [ ] Add integration tests for tracking workflow

**Event Types**:
- `module_viewed` - User viewed a module
- `module_started` - User started working on a module
- `module_completed` - User completed a module
- `time_spent` - Periodic time tracking events (every 30 seconds of activity)
- `video_progress` - Video playback progress
- `quiz_started` - Quiz attempt started
- `quiz_completed` - Quiz attempt completed

**Models**:
```go
type Event struct {
    ID        uuid.UUID
    OrgID     uuid.UUID
    UserID    uuid.UUID
    EventType string
    EntityType string  // "module", "quiz", "course"
    EntityID   uuid.UUID
    Metadata  map[string]interface{}
    CreatedAt time.Time
}

type TimeSpent struct {
    UserID    uuid.UUID
    ModuleID  uuid.UUID
    Duration  int  // seconds
    Date      time.Time
}
```

**API Endpoints**:
- `POST /events` - Log event (called from frontend)
- `GET /users/{id}/activity` - Get user activity summary
- `GET /modules/{id}/analytics` - Get module engagement analytics

**Acceptance Criteria**:
- Events table is created with proper indexes
- All event types are logged correctly
- Time tracking is accurate (±5 seconds)
- Frontend sends events without impacting performance
- Event processing is async and doesn't block user actions
- Time aggregation queries are optimized
- Unit test coverage ≥75% for tracking service
- Integration tests verify end-to-end tracking

**Files to Create/Modify**:
- `/home/arnaud/project/lms-go/internal/ent/schema/event.go`
- `/home/arnaud/project/lms-go/internal/tracking/service.go`
- `/home/arnaud/project/lms-go/internal/tracking/service_test.go`
- `/home/arnaud/project/lms-go/internal/http/api/tracking_handler.go`
- `/home/arnaud/project/lms-go/web/lib/tracking/client.ts`

**References**:
- Backlog: `/specs/lms-go-backlog.md` (T-2.2)

---

### Issue #10: [Feature] Tutor Reporting Dashboard (T-2.3)

**Priority**: Medium (3)
**Estimate**: 4 points
**Labels**: backend, feature, phase-2, reporting
**Dependencies**: Issue #9 (Activity Tracking)

**Description**:
Create reporting endpoints for tutors and managers to monitor learner progress, completion rates, and engagement metrics.

**Tasks**:
- [ ] Design reporting data models and aggregation queries
- [ ] Implement progression queries by user, course, and group
- [ ] Add completion rate calculations
- [ ] Create group and course filtering capabilities
- [ ] Optimize queries with proper indexes
- [ ] Validate query performance with EXPLAIN ANALYZE
- [ ] Test with large datasets (10k+ users, 100+ courses)
- [ ] Add caching for expensive queries (Redis)
- [ ] Create API endpoints for all reporting needs
- [ ] Write comprehensive unit tests
- [ ] Add integration tests with seed data

**Reporting Metrics**:
- Course completion rate (by user, group, organization)
- Average time to complete course
- Module engagement (views, completions, time spent)
- Quiz performance (average score, pass rate)
- At-risk learners (low engagement, behind schedule)
- Learner leaderboard (optional)

**API Endpoints**:
- `GET /reports/courses/{id}/completion` - Course completion statistics
- `GET /reports/courses/{id}/progress` - Detailed progress by learner
- `GET /reports/groups/{id}/analytics` - Group-level analytics
- `GET /reports/users/{id}/summary` - Individual learner summary
- `GET /reports/organizations/{id}/overview` - Org-wide metrics

**Query Optimization**:
```sql
-- Add indexes for common queries
CREATE INDEX idx_enrollments_course_status ON enrollments(course_id, status);
CREATE INDEX idx_module_progress_user_module ON module_progress(user_id, module_id);
CREATE INDEX idx_events_user_date ON events(user_id, created_at);
CREATE INDEX idx_events_entity ON events(entity_type, entity_id);
```

**Acceptance Criteria**:
- All reporting queries return in <2 seconds with 10k users
- Completion rate calculations are accurate
- Group filtering works correctly
- Queries use indexes (verified with EXPLAIN)
- Caching reduces load on database
- Unit test coverage ≥80% for reporting service
- Integration tests verify accuracy with seed data
- API documentation is complete

**Files to Create/Modify**:
- `/home/arnaud/project/lms-go/internal/reporting/service.go`
- `/home/arnaud/project/lms-go/internal/reporting/service_test.go`
- `/home/arnaud/project/lms-go/internal/reporting/queries.go`
- `/home/arnaud/project/lms-go/internal/http/api/reporting_handler.go`

**References**:
- Backlog: `/specs/lms-go-backlog.md` (T-2.3)

---

### Issue #11: [UI] Reporting Dashboard UI (T-2.4)

**Priority**: Medium (3)
**Estimate**: 3 points
**Labels**: frontend, feature, phase-2, reporting
**Dependencies**: Issue #10 (Tutor Reporting Dashboard)

**Description**:
Build a manager/tutor dashboard with data tables and charts to visualize learner progress and engagement metrics.

**Tasks**:
- [ ] Create dashboard layout with responsive grid
- [ ] Add data tables with sorting and filtering capabilities
- [ ] Implement charts for progression and completion (Chart.js or Recharts)
- [ ] Add organization and group filter dropdowns
- [ ] Implement date range picker for time-based filtering
- [ ] Ensure page loads in <2s on seed dataset
- [ ] Add Playwright tests for filters and interactions
- [ ] Add export functionality (CSV download)
- [ ] Implement real-time updates (optional - websockets/polling)
- [ ] Add print-friendly styles

**Chart Types**:
- Course completion rate over time (line chart)
- Module engagement comparison (bar chart)
- Learner progress distribution (pie/donut chart)
- Time spent per module (bar chart)
- At-risk learners (list with highlighting)

**Features**:
- Sortable data tables (click column headers)
- Multi-select filters (courses, groups, status)
- Drill-down capability (click course → see all learners)
- Export to CSV with current filters applied
- Responsive design for tablets and mobile

**Acceptance Criteria**:
- Dashboard loads in <2 seconds with 1000 learners
- All charts render correctly and are interactive
- Tables are sortable by all columns
- Filters apply correctly and update data in real-time
- Date range picker updates all charts and tables
- Export generates valid CSV files
- Playwright tests cover all major interactions
- Mobile view is usable (responsive tables, touch-friendly)
- Print view is clean and professional

**Files to Create**:
- `/home/arnaud/project/lms-go/web/app/reports/page.tsx`
- `/home/arnaud/project/lms-go/web/app/reports/courses/[id]/page.tsx`
- `/home/arnaud/project/lms-go/web/components/reports/CompletionChart.tsx`
- `/home/arnaud/project/lms-go/web/components/reports/ProgressTable.tsx`
- `/home/arnaud/project/lms-go/web/components/reports/FilterPanel.tsx`
- `/home/arnaud/project/lms-go/web/lib/api/reporting.ts`

**Libraries to Add**:
- `recharts` or `chart.js` for charts
- `react-table` or `tanstack-table` for data tables
- `date-fns` for date handling

**References**:
- Backlog: `/specs/lms-go-backlog.md` (T-2.4)

---

### Issue #12: [Infrastructure] Async Jobs with Worker (T-2.5)

**Priority**: Medium (3)
**Estimate**: 3 points
**Labels**: backend, infrastructure, phase-2, worker

**Description**:
Setup dedicated worker infrastructure for background jobs with reliable queue management, retry logic, and monitoring.

**Tasks**:
- [ ] Configure job queue using Redis (or evaluate NATS/RabbitMQ)
- [ ] Implement job conventions and patterns (base job interface)
- [ ] Add retry logic with exponential backoff
- [ ] Implement job monitoring and metrics (Prometheus)
- [ ] Ensure idempotent job execution (prevent duplicate processing)
- [ ] Add observability (job metrics, logs, tracing)
- [ ] Create job dashboard for monitoring (admin UI)
- [ ] Implement graceful shutdown handling
- [ ] Add dead letter queue for failed jobs
- [ ] Write comprehensive tests for job execution
- [ ] Document job patterns and best practices

**Job Queue Options**:
1. **Redis** (current stack) - Simple, already in use
2. **NATS** - More features, better for distributed systems
3. **RabbitMQ** - Mature, feature-rich

**Recommendation**: Start with Redis for simplicity

**Job Interface**:
```go
type Job interface {
    Execute(ctx context.Context) error
    GetID() string
    GetType() string
    GetMaxRetries() int
    GetRetryDelay() time.Duration
}

type BaseJob struct {
    ID         string
    Type       string
    Payload    map[string]interface{}
    MaxRetries int
    Attempt    int
    CreatedAt  time.Time
}
```

**Job Types**:
- `send_email` - Email notifications
- `process_upload` - Process uploaded content
- `generate_report` - Generate analytics reports
- `sync_data` - Data synchronization tasks
- `cleanup` - Cleanup old data

**Features**:
- Priority queues (high, normal, low)
- Scheduled jobs (cron-like scheduling)
- Job chaining (job A → job B → job C)
- Retry with exponential backoff (1s, 2s, 4s, 8s, ...)
- Job timeout configuration
- Dead letter queue for permanently failed jobs

**Metrics to Track**:
- Jobs processed per second
- Job duration (p50, p95, p99)
- Job failure rate
- Queue depth
- Worker utilization

**Acceptance Criteria**:
- Job queue is configured and operational
- Jobs can be enqueued from API handlers
- Worker processes jobs reliably
- Retry logic handles transient failures
- Failed jobs go to dead letter queue after max retries
- Metrics are exposed for monitoring
- Job execution is idempotent
- Tests verify all job execution paths
- Documentation covers job creation patterns

**Files to Create/Modify**:
- `/home/arnaud/project/lms-go/internal/worker/queue.go`
- `/home/arnaud/project/lms-go/internal/worker/job.go`
- `/home/arnaud/project/lms-go/internal/worker/executor.go`
- `/home/arnaud/project/lms-go/internal/worker/registry.go`
- `/home/arnaud/project/lms-go/cmd/worker/main.go`
- `/home/arnaud/project/lms-go/internal/worker/jobs/`

**References**:
- Backlog: `/specs/lms-go-backlog.md` (T-2.5)

---

### Issue #13: [Feature] Email Notifications (T-2.6)

**Priority**: Low (4)
**Estimate**: 3 points
**Labels**: backend, feature, phase-2, notifications
**Dependencies**: Issue #12 (Async Jobs with Worker)

**Description**:
Implement email notification system for enrollments, course completion reminders, and important system events.

**Tasks**:
- [ ] Create email templates for enrollment confirmations
- [ ] Create email templates for completion reminders
- [ ] Create email templates for course updates
- [ ] Setup SMTP configuration with environment variables
- [ ] Integrate email sending with worker queue for async processing
- [ ] Add template unit tests (rendering, variables)
- [ ] Setup mailhog for local testing
- [ ] Implement email preferences for users (opt-in/opt-out)
- [ ] Add acceptance tests for email delivery
- [ ] Implement email tracking (sent, opened, clicked)
- [ ] Add rate limiting for email sending

**Email Templates**:
1. **Enrollment Confirmation** - Welcome, course details, next steps
2. **Course Completion** - Congratulations, certificate download
3. **Module Reminder** - Incomplete modules, encouragement
4. **Course Update** - New modules added, content changes
5. **Password Reset** - Secure link, expiration notice
6. **Account Activation** - Welcome, activation link

**Template Engine**:
Use Go's `html/template` for email templates with layouts:
```
internal/email/templates/
  ├── layouts/
  │   └── base.html
  ├── enrollment_confirmation.html
  ├── course_completion.html
  └── module_reminder.html
```

**SMTP Configuration**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@lms-go.example.com
SMTP_PASSWORD=secret
SMTP_FROM=LMS Go <noreply@lms-go.example.com>
```

**Job Integration**:
```go
type SendEmailJob struct {
    BaseJob
    To       string
    Subject  string
    Template string
    Data     map[string]interface{}
}
```

**Acceptance Criteria**:
- All email templates render correctly with test data
- Emails are sent asynchronously via worker
- SMTP configuration is validated on startup
- Mailhog receives emails in local development
- Template unit tests achieve ≥80% coverage
- Users can opt out of non-critical emails
- Email sending respects rate limits
- Failed email jobs are retried appropriately
- Email tracking records all sent emails

**Files to Create**:
- `/home/arnaud/project/lms-go/internal/email/service.go`
- `/home/arnaud/project/lms-go/internal/email/service_test.go`
- `/home/arnaud/project/lms-go/internal/email/templates/`
- `/home/arnaud/project/lms-go/internal/worker/jobs/send_email_job.go`
- `/home/arnaud/project/lms-go/docker-compose.yml` (add mailhog service)

**Mailhog Service**:
```yaml
mailhog:
  image: mailhog/mailhog:latest
  ports:
    - "1025:1025"  # SMTP
    - "8025:8025"  # Web UI
```

**References**:
- Backlog: `/specs/lms-go-backlog.md` (T-2.6)

---

### Issue #14: [Feature] Internal Webhooks (T-2.7)

**Priority**: Low (4)
**Estimate**: 2 points
**Labels**: backend, feature, phase-2, webhooks
**Dependencies**: Issue #12 (Async Jobs with Worker)

**Description**:
Implement webhook system for key events with HMAC signature verification and retry logic for integration with external systems.

**Tasks**:
- [ ] Create webhook configuration system (URL, secret, events)
- [ ] Implement HMAC signature verification (SHA256)
- [ ] Send webhooks for key events (enrollment, completion, quiz result)
- [ ] Add exponential retry on failure (5 attempts max)
- [ ] Create admin dashboard for webhook configuration
- [ ] Implement webhook delivery logs
- [ ] Add error logging and alerting
- [ ] Test webhook delivery with test endpoints
- [ ] Add webhook payload validation
- [ ] Document webhook API for integrators

**Webhook Events**:
- `enrollment.created` - User enrolled in course
- `enrollment.completed` - User completed course
- `module.completed` - User completed module
- `quiz.completed` - User completed quiz
- `course.published` - Course was published
- `course.updated` - Course content changed

**Webhook Configuration Model**:
```go
type WebhookConfig struct {
    ID        uuid.UUID
    OrgID     uuid.UUID
    URL       string
    Secret    string  // For HMAC signing
    Events    []string
    Active    bool
    CreatedAt time.Time
}

type WebhookDelivery struct {
    ID           uuid.UUID
    WebhookID    uuid.UUID
    Event        string
    Payload      map[string]interface{}
    StatusCode   int
    Response     string
    AttemptCount int
    DeliveredAt  *time.Time
    CreatedAt    time.Time
}
```

**Webhook Payload**:
```json
{
  "event": "enrollment.created",
  "timestamp": "2025-10-10T12:00:00Z",
  "data": {
    "enrollment_id": "uuid",
    "user_id": "uuid",
    "course_id": "uuid",
    "created_at": "2025-10-10T12:00:00Z"
  }
}
```

**HMAC Signature**:
```
X-Webhook-Signature: sha256=<hmac-hex>
X-Webhook-Timestamp: 1633881600
X-Webhook-ID: <delivery-uuid>
```

**Retry Logic**:
- Attempt 1: Immediate
- Attempt 2: 30 seconds later
- Attempt 3: 2 minutes later
- Attempt 4: 10 minutes later
- Attempt 5: 1 hour later

**Acceptance Criteria**:
- Webhooks can be configured via admin UI
- HMAC signatures are generated correctly
- Webhooks are sent asynchronously via worker
- Failed deliveries are retried with exponential backoff
- Delivery logs are stored for auditing
- Admin can view webhook delivery history
- Test endpoint validates webhook payloads
- Documentation includes integration guide

**Files to Create**:
- `/home/arnaud/project/lms-go/internal/webhook/service.go`
- `/home/arnaud/project/lms-go/internal/webhook/service_test.go`
- `/home/arnaud/project/lms-go/internal/ent/schema/webhook.go`
- `/home/arnaud/project/lms-go/internal/worker/jobs/send_webhook_job.go`
- `/home/arnaud/project/lms-go/internal/http/api/webhook_handler.go`
- `/home/arnaud/project/lms-go/web/app/admin/webhooks/page.tsx`

**References**:
- Backlog: `/specs/lms-go-backlog.md` (T-2.7)

---

## PRIORITY 4 - UX Improvements (Low Priority)

### Issue #15: [UX] File Upload Improvements

**Priority**: Low (4)
**Estimate**: 3 points
**Labels**: frontend, ux, enhancement

**Description**:
Enhance file upload experience with drag & drop, file preview, and better progress indication.

**Tasks**:
- [ ] Implement drag & drop file upload interface
- [ ] Add file preview before upload (thumbnails for images, icons for others)
- [ ] Show upload progress with better UI (percentage, estimated time)
- [ ] Add file type validation feedback (before upload)
- [ ] Support multiple file upload at once
- [ ] Add pause/resume upload capability (for large files)
- [ ] Show file size and format information
- [ ] Add remove file option before upload
- [ ] Implement client-side file validation
- [ ] Add keyboard shortcuts for file selection

**Features**:
- Drag & drop zone with visual feedback
- File preview grid showing thumbnails
- Progress bars for each file being uploaded
- Validation messages for invalid files
- Batch upload capability
- Upload queue management

**Libraries**:
- `react-dropzone` for drag & drop
- `react-circular-progressbar` for progress UI

**Acceptance Criteria**:
- Drag & drop works smoothly across all pages
- File preview shows appropriate icons/thumbnails
- Upload progress is accurate and updates smoothly
- File validation prevents invalid uploads
- Multiple files can be uploaded simultaneously
- UI is responsive and works on mobile
- Keyboard navigation is fully supported

**Files to Create/Modify**:
- `/home/arnaud/project/lms-go/web/components/upload/FileUpload.tsx`
- `/home/arnaud/project/lms-go/web/components/upload/FilePreview.tsx`
- `/home/arnaud/project/lms-go/web/components/upload/ProgressBar.tsx`
- `/home/arnaud/project/lms-go/web/lib/upload/client.ts`

---

### Issue #16: [UX] Toast Notifications System

**Priority**: Low (4)
**Estimate**: 2 points
**Labels**: frontend, ux, component

**Description**:
Implement a global toast notification system for user feedback on actions, errors, and success states.

**Tasks**:
- [ ] Choose/implement toast library (react-hot-toast or sonner)
- [ ] Create toast context provider
- [ ] Add success/error/info/warning variants
- [ ] Integrate with API error handling
- [ ] Add animations (slide in/out, fade)
- [ ] Support action buttons in toasts (undo, view details)
- [ ] Add position configuration (top-right, bottom-center, etc.)
- [ ] Implement toast queue management
- [ ] Add keyboard dismissal (Escape key)
- [ ] Style toasts to match Vercel design

**Toast Types**:
- **Success**: "Course created successfully"
- **Error**: "Failed to upload file. Please try again."
- **Info**: "Saving draft..."
- **Warning**: "Your session will expire in 5 minutes"

**Features**:
- Auto-dismiss after configurable duration
- Manual dismiss with close button
- Action buttons for relevant toasts
- Stack multiple toasts
- Pause on hover
- Screen reader announcements

**Recommended Library**: `sonner` by Vercel (matches design system)

**Acceptance Criteria**:
- Toasts appear with smooth animations
- All toast variants are styled correctly
- API errors automatically show toast notifications
- Success actions show confirmation toasts
- Toasts are accessible (ARIA announcements)
- Multiple toasts stack properly
- Toasts can be dismissed manually or auto-dismiss
- Design matches Vercel aesthetic

**Files to Create/Modify**:
- `/home/arnaud/project/lms-go/web/components/ui/Toast.tsx`
- `/home/arnaud/project/lms-go/web/lib/toast/context.tsx`
- `/home/arnaud/project/lms-go/web/app/layout.tsx` (add provider)
- `/home/arnaud/project/lms-go/web/lib/api/client.ts` (integrate error handling)

**Library to Add**:
```bash
npm install sonner
```

---

### Issue #17: [Feature] Course Search and Filters

**Priority**: Low (4)
**Estimate**: 3 points
**Labels**: frontend, backend, feature, enhancement

**Description**:
Add search and filtering capabilities to course catalog for better course discovery.

**Tasks**:
- [ ] Implement backend search API with PostgreSQL full-text search
- [ ] Add frontend search input with debouncing
- [ ] Create filter UI (status, category, instructor)
- [ ] Add sorting options (newest, title, popularity)
- [ ] Implement pagination with page size options
- [ ] Add search highlighting in results
- [ ] Create filter chips showing active filters
- [ ] Add clear all filters button
- [ ] Optimize search queries with indexes
- [ ] Add loading states for search results

**Search Capabilities**:
- Full-text search on course title and description
- Filter by course status (published, draft)
- Filter by category/tags (if added)
- Filter by instructor/creator
- Sort by date created, title, or enrollment count

**Backend Implementation**:
```sql
-- Add full-text search index
CREATE INDEX idx_courses_search ON courses
USING gin(to_tsvector('english', title || ' ' || description));
```

**API Endpoint**:
```
GET /courses?q=javascript&status=published&sort=newest&page=1&limit=20
```

**Acceptance Criteria**:
- Search returns relevant results in <500ms
- Filters apply correctly and combine properly (AND logic)
- Sorting works for all options
- Pagination shows correct page numbers
- Search input debounces to avoid excessive API calls
- Active filters are clearly displayed
- Results update smoothly without full page reload
- Empty state is shown when no results found

**Files to Create/Modify**:
- `/home/arnaud/project/lms-go/internal/course/service.go` (add search method)
- `/home/arnaud/project/lms-go/internal/http/api/course_handler.go` (add search endpoint)
- `/home/arnaud/project/lms-go/web/app/learn/page.tsx` (add search UI)
- `/home/arnaud/project/lms-go/web/components/course/SearchBar.tsx`
- `/home/arnaud/project/lms-go/web/components/course/FilterPanel.tsx`

---

## PRIORITY 5 - Technical Debt

### Issue #18: [Tech] Improve Error Handling and User Messages

**Priority**: Low (4)
**Estimate**: 2 points
**Labels**: backend, frontend, quality

**Description**:
Standardize error handling across the application with clear, user-friendly error messages and proper logging.

**Tasks**:
- [ ] Review all error responses from API
- [ ] Create error message dictionary for common errors
- [ ] Implement user-friendly error display on frontend
- [ ] Add error boundaries in React components
- [ ] Log errors for debugging (structured logging)
- [ ] Add error tracking (Sentry integration optional)
- [ ] Create error response format standard
- [ ] Add validation error details in responses
- [ ] Improve 404 and 500 error pages
- [ ] Document error codes and meanings

**Error Response Format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided data is invalid",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

**Error Types**:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

**Acceptance Criteria**:
- All API errors return consistent format
- Frontend displays user-friendly error messages
- Error boundaries catch React errors gracefully
- Validation errors show field-specific messages
- Errors are logged with proper context
- 404 and 500 pages are styled and helpful
- Error documentation is complete

**Files to Create/Modify**:
- `/home/arnaud/project/lms-go/internal/apierror/errors.go`
- `/home/arnaud/project/lms-go/internal/http/middleware/error_handler.go`
- `/home/arnaud/project/lms-go/web/components/error/ErrorBoundary.tsx`
- `/home/arnaud/project/lms-go/web/app/error.tsx`
- `/home/arnaud/project/lms-go/web/app/not-found.tsx`
- `/home/arnaud/project/lms-go/web/lib/api/client.ts`

---

### Issue #19: [Docs] User Documentation - Admin Guide

**Priority**: Low (4)
**Estimate**: 2 points
**Labels**: documentation

**Description**:
Create comprehensive admin user guide with step-by-step instructions for managing the LMS.

**Tasks**:
- [ ] Document organization setup process
- [ ] Document user management (create, edit, roles, deactivate)
- [ ] Document course creation workflow with screenshots
- [ ] Document module types and when to use each
- [ ] Add screenshots and examples for clarity
- [ ] Create troubleshooting section
- [ ] Add FAQ section
- [ ] Publish documentation (GitHub Pages or docs site)

**Documentation Structure**:
```
docs/
├── admin-guide/
│   ├── getting-started.md
│   ├── organization-setup.md
│   ├── user-management.md
│   ├── course-creation.md
│   ├── module-types.md
│   ├── content-upload.md
│   ├── publishing.md
│   ├── troubleshooting.md
│   └── faq.md
└── images/
    └── admin/
```

**Topics to Cover**:
1. Initial Setup (organization creation, first admin user)
2. User Management (inviting users, assigning roles, managing access)
3. Course Creation (step-by-step wizard walkthrough)
4. Module Types (SCORM, PDF, video, article, quiz - when to use each)
5. Content Upload (file requirements, size limits, formats)
6. Publishing Workflow (draft → review → publish)
7. Enrollment Management (individual, bulk, groups)
8. Reporting and Analytics (when reporting is implemented)

**Acceptance Criteria**:
- Documentation covers all admin workflows
- Screenshots are current and clear
- Instructions are step-by-step and easy to follow
- Troubleshooting section addresses common issues
- FAQ answers typical questions
- Documentation is published and accessible
- Feedback mechanism is available

**Files to Create**:
- `/home/arnaud/project/lms-go/docs/admin-guide/*.md`

---

### Issue #20: [Docs] User Documentation - Learner Guide

**Priority**: Low (4)
**Estimate**: 1 point
**Labels**: documentation

**Description**:
Create learner user guide explaining how to use the LMS from a student perspective.

**Tasks**:
- [ ] Document how to access courses
- [ ] Document enrollment process (self-enroll vs. assigned)
- [ ] Document module progression workflow
- [ ] Document quiz taking process (when implemented)
- [ ] Add screenshots of learner interface
- [ ] Create quick start guide
- [ ] Add tips for effective learning

**Documentation Structure**:
```
docs/
├── learner-guide/
│   ├── getting-started.md
│   ├── accessing-courses.md
│   ├── enrollment.md
│   ├── taking-courses.md
│   ├── module-types.md
│   ├── quizzes.md
│   ├── tracking-progress.md
│   └── tips.md
└── images/
    └── learner/
```

**Topics to Cover**:
1. Getting Started (login, first access)
2. Browsing Courses (catalog, search, filtering)
3. Enrolling in Courses (self-enrollment, access codes)
4. Taking a Course (navigating modules, marking complete)
5. Module Types (video, PDF, article - how to interact)
6. Quizzes (when implemented - taking, reviewing results)
7. Tracking Progress (viewing completion, time spent)
8. Tips for Success (best practices, time management)

**Acceptance Criteria**:
- Documentation covers all learner workflows
- Screenshots show actual learner interface
- Instructions are clear and beginner-friendly
- Quick start guide helps new users get started fast
- Tips section provides value-add content
- Documentation is published and accessible

**Files to Create**:
- `/home/arnaud/project/lms-go/docs/learner-guide/*.md`

---

## Summary Statistics

**Total Issues**: 20

### By Priority:
- **High (2)**: 2 issues (#1, #2)
- **Medium (3)**: 11 issues (#3, #4, #6, #7, #8, #9, #10, #11, #12)
- **Low (4)**: 7 issues (#5, #13, #14, #15, #16, #17, #18, #19, #20)

### By Label:
- **design**: 5 issues
- **frontend**: 10 issues
- **backend**: 8 issues
- **phase-1**: 7 issues
- **phase-2**: 7 issues
- **testing**: 2 issues
- **feature**: 8 issues
- **ux**: 3 issues
- **enhancement**: 2 issues
- **quality**: 2 issues
- **documentation**: 2 issues
- **infrastructure**: 1 issue

### By Estimate (Story Points):
- **1 point**: 1 issue
- **2 points**: 5 issues
- **3 points**: 8 issues
- **4 points**: 3 issues
- **5 points**: 3 issues

**Total Story Points**: 58 points

### Dependencies:
- Issue #6 depends on #1, #2, #5
- Issue #10 depends on #9
- Issue #11 depends on #10
- Issue #13 depends on #12
- Issue #14 depends on #12

---

## Implementation Roadmap

### Sprint 1 (2 weeks - 20 points)
**Focus**: UI Redesign
- Issue #1: Redesign Learner Catalog (3 pts)
- Issue #2: Redesign Course Detail (3 pts)
- Issue #3: Redesign Admin Dashboard (5 pts)
- Issue #4: Redesign Course Creation Wizard (5 pts)
- Issue #5: Redesign Navigation (2 pts)
- Issue #16: Toast Notifications (2 pts)

### Sprint 2 (2 weeks - 21 points)
**Focus**: Phase 1 Completion & Testing
- Issue #6: Complete Next.js Implementation (5 pts)
- Issue #7: E2E Test Suite (3 pts)
- Issue #15: File Upload Improvements (3 pts)
- Issue #17: Course Search and Filters (3 pts)
- Issue #18: Error Handling Improvements (2 pts)
- Issue #8: Quiz Engine (5 pts) - Start

### Sprint 3 (2 weeks - 17 points)
**Focus**: Phase 2 Foundation
- Issue #8: Quiz Engine (complete if not done)
- Issue #9: Activity Tracking (4 pts)
- Issue #10: Tutor Reporting Dashboard (4 pts)
- Issue #11: Reporting Dashboard UI (3 pts)
- Issue #12: Async Jobs with Worker (3 pts)
- Issue #13: Email Notifications (3 pts)

### Sprint 4 (1 week - 7 points)
**Focus**: Polish & Documentation
- Issue #14: Internal Webhooks (2 pts)
- Issue #19: Admin Guide (2 pts)
- Issue #20: Learner Guide (1 pt)
- Buffer for bug fixes and polish

---

## Notes

### Linear Priority Mapping:
- Priority 0 = None
- Priority 1 = Urgent
- Priority 2 = High
- Priority 3 = Medium
- Priority 4 = Low

### Estimation Guide:
- **1 point**: <4 hours of work
- **2 points**: 4-8 hours (half day to 1 day)
- **3 points**: 1-2 days
- **4 points**: 2-3 days
- **5 points**: 3-5 days
- **8 points**: 1-2 weeks

### Labels Explained:
- **design**: UI/UX design work
- **frontend**: Next.js/React work
- **backend**: Go API work
- **phase-1**: Part of MVP Phase 1
- **phase-2**: Part of Phase 2 features
- **testing**: Test implementation
- **feature**: New functionality
- **ux**: User experience improvement
- **enhancement**: Improvement to existing feature
- **quality**: Code quality/technical debt
- **documentation**: Writing documentation
- **infrastructure**: Infrastructure/DevOps work

---

## How to Use This Document

### Manual Entry in Linear:
For each issue above, create a Linear issue with:
1. Copy the title exactly
2. Set the priority (0-4 as specified)
3. Set the estimate (story points)
4. Add all labels listed
5. Copy the description and tasks
6. Set dependencies if listed

### Bulk Import (if supported):
Linear supports CSV import. Convert this document to CSV format with columns:
- Title
- Description
- Priority
- Estimate
- Labels
- Status (Backlog)

### API Import:
If you have Linear API access, you can write a script to bulk-create these issues programmatically.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-10
**Author**: Claude (Anthropic)
