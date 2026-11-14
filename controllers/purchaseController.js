const pool = require("../config/db");

function getBusinessId(req) {
    const id = Number(req.session?.user?.business_id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

const PRODUCT_CATEGORIES = [
    "food",
    "beverages",
    "household",
    "personal-care"
];

function validDate(value) {
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

function toCents(value) {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
        return null;
    }

    const cents = Math.round(number * 100);

    return Number.isSafeInteger(cents) ? cents : null;
}


// ========================================
// PRODUCT SUGGESTIONS
// ========================================

async function searchProducts(req, res) {
    const businessId = getBusinessId(req);

    if (!businessId) {
        return res.status(403).json({
            success: false,
            message: "A valid business membership is required."
        });
    }

    try {
        const search = String(req.query.q || "").trim();

        const result = await pool.query(`
            SELECT
                id,
                product_name,
                sku,
                category,
                selling_price,
                stock_quantity,
                low_stock_limit
            FROM products
            WHERE business_id = $1
              AND is_active = TRUE
              AND (
                  product_name ILIKE $2
                  OR sku ILIKE $2
              )
            ORDER BY product_name
            LIMIT 10
        `, [businessId, `%${search}%`]);

        res.json({
            success: true,
            products: result.rows
        });

    } catch (error) {
        console.error("Product search error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to search products."
        });
    }
}


// ========================================
// SUPPLIER SUGGESTIONS
// ========================================

async function searchSuppliers(req, res) {
    const businessId = getBusinessId(req);

    if (!businessId) {
        return res.status(403).json({
            success: false,
            message: "A valid business membership is required."
        });
    }

    try {
        const search = String(req.query.q || "").trim();

        const result = await pool.query(`
            SELECT
                supplier_name,
                MAX(supplier_contact) AS supplier_contact
            FROM purchases
            WHERE business_id = $1
              AND supplier_name ILIKE $2
            GROUP BY supplier_name
            ORDER BY supplier_name
            LIMIT 10
        `, [businessId, `%${search}%`]);

        res.json({
            success: true,
            suppliers: result.rows
        });

    } catch (error) {
        console.error("Supplier search error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to search suppliers."
        });
    }
}


// ========================================
// CREATE PURCHASE
// ========================================

async function createPurchase(req, res) {
    const businessId = getBusinessId(req);
    const userId = Number(req.session?.user?.id);

    if (!businessId || !Number.isInteger(userId) || userId <= 0) {
        return res.status(403).json({
            success: false,
            message: "A valid business membership is required."
        });
    }

    const {
        supplier_name,
        supplier_contact,
        invoice_number,
        purchase_date,
        amount_paid,
        payment_method,
        notes,
        items
    } = req.body;

    if (
        typeof supplier_name !== "string" ||
        !supplier_name.trim() ||
        !Array.isArray(items) ||
        items.length === 0 ||
        items.length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: "Supplier name and at least one purchase item are required."
        });
    }

    if (
        purchase_date !== undefined &&
        !validDate(String(purchase_date))
    ) {
        return res.status(400).json({
            success: false,
            message: "Purchase date must use YYYY-MM-DD format."
        });
    }

    const paidCents = toCents(amount_paid === undefined ? 0 : amount_paid);

    if (paidCents === null) {
        return res.status(400).json({
            success: false,
            message: "Amount paid must be a valid non-negative amount."
        });
    }

    const preparedItems = [];
    let totalCents = 0;

    for (const item of items) {
        const quantity = Number(item.quantity);
        const unitCostCents = toCents(item.unit_cost);

        if (
            !Number.isSafeInteger(quantity) ||
            quantity <= 0 ||
            unitCostCents === null
        ) {
            return res.status(400).json({
                success: false,
                message: "Each item must have a valid quantity and unit cost."
            });
        }

        const lineTotal = quantity * unitCostCents;

        if (
            !Number.isSafeInteger(lineTotal) ||
            !Number.isSafeInteger(totalCents + lineTotal)
        ) {
            return res.status(400).json({
                success: false,
                message: "Purchase amount is too large."
            });
        }

        totalCents += lineTotal;

        preparedItems.push({
            ...item,
            quantity,
            unitCostCents
        });
    }

    if (paidCents > totalCents) {
        return res.status(400).json({
            success: false,
            message: "Amount paid cannot exceed the purchase total."
        });
    }

 let client = null;
let transactionStarted = false;

