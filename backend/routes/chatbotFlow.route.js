const express = require("express");
const router = express.Router();

const controller = require("../controllers/chatbotFlow.controller");
const authToken = require("../helper/authToken.helper");

router.get("/get-chatbot-list", authToken.verifyToken, controller.getChatbotList);
router.get("/chatbot-detail/:id", authToken.verifyToken, controller.getChatbot);

router.post("/create-chatbot", authToken.verifyToken, controller.createChatbot);
router.post("/update-chatbot/:id", authToken.verifyToken, controller.updateChatbot);
router.post("/publish-chatbot/:id", authToken.verifyToken, controller.publishChatbot);
router.get("/chatbot-detail/:id", authToken.verifyToken, controller.getChatbot);

module.exports = router;