const Joi = require("joi");

const sendBroadcastValidator = Joi.object({
    templateId: Joi.string()
        .required()
        .messages({
            "string.empty": "templateId is required",
            "any.required": "templateId is required",
        }),
    groupId: Joi.string()
        .required()
        .messages({
            "string.empty": "groupId is required",
            "any.required": "groupId is required",
        }),
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.empty": "Broadcast name is required",
            "string.min": "Name must be at least 2 characters",
            "string.max": "Name must be under 100 characters",
            "any.required": "Broadcast name is required",
        }),
    description: Joi.string().trim().max(500).allow("", null),
    chatbotTemplateId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .allow(null, ""),
});

module.exports = { sendBroadcastValidator };