# LMS-Go Linear Issues Checklist

Track your progress creating and completing issues.

---

## Setup Tasks

- [ ] Review `LINEAR_ISSUES_SPEC.md` (detailed specifications)
- [ ] Review `LINEAR_SETUP_GUIDE.md` (how to create issues)
- [ ] Open Linear and navigate to LMS-Go project
- [ ] Create all required labels in Linear (see list below)
- [ ] Decide on creation method (manual, CSV, or API)

---

## Labels to Create in Linear

### Phase Labels
- [ ] `phase-1` (blue)
- [ ] `phase-2` (green)

### Type Labels
- [ ] `design` (purple)
- [ ] `frontend` (cyan)
- [ ] `backend` (orange)
- [ ] `feature` (green)
- [ ] `testing` (yellow)
- [ ] `documentation` (gray)
- [ ] `infrastructure` (red)

### Category Labels
- [ ] `ux` (pink)
- [ ] `enhancement` (light green)
- [ ] `quality` (dark gray)
- [ ] `component` (light blue)
- [ ] `admin` (for admin features)
- [ ] `quiz` (for quiz features)
- [ ] `analytics` (for tracking)
- [ ] `reporting` (for reporting)
- [ ] `worker` (for background jobs)
- [ ] `notifications` (for email)
- [ ] `webhooks` (for webhooks)

---

## Issue Creation Progress

### Priority 1-2: High Priority (Create First)

- [ ] **Issue #1**: [Design] Redesign Learner Catalog Page (/learn)
  - Priority: High (2) | Estimate: 3 pts | Labels: design, frontend, phase-1

- [ ] **Issue #2**: [Design] Redesign Course Detail Page (/learn/course/[id])
  - Priority: High (2) | Estimate: 3 pts | Labels: design, frontend, phase-1

### Priority 3: Medium Priority

- [ ] **Issue #3**: [Design] Redesign Admin Dashboard (/admin)
  - Priority: Medium (3) | Estimate: 5 pts | Labels: design, frontend, admin, phase-1

- [ ] **Issue #4**: [Design] Redesign Course Creation Wizard
  - Priority: Medium (3) | Estimate: 5 pts | Labels: design, frontend, admin, phase-1

- [ ] **Issue #6**: [Frontend] Next.js Learner Application - Complete Implementation
  - Priority: Medium (3) | Estimate: 5 pts | Labels: frontend, phase-1, testing
  - Dependencies: #1, #2, #5

- [ ] **Issue #7**: [Testing] End-to-End Test Suite
  - Priority: Medium (3) | Estimate: 3 pts | Labels: testing, phase-1, quality

- [ ] **Issue #8**: [Feature] Quiz Engine
  - Priority: Medium (3) | Estimate: 5 pts | Labels: backend, feature, phase-2, quiz

- [ ] **Issue #9**: [Feature] Activity Tracking
  - Priority: Medium (3) | Estimate: 4 pts | Labels: backend, feature, phase-2, analytics

- [ ] **Issue #10**: [Feature] Tutor Reporting Dashboard
  - Priority: Medium (3) | Estimate: 4 pts | Labels: backend, feature, phase-2, reporting
  - Dependencies: #9

- [ ] **Issue #11**: [UI] Reporting Dashboard UI
  - Priority: Medium (3) | Estimate: 3 pts | Labels: frontend, feature, phase-2, reporting
  - Dependencies: #10

- [ ] **Issue #12**: [Infrastructure] Async Jobs with Worker
  - Priority: Medium (3) | Estimate: 3 pts | Labels: backend, infrastructure, phase-2, worker

### Priority 4: Low Priority

- [ ] **Issue #5**: [Design] Redesign Global Navigation Component
  - Priority: Low (4) | Estimate: 2 pts | Labels: design, frontend, component

- [ ] **Issue #13**: [Feature] Email Notifications
  - Priority: Low (4) | Estimate: 3 pts | Labels: backend, feature, phase-2, notifications
  - Dependencies: #12

- [ ] **Issue #14**: [Feature] Internal Webhooks
  - Priority: Low (4) | Estimate: 2 pts | Labels: backend, feature, phase-2, webhooks
  - Dependencies: #12

