# Linear Setup Guide for LMS-Go Issues

## Quick Start

You have three options to create these issues in Linear:

### Option 1: Manual Creation (Recommended for accuracy)
Use the detailed spec in `LINEAR_ISSUES_SPEC.md` and create each issue manually in Linear.

### Option 2: CSV Import (If Linear supports it)
Use `linear_issues_import.csv` to bulk import all 20 issues.

### Option 3: Linear API (For developers)
Use the Linear API to programmatically create issues from the spec.

---

## Option 1: Manual Creation

### Step-by-Step Process

1. **Open Linear** and navigate to your LMS-Go project
2. **Open the spec**: `LINEAR_ISSUES_SPEC.md`
3. **For each issue**, click "New Issue" in Linear and:

#### Issue Fields to Fill:

**Title**: Copy exactly from the spec (e.g., "[Design] Redesign Learner Catalog Page (/learn)")

**Priority**: Set according to the spec:
- Priority 0 = None
- Priority 1 = Urgent
- Priority 2 = High ← Issues #1, #2
- Priority 3 = Medium ← Issues #3-12
- Priority 4 = Low ← Issues #5, #13-20

**Estimate**: Use the story points from the spec
- 1 point = <4 hours
- 2 points = 4-8 hours (0.5-1 day)
- 3 points = 1-2 days
- 4 points = 2-3 days
- 5 points = 3-5 days
- 8 points = 1-2 weeks

**Labels**: Add all labels listed for each issue
- Common labels: `design`, `frontend`, `backend`, `phase-1`, `phase-2`, `testing`, `feature`, `ux`, `enhancement`, `quality`, `documentation`, `infrastructure`

**Description**: Copy the entire description section including:
- The overview paragraph
- Current State (if present)
- Tasks checklist
- Acceptance Criteria
- Files to Modify/Create
- References

**Status**: Set to "Backlog" initially

**Dependencies**: If listed, create relationships after all issues are created:
- Issue #6 depends on #1, #2, #5
- Issue #10 depends on #9
- Issue #11 depends on #10
- Issue #13 depends on #12
- Issue #14 depends on #12

### Time Estimate
- Creating all 20 issues manually: ~2-3 hours
- But ensures accuracy and understanding of each issue

---

## Option 2: CSV Import

### Check if Linear Supports CSV Import

1. In Linear, go to **Settings** → **Import**
2. Look for CSV import option
3. If available, upload `linear_issues_import.csv`

### CSV Format

The CSV includes columns:
- Title
- Description
- Priority (0-4)
- Estimate (story points)
- Labels (comma-separated)
- Status ("Backlog")
- Dependencies (issue numbers)

### After Import

1. **Verify all issues were created** correctly
2. **Check labels** were applied
3. **Verify priorities** and estimates
4. **Set up dependencies** manually (CSV may not support this)
5. **Add project/team** assignment if needed

---

## Option 3: Linear API

### Prerequisites
- Linear API key
- Node.js or Python installed
- Basic programming knowledge

### Using Linear API (Node.js Example)

```javascript
const { LinearClient } = require('@linear/sdk');

const client = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY
});

async function createIssues() {
  const teamId = 'YOUR_TEAM_ID';

  // Issue #1
  await client.createIssue({
    teamId: teamId,
    title: '[Design] Redesign Learner Catalog Page (/learn)',
    description: '...',  // Full description from spec
    priority: 2,  // High
    estimate: 3,
    labelIds: ['design-label-id', 'frontend-label-id', 'phase-1-label-id']
  });

  // Repeat for all 20 issues...
}

createIssues();
```

### Steps:

1. **Install Linear SDK**:
   ```bash
   npm install @linear/sdk
   ```

2. **Get your API key**: Linear Settings → API → Personal API Keys

3. **Get your team ID**: From Linear URL (e.g., `linear.app/team/TEAM_ID`)

4. **Get label IDs**: Query existing labels or create new ones

5. **Run the script** to create all issues

