const express = require("express");
const router = express.Router();
var controller = require("../controllers/group.controller");
var helper = require("../helper/authToken.helper");


router.post("/create-group", helper.verifyToken, controller.create)

router.get("/getall-group", helper.verifyToken, controller.getAll)

router.get("/get-groupbyid", helper.verifyToken, controller.getById)

router.get("/group-count", controller.groupCount)

router.put("/update-group/:id", controller.update)

router.delete("/delete-group/:id", controller.delete)



module.exports = router;
