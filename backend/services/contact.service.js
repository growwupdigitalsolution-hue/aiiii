const mongoose = require("mongoose");
const contactModel = require("../models/contact.model");
const groupContactModel = require("../models/groupContact.model");
const groupModel = require("../models/group.model");

const ObjectId = mongoose.Types.ObjectId;

class Services {
    async duplicatCheck(setData) {
        try {
            return await contactModel.countDocuments({
                mobileCode: setData.mobileCode,
                mobileNo: setData.mobileNo,
                userId: new ObjectId(setData.userId),
                isDelete: 0
            });
        } catch (error) {
            console.error("duplicatCheck error:", error);
            return 0;
        }
    }

    async create(setData) {
        try {
            return await contactModel.insertMany(setData);
        } catch (error) {
            console.error("create error:", error);
            return false;
        }
    }

    async getAll(setData) {
        try {
            const whereObject = {
                userId: new ObjectId(setData.id),
                isDelete: 0
            };

            if (setData.name) {
                whereObject.name = {
                    $regex: new RegExp(setData.name, "i")
                };
            }

            const [count, data] = await Promise.all([
                contactModel.countDocuments(whereObject),
                contactModel.find(whereObject)
                    .skip(Number(setData.skip) || 0)
                    .limit(Number(setData.limit) || 10)
                    .sort({ _id: -1 })
            ]);

            return { count, data };
        } catch (error) {
            console.error("getAll error:", error);
            return false;
        }
    }

    async getById(id) {
        try {
            if (!ObjectId.isValid(id)) return false;

            return await contactModel.findOne({
                _id: new ObjectId(id),
                isDelete: 0
            });
        } catch (error) {
            console.error("getById error:", error);
            return false;
        }
    }

    async update(id, setData) {
        try {
            if (!ObjectId.isValid(id)) return false;

            return await contactModel.findOneAndUpdate(
                {
                    _id: new ObjectId(id),
                    isDelete: 0
                },
                {
                    $set: setData
                },
                {
                    new: true,
                    runValidators: true
                }
            );
        } catch (error) {
            console.error("update error:", error);
            return false;
        }
    }

    async delete(id) {
        try {
            if (!ObjectId.isValid(id)) return false;

            return await contactModel.findOneAndUpdate(
                {
                    _id: new ObjectId(id),
                    isDelete: 0
                },
                {
                    $set: { isDelete: 1 }
                },
                {
                    new: true
                }
            );
        } catch (error) {
            console.error("delete error:", error);
            return false;
        }
    }

    async activedeactive(id, setData) {
        try {
            if (!ObjectId.isValid(id)) return false;

            return await contactModel.findOneAndUpdate(
                {
                    _id: new ObjectId(id),
                    isDelete: 0
                },
                {
                    $set: setData
                },
                {
                    new: true,
                    runValidators: true
                }
            );
        } catch (error) {
            console.error("activedeactive error:", error);
            return false;
        }
    }

    async getAllActiveModel() {
        try {
            return await contactModel.find({
                isActive: 1,
                isDelete: 0
            }).sort({ _id: -1 });
        } catch (error) {
            console.error("getAllActiveModel error:", error);
            return false;
        }
    }

    async getUserCount(setData) {
        try {
            const whereObject = {
                isDelete: 0
            };

            if (setData.isAdminId == 1) {
                whereObject.createdBy = new ObjectId(setData.createdBy);
            } else {
                whereObject.createdBy = {
                    $ne: new ObjectId(setData.createdBy)
                };
            }

            return await contactModel.countDocuments(whereObject);
        } catch (error) {
            console.error("getUserCount error:", error);
            return 0;
        }
    }

    async getContactDetails(setData) {
        try {
            return await contactModel.find({
                mobileCode: setData.mobileCode,
                mobileNo: setData.mobileNo,
                userId: new ObjectId(setData.userId),
                isDelete: 0
            });
        } catch (error) {
            console.error("getContactDetails error:", error);
            return [];
        }
    }

    async createGroupContact(contactObject) {
        try {
            return await groupContactModel.insertMany(contactObject);
        } catch (error) {
            console.error("createGroupContact error:", error);
            return false;
        }
    }

    async countGroupContact(id) {
        try {
            if (!ObjectId.isValid(id)) return 0;

            return await groupContactModel.countDocuments({
                groupId: new ObjectId(id),
                isdeleted: 0
            });
        } catch (error) {
            console.error("countGroupContact error:", error);
            return 0;
        }
    }

