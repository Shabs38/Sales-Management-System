const express = require('express');

const {
    getReports
} = require('../controllers/reportController');

const {
    requireManagerOrDirector
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
    '/',
    requireManagerOrDirector,
    getReports
);

module.exports = router;