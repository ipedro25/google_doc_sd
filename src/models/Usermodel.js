const pool = require("../config/db");

async function findByName(name) {
  const result = await pool.query("SELECT * FROM users WHERE name=$1", [name]);
  return result.rows[0] || null;
}

async function findByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query("SELECT id, name, email, organization, role, created_at FROM users WHERE id=$1", [id]);
  return result.rows[0] || null;
}

async function create({ name, email, password, organization, role }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, organization, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, organization, role, created_at`,
    [name, email, password, organization, role]
  );
  return result.rows[0];
}

async function findAll({ page, limit, search }) {
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `SELECT id, name, email, organization, role, created_at
     FROM users
     WHERE name ILIKE $1 OR email ILIKE $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [`%${search}%`, limit, offset]
  );
  const count = await pool.query(
    "SELECT COUNT(*) FROM users WHERE name ILIKE $1 OR email ILIKE $1",
    [`%${search}%`]
  );
  return { data: result.rows, total: parseInt(count.rows[0].count), page, limit };
}

async function update(id, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys.map((k, i) => `${k}=$${i + 1}`).join(", ");
  const result = await pool.query(
    `UPDATE users SET ${setClause}, updated_at=NOW() WHERE id=$${keys.length + 1}
     RETURNING id, name, email, organization, role`,
    [...values, id]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await pool.query("DELETE FROM users WHERE id=$1 RETURNING id", [id]);
  return result.rows[0] || null;
}

async function updatePassword(id, hashedPassword) {
  await pool.query("UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2", [hashedPassword, id]);
}

async function saveResetToken(id, token) {
  await pool.query(
    "UPDATE users SET reset_token=$1, reset_token_expires_at=NOW() + INTERVAL '15 minutes' WHERE id=$2",
    [token, id]
  );
}

async function clearResetToken(id) {
  await pool.query("UPDATE users SET reset_token=NULL, reset_token_expires_at=NULL WHERE id=$1", [id]);
}

module.exports = {
  findByName,
  findByEmail,
  findById,
  create,
  findAll,
  update,
  remove,
  updatePassword,
  saveResetToken,
  clearResetToken,
};