const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const chatbotFlowModel = require("../models/chatbotFlow.model");

class ChatbotFlowService {
    createChatbotFlow(data) {
        const doc = new chatbotFlowModel(data);
        return doc
            .save()
            .then((result) => result)
            .catch((err) => {
                console.error(err);
                return false;
            });
    }

    updateChatbotFlow(id, userId, data) {
        return chatbotFlowModel
            .findOneAndUpdate(
                { _id: new ObjectId(id), userId: new ObjectId(userId), isDelete: false },
                data,
                { new: true }
            )
            .then((result) => result || null)
            .catch((err) => {
                console.error(err);
                return false;
            });
    }

    getChatbotFlowById(id, userId) {
        return chatbotFlowModel
            .findOne({
                _id: new ObjectId(id),
                userId: new ObjectId(userId),
                isDelete: false
            })
            .then((result) => result || null)
            .catch((err) => {
                console.error(err);
                return false;
            });
    }

    publishChatbotFlow(id, userId) {
        return chatbotFlowModel
            .findOneAndUpdate(
                { _id: new ObjectId(id), userId: new ObjectId(userId), isDelete: false },
                { status: "published" },
                { new: true }
            )
            .then((result) => result || null)
            .catch((err) => {
                console.error(err);
                return false;
            });
    }
    getChatbotList(userId) {
        return chatbotFlowModel
            .find({
                userId: new ObjectId(userId),
                isDelete: false,
                isActive: true
            })
            .sort({ updatedAt: -1 })
            .lean()
            .then((result) => result)
            .catch((err) => {
                console.error(err);
                return [];
            });
    }
}

module.exports = new ChatbotFlowService();