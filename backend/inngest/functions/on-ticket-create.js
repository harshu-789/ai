import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";

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



export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      // 1️⃣ Fetch the ticket inside step.run
      const ticketData = await step.run("fetch-ticket", async () => {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) throw new NonRetriableError("Ticket not found");
        return ticket.toJSON();   // 🔥 MUST convert to safe JSON
      });

      // 2️⃣ Run AI analysis OUTSIDE step.run to avoid nested step.* behavior
      const aiResponse = await analyzeTicket(ticketData);

      // 3️⃣ Process & update inside a new clean step
      const updatedTicket = await step.run("update-ticket", async () => {
        const t = await Ticket.findById(ticketId);

        t.status = "TODO";
        if (aiResponse) {
          t.priority = aiResponse.priority || "medium";
          t.helpfulNotes = aiResponse.helpfulNotes;
          t.relatedSkills = aiResponse.relatedSkills;
          t.status = "IN_PROGRESS";
        }

        // Assign moderator/admin
        let user = null;

        if (aiResponse?.relatedSkills?.length) {
          user = await User.findOne({
            role: "moderator",
            skills: { $elemMatch: { $regex: aiResponse.relatedSkills.join("|"), $options: "i" } }
          });
        }

        if (!user) {
          user = await User.findOne({ role: "admin" });
        }

        t.assignedTo = user?._id || null;

        await t.save();

        // Return SAFE DATA ONLY
        return t.toJSON();   // 🔥 no mongoose doc
      });

      // 4️⃣ Send email OUTSIDE step.run (AI and mailers should not run inside steps)
      if (updatedTicket.assignedTo) {
        const assignedUser = await User.findById(updatedTicket.assignedTo);
        if (assignedUser) {
          await sendMail(
            assignedUser.email,
            "Ticket Assigned",
            `A new ticket was assigned to you: ${updatedTicket.title}`
          );
        }
      }

      return { success: true };
    } catch (err) {
      console.error("❌ Error processing ticket:", err);
      return { success: false };
    }
  }
);
