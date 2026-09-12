const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ticketSchema = new mongoose.Schema(
    {
        createdby: { type: Schema.Types.ObjectId, ref: "users" },
        contactId: { type: Schema.Types.ObjectId, ref: "contacts" },
        groupId: { type: Schema.Types.ObjectId, ref: "groups", default: null },
        lastMessageId: { type: Schema.Types.ObjectId, ref: "messages" },

        // NEW: latest message timestamp — used for sorting ticket lists
        lastMessageAt: { type: Date, default: null },

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

// Indexes for fast sorting & filtering
ticketSchema.index({ createdby: 1, ticketstatus: 1, lastMessageAt: -1 });
ticketSchema.index({ groupId: 1, lastMessageAt: -1 });
ticketSchema.index({ contactId: 1, ticketstatus: 1 });

const ticket = mongoose.model("tickets", ticketSchema);
module.exports = ticket;