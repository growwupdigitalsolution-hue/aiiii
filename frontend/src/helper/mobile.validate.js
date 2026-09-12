import { parsePhoneNumberFromString } from "libphonenumber-js";

export function isValidMobileNumber(dialCode, mobileNo) {
    if (!dialCode || !mobileNo) return false;
    try {
        const full = `${dialCode}${mobileNo}`.replace(/\s+/g, "");
        const phone = parsePhoneNumberFromString(full);
        return !!(phone && phone.isValid());
    } catch (error) {
        return false;
    }
}