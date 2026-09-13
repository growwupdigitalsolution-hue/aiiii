const express = require("express");
const router = express.Router();
const controller = require("../controllers/webHook.controler");

// Meta verification (no auth — Meta hits this)
router.get("/webhook/whatsapp", controller.verify);

// Incoming message webhook (no auth — Meta hits this)
router.post("/webhook/whatsapp", controller.receive);

module.exports = router;