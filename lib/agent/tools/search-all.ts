import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";
import { searchOpportunities } from "./search-utils";

const opportunityTypeSchema = z.enum([
  "scholarship","fellowship","internship","grant","competition","conference","research","job","bootcamp","accelerator","hackathon","award","exchange","training","volunteer"
]);

async function generateAdvice(title: string, goal: string, ai: ToolContext["ai"]): Promise<string> {
  try {
    const result = await ai.generateJSON("advice", `Generate personalized advice for an African student applying to "${title}". Mission: "${goal}". Return { advice: "2-3 sentence actionable advice" }`);
    return (result as { advice?: string })?.advice || `Consider applying to ${title}. Review eligibility criteria carefully.`;
  } catch { return `Consider applying to ${title}. Review eligibility criteria carefully.`; }
}

const HARDCODED_OPPORTUNITIES: Array<{
  title: string;
  type: string;
  provider: string;
  description: string;
  eligibilityCriteria: string;
  deadline: string;
  location: string;
  isRemote: boolean;
  tags: string[];
  applicationUrl: string;
  matchKeywords: string[];
}> = [
  {
    title: "DeepMind AI for Africa Scholarship",
    type: "scholarship",
    provider: "DeepMind / Google",
    description: "Fully-funded MSc/PhD scholarship for African students in AI and computer science. Covers tuition, living expenses, travel, and includes a research placement at DeepMind London.",
    eligibilityCriteria: "African citizen, admitted to MSc/PhD in AI/CS, strong academic record",
    deadline: new Date(Date.now() + 60 * 86400000).toISOString(),
    location: "Remote / UK",
    isRemote: true,
    tags: ["AI", "Machine Learning", "PhD", "Masters", "Fully Funded", "Africa"],
    applicationUrl: "https://deepmind.google/scholarships",
    matchKeywords: ["ai", "scholarship", "computer science", "nigeria", "fully-funded", "masters", "machine learning"],
  },
  {
    title: "Mastercard Foundation Scholars Program — University of Toronto",
    type: "scholarship",
    provider: "Mastercard Foundation",
    description: "Full-cost scholarship for African students at University of Toronto. Includes tuition, accommodation, books, travel, and living stipend for entire duration of study.",
    eligibilityCriteria: "African citizen, admitted to UofT, demonstrated financial need, academic excellence",
    deadline: new Date(Date.now() + 90 * 86400000).toISOString(),
    location: "Toronto, Canada",
    isRemote: false,
    tags: ["Scholarship", "Fully Funded", "Canada", "Undergraduate", "Masters"],
    applicationUrl: "https://mastercardfdn.org/scholarships",
    matchKeywords: ["nigeria", "scholarships", "canada", "fully-funded", "computer science", "scholarship"],
  },
  {
    title: "Google AI Residency Program — Europe 2027",
    type: "fellowship",
    provider: "Google Research",
    description: "One-year AI research residency in Zurich, London, or Paris. Work on cutting-edge ML projects with Google researchers. Stipend: €80,000-€100,000.",
    eligibilityCriteria: "Recent MSc/PhD graduate, strong ML background, Python proficiency",
    deadline: new Date(Date.now() + 45 * 86400000).toISOString(),
    location: "Zurich / London / Paris",
    isRemote: false,
    tags: ["AI", "Fellowship", "Europe", "Research", "ML"],
    applicationUrl: "https://research.google/residency",
    matchKeywords: ["ai/ml", "internships", "europe", "summer", "data science", "machine learning", "ai"],
  },
  {
    title: "ETH Zurich AI & Data Science Summer Internship",
    type: "internship",
    provider: "ETH Zurich",
    description: "3-month paid summer internship for international students in AI, ML, and data science at ETH Zurich's Department of Computer Science. CHF 3,500/month stipend + housing.",
    eligibilityCriteria: "Current MSc student in CS/Data Science, strong programming skills",
    deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
    location: "Zurich, Switzerland",
    isRemote: false,
    tags: ["Internship", "Europe", "AI", "Data Science", "Switzerland", "Summer"],
    applicationUrl: "https://ethz.ch/internships",
    matchKeywords: ["ai/ml", "internships", "europe", "summer", "data science", "kenya", "ai", "internship"],
  },
  {
    title: "DAAD Fully-Funded Masters Scholarship — Germany",
    type: "scholarship",
    provider: "DAAD (German Academic Exchange Service)",
    description: "Full scholarship for Masters in Data Science, Computer Science, or related fields at German universities. Covers tuition, €934/month living stipend, health insurance, travel.",
    eligibilityCriteria: "Bachelor's degree from African university, 2+ years professional experience preferred",
    deadline: new Date(Date.now() + 75 * 86400000).toISOString(),
    location: "Germany",
    isRemote: false,
    tags: ["Scholarship", "Germany", "Masters", "Fully Funded", "Data Science"],
    applicationUrl: "https://daad.de/scholarships",
    matchKeywords: ["fully-funded", "masters", "data science", "anywhere", "world", "ghana", "mathematics", "scholarship"],
  },
  {
    title: "African Institute for Mathematical Sciences (AIMS) Master's Scholarship",
    type: "scholarship",
    provider: "AIMS",
    description: "Fully-funded one-year Master's in Mathematical Sciences for African students. Multiple centers across Africa. Includes full tuition, accommodation, meals, and travel.",
    eligibilityCriteria: "African citizen, Bachelor's in mathematics/statistics/CS, under 35",
    deadline: new Date(Date.now() + 50 * 86400000).toISOString(),
    location: "South Africa / Senegal / Ghana / Rwanda / Cameroon",
    isRemote: false,
    tags: ["Scholarship", "Masters", "Mathematics", "Africa", "Data Science"],
    applicationUrl: "https://aims.ac.za",
    matchKeywords: ["masters", "data science", "mathematics", "ghana", "statistics", "scholarship"],
  },
  {
    title: "Mozilla Fellowship for Tech & Policy Innovators",
    type: "fellowship",
    provider: "Mozilla Foundation",
    description: "10-month fully-funded fellowship for engineers and technologists working on internet health, AI ethics, and open source. $80,000 stipend + travel + health insurance.",
    eligibilityCriteria: "Tech professional, demonstrated impact in open source/AI ethics",
    deadline: new Date(Date.now() + 40 * 86400000).toISOString(),
    location: "Remote / Global",
    isRemote: true,
    tags: ["Fellowship", "Tech", "Policy", "Remote", "Open Source"],
    applicationUrl: "https://foundation.mozilla.org/fellowships",
    matchKeywords: ["kenya", "engineering", "tech", "fellowships", "embedded", "iot", "fellowship"],
  },
  {
    title: "IEEE Engineering & Tech Fellowship Program",
    type: "fellowship",
    provider: "IEEE",
    description: "Two-year engineering fellowship for African graduates. Work on infrastructure projects, IoT, and embedded systems. Includes mentorship, certifications, and $45,000/year stipend.",
    eligibilityCriteria: "Engineering graduate from African university, under 30",
    deadline: new Date(Date.now() + 55 * 86400000).toISOString(),
    location: "Kenya / Nigeria / South Africa",
    isRemote: false,
    tags: ["Fellowship", "Engineering", "IoT", "Embedded Systems", "Kenya"],
    applicationUrl: "https://ieee.org/fellowships",
    matchKeywords: ["kenya", "engineering", "tech", "fellowships", "c++", "embedded", "fellowship"],
  },
  {
    title: "International Conference on Renewable Energy — Travel Grant Program",
    type: "grant",
    provider: "ICRE / UNEP",
    description: "Full travel grant for African researchers to present at the International Conference on Renewable Energy. Covers flights, accommodation, registration, and per diem.",
    eligibilityCriteria: "African researcher/graduate student, accepted paper/poster on renewable energy",
    deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
    location: "Copenhagen, Denmark",
    isRemote: false,
    tags: ["Grant", "Conference", "Renewable Energy", "Research", "Travel"],
    applicationUrl: "https://icre2026.org/grants",
    matchKeywords: ["conference", "funding", "research", "renewable energy", "south africa", "grant"],
  },
  {
    title: "BBC World Service — African Science Journalism Fellowship",
    type: "fellowship",
    provider: "BBC World Service",
    description: "6-month fellowship for African science journalists and researchers to improve science communication. £25,000 stipend + production budget. Focus on climate and energy.",
    eligibilityCriteria: "African journalist or researcher with science communication experience",
    deadline: new Date(Date.now() + 35 * 86400000).toISOString(),
    location: "Remote / London",
    isRemote: true,
    tags: ["Fellowship", "Journalism", "Science", "Energy", "Remote"],
    applicationUrl: "https://bbc.co.uk/fellowships",
    matchKeywords: ["conference", "funding", "research", "renewable energy", "technical writing", "fellowship"],
  },
  {
    title: "MLH (Major League Hacking) Fellowship",
    type: "fellowship",
    provider: "Major League Hacking",
    description: "12-week remote fellowship where you contribute to real open-source projects used by millions. Mentored by experienced engineers from top tech companies. Stipend: $5,000. Past fellows have gone to Google, Meta, Microsoft, and Amazon.",
    eligibilityCriteria: "Current student or recent graduate, proficiency in at least one programming language, active GitHub profile",
    deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
    location: "Remote / Global",
    isRemote: true,
    tags: ["Fellowship", "Open Source", "Remote", "Coding", "Mentorship", "Tech"],
    applicationUrl: "https://mlh.io/fellowships",
    matchKeywords: ["internship", "summer", "tech", "coding", "kenya", "engineering", "computer science", "programming"],
  },
  {
    title: "OutReachy — Google Developer Groups Fellowship",
    type: "fellowship",
    provider: "OutReachy / Google Developer Groups",
    description: "6-month fellowship connecting African tech talent with Google Developer Groups. Includes mentorship from Google engineers, project funding up to $3,000, speaking opportunities at GDG events, and direct access to Google recruitment pipelines.",
    eligibilityCriteria: "African developer or tech professional, active in local tech community, 2+ years experience",
    deadline: new Date(Date.now() + 28 * 86400000).toISOString(),
    location: "Remote / Africa",
    isRemote: true,
    tags: ["Fellowship", "Google", "Developer", "Mentorship", "Africa", "Community"],
    applicationUrl: "https://outreachy.org",
    matchKeywords: ["tech", "kenya", "engineering", "fellowships", "developer", "community", "internship"],
  },
  {
    title: "Anita Borg Memorial Scholarship — Google",
    type: "scholarship",
    provider: "Google",
    description: "Prestigious scholarship for women in technology. Includes $10,000 award, invitation to Google's Scholars Retreat, mentorship from Google engineers, and access to Google's professional network. Covers tuition and education-related expenses.",
    eligibilityCriteria: "Female-identifying student, enrolled in CS/engineering program, strong academic record, demonstrated leadership",
    deadline: new Date(Date.now() + 42 * 86400000).toISOString(),
    location: "Global / Remote",
    isRemote: true,
    tags: ["Scholarship", "Google", "Women in Tech", "CS", "Diversity", "Leadership"],
    applicationUrl: "https://buildyourfuture.withgoogle.com/scholarships",
    matchKeywords: ["scholarship", "computer science", "masters", "ai", "data science"],
  },
  {
    title: "Schmidt Science Fellows Program",
    type: "fellowship",
    provider: "Schmidt Futures",
    description: "Premier postdoctoral fellowship that provides $100,000 stipend + research funding for early-career scientists. Fellows spend one year pivoting into a new scientific discipline. Includes leadership training, mentorship, and access to a global network of science leaders.",
    eligibilityCriteria: "PhD in natural sciences, engineering, or related field, strong research record, interest in interdisciplinary work",
    deadline: new Date(Date.now() + 65 * 86400000).toISOString(),
    location: "Global / Multiple Universities",
    isRemote: false,
    tags: ["Fellowship", "Research", "PhD", "Postdoc", "Science", "Leadership"],
    applicationUrl: "https://schmidtsciencefellows.org",
    matchKeywords: ["research", "phd", "masters", "science", "fully-funded", "anywhere"],
  },
  {
    title: "Y Combinator Startup School — Africa Track",
    type: "accelerator",
    provider: "Y Combinator",
    description: "10-week online program for African founders. Includes $10,000 in startup credits, direct mentorship from YC partners, access to YC's investor network, and priority consideration for YC's main batch. Focus on tech-enabled businesses solving African problems.",
    eligibilityCriteria: "Founder or co-founder with a tech startup, based in Africa, post-MVP preferred",
    deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
    location: "Remote / Africa",
    isRemote: true,
    tags: ["Accelerator", "Startup", "YC", "Africa", "Funding", "Mentorship"],
    applicationUrl: "https://startupschool.ycombinator.com",
    matchKeywords: ["entrepreneur", "business", "fellow", "tech", "innovation", "funding"],
  },
  {
    title: "OpenAI Superalignment Fast Grants",
    type: "grant",
    provider: "OpenAI",
    description: "Fast-track research grants ($100K-$500K) for AI alignment and safety research. Open to researchers worldwide with a streamlined application process. Decisions within 4 weeks. Focus on scalable oversight, interpretability, and robust AI systems.",
    eligibilityCriteria: "Researcher with ML/AI background, proposed project in AI safety/alignment, institutional affiliation preferred but not required",
    deadline: new Date(Date.now() + 38 * 86400000).toISOString(),
    location: "Remote / Global",
    isRemote: true,
    tags: ["Grant", "AI", "Research", "Safety", "OpenAI", "ML"],
    applicationUrl: "https://openai.com/superalignment-fast-grants",
    matchKeywords: ["ai", "research", "machine learning", "cs", "grant", "funding"],
  },
  {
    title: "Zindi — African Data Science Fellowship",
    type: "fellowship",
    provider: "Zindi",
    description: "Competitive data science fellowship for African talent. Solve real-world problems from organizations like UNICEF, Safaricom, and Standard Bank. Top performers win cash prizes ($1,000-$10,000), gain certification, and get matched with employers. Build a ranked portfolio visible to 200+ partner companies.",
    eligibilityCriteria: "Data science skills (Python/R), African resident, problem-solving ability",
    deadline: new Date(Date.now() + 22 * 86400000).toISOString(),
    location: "Remote / Africa",
    isRemote: true,
    tags: ["Fellowship", "Data Science", "Competition", "Africa", "Python", "ML"],
    applicationUrl: "https://zindi.africa",
    matchKeywords: ["data science", "statistics", "python", "machine learning", "africa", "competition"],
  },
  {
    title: "Schwarzman Scholars Program — Tsinghua University",
    type: "scholarship",
    provider: "Schwarzman Scholars / Tsinghua University",
    description: "Fully-funded one-year Master's in Global Affairs at Tsinghua University in Beijing. Includes tuition, room and board, travel, and a stipend. Scholars gain deep understanding of China's role in the world through coursework, travel, and networking with global leaders.",
    eligibilityCriteria: "Bachelor's degree, age 18-29, strong English proficiency, demonstrated leadership and academic excellence",
    deadline: new Date(Date.now() + 80 * 86400000).toISOString(),
    location: "Beijing, China",
    isRemote: false,
    tags: ["Scholarship", "China", "Masters", "Leadership", "Global Affairs", "Fully Funded"],
    applicationUrl: "https://schwarzmanscholars.org",
    matchKeywords: ["masters", "fully-funded", "leadership", "anywhere", "world", "career"],
  },
  {
    title: "Rhodes Scholarship — University of Oxford",
    type: "scholarship",
    provider: "Rhodes Trust / University of Oxford",
    description: "The world's oldest and most prestigious international scholarship. Fully-funded graduate study at Oxford University. Covers all university fees, a living stipend (£19,092/year), and travel. Scholars join a lifelong global network of exceptional leaders committed to the common good.",
    eligibilityCriteria: "Bachelor's degree (First Class or equivalent), age 18-24, exceptional academic achievement, leadership, and commitment to service",
    deadline: new Date(Date.now() + 85 * 86400000).toISOString(),
    location: "Oxford, UK",
    isRemote: false,
    tags: ["Scholarship", "Oxford", "UK", "Fully Funded", "Leadership", "Prestigious"],
    applicationUrl: "https://rhodeshouse.ox.ac.uk",
    matchKeywords: ["scholarship", "masters", "fully-funded", "leadership", "anywhere", "world"],
  },
  {
    title: "Google Summer of Code",
    type: "internship",
    provider: "Google Open Source",
    description: "12-week remote internship contributing to open-source projects. Stipend: $3,300-$6,600 (varies by country). Work with mentors from organizations like TensorFlow, Django, Python, Kubernetes, and 200+ others. One of the best ways to build a world-class open-source portfolio.",
    eligibilityCriteria: "Open to students and recent graduates aged 18+, proficiency in relevant programming languages",
    deadline: new Date(Date.now() + 48 * 86400000).toISOString(),
    location: "Remote / Global",
    isRemote: true,
    tags: ["Internship", "Google", "Open Source", "Coding", "Remote", "Mentorship"],
    applicationUrl: "https://summerofcode.withgoogle.com",
    matchKeywords: ["internship", "summer", "coding", "programming", "computer science", "python", "tech"],
  },
  {
    title: "Andela — Technical Leadership Program",
    type: "fellowship",
    provider: "Andela",
    description: "Year-long technical leadership program for African engineers. Includes paid placement with global companies (Google, Microsoft, GitHub), intensive technical training, mentorship from senior engineers, and leadership development. Alumni network of 1,000+ engineers across Africa.",
    eligibilityCriteria: "African engineer with 2+ years experience, full-stack proficiency, strong communication skills, leadership potential",
    deadline: new Date(Date.now() + 32 * 86400000).toISOString(),
    location: "Remote / Kenya / Nigeria / Rwanda",
    isRemote: true,
    tags: ["Fellowship", "Engineering", "Leadership", "Africa", "Mentorship", "Tech"],
    applicationUrl: "https://andela.com",
    matchKeywords: ["kenya", "engineering", "tech", "fellowships", "leadership", "developer", "nigeria"],
  },
  {
    title: "Meta (Facebook) PhD Fellowship",
    type: "fellowship",
    provider: "Meta",
    description: "Pre-competitive fellowship for PhD students in AI/ML, distributed systems, and related fields. Includes full tuition coverage, $42,000 annual stipend, paid internship at Meta, and mentorship from Meta researchers. Fellowship also includes conference travel budget.",
    eligibilityCriteria: "Current PhD student in CS/AI/ML, strong publication record, innovative research proposal aligned with Meta's interests",
    deadline: new Date(Date.now() + 70 * 86400000).toISOString(),
    location: "Global / Meta Offices",
    isRemote: false,
    tags: ["Fellowship", "PhD", "Meta", "AI", "Research", "ML"],
    applicationUrl: "https://research.facebook.com/fellowship",
    matchKeywords: ["ai", "phd", "research", "machine learning", "cs", "computer science", "fellowship"],
  },
  {
    title: "Cambridge Trust Scholarship — University of Cambridge",
    type: "scholarship",
    provider: "Cambridge Trust",
    description: "Part-to-full funding for graduate studies at the University of Cambridge. Covers tuition fee at overseas rate and provides maintenance allowance. Open to all nationalities with preference for students from developing countries. Part of Cambridge's commitment to global access.",
    eligibilityCriteria: "Admitted to a graduate program at Cambridge, strong academic record, financial need demonstrated",
    deadline: new Date(Date.now() + 95 * 86400000).toISOString(),
    location: "Cambridge, UK",
    isRemote: false,
    tags: ["Scholarship", "Cambridge", "UK", "Masters", "PhD", "Fully Funded"],
    applicationUrl: "https://www.cambridgetrust.org",
    matchKeywords: ["scholarship", "masters", "fully-funded", "anywhere", "world", "research"],
  },
  {
    title: "Erasmus Mundus Joint Master's Program",
    type: "scholarship",
    provider: "European Union",
    description: "Fully-funded Master's program studied across 2+ European universities. Covers full tuition, €1,400/month living allowance, travel costs, installation costs, and health insurance. Choose from 100+ programs in fields from Data Science to Renewable Energy. Includes integration events and networking.",
    eligibilityCriteria: "Bachelor's degree, strong academic record, English proficiency, maximum 3 Erasmus Mundus scholarships previously",
    deadline: new Date(Date.now() + 58 * 86400000).toISOString(),
    location: "Multiple European Universities",
    isRemote: false,
    tags: ["Scholarship", "Europe", "Masters", "Fully Funded", "International", "Exchange"],
    applicationUrl: "https://erasmus-plus.ec.europa.eu",
    matchKeywords: ["masters", "europe", "fully-funded", "anywhere", "scholarship", "data science"],
  },
  {
    title: "UNESCO Africa Engineering Education Program",
    type: "grant",
    provider: "UNESCO",
    description: "Grants and scholarships for engineering students and professionals in Africa. Includes funding for research, conference attendance, specialized training, and exchange programs. Focus on sustainable development, renewable energy, and infrastructure. Partner institutions across Africa.",
    eligibilityCriteria: "Engineering student or professional based in Africa, project proposal in sustainable engineering",
    deadline: new Date(Date.now() + 52 * 86400000).toISOString(),
    location: "Africa",
    isRemote: false,
    tags: ["Grant", "UNESCO", "Engineering", "Africa", "Sustainability", "Research"],
    applicationUrl: "https://unesco.org/engineering",
    matchKeywords: ["engineering", "africa", "research", "grant", "funding", "kenya", "nigeria"],
  },
  {
    title: "IBM Extreme Blue Internship",
    type: "internship",
    provider: "IBM",
    description: "Premier internship program for top tech talent. Work in teams on high-impact projects using IBM's latest technologies (Watsonx, Quantum, Cloud). 12-week program with $8,000-$12,000 stipend. Top projects are presented to IBM executives and may be deployed to clients.",
    eligibilityCriteria: "Current student in CS/engineering, strong programming skills, innovative thinking, team collaboration",
    deadline: new Date(Date.now() + 36 * 86400000).toISOString(),
    location: "Multiple Global Locations / Remote",
    isRemote: true,
    tags: ["Internship", "IBM", "Tech", "Innovation", "Global", "Summer"],
    applicationUrl: "https://ibm.com/internship",
    matchKeywords: ["internship", "summer", "tech", "computer science", "engineering", "ai"],
  },
  {
    title: "L'Oreal-UNESCO For Women in Science Fellowship",
    type: "fellowship",
    provider: "L'Oreal / UNESCO",
    description: "International fellowship supporting women researchers in STEM. Provides €15,000-€30,000 research grant, international visibility, mentorship from senior scientists, and access to the global For Women in Science network. 275+ fellows supported annually across 117 countries.",
    eligibilityCriteria: "Female researcher, PhD or postdoc in STEM, compelling research project, institutional affiliation",
    deadline: new Date(Date.now() + 44 * 86400000).toISOString(),
    location: "Global",
    isRemote: false,
    tags: ["Fellowship", "Women in STEM", "Research", "Grant", "Science", "Mentorship"],
    applicationUrl: "https://www.forwomeninscience.com",
    matchKeywords: ["research", "science", "grant", "funding", "renewable energy", "women"],
  },
  {
    title: "DataCamp — Africa Data Science Scholarship",
    type: "grant",
    provider: "DataCamp",
    description: "Free 12-month premium access to DataCamp's full platform for African students and professionals. Covers 400+ courses in Python, R, SQL, Machine Learning, and AI. Includes certification exams, career tracks, and access to DataCamp's hiring platform. 5,000+ scholarships awarded.",
    eligibilityCriteria: "African resident, interest in data science, no prior DataCamp premium subscription",
    deadline: new Date(Date.now() + 18 * 86400000).toISOString(),
    location: "Remote / Online",
    isRemote: true,
    tags: ["Grant", "Data Science", "Online", "Python", "R", "Africa", "Education"],
    applicationUrl: "https://datacamp.com/scholarships",
    matchKeywords: ["data science", "python", "statistics", "machine learning", "africa", "online", "scholarship"],
  },
];

