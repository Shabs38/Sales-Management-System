const pool = require('../config/db');

// Get the business associated with the authenticated user.
function getBusinessId(req) {
    const id = Number(req.session?.user?.business_id);

    return Number.isInteger(id) && id > 0 ? id : null;
}

// ========================================
// DIRECTOR DASHBOARD
// ========================================

const getDirectorDashboard = async (req, res) => {
    const businessId = getBusinessId(req);

    if (!businessId) {
        return res.status(403).json({
            success: false,
            message: 'A valid business is required'
        });
    }

    try {
        // 1. Total revenue and sales for this business.
        const salesSummary = await pool.query(`
            SELECT
                COUNT(*) AS total_sales,
                COALESCE(SUM(total_amount), 0) AS total_revenue
            FROM sales
            WHERE business_id = $1
        `, [businessId]);

        // 2. Active products for this business.
        const productsSummary = await pool.query(`
            SELECT COUNT(*) AS total_products
            FROM products
            WHERE business_id = $1
              AND is_active = true
        `, [businessId]);

        // 3. Manager statistics for this business.
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
            WHERE business_id = $1
              AND role = 'manager'
        `, [businessId]);

        // 4. Top managers belonging to this business.
        const topManagers = await pool.query(`
            SELECT
                u.id,
                u.full_name,
                COUNT(s.id) AS total_sales,
                COALESCE(SUM(s.total_amount), 0) AS total_revenue
            FROM users u
            LEFT JOIN sales s
                ON s.user_id = u.id
               AND s.business_id = u.business_id
            WHERE u.business_id = $1
              AND u.role = 'manager'
            GROUP BY u.id, u.full_name
            ORDER BY total_revenue DESC
            LIMIT 5
        `, [businessId]);

        // 5. Recent transactions for this business.
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
               AND c.business_id = s.business_id
            LEFT JOIN users u
                ON u.id = s.user_id
               AND u.business_id = s.business_id
            WHERE s.business_id = $1
            ORDER BY s.created_at DESC
            LIMIT 10
        `, [businessId]);

        // 6. Sales chart for this business.
        const period = req.query.period || 'monthly';

        let salesChart;

        if (period === 'weekly') {
            salesChart = await pool.query(`
                SELECT
                    DATE(created_at) AS sale_date,
                    COUNT(*) AS total_sales,
                    COALESCE(SUM(total_amount), 0) AS total_revenue
                FROM sales
                WHERE business_id = $1
                  AND created_at >=
                      CURRENT_TIMESTAMP - INTERVAL '7 days'
                GROUP BY DATE(created_at)
                ORDER BY sale_date ASC
            `, [businessId]);
        } else {
            salesChart = await pool.query(`
                SELECT
                    DATE_TRUNC('month', created_at) AS sale_date,
                    COUNT(*) AS total_sales,
                    COALESCE(SUM(total_amount), 0) AS total_revenue
                FROM sales
                WHERE business_id = $1
                  AND created_at >=
                      CURRENT_TIMESTAMP - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY sale_date ASC
            `, [businessId]);
        }

        // Response structure remains compatible with the dashboard.
        res.status(200).json({
            success: true,

            summary: {
                total_sales:
                    Number(salesSummary.rows[0].total_sales),

                total_revenue:
                    Number(salesSummary.rows[0].total_revenue),

                total_products:
                    Number(productsSummary.rows[0].total_products),

                total_managers:
                    Number(managerSummary.rows[0].total_managers),

                active_managers:
                    Number(managerSummary.rows[0].active_managers),

                inactive_managers:
                    Number(managerSummary.rows[0].inactive_managers)
            },

            top_managers: topManagers.rows,
            recent_transactions: recentTransactions.rows,
            sales_chart: salesChart.rows
        });

    } catch (error) {
        console.error('Director dashboard error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to load director dashboard'
        });
    }
};

module.exports = {
    getDirectorDashboard
};
