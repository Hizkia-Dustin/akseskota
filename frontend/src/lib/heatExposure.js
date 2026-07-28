const GREEN_PATTERN = /(taman|kebun|hutan|arboretum|lapangan|botani|garden|park)/i;
const BUILT_PATTERN = /(mall|plaza|pasar|terminal|stasiun|pusat perbelanjaan|supermarket)/i;

export function solarExposureFactor(hour) {
  const safeHour = Math.max(6, Math.min(18, Number(hour) || 12));
  if (safeHour <= 12) return 0.18 + ((safeHour - 6) / 6) * 0.82;
  return 1 - ((safeHour - 12) / 6) * 0.72;
}

export function heatExposureCollection(destinations, hour, weather) {
  const solar = solarExposureFactor(hour);
  const cloudFactor = 1 - Math.min(90, Math.max(0, Number(weather?.cloudCover) || 0)) / 150;
  const temperatureFactor = Math.max(0.72, Math.min(1.2, ((Number(weather?.apparentTemperature) || 30) - 20) / 12));

  return {
    type: "FeatureCollection",
    features: destinations
      .filter((place) => Array.isArray(place.coordinates) && place.coordinates.length === 2)
      .map((place) => {
        const descriptor = `${place.category || ""} ${place.placeType || ""} ${place.name || ""}`;
        const landFactor = GREEN_PATTERN.test(descriptor) ? 0.2 : BUILT_PATTERN.test(descriptor) ? 0.95 : 0.62;
        return {
          type: "Feature",
          properties: {
            externalId: place.externalId,
            name: place.name,
            exposure: Math.max(0.05, Math.min(1, landFactor * solar * cloudFactor * temperatureFactor)),
          },
          geometry: { type: "Point", coordinates: place.coordinates },
        };
      }),
  };
}

export function shadeSegmentCollection(segments, hour) {
  const solar = solarExposureFactor(hour);
  return {
    type: "FeatureCollection",
    features: segments
      .filter((segment) => segment.geometry?.type === "LineString")
      .map((segment) => {
        const shade = Number(segment.shade_level ?? segment.shadeLevel);
        const knownShade = Number.isFinite(shade) ? Math.max(0, Math.min(100, shade)) : null;
        return {
          type: "Feature",
          properties: {
            id: segment.id,
            shade: knownShade ?? -1,
            exposure: knownShade === null ? 0.5 : ((100 - knownShade) / 100) * solar,
            verified: knownShade !== null,
          },
          geometry: segment.geometry,
        };
      }),
  };
}
