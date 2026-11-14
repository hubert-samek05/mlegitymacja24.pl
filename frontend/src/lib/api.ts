export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000/api";

const ACCESS_TOKEN_KEY = "ml24_access_token";
const REFRESH_TOKEN_KEY = "ml24_refresh_token";

export function saveTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { accessToken?: string };
  if (!data.accessToken) return false;
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  return true;
}

// Pojedynczy współdzielony refresh - przy równoległych 401 odświeżamy raz
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = tryRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function buildHeaders(withAuth: boolean): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (withAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.error || "Wystąpił błąd podczas komunikacji z serwerem",
      response.status
    );
  }
  return data as T;
}

async function apiFetch<T>(path: string, init: RequestInit, withAuth: boolean): Promise<T> {
  let response = await fetch(`${API_URL}${path}`, init);
  if (response.status === 401 && withAuth && (await refreshAccessToken())) {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${getAccessToken()}`);
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  }
  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown, withAuth = false): Promise<T> {
  return apiFetch<T>(
    path,
    { method: "POST", headers: buildHeaders(withAuth), body: JSON.stringify(body) },
    withAuth
  );
}

export async function apiGet<T>(path: string, withAuth = true): Promise<T> {
  return apiFetch<T>(path, { method: "GET", headers: buildHeaders(withAuth) }, withAuth);
}

export async function apiPatch<T>(path: string, body: unknown, withAuth = true): Promise<T> {
  return apiFetch<T>(
    path,
    { method: "PATCH", headers: buildHeaders(withAuth), body: JSON.stringify(body) },
    withAuth
  );
}

export async function apiDelete<T>(path: string, withAuth = true): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE", headers: buildHeaders(withAuth) }, withAuth);
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return apiFetch<T>(path, { method: "POST", headers, body: formData }, true);
}

// Wywołuje wygaśnięcie refresh tokena po stronie serwera (fire-and-forget)
export function revokeSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return;
  fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
}
