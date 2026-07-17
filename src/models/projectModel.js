const pool = require("../config/db");

async function create({ name, description, organization, ownerId }) {
  const result = await pool.query(
    `INSERT INTO projects (name, description, organization, owner_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, description || null, organization || null, ownerId]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query("SELECT * FROM projects WHERE id=$1", [id]);
  return result.rows[0] || null;
}

/** Lista os projectos onde o utilizador é membro, com contagem de membros e documentos. */
async function findAllForUser(userId) {
  const result = await pool.query(
    `SELECT p.*, pm.role AS my_role,
            (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) AS member_count,
            (SELECT COUNT(*) FROM documents d WHERE d.project_id = p.id) AS document_count
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id
     WHERE pm.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function update(id, fields) {
  const keys   = Object.keys(fields);
  const values = Object.values(fields);
  const set    = keys.map((k, i) => `${k}=$${i + 1}`).join(", ");
  const result = await pool.query(
    `UPDATE projects SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await pool.query("DELETE FROM projects WHERE id=$1 RETURNING id", [id]);
  return result.rows[0] || null;
}

module.exports = { create, findById, findAllForUser, update, remove };