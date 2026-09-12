const mongoose = require("mongoose")
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require("bcrypt");
const userModel = require('../models/users.model')

const duplicatCheck = async (params) => {
    const { mobileCode, mobileNo, isDelete } = params;

    return await userModel.findOne({
        mobileCode,
        mobileNo,
        isDelete
    });
};

const createUser = async (params) => {
    const user = new userModel(params);
    return await user.save();
};

// ab sirf user fetch karta hai - password check controller me hota hai
const login = async (params) => {
    const { mobileCode, mobileNo, isDelete } = params;

    return await userModel.findOne({
        mobileCode,
        mobileNo,
        isDelete
    });
};
const getUserDetails = async (userId) => {
    return await userModel.findOne({ _id: userId, isDelete: 0 }).select("+password");
};

const updateProfile = async (userId, updateData) => {
    return await userModel.findOneAndUpdate(
        { _id: userId, isDelete: 0 },
        { $set: updateData },
        { new: true, runValidators: true }
    );
};

const update = async (userId, updateData) => {
    return await userModel.findOneAndUpdate(
        { _id: userId, isDelete: 0 },
        { $set: updateData },
        { new: true, runValidators: true }
    );
};


module.exports = {
    duplicatCheck, createUser, login, getUserDetails, updateProfile, update
};