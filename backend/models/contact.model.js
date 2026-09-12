const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobileNo: {
        type: String,
        required: true,
        trim: true
    },
    mobileCode: {
        type: String,
        required: true,
        trim: true
    },
    mobileNoWithCode: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Number,
        default: 1
    },
    isdeleted: {
        type: Number,
        default: 0
    },
    type: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("contacts", contactSchema);