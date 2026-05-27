import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, default: "TODO" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  priority: { type: String, default: "medium" },
  deadline: Date,
  helpfulNotes: {
    type: String,
    default:
      "AI triage pending. This ticket is awaiting priority and resolution details.",
  },
  suggestedReply: {
    type: String,
    default:
      "AI triage pending. A suggested customer response will appear once analysis completes.",
  },
  summary: {
    type: String,
    default:
      "AI triage pending. A summary will appear once analysis completes.",
  },
  relatedSkills: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Ticket", ticketSchema);
