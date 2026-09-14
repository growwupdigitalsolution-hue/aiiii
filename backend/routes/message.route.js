const express = require("express");
const router = express.Router();
const controller = require("../controllers/message.controller");
const helper = require("../helper/authToken.helper");

router.get("/message/get-by-contact/:contactId", helper.verifyToken, controller.getByContact);
router.post("/message/send", helper.verifyToken, controller.send);
router.post("/message/incoming", controller.incoming); // webhook — public
router.get("/chat-list", helper.verifyToken, controller.chatList);

module.exports = router;