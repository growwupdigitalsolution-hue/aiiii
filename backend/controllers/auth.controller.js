const bcrypt = require('bcrypt');
var { duplicatCheck, login, createUser } = require("../services/singInUp.service");
var authToken = require("../helper/authToken.helper");
var ROLES = require("../constants/roles.constant");

class AuthController {

    // login ab email se nahi, mobileCode + mobileNo + password se hota hai
    // sabhi roles (super admin/admin/collaborator) yahi ek route use karte hain
    async signIn(req, res) {
        try {
            const param = req.body;

            const model = await login({
                mobileCode: param.mobileCode,
                mobileNo: param.mobileNo,
                isDelete: 0
            });

            if (!model) {
                return res.status(400).json({
                    ErrorMessage: "Invalid mobile number or password, please try again",
                    data: {}
                });
            }

            const isMatch = await bcrypt.compare(param.password, model.password);

            if (!isMatch) {
                return res.status(400).json({
                    ErrorMessage: "Invalid mobile number or password, please try again",
                    data: {}
                });
            }

            if (model.isActive !== 1 || model.isDelete !== 0) {
                return res.status(403).json({
                    ErrorMessage: "Account has been blocked by the admin. Please contact the admin for assistance.",
                    data: {}
                });
            }

            const token = await authToken.generateToken(model);

            return res.status(200).json({
                ErrorMessage: "Successfully",
                token,
                data: {
                    _id: model._id,
                    role: model.role,
                    name: model.name,
                    mobileCode: model.mobileCode,
                    mobileNo: model.mobileNo
                }
            });

        } catch (error) {
            console.error("signIn Error:", error);

            return res.status(500).json({
                ErrorMessage: "Something went wrong",
                data: {}
            });
        }
    }
    async signUp(req, res) {
        try {
            const param = req.body;
            console.log('param', param)
            let mobileDuplicate = await duplicatCheck({
                mobileCode: param.mobileCode,
                mobileNo: param.mobileNo,
                isDelete: 0
            });
            if (mobileDuplicate > 0) {
                return res.status(400).json({
                    "ErrorMessage": "This mobile number is already registered.",
                    "data": {}
                })
            }

            const salt = await bcrypt.genSalt(10);
            param.password = await bcrypt.hash(param.password, salt);
            param.role = ROLES.ADMIN;
            param.name = req.body.name
            console.log('param', param)
            let model = await createUser(param);
            if (model) {
                return res.status(200).json({
                    "ErrorMessage": "Staff created successfully",
                    "data": { _id: model._id, name: model.name, mobileCode: model.mobileCode, mobileNo: model.mobileNo, role: model.role }
                })
            }
            return res.status(400).json({ "ErrorMessage": "Something went wrong", "data": {} })
        } catch (error) {
            console.log('error', error);
            return res.status(500).json({ "ErrorMessage": "Something went wrong", "data": {} })
        }
    }
}

module.exports = new AuthController();
