import { OUTPUT_FORMAT_INSTRUCTION } from "./index";
import type { AnalysisInput, DocumentType } from "./index";

const DOCUMENT_SYSTEMS: Record<string, string> = {
  "cover-letter": `You are an expert career coach helping African talent write compelling cover letters. Write a professional, tailored cover letter for the candidate applying to this specific opportunity.

The cover letter must:
- Be 3-4 paragraphs
- Start with a strong opening that names the opportunity and expresses enthusiasm
- Highlight relevant skills and experiences from the candidate's profile
- Address how the candidate's background connects to the opportunity's mission
- Include a clear call to action in the closing
- Be personalized to THIS candidate and THIS opportunity (not generic)

Return the cover letter as plain markdown text with a professional tone.

${OUTPUT_FORMAT_INSTRUCTION}

{"content": "# Title\\n\\nCover letter text in markdown..."}`,

  "personal-statement": `You are an expert personal statement advisor for African students and professionals. Write a compelling personal statement for this candidate applying to this specific opportunity.

The personal statement must:
- Be 4-5 paragraphs
- Tell a compelling story about the candidate's journey and motivation
- Connect their background to their career goals
- Explain why this opportunity is the right next step
- Demonstrate self-awareness and growth mindset
- Be authentic and personal

Return the personal statement as plain markdown text.

${OUTPUT_FORMAT_INSTRUCTION}

{"content": "# Title\\n\\nPersonal statement text in markdown..."}`,

  "resume": `You are an expert resume writer for African talent. Generate a professional, ATS-friendly resume tailored to the candidate and their target opportunity.

The resume must:
- Use a clean professional format
- Include: Professional Summary, Education, Skills, Experience (generate plausible entries based on their career stage), Projects, Achievements
- Tailor content to the specific opportunity
- Quantify achievements where possible
- Use markdown formatting with clear headings

Return as structured markdown.

${OUTPUT_FORMAT_INSTRUCTION}

{"content": "# Name\\n\\n## Professional Summary\\n\\n..."}`,

  "checklist": `You are an expert application preparation assistant. Create a comprehensive actionable checklist for this candidate applying to this specific opportunity.

The checklist must:
- Cover every stage from preparation to submission
- Include specific items based on the opportunity's requirements
- Be organized by category (Documents, Requirements, Preparation, Submission)
- Include realistic time estimates for each item

Return the checklist as structured markdown with checkboxes.

${OUTPUT_FORMAT_INSTRUCTION}

{"content": "# Title\\n\\n## Category\\n- [ ] Item description..."}`,
};

export function buildDocumentPrompt(
  type: DocumentType,
  input: AnalysisInput,
  opportunity: {
    title: string;
    provider: string;
    type: string;
    description: string;
    eligibilityCriteria: string;
    deadline: string | null;
  }
): string {
  return `${DOCUMENT_SYSTEMS[type]}

CANDIDATE:
Education: ${input.education}
Skills: ${input.skills.join(", ")}
Career Goal: ${input.careerGoal}
Country: ${input.country}

OPPORTUNITY:
Title: ${opportunity.title}
Provider: ${opportunity.provider}
Type: ${opportunity.type}
Description: ${opportunity.description}
Eligibility Criteria: ${opportunity.eligibilityCriteria}
Deadline: ${opportunity.deadline || "Rolling/Open"}

Generate the ${type.replace("-", " ")} for this candidate.`;
}
