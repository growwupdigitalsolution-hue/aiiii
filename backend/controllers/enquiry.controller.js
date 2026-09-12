const promise = require("bluebird");
var services = require("../services/singInUp.service");
var ipHelper = require("../helper/ipData.helper");

class EnquiryController {
    async createEnquiry(req, res) {
        let ipData = await ipHelper.fetchIPData(req.ip)
        let setData = {
            ...req.body, // already validated
            city: ipData?.city || '',
            country_name: ipData?.country_name || '',
            region: ipData?.region || '',
            postal: ipData?.postal || '',
        }
        return promise.resolve(services.createEnquiry(setData)).then((result) => {
            if (result) {
                return res.status(200).json({ "ErrorMessage": "Enquiry successfully created", "data": result })
            }
            return res.status(400).json({ "ErrorMessage": "Something went wrong", "data": {} })
        }).catch(() => res.status(500).json({ "ErrorMessage": "Something went wrong", "data": {} }))
    }

    async getEnquiry(req, res) {
        return promise.resolve(services.getEnquiry()).then((result) => {
            if (result) {
                return res.status(200).json({ "ErrorMessage": "success", "data": result })
            }
            return res.status(400).json({ "ErrorMessage": "Invalid id", "data": {} })
        }).catch(() => res.status(500).json({ "ErrorMessage": "Something went wrong", "data": {} }))
    }
}

module.exports = new EnquiryController();
