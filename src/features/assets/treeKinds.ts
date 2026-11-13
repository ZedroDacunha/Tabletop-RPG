/** Stable identifiers preserve trees already placed in saved maps. */
export const TREE_KINDS = ['pine', 'oak', 'birch', 'deadtree', 'willow'] as const;
export type TreeKind = typeof TREE_KINDS[number];
export function isTreeKind(kind: string): kind is TreeKind {
  return (TREE_KINDS as readonly string[]).includes(kind);
}
