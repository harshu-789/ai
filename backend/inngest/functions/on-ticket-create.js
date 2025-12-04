// import { inngest } from "../client.js";
// import Ticket from "../../models/ticket.js";
// import User from "../../models/user.js";
// import { NonRetriableError } from "inngest";
// import { sendMail } from "../../utils/mailer.js";
// import analyzeTicket from "../../utils/ai.js";

// export const onTicketCreated = inngest.createFunction(
//   { id: "on-ticket-created", retries: 2 },
//   { event: "ticket/created" },
//   async ({ event, step }) => {
//     try {
//       const { ticketId } = event.data;

//       //fetch ticket from DB
//       const ticket = await step.run("fetch-ticket", async () => {
//         const ticketObject = await Ticket.findById(ticketId);
//         if (!ticket) {
//           throw new NonRetriableError("Ticket not found");
//         }
//         return ticketObject;
//       });

//       await step.run("update-ticket-status", async () => {
//         await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" });
//       });

//       const aiResponse = await analyzeTicket(ticket);

//       const relatedskills = await step.run("ai-processing", async () => {
//         let skills = [];
//         if (aiResponse) {
//           await Ticket.findByIdAndUpdate(ticket._id, {
//             priority: !["low", "medium", "high"].includes(aiResponse.priority)
//               ? "medium"
//               : aiResponse.priority,
//             helpfulNotes: aiResponse.helpfulNotes,
//             status: "IN_PROGRESS",
//             relatedSkills: aiResponse.relatedSkills,
//           });
//           skills = aiResponse.relatedSkills;
//         }
//         return skills;
//       });

//       const moderator = await step.run("assign-moderator", async () => {
//         let user = await User.findOne({
//           role: "moderator",
//           skills: {
//             $elemMatch: {
//               $regex: relatedskills.join("|"),
//               $options: "i",
//             },
//           },
//         });
//         if (!user) {
//           user = await User.findOne({
//             role: "admin",
//           });
//         }
//         await Ticket.findByIdAndUpdate(ticket._id, {
//           assignedTo: user?._id || null,
//         });
//         return user;
//       });

//       await setp.run("send-email-notification", async () => {
//         if (moderator) {
//           const finalTicket = await Ticket.findById(ticket._id);
//           await sendMail(
//             moderator.email,
//             "Ticket Assigned",
//             `A new ticket is assigned to you ${finalTicket.title}`
//           );
//         }
//       });

//       return { success: true };
//     } catch (err) {
//       console.error("❌ Error running the step", err.message);
//       return { success: false };
//     }
//   }
// );



import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      // Step: Fetch, update, AI, assign moderator, and notify email all in one step
      const updatedTicket = await step.run("process-ticket", async () => {
        // Fetch ticket
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) throw new NonRetriableError("Ticket not found");

        // Initial status
        ticket.status = "TODO";

        // AI analysis
        const aiResponse = await analyzeTicket(ticket);
        let relatedSkills = [];
        if (aiResponse) {
          ticket.priority = ["low", "medium", "high"].includes(aiResponse.priority)
            ? aiResponse.priority
            : "medium";
          ticket.helpfulNotes = aiResponse.helpfulNotes;
          ticket.status = "IN_PROGRESS";
          ticket.relatedSkills = aiResponse.relatedSkills;
          relatedSkills = aiResponse.relatedSkills;
        }

        // Assign moderator/admin
        let user = await User.findOne({
          role: "moderator",
          skills: { $elemMatch: { $regex: relatedSkills.join("|"), $options: "i" } },
        });
        if (!user) {
          user = await User.findOne({ role: "admin" });
        }
        ticket.assignedTo = user?._id || null;

        // Save all changes at once
        await ticket.save();

        // Send email notification
        if (user) {
          await sendMail(
            user.email,
            "Ticket Assigned",
            `A new ticket is assigned to you: ${ticket.title}`
          );
        }

        return ticket; // return updated ticket if needed
      });

      return { success: true, ticket: updatedTicket };
    } catch (err) {
      console.error("❌ Error processing ticket:", err.message);
      return { success: false };
    }
  }
);