try {
    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

        const purchaseResult = await client.query(`
            INSERT INTO purchases (
                business_id,
                supplier_name,
                supplier_contact,
                invoice_number,
                purchase_date,
                total_amount,
                amount_paid,
                payment_method,
                notes,
                created_by
            )
            VALUES (
                $1, $2, $3, $4,
                COALESCE($5::date, CURRENT_DATE),
                $6, $7, $8, $9, $10
            )
            RETURNING *
        `, [
            businessId,
            supplier_name.trim(),
            supplier_contact || null,
            invoice_number || null,
            purchase_date || null,
            (totalCents / 100).toFixed(2),
            (paidCents / 100).toFixed(2),
            payment_method || null,
            notes || null,
            userId
        ]);

        const purchase = purchaseResult.rows[0];
        const savedItems = [];

        for (const item of preparedItems) {
            let productId;

            if (item.product_id !== undefined && item.product_id !== null) {
                const id = Number(item.product_id);

                if (!Number.isInteger(id) || id <= 0) {
                    throw new Error("Invalid product ID.");
                }

                const productResult = await client.query(`
                    SELECT id
                    FROM products
                    WHERE id = $1
                      AND business_id = $2
                      AND is_active = TRUE
                    FOR UPDATE
                `, [id, businessId]);

                if (productResult.rowCount === 0) {
                    throw new Error(
                        "A selected product does not exist in this business."
                    );
                }

                productId = id;

            } else if (item.new_product) {
                const product = item.new_product;

                const name = String(product.product_name || "").trim();
                const sku = String(product.sku || "").trim();
                const category = String(product.category || "");
                const sellingPriceCents = toCents(product.selling_price);
                const lowStockLimit = Number(product.low_stock_limit);

                if (
                    !name ||
                    !sku ||
                    !PRODUCT_CATEGORIES.includes(category) ||
                    sellingPriceCents === null ||
                    !Number.isSafeInteger(lowStockLimit) ||
                    lowStockLimit < 0
                ) {
                    throw new Error(
                        "New product details are invalid. Check its name, SKU, category, selling price and low-stock limit."
                    );
                }

                const newProductResult = await client.query(`
                    INSERT INTO products (
                        business_id,
                        product_name,
                        sku,
                        category,
                        selling_price,
                        stock_quantity,
                        low_stock_limit
                    )
                    VALUES ($1, $2, $3, $4, $5, 0, $6)
                    RETURNING id
                `, [
                    businessId,
                    name,
                    sku,
                    category,
                    (sellingPriceCents / 100).toFixed(2),
                    lowStockLimit
                ]);

                productId = newProductResult.rows[0].id;

            } else {
                throw new Error(
                    "Each purchase item must reference an existing product or contain new product details."
                );
            }

            const lineTotalCents = item.quantity * item.unitCostCents;

            await client.query(`
                INSERT INTO purchase_items (
                    business_id,
                    purchase_id,
                    product_id,
                    quantity,
                    unit_cost,
                    total_cost
                )
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                businessId,
                purchase.id,
                productId,
                item.quantity,
                (item.unitCostCents / 100).toFixed(2),
                (lineTotalCents / 100).toFixed(2)
            ]);

            const stockResult = await client.query(`
                UPDATE products
                SET stock_quantity = stock_quantity + $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                  AND business_id = $3
                RETURNING id, product_name, stock_quantity
            `, [item.quantity, productId, businessId]);

            if (stockResult.rowCount === 0) {
                throw new Error("Failed to update product stock.");
            }

            savedItems.push({
                ...stockResult.rows[0],
                quantity: item.quantity,
                unit_cost: (item.unitCostCents / 100).toFixed(2),
                total_cost: (lineTotalCents / 100).toFixed(2)
            });
        }

        await client.query("COMMIT");
        transactionStarted = false;

        res.status(201).json({
            success: true,
            message: "Purchase recorded and product stock updated.",
            purchase: {
                ...purchase,
                items: savedItems
            }
        });

    } catch (error) {
        if (transactionStarted && client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Purchase rollback error:", rollbackError);
            }
        }

        console.error("Create purchase error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A product with this SKU already exists in this business."
            });
        }

        if (error.message && (
            error.message.includes("product") ||
            error.message.includes("Product") ||
            error.message.includes("purchase item") ||
            error.message.includes("New product")
        )) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to record purchase."
        });

    } finally {
        if (client) {
            client.release();
        }
    }

}

// ========================================
// PURCHASE HISTORY
// ========================================

async function getPurchases(req, res) {
    const businessId = getBusinessId(req);

    if (!businessId) {
        return res.status(403).json({
            success: false,
            message: "A valid business membership is required."
        });
    }

    try {
        const search = String(req.query.search || "").trim();

        const result = await pool.query(`
            SELECT
                p.id,
                p.supplier_name,
                p.supplier_contact,
                p.invoice_number,
                p.purchase_date,
                p.total_amount,
                p.amount_paid,
                p.payment_method,
                p.notes,
                p.created_at,
                u.full_name AS created_by_name,
                COUNT(pi.id)::integer AS item_count
            FROM purchases p
            LEFT JOIN purchase_items pi
                ON pi.business_id = p.business_id
               AND pi.purchase_id = p.id
            LEFT JOIN users u
                ON u.business_id = p.business_id
               AND u.id = p.created_by
            WHERE p.business_id = $1
              AND (
                  p.supplier_name ILIKE $2
                  OR COALESCE(p.invoice_number, '') ILIKE $2
              )
            GROUP BY p.id, u.full_name
            ORDER BY p.purchase_date DESC, p.id DESC
            LIMIT 200
        `, [businessId, `%${search}%`]);

        res.json({
            success: true,
            purchases: result.rows
        });

    } catch (error) {
        console.error("Get purchases error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load purchase history."
        });
    }
}


// ========================================
// SINGLE PURCHASE
// ========================================

async function getPurchaseById(req, res) {
    const businessId = getBusinessId(req);

    if (!businessId) {
        return res.status(403).json({
            success: false,
            message: "A valid business membership is required."
        });
    }

    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid purchase ID."
            });
        }

        const purchaseResult = await pool.query(`
            SELECT *
            FROM purchases
            WHERE id = $1
              AND business_id = $2
        `, [id, businessId]);

        if (purchaseResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found."
            });
        }

        const itemsResult = await pool.query(`
            SELECT
                pi.id,
                pi.product_id,
                pr.product_name,
                pr.sku,
                pi.quantity,
                pi.unit_cost,
                pi.total_cost
            FROM purchase_items pi
            JOIN products pr
                ON pr.business_id = pi.business_id
               AND pr.id = pi.product_id
            WHERE pi.purchase_id = $1
              AND pi.business_id = $2
            ORDER BY pi.id
        `, [id, businessId]);

        res.json({
            success: true,
            purchase: {
                ...purchaseResult.rows[0],
                items: itemsResult.rows
            }
        });

    } catch (error) {
        console.error("Get purchase error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load purchase."
        });
    }
}


module.exports = {
    searchProducts,
    searchSuppliers,
    createPurchase,
    getPurchases,
    getPurchaseById
};
