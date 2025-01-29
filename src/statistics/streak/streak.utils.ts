export function calculateMaxStreak(full: string[], parts: string[]): string[] {
  let maxStreakElements = [];
  let streakElements = [];
  let lastIdxInFull = -1;

  for (let i = 0; i < parts.length; i++) {
    const value = parts[i];
    const idxInFull = full.findIndex(v => v === value);
    if (idxInFull >= 0) {
      if (lastIdxInFull >= 0 && idxInFull !== lastIdxInFull + 1) {
        streakElements = [];
      }

      streakElements.push(value);
      lastIdxInFull = idxInFull;

      // > -> oldest (first) record wins; >= -> latest (last) record wins
      if (streakElements.length > maxStreakElements.length) {
        maxStreakElements = [...streakElements];
      }
    } else {
      throw new Error(`Could not find element ${value} in full list!`);
    }
  }
  return maxStreakElements;
}
