const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const ticketModel = require("../models/ticket.model");

class Services {

    /* =========================================================
       CREATE or UPDATE the active ticket for a contact.
       Rule: one active (pending | inProgress) ticket per contact.
       ========================================================= */
    async create(getData) {
        const activeFilter = {
            contactId: new ObjectId(getData.contactId),
            createdby: new ObjectId(getData.createdby),
            ticketstatus: { $in: ["pending", "inProgress"] },
        };

        const existing = await ticketModel.findOne(activeFilter);

        if (existing) {
            const updated = await ticketModel.findByIdAndUpdate(
                existing._id,
                {
                    lastMessageId: getData.lastMessageId,
                    lastMessageAt: new Date(),
                    unReadCount: (existing.unReadCount || 0) + 1,
                },
                { new: true }
            );
            return updated || existing;
        }

        // Generate next ticket number
        const lastTicket = await ticketModel
            .findOne({ createdby: new ObjectId(getData.createdby) })
            .sort({ ticketNumber: -1 });

        const ticketNumber = lastTicket?.ticketNumber ? lastTicket.ticketNumber + 1 : 1;

        const newTicket = new ticketModel({
            contactId: getData.contactId,
            createdby: getData.createdby,
            lastMessageId: getData.lastMessageId,
            lastMessageAt: new Date(),
            ticketstatus: "pending",
            ticketNumber,
            unReadCount: 1,
        });

        return await newTicket.save();
    }

    /* =========================================================
       GET ALL tickets for a user (paginated, searchable)
       Sorted by lastMessageAt DESC
       ========================================================= */
    async getAllTickets(getData) {
        const limit = getData.limit != null ? +getData.limit : 10;
        const skip = getData.skip != null ? +getData.skip : 0;

        const whereObject = {
            createdby: new ObjectId(getData.userId),
            ticketstatus: "pending",
            isdeleted: false,
        };

        const pipeline = [
            { $match: whereObject },
            {
                $lookup: {
                    from: "contacts",
                    localField: "contactId",
                    foreignField: "_id",
                    as: "contact",
                },
            },
            { $unwind: { path: "$contact", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "messages",
                    localField: "lastMessageId",
                    foreignField: "_id",
                    as: "messages",
                },
            },
            { $unwind: { path: "$messages", preserveNullAndEmptyArrays: true } },
        ];

        // Optional search on contact name
        if (getData.search && getData.search.trim()) {
            pipeline.push({
                $match: {
                    "contact.name": { $regex: new RegExp(getData.search.trim(), "i") },
                },
            });
        }

        pipeline.push(
            {
                $project: {
                    _id: 1,
                    ticketNumber: 1,
                    ticketstatus: 1,
                    unReadCount: 1,
                    lastMessageAt: 1,
                    createdAt: 1,
                    contact: {
                        _id: "$contact._id",
                        name: "$contact.name",
                        mobileNoWithCode: "$contact.mobileNoWithCode",
                    },
                    messages: {
                        _id: "$messages._id",
                        message: "$messages.message",
                        createdAt: "$messages.createdAt",
                    },
                },
            },
            // NEW: sort by latest message time
            { $sort: { lastMessageAt: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        );

        try {
            return await ticketModel.aggregate(pipeline);
        } catch (err) {
            console.error("Error in getAllTickets:", err);
            return false;
        }
    }

    /* =========================================================
       COUNT tickets
       ========================================================= */
    async countTicket(ticket) {
        const whereObject = {
            createdby: new ObjectId(ticket.userId),
            ticketstatus: "pending",
            isdeleted: false,
        };
        return await ticketModel.countDocuments(whereObject);
    }

    /* =========================================================
       GET single ticket by id
       ========================================================= */
    async getTicketById(id) {
        try {
            return await ticketModel.findById(id);
        } catch (err) {
            console.error("Error in getTicketById:", err);
            return null;
        }
    }

    /* =========================================================
       UPDATE ticket (generic)
       - If `lastMessageId` is passed and `lastMessageAt` isn't, set it now.
       ========================================================= */
    async updateTicket(id, getData) {
        try {
            const update = { ...getData };

            if (update.lastMessageId && !update.lastMessageAt) {
                update.lastMessageAt = new Date();
            }

            return await ticketModel.findOneAndUpdate(
                { _id: new ObjectId(id) },
                update,
                { new: true }
            );
        } catch (err) {
            console.error("Error in updateTicket:", err);
            return false;
        }
    }

    /* =========================================================
       MARK ticket as read (reset unread count)
       ========================================================= */
    async markTicketRead(id) {
        try {
            return await ticketModel.findOneAndUpdate(
                { _id: new ObjectId(id) },
                { unReadCount: 0 },
                { new: true }
            );
        } catch (err) {
            console.error("Error in markTicketRead:", err);
            return false;
        }
    }

    /* =========================================================
       MARK ticket as unread (increment unread count)
       ========================================================= */
    async markTicketUnread(id) {
        try {
            return await ticketModel.findOneAndUpdate(
                { _id: new ObjectId(id) },
                { $inc: { unReadCount: 1 } },
                { new: true }
            );
        } catch (err) {
            console.error("Error in markTicketUnread:", err);
            return false;
        }
    }

    /* =========================================================
       MOVE ticket to a group (or back to no-group with 'empty')
       ========================================================= */
    async moveTicketToGroup(ticketId, groupId) {
        try {
            const update =
                groupId === "empty"
                    ? { groupId: null, ticketstatus: "pending" }
                    : { groupId: new ObjectId(groupId), ticketstatus: "inProgress" };

            return await ticketModel.findOneAndUpdate(
                { _id: new ObjectId(ticketId) },
                update,
                { new: true }
            );
        } catch (err) {
            console.error("Error in moveTicketToGroup:", err);
            return false;
        }
    }
}

module.exports = new Services();