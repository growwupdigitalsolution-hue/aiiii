const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ticketSchema = new mongoose.Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "users" },
        contactId: { type: Schema.Types.ObjectId, ref: "contacts" },
        groupId: { type: Schema.Types.ObjectId, ref: "groups", default: null },
        lastMessageId: { type: Schema.Types.ObjectId, ref: "messages" },
        lastMessageAt: { type: Date, default: null },
        ticketType: {
            type: String,
            enum: ["urgent", "high", "medium", "low"],
            default: "all",
        },
        ticketstatus: {
            type: String,
            enum: ["pending", "inProgress", "closed"],
            default: "pending",
        },
        ticketNumber: { type: Number, default: 0 },
        unReadCount: { type: Number, default: 0 },

        closeResion: { type: String, default: "" },
        closeDate: { type: Date, default: null },

        isActive: { type: Boolean, default: true },
        isdeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

ticketSchema.index({ userId: 1, ticketstatus: 1, lastMessageAt: -1 });
ticketSchema.index({ groupId: 1, lastMessageAt: -1 });
ticketSchema.index({ contactId: 1, ticketstatus: 1 });

module.exports = mongoose.model("tickets", ticketSchema);