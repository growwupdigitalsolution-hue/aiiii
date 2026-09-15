const groupModel = require("../models/group.model");
const mongoose = require("mongoose");
const groupContactModel = require("../models/groupContact.model");
const ObjectId = mongoose.Types.ObjectId;

class Services {
    async duplicatCheck(param) {
        try {
            return await groupModel.countDocuments(param);
        } catch (error) {
            console.error("duplicatCheck error:", error);
            return false;
        }
    }

    async create(params) {
        try {
            const group = new groupModel(params);
            return await group.save();
        } catch (error) {
            console.error("create error:", error);
            return false;
        }
    }
    async getAll(setData) {
        try {
            let whereObject = {
                createdby: new ObjectId(setData.id),
                isDelete: 0
            };

            if (setData.name) {
                whereObject.name = { $regex: new RegExp(setData.name, "i") };
            }

            const [count, data] = await Promise.all([
                groupModel.countDocuments(whereObject),
                groupModel.aggregate([
                    { $match: whereObject },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            description: 1,
                            totalContact: 1
                        }
                    },
                    { $sort: { _id: -1 } },
                    { $skip: +(setData.skip || 0) },
                    { $limit: +(setData.limit || 10) }
                ])
            ]);

            return { count, data };
        } catch (error) {
            console.error("getAll error:", error);
            return false;
        }
    }

    async getById(id) {
        try {
            const result = await groupModel.aggregate([
                { $match: { _id: new ObjectId(id) } },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        description: 1,
                        totalContact: 1
                    }
                }
            ]);
            return result;
        } catch (error) {
            console.error("getById error:", error);
            return false;
        }
    }

    async update(id, param) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) return false;
            return await groupModel.findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(id), isDelete: 0 },
                { $set: param },
                { new: true, runValidators: true }
            );
        } catch (error) {
            console.error("update error:", error);
            return false;
        }
    }

    async delete(id) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) return false;
            return await groupModel.findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(id), isDelete: 0 },
                { $set: { isDelete: 1 } },
                { new: true }
            );
        } catch (error) {
            console.error("delete error:", error);
            return false;
        }
    }

    async getAllActiveModel() {
        try {
            return await groupModel.getAllActiveModel();
        } catch (error) {
            console.error("getAllActiveModel error:", error);
            return false;
        }
    }

    async getUserCount(param) {
        try {
            const whereParam = { isDelete: 0 };

            if (param.isAdminId == 1) {
                whereParam.createdBy = { $eq: new ObjectId(param.createdBy) };
            } else {
                whereParam.createdBy = { $ne: new ObjectId(param.createdBy) };
            }

            return await groupModel.countDocuments(whereParam);
        } catch (error) {
            console.error("getUserCount error:", error);
            return false;
        }
    }

    async deleteContactGroup(id) {
        try {
            return await groupContactModel.deleteMany({
                groupId: new ObjectId(id)
            });
        } catch (error) {
            console.error("deleteContactGroup error:", error);
            return false;
        }
    }

    async groupCount(id) {
        try {
            const countGroup = await groupModel.countDocuments({
                createdby: new ObjectId(id),
                isActive: 1,
                isDelete: 0
            });

            return { countGroup };
        } catch (error) {
            console.error("groupCount error:", error);
            return false;
        }
    }

    async getGroupByTicket(getData) {
        try {
            const limit = getData.limit !== undefined ? +getData.limit : 10;
            const skip = getData.skip !== undefined ? +getData.skip : 0;

            const whereObject = {
                isActive: 1,
                isDelete: 0,
                createdby: new ObjectId(getData.userId),
            };

            const result = await groupModel.aggregate([
                { $match: whereObject },
                {
                    $lookup: {
                        from: "tickets",
                        let: { groupId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$groupId", "$$groupId"] },
                                            { $eq: ["$userId", new ObjectId(getData.userId)] },
                                            { $eq: ["$ticketstatus", "inProgress"] },
                                        ],
                                    },
                                },
                            },
                            {
                                $lookup: {
                                    from: "contacts",
                                    localField: "contactId",
                                    foreignField: "_id",
                                    as: "contactsData",
                                },
                            },
                            {
                                $lookup: {
                                    from: "messages",
                                    localField: "lastMessageId",
                                    foreignField: "_id",
                                    as: "messagesData",
                                },
                            },
                            {
                                $project: {
                                    _id: 1,
                                    ticketstatus: 1,
                                    ticketNumber: 1,
                                    unReadCount: 1,
                                    lastMessageAt: 1,
                                    createdAt: 1,
                                    contact: {
                                        _id: { $arrayElemAt: ["$contactsData._id", 0] },
                                        name: { $arrayElemAt: ["$contactsData.name", 0] },
                                    },
                                    messages: {
                                        _id: { $arrayElemAt: ["$messagesData._id", 0] },
                                        message: { $arrayElemAt: ["$messagesData.message", 0] },
                                        createdAt: { $arrayElemAt: ["$messagesData.createdAt", 0] },
                                    },
                                },
                            },
                            // NEW: sort tickets inside each group by lastMessageAt desc
                            { $sort: { lastMessageAt: -1, createdAt: -1 } },
                        ],
                        as: "ticketData",
                    },
                },
                {
                    $addFields: {
                        ticketCount: { $size: "$ticketData" },
                        unreadCount: {
                            $sum: {
                                $map: {
                                    input: "$ticketData",
                                    as: "t",
                                    in: { $ifNull: ["$$t.unReadCount", 0] },
                                },
                            },
                        },
                    },
                },
                { $sort: { ticketCount: -1 } },
                { $skip: skip },
                { $limit: limit },
            ]);

            return result;
        } catch (error) {
            console.error("getGroupByTicket error:", error);
            return false;
        }
    }
    async getContactByGroupId(groupId) {
        try {
            const result = await groupContactModel.find({ groupId: new ObjectId(groupId) })
                .populate({
                    path: "contactId",
                    select: "name mobileNo mobileCode"
                });
            return result;
        } catch (error) {
            console.error("getContactByGroupId error:", error);
            return false;
        }
    }
}

module.exports = new Services();