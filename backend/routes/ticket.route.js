const express = require("express");
const router = express.Router();

var controller = require("../controllers/ticket.controller");
var helper = require("../helper/authToken.helper");

router.get("/get-all-ticket", helper.verifyToken, controller.getAllTciket) // 
router.get("/get-group-by-ticket", helper.verifyToken, controller.getGroupByTicket) // 

router.post("/assign-ticket-in-group", helper.verifyToken, controller.assignTicketInGroup)
router.post("/cancel-ticket", helper.verifyToken, controller.cancelTicket)
router.post("/update-readCount", helper.verifyToken, controller.updateReadCount)

module.exports = router;
