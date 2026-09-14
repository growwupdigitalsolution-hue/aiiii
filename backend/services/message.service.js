// services/message.service.js
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const messageModel = require("../models/message.model");
const ticketService = require("./ticket.service");
const ticketModel = require("../models/ticket.model"); // latest ticket status padhne ke liye
const contactModel = require("../models/contact.model"); // apna actual path check kar lena

// Customer ka session window — WhatsApp jaisa hi 24 ghante ka window use kar rahe hain.
// Iske andar customer ne last message bheja ho to contact ko "online / live chat available" dikhate hain.
const ONLINE_WINDOW_MS = 24 * 60 * 60 * 1000;

const saveMessageRecord = async (data) => messageModel.create(data);

const updateMessageRecord = async (messageId, data) =>
    messageModel.findOneAndUpdate({ _id: messageId }, data, { new: true });

// whatsAppMessageId se update karna hoga jab Meta ka delivery/read webhook aayega
const updateMessageByWhatsAppId = async (whatsAppMessageId, data) =>
    messageModel.findOneAndUpdate({ whatsAppMessageId }, data, { new: true });

const findByMessageId = async (messageId) =>
    messageModel.findOne({ _id: messageId, isDelete: false });

const softDeleteMessage = async (messageId) =>
    messageModel.findOneAndUpdate({ _id: messageId }, { isDelete: true });

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

// Ek jagah se isOnline calculate karne ke liye (list + details dono me use hota hai)
const computeIsOnline = (lastCustomerMessageAt) => {
    if (!lastCustomerMessageAt) return false;
    return Date.now() - new Date(lastCustomerMessageAt).getTime() <= ONLINE_WINDOW_MS;
};

const createAndUpsertTicket = async (getData) => {
    try {
        const message = await messageModel.create({
            contactId: getData.contactId,
            userId: getData.userId,
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
                userId: getData.userId,
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

/* =========================================================
   Chat list — ab group name, latest ticket status aur
   24-hour window ke hisaab se online/offline status bhi
   return karta hai. `status` filter se pending/inProgress/
   closed/unread bhi server-side filter ho sakta hai.
   ========================================================= */
const getChatList = async ({ userId, limit = 10, skip = 0, search = "", status = "all" }) => {
    limit = Number(limit) || 10;
    skip = Number(skip) || 0;

    try {
        const matchStage = { userId: new ObjectId(userId), isDelete: false };

        // Agar search text hai to pehle matching contacts dhoondo,
        // fir sirf unhi contactIds ke messages consider karo
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            const matchedContacts = await contactModel.find(
                {
                    userId: new ObjectId(userId),
                    $or: [{ name: regex }, { mobileNoWithCode: regex }, { mobileNo: regex }]
                },
                { _id: 1 }
            );
            if (matchedContacts.length === 0) {
                return { data: [], total: 0, hasMore: false };
            }
            matchStage.contactId = { $in: matchedContacts.map((c) => c._id) };
        }

        // Status filter query ke stage me convert karo (unread ke liye alag handling,
        // baaki ticket status ke liye)
        const statusMatchStage = {};
        if (status === "unread") {
            statusMatchStage.unreadCount = { $gt: 0 };
        } else if (["pending", "inProgress", "closed"].includes(status)) {
            statusMatchStage["ticket.ticketstatus"] = status;
        }

        const pipeline = [
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$contactId",
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ["$isRead", 0] }, { $eq: ["$sendBy", "customer"] }] },
                                1,
                                0
                            ]
                        }
                    },
                    // Customer ka sabse recent message kab aaya — online status yahi decide karega
                    lastCustomerMessageAt: {
                        $max: {
                            $cond: [{ $eq: ["$sendBy", "customer"] }, "$createdAt", null]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "contacts",
                    localField: "_id",
                    foreignField: "_id",
                    as: "contact"
                }
            },
            { $unwind: { path: "$contact", preserveNullAndEmptyArrays: true } },
            // Is contact ka sabse latest ticket (status + groupId dono yahin se aayenge, groupId contact model me nahi hai)
            {
                $lookup: {
                    from: "tickets",
                    let: { cId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$contactId", "$$cId"] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 },
                        { $project: { _id: 0, ticketstatus: 1, ticketNumber: 1, groupId: 1 } }
                    ],
                    as: "ticket"
                }
            },
            { $unwind: { path: "$ticket", preserveNullAndEmptyArrays: true } },
            // Ticket kisi group se linked hai to uska naam yahan aa jaayega
            {
                $lookup: {
                    from: "groups",
                    localField: "ticket.groupId",
                    foreignField: "_id",
                    as: "group"
                }
            },
            { $unwind: { path: "$group", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    isOnline: {
                        $cond: [
                            {
                                $and: [
                                    "$lastCustomerMessageAt",
                                    {
                                        $lte: [
                                            { $subtract: ["$$NOW", "$lastCustomerMessageAt"] },
                                            ONLINE_WINDOW_MS
                                        ]
                                    }
                                ]
                            },
                            true,
                            false
                        ]
                    }
                }
            },
            ...(Object.keys(statusMatchStage).length ? [{ $match: statusMatchStage }] : []),
            { $sort: { "lastMessage.createdAt": -1 } },
            {
                // $facet se ek hi query me page ka data + total count dono mil jaate hain
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 0,
                                contactId: "$_id",
                                contact: 1,
                                groupId: "$ticket.groupId",
                                groupName: "$group.name",
                                ticketStatus: "$ticket.ticketstatus",
                                ticketNumber: "$ticket.ticketNumber",
                                isOnline: 1,
                                unreadCount: 1,
                                lastMessage: {
                                    _id: "$lastMessage._id",
                                    message: "$lastMessage.message",
                                    msgType: "$lastMessage.msgType",
                                    sendBy: "$lastMessage.sendBy",
                                    isSent: "$lastMessage.isSent",
                                    isDelivered: "$lastMessage.isDelivered",
                                    isRead: "$lastMessage.isRead",
                                    isFailed: "$lastMessage.isFailed",
                                    createdAt: "$lastMessage.createdAt"
                                }
                            }
                        }
                    ],
                    totalCount: [{ $count: "count" }]
                }
            }
        ];

        const result = await messageModel.aggregate(pipeline);
        const data = result[0]?.data || [];
        const total = result[0]?.totalCount?.[0]?.count || 0;

        return { data, total, hasMore: skip + data.length < total };
    } catch (err) {
        console.error("[message.service] getChatList error:", err);
        return false;
    }
};

