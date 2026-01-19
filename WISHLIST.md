# Claude Overnight Wishlist

Add tasks below for Claude to work on overnight. Each task should be on its own line starting with `- [ ]`.

Claude will:
1. Read this file
2. Plan the implementation
3. Execute and create PRs for your review

---

## Tasks

### Homepage Enhancement
- [x] Make each homepage banner image clickable, linking to relevant pages (About, Join, Calendar, etc.)
- [x] Add subtle hover effects and visual cues (arrows, text overlays) to indicate banners are interactive
- [x] Ensure banner click targets are mobile-friendly

> **PR:** `feature/homepage-clickable-banners` - Banners now link to About, Join, and Calendar pages with hover effects and carousel indicators

### Sponsors Page Enhancement
- [x] Redesign donors display to be more visually appealing (cards with avatars, better typography)
- [x] Add "Donation Date" column to donor records in database and API
- [x] Add "Donation Reason/Message" optional field for donors to include a personal note
- [x] Sort donors by donation date (most recent first) by default
- [x] Add option to display donor's custom message on the sponsors page

> **Status:** Already implemented in previous updates. SponsorsPage uses card layout with donation_date and message fields.

### Admin Dashboard (Committee Tools)
- [x] Create admin dashboard page at /admin with tabbed interface
- [x] Add "Create Event" form - allows admins to create new calendar events
- [x] Add "Send Newsletter" feature - compose and trigger mass email to all members
- [x] Add "Manage Members" table - view/edit member status, approve pending applications
- [x] Add "View Analytics" section - member stats, event attendance, donation totals

> **PR:** `feature/admin-dashboard-enhancement` - Complete admin dashboard with 5 tabs: Members, Events, Newsletter, Analytics, Meeting Notes

### Future Vision: AI Runner Companion (Large Project)
- [x] Design architecture for AI running coach/companion feature
- [x] Create "Training with Us" page as entry point for AI companion webapp
- [ ] Build training plan generator based on user goals and fitness level
- [ ] Integrate with running data (Strava API, manual input) for personalized feedback
- [ ] Allow NewBee members to contribute training tips and data to improve AI recommendations
- [ ] Create community-driven training content (routes, workouts, race strategies)

> **PR:** `feature/ai-runner-companion` - Architecture document created, Training page enhanced with tabbed interface, community tips, and route library placeholders

