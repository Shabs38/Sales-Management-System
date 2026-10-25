const express = require('express');

const {
    getDirectorDashboard
} = require('../controllers/dashboardController');

const {
    requireDirector,
    requireBusiness
} = require('../middleware/authMiddleware');

const router = express.Router();

// Director dashboard requires director access and valid business membership.
router.get(
    '/director',
    requireDirector,
    requireBusiness,
    getDirectorDashboard
);

module.exports = router;
