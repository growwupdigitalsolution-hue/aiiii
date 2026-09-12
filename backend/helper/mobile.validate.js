// Accurate per-country mobile number validation - "libphonenumber-js" use
// karte hain kyunki har country ka number-length rule alag hota hai
// (India 10 digit, US 10, UAE 9 etc) aur khud maintain karna galti prone hai.
// Install: npm install libphonenumber-js

const { parsePhoneNumberFromString } = require("libphonenumber-js");

function isValidMobileNumber(dialCode, mobileNo) {
    if (!dialCode || !mobileNo) return false;
    try {
        const full = `${dialCode}${mobileNo}`.replace(/\s+/g, "");
        const phone = parsePhoneNumberFromString(full);
        return !!(phone && phone.isValid());
    } catch (error) {
        return false;
    }
}

module.exports = { isValidMobileNumber };
// export { isValidMobileNumber };  // frontend ES modules