const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function createManager() {
    try {

        const fullName = "Sales Manager";
        const username = "manager";
        const email = "manager@gmail.com";
        const password = "Manager@123";

        /* Hash password */
        const passwordHash = await bcrypt.hash(
            password,
            12
        );

        /* Insert Manager */
        const query = `
            INSERT INTO users (
                full_name,
                username,
                email,
                password_hash,
                role
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                'manager'
            )
            RETURNING
                id,
                full_name,
                username,
                email,
                role;
        `;

        const values = [
            fullName,
            username,
            email,
            passwordHash
        ];

        const result = await pool.query(
            query,
            values
        );

        console.log(
            "Manager account created successfully!"
        );

        console.log(result.rows[0]);

    } catch (error) {

        console.error(
            "Failed to create Manager:",
            error.message
        );

    } finally {

        await pool.end();
    }
}

createManager();