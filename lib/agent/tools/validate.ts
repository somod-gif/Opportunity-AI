export interface UrlCheckResult {
  ok: boolean;
  status: number | null;
  checkedAt: string;
}

export interface DeadlineInfo {
  deadline: string | null;
  deadlineSource: "stated" | "unknown";
}

export function isLikelyUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeDeadline(raw: unknown): DeadlineInfo {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { deadline: null, deadlineSource: "unknown" };
  }
  const trimmed = raw.trim();
  if (/^\d{4}$/.test(trimmed)) {
    return { deadline: null, deadlineSource: "unknown" };
  }
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return { deadline: date.toISOString(), deadlineSource: "stated" };
  }
  const isoMatch = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const parsed = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`);
    if (!Number.isNaN(parsed.getTime())) {
      return { deadline: parsed.toISOString(), deadlineSource: "stated" };
    }
  }
  return { deadline: null, deadlineSource: "unknown" };
}

export async function verifyUrl(url: string, timeoutMs = 7000): Promise<UrlCheckResult> {
  if (!isLikelyUrl(url)) {
    return { ok: false, status: null, checkedAt: new Date().toISOString() };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OpportunityAI/1.0; +opportunity-ai.vercel.app)" },
    });
    return { ok: res.ok, status: res.status, checkedAt: new Date().toISOString() };
  } catch {
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; OpportunityAI/1.0; +opportunity-ai.vercel.app)", Range: "bytes=0-2048" },
      });
      return { ok: res.ok, status: res.status, checkedAt: new Date().toISOString() };
    } catch {
      return { ok: false, status: null, checkedAt: new Date().toISOString() };
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function verifyUrls(
  urls: string[],
  timeoutMs = 7000
): Promise<Map<string, UrlCheckResult>> {
  const results = new Map<string, UrlCheckResult>();
  const unique = [...new Set(urls.filter(isLikelyUrl))];
  await Promise.allSettled(
    unique.map(async (u) => {
      results.set(u, await verifyUrl(u, timeoutMs));
    })
  );
  return results;
}
