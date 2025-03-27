import { orderBy } from 'lodash';

export function findPropertyById(list: { id: string }[], id: string, property: string): string {
  return list.find(item => item.id === id)?.[property];
}

export function addRanking<I>(items: I[], properties: (keyof I)[], orders?: ('asc' | 'desc')[]): (I & { rank: number })[] {
  const orderedItems = orderBy(items, properties, orders);

  const rankedItems = [];
  let currentRank = 1;
  for (let i = 0; i < orderedItems.length; i++) {
    const prevItem = i >= 1 ? orderedItems[i - 1] : null;
    const item = orderedItems[i];
    if (i === 0) {
      rankedItems.push({ rank: currentRank, ...item });
    } else {
      const currentHash = properties.map(prop => item[prop]).join('');
      const prevHash = properties.map(prop => prevItem[prop]).join('');
      if (prevHash === currentHash) {
        rankedItems.push({ rank: currentRank, ...item });
      } else {
        rankedItems.push({ rank: ++currentRank, ...item });
      }
    }
  }
  return rankedItems;
}

export function multiMinBy<T>(items: T[], projectionFn: (item: T) => number): T[] {
  let minValue = Infinity;
  let resultItems = [];
  items.forEach(item => {
    const currentValue = projectionFn(item);
    if (currentValue < minValue) {
      minValue = currentValue;
      resultItems = [item];
    } else if (currentValue === minValue) {
      resultItems.push(item);
    }
  });

  return resultItems;
}

export function multiMaxBy<T>(items: T[], projectionFn: (item: T) => number): T[] {
  let maxValue = -Infinity;
  let resultItems = [];
  items.forEach(item => {
    const currentValue = projectionFn(item);
    if (currentValue > maxValue) {
      maxValue = currentValue;
      resultItems = [item];
    } else if (currentValue === maxValue) {
      resultItems.push(item);
    }
  });

  return resultItems;
}
