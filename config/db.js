const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const poolConfig = process.env.DATABASE_URL
    ? {
          connectionString: process.env.DATABASE_URL,
          ssl: isProduction
              ? { rejectUnauthorized: false }
              : false,
          max: 5,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000
      }
    : {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          ssl: false,
          max: 5,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000
      };

const pool = new Pool(poolConfig);

pool.on("connect", () => {
    console.log("PostgreSQL connected successfully");
});

pool.on("error", (error) => {
    console.error("PostgreSQL pool error:", error);
});

pool.query("SELECT NOW()", (error, result) => {
    if (error) {
        console.error(
            "PostgreSQL connection failed:",
            error.message
        );
    } else {
        console.log(
            "PostgreSQL connection test successful"
        );

        console.log(
            "Database time:",
            result.rows[0].now
        );
    }
});

module.exports = pool;
