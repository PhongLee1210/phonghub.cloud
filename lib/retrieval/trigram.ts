/**
 * Dice-coefficient similarity over character trigrams.
 *
 * Deliberately dependency-free and deliberately not an embedding: the corpus
 * is a few dozen config entries, where a vector store would add a network
 * round trip inside the chat stream's latency budget, a new secret, and a
 * database — for no measurable recall gain at this size.
 */

const WINDOW = 3;

/**
 * Overlapping character windows. A string shorter than the window yields the
 * whole string as a single gram, so two-letter terms still compare rather than
 * producing an empty set that scores 0 against everything.
 */
export function trigrams(value: string): Set<string> {
  if (value.length === 0) return new Set();
  if (value.length <= WINDOW) return new Set([value]);

  const grams = new Set<string>();
  for (let i = 0; i <= value.length - WINDOW; i++) {
    grams.add(value.slice(i, i + WINDOW));
  }
  return grams;
}

/** Dice coefficient in [0, 1]. Symmetric; 0 when either side is empty. */
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const left = trigrams(a);
  const right = trigrams(b);
  if (left.size === 0 || right.size === 0) return 0;

  let shared = 0;
  left.forEach((gram) => {
    if (right.has(gram)) shared++;
  });

  return (2 * shared) / (left.size + right.size);
}
