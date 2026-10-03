const express = require('express');

const {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require('../controllers/customerController');

const {
    requireManagerOrDirector,
    requireDirector
} = require('../middleware/authMiddleware');

const router = express.Router();


// ========================================
// VIEW CUSTOMERS
// Manager + Director
// ========================================

router.get(
    '/',
    requireManagerOrDirector,
    getCustomers
);


// ========================================
// VIEW CUSTOMER BY ID
// Manager + Director
// ========================================

router.get(
    '/:id',
    requireManagerOrDirector,
    getCustomerById
);


// ========================================
// ADD CUSTOMER
// Manager + Director
// ========================================

router.post(
    '/',
    requireManagerOrDirector,
    createCustomer
);


// ========================================
// UPDATE CUSTOMER
// Director ONLY
// ========================================

router.put(
    '/:id',
    requireDirector,
    updateCustomer
);


// ========================================
// DELETE CUSTOMER
// Director ONLY
// ========================================

router.delete(
    '/:id',
    requireDirector,
    deleteCustomer
);


module.exports = router;