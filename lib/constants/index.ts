export const OPPORTUNITY_TYPES = [
  "scholarship",
  "fellowship",
  "job",
  "internship",
  "grant",
  "accelerator",
  "competition",
  "conference",
  "research",
  "hackathon",
  "bootcamp",
  "exchange",
] as const;

export const MEMORY_TYPES = ["episodic", "semantic", "procedural"] as const;

export const AGENT_PHASES = [
  "idle",
  "perceive",
  "reason",
  "plan",
  "tool_select",
  "tool_execute",
  "observe",
  "reflect",
  "memory",
  "complete",
  "error",
] as const;

export const DOCUMENT_TYPES = [
  "cover-letter",
  "personal-statement",
  "resume",
  "checklist",
] as const;

export const APPLICATION_STATUSES = [
  "saved",
  "drafting",
  "submitted",
  "accepted",
  "rejected",
  "missed",
] as const;

export const REMINDER_TYPES = ["deadline", "follow_up", "document"] as const;

export const EDUCATION_LEVELS = [
  { value: "high_school", label: "High School" },
  { value: "undergraduate", label: "Undergraduate Student" },
  { value: "graduate", label: "Graduate Student (Masters/PhD)" },
  { value: "recent_graduate", label: "Recent Graduate" },
  { value: "professional", label: "Working Professional" },
  { value: "self_taught", label: "Self-Taught / No Formal Education" },
] as const;

export const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
  "Cameroon", "Cape Verde", "Central African Republic", "Chad", "Comoros",
  "Congo", "Democratic Republic of the Congo", "Djibouti", "Egypt",
  "Equatorial Guinea", "Eritrea", "Ethiopia", "Gabon", "Gambia", "Ghana",
  "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia",
  "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius",
  "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda",
  "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone",
  "Somalia", "South Africa", "South Sudan", "Sudan", "Swaziland",
  "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
] as const;

export const COMPETITIVENESS_LEVELS = ["low", "medium", "high"] as const;

export const EXPERIENCE_LEVELS = ["entry", "mid", "senior"] as const;

export const CAREER_STAGES = [
  "student",
  "early-career",
  "mid-career",
  "transitioning",
] as const;

export const EXAMPLE_MISSIONS = [
  "I am a Nigerian Computer Science student looking for fully-funded AI scholarships in Canada",
  "I need AI/ML internships in Europe for summer 2027",
  "I want a fully-funded Masters in Data Science anywhere in the world",
  "I am a Kenyan engineering graduate looking for tech fellowships",
  "I need conference funding for research in renewable energy",
  "I am a South African developer seeking a software engineering role in the US",
] as const;

export const SKILL_SUGGESTIONS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js", "Machine Learning",
  "Data Science", "Artificial Intelligence", "Research", "Communication",
  "Leadership", "Project Management", "Public Speaking", "Writing",
  "Java", "C++", "Go", "Rust", "SQL", "DevOps", "Cloud Computing",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "TensorFlow", "PyTorch",
  "NLP", "Computer Vision", "Statistics", "Database Design", "API Design",
] as const;
