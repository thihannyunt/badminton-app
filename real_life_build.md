# Court Connect — Real-Life Build Plan
### School Badminton Club Launch · Target: May 2026

---

## Overview

This document outlines everything needed to transform the current HTML/CSS prototype into a **fully working web application** for the school badminton club. It is written assuming you are building it yourself or with a small team.

---

## 1. What Needs to Be Built (That the Prototype Can't Do)

| Area | Current State | What's Needed |
|---|---|---|
| User accounts | None — hardcoded names | Login / Register system |
| Court booking | Static data | Real booking calendar + time-slot management |
| Matchmaking | Fake queue | Real player matching algorithm |
| Lobby | No real-time sync | Live player join/leave updates |
| Score tracking | JavaScript only, resets on refresh | Scores saved to database |
| Match history | Hardcoded | Real records per user |
| Skill tier | Hardcoded "Intermediate" | Auto-calculated from match results |
| Leaderboard | "Coming Soon" | Live rankings from real data |
| Notifications | None | Push / in-app alerts |
| Payments | None | Court fee collection (optional for school) |

---

## 2. Technology Stack Recommendation

### Option A — Simple & Fast (Recommended for School Use)

| Layer | Tool | Why |
|---|---|---|
| Frontend | Your existing HTML/CSS/JS (keep it!) | Already built, just wire up to backend |
| Backend | **Node.js + Express** | Easy JavaScript, lots of tutorials |
| Database | **Supabase** (free tier) | PostgreSQL database + auth + real-time — no server setup needed |
| Hosting | **Vercel** (free) | Deploy in minutes, supports Node.js |
| Real-time | **Supabase Realtime** | Built-in — lobby updates, live score sync |
| Auth | **Supabase Auth** | Email/password login out of the box |
| Notifications | **Web Push API** | Works in mobile browsers without an app |

**Total monthly cost: FREE** for school-club scale (< 500 active users)

---

### Option B — Even Simpler (No Backend Code)

| Layer | Tool | Why |
|---|---|---|
| Frontend | Your existing HTML/CSS/JS | Same |
| Database + Auth | **Firebase** (Google) | Realtime database, auth, hosting all-in-one |
| Hosting | **Firebase Hosting** | Free, fast CDN |

Firebase requires learning their SDK but eliminates the need to write any backend server code.

---

## 3. Feature-by-Feature Build Plan

### 3.1 User Authentication

**What to build:**
- Sign up with student email + password
- Log in / Log out
- Profile: name, student ID, skill level selection on first login

**Supabase implementation:**
```javascript
// Sign up
const { user, error } = await supabase.auth.signUp({
  email: 'student@school.ac.th',
  password: 'password123'
});

// Log in
const { user, error } = await supabase.auth.signInWithPassword({
  email, password
});
```

**Time to build:** 1–2 days

---

### 3.2 Court Management

**What to build:**
- Admin page: add courts (Court 1, 2, 3...), set available time slots
- Display real available slots on `find-match.html` and `create-session.html`
- Mark a slot as "booked" once reserved

**Database table:**
```sql
courts         (id, name, location)
court_slots    (id, court_id, date, start_time, end_time, is_booked, booked_by)
```

**Key logic:**
1. When user selects a date + time, query `court_slots` for available courts
2. On "Join Match Pool" or "Create Lobby" → insert a booking record
3. Show "Booked" label on already-taken slots in the time picker

**Time to build:** 3–4 days

---

### 3.3 Find Match — Real Matchmaking

**What to build:**
- When a user joins the match pool, save their request to database
- System checks if enough players (2 for Singles, 4 for Doubles) are waiting for the same slot + skill level
- When group is complete → create a match record, notify all players

**Database table:**
```sql
match_queue    (id, user_id, match_type, skill_level, date, start_time, end_time, status)
matches        (id, court_id, date, start_time, end_time, match_type, skill_level, status)
match_players  (id, match_id, user_id, team)
```

**Simple matching algorithm:**
```javascript
async function tryMatchPlayers(skill, matchType, date, startTime) {
  const needed = matchType === 'singles' ? 2 : 4;
  const queue = await getWaitingPlayers(skill, matchType, date, startTime);
  
  if (queue.length >= needed) {
    const players = queue.slice(0, needed);
    await createMatch(players);           // assign court, notify players
    await removeFromQueue(players);
  }
}
```

**Time to build:** 3–5 days

---

### 3.4 Lobby System (Real-time)

**What to build:**
- Create lobby → save to database, generate a real 6-digit invite code
- Share invite code → anyone with it can join
- Live player list updates when someone joins (`session-lobby.html`)
- "Generate Teams" → auto-assign teams, create match rotation

