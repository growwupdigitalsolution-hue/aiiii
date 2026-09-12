// services/broadcast.service.js
const broadcastModel = require("../models/broadcast.model");

const saveBroadcastRecord = async (data) => broadcastModel.create(data);

const updateBroadcastRecord = async (broadcastId, data) =>
    broadcastModel.findOneAndUpdate({ _id: broadcastId }, data, { new: true });

const findByBroadcastId = async (broadcastId, createdby) =>
    broadcastModel.findOne({ _id: broadcastId, createdby, isDeleted: 0 })
        .populate("templateId", "name")
        .populate("groupId", "name");

const findManyByBroadcastIds = async (broadcastIds) =>
    broadcastModel.find({ _id: { $in: broadcastIds }, isDeleted: 0 });

const softDeleteBroadcast = async (broadcastId, createdby) =>
    broadcastModel.findOneAndUpdate({ _id: broadcastId, createdby }, { isDeleted: 1 }, { new: true });

// List API - pagination ke saath, sirf logged-in user ke broadcasts
const findBroadcastListByUser = async (createdby, { skip = 0, limit = 20 } = {}) => {
    const [data, count] = await Promise.all([
        broadcastModel
            .find({ createdby, isDeleted: 0 })
            .populate("templateId", "name")
            .populate("groupId", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        broadcastModel.countDocuments({ createdby, isDeleted: 0 })
    ]);
    return { data, count };
};

// Stats API - user ke saare broadcasts ke total counts ek saath
const getOverallStatsByUser = async (createdby) => {
    const result = await broadcastModel.aggregate([
        { $match: { createdby: createdby, isDeleted: 0 } },
        {
            $group: {
                _id: null,
                sent: { $sum: "$sentCount" },
                delivered: { $sum: "$deliveredCount" },
                read: { $sum: "$readCount" },
                failed: { $sum: "$failedCount" }
            }
        }
    ]);
    return result[0]
        ? { sent: result[0].sent, delivered: result[0].delivered, read: result[0].read, failed: result[0].failed }
        : { sent: 0, delivered: 0, read: 0, failed: 0 };
};

module.exports = {
    saveBroadcastRecord,
    updateBroadcastRecord,
    findByBroadcastId,
    findManyByBroadcastIds,
    softDeleteBroadcast,
    findBroadcastListByUser,
    getOverallStatsByUser
};