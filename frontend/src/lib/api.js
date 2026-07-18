const API_URL = process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === "development" ? "http://localhost:4000/api" : "");
let refreshPromise = null;

export function getStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const user = JSON.parse(localStorage.getItem("akseskota-user") || "null");
    const accessToken = localStorage.getItem("akseskota-access-token");
    const refreshToken = localStorage.getItem("akseskota-refresh-token");
    return user && accessToken ? { user, accessToken, refreshToken } : null;
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
  if (!API_URL) {
    throw new Error("API belum dikonfigurasi. Isi NEXT_PUBLIC_API_URL lalu build ulang aplikasi.");
  }
  const session = getStoredSession();
  const headers = new Headers(options.headers || {});
  if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 401 && session?.refreshToken && path !== "/auth/refresh") {
    try {
      if (!refreshPromise) {
        refreshPromise = fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        }).then(async (refreshResponse) => {
          const refreshPayload = await refreshResponse.json().catch(() => ({}));
          if (!refreshResponse.ok || !refreshPayload.data?.accessToken) throw new Error("Sesi berakhir.");
          localStorage.setItem("akseskota-access-token", refreshPayload.data.accessToken);
          localStorage.setItem("akseskota-refresh-token", refreshPayload.data.refreshToken);
          return refreshPayload.data.accessToken;
        }).finally(() => { refreshPromise = null; });
      }
      const accessToken = await refreshPromise;
      headers.set("Authorization", `Bearer ${accessToken}`);
      response = await fetch(`${API_URL}${path}`, { ...options, headers });
    } catch {
      clearSession();
      throw new Error("Sesi kamu berakhir. Silakan masuk kembali.");
    }
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Permintaan gagal diproses.");
  }
  return payload.data;
}

export { API_URL };
