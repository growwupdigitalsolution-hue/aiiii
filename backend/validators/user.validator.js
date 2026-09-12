const Joi = require("joi");

const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(2).optional(),
    email: Joi.string().trim().email().allow('').optional(),
    businessName: Joi.string().trim().allow('').optional(),
    address: Joi.string().trim().allow('').optional(),
});

module.exports = { updateProfileSchema };
