// services/message.service.js
const messageModel = require("../models/message.model");
const ticketService = require("./ticket.service");
const saveMessageRecord = async (data) => messageModel.create(data);

const updateMessageRecord = async (messageId, data) =>
    messageModel.findOneAndUpdate({ _id: messageId }, data, { new: true });

// whatsAppMessageId se update karna hoga jab Meta ka delivery/read webhook aayega
const updateMessageByWhatsAppId = async (whatsAppMessageId, data) =>
    messageModel.findOneAndUpdate({ whatsAppMessageId }, data, { new: true });

const findByMessageId = async (messageId) =>
    messageModel.findOne({ _id: messageId, isDelete: false });

// Chat window - ek contact ke saare messages, purane se naye order me
const findMessagesByContactId = async (contactId, { skip = 0, limit = 50 } = {}) =>
    messageModel
        .find({ contactId, isDelete: false })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit);

// Broadcast report - is broadcast ke saare messages
const findMessagesByBroadcastId = async (broadcastId) =>
    messageModel.find({ broadcastId, isDelete: false });

// Broadcast report ke liye counts (sent/delivered/read/failed) ek query me
const getBroadcastMessageStats = async (broadcastId) => {
    const result = await messageModel.aggregate([
        { $match: { broadcastId: broadcastId, isDelete: false } },
        {
            $group: {
                _id: null,
                sent: { $sum: "$isSent" },
                delivered: { $sum: "$isDelivered" },
                read: { $sum: "$isRead" },
                failed: { $sum: "$isFailed" }
            }
        }
    ]);
    return result[0] || { sent: 0, delivered: 0, read: 0, failed: 0 };
};

const createAndUpsertTicket = async (getData) => {
    try {
        const message = await messageModel.create({
            contactId: getData.contactId,
            createdby: getData.createdby,
            sendBy: getData.sendBy || "customer",
            msgType: getData.msgType || "text",
            message: getData.message || "",
            msgfile: getData.msgfile || "",
            fileType: getData.fileType || "",
            fileName: getData.fileName || "",
            whatsAppMessageId: getData.whatsAppMessageId || "",
            whatsappReplyMsgId: getData.whatsappReplyMsgId || "",
            templateSnapshot: getData.templateSnapshot || null,
            interactiveReply: getData.interactiveReply || null,
            createdAt: getData._metaTimestamp || undefined, // preserve Meta timestamp
        });

        let ticket = null;
        if (getData.sendBy === "customer") {
            ticket = await ticketService.create({
                contactId: getData.contactId,
                createdby: getData.createdby,
                lastMessageId: message._id,
                _metaTimestamp: getData._metaTimestamp,
            });
        }

        return { message, ticket };
    } catch (err) {
        console.error("Error in messageService.createAndUpsertTicket:", err);
        return { message: null, ticket: null };
    }
}

const softDeleteMessage = async (messageId) =>
    messageModel.findOneAndUpdate({ _id: messageId }, { isDelete: true });

module.exports = {
    saveMessageRecord,
    updateMessageRecord,
    updateMessageByWhatsAppId,
    findByMessageId,
    findMessagesByContactId,
    findMessagesByBroadcastId,
    getBroadcastMessageStats,
    softDeleteMessage,
    createAndUpsertTicket
};