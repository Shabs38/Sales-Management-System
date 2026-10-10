const express = require('express');

const {
    getSales,
    getSaleById,
    createSale,
    clearAllSales
} = require('../controllers/salesController');

const {
    requireManagerOrDirector,
    requireDirector
} = require('../middleware/authMiddleware');

const router = express.Router();

// Clear all sales — Director only
router.delete(
    '/clear-all',
    requireDirector,
    clearAllSales
);

// Get all sales
router.get(
    '/',
    requireManagerOrDirector,
    getSales
);

// Get one sale
router.get(
    '/:id',
    requireManagerOrDirector,
    getSaleById
);

// Create a new sale
router.post(
    '/',
    requireManagerOrDirector,
    createSale
);

module.exports = router;
