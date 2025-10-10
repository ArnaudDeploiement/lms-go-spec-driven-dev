# Linear Issues Summary - LMS Go

**Generated**: 2025-10-10
**Total Issues**: 20
**Total Story Points**: 58
**Estimated Timeline**: 12 weeks (4 sprints)

---

## Quick Reference

| # | Title | Priority | Points | Labels | Dependencies |
|---|-------|----------|--------|--------|--------------|
| 1 | [Design] Redesign Learner Catalog Page (/learn) | High (2) | 3 | design, frontend, phase-1 | - |
| 2 | [Design] Redesign Course Detail Page (/learn/course/[id]) | High (2) | 3 | design, frontend, phase-1 | - |
| 3 | [Design] Redesign Admin Dashboard (/admin) | Medium (3) | 5 | design, frontend, admin, phase-1 | - |
| 4 | [Design] Redesign Course Creation Wizard | Medium (3) | 5 | design, frontend, admin, phase-1 | - |
| 5 | [Design] Redesign Global Navigation Component | Low (4) | 2 | design, frontend, component | - |
| 6 | [Frontend] Next.js Learner Application - Complete Implementation | Medium (3) | 5 | frontend, phase-1, testing | #1, #2, #5 |
| 7 | [Testing] End-to-End Test Suite | Medium (3) | 3 | testing, phase-1, quality | - |
| 8 | [Feature] Quiz Engine | Medium (3) | 5 | backend, feature, phase-2, quiz | - |
| 9 | [Feature] Activity Tracking | Medium (3) | 4 | backend, feature, phase-2, analytics | - |
| 10 | [Feature] Tutor Reporting Dashboard | Medium (3) | 4 | backend, feature, phase-2, reporting | #9 |
| 11 | [UI] Reporting Dashboard UI | Medium (3) | 3 | frontend, feature, phase-2, reporting | #10 |
| 12 | [Infrastructure] Async Jobs with Worker | Medium (3) | 3 | backend, infrastructure, phase-2, worker | - |
| 13 | [Feature] Email Notifications | Low (4) | 3 | backend, feature, phase-2, notifications | #12 |
| 14 | [Feature] Internal Webhooks | Low (4) | 2 | backend, feature, phase-2, webhooks | #12 |
| 15 | [UX] File Upload Improvements | Low (4) | 3 | frontend, ux, enhancement | - |
| 16 | [UX] Toast Notifications System | Low (4) | 2 | frontend, ux, component | - |
| 17 | [Feature] Course Search and Filters | Low (4) | 3 | frontend, backend, feature, enhancement | - |
| 18 | [Tech] Improve Error Handling and User Messages | Low (4) | 2 | backend, frontend, quality | - |
| 19 | [Docs] User Documentation - Admin Guide | Low (4) | 2 | documentation | - |
| 20 | [Docs] User Documentation - Learner Guide | Low (4) | 1 | documentation | - |

---

## Sprint Planning

### 🎯 Sprint 1: UI Redesign (2 weeks - 20 points)

**Goals**: Complete Vercel-style redesign for all main pages

| Issue | Title | Points | Status |
|-------|-------|--------|--------|
| #1 | Redesign Learner Catalog Page | 3 | □ Backlog |
| #2 | Redesign Course Detail Page | 3 | □ Backlog |
| #3 | Redesign Admin Dashboard | 5 | □ Backlog |
| #4 | Redesign Course Creation Wizard | 5 | □ Backlog |
| #5 | Redesign Navigation Component | 2 | □ Backlog |
| #16 | Toast Notifications System | 2 | □ Backlog |

**Deliverables**:
- ✓ All pages use Vercel design system
- ✓ Consistent light theme across app
- ✓ Professional corporate look
- ✓ Toast notifications working

---

### 🎯 Sprint 2: Phase 1 Completion (2 weeks - 21 points)

**Goals**: Complete MVP features and testing

| Issue | Title | Points | Status |
|-------|-------|--------|--------|
| #6 | Complete Next.js Implementation | 5 | □ Backlog |
| #7 | E2E Test Suite | 3 | □ Backlog |
| #15 | File Upload Improvements | 3 | □ Backlog |
| #17 | Course Search and Filters | 3 | □ Backlog |
| #18 | Error Handling Improvements | 2 | □ Backlog |
| #8 | Quiz Engine (start) | 5 | □ Backlog |

