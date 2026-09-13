const bcrypt = require('bcrypt');
var services = require("../services/singInUp.service");
const ROLES = require("../constants/roles.constant");

class AdminController {


    async getStaffList(req, res) {
        try {
            const creator = req.user;
            let result = await services.getStaffByCreator(creator._id);
            return res.status(200).json({ "ErrorMessage": "success", "data": result || [] })
        } catch (error) {
            return res.status(500).json({ "ErrorMessage": "Something went wrong", "data": {} })
        }
    }
}

module.exports = new AdminController();
