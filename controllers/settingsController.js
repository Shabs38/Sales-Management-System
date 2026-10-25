const pool = require("../config/db");

function getBusinessId(req) {
    const id = Number(req.session?.user?.business_id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function readBoolean(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
}

// GET SETTINGS
async function getSettings(req, res) {
    try {
        const userId = req.session?.user?.id;
        const businessId = getBusinessId(req);

        if (!userId || !businessId || req.session?.user?.is_platform_admin) {
            return res.status(403).json({
                success: false,
                message: "A valid business membership is required."
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

        await pool.query(
            `INSERT INTO user_settings (user_id)
             VALUES ($1)
             ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );

        const result = await pool.query(
            `SELECT theme, language
             FROM user_settings
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Settings not found."
            });
        }

        const preferences = businessResult.rows[0].preferences || {};
        const saved = preferences.notifications || {};
        const personal = result.rows[0];

        return res.json({
            success: true,
            settings: {
                notifications: readBoolean(saved.enabled, true),
                emailNotifications: readBoolean(saved.emailNotifications, false),
                lowStockAlerts: readBoolean(saved.lowStockAlerts, true),
                saleAlerts: readBoolean(saved.saleAlerts, true),
                theme: personal.theme,
                language: personal.language
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
    const client = await pool.connect();

    try {
        const userId = req.session?.user?.id;
        const businessId = getBusinessId(req);

        if (!userId || !businessId || req.session?.user?.is_platform_admin) {
            return res.status(403).json({
                success: false,
                message: "A valid business membership is required."
            });
        }

        const {
            notifications,
            emailNotifications,
            lowStockAlerts,
            saleAlerts,
            theme,
            language
        } = req.body || {};

        if (!["light", "dark"].includes(theme)) {
            return res.status(400).json({
                success: false,
                message: "Invalid theme selected."
            });
        }

        if (!["English"].includes(language)) {
            return res.status(400).json({
                success: false,
                message: "Invalid language selected."
            });
        }

        const preferences = {
            enabled: readBoolean(notifications, true),
            emailNotifications: readBoolean(emailNotifications, false),
            lowStockAlerts: readBoolean(lowStockAlerts, true),
            saleAlerts: readBoolean(saleAlerts, true)
        };

        await client.query("BEGIN");

        const businessResult = await client.query(
            `UPDATE businesses
             SET preferences =
                 COALESCE(preferences, '{}'::jsonb)
                 || jsonb_build_object('notifications', $2::jsonb),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id`,
            [businessId, JSON.stringify(preferences)]
        );

        if (businessResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(403).json({
                success: false,
                message: "Business not found."
            });
        }

        await client.query(
            `INSERT INTO user_settings (user_id, theme, language, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id)
             DO UPDATE SET
                 theme = EXCLUDED.theme,
                 language = EXCLUDED.language,
                 updated_at = CURRENT_TIMESTAMP`,
            [userId, theme, language]
        );

        await client.query("COMMIT");

        return res.json({
            success: true,
            message: "Settings updated successfully.",
            settings: {
                notifications: preferences.enabled,
                emailNotifications: preferences.emailNotifications,
                lowStockAlerts: preferences.lowStockAlerts,
                saleAlerts: preferences.saleAlerts,
                theme,
                language
            }
        });
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Settings rollback error:", rollbackError);
        }

        console.error("Update settings error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update settings."
        });
    } finally {
        client.release();
    }
}

module.exports = {
    getSettings,
    updateSettings
};
