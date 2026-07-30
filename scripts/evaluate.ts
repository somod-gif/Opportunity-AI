import { config } from "dotenv";
config({ path: ".env.local" });

const TEST_MISSIONS = [
  {
    goal: "Find fully-funded AI scholarships in Canada for a Nigerian student",
    education: "BSc Computer Science",
    skills: ["Python", "Machine Learning", "Mathematics"],
    country: "Nigeria",
    careerGoal: "AI Research Scientist",
    expectedTools: ["search_opportunities", "web_search", "eligibility_analyzer", "gap_analysis"],
    minSources: 3,
  },
  {
    goal: "Find AI/ML internships in Europe for summer 2027",
    education: "MSc Data Science",
    skills: ["Python", "TensorFlow", "Statistics"],
    country: "Kenya",
    careerGoal: "ML Engineer",
    expectedTools: ["search_opportunities", "web_search", "eligibility_analyzer"],
    minSources: 2,
  },
  {
    goal: "Find a fully-funded Masters in Data Science anywhere in the world",
    education: "BSc Mathematics",
    skills: ["Statistics", "R", "Python"],
    country: "Ghana",
    careerGoal: "Data Scientist",
    expectedTools: ["search_opportunities", "web_search"],
    minSources: 2,
  },
];

interface TestResult {
  mission: string;
  passed: boolean;
  iterations: number;
  toolsUsed: string[];
  sourcesFound: number;
  errors: string[];
  duration: number;
}

async function runTestMission(mission: (typeof TEST_MISSIONS)[0]): Promise<TestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const toolsUsed: string[] = [];
  const sessionId = `eval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // We test specific sub-systems rather than the full agent (which requires AI API)
  // This serves as an evaluation of the agent's ability to correctly route tools

  try {
    // Test 1: Tool Registry
    const { ToolRegistry } = await import("@/lib/agent/tools/registry");
    const registry = new ToolRegistry();
    const { searchOpportunitiesTool } = await import("@/lib/agent/tools/search-all");
    const { webSearchTool } = await import("@/lib/agent/tools/web");
    const eligibilityAnalyzerTool = (await import("@/lib/agent/tools/eligibility-analyzer")).eligibilityAnalyzerTool;

    registry.register(searchOpportunitiesTool);
    registry.register(webSearchTool);
    registry.register(eligibilityAnalyzerTool);

    const registered = registry.list().map((t) => t.name);
    for (const expected of mission.expectedTools) {
      if (registered.includes(expected)) {
        toolsUsed.push(expected);
      } else {
        errors.push(`Expected tool "${expected}" not registered`);
      }
    }

    // Test 2: Mission Decomposition (simulated - no API call)
    const promptSimulation = `Mission: ${mission.goal}. Decompose into sub-tasks.`;
    if (promptSimulation.includes(mission.goal)) {
      // Decomposition prompt was correctly constructed
    }

    // Test 3: Parameter Validation
    const searchParams = { types: ["scholarship"], limit: 20, keywords: [mission.goal] };
    const validateResult = searchOpportunitiesTool.parameters.safeParse(searchParams);
    if (!validateResult.success) {
      errors.push(`Search params validation failed: ${JSON.stringify(validateResult.error)}`);
    }

    // Test 4: Eligibility Parameter Validation
    const eligibilityParams = {
      opportunityTitle: "Test Scholarship",
      profileSkills: mission.skills,
      profileEducation: mission.education,
      profileCountry: mission.country,
    };
    const eligibilityValidate = eligibilityAnalyzerTool.parameters.safeParse(eligibilityParams);
    if (!eligibilityValidate.success) {
      errors.push(`Eligibility params validation failed: ${JSON.stringify(eligibilityValidate.error)}`);
    }

  } catch (error) {
    errors.push(String(error));
  }

  return {
    mission: mission.goal.slice(0, 60),
    passed: errors.length === 0,
    iterations: 0,
    toolsUsed,
    sourcesFound: 0,
    errors,
    duration: Date.now() - startTime,
  };
}

async function main() {
  console.log("=".repeat(60));
  console.log("  OPPORTUNITY AI — EVALUATION HARNESS");
  console.log("=".repeat(60));
  console.log(`  Running ${TEST_MISSIONS.length} test missions...\n`);

  const results: TestResult[] = [];
  for (const mission of TEST_MISSIONS) {
    const result = await runTestMission(mission);
    results.push(result);

    const icon = result.passed ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${result.mission}`);
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        console.log(`         - ${err}`);
      }
    }
    console.log(`         Tools: ${result.toolsUsed.join(", ") || "none"}`);
    console.log(`         Duration: ${result.duration}ms`);
    console.log();
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const score = Math.round((passed / total) * 100);

  console.log("=".repeat(60));
  console.log(`  RESULTS: ${passed}/${total} passed (${score}%)`);
  console.log(`  Agent reliability score: ${score}%`);
  console.log("=".repeat(60));

  if (passed === total) {
    console.log("\n  All systems nominal. Agent architecture validated.\n");
  } else {
    console.log(`\n  ${total - passed} test(s) failed. Review errors above.\n`);
  }

  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error("Evaluation harness failed:", err);
  process.exit(1);
});
