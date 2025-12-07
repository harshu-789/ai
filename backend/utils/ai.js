import { createAgent, gemini } from "@inngest/agent-kit";

const analyzeTicket = async (ticket) => {
  const supportAgent = createAgent({
    model: gemini({
      model: "gemini-1.0-pro",
      apiKey: process.env.GEMINI_API_KEY,
    }),
    name: "AI Ticket Triage Assistant",
    system: `
You are an advanced Support Ticket AI used in a real production system.

### RULES YOU MUST FOLLOW:
- Output ONLY valid JSON.
- No markdown, no code fences, no comments.
- Keys must ALWAYS exist and be non-empty.
- relatedSkills MUST always be an array of lowercase technical skill names.
- priority must be one of: "low", "medium", "high".

### PRIORITY RULE:
- HIGH = data loss, app crash, no login, payment failure, error codes
- MEDIUM = broken UI, missing features, performance degradation
- LOW = minor UI issues, cosmetic bugs, suggestions

### HELPFUL NOTES SHOULD:
- Explain root cause possibilities
- Give step-by-step debugging instructions
- Provide links to documentation
- Include relevant logs to check
- Be actionable for junior moderators
    `.trim(),
  });

  const prompt = `
Analyze the following support ticket and return STRICT valid JSON ONLY.

Ticket:
- Title: ${ticket.title}
- Description: ${ticket.description}

The output MUST match EXACTLY this shape:

{
  "summary": "1–2 sentence summary",
  "priority": "low | medium | high",
  "helpfulNotes": "Detailed explanation with steps & links",
  "relatedSkills": ["react", "node.js", "mongodb"]
}
  `.trim();

  const response = await supportAgent.run(prompt);

  const raw = response?.output?.[0]?.content;

  if (!raw) {
    console.error("❌ AI returned empty response:", response);
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    // Strong validation
    if (!parsed.summary || !parsed.helpfulNotes || !parsed.relatedSkills) {
      throw new Error("Missing required JSON fields");
    }

    parsed.relatedSkills = parsed.relatedSkills.map(s => s.toLowerCase());

    return parsed;
  } catch (err) {
    console.error("❌ FAILED TO PARSE AI JSON:", raw, err.message);
    return null;
  }
};

export default analyzeTicket;
