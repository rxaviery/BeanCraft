// Talks to the PHP API. Every request goes through request(), which:
//  - adds the login token as the X-Auth-Token header
//  - gives up after 15 seconds
//  - turns the {"success","data","message"} reply into data or an ApiError
import { API_BASE_URL } from '@/config';

export type User = { id: number; name: string; email: string; created_at: string };

export type Bean = {
  id: number;
  name: string;
  roaster: string;
  origin: string | null;
  farm: string | null;
  process_method: string | null;
  roast_level: string | null;
  roast_date: string | null; // "YYYY-MM-DD"
  altitude: string | null;
  tasting_notes: string | null; // "Jasmine, Peach"
  bag_weight_g: number;
  remaining_g: number;
  price: number | null; // pesos
  rating: number | null; // 0-5 stars
  cupping_notes: string | null;
  created_at: string;
  updated_at: string;
};

// Fields the app may send when creating or updating a bean.
export type BeanInput = Partial<Omit<Bean, 'id' | 'created_at' | 'updated_at'>>;

type Session = { user: User; token: string };

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>; // from 422 responses, e.g. { name: "This field is required." }

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const TIMEOUT_MS = 15000;

let token: string | null = null;
let onUnauthorized = () => {};

// Called by the auth context when the user logs in or out.
export function setToken(value: string | null) {
  token = value;
}

// Called by the auth context: what to do when the server says the token is no longer valid.
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { 'X-Auth-Token': token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(
      controller.signal.aborted
        ? 'The server took too long to respond. Please try again.'
        : "Can't reach the server. Check your internet connection.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  let json: { success: boolean; data: unknown; message: string };
  try {
    json = await response.json();
  } catch {
    throw new ApiError(`Unexpected reply from the server (HTTP ${response.status}).`, response.status);
  }

  if (!response.ok || !json.success) {
    // A 401 while logged in means the session ended: log the user out.
    if (response.status === 401 && token) onUnauthorized();
    const errors = (json.data as { errors?: Record<string, string> } | null)?.errors ?? {};
    throw new ApiError(json.message || 'Something went wrong. Please try again.', response.status, errors);
  }
  return json.data as T;
}

// Readable message for any error thrown by the functions below.
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function fieldErrors(error: unknown) {
  return error instanceof ApiError ? error.fieldErrors : {};
}

// ---- Auth ----
export const login = (email: string, password: string) =>
  request<Session>('/login.php', 'POST', { email, password });

export const register = (name: string, email: string, password: string) =>
  request<Session>('/register.php', 'POST', { name, email, password });

export const logout = () => request<null>('/logout.php', 'POST');

// ---- Beans (CRUD) ----
export const getBeans = () => request<Bean[]>('/beans.php');

export const getBean = (id: number) => request<Bean>(`/beans.php?id=${id}`);

export const createBean = (bean: BeanInput) => request<Bean>('/beans.php', 'POST', bean);

export const updateBean = (id: number, changes: BeanInput) => request<Bean>(`/beans.php?id=${id}`, 'PUT', changes);

export const deleteBean = (id: number) => request<{ id: number }>(`/beans.php?id=${id}`, 'DELETE');
