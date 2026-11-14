const express = require("express");
const router = express.Router();

const {
    requireDirector,
    requireBusiness
} = require("../middleware/authMiddleware");

const {
    searchProducts,
    searchSuppliers,
    createPurchase,
    getPurchases,
    getPurchaseById
} = require("../controllers/purchaseController");

router.use(requireBusiness, requireDirector);

router.get("/products", searchProducts);
router.get("/suppliers", searchSuppliers);
router.get("/", getPurchases);
router.get("/:id", getPurchaseById);
router.post("/", createPurchase);

module.exports = router;
