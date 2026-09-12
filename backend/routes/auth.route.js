const express = require("express");
const router = express.Router();

var controller = require("../controllers/auth.controller");
var helper = require("../helper/authToken.helper");
var validate = require("../middleware/validate.middleware");
var authValidator = require("../validators/auth.validator");

// login - sab roles (super admin/admin/collaborator) yahi use karte hain
router.post("/sing-in", validate(authValidator.signInSchema), controller.signIn)
router.post("/sing-up", validate(authValidator.signUpSchema), controller.signUp)
router.post("/refresh-token", validate(authValidator.refreshTokenSchema), helper.refreshToken)

module.exports = router;
