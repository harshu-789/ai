import { createAgent, gemini } from "@inngest/agent-kit";

const PRIORITY_KEYWORDS = {
  high: [
    "cannot login",
    "can't login",
    "unable to login",
    "login failed",
    "data loss",
    "lost data",
    "payment failed",
    "payment failure",
    "security",
    "breach",
    "hacked",
    "crash",
    "crashing",
    "down",
    "outage",
    "production",
    "blocked",
    "critical",
    "urgent",
    "500",
    "503",
  ],
  low: [
    "typo",
    "spelling",
    "alignment",
    "color",
    "cosmetic",
    "minor",
    "suggestion",
    "enhancement",
    "label",
    "spacing",
  ],
};

const SKILL_KEYWORDS = [
  { skills: ["react", "frontend"], terms: ["react", "component", "page", "frontend", "ui", "button", "form"] },
  { skills: ["css", "tailwind"], terms: ["css", "tailwind", "style", "layout", "responsive", "alignment", "color"] },
  { skills: ["node.js", "express"], terms: ["node", "express", "api", "backend", "server", "route", "endpoint"] },
  { skills: ["authentication", "jwt"], terms: ["auth", "login", "signup", "token", "jwt", "unauthorized", "forbidden"] },
  { skills: ["mongodb", "mongoose"], terms: ["mongo", "mongodb", "mongoose", "database", "schema", "model", "collection"] },
  { skills: ["inngest"], terms: ["inngest", "event", "background job", "workflow", "assignment"] },
  { skills: ["ai triage"], terms: ["ai", "gemini", "triage", "priority", "summary", "suggested reply"] },
  { skills: ["email"], terms: ["email", "mail", "smtp", "mailtrap", "notification"] },
  { skills: ["payments"], terms: ["payment", "checkout", "invoice", "billing"] },
  { skills: ["deployment", "cors"], terms: ["deploy", "deployment", "cors", "production", "environment"] },
];

const TOPIC_GUIDES = [
  {
    label: "login or account access",
    terms: ["login", "sign in", "signin", "signup", "password", "token", "jwt", "unauthorized", "forbidden", "account"],
    moderatorSteps: [
      "Check the auth route, token creation, token expiry, and protected-route middleware.",
      "Verify whether the affected account exists and whether the role is correct.",
      "Review client storage and API responses for 401 or 403 errors.",
    ],
    customerSteps: [
      "Try signing out, refreshing the page, and signing in again.",
      "Confirm the email is correct and reset the password if the login error mentions credentials.",
      "Share the exact error message and whether the issue happens in another browser or incognito window.",
    ],
  },
  {
    label: "payment or checkout",
    terms: ["payment", "checkout", "invoice", "billing", "card", "charge", "refund", "transaction"],
    moderatorSteps: [
      "Check payment provider logs for declined, duplicate, or failed transactions.",
      "Compare the client checkout request with the backend payment payload.",
      "Confirm whether the user was charged before asking them to retry payment.",
    ],
    customerSteps: [
      "Do not retry payment repeatedly until we confirm whether a charge was created.",
      "Share the approximate payment time, amount, and the last four digits of the payment method if relevant.",
      "Send a screenshot of the checkout error without exposing full card details.",
    ],
  },
  {
    label: "app crash or outage",
    terms: ["crash", "crashing", "down", "outage", "500", "503", "production", "server error", "blank screen"],
    moderatorSteps: [
      "Check recent deploys, server logs, browser console errors, and uptime monitoring.",
      "Identify whether the issue affects one user, one route, or the whole service.",
      "Rollback or disable the failing path if the issue blocks production usage.",
    ],
    customerSteps: [
      "Refresh the page once and note the exact time the error happened.",
      "Share the page URL, screenshot, and any visible error code.",
      "Tell us whether this blocks all work or only one specific action.",
    ],
  },
  {
    label: "UI or styling",
    terms: ["ui", "style", "layout", "button", "color", "alignment", "responsive", "mobile", "screen", "text", "spacing"],
    moderatorSteps: [
      "Reproduce the issue on desktop and mobile widths.",
      "Check the component styles, Tailwind classes, and any overflowing text containers.",
      "Compare the current behavior with the expected design or screenshot.",
    ],
    customerSteps: [
      "Share a screenshot of the affected screen.",
      "Tell us your device, browser, and approximate screen size.",
      "Mention what you expected to see versus what appeared.",
    ],
  },
  {
    label: "API or backend",
    terms: ["api", "endpoint", "route", "backend", "server", "request", "response", "express", "cors"],
    moderatorSteps: [
      "Check the failing route, request body, auth headers, and response status.",
      "Review backend logs for validation errors, exceptions, or missing environment variables.",
      "Confirm CORS and API base URL settings match the frontend environment.",
    ],
    customerSteps: [
      "Share the action you performed immediately before the error.",
      "Include the error message or status code if one is visible.",
      "Tell us whether the issue happens every time or only sometimes.",
    ],
  },
  {
    label: "database or saved data",
    terms: ["database", "mongo", "mongodb", "mongoose", "save", "saved", "data", "missing", "duplicate", "schema"],
    moderatorSteps: [
      "Check the relevant MongoDB document, schema defaults, and required fields.",
      "Review create/update queries for missing user ownership or incorrect IDs.",
      "Confirm whether the issue is display-only or actual stored data loss.",
    ],
    customerSteps: [
      "Avoid editing the same item again until we confirm whether the data was saved.",
      "Share the item name or ID and the approximate time you made the change.",
      "Describe what data is missing or incorrect.",
    ],
  },
  {
    label: "email or notification",
    terms: ["email", "mail", "notification", "smtp", "mailtrap", "inbox", "spam"],
    moderatorSteps: [
      "Check SMTP credentials, sender address, and mail provider logs.",
      "Confirm the recipient email and whether the send function received the expected arguments.",
      "Verify whether the notification failure should block the main ticket workflow.",
    ],
    customerSteps: [
      "Check spam or promotions folders.",
      "Confirm the email address where you expected the message.",
      "Share the approximate time the notification should have arrived.",
    ],
  },
  {
    label: "AI ticket triage",
    terms: ["ai", "gemini", "triage", "priority", "summary", "suggested reply", "response", "reply"],
    moderatorSteps: [
      "Check AI API key configuration and provider errors.",
      "Verify the fallback priority, summary, notes, skills, and suggested reply were saved.",
      "Inspect parse logs if the AI response was not valid JSON.",
    ],
    customerSteps: [
      "Share the ticket title and description that produced the inaccurate response.",
      "Point out which part of the suggested reply is wrong or missing.",
      "Add any expected troubleshooting step so we can tune the triage result.",
    ],
  },
];

