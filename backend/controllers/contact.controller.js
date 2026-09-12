const xlsx = require('xlsx');
const services = require("../services/contact.service");
const groupService = require("../services/group.service");

class Controller {
    async create(req, res) {
        try {
            const { groupId } = req.body;
            const userId = req.user._id;
            let contacts = [];

            if (!groupId) {
                return res.status(400).json({
                    ErrorMessage: "Group ID is required",
                    data: {}
                });
            }


            if (req.file) {
                const workbook = xlsx.readFile(req.file.path);
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = xlsx.utils.sheet_to_json(sheet);

                contacts = rows.map((row) => ({
                    name: row.name || row.Name || "",
                    mobileCode: row.mobileCode || row.MobileCode || row.Code || "",
                    mobileNo: row.mobileNo || row.MobileNo || row.Mobile || ""
                }));
            } else {
                console.log("req.body.contacts:", req.body.contacts);
                contacts = JSON.parse(req.body.contacts) || [];
                console.log("contacts", contacts);

            }

            if (contacts.length === 0) {
                return res.status(400).json({
                    ErrorMessage: "Contacts are required",
                    data: {}
                });
            }

            const groupExists = await groupService.getById(groupId);

            if (!groupExists) {
                return res.status(400).json({
                    ErrorMessage: "Group not found",
                    data: {}
                });
            }

            const groupContactData = [];
            const newContacts = [];
            let skippedCount = 0;

            for (const contact of contacts) {
                console.log("Processing contact:", contact);
                const mobileCode = String(contact.mobileCode || "").trim();
                const mobileNo = String(contact.mobileNo || "").trim();
                const name = String(contact.name || "").trim();
                console.log("Processing contact:", { name, mobileCode, mobileNo });
                if (!mobileCode || !mobileNo) {
                    skippedCount++;
                    continue;
                }

                const existingContact = await services.getContactDetails({
                    mobileCode,
                    mobileNo,
                    userId
                });
                console.log("existingContact", existingContact);
                let contactId;

                if (existingContact?.length > 0) {
                    contactId = existingContact[0]._id;
                } else {
                    newContacts.push({
                        name: name || "Unknown",
                        mobileNo,
                        mobileCode,
                        mobileNoWithCode: `${mobileCode}${mobileNo}`,
                        userId
                    });
                    console.log("newContacts", newContacts);
                    continue;
                }

                const duplicateGroupContact = await services.getDuplicateGroupContact({
                    groupId,
                    contactId
                });
                console.log("duplicateGroupContact", duplicateGroupContact);

                if (duplicateGroupContact?.count > 0) {
                    skippedCount++;
                    continue;
                }

                groupContactData.push({
                    groupId,
                    contactId,
                    userId
                });
            }

            if (newContacts.length > 0) {
                const createdContacts = await services.create(newContacts);

                if (createdContacts?.length > 0) {
                    for (const contact of createdContacts) {
                        const duplicateGroupContact = await services.getDuplicateGroupContact({
                            groupId,
                            contactId: contact._id
                        });

                        if (duplicateGroupContact?.count === 0) {
                            groupContactData.push({
                                groupId,
                                contactId: contact._id,
                                userId
                            });
                        } else {
                            skippedCount++;
                        }
                    }
                }
            }

            if (groupContactData.length === 0) {
                return res.status(400).json({
                    ErrorMessage: "All contacts already exist in this group",
                    data: {
                        addedCount: 0,
                        skippedCount
                    }
                });
            }

            const createdGroupContacts = await services.createGroupContact(groupContactData);

            if (!createdGroupContacts) {
                return res.status(400).json({
                    ErrorMessage: "Unable to add contacts to group",
                    data: {}
                });
            }

            const totalContact = await services.countGroupContact(groupId);

            await groupService.update(groupId, {
                totalContact
            });

            return res.status(200).json({
                ErrorMessage: "Successfully",
                data: {
                    addedCount: createdGroupContacts.length,
                    skippedCount,
                    totalContact,
                    contacts: createdGroupContacts
                }
            });
        } catch (error) {
            console.error("create error:", error);
            return res.status(500).json({
                ErrorMessage: "Something went wrong",
                data: {}
            });
        }
    }

