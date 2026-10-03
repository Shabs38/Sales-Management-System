const express = require('express');

const {
    getManagerDashboard
} = require('../controllers/managerDashboardController');

const {
    requireAuth
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
    '/',
    requireAuth,
    getManagerDashboard
);

module.exports = router;