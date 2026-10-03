const express = require("express");

const {
    getSettings,
    updateSettings
} = require("../controllers/settingsController");

const {
    requireAuth
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, getSettings);

router.put("/", requireAuth, updateSettings);

module.exports = router;