const express = require("express");
const router = express.Router();

var controller = require("../controllers/broadcast.controller");
var helper = require("../helper/authToken.helper");
var validate = require("../middleware/validate.middleware");
var { sendBroadcastValidator } = require("../validators/broadcast.validator");

// koi bhi logged-in role (super admin/admin/collaborator) yeh use kar sakta hai
router.post(
    "/send-broadcast",
    helper.verifyToken,
    validate(sendBroadcastValidator),
    controller.sendBroadcast
);

// router.get("/stats", helper.verifyToken, controller.getBroadcastStats);
// router.get("/", helper.verifyToken, controller.getBroadcastList);
// router.get("/:broadcastId", helper.verifyToken, controller.getBroadcastDetail);
// router.delete("/:broadcastId", helper.verifyToken, controller.deleteBroadcast);

module.exports = router;