const pool = require('../config/db');

function getBusinessId(req) {
    const id = Number(req.session?.user?.business_id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function requireBusinessId(req, res) {
    const businessId = getBusinessId(req);

    if (
        businessId === null ||
        req.session?.user?.is_platform_admin === true
    ) {
        res.status(403).json({
            success: false,
            message: 'A valid business membership is required'
        });
        return null;
    }

    return businessId;
}

// Get all sales
const getSales = async (req, res) => {
    const businessId = requireBusinessId(req, res);
    if (businessId === null) return;

    try {

        const result = await pool.query(`
            SELECT
                s.id,
                s.sale_reference,
                s.customer_id,
                COALESCE(c.full_name, 'Walk-in Customer') AS customer_name,
                s.user_id,
                u.full_name AS salesperson_name,
                s.subtotal,
                s.discount,
                s.total_amount,
                s.payment_method,
                s.payment_status,
                s.created_at,

                COALESCE(
                    SUM(si.quantity),
                    0
                ) AS products_sold

            FROM sales s

            LEFT JOIN customers c
                ON s.customer_id = c.id
               AND c.business_id = s.business_id

            INNER JOIN users u
                ON s.user_id = u.id
               AND u.business_id = s.business_id

            LEFT JOIN sale_items si
                ON s.id = si.sale_id
               AND si.business_id = s.business_id

            WHERE s.business_id = $1

            GROUP BY
                s.id,
                c.full_name,
                u.full_name

            ORDER BY s.id DESC
        `, [businessId]);

        res.status(200).json({
            success: true,
            sales: result.rows
        });

    } catch (error) {

        console.error(
            'Error fetching sales:',
            error
        );

        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales'
        });
    }
};


// Get one sale with its items
const getSaleById = async (req, res) => {
    const businessId = requireBusinessId(req, res);
    if (businessId === null) return;

    try {
        const { id } = req.params;

        const saleResult = await pool.query(`
            SELECT
                s.id,
                s.sale_reference,
                s.customer_id,
                COALESCE(c.full_name, 'Walk-in Customer') AS customer_name,
                s.user_id,
                u.full_name AS salesperson_name,
                s.subtotal,
                s.discount,
                s.total_amount,
                s.payment_method,
                s.payment_status,
                s.created_at
            FROM sales s
            LEFT JOIN customers c
                ON s.customer_id = c.id
                AND c.business_id = s.business_id
            INNER JOIN users u
                ON s.user_id = u.id
                AND u.business_id = s.business_id
            WHERE s.id = $1
              AND s.business_id = $2
        `, [id, businessId]);

        if (saleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        const itemsResult = await pool.query(`
            SELECT
                si.id,
                si.product_id,
                p.product_name,
                p.sku,
                si.quantity,
                si.unit_price,
                si.total_price
            FROM sale_items si
            INNER JOIN products p
                ON si.product_id = p.id
                AND p.business_id = si.business_id
            WHERE si.sale_id = $1
              AND si.business_id = $2
            ORDER BY si.id ASC
        `, [id, businessId]);

        return res.status(200).json({
            success: true,
            sale: saleResult.rows[0],
            items: itemsResult.rows
        });

    } catch (error) {
        console.error('Error fetching sale:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sale'
        });
    }
};


