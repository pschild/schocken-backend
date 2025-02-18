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
