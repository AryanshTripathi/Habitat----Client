import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import { HabitDetailDto, HabitDto, HabitRequestDto, ScheduleTodayRowDto } from './types';

/** An HTTP or network failure with a message that's safe to show the user. */
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
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
  getHabits: () => request<HabitDto[]>('GET', '/habits'),
  getHabit: (id: number) => request<HabitDetailDto>('GET', `/habits/${id}`),
  createHabit: (body: HabitRequestDto) => request<HabitDto>('POST', '/habits', body),
  updateHabit: (id: number, body: HabitRequestDto) => request<HabitDto>('PUT', `/habits/${id}`, body),
  deleteHabit: (id: number) => request<void>('DELETE', `/habits/${id}`),
  completeHabit: (id: number) => request<HabitDto>('POST', `/habits/complete/${id}`),
  undoHabit: (id: number) => request<HabitDto>('POST', `/habits/undo/${id}`),
  getTodaySchedule: () => request<ScheduleTodayRowDto[]>('GET', '/schedule/today'),
};
