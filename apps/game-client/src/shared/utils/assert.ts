/**
 * Runtime assertions for invariants that TypeScript cannot prove.
 * Kept dependency-free so any layer can use them.
 */

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertDefined<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}
