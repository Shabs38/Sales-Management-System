require('dotenv').config();

const readline = require('readline');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

function ask(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, answer => resolve(answer.trim()));
    });
}

function askHidden(question) {
    return new Promise((resolve, reject) => {
        const stdin = process.stdin;
        const stdout = process.stdout;

        if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
            return reject(
                new Error('Hidden password input requires an interactive terminal.')
            );
        }

        stdout.write(question);
        stdin.setRawMode(true);
        stdin.resume();

        let value = '';
        let finished = false;

        function cleanup() {
            stdin.removeListener('data', onData);
            stdin.setRawMode(false);
            stdin.pause();
        }

        function onData(key) {
            const char = key.toString();

            if (char === '\u0003') {
                finished = true;
                cleanup();
                stdout.write('\nCancelled.\n');
                return reject(new Error('Operation cancelled.'));
            }

            if (char === '\r' || char === '\n') {
                finished = true;
                cleanup();
                stdout.write('\n');
                return resolve(value);
            }

            if (char === '\u007f' || char === '\b') {
                value = value.slice(0, -1);
                return;
            }

            if (char.length === 1 && char >= ' ') {
                value += char;
            }
        }

        stdin.on('data', onData);
    });
}

async function main() {
    // This bootstrap script is restricted to the named test database.
    if (process.env.DATABASE_URL) {
        throw new Error(
            'Safety stop: DATABASE_URL is set. Configure the test database using DB_NAME instead.'
        );
    }

    if (process.env.DB_NAME !== 'sales_management_migration_test') {
        throw new Error(
            'Safety stop: DB_NAME must be sales_management_migration_test.'
        );
    }

    const client = await pool.connect();

    try {
        const dbCheck = await client.query(
            'SELECT current_database() AS name'
        );

        if (dbCheck.rows[0].name !== 'sales_management_migration_test') {
            throw new Error('Connected to an unexpected database.');
        }

        const existing = await client.query(
            'SELECT id FROM users WHERE is_platform_admin = TRUE LIMIT 1'
        );

        if (existing.rowCount > 0) {
            console.log(
                'A platform administrator already exists. No account was created.'
            );
            return;
        }

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        let fullName;
        let username;
        let email;

        try {
            console.log('\nCreate the platform administrator for the TEST database.\n');

            fullName = await ask(rl, 'Full name: ');
            username = await ask(rl, 'Username: ');
            email = await ask(rl, 'Email: ');
        } finally {
            rl.close();
        }

        if (!fullName || !username || !email) {
            throw new Error('Full name, username, and email are required.');
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Please enter a valid email address.');
        }

        const password = await askHidden(
            'Password (minimum 12 characters; input hidden): '
        );

        if (password.length < 12) {
            throw new Error('Password must contain at least 12 characters.');
        }

        const confirmPassword = await askHidden(
            'Confirm password (input hidden): '
        );

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match.');
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await client.query('BEGIN');

        // Recheck before insertion to avoid creating a second administrator.
        const adminCheck = await client.query(
            'SELECT id FROM users WHERE is_platform_admin = TRUE LIMIT 1'
        );

        if (adminCheck.rowCount > 0) {
            await client.query('ROLLBACK');
            console.log(
                'A platform administrator already exists. No account was created.'
            );
            return;
        }

        const result = await client.query(
            `INSERT INTO users
                (full_name, username, email, password_hash, role,
                 is_active, business_id, is_platform_admin)
             VALUES ($1, $2, $3, $4, 'director', TRUE, NULL, TRUE)
             RETURNING id, full_name, username, email`,
            [fullName, username, email, passwordHash]
        );

        await client.query('COMMIT');

        console.log('\nPlatform administrator created successfully.');
        console.log('Database: sales_management_migration_test');
        console.log('User ID:', result.rows[0].id);
        console.log('Full name:', result.rows[0].full_name);
        console.log('Username:', result.rows[0].username);
        console.log('Email:', result.rows[0].email);
        console.log('\nKeep your password private.');
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch {}

        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(error => {
    console.error('\nPlatform administrator was not created:', error.message);
    pool.end().catch(() => {});
    process.exitCode = 1;
});
