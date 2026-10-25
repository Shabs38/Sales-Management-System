const express = require('express');

const {
    getSales,
    getSaleById,
    createSale,
    clearAllSales
} = require('../controllers/salesController');

const {
    requireBusiness,
    requireManagerOrDirector,
    requireDirector
} = require('../middleware/authMiddleware');

const router = express.Router();

// Clear sales — business members with director permissions only
router.delete(
    '/clear-all',
    requireBusiness,
    requireDirector,
    clearAllSales
);

// Get all sales for the current business
router.get(
    '/',
    requireBusiness,
    requireManagerOrDirector,
    getSales
);

// Get one sale belonging to the current business
router.get(
    '/:id',
    requireBusiness,
    requireManagerOrDirector,
    getSaleById
);

// Create a sale for the current business
router.post(
    '/',
    requireBusiness,
    requireManagerOrDirector,
    createSale
);

module.exports = router;
