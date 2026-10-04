const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on("connect", () => {
    console.log("PostgreSQL connected successfully");
});

pool.on("error", (error) => {
    console.error("PostgreSQL pool error:", error);
});

// Force a connection test when the server starts
pool.query("SELECT NOW()", (error, result) => {

    if (error) {
        console.error("PostgreSQL connection failed:", error.message);
    } else {
        console.log("PostgreSQL connection test successful");
        console.log("Database time:", result.rows[0].now);
    }

});

module.exports = pool;
