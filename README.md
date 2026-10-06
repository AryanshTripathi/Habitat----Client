# Habitat — React Native (Expo SDK 52)

Mobile client for the Habitat habit tracker.

## Screens
- **Today** — misty header, featured card (the habit with the highest current streak) with a Mon–Sun row where only today can be toggled, habit cards with a milestone progress bar, add (+) button.
- **Schedule** — today's timeline: every habit scheduled for today's weekday, ordered by start time, with its time range. The check completes the habit.
- **Habits** — filterable list (Daily / Weekly) with complete / edit / delete.
- **Habit Detail** — current vs max streak, read-only 5-week heatmap (done / missed / empty), milestone badges, completion stats, tags and notes.
- **Create / Edit Habit** (modal) — title, description, Daily/Weekly, per-day start and end times, reminders switch, color, icon, count label, tags, notes.
- **Progress** — global stats, today's completion ring, streak leaderboard.
- **Settings** — name, daily target, notification toggles and times, theme, JSON export, reset.

## Behavior
- Milestones (progress bar and badges): 1 day, 1 week, 21 days, 1 month, 2 months, 3 months, 6 months, 1 year, then every further year.
- A habit's start time per day is its reminder time. One switch turns reminders off for all of its days; local weekly notifications use `expo-notifications`.
- Banners: Today is always misty; each habit's detail header uses one of the four bundled images, chosen from its id.
- Habits, streaks, heatmaps and today's schedule come from the Spring server (`src/api/`). The UI renders the server's responses (nothing is computed locally) and shows the server's error message when a call fails. Pull down on Today to refresh; the app also refreshes when it returns to the foreground.
- Only the profile/settings are stored on the device (AsyncStorage, `habitat_profile_v1`).
- A habit's title can't be changed after it is created.

## Server address
Set `EXPO_PUBLIC_API_URL` (see `.env.example`). Defaults: `http://localhost:8080` (iOS simulator, web) and `http://10.0.2.2:8080` (Android emulator). On a physical phone use your computer's LAN IP, e.g. `http://192.168.1.20:8080`; the phone and computer must be on the same network.

## Run
```bash
npm install
npx expo start      # scan the QR code with Expo Go
npm run web         # needs: npx expo install react-dom react-native-web @expo/metro-runtime
```

Notifications do not fire on web. On Android, scheduled notifications work in Expo Go; use a development build for full parity.