**Deliverables**:
- ✓ All Phase 1 features complete
- ✓ E2E tests with ≥60% coverage
- ✓ Improved file upload UX
- ✓ Search and filtering working
- ✓ Better error messages

---

### 🎯 Sprint 3: Phase 2 Foundation (2 weeks - 17 points)

**Goals**: Implement tracking, reporting, and async infrastructure

| Issue | Title | Points | Status |
|-------|-------|--------|--------|
| #8 | Quiz Engine (complete) | - | □ Backlog |
| #9 | Activity Tracking | 4 | □ Backlog |
| #10 | Tutor Reporting Dashboard | 4 | □ Backlog |
| #11 | Reporting Dashboard UI | 3 | □ Backlog |
| #12 | Async Jobs with Worker | 3 | □ Backlog |
| #13 | Email Notifications | 3 | □ Backlog |

**Deliverables**:
- ✓ Quiz system fully functional
- ✓ Activity tracking in place
- ✓ Reporting endpoints working
- ✓ Reporting dashboard complete
- ✓ Worker infrastructure ready
- ✓ Email notifications sending

---

### 🎯 Sprint 4: Polish & Docs (1 week - 7 points)

**Goals**: Final touches and documentation

| Issue | Title | Points | Status |
|-------|-------|--------|--------|
| #14 | Internal Webhooks | 2 | □ Backlog |
| #19 | Admin Guide | 2 | □ Backlog |
| #20 | Learner Guide | 1 | □ Backlog |
| - | Bug fixes & polish | 2 | □ Buffer |

**Deliverables**:
- ✓ Webhook system working
- ✓ Complete admin documentation
- ✓ Complete learner documentation
- ✓ All critical bugs fixed
- ✓ Ready for production

---

## Priority Breakdown

### 🔴 High Priority (2)
**Must complete first - Core UI improvements**

- Issue #1: Redesign Learner Catalog (3 pts)
- Issue #2: Redesign Course Detail (3 pts)

**Total**: 6 points (~3-4 days)

---

### 🟡 Medium Priority (3)
**Important for MVP and Phase 2**

- Issue #3: Redesign Admin Dashboard (5 pts)
- Issue #4: Redesign Course Creation Wizard (5 pts)
- Issue #6: Complete Next.js Implementation (5 pts)
- Issue #7: E2E Test Suite (3 pts)
- Issue #8: Quiz Engine (5 pts)
- Issue #9: Activity Tracking (4 pts)
- Issue #10: Tutor Reporting Dashboard (4 pts)
- Issue #11: Reporting Dashboard UI (3 pts)
- Issue #12: Async Jobs with Worker (3 pts)

**Total**: 37 points (~5-6 weeks)

---

### 🟢 Low Priority (4)
**Nice-to-have improvements and documentation**

- Issue #5: Redesign Navigation (2 pts)
- Issue #13: Email Notifications (3 pts)
- Issue #14: Internal Webhooks (2 pts)
- Issue #15: File Upload Improvements (3 pts)
- Issue #16: Toast Notifications (2 pts)
- Issue #17: Course Search and Filters (3 pts)
- Issue #18: Error Handling Improvements (2 pts)
- Issue #19: Admin Guide (2 pts)
- Issue #20: Learner Guide (1 pts)

**Total**: 20 points (~3-4 weeks)

---

## By Category

### 🎨 Design (5 issues - 18 points)
Complete UI redesign to Vercel aesthetic
- #1, #2, #3, #4, #5

### 💻 Frontend (10 issues - 29 points)
Next.js application and UI components
- #1, #2, #4, #6, #11, #15, #16, #17 (+components in #3, #5, #18)

### ⚙️ Backend (8 issues - 23 points)
Go API, database, and services
- #8, #9, #10, #12, #13, #14, #17, #18

### 🧪 Testing (2 issues - 6 points)
E2E and integration tests
- #6 (includes tests), #7

### 📚 Documentation (2 issues - 3 points)
User guides and documentation
- #19, #20

### 🎯 Phase 1 (7 issues - 26 points)
MVP completion
- #1, #2, #3, #4, #6, #7

