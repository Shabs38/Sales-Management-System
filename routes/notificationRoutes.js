const express = require("express");

const {
    getManagerNotifications
} = require("../controllers/notificationController");

const {
    requireAuth,
    requireBusiness,
    requireManagerOrDirector
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/",
    requireAuth,
    requireBusiness,
    requireManagerOrDirector,
    getManagerNotifications
);

module.exports = router;
