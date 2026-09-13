const mongoose = require("mongoose");
const fs = require("fs");
const ObjectId = mongoose.Types.ObjectId;
const contactModel = require("../models/contact.model");
const groupContactModel = require("../models/groupContact.model");
const groupModel = require("../models/group.model");

const isValidId = (v) => v && mongoose.Types.ObjectId.isValid(String(v));
const toId = (v) => new ObjectId(String(v));

/* ---------- CSV parser (no external dependency) ----------
   Expected columns (header row required):
     name,mobileCode,mobileNo,email
   Or just: name,mobileNo
--------------------------------------------------------- */
function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idx = (key) => header.indexOf(key);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const get = (key) => {
            const j = idx(key);
            return j >= 0 ? cols[j] || "" : "";
        };
        rows.push({
            name: get("name"),
            mobileCode: get("mobilecode") || get("mobile_code") || "+91",
            mobileNo: get("mobileno") || get("mobile_no") || get("phone") || "",
            email: get("email"),
        });
    }
    return rows;
}

class Services {

    /* =========================================================
       CREATE single contact (optionally link to a group)
       ========================================================= */
    async createContact({ userId, groupId, data }) {
        try {
            if (!isValidId(userId)) return { error: "Invalid user" };
            if (!data?.mobileNo) return { error: "mobileNo is required" };

            const mobileCode = data.mobileCode || "+91";
            const cleanNo = String(data.mobileNo).replace(/\D/g, "");
            const mobileNoWithCode = `${mobileCode}${cleanNo}`;

            let contact = await contactModel.findOne({
                createdby: toId(userId),
                mobileNoWithCode,
                isDelete: { $ne: 1 },
            });

            if (!contact) {
                contact = await contactModel.create({
                    name: data.name || mobileNoWithCode,
                    mobileCode,
                    mobileNo: cleanNo,
                    mobileNoWithCode,
                    email: data.email || "",
                    createdby: toId(userId),
                    isActive: 1,
                    isDelete: 0,
                });
            }

            // Optional: link to group
            if (groupId && isValidId(groupId)) {
                await this._linkContactToGroup({
                    groupId: toId(groupId),
                    contactId: contact._id,
                    userId: toId(userId),
                });
            }

            return contact;
        } catch (err) {
            console.error("contactService.createContact error:", err);
            return { error: "Failed to create contact" };
        }
    }

    /* =========================================================
       BULK create from CSV
       ========================================================= */
    async bulkCreateFromCsv({ userId, groupId, filePath }) {
        try {
            if (!isValidId(userId)) return { error: "Invalid user" };

            const text = fs.readFileSync(filePath, "utf8");
            const rows = parseCsv(text);
            if (rows.length === 0) return { error: "CSV is empty or malformed" };

            let created = 0;
            let skipped = 0;

            for (const row of rows) {
                if (!row.mobileNo) { skipped++; continue; }

                const mobileCode = row.mobileCode || "+91";
                const cleanNo = String(row.mobileNo).replace(/\D/g, "");
                const mobileNoWithCode = `${mobileCode}${cleanNo}`;

                let contact = await contactModel.findOne({
                    createdby: toId(userId),
                    mobileNoWithCode,
                    isDelete: { $ne: 1 },
                });

                if (!contact) {
                    contact = await contactModel.create({
                        name: row.name || mobileNoWithCode,
                        mobileCode,
                        mobileNo: cleanNo,
                        mobileNoWithCode,
                        email: row.email || "",
                        createdby: toId(userId),
                        isActive: 1,
                        isDelete: 0,
                    });
                    created++;
                } else {
                    skipped++;
                }

                if (groupId && isValidId(groupId)) {
                    await this._linkContactToGroup({
                        groupId: toId(groupId),
                        contactId: contact._id,
                        userId: toId(userId),
                    });
                }
            }

            // Cleanup uploaded file
            try { fs.unlinkSync(filePath); } catch (_) { }

            return { created, skipped };
        } catch (err) {
            console.error("contactService.bulkCreateFromCsv error:", err);
            return { error: "Failed to process CSV" };
        }
    }

