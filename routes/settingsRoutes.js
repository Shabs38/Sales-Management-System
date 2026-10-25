const express = require("express");

const {
    getSettings,
    updateSettings
} = require("../controllers/settingsController");

const {
    requireAuth,
    requireDirector,
    requireBusiness
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, requireBusiness, requireDirector, getSettings);
router.put("/", requireAuth, requireBusiness, requireDirector, updateSettings);

module.exports = router;
