# FitnessAI — Complete Project Owner's Guide

> Written so a new team member with limited technical background can understand every piece, every decision, and every flow.

---

## Table of Contents

1. What Is This App?
2. The Tech Stack — Tools and Why We Use Them
3. Big Picture Architecture
4. The Database — What Data We Store
5. The Backend — AI Functions in the Cloud
6. User Journey Flowcharts
7. Every Screen Explained
8. The Navigation System
9. How Data Moves Around the App
10. Design System — The Visual Language
11. Security Model
12. Known Quirks and Important Notes
13. File Map and Quick Reference

---

## 1. What Is This App?

**FitnessAI** is a mobile workout tracking app. It lets a user:

1. Create an account and fill in physical stats (age, weight, height, gender)
2. Configure a workout — which muscles to target, how long, how hard
3. Have an AI generate a full personalized workout plan
4. Log what they actually lifted (sets, reps, weight) during the workout
5. Review past workouts, filter by muscle group, and delete entries
6. See charts tracking strength and volume progress over time
7. Track a daily workout streak
8. Chat with an AI fitness coach that knows their stats
9. Save favorite exercises for quick reference later

---

## 2. The Tech Stack

The tech stack is the collection of tools used to build the app. Here is each one, what it does, and why it was chosen over alternatives.

---

### React Native + Expo

**What it is:** React Native lets you write one JavaScript codebase that runs on both iPhone (iOS) and Android. Expo is a layer on top that simplifies development — you can open the app on your real phone by scanning a QR code.

**Why it was chosen:** Writing one app instead of two (iOS uses Swift, Android uses Kotlin normally). Expo removes a large amount of setup work.

**Alternative considered:** Flutter (by Google) uses the Dart language. React Native was chosen because the team already knew JavaScript.

**Key files:** `package.json` lists all libraries, `app.json` configures the app name, icon, and splash screen.

---

### Expo Router

**What it is:** A file-based navigation system. Each file inside the `app/` folder automatically becomes a screen. The folder structure defines what the screen's address (URL/path) is.

**Why it was chosen:** Before Expo Router, you had to manually wire up every screen with React Navigation — more boilerplate, harder to maintain. Expo Router handles back buttons, deep links, and screen grouping automatically.

**How folders map to screens:**
```
app/(auth)/index.jsx       → /(auth)          Login screen
app/personal-details.jsx   → /personal-details Profile setup
app/(tabs)/home.jsx        → /(tabs)/home      Home screen
app/(tabs)/history.jsx     → /(tabs)/history   History screen
app/workout-display.jsx    → /workout-display  Active workout
```

Folders with parentheses like `(auth)` and `(tabs)` are "groups" — they organize files but do not appear in the URL.

---

### Supabase

**What it is:** Supabase is a Backend-as-a-Service (BaaS). Think of it as: database + user accounts + server-side code runner, all hosted in the cloud, accessible via the internet.

**Why it was chosen:**
- Handles user registration, login, sessions, and password management — none of that had to be built from scratch
- Stores all app data in a real SQL database (PostgreSQL)
- Runs server-side AI functions ("Edge Functions") that call OpenAI
- Free tier is sufficient for a course project

**Alternative considered:** Firebase by Google. Supabase was chosen because it uses a proper SQL database (more flexible for complex queries) and is open source.

**Key file:** `lib/supabase.js` — the single file that sets up the connection:

```js
export const supabase = createClient(
  "https://smelhjszcbccvpfvaliq.supabase.co",  // the project URL
  "eyJhbGci...",                                 // public key (safe to expose)
  { auth: { storage: AsyncStorage } }            // saves login on device
)
```

The project reference ID is **`smelhjszcbccvpfvaliq`** — needed when deploying backend functions.

---

### AsyncStorage

**What it is:** A small local storage system built into React Native — like a tiny database that lives on the phone itself.

**Why it is used:** When a user logs in, Supabase gives the app a session token (a temporary key). AsyncStorage saves that token so the user stays logged in when they close and reopen the app.

**Without it:** Users would be logged out every time they closed the app.

---

### OpenAI GPT-4o

**What it is:** The AI model that generates workouts and powers the chat coach. GPT-4o is OpenAI's most capable model.

**Why GPT-4o:** It reliably returns structured JSON (critical for workout generation) and gives nuanced fitness advice (critical for chat). Cheaper models like GPT-3.5 were considered but produced less consistent JSON structure.

**How it is accessed:** The phone NEVER calls OpenAI directly. The phone calls our Supabase Edge Functions, which call OpenAI on the server side. This keeps the OpenAI API key hidden — if someone inspected the app they would never find it.

