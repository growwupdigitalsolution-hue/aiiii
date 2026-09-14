const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const ticketModel = require("../models/ticket.model");

const toObjectId = (v) => new ObjectId(String(v));

class Services {

    /* =========================================================
       CREATE or UPDATE the active ticket for a contact
       ========================================================= */
    async create(getData) {
        console.log("[ticket.service] create called:", {
            contactId: getData?.contactId,
            createdby: getData?.createdby,
            lastMessageId: getData?.lastMessageId,
        });

        const contactId = toObjectId(getData.contactId);
        const userId = toObjectId(getData.userId);
        const lastMessageAt = getData._metaTimestamp
            ? new Date(getData._metaTimestamp)
            : new Date();

        const activeFilter = {
            contactId,
            userId,
            ticketstatus: { $in: ["pending", "inProgress"] },
        };

        const existing = await ticketModel.findOne(activeFilter);
        console.log(`[ticket.service] existing active ticket: ${existing?._id || "NONE"}`);

        if (existing) {
            const updated = await ticketModel.findByIdAndUpdate(
                existing._id,
                {
                    lastMessageId: getData.lastMessageId,
                    lastMessageAt,
                    unReadCount: (existing.unReadCount || 0) + 1,
                },
                { new: true }
            );
            return updated;
        }

        const lastTicket = await ticketModel
            .findOne({ userId })
            .sort({ ticketNumber: -1 });
        const ticketNumber = lastTicket?.ticketNumber ? lastTicket.ticketNumber + 1 : 1;
        console.log(`[ticket.service] next ticketNumber=${ticketNumber}`);

        const newTicket = new ticketModel({
            contactId,
            userId,
            lastMessageId: getData.lastMessageId,
            lastMessageAt,
            ticketstatus: "pending",
            ticketNumber,
            unReadCount: 1,
        });

        const saved = await newTicket.save();
        console.log(`[ticket.service] ticket CREATED id=${saved._id} number=${saved.ticketNumber}`);
        return saved;
    }

    async getAllTickets(getData) {
        const limit = getData.limit != null ? +getData.limit : 10;
        const skip = getData.skip != null ? +getData.skip : 0;

        const whereObject = {
            userId: new ObjectId(getData.userId),
            ticketstatus: "pending",
            isdeleted: false,
        };

        const pipeline = [
            { $match: whereObject },
            { $lookup: { from: "contacts", localField: "contactId", foreignField: "_id", as: "contact" } },
            { $unwind: { path: "$contact", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "messages", localField: "lastMessageId", foreignField: "_id", as: "messages" } },
            { $unwind: { path: "$messages", preserveNullAndEmptyArrays: true } },
        ];

        if (getData.search?.trim()) {
            pipeline.push({ $match: { "contact.name": { $regex: new RegExp(getData.search.trim(), "i") } } });
        }

        pipeline.push(
            {
                $project: {
                    _id: 1, ticketNumber: 1, ticketstatus: 1, unReadCount: 1,
                    lastMessageAt: 1, createdAt: 1,
                    contact: { _id: "$contact._id", name: "$contact.name", mobileNoWithCode: "$contact.mobileNoWithCode" },
                    messages: { _id: "$messages._id", message: "$messages.message", createdAt: "$messages.createdAt" },
                },
            },
            { $sort: { lastMessageAt: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        );

        try { return await ticketModel.aggregate(pipeline); }
        catch (err) { console.error("[ticket.service] getAllTickets error:", err); return false; }
    }

    async countTicket(ticket) {
        return await ticketModel.countDocuments({
            userId: new ObjectId(ticket.userId),
            ticketstatus: "pending",
            isdeleted: false,
        });
    }

    async getTicketById(id) {
        try { return await ticketModel.findById(id); }
        catch (err) { console.error("[ticket.service] getTicketById error:", err); return null; }
    }

    async updateTicket(id, getData) {
        try {
            const update = { ...getData };
            if (update.lastMessageId && !update.lastMessageAt) update.lastMessageAt = new Date();
            return await ticketModel.findOneAndUpdate({ _id: new ObjectId(id) }, update, { new: true });
        } catch (err) { console.error("[ticket.service] updateTicket error:", err); return false; }
    }

    async markTicketRead(id) {
        return await ticketModel.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { unReadCount: 0 },
            { new: true }
        );
    }

    async markTicketUnread(id) {
        return await ticketModel.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $inc: { unReadCount: 1 } },
            { new: true }
        );
    }

    async moveTicketToGroup(ticketId, groupId) {
        const update = groupId === "empty"
            ? { groupId: null, ticketstatus: "pending" }
            : { groupId: new ObjectId(groupId), ticketstatus: "inProgress" };
        return await ticketModel.findOneAndUpdate(
            { _id: new ObjectId(ticketId) },
            update,
            { new: true }
        );
    }
}

module.exports = new Services();