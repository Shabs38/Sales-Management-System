const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
// =====================================
// GET MY PROFILE
// =====================================

async function getMyProfile(req, res) {
    try {

        const userId = req.session.user.id;

        const result = await pool.query(
            `
            SELECT
                id,
                full_name,
                username,
                email,
                role,
                is_active,
		profile_image,
                created_at
            FROM users
            WHERE id = $1
            `,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User profile not found."
            });
        }

        return res.json({
            success: true,
            profile: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Get profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load profile."
        });
    }
}


// =====================================
// UPDATE MY PROFILE
// =====================================

async function updateMyProfile(req, res) {

    try {

        const userId =
            req.session.user.id;

        const {
            full_name,
            username,
            email
        } = req.body;

        if (
            !full_name ||
            !username ||
            !email
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name, username and email are required."
            });
        }

        const cleanName =
            full_name.trim();

        const cleanUsername =
            username.trim();

        const cleanEmail =
            email.trim().toLowerCase();

        if (
            cleanName.length < 2
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name must contain at least 2 characters."
            });
        }

        if (
            cleanUsername.length < 3
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Username must contain at least 3 characters."
            });
        }

        // ---------------------------------
        // CHECK USERNAME / EMAIL
        // ---------------------------------

        const duplicate =
            await pool.query(
                `
                SELECT id
                FROM users
                WHERE
                    (username = $1 OR email = $2)
                    AND id != $3
                LIMIT 1
                `,
                [
                    cleanUsername,
                    cleanEmail,
                    userId
                ]
            );

        if (duplicate.rows.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "Username or email is already in use."
            });
        }

        // ---------------------------------
        // UPDATE PROFILE
        // ---------------------------------

        const result =
            await pool.query(
                `
                UPDATE users
                SET
                    full_name = $1,
                    username = $2,
                    email = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING
                    id,
                    full_name,
                    username,
                    email,
                    role,
                    is_active,
		   profile_image,
                    created_at
                `,
                [
                    cleanName,
                    cleanUsername,
                    cleanEmail,
                    userId
                ]
            );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "User profile not found."
            });
        }

        // ---------------------------------
        // UPDATE SESSION
        // ---------------------------------

        req.session.user.full_name =
            result.rows[0].full_name;

        req.session.user.username =
            result.rows[0].username;

        req.session.user.email =
            result.rows[0].email;

        return res.json({
            success: true,
            message:
                "Profile updated successfully.",
            profile: result.rows[0]
        });

    } catch (error) {

        console.error(
            "Update profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update profile."
        });
    }
}


// =====================================
// CHANGE MY PASSWORD
// =====================================

async function changeMyPassword(req, res) {

    try {

        const userId =
            req.session.user.id;

        const {
            currentPassword,
            newPassword
        } = req.body;

        if (
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password and new password are required."
            });
        }

        if (
            newPassword.length < 6
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must contain at least 6 characters."
            });
        }

        // ---------------------------------
        // GET CURRENT PASSWORD
        // ---------------------------------

        const result =
            await pool.query(
                `
                SELECT password_hash
                FROM users
                WHERE id = $1
                `,
                [userId]
            );

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "User account not found."
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                currentPassword,
                result.rows[0].password_hash
            );

        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message:
                    "Current password is incorrect."
            });
        }

        // ---------------------------------
        // HASH NEW PASSWORD
        // ---------------------------------

        const newPasswordHash =
            await bcrypt.hash(
                newPassword,
                12
            );

        // ---------------------------------
        // UPDATE PASSWORD
        // ---------------------------------

        await pool.query(
            `
            UPDATE users
            SET
                password_hash = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            `,
            [
                newPasswordHash,
                userId
            ]
        );

        return res.json({
            success: true,
            message:
                "Password changed successfully."
        });

    } catch (error) {

        console.error(
            "Change password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to change password."
        });
   }
}

	async function uploadProfileImage(req, res) {
    try {
        const userId = req.session.user.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select an image."
            });
        }

       const base64Image = req.file.buffer.toString("base64");

const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: "sales-management/profile-images",
    resource_type: "image"
});
        const result = await pool.query(
            `
            UPDATE users
            SET
                profile_image = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING
                id,
                full_name,
                username,
                email,
                role,
                is_active,
                profile_image,
                created_at
            `,
            [
                uploadResult.secure_url,
                userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User profile not found."
            });
        }

        return res.json({
            success: true,
            message: "Profile image uploaded successfully.",
            profile: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Profile image upload error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to upload profile image."
        });
    }
}

module.exports = {
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
    uploadProfileImage
};
