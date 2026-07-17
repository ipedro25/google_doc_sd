const pool = require("../config/db");

async function create({ projectId, name }) {
  const result = await pool.query(
    `INSERT INTO folders (project_id, name) VALUES ($1, $2) RETURNING *`,
    [projectId, name]
  );
  return result.rows[0];
}

/** Pastas de um projecto, com contagem de documentos dentro de cada uma. */
async function findByProject(projectId) {
  const result = await pool.query(
    `SELECT f.*, (SELECT COUNT(*) FROM documents d WHERE d.folder_id = f.id) AS document_count
     FROM folders f
     WHERE f.project_id = $1
     ORDER BY f.name ASC`,
    [projectId]
  );
  return result.rows;
}

async function findById(id) {
  const result = await pool.query("SELECT * FROM folders WHERE id=$1", [id]);
  return result.rows[0] || null;
}

async function update(id, fields) {
  const keys   = Object.keys(fields);
  const values = Object.values(fields);
  const set    = keys.map((k, i) => `${k}=$${i + 1}`).join(", ");
  const result = await pool.query(
    `UPDATE folders SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await pool.query("DELETE FROM folders WHERE id=$1 RETURNING id", [id]);
  return result.rows[0] || null;
}

module.exports = { create, findByProject, findById, update, remove };