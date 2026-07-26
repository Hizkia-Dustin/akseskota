const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function saveSession(data) {
  localStorage.setItem("akseskota-access-token", data.accessToken);
  localStorage.setItem("akseskota-refresh-token", data.refreshToken);
  localStorage.setItem("akseskota-user", JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem("akseskota-access-token");
  localStorage.removeItem("akseskota-refresh-token");
  localStorage.removeItem("akseskota-user");
}

export async function authRequest(path, body) {
  const response = await fetch(`${API_URL}/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Permintaan auth gagal.");
  return payload.data;
}