const pool = require('../config/db');


// ========================================
// DIRECTOR DASHBOARD
// ========================================

const getDirectorDashboard = async (req, res) => {

    try {

        // ========================================
        // 1. TOTAL REVENUE + TOTAL SALES
        // ========================================

        const salesSummary = await pool.query(`
            SELECT
                COUNT(*) AS total_sales,
                COALESCE(SUM(total_amount), 0) AS total_revenue
            FROM sales
        `);


        // ========================================
        // 2. TOTAL PRODUCTS
        // ========================================

        const productsSummary = await pool.query(`
            SELECT
                COUNT(*) AS total_products
            FROM products
            WHERE is_active = true
        `);


        // ========================================
        // 3. MANAGER STATISTICS
        // ========================================

        const managerSummary = await pool.query(`
            SELECT
                COUNT(*) AS total_managers,

                COUNT(*) FILTER (
                    WHERE is_active = true
                ) AS active_managers,

                COUNT(*) FILTER (
                    WHERE is_active = false
                ) AS inactive_managers

            FROM users
            WHERE role = 'manager'
        `);


        // ========================================
        // 4. TOP MANAGERS
        // ========================================

        const topManagers = await pool.query(`
            SELECT
                u.id,
                u.full_name,
                COUNT(s.id) AS total_sales,
                COALESCE(SUM(s.total_amount), 0) AS total_revenue

            FROM users u

            LEFT JOIN sales s
                ON s.user_id = u.id

            WHERE u.role = 'manager'

            GROUP BY
                u.id,
                u.full_name

            ORDER BY
                total_revenue DESC

            LIMIT 5
        `);


        // ========================================
        // 5. RECENT TRANSACTIONS
        // ========================================

        const recentTransactions = await pool.query(`
            SELECT
                s.id,
                s.sale_reference,
                s.total_amount,
                s.payment_method,
                s.payment_status,
                s.created_at,

                c.full_name AS customer_name,

                u.full_name AS manager_name

            FROM sales s

            LEFT JOIN customers c
                ON c.id = s.customer_id

            LEFT JOIN users u
                ON u.id = s.user_id

            ORDER BY
                s.created_at DESC

            LIMIT 10
        `);


        // ========================================
        // 6. SALES CHART
        // ========================================

       const period = req.query.period || 'monthly';

let salesChart;

if (period === 'weekly') {

    salesChart = await pool.query(`
        SELECT
            DATE(created_at) AS sale_date,
            COUNT(*) AS total_sales,
            COALESCE(SUM(total_amount), 0) AS total_revenue
        FROM sales
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY sale_date ASC
    `);

} else {

    salesChart = await pool.query(`
        SELECT
            DATE_TRUNC('month', created_at) AS sale_date,
            COUNT(*) AS total_sales,
            COALESCE(SUM(total_amount), 0) AS total_revenue
        FROM sales
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY sale_date ASC
    `);

}

        // ========================================
        // RESPONSE
        // ========================================

        res.status(200).json({

            success: true,

            summary: {
                total_sales:
                    Number(
                        salesSummary.rows[0].total_sales
                    ),

                total_revenue:
                    Number(
                        salesSummary.rows[0].total_revenue
                    ),

                total_products:
                    Number(
                        productsSummary.rows[0].total_products
                    ),

                total_managers:
                    Number(
                        managerSummary.rows[0].total_managers
                    ),

                active_managers:
                    Number(
                        managerSummary.rows[0].active_managers
                    ),

                inactive_managers:
                    Number(
                        managerSummary.rows[0].inactive_managers
                    )
            },

            top_managers:
                topManagers.rows,

            recent_transactions:
                recentTransactions.rows,

            sales_chart:
                salesChart.rows

        });

    } catch (error) {

        console.error(
            'Director dashboard error:',
            error
        );

        res.status(500).json({

            success: false,

            message:
                'Failed to load director dashboard'

        });

    }
};


module.exports = {
    getDirectorDashboard
};