# Claude Overnight Wishlist

Add tasks below for Claude to work on overnight. Each task should be on its own line starting with `- [ ]`.

Claude will:
1. Read this file
2. Plan the implementation
3. Execute and create PRs for your review

---

## Tasks

### 1. NYRR Race Results Sync Pipeline
- [ ] Create a weekly cron job (GitHub Actions) to scan NYRR's website for new race results
- [ ] Sync results to the database for all registered club members
- [ ] Match members by their NYRR Runner ID (stored in user profile)
- [ ] Skip already-imported results to avoid duplicates

### 2. JoinPage Email Notifications
- [ ] Set up Gmail SMTP integration using newbeerunningclub@gmail.com (requires app password in .env)
- [ ] Send confirmation email to applicant after form submission (thank them, confirm receipt)
- [ ] Send notification email to newbeerunningclub@gmail.com with applicant details for committee review
- [ ] Include applicant info: name, email, NYRR ID, and submission timestamp

### 3. User Role & Classification System
- [ ] Add `role` field to user table with values: `pending`, `runner`, `admin`, `quit` (default: `pending` for new signups)
- [ ] Committee members (from committeeMembers.js) have permission to approve/modify user roles
- [ ] Create admin panel page for committee members to view pending applications and approve/reject
- [ ] New applicants start as `pending` until approved by committee, then become `runner`

### 4. Profile Page Enhancement
- [ ] Add NYRR Runner ID field to user profile (editable by user)
- [ ] Display user's NYRR race history fetched from the results table (matched by NYRR ID)
- [ ] Show race stats: total races, PRs by distance, recent results
- [ ] Allow user to edit profile fields: name, email, phone, NYRR ID, etc.
- [ ] Display user's current membership status (pending/runner/admin)
- [ ] Delete dashboard page, and migrate all contents there to profile page.

---

## Environment Variables Needed

```
# Gmail SMTP (for email notifications)
GMAIL_USER=newbeerunningclub@gmail.com
GMAIL_APP_PASSWORD=<generate from Google Account settings>
```

## Notes
- Committee members are defined in `client/src/data/committeeMembers.js`
- NYRR Runner ID format: numeric ID visible on NYRR race results pages
- All new signups via JoinPage should default to `pending` status