/* =========================================================
   Chat details — messages ke saath-saath header ke liye
   contact info (group, latest ticket status, online status)
   bhi return karta hai.
   ========================================================= */
const getChatDetails = async ({ userId, contactId, limit = 30, skip = 0 }) => {
    limit = Number(limit) || 30;
    skip = Number(skip) || 0;

    try {
        const match = {
            userId: new ObjectId(userId),
            contactId: new ObjectId(contactId),
            isDelete: false
        };

        // Sabse naye messages pehle uthao (skip/limit ke liye), fir chat display order (purana -> naya) me palat do
        const [messages, total, contactDoc, latestTicket, lastCustomerMsg] = await Promise.all([
            messageModel
                .find(match)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            messageModel.countDocuments(match),
            // groupId contact model me nahi hai, isliye yahan koi populate nahi
            contactModel.findById(contactId).lean(),
            // groupId ticket model me hai — yahin se populate karke group ka naam le lo
            ticketModel
                .findOne({ contactId: match.contactId, userId: match.userId })
                .sort({ createdAt: -1 })
                .select("ticketstatus ticketNumber groupId")
                .populate("groupId", "name")
                .lean(),
            // isOnline ke liye poore history me se customer ka sabse recent message (pagination se independent)
            messageModel
                .findOne({ contactId: match.contactId, userId: match.userId, sendBy: "customer", isDelete: false })
                .sort({ createdAt: -1 })
                .select("createdAt")
                .lean()
        ]);

        // Contact ke bheje hue unread messages ko read mark karo (chat open hone par)
        await messageModel.updateMany(
            {
                ...match,
                sendBy: "customer",
                isRead: 0
            },
            {
                $set: { isRead: 1, isReadTime: new Date() }
            }
        );

        return {
            data: messages.reverse(), // ab purana -> naya (top se bottom chat order)
            total,
            hasMore: skip + messages.length < total,
            contact: contactDoc
                ? {
                    _id: contactDoc._id,
                    name: contactDoc.name,
                    mobileNoWithCode: contactDoc.mobileNoWithCode,
                    group: latestTicket?.groupId
                        ? { _id: latestTicket.groupId._id, name: latestTicket.groupId.name }
                        : null,
                    ticketStatus: latestTicket?.ticketstatus || null,
                    ticketNumber: latestTicket?.ticketNumber || null,
                    isOnline: computeIsOnline(lastCustomerMsg?.createdAt)
                }
                : null
        };
    } catch (err) {
        console.error("[message.service] getChatDetails error:", err);
        return false;
    }
};



module.exports = {
    saveMessageRecord,
    updateMessageRecord,
    updateMessageByWhatsAppId,
    findByMessageId,
    findMessagesByContactId,
    findMessagesByBroadcastId,
    getBroadcastMessageStats,
    softDeleteMessage,
    createAndUpsertTicket,
    getChatList,
    getChatDetails,
    computeIsOnline
};