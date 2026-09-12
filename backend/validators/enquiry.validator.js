const Joi = require("joi");

const createEnquirySchema = Joi.object({
    name: Joi.string().trim().min(2).required(),
    mobileNo: Joi.string().trim().pattern(/^[0-9]{6,15}$/).required()
        .messages({ "string.pattern.base": "mobileNo invalid" }),
    email: Joi.string().trim().email().allow('').optional(),
});

module.exports = { createEnquirySchema };
