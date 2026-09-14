// helper/phone.helper.js

/**
 * Common international country calling codes.
 * Longest match wins, so 3-digit codes are checked first.
 */
const COUNTRY_CODES = [
    // 3-digit
    "971", "972", "973", "974", "975", "976", "977", "994", "995", "996", "998",
    "880", "886", "852", "853", "855", "856", "850", "960", "961", "962", "963", "964", "965", "966", "967", "968", "970",
    "212", "213", "216", "218", "220", "221", "222", "223", "224", "225", "226", "227", "228", "229",
    "230", "231", "232", "233", "234", "235", "236", "237", "238", "239",
    "240", "241", "242", "243", "244", "245", "246", "248", "249",
    "250", "251", "252", "253", "254", "255", "256", "257", "258",
    "260", "261", "262", "263", "264", "265", "266", "267", "268", "269",
    "290", "291", "297", "298", "299",
    "350", "351", "352", "353", "354", "355", "356", "357", "358", "359",
    "370", "371", "372", "373", "374", "375", "376", "377", "378", "379",
    "380", "381", "382", "383", "385", "386", "387", "389",
    "420", "421", "423",
    "500", "501", "502", "503", "504", "505", "506", "507", "508", "509",
    "590", "591", "592", "593", "594", "595", "596", "597", "598", "599",
    "670", "672", "673", "674", "675", "676", "677", "678", "679",
    "680", "681", "682", "683", "685", "686", "687", "688", "689", "690", "691", "692",
    // 2-digit
    "20", "27", "30", "31", "32", "33", "34", "36", "39", "40", "41", "43", "44", "45", "46", "47", "48", "49",
    "51", "52", "53", "54", "55", "56", "57", "58",
    "60", "61", "62", "63", "64", "65", "66",
    "81", "82", "84", "86",
    "90", "91", "92", "93", "94", "95", "98",
    // 1-digit
    "1", "7",
];

/* Sort by length desc so longest match wins */
const SORTED_CODES = [...COUNTRY_CODES].sort((a, b) => b.length - a.length);

/**
 * Split a full international phone number into { mobileCode, mobileNo, mobileNoWithCode }.
 *
 * Examples:
 *   splitPhoneNumber("919800000004") → { mobileCode: "+91", mobileNo: "9800000004", mobileNoWithCode: "+919800000004" }
 *   splitPhoneNumber("+14155551234") → { mobileCode: "+1",  mobileNo: "4155551234", mobileNoWithCode: "+14155551234" }
 *   splitPhoneNumber("447700900123") → { mobileCode: "+44", mobileNo: "7700900123", mobileNoWithCode: "+447700900123" }
 */
function splitPhoneNumber(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    if (!digits) {
        return { mobileCode: "", mobileNo: "", mobileNoWithCode: "" };
    }

    for (const code of SORTED_CODES) {
        if (digits.startsWith(code) && digits.length > code.length) {
            return {
                mobileCode: `+${code}`,
                mobileNo: digits.slice(code.length),
                mobileNoWithCode: `+${digits}`,
            };
        }
    }

    // No match — store as-is
    return {
        mobileCode: "",
        mobileNo: digits,
        mobileNoWithCode: `+${digits}`,
    };
}

module.exports = { splitPhoneNumber, COUNTRY_CODES };