import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { eq, and, or, ilike, inArray, lte, gte, sql, type SQL } from "drizzle-orm";
import type { Opportunity } from "@/lib/types";

interface SearchParams {
  types?: string[];
  keywords?: string | string[];
  country?: string;
  deadlineBefore?: string;
  deadlineAfter?: string;
  provider?: string;
  limit?: number;
  offset?: number;
  experienceLevel?: string;
  isRemote?: boolean;
}

export async function searchOpportunities(params: SearchParams): Promise<Opportunity[]> {
  const conditions = [eq(opportunities.isActive, true)];
  const keywords = Array.isArray(params.keywords) ? params.keywords : params.keywords ? [params.keywords] : undefined;

  if (params.types?.length) {
    conditions.push(inArray(opportunities.type, params.types as typeof opportunities.type.enumValues));
  }

  if (keywords?.length) {
    const keywordConditions = keywords.map((k) =>
      or(
        ilike(opportunities.title, `%${k}%`),
        ilike(opportunities.description, `%${k}%`),
      )
    );
    const validConditions: SQL<unknown>[] = [];
    for (const c of keywordConditions) {
      if (c != null) validConditions.push(c);
    }
    if (validConditions.length > 0) {
      conditions.push(or(...validConditions)!);
    }
  }

  if (params.country) {
    conditions.push(
      or(
        ilike(opportunities.location, `%${params.country}%`),
        eq(opportunities.isRemote, true)
      )!
    );
  }

  if (params.deadlineBefore) {
    conditions.push(lte(opportunities.deadline, new Date(params.deadlineBefore)));
  }

  if (params.deadlineAfter) {
    conditions.push(gte(opportunities.deadline, new Date(params.deadlineAfter)));
  }

  if (params.provider) {
    conditions.push(ilike(opportunities.provider, `%${params.provider}%`));
  }

  if (params.experienceLevel) {
    conditions.push(eq(opportunities.experienceLevel, params.experienceLevel));
  }

  if (params.isRemote !== undefined) {
    conditions.push(eq(opportunities.isRemote, params.isRemote));
  }

  const results = await db
    .select()
    .from(opportunities)
    .where(and(...conditions))
    .limit(params.limit ?? 20)
    .offset(params.offset ?? 0);

  return results.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    type: r.type as Opportunity["type"],
    provider: r.provider,
    description: r.description,
    eligibilityCriteria: r.eligibilityCriteria,
    benefits: r.benefits ?? undefined,
    applicationUrl: r.applicationUrl ?? undefined,
    deadline: r.deadline?.toISOString() ?? undefined,
    location: r.location ?? undefined,
    isRemote: r.isRemote ?? false,
    targetAudience: r.targetAudience ?? [],
    requiredSkills: r.requiredSkills ?? [],
    preferredSkills: r.preferredSkills ?? [],
    experienceLevel: r.experienceLevel ?? undefined,
    tags: r.tags ?? [],
    isActive: r.isActive ?? true,
    createdAt: r.createdAt?.toISOString() ?? "",
    updatedAt: r.updatedAt?.toISOString() ?? "",
  }));
}

export async function countOpportunities(params: SearchParams): Promise<number> {
  const conditions = [eq(opportunities.isActive, true)];
  const keywords = Array.isArray(params.keywords) ? params.keywords : params.keywords ? [params.keywords] : undefined;

  if (params.types?.length) {
    conditions.push(inArray(opportunities.type, params.types as typeof opportunities.type.enumValues));
  }

  if (keywords?.length) {
    const keywordConditions = keywords.map((k) =>
      or(
        ilike(opportunities.title, `%${k}%`),
        ilike(opportunities.description, `%${k}%`),
      )
    );
    const validConditions: SQL<unknown>[] = [];
    for (const c of keywordConditions) {
      if (c != null) validConditions.push(c);
    }
    if (validConditions.length > 0) {
      conditions.push(or(...validConditions)!);
    }
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(opportunities)
    .where(and(...conditions));

  return Number(result[0]?.count ?? 0);
}
