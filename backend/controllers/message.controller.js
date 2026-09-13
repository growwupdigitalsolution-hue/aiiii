const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const messageService = require("../services/message.service");
const contactModel = require("../models/contact.model");
const { getIO } = require("../socket");

class Controller {

    /* =========================================================
       GET /api/message/get-by-contact/:contactId
       Query: ?limit=50&skip=0
       ========================================================= */
    async getByContact(req, res) {
        try {
            const { contactId } = req.params;
            const { limit = 50, skip = 0 } = req.query;

            if (!mongoose.Types.ObjectId.isValid(contactId)) {
                return res.status(400).json({ ErrorMessage: "Invalid contactId", data: {} });
            }

            const result = await messageService.getMessagesByContact({
                contactId,
                createdby: req.user._id,
                limit,
                skip,
            });

            return res.status(200).json({
                ErrorMessage: "success",
                data: result.messages || [],
                countData: result.count || 0,
            });
        } catch (err) {
            console.error("message.getByContact error:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       POST /api/message/send
       Body: { contactId, message, msgType? }
       ========================================================= */
    async send(req, res) {
        try {
            const { contactId, message, msgType = "text" } = req.body;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(contactId)) {
                return res.status(400).json({ ErrorMessage: "Invalid contactId", data: {} });
            }
            if (!message || !String(message).trim()) {
                return res.status(400).json({ ErrorMessage: "message is required", data: {} });
            }

            // Verify contact belongs to this user
            const contact = await contactModel.findOne({
                _id: new ObjectId(String(contactId)),
                createdby: new ObjectId(String(userId)),
                isDelete: { $ne: 1 },
            });
            if (!contact) {
                return res.status(404).json({ ErrorMessage: "Contact not found", data: {} });
            }

            const result = await messageService.createAndUpsertTicket({
                contactId,
                createdby: userId,
                sendBy: "system",       // outgoing
                msgType,
                message: String(message).trim(),
            });

            if (!result.message) {
                return res.status(500).json({ ErrorMessage: "Failed to save message", data: {} });
            }

            // TODO: hook your existing WhatsApp sender here
            // await whatsappService.sendText({ userId, contactId, text: message });

            try {
                const io = getIO();
                io.to(String(userId)).emit("message_sent", result.message);
            } catch (_) { }

            return res.status(201).json({ ErrorMessage: "success", data: result.message });
        } catch (err) {
            console.error("message.send error:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       POST /api/message/incoming
       Meta webhook helper — accepts a single message body
       Body: { contactId, createdby, message, sendBy?, msgType?, whatsAppMessageId? }
       ========================================================= */
    async incoming(req, res) {
        try {
            const {
                contactId,
                createdby,
                message,
                sendBy = "customer",
                msgType = "text",
                whatsAppMessageId,
                interactiveReply,
            } = req.body || {};

            if (!contactId || !createdby) {
                return res.status(400).json({
                    ErrorMessage: "contactId and createdby are required",
                    data: {},
                });
            }

            const result = await messageService.createAndUpsertTicket({
                contactId,
                createdby,
                message,
                sendBy,
                msgType,
                whatsAppMessageId,
                interactiveReply,
            });

            if (!result.message) {
                return res.status(500).json({
                    ErrorMessage: "Failed to save message",
                    data: {},
                });
            }

            try {
                const io = getIO();
                const roomId = String(createdby);

                io.to(roomId).emit("message_received", result.message);

                if (result.ticket) {
                    io.to(roomId).emit("ticket_message_received", result.ticket);
                    io.to(roomId).emit("ticket_updated", result.ticket);
                }
            } catch (socketErr) {
                console.error("message.incoming socket emit failed:", socketErr.message);
            }

            return res.status(200).json({
                ErrorMessage: "success",
                data: result,
            });
        } catch (err) {
            console.error("message.incoming error:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }
}

module.exports = new Controller();