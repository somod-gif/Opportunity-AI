function normalizeKey(title: string, provider?: string): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "")}::${(provider || "").toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
}

const seenKeys = new Map<string, Set<string>>();

export function isDuplicate(title: string, provider?: string, scope = "global"): boolean {
  const key = normalizeKey(title, provider);
  let keys = seenKeys.get(scope);
  if (!keys) {
    keys = new Set<string>();
    seenKeys.set(scope, keys);
  }
  if (keys.has(key)) return true;
  keys.add(key);
  return false;
}

export function deduplicate<T extends { title?: unknown; provider?: unknown }>(items: T[], scope = "global"): T[] {
  return items.filter((item) => !isDuplicate(String(item.title || ""), String(item.provider || ""), scope));
}

export function resetDedup(): void {
  seenKeys.clear();
}
