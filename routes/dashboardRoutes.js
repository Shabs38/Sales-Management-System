const express = require('express');

const {
    getDirectorDashboard
} = require('../controllers/dashboardController');

const {
    requireDirector
} = require('../middleware/authMiddleware');

const router = express.Router();


// Director dashboard
router.get(
    '/director',
    requireDirector,
    getDirectorDashboard
);


module.exports = router;