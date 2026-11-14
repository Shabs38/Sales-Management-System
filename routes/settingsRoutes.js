const express = require("express");

const {
    getSettings,
    updateSettings,
    getUserTheme,
    updateUserTheme
} = require("../controllers/settingsController");

const {
    requireAuth,
    requireDirector,
    requireBusiness
} = require("../middleware/authMiddleware");

const router = express.Router();

// Personal theme settings: managers and directors
router.get("/theme", requireAuth, requireBusiness, getUserTheme);
router.put("/theme", requireAuth, requireBusiness, updateUserTheme);

// Business settings: directors only
router.get("/", requireAuth, requireBusiness, requireDirector, getSettings);
router.put("/", requireAuth, requireBusiness, requireDirector, updateSettings);

module.exports = router;
