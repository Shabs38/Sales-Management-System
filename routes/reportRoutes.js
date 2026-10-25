const express = require('express');

const {
    getReports
} = require('../controllers/reportController');

const {
    requireManagerOrDirector,
    requireBusiness
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
    '/',
    requireManagerOrDirector,
    requireBusiness,
    getReports
);

module.exports = router;
