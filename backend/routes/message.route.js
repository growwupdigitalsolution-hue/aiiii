const express = require("express");
const router = express.Router();
const multer = require("multer");
const controller = require("../controllers/message.controller");
const helper = require("../helper/authToken.helper");

// TODO: apna actual storage config lagao (disk / S3 / cloudinary etc.)
// Abhi ke liye simple disk storage — "uploads/" folder pehle se exist hona chahiye.
const upload = multer({ dest: "uploads/" });

router.get("/message/get-by-contact/:contactId", helper.verifyToken, controller.getByContact);

// upload.single("file") sirf tab file parse karega jab request multipart/form-data ho
// (text/location messages JSON body ke saath normal chalte rahenge)
router.post("/message/send", helper.verifyToken, upload.single("file"), controller.send);

router.post("/message/incoming", controller.incoming); // webhook — public

router.get("/chat-list", helper.verifyToken, controller.chatList);
router.get("/chat-details/:contactId", helper.verifyToken, controller.chatDetails);

module.exports = router;