### Resources:
- [Linear API Documentation](https://developers.linear.app/)
- [Linear SDK for TypeScript](https://www.npmjs.com/package/@linear/sdk)

---

## Label Setup in Linear

Before importing/creating issues, ensure these labels exist in your Linear workspace:

### Create These Labels:

**Phase Labels**:
- `phase-1` (color: blue)
- `phase-2` (color: green)

**Type Labels**:
- `design` (color: purple)
- `frontend` (color: cyan)
- `backend` (color: orange)
- `feature` (color: green)
- `testing` (color: yellow)
- `documentation` (color: gray)
- `infrastructure` (color: red)

**Category Labels**:
- `ux` (color: pink)
- `enhancement` (color: light green)
- `quality` (color: dark gray)
- `component` (color: light blue)

**Specific Labels**:
- `admin` (for admin-related features)
- `quiz` (for quiz features)
- `analytics` (for tracking/analytics)
- `reporting` (for reporting features)
- `worker` (for background jobs)
- `notifications` (for email/webhooks)
- `webhooks` (for webhook features)

### To Create Labels in Linear:

1. Go to **Settings** → **Labels**
2. Click **"New Label"**
3. Enter name (e.g., "phase-1")
4. Choose color
5. Repeat for all labels above

---

## Suggested Workflow

### Recommended Approach (Hybrid):

1. **Set up labels first** (10 minutes)
2. **Create Priority 1-2 issues manually** (Issues #1-7) for immediate work
3. **Import or bulk-create Priority 3-4 issues** (Issues #8-20) for backlog

This gives you:
- Detailed, well-understood issues for current sprint
- Backlog items ready for future planning

---

## Sprint Planning

### Sprint 1 (2 weeks - 20 points)
**Focus**: UI Redesign

Issues to add to Sprint 1:
- Issue #1: Redesign Learner Catalog (3 pts)
- Issue #2: Redesign Course Detail (3 pts)
- Issue #3: Redesign Admin Dashboard (5 pts)
- Issue #4: Redesign Course Creation Wizard (5 pts)
- Issue #5: Redesign Navigation (2 pts)
- Issue #16: Toast Notifications (2 pts)

**How to add**:
1. Create these 6 issues first
2. Create a cycle/sprint in Linear
3. Assign these issues to the sprint
4. Move to "In Progress" as you work on them

### Sprint 2 (2 weeks - 21 points)
**Focus**: Phase 1 Completion & Testing

Issues to add to Sprint 2:
- Issue #6: Complete Next.js Implementation (5 pts)
- Issue #7: E2E Test Suite (3 pts)
- Issue #15: File Upload Improvements (3 pts)
- Issue #17: Course Search and Filters (3 pts)
- Issue #18: Error Handling Improvements (2 pts)
- Issue #8: Quiz Engine (5 pts - may carry over)

### Sprint 3 (2 weeks - 17 points)
**Focus**: Phase 2 Foundation

Issues:
- Issue #8: Quiz Engine (if not complete)
- Issue #9: Activity Tracking (4 pts)
- Issue #10: Tutor Reporting Dashboard (4 pts)
- Issue #11: Reporting Dashboard UI (3 pts)
- Issue #12: Async Jobs with Worker (3 pts)
- Issue #13: Email Notifications (3 pts)

### Sprint 4 (1 week - 7 points)
**Focus**: Polish & Documentation

Issues:
- Issue #14: Internal Webhooks (2 pts)
- Issue #19: Admin Guide (2 pts)
- Issue #20: Learner Guide (1 pt)
- Buffer for bug fixes

---

## Tips for Success

### 1. Start Small
Don't create all 20 issues at once. Start with Sprint 1 issues (#1-5, #16).

### 2. Add Context as You Go
As you work on issues, add:
- Code snippets
- Design mockups
- Related PRs
- Discussion threads

### 3. Break Down Large Issues
If an issue feels too big (5+ points), break it into subtasks:
- Use Linear's sub-issue feature
- Or create separate issues linked as "blocks"

### 4. Update Estimates
If an issue takes longer/shorter than estimated, update the estimate and add a comment explaining why.

### 5. Track Dependencies
Use Linear's "Blocks" relationship to track dependencies between issues.

### 6. Celebrate Progress
As you complete issues, share progress with your team. The sprint burndown will show your momentum!

---

## File Locations

All files are in the project root:

- **Detailed Spec**: `/home/arnaud/project/lms-go/LINEAR_ISSUES_SPEC.md`
- **CSV Import**: `/home/arnaud/project/lms-go/linear_issues_import.csv`
- **This Guide**: `/home/arnaud/project/lms-go/LINEAR_SETUP_GUIDE.md`

---

## Summary Statistics

**Total Issues**: 20
**Total Story Points**: 58 points
**Estimated Time**: ~12 weeks (4 sprints) with 1 developer

### By Priority:
- High (2): 2 issues → Start immediately
- Medium (3): 11 issues → Next 2-3 sprints
- Low (4): 7 issues → Backlog for later

### By Type:
- Design: 5 issues
- Frontend: 10 issues
- Backend: 8 issues
- Testing: 2 issues
- Documentation: 2 issues

---

## Need Help?

If you encounter issues:

1. **Linear Documentation**: https://linear.app/docs
2. **Linear Community**: https://github.com/linearapp/linear
3. **Project Documentation**: See `/home/arnaud/project/lms-go/CLAUDE.md`

---

## Next Steps

1. ✅ Review the detailed spec (`LINEAR_ISSUES_SPEC.md`)
2. ⬜ Set up labels in Linear
3. ⬜ Create Sprint 1 issues (manually recommended)
4. ⬜ Create a Sprint/Cycle for next 2 weeks
5. ⬜ Assign issues to sprint
6. ⬜ Start working! 🚀

Good luck with your LMS-Go project! 🎓
