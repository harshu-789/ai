import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import analyzeTicket from "../../utils/ai.js";
import { sendMail } from "../../utils/mailer.js";
import { NonRetriableError } from "inngest";

function scoreModerator(mod, requiredSkills) {
  const modSkills = (mod.skills || []).map(s => s.toLowerCase());
  let score = 0;

  requiredSkills.forEach(skill => {
    modSkills.forEach(ms => {
      if (ms.includes(skill) || skill.includes(ms)) score += 1;
    });
  });

  return score;
}

export const onTicketCreated = inngest.createFunction(
  { id: "ticket-ai-analysis-and-assignment", retries: 2 },
  { event: "ticket/created" },

  async ({ event, step }) => {
    const { ticketId } = event.data;

    // 1️⃣ Load ticket
    const ticket = await Ticket.findById(ticketId).populate("createdBy");
    if (!ticket) throw new NonRetriableError("Ticket not found");

    // 2️⃣ AI analysis (outside step)
    const ai = await analyzeTicket({
      title: ticket.title,
      description: ticket.description,
    });

    if (!ai) {
      throw new NonRetriableError("AI failed to generate JSON");
    }

    console.log("🤖 AI RESULT:", ai);

    // 3️⃣ Get all moderators
    const moderators = await User.find({ role: "moderator" });

    // Weighted best match
    let bestModerator = null;
    let bestScore = 0;

    moderators.forEach(mod => {
      const score = scoreModerator(mod, ai.relatedSkills);
      if (score > bestScore) {
        bestScore = score;
        bestModerator = mod;
      }
    });

    // Fallback if no skill matches
    if (!bestModerator) {
      bestModerator = moderators[0] || null;
    }

    // 4️⃣ Update ticket inside step.run
    await step.run("Save AI details + assignment", async () => {
      ticket.summary = ai.summary;
      ticket.priority = ai.priority;
      ticket.helpfulNotes = ai.helpfulNotes;
      ticket.relatedSkills = ai.relatedSkills;
      ticket.assignedTo = bestModerator?._id || null;

      await ticket.save();
    });

    // 5️⃣ Send email OUTSIDE step.run
    if (bestModerator) {
      await sendMail({
        to: bestModerator.email,
        subject: `New Ticket Assigned: ${ticket.title}`,
        html: `
          <h3>You have been assigned a ticket</h3>
          <p><b>Summary:</b> ${ai.summary}</p>
          <p><b>Priority:</b> ${ai.priority}</p>
          <p><b>Helpful Notes:</b> ${ai.helpfulNotes}</p>
          <p><b>Matched Skills:</b> ${ai.relatedSkills.join(", ")}</p>
        `,
      });
    }

    return {
      success: true,
      priority: ai.priority,
      assignedTo: bestModerator?.email || "No moderators found",
    };
  }
);