    async getAllGroupContact(req, res) {
        try {
            const setData = {
                groupId: req.query.id || "",
                userId: req.user._id,
                name: req.query.name || "",
                mobileNo: req.query.mobileNo || "",
                mobileCode: req.query.mobileCode || "",
                limit: req.query.limit || 10,
                skip: req.query.skip || 0
            };

            const model = await services.getAllGroupContact(setData);

            if (!model) {
                return res.status(400).json({
                    ErrorMessage: "Something went wrong",
                    data: {}
                });
            }

            return res.status(200).json({
                ErrorMessage: "Successfully",
                data: model
            });
        } catch (error) {
            console.error("getAllGroupContact error:", error);
            return res.status(500).json({
                ErrorMessage: "Something went wrong",
                data: {}
            });
        }
    }

    async updateGroupContact(req, res) {
        try {
            const id = req.query.id;
            const param = req.body;

            if (!id) {
                return res.status(400).json({
                    ErrorMessage: "Invalid details",
                    data: {}
                });
            }

            const result = await services.updateGroupContact(id, param);

            if (result) {
                return res.status(200).json({
                    ErrorMessage: "Successfully",
                    data: result
                });
            }

            return res.status(400).json({
                ErrorMessage: "Invalid details",
                data: {}
            });
        } catch (error) {
            console.error("updateGroupContact error:", error);
            return res.status(500).json({
                ErrorMessage: "Something went wrong",
                data: {}
            });
        }
    }

    async deleteGroupContact(req, res) {
        try {
            const id = req.params.id;

            if (!id) {
                return res.status(400).json({
                    ErrorMessage: "Invalid id",
                    data: {}
                });
            }

            const contactResult = await services.deleteGroupContact(id);

            if (contactResult) {
                return res.status(200).json({
                    ErrorMessage: "Successfully",
                    data: contactResult
                });
            }

            return res.status(400).json({
                ErrorMessage: "Invalid id",
                data: {}
            });
        } catch (error) {
            console.error("deleteGroupContact error:", error);
            return res.status(500).json({
                ErrorMessage: "Something went wrong",
                data: {}
            });
        }
    }

    async getById(req, res) {
        try {
            let id = req.query.id;

            if (id === "1") {
                id = null;
            }

            const model = await services.getById(id);

            if (model) {
                return res.status(200).json({
                    ErrorMessage: "Successfully",
                    data: model
                });
            }

            return res.status(200).json({
                ErrorMessage: "No data found.",
                data: {}
            });
        } catch (error) {
            console.error("getById error:", error);
            return res.status(500).json({
                ErrorMessage: "Something went wrong",
                data: {}
            });
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const param = req.body;

            if (!id) {
                return res.status(400).json({
                    ErrorCode: 400,
                    ErrorMessage: "Invalid id",
                    Updateusers: {}
                });
            }

            const model = await services.update(id, param);

            if (model) {
                return res.status(200).json({
                    ErrorCode: 200,
                    ErrorMessage: "Successfully",
                    Updateusers: model
                });
            }

            return res.status(400).json({
                ErrorCode: 400,
                ErrorMessage: "Something went wrong",
                Updateusers: {}
            });
        } catch (error) {
            console.error("update error:", error);
            return res.status(500).json({
                ErrorCode: 500,
                ErrorMessage: "Something went wrong",
                Updateusers: {}
            });
        }
    }

    async delete(req, res) {
        try {
            const id = req.query.id;

            if (!id) {
                return res.status(400).json({
                    ErrorMessage: "Invalid id",
                    data: {}
                });
            }

            const contactResult = await services.delete(id);

            if (contactResult) {
                return res.status(200).json({
                    ErrorMessage: "Successfully",
                    data: contactResult
                });
            }

            return res.status(400).json({
                ErrorMessage: "Invalid id",
                data: {}
            });
        } catch (error) {
            console.error("delete error:", error);
            return res.status(500).json({
                ErrorMessage: "Something went wrong",
                data: {}
            });
        }
    }
}

module.exports = new Controller();