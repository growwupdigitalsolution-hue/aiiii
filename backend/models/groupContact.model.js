const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

const groupContactSchema = new mongoose.Schema({

    groupId: {
        type: Schema.Types.ObjectId,
        ref: "groups",
        default: null
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    contactId: {
        type: Schema.Types.ObjectId,
        ref: "contacts",
        default: null
    },
    isActive: {
        type: Number,
        default: 1
    },
    isdeleted: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

const groupContact = mongoose.model("groupContacts", groupContactSchema);
module.exports = groupContact;