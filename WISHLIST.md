# Claude Overnight Wishlist

Add tasks below for Claude to work on overnight. Each task should be on its own line starting with `- [ ]`.

Claude will:
1. Read this file
2. Plan the implementation
3. Execute and create PRs for your review

---

## Tasks

### 1. NYRR Race Results Sync Pipeline ✅
- [x] Create a weekly cron job (GitHub Actions) to scan NYRR's website for new race results
- [x] Sync results to the database for all registered club members
- [x] Match members by their NYRR Runner ID (stored in user profile)
- [x] Skip already-imported results to avoid duplicates
> **Implemented:** `sync_member_results.py` + `nyrr-weekly-sync.yml.template` (rename to .yml to activate)

### 2. JoinPage Email Notifications ✅
- [x] Set up Gmail SMTP integration using newbeerunningclub@gmail.com (requires app password in .env)
- [x] Send confirmation email to applicant after form submission (thank them, confirm receipt)
- [x] Send notification email to newbeerunningclub@gmail.com with applicant details for committee review
- [x] Include applicant info: name, email, NYRR ID, and submission timestamp
> **Implemented:** `email_service.py` + JoinPage integration

### 3. User Role & Classification System ✅
- [x] Add `role` field to user table with values: `pending`, `runner`, `admin`, `quit` (default: `pending` for new signups)
- [x] Committee members (from committeeMembers.js) have permission to approve/modify user roles
- [x] Create admin panel page for committee members to view pending applications and approve/reject
- [x] New applicants start as `pending` until approved by committee, then become `runner`
> **Implemented:** `AdminPanelPage.js` at `/admin` route + backend auth

### 4. Profile Page Enhancement (Partial)
- [x] Add NYRR Runner ID field to user profile (editable by user)
- [ ] Display user's NYRR race history fetched from the results table (matched by NYRR ID)
- [ ] Show race stats: total races, PRs by distance, recent results
- [ ] Allow user to edit profile fields: name, email, phone, NYRR ID, etc.
- [x] Display user's current membership status (pending/runner/admin)
- [ ] Delete dashboard page, and migrate all contents there to profile page.
> **Note:** NYRR ID field added to JoinPage. Race history display still TODO.

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