const normalizePriority = (value) => {
  if (!value) return "medium";
  const normalized = String(value).toLowerCase().trim();
  if (normalized.includes("high") || normalized.includes("urgent") || normalized.includes("critical")) {
    return "high";
  }
  if (normalized.includes("low") || normalized.includes("minor")) return "low";
  return "medium";
};

const normalizeStatus = (value) => {
  if (!value) return "TODO";
  const normalized = String(value).toUpperCase().trim();
  if (normalized === "REVIEW") return "IN_REVIEW";
  if (["TODO", "OPEN", "IN_PROGRESS", "IN_REVIEW", "PENDING", "COMPLETED"].includes(normalized)) {
    return normalized;
  }
  if (
    normalized.includes("DONE") ||
    normalized.includes("COMPLETE") ||
    normalized.includes("RESOLVED") ||
    normalized.includes("CLOSED")
  ) {
    return "COMPLETED";
  }
  return "TODO";
};

const normalizeRelatedSkills = (value) => {
  const skills = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\n,;]+/) : [];

  return [
    ...new Set(
      skills
        .map((skill) =>
          String(skill || "")
            .toLowerCase()
            .trim(),
        )
        .filter(Boolean),
    ),
  ];
};

const pickField = (obj, keys, fallback) => {
  for (const key of keys) {
    if (obj?.[key] != null) return obj[key];
  }
  return fallback;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const matchesTerm = (text, term) => {
  const normalizedTerm = String(term).toLowerCase();

  if (/^[a-z0-9]+$/.test(normalizedTerm)) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`).test(text);
  }

  return text.includes(normalizedTerm);
};

const includesAny = (text, terms) => terms.some((term) => matchesTerm(text, term));

const getTicketText = (ticket) => `${ticket?.title || ""}\n${ticket?.description || ""}`.toLowerCase();

const detectRelatedSkills = (ticket) => {
  const text = getTicketText(ticket);
  const skills = new Set();

  SKILL_KEYWORDS.forEach(({ skills: matchedSkills, terms }) => {
    if (includesAny(text, terms)) {
      matchedSkills.forEach((skill) => skills.add(skill));
    }
  });

  return [...skills];
};

const detectTopicGuide = (ticket) => {
  const text = getTicketText(ticket);
  return TOPIC_GUIDES.find((guide) => includesAny(text, guide.terms)) || {
    label: "general support",
    moderatorSteps: [
      "Reproduce the reported behavior from the ticket title and description.",
      "Collect logs, screenshots, affected account details, and exact timestamps.",
      "Confirm expected behavior with the requester before marking the ticket complete.",
    ],
    customerSteps: [
      "Share the exact steps you followed before the issue appeared.",
      "Include screenshots, visible error messages, and the time it happened.",
      "Tell us whether the issue happens every time or only in a specific case.",
    ],
  };
};

const detectPriority = (ticket) => {
  const text = getTicketText(ticket);
  if (includesAny(text, PRIORITY_KEYWORDS.high)) return "high";
  if (includesAny(text, PRIORITY_KEYWORDS.low)) return "low";
  return "medium";
};

const firstSentence = (value) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const match = text.match(/^(.{1,180}?)([.!?]|$)\s/);
  return match ? match[1].trim() : text.slice(0, 180).trim();
};

const buildSummary = (ticket) => {
  const title = firstSentence(ticket?.title);
  const description = firstSentence(ticket?.description);

  if (title && description) return `${title}: ${description}`;
  if (title) return `User reported: ${title}.`;
  return "User reported a support issue that needs moderator review.";
};

const priorityReason = (priority) => {
  if (priority === "high") {
    return "The report appears to block a core workflow or may involve production, auth, payment, data, or service availability impact.";
  }
  if (priority === "low") {
    return "The report appears to be cosmetic, minor, or an enhancement request.";
  }
  return "The report needs attention but does not clearly indicate a total blocker or only a cosmetic issue.";
};

const buildHelpfulNotes = (ticket, priority, relatedSkills, topicGuide, source) => {
  const skillsText = relatedSkills.length ? relatedSkills.join(", ") : "general support";

  return [
    `Priority rationale: ${priorityReason(priority)}`,
    `Detected topic: ${topicGuide.label}.`,
    `Suggested owner skills: ${skillsText}.`,
    "Moderator next steps:",
    ...topicGuide.moderatorSteps.map((step) => `- ${step}`),
    source ? `Analysis source: ${source}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const buildSuggestedReply = (ticket, priority, topicGuide) => {
  const title = firstSentence(ticket?.title) || "this issue";
  const urgency =
    priority === "high"
      ? "I have marked this as high priority because it may block an important workflow."
      : priority === "low"
        ? "I have logged this as a lower-priority improvement because it looks limited in impact."
        : "I have marked this as medium priority while we verify the details.";

  return [
    `Thanks for reporting "${title}". This looks related to ${topicGuide.label}. ${urgency}`,
    "",
    "Please try these steps:",
    ...topicGuide.customerSteps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "We will review the matching logs and ticket details, then update you with the fix or next action.",
  ].join("\n");
};

const createFallbackAnalysis = (ticket, source = "local fallback") => {
  const priority = detectPriority(ticket);
  const relatedSkills = detectRelatedSkills(ticket);
  const topicGuide = detectTopicGuide(ticket);

  return {
    summary: buildSummary(ticket),
    priority,
    status: "TODO",
    helpfulNotes: buildHelpfulNotes(ticket, priority, relatedSkills, topicGuide, source),
    relatedSkills,
    suggestedReply: buildSuggestedReply(ticket, priority, topicGuide),
  };
};

const extractRawText = (response) => {
  if (!response) return null;
  if (typeof response === "string") return response;
  if (response.output_text) return response.output_text;
  if (Array.isArray(response.output)) {
    const first = response.output[0];
    if (first?.content) {
      if (typeof first.content === "string") return first.content;
      if (Array.isArray(first.content)) {
        const contentItem = first.content[0];
        if (contentItem?.text) return contentItem.text;
        return JSON.stringify(first.content);
      }
    }
    if (first?.text) return first.text;
  }
  if (typeof response.output === "string") return response.output;
  return JSON.stringify(response);
};

const parseFieldsFromText = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const result = {};

  for (const line of lines) {
    const match = line.match(
      /^\s*(summary|helpfulnotes|helpful_notes|notes|note|advice|priority|importance|relatedskills|related_skills|skills|status|suggestedreply|suggested_reply|reply|response)\s*[:=]\s*(.*)$/i,
    );
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      if (key === "helpfulnotes" || key === "helpful_notes") result.helpfulNotes = value;
      else if (key === "relatedskills" || key === "related_skills") result.relatedSkills = value;
      else if (key === "importance") result.priority = value;
      else if (["suggestedreply", "suggested_reply", "reply", "response"].includes(key)) {
        result.suggestedReply = value;
      } else {
        result[key] = value;
      }
    }
  }

  if (result.relatedSkills && typeof result.relatedSkills === "string") {
    result.relatedSkills = normalizeRelatedSkills(result.relatedSkills);
  }

  return result;
};

