const pool = require('../config/db');

const getManagerDashboard = async (req, res) => {
    try {
        const managerId = req.session.user.id;

        // Today's sales and revenue
        const todaySummary = await pool.query(`
            SELECT
                COUNT(*) AS total_sales,
                COALESCE(SUM(total_amount), 0) AS total_revenue
            FROM sales
            WHERE user_id = $1
            AND created_at >= CURRENT_DATE
        `, [managerId]);
        
        
    // Yesterday's sales and revenue
const yesterdaySummary = await pool.query(`
    SELECT
        COUNT(*) AS total_sales,
        COALESCE(SUM(total_amount), 0) AS total_revenue
    FROM sales
    WHERE user_id = $1
    AND created_at >= CURRENT_DATE - INTERVAL '1 day'
    AND created_at < CURRENT_DATE
`, [managerId]);


// Today's customers
const todayCustomers = await pool.query(`
    SELECT
        COUNT(DISTINCT customer_id) AS total_customers
    FROM sales
    WHERE user_id = $1
    AND created_at >= CURRENT_DATE
`, [managerId]);   
        
        
        // Yesterday's customers
const yesterdayCustomers = await pool.query(`
    SELECT
        COUNT(DISTINCT customer_id) AS total_customers
    FROM sales
    WHERE user_id = $1
    AND created_at >= CURRENT_DATE - INTERVAL '1 day'
    AND created_at < CURRENT_DATE
`, [managerId]);

        // Products sold today
        const productsSold = await pool.query(`
            SELECT
                COALESCE(SUM(si.quantity), 0) AS products_sold
            FROM sale_items si
            INNER JOIN sales s
                ON s.id = si.sale_id
            WHERE s.user_id = $1
            AND s.created_at >= CURRENT_DATE
        `, [managerId]);

        // Customers handled by this manager
        const customers = await pool.query(`
            SELECT COUNT(DISTINCT customer_id) AS total_customers
            FROM sales
            WHERE user_id = $1
        `, [managerId]);

        // Top-selling products
        const topProducts = await pool.query(`
            SELECT
                p.id,
                p.product_name,
                COALESCE(SUM(si.quantity), 0) AS quantity_sold,
                COALESCE(SUM(si.total_price), 0) AS total_revenue
            FROM sale_items si
            INNER JOIN sales s
                ON s.id = si.sale_id
            INNER JOIN products p
                ON p.id = si.product_id
            WHERE s.user_id = $1
            GROUP BY p.id, p.product_name
            ORDER BY quantity_sold DESC
            LIMIT 5
        `, [managerId]);

        // Recent sales
        const recentSales = await pool.query(`
            SELECT
                s.id,
                s.sale_reference,
                s.total_amount,
                s.payment_status,
                s.created_at,
                c.full_name AS customer_name,
                u.full_name AS manager_name
            FROM sales s
            LEFT JOIN customers c
                ON c.id = s.customer_id
            LEFT JOIN users u
                ON u.id = s.user_id
            WHERE s.user_id = $1
            ORDER BY s.created_at DESC
            LIMIT 10
        `, [managerId]);


/* =========================================
   SALES CHART
========================================= */

const period = req.query.period || 'weekly';

let salesChart;

if (period === 'monthly') {

    salesChart = await pool.query(`
        SELECT
            DATE_TRUNC(
                'month',
                created_at
            ) AS sale_date,

            COUNT(*) AS total_sales,

            COALESCE(
                SUM(total_amount),
                0
            ) AS total_revenue

        FROM sales

        WHERE user_id = $1

        AND created_at >=
            CURRENT_TIMESTAMP - INTERVAL '12 months'

        GROUP BY
            DATE_TRUNC(
                'month',
                created_at
            )

        ORDER BY sale_date ASC
    `, [managerId]);

} else {

    salesChart = await pool.query(`
        SELECT
            DATE(created_at) AS sale_date,

            COUNT(*) AS total_sales,

            COALESCE(
                SUM(total_amount),
                0
            ) AS total_revenue

        FROM sales

        WHERE user_id = $1

        AND created_at >=
            CURRENT_TIMESTAMP - INTERVAL '7 days'

        GROUP BY DATE(created_at)

        ORDER BY sale_date ASC
    `, [managerId]);

}

// Calculate percentage change


const todaySales =
    Number(todaySummary.rows[0].total_sales);


const yesterdaySales =
    Number(yesterdaySummary.rows[0].total_sales);


const todayRevenue =
    Number(todaySummary.rows[0].total_revenue);
    

const yesterdayRevenue =
    Number(yesterdaySummary.rows[0].total_revenue);


const salesGrowth =
    yesterdaySales === 0
        ? (todaySales > 0 ? 100 : 0)
        : ((todaySales - yesterdaySales) /
            yesterdaySales) * 100;


const revenueGrowth =
    yesterdayRevenue === 0
        ? (todayRevenue > 0 ? 100 : 0)
        : ((todayRevenue - yesterdayRevenue) /
            yesterdayRevenue) * 100;
          
            
const todayCustomerCount =
    Number(
        todayCustomers.rows[0].total_customers
    );
    

const yesterdayCustomerCount =
    Number(
        yesterdayCustomers.rows[0].total_customers
    );
    

const customerGrowth =
    yesterdayCustomerCount === 0
        ? (todayCustomerCount > 0 ? 100 : 0)
        : ((todayCustomerCount - yesterdayCustomerCount) /
            yesterdayCustomerCount) * 100;
            
            
                        
        res.status(200).json({
            success: true,

            summary: {

    total_sales: todaySales,

    total_revenue: todayRevenue,

    products_sold: Number(
        productsSold.rows[0].products_sold
    ),

    total_customers: Number(
        todayCustomers.rows[0].total_customers
    ),

    sales_growth: Number(
        salesGrowth.toFixed(1)
    ),

    revenue_growth: Number(
        revenueGrowth.toFixed(1)
    ),
    
    customer_growth: Number(
    customerGrowth.toFixed(1)
)


},

            top_products: topProducts.rows,

            recent_sales: recentSales.rows,
            
            sales_chart: salesChart.rows
            
        });

    } catch (error) {

        console.error(
            'Manager dashboard error:',
            error
        );

        res.status(500).json({
            success: false,
            message: 'Failed to load manager dashboard'
        });
    }
};

module.exports = {
    getManagerDashboard
};