- [ ] **Issue #15**: [UX] File Upload Improvements
  - Priority: Low (4) | Estimate: 3 pts | Labels: frontend, ux, enhancement

- [ ] **Issue #16**: [UX] Toast Notifications System
  - Priority: Low (4) | Estimate: 2 pts | Labels: frontend, ux, component

- [ ] **Issue #17**: [Feature] Course Search and Filters
  - Priority: Low (4) | Estimate: 3 pts | Labels: frontend, backend, feature, enhancement

- [ ] **Issue #18**: [Tech] Improve Error Handling and User Messages
  - Priority: Low (4) | Estimate: 2 pts | Labels: backend, frontend, quality

- [ ] **Issue #19**: [Docs] User Documentation - Admin Guide
  - Priority: Low (4) | Estimate: 2 pts | Labels: documentation

- [ ] **Issue #20**: [Docs] User Documentation - Learner Guide
  - Priority: Low (4) | Estimate: 1 pt | Labels: documentation

---

## Issue Dependencies Setup

After all issues are created, set up these relationships in Linear:

- [ ] Issue #6 blocks on: #1, #2, #5
- [ ] Issue #10 blocks on: #9
- [ ] Issue #11 blocks on: #10
- [ ] Issue #13 blocks on: #12
- [ ] Issue #14 blocks on: #12

---

## Sprint Setup

### Sprint 1: UI Redesign

- [ ] Create Sprint 1 cycle in Linear (2 weeks)
- [ ] Add Issue #1 to Sprint 1
- [ ] Add Issue #2 to Sprint 1
- [ ] Add Issue #3 to Sprint 1
- [ ] Add Issue #4 to Sprint 1
- [ ] Add Issue #5 to Sprint 1
- [ ] Add Issue #16 to Sprint 1

### Sprint 2: Phase 1 Completion

- [ ] Create Sprint 2 cycle in Linear (2 weeks)
- [ ] Add Issue #6 to Sprint 2
- [ ] Add Issue #7 to Sprint 2
- [ ] Add Issue #15 to Sprint 2
- [ ] Add Issue #17 to Sprint 2
- [ ] Add Issue #18 to Sprint 2
- [ ] Add Issue #8 to Sprint 2 (may carry over)

### Sprint 3: Phase 2 Foundation

- [ ] Create Sprint 3 cycle in Linear (2 weeks)
- [ ] Add Issue #8 to Sprint 3 (if not complete)
- [ ] Add Issue #9 to Sprint 3
- [ ] Add Issue #10 to Sprint 3
- [ ] Add Issue #11 to Sprint 3
- [ ] Add Issue #12 to Sprint 3
- [ ] Add Issue #13 to Sprint 3

### Sprint 4: Polish & Docs

- [ ] Create Sprint 4 cycle in Linear (1 week)
- [ ] Add Issue #14 to Sprint 4
- [ ] Add Issue #19 to Sprint 4
- [ ] Add Issue #20 to Sprint 4

---

## Issue Completion Progress

### Sprint 1: UI Redesign (20 points)

- [ ] ✅ Issue #1 Complete: Redesign Learner Catalog (3 pts)
- [ ] ✅ Issue #2 Complete: Redesign Course Detail (3 pts)
- [ ] ✅ Issue #3 Complete: Redesign Admin Dashboard (5 pts)
- [ ] ✅ Issue #4 Complete: Redesign Course Creation Wizard (5 pts)
- [ ] ✅ Issue #5 Complete: Redesign Navigation (2 pts)
- [ ] ✅ Issue #16 Complete: Toast Notifications (2 pts)

**Sprint 1 Progress**: 0/20 points completed

---

### Sprint 2: Phase 1 Completion (21 points)

- [ ] ✅ Issue #6 Complete: Complete Next.js Implementation (5 pts)
- [ ] ✅ Issue #7 Complete: E2E Test Suite (3 pts)
- [ ] ✅ Issue #15 Complete: File Upload Improvements (3 pts)
- [ ] ✅ Issue #17 Complete: Course Search and Filters (3 pts)
- [ ] ✅ Issue #18 Complete: Error Handling Improvements (2 pts)
- [ ] ✅ Issue #8 Complete: Quiz Engine (5 pts)

