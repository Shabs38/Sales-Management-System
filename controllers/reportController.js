const pool = require('../config/db');

const getReports = async (req, res) => {

    try {

        const user = req.session.user;

        const {
            from,
            to,
            status,
            payment,
            search,
            period = 'weekly'
        } = req.query;


        // =========================================
        // BUILD FILTERS
        // =========================================

        const conditions = [];
        const values = [];

        let parameterIndex = 1;


        // DATE FROM
        if (from) {

            conditions.push(
                `s.created_at >= $${parameterIndex}::date`
            );

            values.push(from);

            parameterIndex++;

        }


        // DATE TO
        if (to) {

            conditions.push(
                `s.created_at < ($${parameterIndex}::date + INTERVAL '1 day')`
            );

            values.push(to);

            parameterIndex++;

        }


        // PAYMENT STATUS
        if (
            status &&
            status !== 'all'
        ) {

            conditions.push(
                `s.payment_status = $${parameterIndex}`
            );

            values.push(status);

            parameterIndex++;

        }


        // PAYMENT METHOD
        if (
            payment &&
            payment !== 'all'
        ) {

            conditions.push(
                `s.payment_method = $${parameterIndex}`
            );

            values.push(payment);

            parameterIndex++;

        }


        // SEARCH
        if (search) {

            conditions.push(`
                (
                    s.sale_reference ILIKE $${parameterIndex}
                    OR c.full_name ILIKE $${parameterIndex}
                    OR u.full_name ILIKE $${parameterIndex}
                )
            `);

            values.push(`%${search}%`);

            parameterIndex++;

        }


        // MANAGER ONLY SEES THEIR OWN SALES
        if (user.role === 'manager') {

            conditions.push(
                `s.user_id = $${parameterIndex}`
            );

            values.push(user.id);

            parameterIndex++;

        }


        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(' AND ')}`
                : '';


        // =========================================
        // SUMMARY
        // =========================================

        const summaryResult = await pool.query(
            `
            SELECT

                COUNT(*) AS total_sales,

                COALESCE(
                    SUM(s.total_amount),
                    0
                ) AS total_revenue,

                COALESCE(
                    (
                        SELECT SUM(si.quantity)
                        FROM sale_items si
                        WHERE si.sale_id IN (
                            SELECT s2.id
                            FROM sales s2
                            LEFT JOIN customers c2
                                ON c2.id = s2.customer_id
                            LEFT JOIN users u2
                                ON u2.id = s2.user_id
                            ${whereClause.replaceAll(
                                's.',
                                's2.'
                            ).replaceAll(
                                'c.',
                                'c2.'
                            ).replaceAll(
                                'u.',
                                'u2.'
                            )}
                        )
                    ),
                    0
                ) AS products_sold,

                COUNT(
                    DISTINCT s.customer_id
                ) AS customers_served

            FROM sales s

            LEFT JOIN customers c
                ON c.id = s.customer_id

            LEFT JOIN users u
                ON u.id = s.user_id

            ${whereClause}
            `,
            values
        );


        // =========================================
        // PAYMENT METHODS
        // =========================================

        const paymentResult = await pool.query(
            `
            SELECT

                s.payment_method,

                COUNT(*) AS total_sales,

                COALESCE(
                    SUM(s.total_amount),
                    0
                ) AS total_revenue

            FROM sales s

            LEFT JOIN customers c
                ON c.id = s.customer_id

            LEFT JOIN users u
                ON u.id = s.user_id

            ${whereClause}

            GROUP BY s.payment_method

            ORDER BY total_revenue DESC
            `,
            values
        );


        // =========================================
        // TOP PRODUCTS
        // =========================================

        const productsResult = await pool.query(
            `
            SELECT

                p.id,

                p.product_name,

                COALESCE(
                    SUM(si.quantity),
                    0
                ) AS quantity_sold,

                COALESCE(
                    SUM(si.total_price),
                    0
                ) AS revenue

            FROM sale_items si

            INNER JOIN sales s
                ON s.id = si.sale_id

            INNER JOIN products p
                ON p.id = si.product_id

            LEFT JOIN customers c
                ON c.id = s.customer_id

            LEFT JOIN users u
                ON u.id = s.user_id

            ${whereClause}

            GROUP BY
                p.id,
                p.product_name

            ORDER BY
                quantity_sold DESC

            LIMIT 10
            `,
            values
        );


        // =========================================
        // SALES OVER TIME
        // =========================================

  const selectedPeriod =
    period === 'monthly' ? 'month' : 'week';

const salesOverTimeResult = await pool.query(
    `
    SELECT
        DATE_TRUNC(
            $${parameterIndex}::text,
            s.created_at
        ) AS sale_date,

        COUNT(*) AS total_sales,

        COALESCE(
            SUM(s.total_amount),
            0
        ) AS total_revenue

    FROM sales s

    LEFT JOIN customers c
        ON c.id = s.customer_id

    LEFT JOIN users u
        ON u.id = s.user_id

    ${whereClause}

    GROUP BY
        DATE_TRUNC(
            $${parameterIndex}::text,
            s.created_at
        )

    ORDER BY
        sale_date ASC
    `,
    [
        ...values,
        selectedPeriod
    ]
);


        // =========================================
        // TRANSACTIONS
        // =========================================

        const transactionsResult = await pool.query(
            `
            SELECT

                s.id,

                s.sale_reference,

                s.customer_id,

                c.full_name AS customer_name,

                u.full_name AS salesperson_name,

                s.total_amount,

                s.payment_method,

                s.payment_status,

                s.created_at

            FROM sales s

            LEFT JOIN customers c
                ON c.id = s.customer_id

            LEFT JOIN users u
                ON u.id = s.user_id

            ${whereClause}

            ORDER BY
                s.created_at DESC

            LIMIT 100
            `,
            values
        );


        // =========================================
        // RESPONSE
        // =========================================

        const summary =
            summaryResult.rows[0];


        res.status(200).json({

            success: true,

            filters: {
                from: from || null,
                to: to || null,
                status: status || 'all',
                payment: payment || 'all',
                search: search || '',
                 period: period === 'monthly'
        ? 'monthly'
        : 'weekly'
            },

            summary: {

                total_sales:
                    Number(
                        summary.total_sales
                    ),

                total_revenue:
                    Number(
                        summary.total_revenue
                    ),

                products_sold:
                    Number(
                        summary.products_sold
                    ),

                customers_served:
                    Number(
                        summary.customers_served
                    )

            },

            payment_methods:
                paymentResult.rows,

            top_products:
                productsResult.rows,

            sales_over_time:
                salesOverTimeResult.rows,

            transactions:
                transactionsResult.rows

        });

    } catch (error) {

        console.error(
            'Reports error:',
            error
        );

        res.status(500).json({

            success: false,

            message:
                'Failed to generate reports'

        });

    }

};


module.exports = {
    getReports
};