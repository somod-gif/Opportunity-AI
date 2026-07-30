"use server";

import { db } from "@/lib/db";
import { opportunities, applications, agentMemories, agentMissions } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── OPPORTUNITIES ───

export async function createOpportunity(data: {
  title: string; type: string; provider: string; description: string;
  eligibilityCriteria: string; deadline?: string; location?: string;
  isRemote?: boolean; applicationUrl?: string; tags?: string[];
}) {
  try {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
    await db.insert(opportunities).values({
      title: data.title,
      slug,
      type: data.type as any,
      provider: data.provider,
      description: data.description,
      eligibilityCriteria: data.eligibilityCriteria,
      deadline: data.deadline ? new Date(data.deadline) : null,
      location: data.location || null,
      isRemote: data.isRemote ?? false,
      applicationUrl: data.applicationUrl || null,
      tags: data.tags || null,
      isActive: true,
    });
    revalidatePath("/workspace/[sessionId]");
    return { success: true, data: null };
  } catch (e) { return { success: false, error: String(e) }; }
}

export async function updateOpportunity(id: string, data: Partial<{
  title: string; type: string; provider: string; description: string;
  eligibilityCriteria: string; deadline: string; location: string;
  isRemote: boolean; applicationUrl: string; tags: string[]; isActive: boolean;
}>) {
  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.eligibilityCriteria !== undefined) updateData.eligibilityCriteria = data.eligibilityCriteria;
    if (data.deadline !== undefined) updateData.deadline = new Date(data.deadline);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.isRemote !== undefined) updateData.isRemote = data.isRemote;
    if (data.applicationUrl !== undefined) updateData.applicationUrl = data.applicationUrl;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    await db.update(opportunities).set(updateData as any).where(eq(opportunities.id, id));
    revalidatePath("/workspace/[sessionId]");
    return { success: true, data: null };
  } catch (e) { return { success: false, error: String(e) }; }
}

export async function deleteOpportunity(id: string) {
  try {
    await db.delete(opportunities).where(eq(opportunities.id, id));
    revalidatePath("/workspace/[sessionId]");
    return { success: true, data: null };
  } catch (e) { return { success: false, error: String(e) }; }
}

// ─── APPLICATIONS ───

export async function createApplication(data: {
  sessionId: string; opportunityId: string; status?: string; notes?: string; deadline?: string;
}) {
  try {
    await db.insert(applications).values({
      sessionId: data.sessionId,
      opportunityId: data.opportunityId as any,
      status: (data.status || "saved") as any,
      notes: data.notes || null,
      deadline: data.deadline ? new Date(data.deadline) : null,
    });
    revalidatePath("/workspace/[sessionId]");
    return { success: true, data: null };
  } catch (e) { return { success: false, error: String(e) }; }
}

export async function updateApplication(id: string, data: Partial<{
  status: string; notes: string; deadline: string; documentsGenerated: unknown;
}>) {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.deadline) updateData.deadline = new Date(data.deadline);
    if (data.documentsGenerated !== undefined) updateData.documentsGenerated = data.documentsGenerated;
    await db.update(applications).set(updateData as any).where(eq(applications.id, id));
    revalidatePath("/workspace/[sessionId]");
    return { success: true, data: null };
  } catch (e) { return { success: false, error: String(e) }; }
}

export async function deleteApplication(id: string) {
  try {
    await db.delete(applications).where(eq(applications.id, id));
    revalidatePath("/workspace/[sessionId]");
    return { success: true, data: null };
  } catch (e) { return { success: false, error: String(e) }; }
}

// ─── MEMORIES ───

export async function updateMemory(id: string, data: Partial<{
  key: string; value: string; memoryType: string; importance: number;
}>) {
  try {
    const updateData: Record<string, unknown> = { lastAccessed: new Date() };
    if (data.key !== undefined) updateData.key = data.key;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.memoryType !== undefined) updateData.memoryType = data.memoryType;
    if (data.importance !== undefined) updateData.importance = data.importance;
    await db.update(agentMemories).set(updateData as any).where(eq(agentMemories.id, id));
    revalidatePath("/memory/[sessionId]");
    return { success: true, data: null };
  } catch (e) { return { success: false, error: String(e) }; }
}

export async function deleteMemory(id: string) {
  try {
    await db.delete(agentMemories).where(eq(agentMemories.id, id));
    revalidatePath("/memory/[sessionId]");
    return { success: true, data: null };
  } catch (e) { return { success: false, error: String(e) }; }
}

// ─── MISSIONS ───

export async function updateMission(id: string, data: Partial<{
  goal: string; status: string;
}>) {
  try {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.goal !== undefined) updateData.goal = data.goal;
    if (data.status !== undefined) updateData.status = data.status;
    await db.update(agentMissions).set(updateData as any).where(eq(agentMissions.id, id));
    revalidatePath("/dashboard/[sessionId]");
    return { success: true, data: null };
  } catch (e) { return { success: false, error: String(e) }; }
}

export async function deleteMission(id: string) {
  try {
    await db.delete(agentMissions).where(eq(agentMissions.id, id));
    revalidatePath("/");
    return { success: true, data: null };
  } catch (e) { return { success: false, error: String(e) }; }
}