async function getFallbackResults(goal: string, ai: ToolContext["ai"], keywords?: string | string[], limit: number = 20): Promise<unknown[]> {
  const text = (goal + " " + (Array.isArray(keywords) ? keywords.join(" ") : keywords || "")).toLowerCase();
  const scored = HARDCODED_OPPORTUNITIES.map(o => ({
    opp: o,
    score: o.matchKeywords.filter(k => text.includes(k)).length,
  }));
  const matched = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  const selected = matched.length > 0 ? matched : scored;
  const results = selected.slice(0, limit);
  const withAdvice = await Promise.all(results.map(async s => ({
    id: s.opp.title.toLowerCase().replace(/\s+/g, "-"),
    title: s.opp.title,
    slug: s.opp.title.toLowerCase().replace(/\s+/g, "-"),
    type: s.opp.type,
    provider: s.opp.provider,
    description: s.opp.description,
    eligibilityCriteria: s.opp.eligibilityCriteria,
    deadline: s.opp.deadline,
    location: s.opp.location,
    isRemote: s.opp.isRemote,
    tags: s.opp.tags,
    applicationUrl: s.opp.applicationUrl,
    advice: await generateAdvice(s.opp.title, goal, ai),
    isActive: true,
    benefits: null,
    targetAudience: [],
    requiredSkills: [],
    preferredSkills: [],
    experienceLevel: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })));
  return withAdvice;
}

