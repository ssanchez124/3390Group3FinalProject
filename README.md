# AI Workout App

An AI mobile fitness app built with React Native and Expo that uses AI to generate personalized workout plans, track progress, and provide coaching which is all backed by Supabase.

---

## Features

### AI Workout Generation
Configure target muscle groups up to 3, duration, exercise count, and difficulty level. GPT-4o generates a fully personalized workout plan adjusted to the user's body and fitness level.

### Active Workout Tracking
Guided instructions are provided for each workout. Log sets with weight and reps. Swap any exercise and get an AI generated replacement that focuses on the same muscle group.

### Analytics Dashboard
- **Streak tracker** - current and longest workout streaks with a 14 day activity grid
- **Weight progress charts** - exercise progress over time with PR detection and percentage change 
- **Volume charts** - training volume, kg × reps, per muscle group across sessions
- **Quick insights** - strongest lift, most improved exercise, total sessions logged

### Workout History
Look through all past sessions in expandable cards. Each entry shows the date, exercises performed, sets, reps, and weight logged.

### AI Fitness Coach Chat
Chat with a personal fitness coach powered by AI. The coach receives your profile details such as age, weight, height, gender as context to give tailored advice on form, nutrition, and recovery.

### Favorites
Save and revisit workout plans you want to repeat.

### User Profile & Onboarding
Guided onboarding gets personal details used to personalize AI generated workouts and coaching responses.



## Tech Stack

| Layer | Technology |
 Framework - React Native + Expo 
 Navigation - Expo Router (file-based) 
 Backend / Auth / DB - Supabase 
 Edge Functions - Deno (Supabase Edge Functions) 
 AI — Workout Generation - OpenAI GPT-4o 
 AI — Fitness Chat 
 Charts - react-native-chart-kit 
 Session Persistence - AsyncStorage 



## Architecture Overview

```
project/
├── app/
│   ├── _layout.jsx              # Root layout — AuthGate handles session routing
│   ├── index.jsx                # Entry redirect
│   ├── (auth)/                  # Unauthenticated screens (login / sign-up)
│   ├── (onboarding)/            # Profile setup flow (runs once after registration)
│   ├── (tabs)/                  # Main tab navigator
│   │   ├── home.jsx             # Home screen — start workout CTA
│   │   ├── workout-config.jsx   # AI workout configuration form
│   │   ├── history.jsx          # Past session browser
│   │   ├── favorites.jsx        # Saved workout plans
│   │   ├── analytics.jsx        # Streak, charts, and insights
│   │   ├── chat.jsx             # AI fitness coach chat
│   │   └── profile.jsx          # User profile editor
│   ├── workout-display.jsx      # Generated plan preview + exercise swap
│   ├── active-workout.jsx       # Live workout logger
│   ├── session-summary.jsx      # Post-workout summary
│   └── personal-details.jsx     # Inline personal details editor
├── lib/
│   ├── supabase.js              # Supabase client (with AsyncStorage session persistence)
│   └── workoutStore.js          # In-memory store for the active workout plan
└── supabase/
    └── functions/
        └── generate-workout/    # Deno edge function — calls GPT-4o, saves plan to DB
```

### Data Flow

1. **Auth** — Supabase handles email/password auth. The `AuthGate` component in `_layout.jsx` reads the session and redirects users to onboarding, the main app, or the login screen accordingly.
2. **Workout generation** — The client sends workout config and auth token to the `generate-workout` edge function. The function fetches the user's profile from the DB, builds a prompt, calls GPT-4o, stores the plan in `workout_plans`, and returns the JSON plan.
3. **Workout logging** — Completed sessions are written to `workout_sessions` and `exercise_logs` in Supabase directly from the client.
4. **Analytics** — The analytics screen queries `exercise_logs` and `workout_sessions`, then computes streaks, progress charts, and insights entirely on the client.
5. **Chat** — Messages are sent to the `fitness-chat` edge function along with the conversation history. The function returns the AI reply, which is added to the local message list.

### Database Tables

| Table | Purpose |
 `user_profiles` - Stores age, weight, height, gender per user 
 `workout_plans` - AI-generated plans with config metadata 
 `workout_sessions` - Completed workout records with timestamps 
 `exercise_logs` - Per-exercise set data linked to a session 



## Setup

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Update [lib/supabase.js](lib/supabase.js) with your project URL and anon key:

```js
export const supabase = createClient(
  "https://<your-project>.supabase.co",
  "<your-anon-key>",
  { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true } }
)
```

### 3. Create database tables

Run the following SQL in the Supabase SQL editor:

```sql
create table user_profiles (
  user_id uuid primary key references auth.users,
  age int, gender text, weight_kg numeric, height_cm numeric
);

create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  plan_data jsonb,
  config_used jsonb,
  created_at timestamptz default now()
);

create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  completed_at timestamptz default now()
);

create table exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  session_id uuid references workout_sessions,
  exercise_name text,
  muscle_group text,
  sets_data jsonb,
  logged_at timestamptz default now()
);
```

Enable Row Level Security on all tables and add policies so users can only access their own rows.

### 4. Deploy edge functions

```bash
supabase functions deploy generate-workout
supabase functions deploy fitness-chat
```

Set the required secrets:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

### 5. Run the app

```
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i`/`a/ w` to open in a simulator.

---

## Environment

The app targets iOS and Android.

