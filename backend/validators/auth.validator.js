const Joi = require("joi");
const { COUNTRIES } = require("../constants/countries.data");
const { isValidMobileNumber } = require("../helper/mobile.validate");

const VALID_DIAL_CODES = COUNTRIES.map((c) => c.dialCode);

const signInSchema = Joi.object({
    mobileCode: Joi.string().valid(...VALID_DIAL_CODES).required()
        .messages({ "any.only": "Select a valid country code" }),
    mobileNo: Joi.string().trim().required(),
    password: Joi.string().min(6).required(),

}).custom((value, helpers) => {
    if (!isValidMobileNumber(value.mobileCode, value.mobileNo)) {
        return helpers.message("Enter a valid mobile number for the selected country");
    }
    return value;
});
const signUpSchema = Joi.object({
    mobileCode: Joi.string().valid(...VALID_DIAL_CODES).required()
        .messages({ "any.only": "Select a valid country code" }),
    mobileNo: Joi.string().trim().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).required(),

}).custom((value, helpers) => {
    if (!isValidMobileNumber(value.mobileCode, value.mobileNo)) {
        return helpers.message("Enter a valid mobile number for the selected country");
    }
    return value;
});
const refreshTokenSchema = Joi.object({
    token: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().min(6).required(),
    newPassword: Joi.string().min(6).required(),
});

module.exports = { signInSchema, signUpSchema, refreshTokenSchema, changePasswordSchema };
