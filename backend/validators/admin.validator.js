const Joi = require("joi");
const ROLES = require("../constants/roles.constant");

const createStaffSchema = Joi.object({
    name: Joi.string().trim().min(2).required(),
    mobileCode: Joi.string().trim().pattern(/^\+?[0-9]{1,4}$/).required()
        .messages({ "string.pattern.base": "mobileCode invalid (e.g. +91)" }),
    mobileNo: Joi.string().trim().pattern(/^[0-9]{6,15}$/).required()
        .messages({ "string.pattern.base": "mobileNo invalid" }),
    password: Joi.string().min(6).required(),
    role: Joi.number().valid(ROLES.ADMIN, ROLES.COLLABORATOR).required()
        .messages({ "any.only": "role must be ADMIN(2) or COLLABORATOR(3)" }),
    email: Joi.string().trim().email().allow('').optional(),
    businessName: Joi.string().trim().allow('').optional(),
});

module.exports = { createStaffSchema };
