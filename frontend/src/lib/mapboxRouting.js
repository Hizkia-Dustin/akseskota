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
  const primaryRoutes = await fetchDirections([origin, destination], accessToken, true);
  const candidates = [...primaryRoutes];

  if (candidates.length < 3) {
    const detourPoints = alternativeWaypoints(origin, destination);
    const detours = await Promise.allSettled(
      detourPoints.map((waypoint) => fetchDirections([origin, waypoint, destination], accessToken, false)),
    );
    for (const result of detours) {
      if (result.status === "fulfilled") candidates.push(...result.value);
    }
  }

  // Mapbox may occasionally return alternatives that are effectively the
  // same path. Keep only genuinely different geometries; never fabricate B/C.
  const uniqueRoutes = [];
  for (const route of candidates.sort((first, second) => first.duration - second.duration)) {
    if (!route.geometry?.coordinates?.length) continue;
    if (uniqueRoutes.every((existing) => routesAreDistinct(existing, route))) uniqueRoutes.push(route);
    if (uniqueRoutes.length === 3) break;
  }
  if (!uniqueRoutes.length) throw new Error("Mapbox tidak mengembalikan geometri rute yang dapat digunakan.");

  return uniqueRoutes.map((route, index) => {
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
        distanceMeters: step.distance,
        location: step.maneuver?.location ?? null,
      })),
    };
  });
}

async function fetchDirections(points, accessToken, alternatives) {
  const coordinatePath = points.map((point) => point.join(",")).join(";");
  const params = new URLSearchParams({
    access_token: accessToken,
    alternatives: String(alternatives),
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
  return payload.routes;
}

function alternativeWaypoints(origin, destination) {
  const [originLng, originLat] = origin;
  const [destinationLng, destinationLat] = destination;
  const middleLng = (originLng + destinationLng) / 2;
  const middleLat = (originLat + destinationLat) / 2;
  const deltaX = (destinationLng - originLng) * 111_320 * Math.cos((middleLat * Math.PI) / 180);
  const deltaY = (destinationLat - originLat) * 110_540;
  const directDistance = Math.max(1, Math.hypot(deltaX, deltaY));
  const offset = Math.max(180, Math.min(450, directDistance * 0.18));
  const perpendicularX = (-deltaY / directDistance) * offset;
  const perpendicularY = (deltaX / directDistance) * offset;
  const [west, south, east, north] = BOGOR_BOUNDS;
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  return [-1, 1].map((direction) => [
    clamp(middleLng + direction * perpendicularX / (111_320 * Math.cos((middleLat * Math.PI) / 180)), west, east),
    clamp(middleLat + direction * perpendicularY / 110_540, south, north),
  ]);
}

function routesAreDistinct(first, second) {
  const distanceDifference = Math.abs(first.distance - second.distance) / Math.max(first.distance, second.distance, 1);
  if (distanceDifference > 0.08) return true;

  const firstSamples = sampleCoordinates(first.geometry.coordinates, 24);
  const secondSamples = sampleCoordinates(second.geometry.coordinates, 24);
  const averageNearestDistance = firstSamples.reduce((sum, point) => {
    const nearest = secondSamples.reduce((minimum, candidate) => Math.min(minimum, pointDistanceMeters(point, candidate)), Number.POSITIVE_INFINITY);
    return sum + nearest;
  }, 0) / Math.max(1, firstSamples.length);

  return averageNearestDistance > 12;
}

function sampleCoordinates(coordinates, maximum) {
  if (coordinates.length <= maximum) return coordinates;
  return Array.from({ length: maximum }, (_, index) => coordinates[Math.round((coordinates.length - 1) * index / (maximum - 1))]);
}

function pointDistanceMeters([firstLng, firstLat], [secondLng, secondLat]) {
  const averageLat = ((firstLat + secondLat) / 2) * Math.PI / 180;
  const x = (firstLng - secondLng) * 111_320 * Math.cos(averageLat);
  const y = (firstLat - secondLat) * 110_540;
  return Math.hypot(x, y);
}

export function openGoogleStreetView([longitude, latitude]) {
  const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
