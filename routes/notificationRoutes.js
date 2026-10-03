const express = require('express');

const {
    getManagerNotifications
} = require('../controllers/notificationController');

const {
    requireAuth
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
    '/',
    requireAuth,
    getManagerNotifications
);

module.exports = router;