---

### react-native-chart-kit

**What it is:** A chart library for React Native. The app uses its `LineChart` component.

**Why it was chosen:** It renders crisp charts using SVG (vector graphics) and supports smooth bezier curves. It had the simplest API for the line charts needed in Analytics.

---

### react-native-safe-area-context

**What it is:** A library that reports how much screen space is blocked by "unsafe" areas — iPhone notch, home indicator bar at the bottom, status bar at the top.

**Why it is used:** Without it, content would render behind the notch or under the home bar. `SafeAreaView` adds automatic padding. `useSafeAreaInsets` gives exact measurements for custom padding (used in the chat screen's input bar).

---

## 3. Big Picture Architecture

This diagram shows every system involved and how they communicate:

```
╔══════════════════════════════════════════════╗
║              USER'S PHONE                    ║
║                                              ║
║   React Native App (Expo)                   ║
║                                              ║
║   Screens talk to Supabase via HTTPS         ║
║   using the client in lib/supabase.js        ║
╚═══════════════════════╤══════════════════════╝
                        │ HTTPS requests
                        ▼
╔══════════════════════════════════════════════╗
║          SUPABASE CLOUD                      ║
║                                              ║
║  ┌──────────────┐  ┌──────────┐  ┌────────┐ ║
║  │  Auth        │  │Database  │  │ Edge   │ ║
║  │  Service     │  │(Postgres)│  │ Funcs  │ ║
║  │              │  │          │  │        │ ║
║  │ - Users      │  │sessions  │  │generate║ ║
║  │ - Sessions   │  │logs      │  │-workout║ ║
║  │ - Metadata   │  │favorites │  │        │ ║
║  │   (age,wt,   │  │profiles  │  │fitness ║ ║
║  │   height,    │  │plans     │  │-chat   │ ║
║  │   gender)    │  └──────────┘  └───┬────┘ ║
║  └──────────────┘                    │       ║
╚═════════════════════════════════════╤╝       ║
                                      │ HTTPS  
                                      ▼        
                        ╔═════════════════════╗
                        ║    OPENAI API        ║
                        ║  GPT-4o model        ║
                        ║  Workout generation  ║
                        ║  AI chat responses   ║
                        ╚═════════════════════╝
```

**The critical rule:** The phone never talks directly to OpenAI. Everything goes through Supabase first. This keeps API keys secure and lets us control access.

---

## 4. The Database

All data is stored in Supabase's PostgreSQL database. Here are all the tables:

---

### `auth.users` — Managed Automatically by Supabase

Supabase creates and manages this table. The app never touches it directly except through Auth API calls.

| Column | What it holds |
|--------|--------------|
| `id` | Unique user ID (UUID like `e417c78f-36c0-...`) |
| `email` | Login email address |
| `user_metadata` | JSON blob — stores name, age, weight, height, gender, onboarding_complete |

**Why store profile info in metadata instead of a separate table?**
It is simpler. Supabase lets you attach any JSON data to a user via `supabase.auth.updateUser({ data: {...} })`. No extra tables, no joins. The Profile tab, AI Chat screen, and fitness-chat function all read from here.

> **IMPORTANT GOTCHA:** There is also a `user_profiles` table (see below), but it is a different store. The `generate-workout` function reads from `user_profiles`, while chat and the Profile tab read from `user_metadata`. If workouts seem generic/unpersonalized, the `user_profiles` row is likely missing or empty for that user.

---

### `user_profiles` — Used by the Workout Generator

| Column | What it holds |
|--------|--------------|
| `user_id` | Links to auth.users |
| `age` | Age in years |
| `gender` | e.g. "Female" |
| `weight_kg` | Body weight |
| `height_cm` | Height |

Written during onboarding using an "upsert with conflict resolution" so re-saving does not create duplicate rows.

---

### `workout_sessions` — One Row Per Completed Workout

Think of this as a folder. Each workout has one session row, and that session contains multiple exercise rows.

| Column | What it holds |
|--------|--------------|
| `id` | Unique ID for this workout |
| `user_id` | Who completed it |
| `completed_at` | Timestamp — auto-set by the database |

---

### `exercise_logs` — One Row Per Exercise in a Workout

A workout with 5 exercises creates 5 rows here, all pointing to the same `session_id`.

| Column | What it holds |
|--------|--------------|
| `id` | Unique ID |
| `session_id` | Which workout session this belongs to |
| `user_id` | Who did it |
| `exercise_name` | e.g. "Bench Press" |
| `muscle_group` | e.g. "chest" |
| `sets_data` | JSON array of all sets logged. Example: `[{set:1, reps:8, weight_kg:60}]` |
| `logged_at` | Timestamp |

**Why JSON for sets?** Instead of a separate `sets` table, all sets for an exercise are stored as a JSON array in one column. This is simpler — we always read all sets at once anyway, so a separate table would add complexity with no benefit.

---

### `user_favorites` — Saved Exercises

| Column | What it holds |
|--------|--------------|
| `id` | Unique ID |
| `user_id` | Who saved it |
| `exercise_name` | e.g. "Deadlift" |
| `muscle_group` | e.g. "back" |
| `instructions` | How to perform the exercise |
| `sets`, `reps`, `rest_seconds`, `difficulty` | Recommended parameters |
| `created_at` | When it was favorited |

---

### `workout_plans` — Archive of Every AI-Generated Plan

| Column | What it holds |
|--------|--------------|
| `id` | Unique ID |
| `user_id` | Who it was generated for |
| `plan_data` | Full JSON of the AI's response |
| `config_used` | The settings the user picked (muscles, duration, etc.) |
| `created_at` | When it was generated |

This table is written automatically by the `generate-workout` function — the app never writes to it directly. It serves as a history of everything the AI has ever created.

---

## 5. The Backend AI Functions

Two serverless functions run on Supabase. "Serverless" means there is no always-on server — the code only runs when the phone calls it.

Both are written in TypeScript (Deno runtime) and live in `supabase/functions/`.

---

### Function 1: `generate-workout`

**File:** `supabase/functions/generate-workout/index.ts`

**Purpose:** Receives the user's workout preferences + physical stats, builds an AI prompt, calls GPT-4o, and returns a structured JSON workout plan.

**Step-by-step:**

```
Phone sends:
  workoutConfig: { muscleGroups, numExercises, durationMinutes, difficulty }
  ─── OR ───
  swapExercise:  { name, muscleGroup, excludeNames }

        │
        ▼
Verify the JWT token in the Authorization header
  → Return 401 Unauthorized if missing or invalid

        │
        ▼
Read user profile from user_profiles table
  (age, gender, weight_kg, height_cm — personalizes the workout)

        │
        ▼
Build prompts for GPT-4o:

  System message:
    "You are a certified personal trainer.
     Respond with ONLY valid JSON matching this schema:
     { planTitle, totalDuration, exercises: [{id, name, muscleGroup,
       sets, reps, restSeconds, instructions, difficulty, equipment}] }"

  User message:
    "Create a workout for: Age 25, Female, 65kg, 168cm.
     Targets: chest, back. Exercises: 5. Duration: 45 min. Difficulty: intermediate"

        │
        ▼
Call GPT-4o with response_format: json_object
  (guarantees the response is parseable JSON — no accidental text mixed in)

        │
        ▼
Save plan to workout_plans table (for full plans only, not swaps)

        │
        ▼
Return JSON to phone
```

**The Swap feature:** When you tap "Swap" on an exercise, the same function is called with `swapExercise` instead of `workoutConfig`. It tells GPT-4o: "Replace exercise X — do not suggest any of [list of current exercises]." The response is always wrapped as `{ exercises: [newExercise] }`.

---

### Function 2: `fitness-chat`

**File:** `supabase/functions/fitness-chat/index.ts`

**Purpose:** Powers the AI Coach. Receives the entire conversation history, prepends a system prompt with the user's physical stats, calls GPT-4o, and returns the AI's reply.

**Step-by-step:**

```
Phone sends:
  messages: [
    { role: "user",      content: "How do I improve my squat?" },
    { role: "assistant", content: "Great question! First..." },
    { role: "user",      content: "What about knee pain?" }  ← latest
  ]

        │
        ▼
Verify JWT token

        │
        ▼
Read user profile from user_metadata (NOT user_profiles table)
  const m = user.user_metadata || {}
  profile = { age: m.age, gender: m.gender, weight_kg: m.weight, height_cm: m.height }

        │
        ▼
Build system prompt:
  "You are a personal trainer inside a workout app.
   User stats: 25 years old, Female, 65kg, 168cm tall.
   Keep answers to 2–4 paragraphs. No markdown. Fitness topics only."

        │
        ▼
Call GPT-4o with:
  [ systemPrompt, ...entire conversation history ]
  max_tokens: 500  (≈ 375 words — keeps replies concise)

        │
        ▼
Return { reply: "For knee pain, try widening your stance..." } to phone
```

**Why send the full history every time?** GPT-4o has no memory between API calls. To have a real back-and-forth conversation, every previous message must be sent as context. This is how every chatbot works.

---

### Deploying the Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Log in to Supabase
npx supabase login

# Link to this project (one-time)
npx supabase link --project-ref smelhjszcbccvpfvaliq

# Deploy both functions
npx supabase functions deploy generate-workout
npx supabase functions deploy fitness-chat
```

**Environment variables needed** (set in Supabase Dashboard → Project → Settings → Edge Functions):
- `OPENAI_API_KEY` — the OpenAI billing key
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` — auto-provided by Supabase

---

## 6. User Journey Flowcharts

### First-Time User (Sign Up)

```
Open App
    │
    ▼
_layout.jsx checks: is there a saved session?
    │
    └─ No session found
    ▼
Login/Signup Screen  (app/(auth)/index.jsx)
    │
    └─ User fills: email, password, confirm password
    ▼
Supabase creates account
Sets onboarding_complete = false in user_metadata
    │
    ▼
Personal Details Screen  (app/personal-details.jsx)
    │
    └─ User fills: name, age, weight, height, gender
    ▼
supabase.auth.updateUser() saves data to user_metadata
Sets onboarding_complete = true
    │
    ▼
Home Screen  /(tabs)/home
```

---

### Returning User (Log In)

```
Open App
    │
    ▼
_layout.jsx finds saved token in AsyncStorage
Verifies session is still valid with Supabase
    │
    └─ Session valid + onboarding_complete = true
    ▼
Home Screen  /(tabs)/home
(User never sees login screen)
```

---

### Generate and Log a Workout

```
Home Screen
    │
    └─ Tap "Start a Workout"
    ▼
Workout Config  (workout-config.jsx)
    │
    └─ Pick: muscle groups (up to 3), # exercises,
             duration, difficulty
    ▼
Tap "Generate Workout"
    │
    └─ supabase.functions.invoke('generate-workout', ...)
       Loading spinner shown
    ▼
AI returns JSON plan
setWorkoutPlan(data) saves to in-memory store
router.push('/workout-display')
    │
    ▼
Workout Display  (workout-display.jsx)
    │
    ┌─ Shows each exercise card:
    │    Name + muscle group
    │    Sets / Reps / Rest / Difficulty stats
    │    Exercise instructions text
    │    [Swap] → calls generate-workout with swapExercise
    │    [★ Fav] → inserts to user_favorites table
    │    [✕] → removes from local list only
    │    [▼ Log sets] → expands the logging section
    │
    └─ User logs: weight + reps per set
       Each set toggles between "kg" (enter number) or "Bodyweight"
    ▼
Tap "Complete Workout"
    │
    ├─ Creates row in workout_sessions
    ├─ Creates rows in exercise_logs (one per exercise)
    └─ router.replace('/session-summary')
    ▼
Session Summary  (session-summary.jsx)
    ├─ "View History" → /(tabs)/history
    └─ "Back to Home" → /(tabs)/home
```

---

### Browse and Manage History

```
History Tab  (history.jsx)
    │
    └─ Navigating to this tab triggers data fetch (useFocusEffect)
    ▼
Fetch workout_sessions + nested exercise_logs
Extract unique muscle groups → build filter pills
    │
    Shows:
      Filter pill bar: [All] [Chest] [Back] [Legs] ...
      Session cards: date · exercise count · muscle groups
    │
    ├─ Tap session card → expands to show exercises
    │
    ├─ Tap [Delete] on a session →
    │    Alert dialog asks to confirm
    │    Delete exercise_logs WHERE session_id = X
    │    Delete workout_sessions WHERE id = X
    │    Remove from UI list
    │
    └─ Tap [✕] on an exercise →
         Alert dialog asks to confirm
         Delete exercise_log WHERE id = X
         Remove from UI
         (Session card disappears if it now has 0 exercises)
```

---

### Analytics

```
Analytics Tab  (analytics.jsx)
    │
    └─ On focus: fetch data in parallel
    ▼
  Promise.all([
    exercise_logs with session dates,
    workout_sessions with dates + count
  ])
    │
    ▼
Process data:
  processExerciseProgress()  → max weight per exercise per date
  processMuscleGroupVolume() → total volume (kg × reps) per muscle per date
  computeInsights()          → auto-generated bullet facts
  computeStreaks()            → current + longest streak, 14-day activity
    │
    ▼
Render:
  1. Streak Card (🔥 current / 🏆 best / 14-day dot grid)
  2. Quick Insights (auto text: "Strongest lift: X at Y kg")
  3. Weight Progress Chart (line chart, pick exercise from dropdown)
  4. Volume by Muscle Group (line chart, pick muscle from pills)
```

---

### AI Chat

```
Chat Tab  (chat.jsx)
    │
    └─ On mount: load user profile from user_metadata
    ▼
Shows:
  Context bar → tap to see what AI knows (age/gender/weight/height chips)
  Message list → FlatList of chat bubbles
  Suggestion chips → 4 preset questions (only on first open)
  Input bar → text field + send button
    │
    └─ User types + sends
    ▼
1. Add user message to local state
2. Send full conversation history to fitness-chat Edge Function
3. Show typing indicator (spinner bubble)
4. Receive AI reply
5. Add to message list
6. Auto-scroll to bottom
```

---

## 7. Every Screen Explained

### `app/index.jsx`
The entry point. Immediately redirects — contains no UI. The actual routing brain is `_layout.jsx`.

---

### `app/_layout.jsx` — The Routing Brain

The most important file. It wraps the entire app and decides where to send the user based on auth state.

**Decision logic:**
```
No session?
  → Redirect to /(auth)  [login/signup]

Session exists but onboarding_complete is false?
  → Redirect to /personal-details

Session exists, onboarding done, but currently on auth screen?
  → Redirect to /(tabs)/home

Otherwise: stay on current screen
```

This runs every time auth state changes — so logging out from any screen immediately redirects to login.

---

### `app/(auth)/index.jsx` — Login and Sign Up

One screen that handles both modes with a tab toggle (Login / Sign Up).

**Sign up flow:**
1. Validates: email required, passwords match, minimum 6 characters
2. Calls `supabase.auth.signUp()` — creates account with `onboarding_complete: false`
3. Routes directly to `/personal-details`

**Login flow:**
1. Calls `supabase.auth.signInWithPassword()`
2. On success, `_layout.jsx` detects the new session and routes to home automatically

**"Force Sign Out" button:** A development tool that calls `signOut()`. Useful for testing the onboarding flow during development without going into the phone's settings.

---

### `app/personal-details.jsx` — First-Time Profile Setup

Shown only once after signup. Collects: name, age, weight (kg), height (cm), gender.

**Where data is saved:** `supabase.auth.updateUser({ data: { name, age, weight, height, gender, onboarding_complete: true } })` — writes directly to the user's `user_metadata` in Supabase Auth.

After saving → routes to `/(tabs)/home`.

---

### `app/(tabs)/home.jsx` — Home Screen

The landing page after login. Intentionally minimal:
- "AI-POWERED" badge
- Bootzie mascot image
- "Start a Workout" → workout-config
- "Log Out" → calls `supabase.auth.signOut()`

The hamburger menu provides access to all other features from this screen.

---

### `app/(tabs)/workout-config.jsx` — Workout Builder

Users configure their workout here before AI generation.

**The four settings:**

| Setting | Choices | UI Component |
|---------|---------|-------------|
| Muscle Groups | Chest, Back, Legs, Shoulders, Arms, Core, Full Body (pick up to 3) | Custom multi-select dropdown |
| Number of Exercises | 3, 4, 5, 6, 7, 8 | Chip row (tap to select one) |
| Duration | 15, 30, 45, 60 min | Chip row |
| Difficulty | Beginner, Intermediate, Advanced | Chip row |

**`ChipRow` component:** Reusable button group — used for exercises, duration, and difficulty. Supports single-select mode.

**`MuscleDropdown` component:** Custom dropdown with check marks. Shows "MAXIMUM 3 SELECTED" when the limit is reached. The 3-group max keeps AI prompts focused and produces better workout plans.

**On generate:**
1. Validates that muscle group and difficulty are selected
2. Shows loading spinner
3. Calls `supabase.functions.invoke('generate-workout', ...)`
4. Saves plan to `workoutStore.js`
5. Navigates to `/workout-display`

---

### `lib/workoutStore.js` — Plan Handoff Between Screens

```js
let plan = null
export const setWorkoutPlan = (p) => { plan = p }
export const getWorkoutPlan = () => plan
```

A module-level variable. `workout-config` writes the plan after generation. `workout-display` reads it on load.

**Why not URL params?** The plan object is large — multiple exercises with long instruction strings. URL params have character limits. A module store is simple and instant.

**Tradeoff:** If the app is force-closed mid-workout, the plan is lost. Acceptable — the user generates a new one.

---

### `app/workout-display.jsx` — The Workout Interface

The most feature-rich screen. Manages the entire active workout.

**State tracked:**
- `exercises` — current exercise list (can be modified by swap/remove)
- `expandedIds` — which cards are open showing the set logger
- `logs` — `{ exerciseId: [{set, reps, weight_kg, weight_type}] }`
- `swappingId`, `favoritingId`, `saving` — loading states for async operations

**Per-set weight:**
Each set toggles between "kg" (user types a number) and "Bodyweight" (no input). Bodyweight sets use the user's actual body weight from `user_profiles.weight_kg` when saving.

**On "Complete Workout":**
1. Gets current user from Auth
2. If any bodyweight sets exist — fetches weight from `user_profiles`
3. Inserts row to `workout_sessions`
4. Inserts rows to `exercise_logs` (one per exercise, empty sets filtered out)
5. Routes to `/session-summary`

---

### `app/session-summary.jsx` — Workout Complete

Celebration screen after saving. Shows "Great Work!" and two navigation options:
- "View History" → history tab
- "Back to Home" → home tab

---

### `app/(tabs)/history.jsx` — Workout History

**Data structure fetched:**
```
workout_sessions (id, completed_at)
  └── exercise_logs (id, exercise_name, muscle_group, sets_data)
```

**`useFocusEffect`:** Data refetches every time this tab is navigated to — not just the first load. A just-completed workout appears immediately.

**Filter system:**
1. Muscle group list built once at fetch time, stored in state
2. `normalize()` function fixes casing: `"legs"` and `"Legs"` both become `"Legs"`
3. Filtering maps over sessions and keeps only exercises matching the selected muscle group

**Delete session:** Must delete `exercise_logs` rows first (children), then `workout_sessions` row (parent). Order matters — foreign key constraints would block deleting the parent first.

**Optimistic updates:** The UI removes the item immediately — before the server confirms deletion. If deletion fails, an error alert appears.

---

### `app/(tabs)/analytics.jsx` — Progress Charts

Four cards stacked vertically:

**1. Streak Card**
- `computeStreaks()` scans all workout dates
- Grace-day rule: if you worked out yesterday but not today, streak still counts (gives time to log later in the day)
- 14-day dot grid: pink dot = workout that day, faded dot = rest day

**2. Quick Insights**
Auto-generated sentences:
- "Strongest lift: Deadlift at 100 kg"
- "Most improved: Bench Press (+25%)"
- "Total workouts logged: 12"

**3. Weight Progress Chart**
- Dropdown picks any exercise logged in 2+ sessions
- Line chart: sessions on X-axis, max weight that session on Y-axis
- Shows "New PR" badge if the latest session was a personal record

**4. Volume by Muscle Group**
- Volume = total kg × reps across all sets for that muscle group in a session
- Example: 3 sets × 10 reps × 60 kg = 1,800 volume units
- Pill selector switches between muscle groups
- Shows whether volume is trending up or down

**Why both charts?** Max weight answers "am I getting stronger at this exercise?" Volume answers "am I doing more total work on this muscle group?" Different questions.

---

### `app/(tabs)/chat.jsx` — AI Coach Chat

**Context bar:** Collapsible section at the top showing the user's stats (age, gender, weight, height). Intentional transparency — users see exactly what data is sent to the AI.

**Suggestion chips:** 4 preset questions shown only on first open when there is just 1 message. Lowers friction for new users.

**Keyboard fix:** The trickiest technical detail of this screen. The chat input must stay above the keyboard when it opens.
- `KeyboardAvoidingView` is the outermost element (nothing can wrap it)
- `behavior: 'padding'` on iOS shifts content up by keyboard height
- `keyboardVerticalOffset: 90` accounts for the Expo tab bar
- `paddingBottom: Math.max(bottom, 12)` accounts for the iPhone home indicator

**Full history sent each request:** GPT-4o has no memory. Sending all previous messages every time is how the AI "remembers" the conversation.

---

### `app/(tabs)/favorites.jsx` — Saved Exercises

Exercises saved via the "★ Fav" button on the workout screen.

**Pull-to-refresh:** Standard mobile gesture (pull down on the list) triggers a refetch. There is also a "↻ Reload" button in the header.

**Remove:** Immediately deletes from `user_favorites` and updates local state. No confirmation dialog — this is lower-stakes than deleting workout history.

---

### `app/(tabs)/profile.jsx` — Edit Profile

View and update name, age, weight, height, gender.

**Reads from:** `supabase.auth.getUser()` → `user.user_metadata`
**Writes to:** `supabase.auth.updateUser({ data: {...} })`

This is the source of truth for profile data. The AI chat and fitness-chat function both read from this same place.

---

## 8. The Navigation System

### Two Navigation Systems

The app has two ways to navigate:

**1. Tab Bar** (bottom of screen)
Always visible on main app screens. Tabs: Home, Workout, History, Analytics, AI Coach, Favorites, Profile.
Defined in `app/(tabs)/_layout.jsx`.

**2. Hamburger Menu** (slide-out drawer from left)
Available from any screen that includes `<HamburgerMenu />`. Contains links to all the same destinations.
Defined in `components/HamburgerMenu.jsx`.

**Why two?** The tab bar is the primary nav. The hamburger drawer is a "power user" escape hatch and creates a richer navigation experience on screens where the tab bar is not visible.

### How the Hamburger Menu Works

```
User taps the boxing glove icon (top-left of header)
    │
    ▼
setOpen(true)
Animated.timing slides drawer in from x = -270 to x = 0
Modal overlay appears (dark backdrop)
    │
    ▼
User taps a nav item
    │
    ▼
closeDrawer() — slides back to x = -270
After animation completes → router.navigate(route)
    │
    ▼
Backdrop tap also triggers closeDrawer()
```

**Active state:** `usePathname()` gives the current screen path. The nav item whose `segment` appears in that path gets highlighted pink.

**Monkey icon:** Top-right of every screen header. Routes to `/(tabs)/profile`.

---

## 9. How Data Moves Around the App

### No External State Library

This app does NOT use Redux, MobX, Zustand, or any third-party state manager. It uses React's built-in tools:

**`useState`** — Each screen owns its own data. Example: `history.jsx` has `sessions`, `loading`, `selectedGroup`, `muscleGroups` all as local state.

**Module-level variable (`workoutStore.js`)** — Shares the workout plan between `workout-config` and `workout-display`.

**Supabase as the database** — All persistent data lives in Supabase. Screens fetch fresh data on load or focus. There is no local cache.

**`useFocusEffect`** — Runs a fetch every time a screen comes into focus. Used in History and Analytics so data is always fresh after completing a workout.

### Optimistic UI Updates

When deleting in History, the UI item disappears immediately — before the server confirms deletion. This makes the app feel snappy. If deletion fails, an error alert shows.

---

## 10. Design System

### Colors

| Name | Value | Used For |
|------|-------|---------|
| Background | `#080005` | All screen backgrounds |
| Card Background | `rgba(58,5,25,0.55)` | Cards, panels |
| Primary Pink | `#EF88AD` | Buttons, active states, chart lines |
| Muted Pink | `rgba(165,56,96,0.85)` | Secondary text, borders |
| White | `#FFFFFF` | Headings, primary text |

**Why this palette?** The dark maroon-black background with pink accent is distinctive — most fitness apps use blue or green (Nike, Strava, Apple Fitness). This creates a premium, moody aesthetic.

### The Card Sheen

Every card in the app has a 1-pixel pink line at the very top:
```js
position: 'absolute', top: 0, left: 16, right: 16, height: 1,
backgroundColor: 'rgba(239,136,173,0.28)'
```
It simulates light reflecting off glass — a subtle depth effect that makes cards feel elevated.

### The Badge

```
[ AI-POWERED ]   or   [ YOUR PROGRESS ]
```
Small pill with uppercase text and wide letter-spacing (3px). Used at the top of major screens as a consistent brand signature.

### Button Glow

Primary action buttons use an omnidirectional pink glow:
```js
shadowColor: '#EF88AD',
shadowOffset: { width: 0, height: 0 },   ← centered, not directional
shadowOpacity: 0.3,
shadowRadius: 16,
elevation: 6,                              ← Android
```

### Why Opacity (Not Font Weight) for Active Pills

In History filter pills, active vs. inactive state uses `opacity: 1` vs `opacity: 0.5`. Using `fontWeight: '700'` vs `'600'` would cause the text to change width, which shifts the pill's layout dimensions. Opacity is a visual-only change with no layout impact.

---

## 11. Security Model

### Authentication

1. User logs in → Supabase issues a JWT (JSON Web Token) — a signed string that proves identity
2. JWT saved to AsyncStorage on the device
3. Every Supabase API call automatically includes this JWT
4. Supabase's Row Level Security (RLS) reads the JWT and only returns rows belonging to that user

### Row Level Security (RLS)

Database policies at the PostgreSQL level enforce that:
- Users can only read/write their OWN rows
- Even a crafted malicious API request cannot access another user's data

### OpenAI API Key Safety

The OpenAI API key lives ONLY in Supabase's server environment variables. It never leaves the server. If someone reverse-engineered the app binary, they would never find it.

The Supabase "anon key" in `lib/supabase.js` IS visible in the app but is safe to expose — RLS policies limit exactly what it can access.

### Edge Function Auth Check

Both `generate-workout` and `fitness-chat` extract and verify the `Authorization` JWT header before doing anything. No valid JWT → 401 Unauthorized response. This blocks anyone from hitting the endpoints directly and burning OpenAI quota.

---

## 12. Known Quirks and Important Notes

### Two Places for Profile Data

| Store | How it is written | Who reads it |
|-------|------------------|-------------|
| `user_metadata` (Auth) | `supabase.auth.updateUser({ data: {...} })` | Profile tab, Chat screen, fitness-chat function |
| `user_profiles` (database table) | Profile setup upsert | generate-workout function |

If a user's AI-generated workouts are generic and not personalized, check that their `user_profiles` row exists and has data. This is the most common "why isn't AI working right" issue.

### `active-workout.jsx` — May Be Legacy

There is a file `app/active-workout.jsx` that appears to be an older version of the workout logging screen. Current navigation points to `workout-display.jsx`. Do not delete without searching for references:
```bash
grep -r "active-workout" app/
```

### `(onboarding)/profile-setup.jsx` — May Be Legacy

Similarly, `app/(onboarding)/profile-setup.jsx` may be unused. The current onboarding flow uses `app/personal-details.jsx`.

### `workoutStore` Resets on App Restart

The in-memory plan in `workoutStore.js` is lost if the app is force-closed. The user must generate a new plan. This is acceptable for current usage.

### The Swap Response Wrapping

`generate-workout` always returns `{ exercises: [...] }` even for single-exercise swaps. The phone extracts the exercise with:
```js
const swapped = data.exercises?.[0] ?? data
```

---

## 13. File Map and Quick Reference

```
3390Group3FinalProject/
│
├── app/                              ALL SCREENS
│   ├── _layout.jsx                   AUTH GATE — routing brain for entire app
│   ├── index.jsx                     Entry redirect only
│   ├── personal-details.jsx          First-time profile setup after signup
│   ├── workout-display.jsx           Active workout + set logging + swap + fav
│   ├── active-workout.jsx            Possibly legacy — may be unused
│   ├── session-summary.jsx           "Great Work!" after completing workout
│   │
│   ├── (auth)/
│   │   ├── _layout.jsx               Auth group layout
│   │   └── index.jsx                 Combined login + signup screen
│   │
│   ├── (onboarding)/
│   │   └── profile-setup.jsx         Possibly legacy — may be unused
│   │
│   └── (tabs)/                       MAIN APP SCREENS (have tab bar)
│       ├── _layout.jsx               Defines which tabs appear
│       ├── home.jsx                  Landing screen
│       ├── workout-config.jsx        Configure + generate workout
│       ├── history.jsx               Browse, filter, delete workout history
│       ├── analytics.jsx             Streak + line charts + auto insights
│       ├── chat.jsx                  AI fitness coach chatbot
│       ├── favorites.jsx             Saved exercises
│       └── profile.jsx               Edit personal details
│
├── components/
│   └── HamburgerMenu.jsx             Slide-out drawer navigation component
│
├── lib/
│   ├── supabase.js                   Supabase client — one shared connection
│   └── workoutStore.js               In-memory plan handoff between screens
│
├── supabase/
│   └── functions/
│       ├── generate-workout/
│       │   └── index.ts              AI workout generation + swap function
│       └── fitness-chat/
│           └── index.ts              AI chatbot Edge Function
│
├── assets/
│   ├── homeicon.png                  Bootzie mascot (home screen)
│   └── icons8-monkey-64.png          Profile button icon in header
│
├── package.json                      Dependencies and npm scripts
└── app.json                          Expo app configuration
```

---

### Quick Commands

```bash
# Start development server (scan QR in Expo Go on your phone)
npm start

# Deploy AI functions to Supabase
npx supabase link --project-ref smelhjszcbccvpfvaliq
npx supabase functions deploy generate-workout
npx supabase functions deploy fitness-chat
```

### Key Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/smelhjszcbccvpfvaliq
- **Project Ref:** `smelhjszcbccvpfvaliq`
- **Supabase URL:** `https://smelhjszcbccvpfvaliq.supabase.co`

---

*End of Document — FitnessAI Project Overview, May 2026*