# Claude Overnight Wishlist

Add tasks below for Claude to work on overnight. Each task should be on its own line starting with `- [ ]`.

Claude will:
1. Read this file
2. Plan the implementation
3. Execute and create PRs for your review

---

## Tasks

### 1. Admin Mode State Persistence
**Issue:** After enabling admin toggle and refreshing the page, user is redirected back to the runner page instead of staying in admin mode. Users must manually re-enable admin mode after every page refresh.

- [ ] Investigate how admin mode state is currently stored (likely React state in AdminContext)
- [ ] Persist admin mode state to localStorage or sessionStorage
- [ ] On app initialization, restore admin mode state from storage
- [ ] Ensure admin mode persists across page refreshes and navigation
- [ ] Test by enabling admin mode, refreshing, and verifying state is maintained

### 2. Button Alignment Issues in Calendar Page
**Issue:** Some button positions in the UI are not aligned. Specifically, the three buttons under the annual activity calendar have inconsistent vertical alignment/heights.

- [ ] Locate the Calendar page component (ProjectCode/client/src/pages/CalendarPage.js)
- [ ] Identify the three buttons with alignment issues
- [ ] Apply consistent MUI sx styling (alignItems, display: flex, etc.) to ensure buttons are vertically aligned
- [ ] Check for other button alignment issues across the UI
- [ ] Test responsiveness on different screen sizes

