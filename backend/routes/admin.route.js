const express = require("express");
const router = express.Router();

var controller = require("../controllers/admin.controller");
var helper = require("../helper/authToken.helper");
var validate = require("../middleware/validate.middleware");
var adminValidator = require("../validators/admin.validator");
var { checkRole } = require("../middleware/role.middleware");
var ROLES = require("../constants/roles.constant");



router.get(
    "/staff-list",
    helper.verifyToken,
    checkRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
    controller.getStaffList
)

module.exports = router;
