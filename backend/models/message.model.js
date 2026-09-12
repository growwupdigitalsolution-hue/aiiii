// models/messages.model.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new mongoose.Schema({
    contactId: {
        type: Schema.Types.ObjectId,
        ref: "contacts"
    },
    createdby: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    broadcastId: {
        // Kis broadcast se ye message gaya - broadcast history/report ke liye
        type: Schema.Types.ObjectId,
        ref: "broadcasts",
        default: null
    },
    templateId: {
        type: Schema.Types.ObjectId,
        ref: "templates",
        default: null
    },
    chatbotTemplateId: {
        type: Schema.Types.ObjectId,
        ref: "chatbotLevels",
        default: null
    },
    sendBy: {
        type: String,
        enum: {
            values: ["system", "customer"],
            message: "Not a valid enum"
        },
        required: true
    },
    msgType: {
        // template | text | image | video | document | interactive
        type: String,
        default: "text"
    },
    message: {
        // Plain text preview - chat list / last message dikhane ke liye
        type: String,
        default: ""
    },
    templateSnapshot: {
        // Send-time par resolved template content - Meta API dobara call kiye bina chat me sahi dikhta hai
        // shape: { headerType, headerText, headerMediaUrl, body, footer, buttons: [] }
        type: Schema.Types.Mixed,
        default: null
    },
    interactiveReply: {
        // Customer ne button/list se reply kiya to - chatbot flow track karne ke kaam aayega
        // shape: { type: 'button_reply' | 'list_reply', id, title }
        type: Schema.Types.Mixed,
        default: null
    },
    msgfile: {
        type: String,
        default: ""
    },
    fileType: {
        type: String,
        default: ""
    },
    fileName: {
        type: String,
        default: ""
    },
    whatsAppMessageId: {
        type: String,
        default: ""
    },
    whatsappReplyMsgId: {
        type: String,
        default: ""
    },
    isSent: {
        type: Number,
        default: 0
    },
    isSentTime: {
        type: Date,
        default: null
    },
    isDelivered: {
        type: Number,
        default: 0
    },
    isDeliveredTime: {
        type: Date,
        default: null
    },
    isRead: {
        type: Number,
        default: 0
    },
    isReadTime: {
        type: Date,
        default: null
    },
    isFailed: {
        type: Number,
        default: 0
    },
    isFailedTime: {
        type: Date,
        default: null
    },
    errorObject: {
        type: Schema.Types.Mixed,
        default: null
    },
    isDelete: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Chat window ek contact ke liye messages date order me fetch karega - isse fast hoga
messageSchema.index({ contactId: 1, createdAt: 1 });
// Broadcast report ("is broadcast ke saare messages") ke liye
messageSchema.index({ broadcastId: 1 });

const message = mongoose.model("messages", messageSchema);
module.exports = message;