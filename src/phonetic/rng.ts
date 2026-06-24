/**
 * Small seedable PRNG (mulberry32) so lessons are reproducible in tests and a
 * given seed always yields the same text.
 */
export type RNG = {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  /** Picks a weighted entry; weights need not be normalised. */
  weighted<T>(entries: readonly [T, number][]): T;
};

export function makeRNG(seed: number): RNG {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n: number): number => Math.floor(next() * n);
  const weighted = <T>(entries: readonly [T, number][]): T => {
    let total = 0;
    for (const [, w] of entries) {
      total += w;
    }
    let r = next() * total;
    for (const [value, w] of entries) {
      r -= w;
      if (r < 0) {
        return value;
      }
    }
    return entries[entries.length - 1][0];
  };
  return { next, int, weighted };
}
