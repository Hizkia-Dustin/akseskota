export interface WeightedEdge<T = unknown> {
  id: string;
  from: string;
  to: string;
  cost: number;
  data?: T;
}

export interface WeightedPath<T = unknown> {
  nodes: string[];
  edges: WeightedEdge<T>[];
  cost: number;
}

interface SearchOptions {
  bannedEdgeIds?: Set<string>;
  bannedNodeIds?: Set<string>;
}

export function dijkstra<T>(
  edges: WeightedEdge<T>[],
  start: string,
  destination: string,
  options: SearchOptions = {},
): WeightedPath<T> | null {
  const adjacency = new Map<string, WeightedEdge<T>[]>();
  for (const edge of edges) {
    if (!Number.isFinite(edge.cost) || edge.cost < 0) continue;
    const outgoing = adjacency.get(edge.from) ?? [];
    outgoing.push(edge);
    adjacency.set(edge.from, outgoing);
  }

  const distances = new Map<string, number>([[start, 0]]);
  const previous = new Map<string, WeightedEdge<T>>();
  const unvisited = new Set<string>([start, destination, ...edges.flatMap((edge) => [edge.from, edge.to])]);

  while (unvisited.size) {
    let current: string | undefined;
    let currentDistance = Number.POSITIVE_INFINITY;
    for (const node of unvisited) {
      const distance = distances.get(node) ?? Number.POSITIVE_INFINITY;
      if (distance < currentDistance) {
        current = node;
        currentDistance = distance;
      }
    }
    if (current === undefined || !Number.isFinite(currentDistance)) break;
    unvisited.delete(current);
    if (current === destination) break;

    for (const edge of adjacency.get(current) ?? []) {
      if (options.bannedEdgeIds?.has(edge.id) || options.bannedNodeIds?.has(edge.to)) continue;
      const candidate = currentDistance + edge.cost;
      if (candidate < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, candidate);
        previous.set(edge.to, edge);
      }
    }
  }

  const finalCost = distances.get(destination);
  if (finalCost === undefined) return null;
  const pathEdges: WeightedEdge<T>[] = [];
  let cursor = destination;
  while (cursor !== start) {
    const edge = previous.get(cursor);
    if (!edge) return null;
    pathEdges.unshift(edge);
    cursor = edge.from;
  }
  return { nodes: [start, ...pathEdges.map((edge) => edge.to)], edges: pathEdges, cost: finalCost };
}

/** Yen's K-shortest loopless paths, using weighted Dijkstra for each spur path. */
export function yenKShortestPaths<T>(edges: WeightedEdge<T>[], start: string, destination: string, count: number): WeightedPath<T>[] {
  const first = dijkstra(edges, start, destination);
  if (!first || count <= 0) return [];
  const accepted: WeightedPath<T>[] = [first];
  const candidates: WeightedPath<T>[] = [];

  while (accepted.length < count) {
    const previousPath = accepted[accepted.length - 1];
    for (let index = 0; index < previousPath.edges.length; index += 1) {
      const rootEdges = previousPath.edges.slice(0, index);
      const rootNodes = previousPath.nodes.slice(0, index + 1);
      const spurNode = previousPath.nodes[index];
      const bannedEdgeIds = new Set<string>();

      for (const path of accepted) {
        const sameRoot = rootEdges.every((edge, edgeIndex) => path.edges[edgeIndex]?.id === edge.id);
        if (sameRoot && path.edges[index]) bannedEdgeIds.add(path.edges[index].id);
      }

      const spur = dijkstra(edges, spurNode, destination, {
        bannedEdgeIds,
        bannedNodeIds: new Set(rootNodes.slice(0, -1)),
      });
      if (!spur) continue;

      const combinedEdges = [...rootEdges, ...spur.edges];
      const signature = combinedEdges.map((edge) => edge.id).join('|');
      if (accepted.some((path) => path.edges.map((edge) => edge.id).join('|') === signature)) continue;
      if (candidates.some((path) => path.edges.map((edge) => edge.id).join('|') === signature)) continue;
      candidates.push({
        edges: combinedEdges,
        nodes: [...rootNodes.slice(0, -1), ...spur.nodes],
        cost: combinedEdges.reduce((sum, edge) => sum + edge.cost, 0),
      });
    }

    if (!candidates.length) break;
    candidates.sort((firstCandidate, secondCandidate) => firstCandidate.cost - secondCandidate.cost);
    accepted.push(candidates.shift()!);
  }

  return accepted;
}
