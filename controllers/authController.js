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

const host = new URL(process.env.DATABASE_URL).hostname;

const columns = await pool.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'users'
  ORDER BY ordinal_position
`);

console.error('[CONNECTED_HOST]', host);
console.error('[USERS_COLUMNS]', columns.rows);


 const dbCheck = await pool.query(`
    SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,
        current_setting('search_path') AS search_path,
        to_regclass('public.users') AS users_table,
        EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name = 'business_id'
        ) AS has_business_id
`);

let databaseHost = 'DATABASE_URL not configured';

try {
    if (process.env.DATABASE_URL) {
        databaseHost = new URL(process.env.DATABASE_URL).hostname;
    }
} catch {
    databaseHost = 'Unable to parse database hostname';
}

console.error(
  "[DATABASE_URL_CHECK]",
  process.env.DATABASE_URL?.replace(/:\/\/.*@/, "://***@")
);


console.error('[DATABASE_HOST_DIAGNOSTIC]', databaseHost);

console.error(
    '[LOGIN_DB_DIAGNOSTIC]',
    JSON.stringify(dbCheck.rows[0])
);


    const result = await pool.query(
      `SELECT id, full_name, username, email, password_hash, role,
                    is_active, business_id, is_platform_admin
             FROM users
             WHERE username = $1 OR email = $1
             LIMIT 1`,
      [username],
    );

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
