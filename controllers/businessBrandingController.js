const cloudinary = require("../config/cloudinary");
const pool = require("../config/db");

function getBusinessId(req) {
    const id = Number(req.session?.user?.business_id);

    return Number.isInteger(id) && id > 0 ? id : null;
}

// GET branding for the logged-in user's business
async function getBusinessBranding(req, res) {
    const businessId = getBusinessId(req);

    if (!businessId || req.session.user.is_platform_admin) {
        return res.status(403).json({
            success: false,
            message: "A valid business membership is required."
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, name, address, logo_url, preferences
             FROM businesses
             WHERE id = $1`,
            [businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Business not found."
            });
        }

        const business = result.rows[0];
        const branding = business.preferences?.branding || {};

        return res.json({
            success: true,
            branding: {
                name: business.name || "",
                address: business.address || "",
                logoUrl: business.logo_url || "",
                phone: branding.phone || "",
                email: branding.email || ""
            }
        });
    } catch (error) {
        console.error("Get business branding error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load business branding."
        });
    }
}

// Update only the logged-in user's business
async function updateBusinessBranding(req, res) {
    const businessId = getBusinessId(req);

    if (!businessId || req.session.user.is_platform_admin) {
        return res.status(403).json({
            success: false,
            message: "A valid business membership is required."
        });
    }

    const name = typeof req.body.name === "string"
        ? req.body.name.trim()
        : "";

    const address = typeof req.body.address === "string"
        ? req.body.address.trim()
        : "";

    const logoUrl = typeof req.body.logoUrl === "string"
        ? req.body.logoUrl.trim()
        : "";

    const phone = typeof req.body.phone === "string"
        ? req.body.phone.trim()
        : "";

    const email = typeof req.body.email === "string"
        ? req.body.email.trim()
        : "";

    if (!name || name.length > 150) {
        return res.status(400).json({
            success: false,
            message: "Business name is required and must not exceed 150 characters."
        });
    }

    if (
        address.length > 2000 ||
        phone.length > 50 ||
        email.length > 254 ||
        logoUrl.length > 2000
    ) {
        return res.status(400).json({
            success: false,
            message: "One or more branding fields are too long."
        });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid business email address."
        });
    }

    // Use a hosted HTTPS image URL, not a local server upload.
    if (
        logoUrl &&
        !/^https:\/\/\S+$/i.test(logoUrl)
    ) {
        return res.status(400).json({
            success: false,
            message: "The logo must use an HTTPS image URL."
        });
    }

    try {
        const result = await pool.query(
            `UPDATE businesses
             SET name = $1,
                 address = $2,
                 logo_url = $3,
                 preferences = jsonb_set(
                     COALESCE(preferences, '{}'::jsonb),
                     '{branding}',
                     COALESCE(preferences->'branding', '{}'::jsonb)
                     || jsonb_build_object(
                         'phone', $4::text,
                         'email', $5::text
                     ),
                     true
                 ),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING id`,
            [name, address, logoUrl || null, phone, email, businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Business not found."
            });
        }

        return res.json({
            success: true,
            message: "Business branding saved successfully."
        });
    } catch (error) {
        console.error("Update business branding error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to save business branding."
        });
    }
}


// Upload a logo for the authenticated business.
async function uploadBusinessLogo(req, res) {
    const businessId = getBusinessId(req);

    if (!businessId || req.session.user.is_platform_admin) {
        return res.status(403).json({
            success: false,
            message: "A valid business membership is required."
        });
    }

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Please select a logo image."
        });
    }

    try {
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: `sales-management/business-logos/business-${businessId}`,
                    resource_type: "image"
                },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }

                    resolve(result);
                }
            );

            stream.end(req.file.buffer);
        });

        const result = await pool.query(
            `UPDATE businesses
             SET logo_url = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, logo_url`,
            [uploadResult.secure_url, businessId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Business not found."
            });
        }

        return res.json({
            success: true,
            message: "Business logo uploaded successfully.",
            logoUrl: result.rows[0].logo_url
        });
    } catch (error) {
        console.error("Business logo upload error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to upload the business logo."
        });
    }
}

module.exports = {
    getBusinessBranding,
    updateBusinessBranding,
    uploadBusinessLogo
};