**Sprint 2 Progress**: 0/21 points completed

---

### Sprint 3: Phase 2 Foundation (17 points)

- [ ] ✅ Issue #9 Complete: Activity Tracking (4 pts)
- [ ] ✅ Issue #10 Complete: Tutor Reporting Dashboard (4 pts)
- [ ] ✅ Issue #11 Complete: Reporting Dashboard UI (3 pts)
- [ ] ✅ Issue #12 Complete: Async Jobs with Worker (3 pts)
- [ ] ✅ Issue #13 Complete: Email Notifications (3 pts)

**Sprint 3 Progress**: 0/17 points completed

---

### Sprint 4: Polish & Docs (7 points)

- [ ] ✅ Issue #14 Complete: Internal Webhooks (2 pts)
- [ ] ✅ Issue #19 Complete: Admin Guide (2 pts)
- [ ] ✅ Issue #20 Complete: Learner Guide (1 pt)

**Sprint 4 Progress**: 0/7 points completed

---

## Overall Progress

**Issues Created**: 0/20 (0%)

**Story Points Completed**: 0/58 (0%)

**Sprints Completed**: 0/4 (0%)

---

## Milestones

- [ ] **Milestone 1**: All issues created in Linear
- [ ] **Milestone 2**: All labels set up
- [ ] **Milestone 3**: Sprint 1 complete (UI redesign done)
- [ ] **Milestone 4**: Sprint 2 complete (Phase 1 MVP finished)
- [ ] **Milestone 5**: Sprint 3 complete (Phase 2 core features)
- [ ] **Milestone 6**: Sprint 4 complete (Documentation and polish)
- [ ] **Milestone 7**: Project ready for production

---

## Daily Standup Template

Copy this template for daily updates:

```markdown
## Standup - [Date]

### Yesterday
- Completed: [Issue #X - description]
- Progress on: [Issue #Y - description]

### Today
- Plan to complete: [Issue #X]
- Will work on: [Issue #Y]

### Blockers
- [Any blockers or questions]

### Sprint Progress
- Points completed: X/Y
- On track: Yes/No
```

---

## Weekly Review Template

Copy this template for weekly reviews:

```markdown
## Week [Number] Review - [Date Range]

### Completed This Week
- [ ] Issue #X - [Title] (X pts)
- [ ] Issue #Y - [Title] (Y pts)

### In Progress
- [ ] Issue #Z - [Title] (Z pts) - [% complete]

### Planned for Next Week
- [ ] Issue #A - [Title]
- [ ] Issue #B - [Title]

### Sprint Progress
- Points completed: X/Y
- Velocity: X points/week
- On track for sprint goals: Yes/No

### Learnings
- [What went well]
- [What could be improved]
- [Technical insights]

### Adjustments Needed
- [Any scope changes]
- [Any estimate updates]
```

---

## Resources Quick Links

- 📄 [Detailed Spec](LINEAR_ISSUES_SPEC.md) - Full issue specifications
- 📖 [Setup Guide](LINEAR_SETUP_GUIDE.md) - How to create issues
- 📊 [Summary](LINEAR_ISSUES_SUMMARY.md) - Overview and sprint planning
- 📋 [CSV Import](linear_issues_import.csv) - Bulk import file
- 🏗️ [Project README](README.md) - Project setup
- 📘 [Claude Guide](CLAUDE.md) - Development guide
- 📈 [Current Status](STATUS_FINAL.md) - Current state
- 🎨 [Redesign Summary](REDESIGN_SUMMARY.md) - UI redesign details

---

## Notes

### Tips for Success
1. ✅ Start small - create Sprint 1 issues first
2. ✅ Review issue details before starting work
3. ✅ Update progress regularly
4. ✅ Don't hesitate to adjust estimates
5. ✅ Break large issues into subtasks if needed
6. ✅ Celebrate small wins!

### When to Update This Checklist
- ✓ After creating each issue in Linear
- ✓ After completing work on an issue
- ✓ At the end of each sprint
- ✓ When adjusting plans or priorities

---

**Last Updated**: [Date]

**Current Sprint**: Sprint 1

**Next Review Date**: [Date]

---

*Track your progress and ship great features! 🚀*
