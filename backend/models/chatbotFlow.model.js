const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatbotFlowSchema = new mongoose.Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: "",
            trim: true
        },
        nodes: {
            type: Array,
            default: []
        },
        edges: {
            type: Array,
            default: []
        },
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDelete: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const chatbotFlow = mongoose.model("chatbotFlows", chatbotFlowSchema);
module.exports = chatbotFlow;