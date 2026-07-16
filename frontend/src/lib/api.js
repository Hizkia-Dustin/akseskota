const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function getStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const user = JSON.parse(localStorage.getItem("akseskota-user") || "null");
    const accessToken = localStorage.getItem("akseskota-access-token");
    return user && accessToken ? { user, accessToken } : null;
  } catch {
    return null;
  }
}

export function storeSession(data) {
  localStorage.setItem("akseskota-user", JSON.stringify(data.user));
  localStorage.setItem("akseskota-access-token", data.accessToken);
  localStorage.setItem("akseskota-refresh-token", data.refreshToken);
}

export function clearSession() {
  localStorage.removeItem("akseskota-user");
  localStorage.removeItem("akseskota-access-token");
  localStorage.removeItem("akseskota-refresh-token");
}

export async function apiRequest(path, options = {}) {
  const session = getStoredSession();
  const headers = new Headers(options.headers || {});
  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Permintaan gagal diproses.");
  }
  return payload.data;
}

export { API_URL };
