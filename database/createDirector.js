const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function createDirector() {
    try {
        const fullName = 'System Director';
        const username = 'director';
        const email = 'director@gmail.com';
        const password = 'Director@123';

        const passwordHash = await bcrypt.hash(password, 12);

        const query = `
            INSERT INTO users
                (full_name, username, email, password_hash, role)
            VALUES
                ($1, $2, $3, $4, 'director')
            RETURNING id, full_name, username, email, role;
        `;

        const values = [
            fullName,
            username,
            email,
            passwordHash
        ];

        const result = await pool.query(query, values);

        console.log('Director account created successfully!');
        console.log(result.rows[0]);

    } catch (error) {
        console.error('Failed to create Director:', error.message);
    } finally {
        await pool.end();
    }
}

createDirector();