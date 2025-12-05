import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { createTicket, getTicket, getTickets,getAllTicketsForAdmin } from "../controllers/ticket.js";

const router = express.Router();

router.get("/admin/all", authenticate, getAllTicketsForAdmin);
router.get("/", authenticate, getTickets);
router.post("/", authenticate, createTicket);
router.get("/:id", authenticate, getTicket);


export default router;