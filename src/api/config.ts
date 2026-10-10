import { Platform } from 'react-native';

/**
 * Where the Spring server lives. Set EXPO_PUBLIC_API_URL (e.g. in .env) when testing on a physical phone:
 * use your computer's LAN IP, e.g. http://192.168.1.20:8080 — 'localhost' on a phone is the phone itself.
 * Defaults: Android emulator reaches the host machine at 10.0.2.2; the iOS simulator and web use localhost.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

// Free hosting spins the server down when idle, and waking it can take a minute or more.
export const REQUEST_TIMEOUT_MS = 60000;
/** The first list request after idle may have to wait out a full cold start. */
export const WAKE_TIMEOUT_MS = 120000;
