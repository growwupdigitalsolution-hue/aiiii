
const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId;
var Schema = mongoose.Schema;



const broadcastSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: null
    },
    boradcastType: {
        type: String,
        enum: ['interactive', 'marketing'],
        default: 'marketing'
    },
    boradcastStatus: {
        type: String,
        enum: ['Queued', 'Inprogress', 'Completed', 'Failed'],
        default: 'Queued'
    },
    isActive: {
        type: Number,
        default: 1
    },
    isDeleted: {
        type: Number,
        default: 0
    },
    groupId: {
        type: Schema.Types.ObjectId,
        ref: "groups"
    },
    templateId: {
        type: Schema.Types.ObjectId,
        ref: "templates"
    },
    totalContacts: {
        type: Number,
        default: 0
    },
    sentCount: {
        type: Number,
        default: 0
    },
    deliveredCount: {
        type: Number,
        default: 0
    },
    readCount: {
        type: Number,
        default: 0
    },
    failedCount: {
        type: Number,
        default: 0
    },

    createdby: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
}, { timestamps: true })

const broadcast = mongoose.model("broadcasts", broadcastSchema);
module.exports = broadcast;