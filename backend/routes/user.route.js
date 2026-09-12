const express = require("express");
const router = express.Router();

var controller = require("../controllers/user.controller");
var helper = require("../helper/authToken.helper");
var validate = require("../middleware/validate.middleware");
var userValidator = require("../validators/user.validator");
var authValidator = require("../validators/auth.validator");

// koi bhi logged-in role (super admin/admin/collaborator) yeh use kar sakta hai
router.get("/user-details", helper.verifyToken, controller.getUserData)
router.post("/update-profile", helper.verifyToken, validate(userValidator.updateProfileSchema), controller.updateProfile)
router.post("/change-password", helper.verifyToken, validate(authValidator.changePasswordSchema), controller.changePassword)

module.exports = router;
