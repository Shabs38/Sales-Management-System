const express = require('express');

const {
    requirePlatformAdmin
} = require('../middleware/authMiddleware');

const {
    createBusiness
} = require('../controllers/platformBusinessController');

const router = express.Router();

// Only the platform administrator may register a business.
router.post('/', requirePlatformAdmin, createBusiness);

module.exports = router;
