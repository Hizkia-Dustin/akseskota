import assert from 'node:assert/strict';
import test from 'node:test';
import { dijkstra, yenKShortestPaths } from './weightedDijkstra';

const graph = [
  { id: 'direct-but-inaccessible', from: 'start', to: 'finish', cost: 180 },
  { id: 'accessible-a1', from: 'start', to: 'a', cost: 70 },
  { id: 'accessible-a2', from: 'a', to: 'finish', cost: 70 },
  { id: 'shaded-b1', from: 'start', to: 'b', cost: 80 },
  { id: 'shaded-b2', from: 'b', to: 'finish', cost: 80 },
];

test('Dijkstra selects the lowest non-negative accessibility cost', () => {
  const result = dijkstra(graph, 'start', 'finish');
  assert.deepEqual(result?.edges.map((edge) => edge.id), ['accessible-a1', 'accessible-a2']);
  assert.equal(result?.cost, 140);
});

test('Yen returns distinct paths ordered by Dijkstra cost', () => {
  const paths = yenKShortestPaths(graph, 'start', 'finish', 3);
  assert.deepEqual(paths.map((path) => path.cost), [140, 160, 180]);
  assert.equal(new Set(paths.map((path) => path.edges.map((edge) => edge.id).join('|'))).size, 3);
});

test('negative and infinite edges are never used', () => {
  const result = dijkstra([
    { id: 'negative', from: 'start', to: 'finish', cost: -1 },
    { id: 'blocked', from: 'start', to: 'finish', cost: Number.POSITIVE_INFINITY },
  ], 'start', 'finish');
  assert.equal(result, null);
});
