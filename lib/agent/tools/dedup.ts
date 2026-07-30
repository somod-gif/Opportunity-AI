function normalizeKey(title: string, provider?: string): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "")}::${(provider || "").toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
}

const seenKeys = new Set<string>();

export function isDuplicate(title: string, provider?: string): boolean {
  const key = normalizeKey(title, provider);
  if (seenKeys.has(key)) return true;
  seenKeys.add(key);
  return false;
}

export function deduplicate<T extends { title?: unknown; provider?: unknown }>(items: T[]): T[] {
  return items.filter((item) => !isDuplicate(String(item.title || ""), String(item.provider || "")));
}

export function resetDedup(): void {
  seenKeys.clear();
}
