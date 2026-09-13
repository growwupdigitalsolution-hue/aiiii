const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const contactModel = require("../models/contact.model");
const ticketService = require("../services/ticket.service");
const messageService = require("../services/message.service");
const { getIO } = require("../socket");

/* =========================================================
   Helpers
   ========================================================= */
const normalizePhone = (raw) => {
    if (!raw) return "";
    const digits = String(raw).replace(/\D/g, "");
    return digits.startsWith("+") ? digits : `+${digits}`;
};

const phoneWithoutPlus = (raw) => String(raw || "").replace(/\D/g, "");

/* Try to extract text/preview from any Meta message type */
const extractMessagePreview = (msg) => {
    if (!msg) return "";
    if (msg.text?.body) return msg.text.body;
    if (msg.button?.text) return msg.button.text;
    if (msg.interactive?.button_reply?.title) return msg.interactive.button_reply.title;
    if (msg.interactive?.list_reply?.title) return msg.interactive.list_reply.title;
    if (msg.image?.caption) return msg.image.caption;
    if (msg.video?.caption) return msg.video.caption;
    if (msg.document?.filename) return msg.document.filename;
    if (msg.audio) return "[audio]";
    if (msg.sticker) return "[sticker]";
    if (msg.location) return `[location: ${msg.location.latitude},${msg.location.longitude}]`;
    return `[${msg.type || "unknown"}]`;
};

class WebhookController {

    /* =========================================================
       GET /api/webhook/whatsapp
       Meta webhook verification handshake.
       ========================================================= */
    async verify(req, res) {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN;

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("[webhook] verified");
            return res.status(200).send(challenge);
        }
        console.warn("[webhook] verification failed", { mode, token });
        return res.sendStatus(403);
    }

    /* =========================================================
       POST /api/webhook/whatsapp
       Meta posts incoming messages here.
       ========================================================= */
    async receive(req, res) {
        // Acknowledge immediately — Meta retries if you don't 200 within ~5s
        res.status(200).json({ received: true });

        try {
            const body = req.body || {};
            if (body.object !== "whatsapp_business_account") return;

            const entries = Array.isArray(body.entry) ? body.entry : [];

            for (const entry of entries) {
                const changes = Array.isArray(entry.changes) ? entry.changes : [];
                for (const change of changes) {
                    const value = change?.value;
                    if (!value) continue;

                    const metadata = value.metadata || {};
                    const phoneNumberId = metadata.phone_number_id;
                    const displayPhone = metadata.display_phone_number;

                    // Resolve which of your users owns this WABA/phone
                    // Adjust this lookup to your actual user schema
                    const userModel = require("../models/users.model");
                    const owner = await userModel.findOne({ whatsappNumberId: phoneNumberId });
                    console.log("[webhook] incoming message for phone_number_id", phoneNumberId, "owner:", owner?._id);
                    if (!owner) {
                        console.warn("[webhook] no owner for phone_number_id", phoneNumberId);
                        continue;
                    }
                    const userId = owner._id;

                    // Meta includes contact profile(s) in the same payload
                    const incomingContacts = Array.isArray(value.contacts) ? value.contacts : [];
                    const incomingMessages = Array.isArray(value.messages) ? value.messages : [];

                    for (const msg of incomingMessages) {
                        try {
                            const waId = msg.from; // e.g. "919876543210"
                            const waIdWithPlus = normalizePhone(waId);

                            // Contact name (fallback to phone)
                            const profileEntry = incomingContacts.find((c) => c.wa_id === waId);
                            const contactName = profileEntry?.profile?.name || waIdWithPlus;

                            // ---- Upsert contact ----
                            let contact = await contactModel.findOne({
                                createdby: userId,
                                $or: [
                                    { mobileNoWithCode: waIdWithPlus },
                                    { mobileNoWithCode: waId },
                                    { mobileNo: phoneWithoutPlus(waId) },
                                ],
                                isDelete: { $ne: 1 },
                            });

                            if (!contact) {
                                contact = await contactModel.create({
                                    name: contactName,
                                    mobileCode: waIdWithPlus.slice(0, 3), // best-effort
                                    mobileNo: phoneWithoutPlus(waId),
                                    mobileNoWithCode: waIdWithPlus,
                                    createdby: userId,
                                    isActive: 1,
                                    isDelete: 0,
                                });
                            }

                            // ---- Save message + upsert ticket ----
                            const result = await messageService.createAndUpsertTicket({
                                contactId: contact._id,
                                createdby: userId,
                                sendBy: "customer",
                                msgType: msg.type || "text",
                                message: extractMessagePreview(msg),
                                whatsAppMessageId: msg.id,
                                interactiveReply: msg.interactive || msg.button || null,
                                whatsappReplyMsgId: msg.context?.id || "",
                                // Use Meta's timestamp for lastMessageAt
                                _metaTimestamp: msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date(),
                            });

                            // ---- Emit socket events ----
                            try {
                                const io = getIO();
                                io.to(String(userId)).emit("message_received", result.message);
                                if (result.ticket) {
                                    io.to(String(userId)).emit("ticket_message_received", result.ticket);
                                    io.to(String(userId)).emit("ticket_updated", result.ticket);
                                }
                            } catch (socketErr) {
                                console.error("[webhook] socket emit failed:", socketErr.message);
                            }

                        } catch (msgErr) {
                            console.error("[webhook] failed to process message:", msgErr);
                        }
                    }
                }
            }
        } catch (err) {
            console.log("[webhook] error:", err);
        }
    }
}

module.exports = new WebhookController();