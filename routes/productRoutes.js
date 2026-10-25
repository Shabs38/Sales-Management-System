const express = require("express");

const {
    getProducts,
    getProductStats,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

const {
    requireManagerOrDirector,
    requireDirector,
    requireBusiness
} = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// GET ALL PRODUCTS
// Manager + Director
// ========================================

router.get(
    "/",
    requireManagerOrDirector,
    requireBusiness,
    getProducts
);


// ========================================
// GET PRODUCT STATISTICS
// Manager + Director
// ========================================

router.get(
    "/stats",
    requireManagerOrDirector,
    requireBusiness,
    getProductStats
);



// ========================================
// CREATE PRODUCT
// Director ONLY
// ========================================

router.post(
    "/",
    requireDirector,
    requireBusiness,
    createProduct
);


// ========================================
// UPDATE PRODUCT
// Director ONLY
// ========================================

router.put(
    "/:id",
    requireDirector,
    requireBusiness,
    updateProduct
);


// ========================================
// DELETE PRODUCT
// Director ONLY
// ========================================

router.delete(
    "/:id",
    requireDirector,
    requireBusiness,
    deleteProduct
);


module.exports = router;
