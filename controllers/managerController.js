const bcrypt = require('bcryptjs');
const pool = require('../config/db');


// BUSINESS IDENTITY

function getBusinessId(req) {
    const id = Number(req.session?.user?.business_id);

    return Number.isInteger(id) && id > 0 ? id : null;
}


// ========================================
// GET ALL MANAGERS
// ========================================

const getManagers = async (req, res) => {
    const businessId = getBusinessId(req);
    if (!businessId) {
        return res.status(403).json({
            success: false,
            message: 'A valid business is required'
        });
    }

    try {

        const result = await pool.query(`
            SELECT
                id,
                full_name,
                username,
                email,
                role,
                is_active,
                created_at,
                updated_at
            FROM users
            WHERE role = 'manager'
              AND business_id = $1
            ORDER BY id DESC
        `, [businessId]);

        res.status(200).json({
            success: true,
            managers: result.rows
        });

    } catch (error) {

        console.error('Error fetching managers:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch managers'
        });
    }
};


// ========================================
// GET ONE MANAGER
// ========================================

const getManagerById = async (req, res) => {
    const businessId = getBusinessId(req);
    if (!businessId) {
        return res.status(403).json({
            success: false,
            message: 'A valid business is required'
        });
    }

    try {

        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                id,
                full_name,
                username,
                email,
                role,
                is_active,
                created_at,
                updated_at
            FROM users
            WHERE id = $1
              AND role = 'manager'
              AND business_id = $2
        `, [id, businessId]);

        if (result.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }

        res.status(200).json({
            success: true,
            manager: result.rows[0]
        });

    } catch (error) {

        console.error('Error fetching manager:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch manager'
        });
    }
};


// ========================================
// CREATE MANAGER
// ========================================

const createManager = async (req, res) => {

    try {

        const businessId = getBusinessId(req);
        if (!businessId) {
            return res.status(403).json({
                success: false,
                message: 'A valid business is required'
            });
        }


        const {
            full_name,
            username,
            email,
            password
        } = req.body;


        // -----------------------------
        // Validation
        // -----------------------------

        if (!full_name || !username || !email || !password) {

            return res.status(400).json({
                success: false,
                message: 'Full name, username, email and password are required'
            });
        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }


        // -----------------------------
        // Check username
        // -----------------------------

        const usernameCheck = await pool.query(
            `SELECT id FROM users WHERE username = $1`,
            [username]
        );

        if (usernameCheck.rows.length > 0) {

            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }


        // -----------------------------
        // Check email
        // -----------------------------

        const emailCheck = await pool.query(
            `SELECT id FROM users WHERE email = $1`,
            [email]
        );

        if (emailCheck.rows.length > 0) {

            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }


        // -----------------------------
        // Hash password
        // -----------------------------

        const passwordHash = await bcrypt.hash(
            password,
            10
        );


        // -----------------------------
        // Create manager
        // -----------------------------

        const result = await pool.query(
            `INSERT INTO users
            (
                full_name,
                username,
                email,
                password_hash,
                role,
                is_active,
                business_id
            )
            VALUES ($1, $2, $3, $4, 'manager', true, $5)
            RETURNING
                id,
                full_name,
                username,
                email,
                role,
                is_active,
                created_at,
                updated_at`,
            [
                full_name,
                username,
                email,
                passwordHash,
                businessId
            ]
        );


        res.status(201).json({
            success: true,
            message: 'Manager account created successfully',
            manager: result.rows[0]
        });


    } catch (error) {

        console.error('Error creating manager:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to create manager'
        });
    }
};


// ========================================
// UPDATE MANAGER
// ========================================

const updateManager = async (req, res) => {

    try {

        const businessId = getBusinessId(req);
        if (!businessId) {
            return res.status(403).json({
                success: false,
                message: 'A valid business is required'
            });
        }

        const { id } = req.params;

        const {
            full_name,
            username,
            email
        } = req.body;


        if (!full_name || !username || !email) {

            return res.status(400).json({
                success: false,
                message: 'Full name, username and email are required'
            });
        }


        // Make sure manager exists

        const managerCheck = await pool.query(
            `SELECT id
             FROM users
             WHERE id = $1
             AND role = 'manager'
             AND business_id = $2`,
            [id, businessId]
        );

        if (managerCheck.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }


        // Check username belongs to another user

        const usernameCheck = await pool.query(
            `SELECT id
             FROM users
             WHERE username = $1
             AND id <> $2`,
            [username, id]
        );

        if (usernameCheck.rows.length > 0) {

            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        }


        // Check email belongs to another user

        const emailCheck = await pool.query(
            `SELECT id
             FROM users
             WHERE email = $1
             AND id <> $2`,
            [email, id]
        );

        if (emailCheck.rows.length > 0) {

            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }


        const result = await pool.query(
            `UPDATE users
             SET
                full_name = $1,
                username = $2,
                email = $3,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             AND role = 'manager'
             AND business_id = $5
             RETURNING
                id,
                full_name,
                username,
                email,
                role,
                is_active,
                created_at,
                updated_at`,
            [
                full_name,
                username,
                email,
                id,
                businessId
            ]
        );


        res.status(200).json({
            success: true,
            message: 'Manager updated successfully',
            manager: result.rows[0]
        });


    } catch (error) {

        console.error('Error updating manager:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to update manager'
        });
    }
};


// ========================================
// ACTIVATE / DEACTIVATE MANAGER
// ========================================

const toggleManagerStatus = async (req, res) => {

    try {

        const businessId = getBusinessId(req);
        if (!businessId) {
            return res.status(403).json({
                success: false,
                message: 'A valid business is required'
            });
        }

        const { id } = req.params;

        const managerResult = await pool.query(
            `SELECT id, is_active
             FROM users
             WHERE id = $1
             AND role = 'manager'
             AND business_id = $2`,
            [id, businessId]
        );


        if (managerResult.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }


        const currentStatus =
            managerResult.rows[0].is_active;


        const newStatus = !currentStatus;


        const result = await pool.query(
            `UPDATE users
             SET
                is_active = $1,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             AND role = 'manager'
             AND business_id = $3
             RETURNING
                id,
                full_name,
                username,
                email,
                role,
                is_active,
                updated_at`,
            [
                newStatus,
                id,
                businessId
            ]
        );


        res.status(200).json({
            success: true,
            message: newStatus
                ? 'Manager account activated'
                : 'Manager account deactivated',
            manager: result.rows[0]
        });


    } catch (error) {

        console.error(
            'Error changing manager status:',
            error
        );

        res.status(500).json({
            success: false,
            message: 'Failed to change manager status'
        });
    }
};


// ========================================
// CHANGE MANAGER PASSWORD
// ========================================

const changeManagerPassword = async (req, res) => {

    try {

        const businessId = getBusinessId(req);
        if (!businessId) {
            return res.status(403).json({
                success: false,
                message: 'A valid business is required'
            });
        }

        const { id } = req.params;

        const { password } = req.body;


        if (!password) {

            return res.status(400).json({
                success: false,
                message: 'New password is required'
            });
        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }


        const managerCheck = await pool.query(
            `SELECT id
             FROM users
             WHERE id = $1
             AND role = 'manager'
             AND business_id = $2`,
            [id, businessId]
        );


        if (managerCheck.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }


        const passwordHash = await bcrypt.hash(
            password,
            10
        );


        await pool.query(
            `UPDATE users
             SET
                password_hash = $1,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             AND role = 'manager'
             AND business_id = $3`,
            [
                passwordHash,
                id,
                businessId
            ]
        );


        res.status(200).json({
            success: true,
            message: 'Manager password updated successfully'
        });


    } catch (error) {

        console.error(
            'Error changing manager password:',
            error
        );

        res.status(500).json({
            success: false,
            message: 'Failed to change manager password'
        });
    }
};


module.exports = {
    getManagers,
    getManagerById,
    createManager,
    updateManager,
    toggleManagerStatus,
    changeManagerPassword
};
