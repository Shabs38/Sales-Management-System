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

pool.on("connect", (client) => {
    console.log("PostgreSQL connected successfully");

    // TEMPORARY DIAGNOSTIC: inspect the actual runtime connection.
    client.query(`
        SELECT
            current_database() AS database_name,
            current_user AS database_user,
            current_schema() AS current_schema,
            current_setting('search_path') AS search_path,
            inet_server_addr()::text AS server_address,
            to_regclass('users')::text AS resolved_users_table,
            to_regclass('public.users')::text AS public_users_table,
            EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name = 'business_id'
            ) AS has_business_id,
            EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'users'
                  AND column_name = 'is_platform_admin'
            ) AS has_is_platform_admin
    `)
    .then((result) => {
        console.log(
            "POSTGRESQL RUNTIME DIAGNOSTIC:",
            JSON.stringify(result.rows[0])
        );
    })
    .catch((error) => {
        console.error(
            "POSTGRESQL RUNTIME DIAGNOSTIC FAILED:",
            error.message
        );
    });
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
