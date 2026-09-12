const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId;
var Schema = mongoose.Schema;
const groupSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isActive: {
        type: Number,
        default: 1
    },
    isDelete: {
        type: Number,
        default: 0
    },
    totalContact: {
        type: Number,
        default: 0
    },
    createdby: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
}, { timestamps: true })
// mongoose.set('debug', true);

const group = mongoose.model("groups", groupSchema);
module.exports = group;