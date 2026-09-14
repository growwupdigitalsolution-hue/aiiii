const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const contactService = require("../services/contact.service");

class Controller {

    /* =========================================================
       POST /create-group-contact
       multipart/form-data:
         file        → CSV of contacts (name, mobileCode, mobileNo)
         groupId     → optional; if provided, links each contact to it
       Also accepts JSON body for a single contact.
       ========================================================= */
    async create(req, res) {
        try {
            const userId = req.user._id;
            const { groupId } = req.body || {};

            // ---- Case A: file upload (CSV) ----
            if (req.file) {
                const result = await contactService.bulkCreateFromCsv({
                    userId,
                    groupId: groupId || null,
                    filePath: req.file.path,
                });
                if (result?.error) {
                    return res.status(400).json({ ErrorMessage: result.error, data: {} });
                }
                return res.status(201).json({
                    ErrorMessage: "success",
                    data: {
                        created: result.created,
                        skipped: result.skipped,
                        groupId: groupId || null,
                    },
                });
            }

            // ---- Case B: single contact JSON ----
            const { name, mobileCode = "+91", mobileNo, email = "" } = req.body || {};
            if (!mobileNo) {
                return res.status(400).json({
                    ErrorMessage: "mobileNo is required (or upload a CSV file)",
                    data: {},
                });
            }

            const result = await contactService.createContact({
                userId,
                groupId: groupId || null,
                data: { name, mobileCode, mobileNo, email },
            });

            if (result?.error) {
                return res.status(400).json({ ErrorMessage: result.error, data: {} });
            }
            return res.status(201).json({ ErrorMessage: "success", data: result });
        } catch (err) {
            console.error("contact.create error:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       GET /getall-group-contact
       Query: ?groupId=optional&limit&skip&search
       - If groupId provided → contacts inside that group
       - Otherwise → all contacts of the user
       ========================================================= */
    async getAllGroupContact(req, res) {
        try {
            const userId = req.user._id;
            const { groupId, limit = 50, skip = 0, search = "" } = req.query;

            const result = await contactService.getAllGroupContacts({
                userId,
                groupId: groupId || null,
                limit,
                skip,
                search,
            });

            return res.status(200).json({
                ErrorMessage: "success",
                data: result.data,
                countData: result.count,
            });
        } catch (err) {
            console.error("contact.getAllGroupContact error:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    async getAllContact(req, res) {
        try {
            const userId = req.user._id;
            const { groupId, limit = 50, skip = 0, search = "" } = req.query;

            const result = await contactService.getAllContacts({
                userId,
                limit,
                skip,
                search,
            });

            return res.status(200).json({
                ErrorMessage: "success",
                data: result.data,
                countData: result.count,
            });
        } catch (err) {
            console.error("contact.getAllGroupContact error:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }
    /* =========================================================
       GET /get-contactbyid
       Query: ?id=...
       ========================================================= */
    async getById(req, res) {
        try {
            const userId = req.user._id;
            const id = req.query.id || req.query._id || req.query.contactId;

            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ ErrorMessage: "Invalid contact id", data: {} });
            }

            const contact = await contactService.getContactById({ userId, contactId: id });
            if (!contact) {
                return res.status(404).json({ ErrorMessage: "Contact not found", data: {} });
            }
            return res.status(200).json({ ErrorMessage: "success", data: contact });
        } catch (err) {
            console.error("contact.getById error:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       PUT /update-contact/:id
       ========================================================= */
    async update(req, res) {
        try {
            const userId = req.user._id;
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ ErrorMessage: "Invalid contact id", data: {} });
            }

            const result = await contactService.updateContact({
                userId,
                contactId: id,
                data: req.body || {},
            });

            if (result?.error) {
                const code = result.error === "Contact not found" ? 404 : 400;
                return res.status(code).json({ ErrorMessage: result.error, data: {} });
            }
            return res.status(200).json({ ErrorMessage: "success", data: result });
        } catch (err) {
            console.error("contact.update error:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       DELETE /delete-contact
       Query: ?id=...
       ========================================================= */
    async delete(req, res) {
        try {
            const userId = req.user._id;
            const id = req.query.id || req.query._id || req.query.contactId;

            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ ErrorMessage: "Invalid contact id", data: {} });
            }

            const result = await contactService.deleteContact({ userId, contactId: id });
            if (result?.error) {
                return res.status(404).json({ ErrorMessage: result.error, data: {} });
            }
            return res.status(200).json({ ErrorMessage: "success", data: result });
        } catch (err) {
            console.error("contact.delete error:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }

    /* =========================================================
       DELETE /delete-group-contact/:id
       `id` here is the group-contact link id (or contactId inside a group)
       Removes the link between a group and a contact, without deleting
       the contact itself.
       ========================================================= */
    async deleteGroupContact(req, res) {
        try {
            const userId = req.user._id;
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ ErrorMessage: "Invalid id", data: {} });
            }

            const result = await contactService.deleteGroupContact({ userId, id });
            if (result?.error) {
                return res.status(404).json({ ErrorMessage: result.error, data: {} });
            }
            return res.status(200).json({ ErrorMessage: "success", data: result });
        } catch (err) {
            console.error("contact.deleteGroupContact error:", err);
            return res.status(500).json({ ErrorMessage: "Internal Server Error", data: {} });
        }
    }
}

module.exports = new Controller();