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

- [x] Investigate how admin mode state is currently stored (likely React state in AdminContext)
- [x] Persist admin mode state to localStorage or sessionStorage
- [x] On app initialization, restore admin mode state from storage
- [x] Ensure admin mode persists across page refreshes and navigation
- [x] Test by enabling admin mode, refreshing, and verifying state is maintained

**Completed:** See PR branch `feature/admin-mode-persistence` - Added localStorage persistence with safe read/write helpers in AdminContext.js

### 2. Button Alignment Issues in Calendar Page
**Issue:** Some button positions in the UI are not aligned. Specifically, the three buttons under the annual activity calendar have inconsistent vertical alignment/heights.

- [x] Locate the Calendar page component (ProjectCode/client/src/pages/CalendarPage.js)
- [x] Identify the three buttons with alignment issues
- [x] Apply consistent MUI sx styling (alignItems, display: flex, etc.) to ensure buttons are vertically aligned
- [x] Check for other button alignment issues across the UI
- [x] Test responsiveness on different screen sizes

**Completed:** See PR branch `feature/calendar-button-alignment` - Added `mt: 'auto'` to featured event card buttons to ensure consistent vertical alignment at card bottom regardless of content height

