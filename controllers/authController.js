const bcrypt = require("bcryptjs");
const pool = require("../config/db");



async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }


    let client;
    let result;

    try {
      client = await pool.connect();

      const diagnostic = await client.query(`
        SELECT
          current_database() AS database_name,
          current_user AS database_user,
          current_schema() AS current_schema,
          current_setting('search_path') AS search_path,
          inet_server_addr()::text AS server_address,
          to_regclass('users')::text AS resolved_users_table,
          to_regclass('public.users')::text AS public_users_table,
          (
            SELECT COALESCE(
              json_agg(a.attname ORDER BY a.attnum),
              '[]'::json
            )
            FROM pg_catalog.pg_attribute a
            WHERE a.attrelid = to_regclass('public.users')
              AND a.attnum > 0
              AND NOT a.attisdropped
          ) AS physical_users_columns
      `);

      console.log(
        "LOGIN CONNECTION DIAGNOSTIC:",
        JSON.stringify(diagnostic.rows[0])
      );

      result = await client.query(
        `SELECT id, full_name, username, email, password_hash, role,
                is_active, business_id, is_platform_admin
         FROM users
         WHERE username = $1 OR email = $1
         LIMIT 1`,
        [username]
      );

    } finally {
      if (client) {
        client.release();
      }
    }

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        console.error("Session regeneration error:", regenerateError);

        return res.status(500).json({
          success: false,
          message: "Unable to create login session.",
        });
      }

      req.session.user = {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role,
        business_id: user.business_id,
        is_platform_admin: user.is_platform_admin,
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError);

          return res.status(500).json({
            success: false,
            message: "Unable to create login session.",
          });
        }

        return res.json({
          success: true,
          message: "Login successful.",
          user: req.session.user,
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
}

/* =================================
   CHECK CURRENT SESSION
================================= */

async function me(req, res) {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated.",
    });
  }

  return res.json({
    success: true,
    user: req.session.user,
  });
}

/* =================================
   LOGOUT
================================= */

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to logout.",
      });
    }

    res.clearCookie("connect.sid");

    return res.json({
      success: true,
      message: "Logout successful.",
    });
  });
}

/* =================================
   EXPORT
================================= */

module.exports = {
  login,
  me,
  logout,
};
