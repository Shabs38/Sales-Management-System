const pool = require("../config/db");

// GET SETTINGS
async function getSettings(req, res) {
    try {
        const userId = req.session.user.id;

        // Create default settings if this user does not have one
        await pool.query(
            `
            INSERT INTO user_settings (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO NOTHING
            `,
            [userId]
        );

        const result = await pool.query(
            `
            SELECT
                notifications,
                email_notifications,
                low_stock_alerts,
                sale_alerts,
                theme,
                language
            FROM user_settings
            WHERE user_id = $1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Settings not found."
            });
        }

        return res.json({
            success: true,
            settings: {
                notifications: result.rows[0].notifications,
                emailNotifications:
                    result.rows[0].email_notifications,
                lowStockAlerts:
                    result.rows[0].low_stock_alerts,
                saleAlerts:
                    result.rows[0].sale_alerts,
                theme: result.rows[0].theme,
                language: result.rows[0].language
            }
        });

    } catch (error) {
        console.error("Get settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load settings."
        });
    }
}


// UPDATE SETTINGS
async function updateSettings(req, res) {
    try {
        const userId = req.session.user.id;

        const {
            notifications,
            emailNotifications,
            lowStockAlerts,
            saleAlerts,
            theme,
            language
        } = req.body;

        const allowedThemes = ["light", "dark"];
        const allowedLanguages = ["English"];

        if (!allowedThemes.includes(theme)) {
            return res.status(400).json({
                success: false,
                message: "Invalid theme selected."
            });
        }

        if (!allowedLanguages.includes(language)) {
            return res.status(400).json({
                success: false,
                message: "Invalid language selected."
            });
        }

        const result = await pool.query(
            `
            INSERT INTO user_settings (
                user_id,
                notifications,
                email_notifications,
                low_stock_alerts,
                sale_alerts,
                theme,
                language,
                updated_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (user_id)
            DO UPDATE SET
                notifications = EXCLUDED.notifications,
                email_notifications =
                    EXCLUDED.email_notifications,
                low_stock_alerts =
                    EXCLUDED.low_stock_alerts,
                sale_alerts =
                    EXCLUDED.sale_alerts,
                theme = EXCLUDED.theme,
                language = EXCLUDED.language,
                updated_at = CURRENT_TIMESTAMP
            RETURNING
                notifications,
                email_notifications,
                low_stock_alerts,
                sale_alerts,
                theme,
                language
            `,
            [
                userId,
                Boolean(notifications),
                Boolean(emailNotifications),
                Boolean(lowStockAlerts),
                Boolean(saleAlerts),
                theme,
                language
            ]
        );

        const settings = result.rows[0];

        return res.json({
            success: true,
            message: "Settings updated successfully.",
            settings: {
                notifications: settings.notifications,
                emailNotifications:
                    settings.email_notifications,
                lowStockAlerts:
                    settings.low_stock_alerts,
                saleAlerts:
                    settings.sale_alerts,
                theme: settings.theme,
                language: settings.language
            }
        });

    } catch (error) {
        console.error("Update settings error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update settings."
        });
    }
}


module.exports = {
    getSettings,
    updateSettings
};