const parseAiResponse = (text) => {
  const trimmed = String(text || "").trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("Failed to parse AI JSON:", err.message);
    }
  }

  const fencedMatch = trimmed.match(/```(?:json)?([\s\S]*?)```/i);
  if (fencedMatch) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch (err) {
      console.error("Failed to parse fenced AI JSON:", err.message);
    }
  }

  const parsedFields = parseFieldsFromText(trimmed);
  return Object.keys(parsedFields).length > 0 ? parsedFields : null;
};

const normalizeAnalysis = (parsed, ticket, source) => {
  const fallback = createFallbackAnalysis(ticket, source);
  const relatedSkills = normalizeRelatedSkills(
    pickField(parsed, ["relatedSkills", "related_skills", "skills"], fallback.relatedSkills),
  );
  const priority = normalizePriority(pickField(parsed, ["priority", "importance"], fallback.priority));
  const summary = String(
    pickField(parsed, ["summary", "summaryText", "summary_text", "description"], fallback.summary),
  ).trim();
  const helpfulNotes = String(
    pickField(parsed, ["helpfulNotes", "helpful_notes", "notes", "note", "advice"], fallback.helpfulNotes),
  ).trim();
  const suggestedReply = String(
    pickField(parsed, ["suggestedReply", "suggested_reply", "reply", "response"], fallback.suggestedReply),
  ).trim();

  return {
    summary: summary || fallback.summary,
    priority,
    status: normalizeStatus(pickField(parsed, ["status"], fallback.status)),
    helpfulNotes: helpfulNotes || fallback.helpfulNotes,
    relatedSkills: relatedSkills.length ? relatedSkills : fallback.relatedSkills,
    suggestedReply: suggestedReply || fallback.suggestedReply,
  };
};

