export function isCelebration(count: number): boolean {
  return count > 0
    && (
      count === 1
      || (count <= 1000 && count % 100 === 0)
      || (count > 1000 && count % 500 === 0)
    );
}
