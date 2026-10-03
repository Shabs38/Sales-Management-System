const pool = require('../config/db');

const getManagerNotifications = async (req, res) => {

    try {

        const managerId = req.session.user.id;

        const notifications = [];

        // =========================================
        // 1. LATEST SALE
        // =========================================

        const latestSale = await pool.query(`
            SELECT
                s.id,
                s.sale_reference,
                s.total_amount,
                s.created_at,
                c.full_name AS customer_name
            FROM sales s
            LEFT JOIN customers c
                ON c.id = s.customer_id
            WHERE s.user_id = $1
            ORDER BY s.created_at DESC
            LIMIT 1
        `, [managerId]);


        if (latestSale.rows.length > 0) {

            const sale = latestSale.rows[0];

            notifications.push({
                type: 'sale',
                icon: '✓',
                title: 'New Sale Recorded',
                message:
                    `Sale ${sale.sale_reference} recorded for ` +
                    `${sale.customer_name || 'customer'}.`,
                created_at: sale.created_at
            });

        }


        // =========================================
        // 2. LOW STOCK PRODUCTS
        // =========================================

        const lowStock = await pool.query(`
            SELECT
                id,
                product_name,
                stock_quantity,
                low_stock_limit
            FROM products
            WHERE is_active = true
            AND stock_quantity <= low_stock_limit
            ORDER BY stock_quantity ASC
            LIMIT 10
        `);


        if (lowStock.rows.length > 0) {

            const count =
                lowStock.rows.length;

            notifications.push({
                type: 'stock',
                icon: '!',
                title: 'Low Stock Alert',
                message:
                    count === 1
                        ? `${lowStock.rows[0].product_name} requires restocking.`
                        : `${count} products require restocking.`,
                created_at: new Date()
            });

        }


        // =========================================
        // SORT NOTIFICATIONS
        // =========================================

        notifications.sort(
            (a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
        );


        // =========================================
        // RETURN RESPONSE
        // =========================================

        res.status(200).json({

            success: true,

            count: notifications.length,

            notifications

        });

    } catch (error) {

        console.error(
            'Manager notifications error:',
            error
        );

        res.status(500).json({

            success: false,

            message:
                'Failed to load notifications'

        });

    }

};


module.exports = {
    getManagerNotifications
};