const analyzeTicket = async (ticket) => {
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiApiKey) {
    console.warn("GEMINI_API_KEY is missing. Using local ticket triage fallback.");
    return createFallbackAnalysis(ticket, "local fallback because GEMINI_API_KEY is missing");
  }

  const supportAgent = createAgent({
    model: gemini({
      model: "gemini-2.5-pro",
      apiKey: geminiApiKey,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/",
    }),
    name: "AI Ticket Triage Assistant",
    system: `
You MUST ONLY output valid JSON.
No explanations, no extra text.

Required JSON shape:
{
  "summary": "string",
  "priority": "low | medium | high",
  "status": "TODO | OPEN | IN_PROGRESS | IN_REVIEW | PENDING | COMPLETED",
  "helpfulNotes": "string",
  "relatedSkills": ["skill1", "skill2"],
  "suggestedReply": "short customer-facing response"
}
`.trim(),
  });

  const prompt = `
Analyze this support ticket and return STRICT JSON ONLY.

Priority guide:
- high: data loss, app crash, login blocked, payment failure, production outage, security risk
- medium: broken workflows, API/UI bugs, performance degradation, failed background jobs
- low: cosmetic bugs, copy changes, minor suggestions, enhancements

Helpful notes should give moderators concrete debugging steps.
Suggested reply should be empathetic, topic-specific, and include 2-4 concrete numbered steps for the ticket creator.

Title: ${ticket.title}
Description: ${ticket.description}
`.trim();

  try {
    const response = await supportAgent.run(prompt);
    const raw = extractRawText(response);

    if (!raw) {
      console.warn("AI returned an empty response. Using local ticket triage fallback.");
      return createFallbackAnalysis(ticket, "local fallback because AI returned no text");
    }

    const parsed = parseAiResponse(raw);
    if (!parsed) {
      console.warn("AI response was not parseable. Using local ticket triage fallback.");
      return createFallbackAnalysis(ticket, "local fallback because AI response was not parseable");
    }

    return normalizeAnalysis(parsed, ticket, "AI response with local normalization");
  } catch (err) {
    console.error("AI ticket triage failed:", err.message);
    return createFallbackAnalysis(ticket, "local fallback because AI request failed");
  }
};

export default analyzeTicket;