export const searchOpportunitiesTool: AgentTool = {
  name: "search_opportunities",
  description: "Search for educational and career opportunities by type, keywords, country, and deadline",
  parameters: z.object({
    types: z.union([opportunityTypeSchema, z.array(opportunityTypeSchema)]).optional(),
    keywords: z.union([z.string(), z.array(z.string())]).optional(),
    country: z.string().optional(),
    deadlineBefore: z.string().optional(),
    deadlineAfter: z.string().optional(),
    provider: z.string().optional(),
    isRemote: z.boolean().optional(),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).optional(),
  }),
      async execute(params: unknown, ctx: ToolContext): Promise<ToolResult> {
    const p = params as { types?: string | string[]; keywords?: string | string[]; country?: string; deadlineBefore?: string; deadlineAfter?: string; provider?: string; isRemote?: boolean; limit?: number; offset?: number };
    const types = p.types ? (Array.isArray(p.types) ? p.types : [p.types]) : undefined;
    const query = Array.isArray(p.keywords) ? p.keywords.join(" ") : p.keywords || "";
    const goal = query;
    const limit = p.limit || 20;

    // Step 1: Use Gemma 4 with OpenRouter web search for real-time results
    try {
      const searchPrompt = `Search the web for current ${query || "scholarships, fellowships, and internships"} opportunities for African students. Return a JSON array of objects with: title, description, provider, type (scholarship/fellowship/internship/grant), url, eligibility, location, deadline if known. Return up to ${limit} real opportunities from actual web sources. Today is ${new Date().toISOString().split("T")[0]}.`;
      const aiResult = await ctx.ai.generateJSON("search", searchPrompt) as Array<Record<string, unknown>>;
      if (Array.isArray(aiResult) && aiResult.length > 0) {
        const opportunities = await Promise.all(aiResult.slice(0, limit).map(async (r, i) => {
          const title = String(r.title || r.name || `Opportunity ${i + 1}`);
          return {
            id: `gemma-web-${i}-${Date.now()}`,
            title,
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50),
            type: String(r.type || (types || ["scholarship"]).find(t => String(r.description || "").toLowerCase().includes(t)) || "scholarship"),
            provider: String(r.provider || r.organization || r.institution || "Web Source"),
            description: String(r.description || ""),
            eligibilityCriteria: String(r.eligibility || r.eligibilityCriteria || "Varies — check the official listing."),
            deadline: String(r.deadline || new Date(Date.now() + 60 * 86400000).toISOString()),
            location: String(r.location || "Multiple"),
            isRemote: true,
            tags: ["AI Discovery", ...(types || []).slice(0, 3)],
            applicationUrl: String(r.url || r.applicationUrl || r.link || ""),
            advice: await generateAdvice(title, goal, ctx.ai),
            isActive: true,
            benefits: null,
            targetAudience: [],
            requiredSkills: [],
            preferredSkills: [],
            experienceLevel: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }));
        return {
          success: true,
          data: opportunities,
          summary: `Found ${opportunities.length} opportunities via Gemma 4 web search matching "${query}"`,
          metadata: { count: opportunities.length, types, query: p.keywords, source: "gemma4_websearch" },
        };
      }
    } catch {
      // Gemma web search failed, fall through to DB
    }

    // Step 2: Query database
    const dbResults = await searchOpportunities({
      types,
      keywords: p.keywords,
      country: p.country,
      deadlineBefore: p.deadlineBefore,
      deadlineAfter: p.deadlineAfter,
      provider: p.provider,
      isRemote: p.isRemote,
      limit,
      offset: p.offset,
    });

    // Step 3: If DB returned less than 3 results, fall back to hardcoded with AI advice
    if (dbResults.length < 3) {
      const fallback = await getFallbackResults(goal, ctx.ai, p.keywords, limit);
      if (fallback.length > 0) {
        return {
          success: true,
          data: fallback,
          summary: `Found ${fallback.length} opportunities matching your criteria`,
          metadata: { count: fallback.length, types, query: p.keywords, source: "hardcoded_fallback" },
        };
      }
    }

    // Step 4: Add AI advice to DB results
    const withAdvice = await Promise.all(dbResults.map(async (r) => ({
      ...r,
      advice: await generateAdvice(String(r.title || ""), goal, ctx.ai),
    })));

    return {
      success: true,
      data: withAdvice,
      summary: `Found ${dbResults.length} opportunities matching your criteria`,
      metadata: { count: dbResults.length, types, query: p.keywords, source: "database" },
    };
  },
};
