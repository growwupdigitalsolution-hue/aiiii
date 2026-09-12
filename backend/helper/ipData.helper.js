const axios = require("axios");

// req.ip se location nikalta hai (city, region, country_name, postal)
// ipapi.co free tier use kar raha hai - agar aapki apni koi service/key ho
// (ipinfo.io, ip2location etc) toh sirf yahi function badalna hoga, baaki
// code (enquiry.controller.js) me kuch change nahi karna padega.

const fetchIPData = async (ip) => {
    try {
        // local/dev me req.ip kabhi kabhi "::1" ya "127.0.0.1" hota hai,
        // us case me ipapi apna khud ka public IP detect kar lega
        let cleanIp = ip;
        if (!cleanIp || cleanIp === "::1" || cleanIp === "127.0.0.1" || cleanIp.startsWith("::ffff:127.")) {
            cleanIp = "";
        }

        const url = cleanIp ? `https://ipapi.co/${cleanIp}/json/` : `https://ipapi.co/json/`;
        const { data } = await axios.get(url, { timeout: 5000 });

        if (data && !data.error) {
            return {
                city: data.city || '',
                region: data.region || '',
                country_name: data.country_name || '',
                postal: data.postal || '',
            };
        }
        return null;
    } catch (error) {
        console.log('fetchIPData error:', error.message);
        return null; // fail hone pe bhi enquiry create rukni nahi chahiye
    }
};

module.exports = { fetchIPData };