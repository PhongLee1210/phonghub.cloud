/** Apple exponential-decay momentum projection formula. */
export function project(velocity: number, decelRate = 0.998): number {
  if (velocity === 0) return 0;
  return (velocity / 1000) * decelRate / (1 - decelRate);
}
