// routes/templates.route.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const controller = require("../controllers/templates.controller");
const helper = require("../helper/authToken.helper");

router.get("/templates", helper.verifyToken, controller.list);
router.get("/templates/:templateId", helper.verifyToken, controller.getById);
router.post("/templates", helper.verifyToken, upload.single("media"), controller.create);
router.delete("/templates/:templateId", helper.verifyToken, controller.remove);

// Meta khud call karta hai - user auth nahi, hub.verify_token se secure hota hai
router.get("/templates/webhook", controller.verifyWebhook);
router.post("/templates/webhook", controller.statusWebhook);

module.exports = router;