**Database table:**
```sql
lobbies        (id, host_id, name, invite_code, date, start_time, end_time, match_type, max_players, status)
lobby_members  (id, lobby_id, user_id, joined_at, status)
```

**Real-time with Supabase:**
```javascript
// Listen for new players joining the lobby
supabase
  .channel('lobby-' + lobbyId)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'lobby_members',
    filter: `lobby_id=eq.${lobbyId}`
  }, (payload) => {
    // Add the new player to the UI without page reload
    addPlayerToList(payload.new);
  })
  .subscribe();
```

**Time to build:** 4–6 days

---

### 3.5 Score Tracking (Persistent)

**What to build:**
- Save score in real-time as points are added (every click)
- Both players/teams can see the same score on their devices
- "End Match" saves the final score to match history

**Database table:**
```sql
match_scores   (id, match_id, team_a_score, team_b_score, game_number, updated_at)
```

**Real-time sync:**
```javascript
// When "+ Point" is tapped:
await supabase.from('match_scores')
  .upsert({ match_id, team_a_score: newScore, updated_at: new Date() });
```

**Time to build:** 2–3 days

---

### 3.6 Match History & Stats

**What to build:**
- After a match ends, record: winner, score, court, duration
- Calculate per-user stats: matches played, wins, win rate
- Show these real numbers on `history.html` and `profile.html`

**Database table:**
```sql
match_results  (id, match_id, winning_team, score_a, score_b, completed_at)
```

**Stats query:**
```sql
SELECT 
  COUNT(*) AS total_matches,
  SUM(CASE WHEN mp.team = mr.winning_team THEN 1 ELSE 0 END) AS wins
FROM match_players mp
JOIN match_results mr ON mp.match_id = mr.match_id
WHERE mp.user_id = $1;
```

**Time to build:** 2–3 days

---

### 3.7 Skill Tier Auto-Calculation

Use the tier logic designed for the app:

```javascript
function getTier(matches, wins) {
  const winRate = matches > 0 ? wins / matches : 0;
  if (matches >= 60 && winRate >= 0.65) return "Competitive";
  if (matches >= 30 && winRate >= 0.50) return "Advanced";
  if (matches >= 10 && winRate >= 0.30) return "Intermediate";
  return "Beginner";
}
```

Recalculate after every completed match. Update user's profile tier automatically.

**Time to build:** 1 day

---

### 3.8 Leaderboard

**What to build:**
- Per-tier ranking sorted by win rate, then total wins
- Filter by: Beginner / Intermediate / Advanced / Competitive

**Query:**
```sql
SELECT u.name, u.avatar, 
       COUNT(*) AS matches, 
       SUM(CASE WHEN mp.team = mr.winning_team THEN 1 ELSE 0 END) AS wins,
       ROUND(wins * 100.0 / COUNT(*), 1) AS win_rate
FROM users u
JOIN match_players mp ON u.id = mp.user_id
JOIN match_results mr ON mp.match_id = mr.match_id
WHERE u.skill_tier = 'Intermediate'
GROUP BY u.id
ORDER BY win_rate DESC, wins DESC
LIMIT 20;
```

**Time to build:** 2 days

---

### 3.9 Notifications

**Types needed:**
1. "Match Found!" — when matchmaking completes
2. "Someone joined your lobby" — lobby host alert
3. "Match starts in 30 minutes" — reminder

**How to implement:**
- Use the **Web Push API** + service worker
- Or simpler: in-app notification badge + alert banner on next page load

**Easiest approach for school project:**
- Show a banner at the top of the screen when there's a pending notification
- Store notifications in a `notifications` table, check on login

**Time to build:** 2–3 days

---

## 4. Admin Panel (Club Manager)

The badminton club needs someone (coach or committee) to manage:

| Feature | Description |
|---|---|
| Court Management | Add/remove courts, set opening hours per day |
| Slot Blocking | Block courts for tournaments, cleaning, holidays |
| Member Management | View all registered players, assign or reset skill tiers manually |
| Match Oversight | View all active and past matches |
| Announcements | Post club announcements (shown on home screen) |

**Build as a separate page:** `/admin.html` — protected by admin role in auth system.

**Time to build:** 3–5 days

---

## 5. Suggested Build Timeline (April – May 2026)