    async getAllGroupContact(setData) {
        try {
            if (!ObjectId.isValid(setData.userId)) return false;

            const match = {
                userId: new ObjectId(setData.userId),
                isdeleted: 0
            };

            if (setData.groupId) {
                if (!ObjectId.isValid(setData.groupId)) return false;
                match.groupId = new ObjectId(setData.groupId);
            }

            const contactMatch = {};

            if (setData.name) {
                contactMatch["contact.name"] = {
                    $regex: setData.name.trim(),
                    $options: "i"
                };
            }

            if (setData.mobileNo) {
                contactMatch["contact.mobileNo"] = {
                    $regex: setData.mobileNo.trim(),
                    $options: "i"
                };
            }

            if (setData.mobileCode) {
                contactMatch["contact.mobileCode"] = {
                    $regex: setData.mobileCode.trim(),
                    $options: "i"
                };
            }

            const skip = Math.max(Number(setData.skip) || 0, 0);
            const limit = Math.max(Number(setData.limit) || 10, 1);

            const pipeline = [
                { $match: match },
                {
                    $lookup: {
                        from: "contacts",
                        localField: "contactId",
                        foreignField: "_id",
                        as: "contact"
                    }
                },
                {
                    $unwind: {
                        path: "$contact",
                        preserveNullAndEmptyArrays: false
                    }
                }
            ];

            if (Object.keys(contactMatch).length > 0) {
                pipeline.push({
                    $match: contactMatch
                });
            }

            pipeline.push(
                {
                    $facet: {
                        data: [
                            { $sort: { _id: -1 } },
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    _id: 1,
                                    groupId: 1,
                                    contactId: 1,
                                    userId: 1,
                                    createdAt: 1,
                                    contact: {
                                        _id: "$contact._id",
                                        name: "$contact.name",
                                        mobileNo: "$contact.mobileNo",
                                        mobileCode: "$contact.mobileCode",
                                        mobileNoWithCode: "$contact.mobileNoWithCode"
                                    }
                                }
                            }
                        ],
                        count: [
                            { $count: "total" }
                        ]
                    }
                }
            );

            const result = await groupContactModel.aggregate(pipeline);

            return {
                count: result[0]?.count[0]?.total || 0,
                data: result[0]?.data || []
            };
        } catch (error) {
            console.error("getAllGroupContact error:", error);
            return false;
        }
    }

    async getDuplicateGroupContact(setData) {
        try {
            if (!ObjectId.isValid(setData.groupId) || !ObjectId.isValid(setData.contactId)) {
                return { count: 0 };
            }

            const count = await groupContactModel.countDocuments({
                groupId: new ObjectId(setData.groupId),
                contactId: new ObjectId(setData.contactId),
                isdeleted: 0
            });

            return { count };
        } catch (error) {
            console.error("getDuplicateGroupContact error:", error);
            return { count: 0 };
        }
    }

    async updateGroupContact(id, setData) {
        try {
            if (!ObjectId.isValid(id)) return false;

            return await groupContactModel.findOneAndUpdate(
                {
                    _id: new ObjectId(id),
                    isdeleted: 0
                },
                {
                    $set: setData
                },
                {
                    new: true,
                    runValidators: true
                }
            );
        } catch (error) {
            console.error("updateGroupContact error:", error);
            return false;
        }
    }

    async deleteGroupContact(id) {
        try {
            if (!ObjectId.isValid(id)) return false;

            const groupContact = await groupContactModel.findOneAndUpdate(
                {
                    _id: new ObjectId(id),
                    isdeleted: 0
                },
                {
                    $set: { isdeleted: 1 }
                },
                {
                    new: true
                }
            );

            if (!groupContact) return false;

            await groupModel.findOneAndUpdate(
                {
                    _id: groupContact.groupId
                },
                {
                    $inc: {
                        totalContact: -1
                    }
                },
                {
                    new: true
                }
            );

            return groupContact;
        } catch (error) {
            console.error("deleteGroupContact error:", error);
            return false;
        }
    }

    async getDataByCondition(getData) {
        try {
            return await contactModel.find(getData);
        } catch (error) {
            console.error("getDataByCondition error:", error);
            return false;
        }
    }

    async insertData(getData) {
        try {
            return await contactModel.create(getData);
        } catch (error) {
            console.error("insertData error:", error);
            return false;
        }
    }
}

module.exports = new Services();