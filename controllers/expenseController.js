const pool = require("../config/db");

const EXPENSE_CATEGORIES = [
    "transport",
    "electricity",
    "rent",
    "salaries",
    "maintenance",
    "utilities",
    "supplies",
    "marketing",
    "other"
];

function getBusinessId(req) {
    const id = Number(req.session?.user?.business_id);
    return Number.isInteger(id) && id > 0 ? id : null;
}


// ========================================
// GET EXPENSES
// ========================================

async function getExpenses(req, res) {
    const businessId = getBusinessId(req);

    if (!businessId) {
        return res.status(403).json({
            success: false,
            message: "A valid business membership is required."
        });
    }

    try {
        const category = String(req.query.category || "").trim();
        const search = String(req.query.search || "").trim();

        if (category && !EXPENSE_CATEGORIES.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid expense category."
            });
        }

        const result = await pool.query(`
            SELECT
                e.id,
                e.category,
                e.amount,
                e.description,
                e.expense_date,
                e.created_at,
                u.full_name AS created_by_name
            FROM expenses e
            LEFT JOIN users u
                ON u.business_id = e.business_id
               AND u.id = e.created_by
            WHERE e.business_id = $1
              AND ($2 = '' OR e.category = $2)
              AND (
                  COALESCE(e.description, '') ILIKE $3
                  OR e.category ILIKE $3
              )
            ORDER BY e.expense_date DESC, e.id DESC
            LIMIT 500
        `, [businessId, category, `%${search}%`]);

        res.json({
            success: true,
            expenses: result.rows
        });

    } catch (error) {
        console.error("Get expenses error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load expenses."
        });
    }
}


// ========================================
// CREATE EXPENSE
// ========================================

async function createExpense(req, res) {
    const businessId = getBusinessId(req);
    const userId = Number(req.session?.user?.id);

    if (!businessId || !Number.isInteger(userId) || userId <= 0) {
        return res.status(403).json({
            success: false,
            message: "A valid business membership is required."
        });
    }

    const {
        category,
        amount,
        description,
        expense_date
    } = req.body;

    const numericAmount = Number(amount);

    if (
        !EXPENSE_CATEGORIES.includes(category) ||
        amount === undefined ||
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0 ||
        !Number.isSafeInteger(Math.round(numericAmount * 100))
    ) {
        return res.status(400).json({
            success: false,
            message: "Provide a valid category and expense amount."
        });
    }

    if (
        expense_date !== undefined &&
!isValidExpenseDate(String(expense_date)) ) {
        return res.status(400).json({
            success: false,
            message: "Expense date must use YYYY-MM-DD format."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO expenses (
                business_id,
                category,
                amount,
                description,
                expense_date,
                created_by
            )
            VALUES (
                $1, $2, $3, $4,
                COALESCE($5::date, CURRENT_DATE),
                $6
            )
            RETURNING *
        `, [
            businessId,
            category,
            numericAmount.toFixed(2),
            description ? String(description).trim() : null,
            expense_date || null,
            userId
        ]);

        res.status(201).json({
            success: true,
            message: "Expense recorded successfully.",
            expense: result.rows[0]
        });

    } catch (error) {
        console.error("Create expense error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to record expense."
        });
    }
}


function isValidExpenseDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);

    if (year < 1 || month < 1 || month > 12) {
        return false;
    }

    const isLeapYear =
        year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);

    const daysInMonth = [
        31, isLeapYear ? 29 : 28, 31, 30, 31, 30,
        31, 31, 30, 31, 30, 31
    ];

    return day >= 1 && day <= daysInMonth[month - 1];
}



module.exports = {
    getExpenses,
    createExpense
};
