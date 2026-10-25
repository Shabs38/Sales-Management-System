const pool = require("../config/db");

function readBoolean(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
}

const getManagerNotifications = async (req, res) => {
    try {
        const user = req.session?.user;
        const managerId = user?.id;
        const businessId = Number(user?.business_id);

        if (
            !managerId ||
            !Number.isInteger(businessId) ||
            businessId <= 0 ||
            user?.is_platform_admin
        ) {
            return res.status(403).json({
                success: false,
                message: "Business context is required."
            });
        }

        const businessResult = await pool.query(
            `SELECT preferences FROM businesses WHERE id = $1`,
            [businessId]
        );

        if (businessResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Business not found."
            });
        }

        const businessPreferences =
            businessResult.rows[0].preferences || {};

        const settings = businessPreferences.notifications || {};

        if (!readBoolean(settings.enabled, true)) {
            return res.json({
                success: true,
                count: 0,
                notifications: []
            });
        }

        const notifications = [];

        // Latest sale recorded by the logged-in user in this business.
        if (readBoolean(settings.saleAlerts, true)) {
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
                    AND c.business_id = s.business_id
                WHERE s.user_id = $1
                  AND s.business_id = $2
                ORDER BY s.created_at DESC
                LIMIT 1
            `, [managerId, businessId]);

            if (latestSale.rows.length > 0) {
                const sale = latestSale.rows[0];

                notifications.push({
                    type: "sale",
                    icon: "✓",
                    title: "New Sale Recorded",
                    message:
                        `Sale ${sale.sale_reference} recorded for ` +
                        `${sale.customer_name || "customer"}.`,
                    created_at: sale.created_at
                });
            }
        }

        // Low-stock alerts are limited to products in this business.
        if (readBoolean(settings.lowStockAlerts, true)) {
            const lowStock = await pool.query(`
                SELECT id, product_name, stock_quantity, low_stock_limit
                FROM products
                WHERE business_id = $1
                  AND is_active = true
                  AND stock_quantity <= low_stock_limit
                ORDER BY stock_quantity ASC
                LIMIT 10
            `, [businessId]);

            if (lowStock.rows.length > 0) {
                const count = lowStock.rows.length;

                notifications.push({
                    type: "stock",
                    icon: "!",
                    title: "Low Stock Alert",
                    message: count === 1
                        ? `${lowStock.rows[0].product_name} requires restocking.`
                        : `${count} products require restocking.`,
                    created_at: new Date()
                });
            }
        }

        notifications.sort(
            (a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
        );

        return res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        console.error("Notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load notifications."
        });
    }
};

module.exports = {
    getManagerNotifications
};
