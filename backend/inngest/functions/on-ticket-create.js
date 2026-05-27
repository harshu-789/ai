import { NonRetriableError } from "inngest";
import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import analyzeTicket from "../../utils/ai.js";
import { sendMail } from "../../utils/mailer.js";

function normalizeSkill(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function scoreModerator(mod, requiredSkills) {
  const modSkills = (mod.skills || []).map(normalizeSkill).filter(Boolean);
  const skills = (requiredSkills || []).map(normalizeSkill).filter(Boolean);

  let score = 0;

  skills.forEach((skill) => {
    modSkills.forEach((moderatorSkill) => {
      if (moderatorSkill.includes(skill) || skill.includes(moderatorSkill)) {
        score += 1;
      }
    });
  });

  return score;
}

export const onTicketCreated = inngest.createFunction(
  { id: "ticket-ai-analysis-and-assignment", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    const { ticketId } = event.data;

    const ticket = await Ticket.findById(ticketId).populate("createdBy");
    if (!ticket) throw new NonRetriableError("Ticket not found");

    const ai = await analyzeTicket({
      title: ticket.title,
      description: ticket.description,
    });

    console.log("Ticket triage result:", ai);

    const moderators = await User.find({ role: "moderator" });
    let bestModerator = null;
    let bestScore = 0;

    moderators.forEach((mod) => {
      const score = scoreModerator(mod, ai.relatedSkills);
      if (score > bestScore) {
        bestScore = score;
        bestModerator = mod;
      }
    });

    if (!bestModerator) {
      bestModerator = moderators[0] || null;
    }

    await step.run("save-ai-details-and-assignment", async () => {
      ticket.summary = ai.summary;
      ticket.priority = ai.priority;
      ticket.helpfulNotes = ai.helpfulNotes;
      ticket.suggestedReply = ai.suggestedReply;
      ticket.relatedSkills = ai.relatedSkills;
      ticket.status = ai.status || ticket.status;
      ticket.assignedTo = bestModerator?._id || null;

      await ticket.save();
    });

    if (bestModerator) {
      try {
        await sendMail(
          bestModerator.email,
          `New Ticket Assigned: ${ticket.title}`,
          [
            "You have been assigned a ticket.",
            "",
            `Summary: ${ai.summary}`,
            `Priority: ${ai.priority}`,
            `Helpful Notes: ${ai.helpfulNotes}`,
            `Suggested Reply: ${ai.suggestedReply}`,
            `Matched Skills: ${ai.relatedSkills.join(", ") || "none"}`,
          ].join("\n"),
        );
      } catch (error) {
        console.error("Failed to send assignment email:", error.message);
      }
    }

    await step.sleep("wait-two-minutes-before-completing-ticket", "2 minutes");

    await step.run("mark-ticket-completed", async () => {
      await Ticket.findOneAndUpdate(
        { _id: ticketId, status: { $ne: "COMPLETED" } },
        { status: "COMPLETED" },
      );
    });

    return {
      success: true,
      priority: ai.priority,
      status: "COMPLETED",
      assignedTo: bestModerator?.email || "No moderators found",
    };
  },
);
