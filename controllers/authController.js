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

    const result = await pool.query(
      `SELECT id, full_name, username, email, password_hash, role, is_active
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

    req.session.user = {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    req.session.save((error) => {
      if (error) {
        console.error("Session save error:", error);

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