| Week | What to Build |
|---|---|
| **Week 1 (1–7 Apr)** | Set up Supabase project, database schema, user auth (login/register) |
| **Week 2 (8–14 Apr)** | Court management, booking slots, connect to `create-session.html` + `find-match.html` |
| **Week 3 (15–21 Apr)** | Matchmaking queue, lobby create/join with real invite codes |
| **Week 4 (22–28 Apr)** | Real-time lobby updates (Supabase Realtime), score tracking save/sync |
| **Week 5 (29 Apr–5 May)** | Match history, profile stats, skill tier auto-calculation |
| **Week 6 (6–12 May)** | Leaderboard, notifications, admin panel basics |
| **Week 7 (13–19 May)** | Testing with real club members, bug fixes |
| **Week 8 (20–26 May)** | Polish, final testing, club launch 🚀 |

---

## 6. Improvements to the Current Prototype for Real Use

### UX Improvements

| Current Limitation | Real-Life Fix |
|---|---|
| Hardcoded player names (Alex, Ken, Sara, Mike) | Replace with logged-in user's real name + photo |
| "CC7482" is a fixed invite code | Generate a random code per lobby from the database |
| Progress bar is always at 50% / 100% | Read real player count from database |
| Score resets on refresh | Save score to database every 5 seconds |
| "Searching" animation in waiting pool is cosmetic | Trigger only when actually in the match queue |
| Bookings always show "2 upcoming" | Count real upcoming bookings from database |
| Leaderboard shows "Coming Soon" | Show real rankings once 10+ matches are recorded |

### UI Improvements

| Current Design | Suggested Improvement |
|---|---|
| No avatar photos | Allow users to upload a profile photo (store in Supabase Storage) |
| No announcements section | Add a club notice banner on the home screen |
| No error states | Add validation messages on forms (e.g., "Minimum 1 hour session") |
| No empty states | Add "No matches yet — find your first match!" on history page |
| No onboarding | Add a 3-screen welcome flow for new members (name, skill level, first booking) |
| Fixed court names | Make courts dynamic from admin panel |

### Accessibility Improvements

| Issue | Fix |
|---|---|
| Low contrast on some muted text | Ensure all text meets WCAG AA (4.5:1 contrast ratio) |
| No keyboard navigation | Add `tabindex` and focus styles for non-touch users |
| No screen reader labels on icon-only buttons | Add `aria-label` to all navigation icons and action buttons |
| Touch targets some < 44px | Audit all tappable elements — minimum 44 × 44px (Apple HIG) |

---

## 7. Essential Things Before Launch

Before the school badminton club goes live:

- [ ] **Privacy policy** — explain what data you collect (names, emails, match records)
- [ ] **Terms of use** — rules for using the booking system
- [ ] **Club admin account** — create an admin user with special permissions
- [ ] **Seed initial courts** — add Court 1, 2, 3... with real opening hours
- [ ] **Test with 5–10 real students** before full club rollout
- [ ] **Set up a support channel** — a LINE group or email for bug reports
- [ ] **Backup strategy** — Supabase takes daily backups automatically on free tier
- [ ] **Mobile bookmark prompt** — guide members to "Add to Home Screen" so it feels like a native app

---

## 8. Cost Summary (School Club Scale)

| Service | Free Tier Limit | Monthly Cost |
|---|---|---|
| Supabase (database + auth + realtime) | 500 MB storage, 2 GB bandwidth, 50,000 active users | **Free** |
| Vercel (hosting) | 100 GB bandwidth, unlimited deployments | **Free** |
| Supabase Storage (photos) | 1 GB included | **Free** |
| Custom domain (optional) | e.g., `badminton.school.ac.th` | ~$10/year |

**Total: ~$0/month** for a school club of 50–200 members.

---

## 9. Quick Reference — Pages to Connect to Backend

| HTML Page | Backend Connection Needed |
|---|---|
| `index.html` | Show logged-in user name + upcoming match count |
| `find-match.html` | Load available dates, submit queue request |
| `waiting-pool.html` | Poll or subscribe for queue status |
| `create-session.html` | Create lobby record + generate invite code |
| `invite-friends.html` | Load real invite code from database |
| `session-lobby.html` | Real-time player list subscription |
| `match-rotation.html` | Generate rotation from real player list |
| `score-tracking.html` | Save scores to database on every point |
| `match-confirmed.html` | Load real match + court details |
| `player-feedback.html` | Save star ratings to database |
| `bookings.html` | Load real upcoming bookings for this user |
| `history.html` | Load past match records |
| `session-summary.html` | Load specific match result |
| `profile.html` | Load real stats (matches, wins, rating, tier) |
| `leaderboard.html` | Query top players per tier |
| `my-lobbies.html` | Load lobbies created by current user |
| `join-lobby.html` | Validate invite code against database |
| `lobby-hub.html` | Static — no backend needed |
