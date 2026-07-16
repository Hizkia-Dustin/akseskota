const ROUTE_COLORS = ["#0c6478", "#f59e0b", "#3b82f6"];
const ROUTE_TONES = ["teal", "orange", "blue"];

// Search extent of Kota Bogor (OSM relation 14745927).
export const BOGOR_BOUNDS = [106.734837, -6.6813079, 106.8485641, -6.5143294];
export const BOGOR_CENTER = [106.80683, -6.608808];

export function isInsideBogor([longitude, latitude]) {
  const [west, south, east, north] = BOGOR_BOUNDS;
  return longitude >= west && longitude <= east && latitude >= south && latitude <= north;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
}

function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} j ${remaining} mnt` : `${hours} jam`;
}

export async function geocodeMapboxPlace(query, accessToken, proximity) {
  const params = new URLSearchParams({
    q: query.trim(),
    access_token: accessToken,
    autocomplete: "false",
    country: "id",
    language: "id",
    limit: "1",
    bbox: BOGOR_BOUNDS.join(","),
  });
  if (proximity) params.set("proximity", proximity.join(","));

  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`);
  if (!response.ok) throw new Error("Pencarian lokasi Mapbox gagal.");
  const payload = await response.json();
  const feature = payload.features?.[0];
  if (!feature?.geometry?.coordinates) throw new Error(`Lokasi “${query}” tidak ditemukan.`);

  return {
    coordinates: feature.geometry.coordinates,
    name: feature.properties?.name ?? feature.properties?.full_address ?? query,
    address: feature.properties?.full_address ?? feature.properties?.place_formatted ?? query,
  };
}

export async function searchMapboxPlaces(query, accessToken, proximity, signal) {
  const params = new URLSearchParams({
    q: query.trim(),
    access_token: accessToken,
    auto_complete: "true",
    country: "id",
    language: "id",
    limit: "5",
    bbox: BOGOR_BOUNDS.join(","),
  });
  if (proximity) params.set("proximity", proximity.join(","));

  const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/forward?${params}`, { signal });
  if (!response.ok) throw new Error("Saran tempat gagal dimuat.");
  const payload = await response.json();
  return (payload.features ?? []).map((feature) => ({
    id: feature.properties?.mapbox_id ?? feature.id,
    name: feature.properties?.name ?? feature.properties?.full_address ?? "Lokasi",
    address: feature.properties?.full_address ?? feature.properties?.place_formatted ?? "Alamat belum tersedia",
    coordinates: feature.geometry.coordinates,
    type: feature.properties?.feature_type ?? "place",
  }));
}

export async function requestMapboxWalkingRoutes(origin, destination, accessToken) {
  const coordinatePath = `${origin.join(",")};${destination.join(",")}`;
  const params = new URLSearchParams({
    access_token: accessToken,
    alternatives: "true",
    geometries: "geojson",
    overview: "full",
    steps: "true",
    language: "id",
    walkway_bias: "1",
  });
  const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${coordinatePath}?${params}`);
  if (!response.ok) throw new Error("Mapbox belum dapat menghitung rute ini.");
  const payload = await response.json();
  if (payload.code !== "Ok" || !payload.routes?.length) throw new Error("Rute jalan kaki tidak ditemukan.");

  return payload.routes.slice(0, 3).map((route, index) => {
    const steps = route.legs?.flatMap((leg) => leg.steps ?? []) ?? [];
    const streetNames = [...new Set(steps.map((step) => step.name).filter(Boolean))];
    return {
      id: String.fromCharCode(65 + index),
      street: streetNames.length ? `Via ${streetNames.slice(0, 2).join(" · ")}` : "Rute jalan kaki Mapbox",
      badge: index === 0 ? "Rute tercepat Mapbox" : `Alternatif ${index}`,
      time: formatDuration(route.duration),
      distance: formatDistance(route.distance),
      durationSeconds: route.duration,
      distanceMeters: route.distance,
      score: null,
      tone: ROUTE_TONES[index],
      color: ROUTE_COLORS[index],
      geometry: route.geometry,
      steps: steps.map((step) => ({
        instruction: step.maneuver?.instruction ?? step.name ?? "Lanjutkan perjalanan",
        distance: formatDistance(step.distance),
      })),
    };
  });
}

export function openGoogleStreetView([longitude, latitude]) {
  const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
