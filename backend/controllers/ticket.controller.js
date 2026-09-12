require("dotenv").config();
const ticketServices = require("../services/ticket.service");
const groupService = require("../services/group.service");
const userModel = require("../models/users.model");

class Controller {

    /* Optional: pass io from the main server entry */
    setIO(io) {
        this.io = io;
    }

    /* =========================================================
       GET /get-all-ticket
       ========================================================= */
    async getAllTciket(req, res) {
        try {
            const user = await userModel.findById(req.user._id);
            if (!user) {
                return res.status(401).json({ ErrorMessage: "User not found", data: {} });
            }
            if (!user?.whatsappAccountId || !user?.whatsappAcessToken) {
                return res.status(400).json({ ErrorMessage: "WhatsApp account not connected", data: {} });
            }

            const { limit, skip, search } = req.query;
            const setData = { limit, skip, userId: user._id, search };

            const tickets = await ticketServices.getAllTickets(setData);
            const ticketsCounts = await ticketServices.countTicket(setData);

            if (tickets) {
                return res.status(200).json({
                    ErrorMessage: "success",
                    data: tickets,
                    countData: ticketsCounts,
                });
            }
            return res.status(404).json({ ErrorMessage: "No ticket found", data: {} });
        } catch (err) {
            console.error("Error in getAllTciket:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       GET /get-ticket-by-id/:id
       ========================================================= */
    async getTicketById(req, res) {
        try {
            const ticket = await ticketServices.getTicketById(req.params.id);
            if (!ticket) {
                return res.status(404).json({ ErrorMessage: "Ticket not found", data: {} });
            }
            return res.status(200).json({ ErrorMessage: "success", data: ticket });
        } catch (err) {
            console.error("Error in getTicketById:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       POST /assign-ticket-in-group  { ticketId, groupId }
       ========================================================= */
    async assignTicketInGroup(req, res) {
        try {
            const { ticketId, groupId } = req.body;
            if (!ticketId || !groupId) {
                return res.status(400).json({ ErrorMessage: "Missing required fields", data: {} });
            }

            const updatedTicket = await ticketServices.moveTicketToGroup(ticketId, groupId);
            if (!updatedTicket) {
                return res.status(404).json({ ErrorMessage: "Ticket not found", data: {} });
            }

            // Real-time: notify group changes
            if (this.io) {
                this.io.to(String(req.user._id)).emit("ticket_moved", {
                    ticketId,
                    groupId: groupId === "empty" ? null : groupId,
                    ticket: updatedTicket,
                });
            }

            return res.status(200).json({ ErrorMessage: "success", data: updatedTicket });
        } catch (err) {
            console.error("Error in assignTicketInGroup:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       POST /cancel-ticket  { ticketId, closeResion }
       ========================================================= */
    async cancelTicket(req, res) {
        try {
            const { ticketId, closeResion } = req.body;
            if (!ticketId) {
                return res.status(400).json({ ErrorMessage: "Missing required fields", data: {} });
            }

            const setData = {
                ticketstatus: "closed",
                closeResion: closeResion || "",
                closeDate: new Date(),
            };

            const updatedTicket = await ticketServices.updateTicket(ticketId, setData);
            if (!updatedTicket) {
                return res.status(404).json({ ErrorMessage: "Ticket not found", data: {} });
            }

            if (this.io) {
                this.io.to(String(req.user._id)).emit("ticket_updated", updatedTicket);
            }

            return res.status(200).json({ ErrorMessage: "success", data: updatedTicket });
        } catch (err) {
            console.error("Error in cancelTicket:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       POST /update-readCount  { ticketId }
       ========================================================= */
    async updateReadCount(req, res) {
        try {
            const { ticketId } = req.body;
            if (!ticketId) {
                return res.status(400).json({ ErrorMessage: "Missing required fields", data: {} });
            }

            const updatedTicket = await ticketServices.markTicketRead(ticketId);
            if (!updatedTicket) {
                return res.status(404).json({ ErrorMessage: "Ticket not found", data: {} });
            }

            if (this.io) {
                this.io.to(String(req.user._id)).emit("ticket_read", {
                    ticketId,
                    unReadCount: 0,
                });
            }

            return res.status(200).json({ ErrorMessage: "success", data: updatedTicket });
        } catch (err) {
            console.error("Error in updateReadCount:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       GET /get-group-by-ticket
       ========================================================= */
    async getGroupByTicket(req, res) {
        try {
            const userId = req.user._id;
            const { limit, skip, search } = req.query;
            const setData = { limit, skip, userId, search };

            const groupByTicket = await groupService.getGroupByTicket(setData);
            if (groupByTicket) {
                return res.status(200).json({ ErrorMessage: "success", data: groupByTicket });
            }
            return res.status(404).json({ ErrorMessage: "No group found for this ticket", data: {} });
        } catch (err) {
            console.error("Error in getGroupByTicket:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       INTERNAL HELPER — called from message-received webhook
       Creates or updates the ticket for a new incoming message.
       ========================================================= */
    async upsertTicketFromMessage({ contactId, createdby, lastMessageId }) {
        try {
            const ticket = await ticketServices.create({
                contactId,
                createdby,
                lastMessageId,
            });

            if (this.io && ticket) {
                this.io.to(String(createdby)).emit("ticket_message_received", ticket);
            }

            return ticket;
        } catch (err) {
            console.error("Error in upsertTicketFromMessage:", err);
            return null;
        }
    }
}

module.exports = new Controller();