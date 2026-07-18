export const BOGOR_BOUNDS = {
  west: 106.734837,
  south: -6.6813079,
  east: 106.8485641,
  north: -6.5143294,
} as const;

export function isInsideBogor(longitude: number, latitude: number): boolean {
  return longitude >= BOGOR_BOUNDS.west
    && longitude <= BOGOR_BOUNDS.east
    && latitude >= BOGOR_BOUNDS.south
    && latitude <= BOGOR_BOUNDS.north;
}
