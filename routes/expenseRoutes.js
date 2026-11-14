const express = require("express");
const router = express.Router();

const {
    requireManagerOrDirector,
    requireBusiness
} = require("../middleware/authMiddleware");

const {
    getExpenses,
    createExpense
} = require("../controllers/expenseController");

router.use(requireBusiness, requireManagerOrDirector);

router.get("/", getExpenses);
router.post("/", createExpense);

module.exports = router;
