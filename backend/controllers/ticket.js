import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description)
      return res.status(400).json({ message: "Title and description required." });

    // Create the ticket without assignment
    const ticket = await Ticket.create({
      title,
      description,
      createdBy: req.user._id,
      status: "TODO"
    });

    // Fire the event so Inngest can process AI + auto-assign
    await inngest.send({
      name: "ticket/created",
      data: { ticketId: ticket._id.toString() }
    });

    res.status(201).json({ message: "Ticket created & processing started.", ticket });

  } catch (err) {
    console.error("Ticket creation failed:", err);
    res.status(500).json({ message: "Server error creating ticket." });
  }
};



// GET ALL TICKETS
export const getTickets = async (req, res) => {
  try {
    const user = req.user;
    let tickets;

    if (user.role === "admin" || user.role === "moderator") {
      tickets = await Ticket.find({})
        .select("title description priority status helpfulNotes relatedSkills assignedTo createdBy createdAt")
        .populate("assignedTo", ["email", "_id"])
        .populate("createdBy", ["email", "_id"])
        .sort({ createdAt: -1 })
        .lean();
    } else {
      tickets = await Ticket.find({ createdBy: user._id })
        .select("title description priority status helpfulNotes relatedSkills assignedTo createdAt")
        .populate("assignedTo", ["email", "_id"])
        .sort({ createdAt: -1 })
        .lean();
    }

    return res.status(200).json({ tickets });

  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



// GET SINGLE TICKET
export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    let ticket;

    if (user.role === "admin" || user.role === "moderator") {
      ticket = await Ticket.findById(req.params.id)
        .populate("assignedTo", ["email"])
        .populate("createdBy", ["email"])
        .lean();
    } else {
      ticket = await Ticket.findOne({
        _id: req.params.id,
        createdBy: user._id,
      })
        .select("title description priority status helpfulNotes relatedSkills assignedTo createdAt")
        .populate("assignedTo", ["email"])
        .lean();
    }

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json({ ticket });

  } catch (error) {
    console.error("Error fetching ticket:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// UPDATE TICKET
export const updateTicket = async (req, res) => {
  try {
    const user = req.user;
    const ticketId = req.params.id;

    let ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // USER CAN ONLY UPDATE THEIR OWN TICKET (title, description)
    if (user.role === "user") {
      if (ticket.createdBy.toString() !== user._id.toString()) {
        return res.status(403).json({ message: "You cannot update this ticket" });
      }

      // restrict fields users can update
      const allowedFields = ["title", "description"];
      for (let key of Object.keys(req.body)) {
        if (!allowedFields.includes(key)) {
          return res.status(403).json({ message: "You cannot update this field" });
        }
      }
    }

    // ADMIN + MODERATOR → full update allowed
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      req.body,
      { new: true }
    )
      .populate("assignedTo", ["email", "_id"])
      .populate("createdBy", ["email", "_id"]);

    return res.status(200).json({
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });

  } catch (error) {
    console.error("Error updating ticket:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



export const getAllTicketsForAdmin = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("createdBy", "email")
      .sort({ createdAt: -1 });

    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
