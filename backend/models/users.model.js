const mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ROLES = require("../constants/roles.constant");

const usersSchema = new mongoose.Schema({
    businessName: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        required: true
    },
    whatsappNumberId: { type: String, default: null },
    whatsappAccountId: { type: String, default: null },
    whatsappAcessToken: { type: String, default: null },

    // email ab optional hai, login isse nahi hota - sirf profile info k liye
    email: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        required: true
    },
    // login isi combo se hota hai
    mobileCode: {
        type: String,
        required: true
    },
    mobileNo: {
        type: String,
        required: true
    },
    // 1 = SUPER_ADMIN (sirf ek hi hoga, seed se banega)
    // 2 = ADMIN, 3 = COLLABORATOR (in dono ko super admin/admin banate hain)
    role: {
        type: Number,
        enum: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COLLABORATOR],
        required: true
    },
    // admin/collaborator kisne banaya - hierarchy track karne k liye
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    address: { type: String, default: '' },
    isActive: { type: Number, default: 1 },
    isDelete: { type: Number, default: 0 },
    authToken: { type: String, default: "" },
    statusEnum: { type: String, default: "" },
    kycStatus: {
        type: String,
        enum: ["pending", "in_review", "verified", "rejected"],
        default: "pending"
    }
}, { timestamps: true })

// mobileCode + mobileNo ka combo hamesha unique hona chahiye (duplicate login id nahi banna chahiye)
usersSchema.index({ mobileCode: 1, mobileNo: 1 }, { unique: true });

const users = mongoose.model("users", usersSchema);
module.exports = users;
