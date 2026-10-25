const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const createBusiness = async (req, res) => {
    const body = req.body || {};

    const businessName =
        typeof body.businessName === 'string'
            ? body.businessName.trim()
            : '';

    const businessAddress =
        typeof body.businessAddress === 'string'
            ? body.businessAddress.trim()
            : '';

    const directorFullName =
        typeof body.directorFullName === 'string'
            ? body.directorFullName.trim()
            : '';

    const directorUsername =
        typeof body.directorUsername === 'string'
            ? body.directorUsername.trim()
            : '';

    const directorEmail =
        typeof body.directorEmail === 'string'
            ? body.directorEmail.trim().toLowerCase()
            : '';

    // Do not trim passwords: spaces can be intentional.
    const directorPassword = body.directorPassword;

    if (
        !businessName ||
        businessName.length > 150 ||
        businessAddress.length > 5000 ||
        !directorFullName ||
        directorFullName.length > 100 ||
        !directorUsername ||
        directorUsername.length > 50 ||
        !directorEmail ||
        directorEmail.length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(directorEmail) ||
        typeof directorPassword !== 'string' ||
        directorPassword.length < 8 ||
        directorPassword.length > 128
    ) {
        return res.status(400).json({
            success: false,
            message: 'Invalid business or director details. Check all fields and ensure the password is 8–128 characters.'
        });
    }

    let passwordHash;

    try {
        passwordHash = await bcrypt.hash(directorPassword, 12);
    } catch (error) {
        console.error('Director password hashing failed:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to prepare the director account.'
        });
    }

    let client;
    let transactionStarted = false;

    try {
        client = await pool.connect();

        await client.query('BEGIN');
        transactionStarted = true;

        // Create the business first.
        const businessResult = await client.query(
            `INSERT INTO businesses (name, address)
             VALUES ($1, $2)
             RETURNING id, name, address, logo_url, created_at`,
            [businessName, businessAddress || null]
        );

        const business = businessResult.rows[0];

        // The server assigns the new business ID.
        // The client cannot choose another business's ID.
        const directorResult = await client.query(
            `INSERT INTO users
                (full_name, username, email, password_hash, role,
                 is_active, business_id, is_platform_admin)
             VALUES ($1, $2, $3, $4, 'director', TRUE, $5, FALSE)
             RETURNING id, full_name, username, email, role, business_id`,
            [
                directorFullName,
                directorUsername,
                directorEmail,
                passwordHash,
                business.id
            ]
        );

        const director = directorResult.rows[0];

        await client.query('COMMIT');
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: 'Business and director account created successfully.',
            business,
            director
        });
    } catch (error) {
        if (client && transactionStarted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error(
                    'Business onboarding rollback failed:',
                    rollbackError.message
                );
            }
        }

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'That director username or email is already registered.'
            });
        }

        console.error('Business onboarding failed:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to create the business and director account.'
        });
    } finally {
        if (client) {
            client.release();
        }
    }
};

module.exports = {
    createBusiness
};
