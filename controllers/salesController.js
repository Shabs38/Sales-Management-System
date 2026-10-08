const pool = require('../config/db');

// Get all sales
const getSales = async (req, res) => {
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

            INNER JOIN users u
                ON s.user_id = u.id

            LEFT JOIN sale_items si
                ON s.id = si.sale_id

            GROUP BY
                s.id,
                c.full_name,
                u.full_name

            ORDER BY s.id DESC
        `);

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
	    INNER JOIN users u
                ON s.user_id = u.id
          WHERE s.id = $1
        `, [id]);

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
            WHERE si.sale_id = $1
            ORDER BY si.id ASC
        `, [id]);

        res.status(200).json({
            success: true,
            sale: saleResult.rows[0],
            items: itemsResult.rows
        });

    } catch (error) {
        console.error('Error fetching sale:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch sale'
        });
    }
};


const createSale = async (req, res) => {
    const client = await pool.connect();

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

       // Basic validation
if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
        success: false,
        message: 'At least one product is required'
    });
}

        if (!payment_method) {
            return res.status(400).json({
                success: false,
                message: 'Payment method is required'
            });
        }

        if (Number(discount) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Discount cannot be negative'
            });
        }

        // Start transaction
        await client.query('BEGIN');

      // Check customer only if one was selected
if (customer_id !== null && customer_id !== undefined && customer_id !== '') {

    const customerResult = await client.query(
        `SELECT id
         FROM customers
         WHERE id = $1
         AND is_active = true`,
        [customer_id]
    );

    if (customerResult.rows.length === 0) {
        await client.query('ROLLBACK');

        return res.status(404).json({
            success: false,
            message: 'Active customer not found'
        });
    }
}


        let subtotal = 0;
        const saleItems = [];

        // Check products and stock
        for (const item of items) {

            const product_id = Number(item.product_id);
            const quantity = Number(item.quantity);

            if (!Number.isInteger(product_id) || !Number.isInteger(quantity) || quantity <= 0) {
                await client.query('ROLLBACK');

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
                 AND is_active = true
                 FOR UPDATE`,
                [product_id]
            );

            if (productResult.rows.length === 0) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    success: false,
                    message: `Product ${product_id} not found`
                });
            }

            const product = productResult.rows[0];

            if (product.stock_quantity < quantity) {
                await client.query('ROLLBACK');

                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.product_name}`
                });
            }

            const unitPrice = Number(product.selling_price);
            const totalPrice = unitPrice * quantity;

            subtotal += totalPrice;

            saleItems.push({
                product_id,
                quantity,
                unit_price: unitPrice,
                total_price: totalPrice
            });
        }

        const discountAmount = Number(discount);
        const totalAmount = subtotal - discountAmount;

        if (totalAmount < 0) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                success: false,
                message: 'Discount cannot be greater than subtotal'
            });
        }

        // Generate sale reference
        const saleReference =
            `SAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Get logged-in user
        const userId = req.session?.user?.id;

        if (!userId) {
            await client.query('ROLLBACK');

            return res.status(401).json({
                success: false,
                message: 'User is not authenticated'
            });
        }

        // Create sale
        const saleResult = await client.query(
            `INSERT INTO sales
            (
                sale_reference,
                customer_id,
                user_id,
                subtotal,
                discount,
                total_amount,
                payment_method,
                payment_status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                saleReference,
                customer_id,
                userId,
                subtotal,
                discountAmount,
                totalAmount,
                payment_method,
                payment_status
            ]
        );

        const sale = saleResult.rows[0];

        // Insert sale items and reduce stock
        for (const item of saleItems) {

            await client.query(
                `INSERT INTO sale_items
                (
                    sale_id,
                    product_id,
                    quantity,
                    unit_price,
                    total_price
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    sale.id,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.total_price
                ]
            );

            await client.query(
                `UPDATE products
                 SET stock_quantity = stock_quantity - $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [
                    item.quantity,
                    item.product_id
                ]
            );
        }

        // Everything succeeded
        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Sale created successfully',
            sale
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error('Error creating sale:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to create sale'
        });

    } finally {
        client.release();
    }
};


module.exports = {
    getSales,
    getSaleById,
    createSale
};
