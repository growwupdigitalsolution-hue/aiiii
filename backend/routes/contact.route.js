const express = require("express");
const router = express.Router();
const controller = require("../controllers/contact.controller");
const helper = require("../helper/authToken.helper");
const upload = require("../middleware/fileuploding.middleware");

router.post("/create-group-contact", helper.verifyToken, upload.single("file"), controller.create);
router.get("/getall-group-contact", helper.verifyToken, controller.getAllGroupContact);
router.get("/get-contactbyid", helper.verifyToken, controller.getById);
router.put("/update-contact/:id", helper.verifyToken, controller.update);
router.delete("/delete-contact", helper.verifyToken, controller.delete);
router.delete("/delete-group-contact/:id", helper.verifyToken, controller.deleteGroupContact);

module.exports = router;