import { API_BASE_URL, REQUEST_TIMEOUT_MS, WAKE_TIMEOUT_MS } from './config';
import { HabitDetailDto, HabitDto, HabitRequestDto, ScheduleTodayRowDto } from './types';
import { assertValidHabit } from './validation';
import { ApiError } from './errors';
import { getTimeZone, TIMEZONE_HEADER } from './timezone';

export { ApiError };

/** Every request says which time zone the user is in, so the server can work out "today" for them. */
const headers = (hasBody: boolean): Record<string, string> => {
  const h: Record<string, string> = {};
  const tz = getTimeZone();
  if (tz) h[TIMEZONE_HEADER] = tz;
  if (hasBody) h['Content-Type'] = 'application/json';
  return h;
};

async function request<T>(method: string, path: string, body?: unknown, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: headers(body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      // Prefer the server's own message when it sends one (JSON {message}) or plain text.
      let message = `Request failed (${res.status})`;
      try {
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;
        if (json?.message) message = json.message;
        else if (text && !json) message = text;
      } catch {
        // keep the generic message
      }
      throw new ApiError(message, res.status);
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error).name === 'AbortError') throw new ApiError('The server took too long to respond. It may be waking up, so try again in a moment.');
    throw new ApiError(`Can't reach the server at ${API_BASE_URL}.`);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  getHabits: () => request<HabitDto[]>('GET', '/habits', undefined, WAKE_TIMEOUT_MS),
  getHabit: (id: number) => request<HabitDetailDto>('GET', `/habits/${id}`),
  // Every write is checked first, so invalid data is never sent.
  createHabit: (body: HabitRequestDto) => {
    assertValidHabit(body);
    return request<HabitDto>('POST', '/habits', body);
  },
  updateHabit: (id: number, body: HabitRequestDto) => {
    assertValidHabit(body);
    return request<HabitDto>('PUT', `/habits/${id}`, body);
  },
  deleteHabit: (id: number) => request<void>('DELETE', `/habits/${id}`),
  completeHabit: (id: number) => request<HabitDto>('POST', `/habits/complete/${id}`),
  undoHabit: (id: number) => request<HabitDto>('POST', `/habits/undo/${id}`),
  getTodaySchedule: () => request<ScheduleTodayRowDto[]>('GET', '/schedule/today'),
};
