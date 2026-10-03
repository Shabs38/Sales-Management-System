const express = require("express");

const {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

const {
    requireManagerOrDirector,
    requireDirector
} = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// GET ALL PRODUCTS
// Manager + Director
// ========================================

router.get(
    "/",
    requireManagerOrDirector,
    getProducts
);


// ========================================
// CREATE PRODUCT
// Director ONLY
// ========================================

router.post(
    "/",
    requireDirector,
    createProduct
);


// ========================================
// UPDATE PRODUCT
// Director ONLY
// ========================================

router.put(
    "/:id",
    requireDirector,
    updateProduct
);


// ========================================
// DELETE PRODUCT
// Director ONLY
// ========================================

router.delete(
    "/:id",
    requireDirector,
    deleteProduct
);


module.exports = router;