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
                userId: req.user._id,
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
       Body (text):     { contactId, message, msgType: "text" }
       Body (image/doc): multipart/form-data -> contactId, msgType, message?, file
       Body (location):  { contactId, msgType: "location", latitude, longitude, locationName? }
       ========================================================= */
    async send(req, res) {
        try {
            const {
                contactId,
                message = "",
                msgType = "text",
                latitude,
                longitude,
                locationName,
            } = req.body;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(contactId)) {
                return res.status(400).json({ ErrorMessage: "Invalid contactId", data: {} });
            }

            // Verify contact belongs to this user
            const contact = await contactModel.findOne({
                _id: new ObjectId(String(contactId)),
                userId: new ObjectId(String(userId)),
                isDelete: { $ne: 1 },
            });
            if (!contact) {
                return res.status(404).json({ ErrorMessage: "Contact not found", data: {} });
            }

            const payload = {
                contactId,
                userId,
                sendBy: "system", // outgoing
                msgType,
            };

            if (msgType === "image" || msgType === "document") {
                // upload.single("file") middleware (routes file me lagaya hua) se yahan file milegi
                if (!req.file) {
                    return res.status(400).json({ ErrorMessage: "file is required", data: {} });
                }
                // TODO: agar S3/Cloudinary use kar rahe ho to yahan uska public URL set karo
                payload.msgfile = `/uploads/${req.file.filename}`;
                payload.fileType = req.file.mimetype;
                payload.fileName = req.file.originalname;
                payload.message = message ? String(message).trim() : "";
            } else if (msgType === "location") {
                if (latitude === undefined || longitude === undefined) {
                    return res.status(400).json({ ErrorMessage: "latitude and longitude are required", data: {} });
                }
                payload.message = locationName ? String(locationName).trim() : "";
                // Location ko filhal templateSnapshot me store kar rahe hain.
                // Agar message.model me alag se `location: { lat, lng, name }` field chahiye,
                // wahan add karke yahan use kar lena — abhi ke liye yeh kaam chala dega.
                payload.templateSnapshot = { latitude, longitude, locationName: locationName || "" };
            } else {
                if (!message || !String(message).trim()) {
                    return res.status(400).json({ ErrorMessage: "message is required", data: {} });
                }
                payload.message = String(message).trim();
            }



            const result = await messageService.createAndUpsertTicket(payload);

            if (!result.message) {
                return res.status(500).json({ ErrorMessage: "Failed to save message", data: {} });
            }

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
       ========================================================= */
    async incoming(req, res) {
        try {
            const {
                contactId,
                userId,
                message,
                sendBy = "customer",
                msgType = "text",
                whatsAppMessageId,
                interactiveReply,
            } = req.body || {};

            if (!contactId || !userId) {
                return res.status(400).json({
                    ErrorMessage: "contactId and createdby are required",
                    data: {},
                });
            }

            const result = await messageService.createAndUpsertTicket({
                contactId,
                userId,
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
                const roomId = String(userId);

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

    /* =========================================================
       GET /api/chat-list
       Query: ?limit=&skip=&search=&status=
       status: all | unread | pending | inProgress | closed
       ========================================================= */
    async chatList(req, res) {
        try {
            const { limit, skip, search, status } = req.query;
            const result = await messageService.getChatList({
                userId: req.user._id,
                limit,
                skip,
                search,
                status,
            });

            if (result === false) {
                return res.status(500).json({ ErrorMessage: "Something went wrong" });
            }

            return res.status(200).json({
                ErrorMessage: "success",
                data: result.data,
                total: result.total,
                hasMore: result.hasMore,
            });
        } catch (err) {
            console.error("message.getByContact error:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       GET /api/chat-details/:contactId
       Query: ?limit=&skip=
       ========================================================= */
    async chatDetails(req, res) {
        try {
            const { contactId } = req.params;
            const { limit, skip } = req.query;
            const userId = req.user._id; // verifyToken middleware se aaya

            if (!contactId) {
                return res.status(400).json({ ErrorMessage: "contactId is required" });
            }

            const result = await messageService.getChatDetails({
                userId,
                contactId,
                limit,
                skip,
            });

            if (result === false) {
                return res.status(500).json({ ErrorMessage: "Something went wrong" });
            }

            return res.status(200).json({
                ErrorMessage: "success",
                data: result.data,
                contact: result.contact, // header ke liye: name, group, ticketStatus, isOnline
                total: result.total,
                hasMore: result.hasMore,
            });
        } catch (err) {
            console.error("[chat.controller] chatDetails error:", err);
            return res.status(500).json({ ErrorMessage: "Something went wrong" });
        }
    }
}

module.exports = new Controller();