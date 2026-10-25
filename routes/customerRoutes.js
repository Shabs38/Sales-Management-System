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
    requireDirector,
    requireBusiness
} = require('../middleware/authMiddleware');

const router = express.Router();


// ========================================
// VIEW CUSTOMERS
// Manager + Director
// ========================================

router.get(
    '/',
    requireManagerOrDirector,
    requireBusiness,
    getCustomers
);


// ========================================
// VIEW CUSTOMER BY ID
// Manager + Director
// ========================================

router.get(
    '/:id',
    requireManagerOrDirector,
    requireBusiness,
    getCustomerById
);


// ========================================
// ADD CUSTOMER
// Manager + Director
// ========================================

router.post(
    '/',
    requireManagerOrDirector,
    requireBusiness,
    createCustomer
);


// ========================================
// UPDATE CUSTOMER
// Director ONLY
// ========================================

router.put(
    '/:id',
    requireDirector,
    requireBusiness,
    updateCustomer
);


// ========================================
// DELETE CUSTOMER
// Director ONLY
// ========================================

router.delete(
    '/:id',
    requireDirector,
    requireBusiness,
    deleteCustomer
);


module.exports = router;