const createSale = async (req, res) => {
    const businessId = requireBusinessId(req, res);
    if (businessId === null) return;

    let client;
    let transactionStarted = false;

    try {
        const {
            customer_id,
            items,
            discount = 0,
            payment_method,
            payment_status = 'paid'
        } = req.body;

        const customerId =
            customer_id === '' ||
            customer_id === undefined ||
            customer_id === null
                ? null
                : Number(customer_id);

        const discountAmount = Number(discount);

        // Validate the request before acquiring a database connection.
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one product is required'
            });
        }

        if (
            customerId !== null &&
            (!Number.isInteger(customerId) || customerId <= 0)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer'
            });
        }

        if (!payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Payment method is required'
            });
        }

        if (!Number.isFinite(discountAmount) || discountAmount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Discount must be a valid non-negative number'
            });
        }

        const userId = Number(req.session?.user?.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({
                success: false,
                message: 'User is not authenticated'
            });
        }

        client = await pool.connect();
        await client.query('BEGIN');
        transactionStarted = true;

        // The customer must belong to the logged-in user's business.
        if (customerId !== null) {
            const customerResult = await client.query(
                `SELECT id
                 FROM customers
                 WHERE id = $1
                   AND business_id = $2
                   AND is_active = true`,
                [customerId, businessId]
            );

            if (customerResult.rows.length === 0) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(404).json({
                    success: false,
                    message: 'Active customer not found'
                });
            }
        }

        let subtotal = 0;
        const saleItems = [];

        // Products must belong to this business.
        for (const item of items) {
            const productId = Number(item.product_id);
            const quantity = Number(item.quantity);

            if (
                !Number.isInteger(productId) ||
                productId <= 0 ||
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message: 'Invalid product or quantity'
                });
            }

            const productResult = await client.query(
                `SELECT
                    id,
                    product_name,
                    selling_price,
                    stock_quantity
                 FROM products
                 WHERE id = $1
                   AND business_id = $2
                   AND is_active = true
                 FOR UPDATE`,
                [productId, businessId]
            );

            if (productResult.rows.length === 0) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(404).json({
                    success: false,
                    message: `Product ${productId} not found`
                });
            }

            const product = productResult.rows[0];

            if (Number(product.stock_quantity) < quantity) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.product_name}`
                });
            }

            const unitPrice = Number(product.selling_price);
            const totalPrice = unitPrice * quantity;

            if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(500).json({
                    success: false,
                    message: 'Invalid product price configuration'
                });
            }

            subtotal += totalPrice;

            saleItems.push({
                product_id: productId,
                quantity,
                unit_price: unitPrice,
                total_price: totalPrice
            });
        }

        const totalAmount = subtotal - discountAmount;

        if (!Number.isFinite(totalAmount) || totalAmount < 0) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: 'Discount cannot be greater than subtotal'
            });
        }

        const saleReference =
            `SAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Record the business explicitly on the sale.
        const saleResult = await client.query(
            `INSERT INTO sales
                (
                    business_id,
                    sale_reference,
                    customer_id,
                    user_id,
                    subtotal,
                    discount,
                    total_amount,
                    payment_method,
                    payment_status
                )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                businessId,
                saleReference,
                customerId,
                userId,
                subtotal,
                discountAmount,
                totalAmount,
                payment_method,
                payment_status
            ]
        );

        const sale = saleResult.rows[0];

        // Record sale items and update stock within the same business.
        for (const item of saleItems) {
            await client.query(
                `INSERT INTO sale_items
                    (
                        business_id,
                        sale_id,
                        product_id,
                        quantity,
                        unit_price,
                        total_price
                    )
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    businessId,
                    sale.id,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.total_price
                ]
            );

            const stockResult = await client.query(
                `UPDATE products
                 SET stock_quantity = stock_quantity - $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2
                   AND business_id = $3
                   AND is_active = true
                   AND stock_quantity >= $1
                 RETURNING id`,
                [item.quantity, item.product_id, businessId]
            );

            if (stockResult.rows.length === 0) {
                throw new Error(
                    `Stock update failed for product ${item.product_id}`
                );
            }
        }

        await client.query('COMMIT');
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: 'Sale created successfully',
            sale
        });

    } catch (error) {
        if (client && transactionStarted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('Sale transaction rollback failed:', rollbackError);
            }

            transactionStarted = false;
        }

        console.error('Error creating sale:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to create sale'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};



// Clear sales transactions for the current business — Director only
const clearAllSales = async (req, res) => {
    const businessId = requireBusinessId(req, res);
    if (businessId === null) return;

    let client;
    let transactionStarted = false;

    try {
        client = await pool.connect();

        await client.query('BEGIN');
        transactionStarted = true;

        const result = await client.query(
            `DELETE FROM sales
             WHERE business_id = $1
             RETURNING id`,
            [businessId]
        );

        await client.query('COMMIT');
        transactionStarted = false;

        return res.status(200).json({
            success: true,
            message: `Successfully cleared ${result.rowCount} sales transactions.`,
            deletedSales: result.rowCount
        });

    } catch (error) {
        if (client && transactionStarted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error(
                    'Rollback failed:',
                    rollbackError.message
                );
            }
        }

        console.error('Error clearing sales:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to clear sales transactions.'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
};

module.exports = {
    getSales,
    getSaleById,
    createSale,
    clearAllSales
};
