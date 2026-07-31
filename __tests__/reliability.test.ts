import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeDeadline, isLikelyUrl } from "../lib/agent/tools/validate";
import { groundFitScore, validateExtractedDeadline, normalizeType, slugify, withTimeout } from "../lib/import/analyzer";
import type { ExtractedOpportunity, EvaluationResult } from "../lib/import/types";

test("sanitizeDeadline never fabricates a deadline", () => {
  assert.equal(sanitizeDeadline(null).deadline, null);
  assert.equal(sanitizeDeadline(undefined).deadline, null);
  assert.equal(sanitizeDeadline("").deadline, null);
  assert.equal(sanitizeDeadline("   ").deadline, null);
  assert.equal(sanitizeDeadline(undefined).deadlineSource, "unknown");
});

test("sanitizeDeadline keeps a stated ISO date", () => {
  const result = sanitizeDeadline("2026-11-15");
  assert.ok(result.deadline);
  assert.equal(result.deadlineSource, "stated");
  assert.equal(new Date(result.deadline!).getUTCFullYear(), 2026);
});

test("sanitizeDeadline rejects ambiguous bare years and garbage", () => {
  assert.equal(sanitizeDeadline("2026").deadline, null);
  assert.equal(sanitizeDeadline("rolling").deadline, null);
  assert.equal(sanitizeDeadline("as soon as possible").deadline, null);
  assert.equal(sanitizeDeadline("not a date").deadlineSource, "unknown");
});

test("validateExtractedDeadline keeps text but rejects past/bare-year dates", () => {
  const bare = validateExtractedDeadline("2026");
  assert.equal(bare.deadline, null);
  assert.equal(bare.deadlineText, "2026");

  const past = validateExtractedDeadline("2020-01-01");
  assert.equal(past.deadline, null);
  assert.equal(past.deadlineText, "2020-01-01");

  const valid = validateExtractedDeadline("2027-03-31");
  assert.ok(valid.deadline);
  assert.equal(valid.deadlineText, "2027-03-31");

  assert.equal(validateExtractedDeadline(null).deadline, null);
  assert.equal(validateExtractedDeadline(null).deadlineText, null);
});

test("isLikelyUrl accepts http/https only", () => {
  assert.equal(isLikelyUrl("https://daad.de/scholarships"), true);
  assert.equal(isLikelyUrl("http://example.com"), true);
  assert.equal(isLikelyUrl("daad.de/scholarships"), false);
  assert.equal(isLikelyUrl("javascript:alert(1)"), false);
  assert.equal(isLikelyUrl(""), false);
});

test("groundFitScore caps scores without eligibility evidence", () => {
  const extraction: ExtractedOpportunity = {
    title: "Test", provider: "P", type: "scholarship", description: "", eligibilityCriteria: "",
    benefits: null, applicationUrl: null, deadline: null, deadlineText: null, location: null,
    isRemote: false, targetAudience: [], requiredSkills: [], preferredSkills: [],
    experienceLevel: null, tags: [], fundingDetails: null,
  };
  const evaluation: EvaluationResult = {
    fitScore: 95,
    verdict: "strong",
    summary: "Looks great",
    reasons: [],
    eligibilityChecklist: [],
  };
  const grounded = groundFitScore(evaluation, extraction, { skills: [] });
  assert.equal(grounded.fitScore, 55);
  assert.equal(grounded.grounded, false);
  assert.ok(grounded.reasons.some((r) => r.includes("capped")));
});

test("groundFitScore blends checklist evidence with AI score", () => {
  const extraction: ExtractedOpportunity = {
    title: "Test", provider: "P", type: "scholarship", description: "", eligibilityCriteria: "",
    benefits: null, applicationUrl: null, deadline: null, deadlineText: null, location: null,
    isRemote: false, targetAudience: [], requiredSkills: ["python", "ml"], preferredSkills: [],
    experienceLevel: null, tags: [], fundingDetails: null,
  };
  const evaluation: EvaluationResult = {
    fitScore: 60,
    verdict: "possible",
    summary: "Decent",
    reasons: [],
    eligibilityChecklist: [
      { item: "African citizen", met: true, note: "" },
      { item: "MSc admission", met: true, note: "" },
      { item: "2 years experience", met: false, note: "" },
    ],
  };
  const grounded = groundFitScore(evaluation, extraction, { skills: ["python", "pytorch"] });
  assert.equal(grounded.grounded, true);
  assert.ok(grounded.fitScore >= 50 && grounded.fitScore <= 90, `fitScore ${grounded.fitScore} in plausible range`);
  assert.ok(grounded.reasons.some((r) => r.includes("2 of 3")));
  assert.ok(grounded.reasons.some((r) => r.includes("Skills overlap")));
});

test("groundFitScore lower evidence still caps at 55 when nothing checkable", () => {
  const extraction: ExtractedOpportunity = {
    title: "T", provider: "P", type: "scholarship", description: "", eligibilityCriteria: "",
    benefits: null, applicationUrl: null, deadline: null, deadlineText: null, location: null,
    isRemote: false, targetAudience: [], requiredSkills: [], preferredSkills: [],
    experienceLevel: null, tags: [], fundingDetails: null,
  };
  const grounded = groundFitScore({ fitScore: 12, verdict: "unlikely", summary: "", reasons: [], eligibilityChecklist: [] }, extraction, {});
  assert.ok(grounded.fitScore <= 55);
});

test("normalizeType maps variants to canonical types", () => {
  assert.equal(normalizeType("scholarship"), "scholarship");
  assert.equal(normalizeType("Fully funded"), "scholarship");
  assert.equal(normalizeType("bursary"), "scholarship");
  assert.equal(normalizeType("intern"), "internship");
  assert.equal(normalizeType("fellowships"), "fellowship");
  assert.equal(normalizeType("hackathon"), "hackathon");
  assert.equal(normalizeType(""), "scholarship");
});

test("slugify produces URL-safe slugs", () => {
  assert.equal(slugify("DAAD Scholarship Database"), "daad-scholarship-database");
  assert.equal(slugify("  Spaces & Symbols!! "), "spaces-symbols");
  assert.equal(slugify(""), "");
});

test("withTimeout resolves the fast promise and applies fallback on timeout", async () => {
  const fast = await withTimeout(() => Promise.resolve("fast"), 500, "slow");
  assert.equal(fast, "fast");
  const slow = await withTimeout(() => new Promise((r) => setTimeout(() => r("late"), 200)), 50, "fallback");
  assert.equal(slow, "fallback");
});

test("withTimeout aborts the underlying work on timeout", async () => {
  let aborted = false;
  await withTimeout(
    (signal) => new Promise<void>((resolve) => {
      signal.addEventListener("abort", () => { aborted = true; resolve(); });
      setTimeout(resolve, 300);
    }),
    50,
    undefined
  );
  assert.equal(aborted, true);
});
