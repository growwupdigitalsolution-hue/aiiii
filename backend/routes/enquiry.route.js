const express = require("express");
const router = express.Router();

var controller = require("../controllers/enquiry.controller");
var validate = require("../middleware/validate.middleware");
var enquiryValidator = require("../validators/enquiry.validator");

router.post("/create-enquiry", validate(enquiryValidator.createEnquirySchema), controller.createEnquiry)
router.get("/get-enquiry", controller.getEnquiry)

module.exports = router;
