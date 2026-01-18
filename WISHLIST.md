# Claude Overnight Wishlist

Add tasks below for Claude to work on overnight. Each task should be on its own line starting with `- [ ]`.

Claude will:
1. Read this file
2. Plan the implementation
3. Execute and create PRs for your review

---

## Tasks

(None - all tasks completed!)

---

## Completed

- [x] **Profile Page Enhancements** (completed 2026-01-18)
  - Display all member fields from database: `display_name`, `email`, `phone`, `nyrr_id`, `emergency_contact`, etc.
  - The `profile_photo_url` column already exists in the database (synced from Firebase)
  - Add UI for profile image upload/change functionality (camera icon badge on avatar)
  - Added Running Profile section and Club Credits display
  - Location: `ProfilePage.js` (client/src/pages/)

- [x] **Join Page Improvements** (completed 2026-01-18)
  - **Location dropdown**: Options are 5 NYC boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island), New Jersey, Long Island, and "Other" (with free text input)
  - **Self-intro validation**: Requires minimum 480 Chinese characters OR 120 English words with live character/word count
  - **Better error display**: Shows actual validation reasons from API
  - **Fix stepper flow**: Shows success confirmation UI with thank you message instead of resetting form
  - Location: `JoinPage.js` (client/src/pages/)

- [x] **Admin Mode Toggle** (completed 2026-01-18)
  - Add toggle button near Profile button in NavBar (gold when enabled)
  - Only visible for users with `status='admin'` OR users in `committeeMembers` list
  - When enabled, shows editing UI on:
    - `CalendarPage` - edit/delete buttons on events, Add Event button
    - `RecordsPage` - admin info alert explaining data sources
    - `SponsorsPage` - edit/delete buttons on donors, Add Donor button
  - Created new `AdminContext.js` for state management
  - Locations: `NavBar.js` (components), `CalendarPage.js`, `RecordsPage.js`, `SponsorsPage.js` (pages)
