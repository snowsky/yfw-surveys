/**
 * Shared API helper for the Surveys plugin.
 * Self-contained to avoid naming conflicts with the main application's API library.
 */
export async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: { 
      "Content-Type": "application/json", 
      ...(opts.headers ?? {}) 
    },
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}
