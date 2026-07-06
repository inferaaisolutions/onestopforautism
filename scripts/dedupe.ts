export interface HasSourceUrl {
  sourceUrl: string;
}

export function dedupe<T extends HasSourceUrl>(existingUrls: Set<string>, items: T[]): T[] {
  const seen = new Set(existingUrls);
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.sourceUrl)) continue;
    seen.add(item.sourceUrl);
    result.push(item);
  }
  return result;
}
