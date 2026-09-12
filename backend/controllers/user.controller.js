const bcrypt = require("bcrypt");
const services = require("../services/singInUp.service");

class UserController {
    async getUserData(req, res) {
        try {
            const userDetails = req.user;
            const result = await services.getUserDetails(userDetails._id);
            if (result) {
                return res.status(200).json({ ErrorMessage: "success", data: result });
            }
            return res.status(400).json({ ErrorMessage: "Something went wrong", data: {} });
        } catch (error) {
            console.error("getUserData error:", error);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    async updateProfile(req, res) {
        try {
            const userDetails = req.user;
            const result = await services.updateProfile(userDetails._id, req.body);
            if (result) {
                return res.status(200).json({ ErrorMessage: "Profile successfully updated", data: result });
            }
            return res.status(400).json({ ErrorMessage: "Something went wrong", data: {} });
        } catch (error) {
            console.error("updateProfile error:", error);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }

    async changePassword(req, res) {
        try {
            const userDetails = req.user;
            const { oldPassword, newPassword } = req.body;
            const user = await services.getUserDetails(userDetails._id);
            if (!user) {
                return res.status(404).json({ ErrorMessage: "User not found.", data: {} });
            }
            if (!user.password) {
                return res.status(400).json({ ErrorMessage: "User password not found.", data: {} });
            }
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ ErrorMessage: "Old password is incorrect.", data: {} });
            }
            const password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
            const result = await services.update(userDetails._id, { password });
            if (result) {
                return res.status(200).json({ ErrorMessage: "Password successfully updated", data: {} });
            }
            return res.status(400).json({ ErrorMessage: "Something went wrong", data: {} });
        } catch (error) {
            console.error("changePassword error:", error);
            return res.status(500).json({ ErrorMessage: "Something went wrong", data: {} });
        }
    }
}

module.exports = new UserController();