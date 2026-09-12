const controller = require("../controllers/dashboard.controller");
const helper = require("../helper/authToken.helper");

const express = require("express");
const router = express.Router();

router.get("/dashboard/summary", helper.verifyToken, controller.getSummary);
router.get("/dashboard/message-analytics", helper.verifyToken, controller.getMessageAnalytics);
router.get("/dashboard/revenue-trend", helper.verifyToken, controller.getRevenueTrend);
router.get("/dashboard/ticket-status", helper.verifyToken, controller.getTicketStatusDistribution);
router.get("/dashboard/recent-activity", helper.verifyToken, controller.getRecentActivity);
router.get("/dashboard/recent-orders", helper.verifyToken, controller.getRecentOrders);

module.exports = router;
