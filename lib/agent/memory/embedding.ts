const GOOGLE_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

interface EmbeddingResponse {
  embedding?: {
    values?: number[];
  };
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || "";
  if (!apiKey) return fallbackEmbedding(text);

  try {
    const res = await fetch(`${GOOGLE_EMBEDDING_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: text.slice(0, 2000) }] },
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as EmbeddingResponse;
      if (data.embedding?.values?.length) {
        return data.embedding.values;
      }
    }
  } catch {
    // embedding failed, use fallback
  }
  return fallbackEmbedding(text);
}

function fallbackEmbedding(text: string): number[] {
  const dims = 128;
  const vec: number[] = [];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  for (let i = 0; i < dims; i++) {
    const seed = hash * (i + 1) * 2654435761;
    vec.push(Math.tanh(seed / 1e9));
  }
  return vec;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
