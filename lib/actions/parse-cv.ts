"use server";

export async function parseCVText(cvText: string): Promise<{
  success: boolean;
  data?: {
    name?: string;
    education?: string;
    skills?: string[];
    careerGoal?: string;
    experienceLevel?: string;
    summary?: string;
  };
  error?: string;
}> {
  try {
    const { getProvider } = await import("@/lib/ai/registry");
    const provider = getProvider();

    const prompt = `Parse this CV/resume text and extract structured information.

CV TEXT:
${cvText.slice(0, 8000)}

Return JSON:
{
  "name": "Full name of the person",
  "education": "Highest degree and field (e.g. BSc Computer Science)",
  "skills": ["skill1", "skill2", "skill3", ...],
  "careerGoal": "Their stated career objective or target role",
  "experienceLevel": "entry" | "mid" | "senior" | "lead" | "executive",
  "summary": "One-sentence professional summary"
}

Only include fields you can extract with reasonable confidence. Return valid JSON.`;

    const result = await provider.generateJSON<{
      name?: string;
      education?: string;
      skills?: string[];
      careerGoal?: string;
      experienceLevel?: string;
      summary?: string;
    }>("parse-cv", prompt);

    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
