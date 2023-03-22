require("dotenv").config()
const mysql = require("mysql2/promise")

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  socketPath: process.env.DB_SOCKET_PATH,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

async function saveUserToken(user) {
  try {
    const { id, accessToken, expiresIn, firstName, lastName, email, profileUrl } = user
    const now = new Date()
    const expiresAt = new Date(now.getTime() + expiresIn * 1000)

    const [rows] = await pool.query("SELECT * FROM linkedin_users WHERE id = ?", [id])
    if (rows.length === 0) {
      await pool.query(
      'INSERT INTO linkedin_users (id, access_token, token_expires_at, first_name, last_name, email, profile_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, accessToken, expiresAt, firstName, lastName, email, profileUrl]
      )
    } else {
      await pool.query(
      'UPDATE linkedin_users SET access_token = ?, token_expires_at = ?, first_name = ?, last_name = ?, email = ?, profile_url = ? WHERE id = ?',
      [accessToken, expiresAt, firstName, lastName, email, profileUrl, id]
      )
    }
  } catch (err) {
    console.error("Error saving user token:", err)
  }
}

module.exports = {
  saveUserToken,
  pool,
}
