const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const contactModel = require("../models/contact.model");
const userModel = require("../models/users.model");
const messageService = require("../services/message.service");
const { splitPhoneNumber } = require("../helper/phone.helper");
const { getIO } = require("../socket");

/* ---------- helpers ---------- */
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
       GET /webhook/whatsapp — Meta verification
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
        console.warn("[webhook] verification failed");
        return res.sendStatus(403);
    }

    /* =========================================================
       POST /webhook/whatsapp — incoming messages
       ========================================================= */
    async receive(req, res) {
        // Ack Meta immediately
        res.status(200).json({ received: true });

        try {
            const body = req.body || {};
            if (body.object !== "whatsapp_business_account") {
                console.log("[webhook] ignoring non-WABA payload:", body.object);
                return;
            }

            const entries = Array.isArray(body.entry) ? body.entry : [];
            console.log(`[webhook] received ${entries.length} entries`);

            for (const entry of entries) {
                const changes = Array.isArray(entry.changes) ? entry.changes : [];
                for (const change of changes) {
                    const value = change?.value;
                    if (!value) continue;

                    const metadata = value.metadata || {};
                    const phoneNumberId = metadata.phone_number_id;
                    const displayPhone = metadata.display_phone_number;

                    console.log(`[webhook] change field=${change.field} phone_number_id=${phoneNumberId}`);

                    // ---- Resolve owner user ----
                    const owner = await userModel.findOne({ whatsappNumberId: phoneNumberId });

                    if (!owner) {
                        console.warn(`[webhook] no user owns phone_number_id=${phoneNumberId}`);
                        continue;
                    }
                    const userId = owner._id;
                    console.log(`[webhook] owner user=${userId}`);

                    const incomingContacts = Array.isArray(value.contacts) ? value.contacts : [];
                    const incomingMessages = Array.isArray(value.messages) ? value.messages : [];
                    console.log(`[webhook] messages=${incomingMessages.length} contacts=${incomingContacts.length}`);

                    for (const msg of incomingMessages) {
                        try {
                            const waId = msg.from; // "919800000004"
                            if (!waId) {
                                console.warn("[webhook] message has no from, skipping");
                                continue;
                            }

                            // ---- Split country code ----
                            const { mobileCode, mobileNo, mobileNoWithCode } = splitPhoneNumber(waId);
                            console.log(`[webhook] waId=${waId} → code=${mobileCode} number=${mobileNo}`);

                            // ---- Contact name from payload ----
                            const profileEntry = incomingContacts.find((c) => c.wa_id === waId);
                            const contactName = profileEntry?.profile?.name || mobileNoWithCode;

                            // ---- Upsert contact ----
                            let contact = await contactModel.findOne({
                                userId: userId,
                                isDelete: { $ne: 1 },
                                $or: [
                                    { mobileNoWithCode },
                                    { mobileNoWithCode: waId },
                                    { mobileNo, mobileCode },
                                ],
                            });

                            if (!contact) {
                                contact = await contactModel.create({
                                    name: contactName,
                                    mobileCode,
                                    mobileNo,
                                    mobileNoWithCode,
                                    userId: userId,
                                    isActive: 1,
                                    isDelete: 0,
                                });
                                console.log(`[webhook] contact created id=${contact._id} name=${contact.name}`);
                            } else {
                                console.log(`[webhook] contact reused id=${contact._id} name=${contact.name}`);
                            }

                            // ---- Save message + upsert ticket ----
                            const metaTimestamp = msg.timestamp
                                ? new Date(Number(msg.timestamp) * 1000)
                                : new Date();

                            const result = await messageService.createAndUpsertTicket({
                                contactId: contact._id,
                                userId: userId,
                                sendBy: "customer",
                                msgType: msg.type || "text",
                                message: extractMessagePreview(msg),
                                whatsAppMessageId: msg.id,
                                whatsappReplyMsgId: msg.context?.id || "",
                                interactiveReply: msg.interactive || msg.button || null,
                                _metaTimestamp: metaTimestamp,
                            });

                            console.log(
                                `[webhook] message saved=${!!result.message} ticket=${result.ticket?._id || "NONE"}`,
                                result.error ? `error=${result.error}` : ""
                            );

                            // ---- Socket ----
                            try {
                                const io = getIO();
                                const room = String(userId);
                                if (result.message) io.to(room).emit("message_received", result.message);
                                if (result.ticket) {
                                    io.to(room).emit("ticket_message_received", result.ticket);
                                    io.to(room).emit("ticket_updated", result.ticket);
                                }
                            } catch (s) {
                                console.error("[webhook] socket emit failed:", s.message);
                            }

                        } catch (msgErr) {
                            console.error("[webhook] message processing error:", msgErr);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("[webhook] fatal error:", err);
        }
    }
}

module.exports = new WebhookController();