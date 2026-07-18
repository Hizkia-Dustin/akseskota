import assert from 'node:assert/strict';
import test from 'node:test';
import { registerSchema } from './modules/auth/auth.schema';
import { createPlacePostSchema } from './modules/communityPlaces/communityPlaces.schema';
import { reportObstacleSchema } from './modules/obstacles/obstacles.schema';
import { addRoadSegmentSchema } from './modules/roadSegments/roadSegments.schema';
import { sampleLineStringMeters } from './utils/spatial';

test('public submissions are restricted to Kota Bogor', () => {
  const baseObstacle = {
    title: 'Trotoar berlubang',
    type: 'POTHOLE',
    status: 'TEMPORARY',
    description: 'Lubang menghalangi pengguna kursi roda.',
  };
  assert.equal(reportObstacleSchema.safeParse({ ...baseObstacle, geometry: JSON.stringify({ type: 'Point', coordinates: [106.8, -6.6] }) }).success, true);
  assert.equal(reportObstacleSchema.safeParse({ ...baseObstacle, geometry: JSON.stringify({ type: 'Point', coordinates: [107.0, -6.6] }) }).success, false);

  const place = {
    externalId: 'mapbox.test', name: 'Tempat Test', address: 'Bogor', latitude: -6.6, longitude: 106.8,
    title: 'Akses pintu utama', content: 'Pintu utama dapat dilewati dengan bantuan petugas.', rating: 4,
    accessibilityRating: 3, features: ['RAMP'],
  };
  assert.equal(createPlacePostSchema.safeParse(place).success, true);
  assert.equal(createPlacePostSchema.safeParse({ ...place, longitude: 107 }).success, false);
});

test('road survey JSON errors become validation errors instead of server errors', () => {
  assert.equal(addRoadSegmentSchema.safeParse({ geometry: '{invalid-json' }).success, false);
});

test('registration requires a production-suitable minimum password length', () => {
  assert.equal(registerSchema.safeParse({ name: 'Test', email: 'TEST@EXAMPLE.COM', password: 'short123' }).success, false);
  const valid = registerSchema.safeParse({ name: 'Test', email: 'TEST@EXAMPLE.COM', password: 'long-password-123' });
  assert.equal(valid.success, true);
  if (valid.success) assert.equal(valid.data.email, 'test@example.com');
});

test('route sampling stays bounded for long Mapbox geometries', () => {
  const samples = sampleLineStringMeters([[106.75, -6.6], [106.84, -6.6]], 25, 100);
  assert.equal(samples.length, 100);
  assert.deepEqual(samples[0], [106.75, -6.6]);
});