    /* =========================================================
       GET ALL contacts (of user, or of a group)
       Sorted by latest message activity
       ========================================================= */
    async getAllContacts({ userId, groupId, limit = 50, skip = 0, search = "" }) {
        try {
            if (!isValidId(userId)) return { count: 0, data: [] };

            // ---- Group-scoped ----
            if (groupId && isValidId(groupId)) {
                const matchContact = { isDelete: { $ne: 1 } };
                if (search?.trim()) {
                    matchContact.name = { $regex: new RegExp(search.trim(), "i") };
                }

                const [count, data] = await Promise.all([
                    groupContactModel.countDocuments({ groupId: toId(groupId) }),
                    groupContactModel.aggregate([
                        { $match: { groupId: toId(groupId) } },
                        {
                            $lookup: {
                                from: "contacts",
                                localField: "contactId",
                                foreignField: "_id",
                                as: "contact",
                            },
                        },
                        { $unwind: "$contact" },
                        { $match: { "contact.isDelete": { $ne: 1 } } },
                        ...(search?.trim()
                            ? [{ $match: { "contact.name": { $regex: new RegExp(search.trim(), "i") } } }]
                            : []),
                        {
                            $project: {
                                _id: "$contact._id",
                                name: "$contact.name",
                                mobileCode: "$contact.mobileCode",
                                mobileNo: "$contact.mobileNo",
                                mobileNoWithCode: "$contact.mobileNoWithCode",
                                email: "$contact.email",
                                createdAt: "$contact.createdAt",
                            },
                        },
                        { $sort: { name: 1 } },
                        { $skip: +skip },
                        { $limit: +limit },
                    ]),
                ]);

                return { count, data };
            }

            // ---- All contacts of the user ----
            const match = {
                createdby: toId(userId),
                isDelete: { $ne: 1 },
            };
            if (search?.trim()) {
                match.name = { $regex: new RegExp(search.trim(), "i") };
            }

            const [count, data] = await Promise.all([
                contactModel.countDocuments(match),
                contactModel.aggregate([
                    { $match: match },
                    {
                        $lookup: {
                            from: "messages",
                            let: { cid: "$_id" },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$contactId", "$$cid"] } } },
                                { $sort: { createdAt: -1 } },
                                { $limit: 1 },
                                { $project: { message: 1, createdAt: 1, sendBy: 1 } },
                            ],
                            as: "lastMessage",
                        },
                    },
                    { $addFields: { lastMessage: { $arrayElemAt: ["$lastMessage", 0] } } },
                    {
                        $addFields: {
                            lastMessageAt: { $ifNull: ["$lastMessage.createdAt", "$createdAt"] },
                        },
                    },
                    { $sort: { lastMessageAt: -1 } },
                    { $skip: +skip },
                    { $limit: +limit },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            mobileCode: 1,
                            mobileNo: 1,
                            mobileNoWithCode: 1,
                            email: 1,
                            createdAt: 1,
                            lastMessageAt: 1,
                            lastMessage: 1,
                        },
                    },
                ]),
            ]);

            return { count, data };
        } catch (err) {
            console.error("contactService.getAllContacts error:", err);
            return { count: 0, data: [] };
        }
    }

    /* =========================================================
       GET single contact
       ========================================================= */
    async getContactById({ userId, contactId }) {
        try {
            if (!isValidId(userId) || !isValidId(contactId)) return null;
            return await contactModel.findOne({
                _id: toId(contactId),
                createdby: toId(userId),
                isDelete: { $ne: 1 },
            });
        } catch (err) {
            console.error("contactService.getContactById error:", err);
            return null;
        }
    }

    /* =========================================================
       UPDATE contact
       ========================================================= */
    async updateContact({ userId, contactId, data }) {
        try {
            if (!isValidId(userId) || !isValidId(contactId)) {
                return { error: "Invalid id" };
            }

            const update = {};
            if (data.name !== undefined) update.name = data.name;
            if (data.email !== undefined) update.email = data.email;
            if (data.mobileCode !== undefined) update.mobileCode = data.mobileCode;
            if (data.mobileNo !== undefined) {
                const clean = String(data.mobileNo).replace(/\D/g, "");
                update.mobileNo = clean;
                update.mobileNoWithCode = `${data.mobileCode || "+91"}${clean}`;
            }

            const result = await contactModel.findOneAndUpdate(
                { _id: toId(contactId), createdby: toId(userId), isDelete: { $ne: 1 } },
                { $set: update },
                { new: true }
            );
            return result || { error: "Contact not found" };
        } catch (err) {
            console.error("contactService.updateContact error:", err);
            return { error: "Failed to update contact" };
        }
    }

    /* =========================================================
       SOFT delete contact + unlink from any groups
       ========================================================= */
    async deleteContact({ userId, contactId }) {
        try {
            if (!isValidId(userId) || !isValidId(contactId)) {
                return { error: "Invalid id" };
            }

            const contact = await contactModel.findOneAndUpdate(
                { _id: toId(contactId), createdby: toId(userId), isDelete: { $ne: 1 } },
                { $set: { isDelete: 1, isActive: 0 } },
                { new: true }
            );
            if (!contact) return { error: "Contact not found" };

            // Unlink from any groups
            await groupContactModel.deleteMany({ contactId: toId(contactId) });

            return contact;
        } catch (err) {
            console.error("contactService.deleteContact error:", err);
            return { error: "Failed to delete contact" };
        }
    }

    /* =========================================================
       DELETE a group-contact LINK only
       (the contact itself is preserved)
       ========================================================= */
    async deleteGroupContact({ userId, id }) {
        try {
            if (!isValidId(userId) || !isValidId(id)) {
                return { error: "Invalid id" };
            }

            // `id` might be either the link doc _id OR the contactId inside a group.
            // Try as link first, fall back to contactId.
            let link = await groupContactModel.findById(id);
            if (!link) {
                link = await groupContactModel.findOne({ contactId: toId(id) });
            }
            if (!link) return { error: "Group-contact link not found" };

            // Make sure the caller owns the group
            const group = await groupModel.findOne({
                _id: link.groupId,
                createdby: toId(userId),
            });
            if (!group) return { error: "Not authorized" };

            await groupContactModel.deleteOne({ _id: link._id });

            const total = await groupContactModel.countDocuments({ groupId: link.groupId });
            await groupModel.findByIdAndUpdate(link.groupId, { totalContact: total });

            return { removed: true, groupId: link.groupId, totalContact: total };
        } catch (err) {
            console.error("contactService.deleteGroupContact error:", err);
            return { error: "Failed to delete group contact" };
        }
    }

    /* =========================================================
       INTERNAL: link contact to group (idempotent)
       ========================================================= */
    async _linkContactToGroup({ groupId, contactId, userId }) {
        const exists = await groupContactModel.findOne({ groupId, contactId });
        if (exists) return exists;
        return await groupContactModel.create({ groupId, contactId, createdby: userId });
    }
}

module.exports = new Services();