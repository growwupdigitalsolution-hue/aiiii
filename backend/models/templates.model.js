// models/templates.model.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const templateSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    templateId: {
        // Meta ka template ID (WABA template ID) - poori detail yahin se dobara fetch hoti hai
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED", "PAUSED"],
        default: "PENDING"
    },
    type: {
        // header type - sending time pe pata hona chahiye bina Meta call kiye
        type: String,
        enum: ["TEXT", "IMAGE", "VIDEO", "DOCUMENT", "NONE"],
        default: "NONE"
    },
    imageUrl: {
        // header media ka Meta "handle" (resumable upload se milta hai) - send API isi handle ko chahta hai
        type: String,
        default: null
    },
    variableComponent: {
        // kaunse component (BODY/HEADER/BUTTONS) me kitne variables hain - send-time payload banane ke kaam aata hai
        type: Schema.Types.Mixed,
        default: {}
    },
    isActive: { type: Number, default: 1 },
    isDeleted: { type: Number, default: 0 }
}, { timestamps: true });

// ek user ka ek Meta template sirf ek hi baar record ho
templateSchema.index({ userId: 1, templateId: 1 }, { unique: true });

module.exports = mongoose.model("templates", templateSchema);