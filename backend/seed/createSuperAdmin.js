// Run: npm run seed:super-admin
// Yeh script check karti hai ki DB me pehle se koi SUPER_ADMIN hai ya nahi.
// Agar hai, toh dobara nahi banati - isse "sirf ek hi super admin" guarantee hota hai.
// Public signup route jaan-boojh kar nahi rakha, super admin sirf isi tarah bante hai.

require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const connectDB = require("../config/db.config");
const users = require("../models/users.model");
const ROLES = require("../constants/roles.constant");

const run = async () => {
    await connectDB();

    const existing = await users.findOne({ role: ROLES.SUPER_ADMIN, isDelete: 0 });
    if (existing) {
        console.log("Super admin already exists, skipping. mobile:", existing.mobileCode + existing.mobileNo);
        process.exit(0);
    }

    const {
        SUPER_ADMIN_NAME,
        SUPER_ADMIN_MOBILE_CODE,
        SUPER_ADMIN_MOBILE_NO,
        SUPER_ADMIN_PASSWORD,
    } = process.env;

    if (!SUPER_ADMIN_MOBILE_CODE || !SUPER_ADMIN_MOBILE_NO || !SUPER_ADMIN_PASSWORD) {
        console.log("Set SUPER_ADMIN_NAME / SUPER_ADMIN_MOBILE_CODE / SUPER_ADMIN_MOBILE_NO / SUPER_ADMIN_PASSWORD in .env before seeding.");
        process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(SUPER_ADMIN_PASSWORD, salt);

    const admin = await users.create({
        name: SUPER_ADMIN_NAME || "Super Admin",
        mobileCode: SUPER_ADMIN_MOBILE_CODE,
        mobileNo: SUPER_ADMIN_MOBILE_NO,
        password,
        role: ROLES.SUPER_ADMIN,
    });

    console.log("Super admin created:", admin.mobileCode + admin.mobileNo);
    process.exit(0);
};

run().catch((err) => {
    console.log("Seed error:", err);
    process.exit(1);
});
