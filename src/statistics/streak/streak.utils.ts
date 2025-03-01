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

export function calculateCurrentStreak(full: string[], parts: string[]): number {
  if (parts.length === 0) {
    return 0;
  }

  let counter = 0;
  // let idxInFull = full.lastIndexOf(parts[parts.length - 1]);
  let idxInFull = full.length - 1;
  if (idxInFull >= 0) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const elementInFull = full[idxInFull];
      const elementInPart = parts[i];
      if (elementInPart === elementInFull) {
        counter++;
        idxInFull--;
      } else {
        break;
      }
    }
    return counter;
  }
  throw new Error(`Could not find element ${parts[parts.length - 1]} in full list!`);
}