### 🚀 Phase 2 (7 issues - 24 points)
Advanced features
- #8, #9, #10, #11, #12, #13, #14

---

## Dependencies Graph

```
Phase 1 UI:
  #1, #2, #5 → #6 (Next.js completion)

Phase 2 Tracking & Reporting:
  #9 (Activity Tracking) → #10 (Reporting Backend) → #11 (Reporting UI)

Phase 2 Infrastructure:
  #12 (Async Jobs) → #13 (Email Notifications)
  #12 (Async Jobs) → #14 (Webhooks)

Independent:
  #3, #4, #7, #8, #15, #16, #17, #18, #19, #20
```

---

## Key Metrics

### Current State
- ✅ Phase 0: Complete (Setup, CI/CD, basic auth)
- ✅ Phase 1: ~90% Complete (MVP features working)
- ⏳ UI: Partially redesigned (auth + module viewer done)
- ⏳ Phase 2: Not started

### Target State (After All Issues)
- ✅ Phase 1: 100% Complete + Tests
- ✅ UI: Fully redesigned to Vercel style
- ✅ Phase 2: Core features complete
- ✅ Documentation: Complete

### Success Criteria
- [ ] All 20 issues completed
- [ ] Test coverage ≥60%
- [ ] Design consistent across all pages
- [ ] No critical bugs
- [ ] Documentation published
- [ ] Ready for production use

---

## Velocity Assumptions

**Team Size**: 1 developer
**Sprint Length**: 2 weeks
**Velocity**: 15-20 points per sprint

### Actual Timeline May Vary Based On:
- Developer experience
- Unexpected bugs/blockers
- Scope changes
- Testing requirements
- Code review time

---

## Getting Started

### Immediate Actions (Today)

1. **Review detailed spec**: Open `LINEAR_ISSUES_SPEC.md`
2. **Set up Linear labels**: Create all required labels
3. **Create Sprint 1 issues**: Issues #1-5, #16
4. **Create Sprint 1 cycle**: 2-week sprint starting now
5. **Start with Issue #1**: Redesign Learner Catalog

### This Week

- [ ] Complete Issues #1 and #2 (learner UI)
- [ ] Start Issue #3 (admin dashboard)
- [ ] Set up test infrastructure for Issue #7

### This Sprint (2 weeks)

- [ ] Complete all Sprint 1 issues
- [ ] Plan Sprint 2
- [ ] Review progress and adjust estimates

---

## Resources

### Documentation Files
- 📄 **Detailed Spec**: `/home/arnaud/project/lms-go/LINEAR_ISSUES_SPEC.md`
- 📊 **CSV Import**: `/home/arnaud/project/lms-go/linear_issues_import.csv`
- 📖 **Setup Guide**: `/home/arnaud/project/lms-go/LINEAR_SETUP_GUIDE.md`
- 📝 **This Summary**: `/home/arnaud/project/lms-go/LINEAR_ISSUES_SUMMARY.md`

### Project Documentation
- `/home/arnaud/project/lms-go/CLAUDE.md` - Project overview
- `/home/arnaud/project/lms-go/README.md` - Setup instructions
- `/home/arnaud/project/lms-go/STATUS_FINAL.md` - Current status
- `/home/arnaud/project/lms-go/REDESIGN_SUMMARY.md` - Redesign details
- `/home/arnaud/project/lms-go/specs/lms-go-backlog.md` - Original backlog
- `/home/arnaud/project/lms-go/specs/ISSUES_TRACKER.md` - Current issues

### Design Resources
- `/home/arnaud/project/lms-go/web/app/globals.css` - Vercel design system
- `/home/arnaud/project/lms-go/web/ADMIN_DESIGN_IMPROVEMENTS.md` - Admin design spec
- [Vercel Design System](https://vercel.com/design) - Reference

---

## Support

If you need help:

1. **Project Questions**: Review `/CLAUDE.md` and `/README.md`
2. **Design Questions**: Check `/REDESIGN_SUMMARY.md` and `globals.css`
3. **Linear Help**: See [Linear Documentation](https://linear.app/docs)
4. **Technical Issues**: Review `/specs/ISSUES_TRACKER.md`

---

**Ready to build? Start with Sprint 1! 🚀**

---

*Last updated: 2025-10-10*
*Generated by: Claude (Anthropic)*
