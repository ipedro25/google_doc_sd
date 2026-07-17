const pool = require("../config/db");

async function add(documentId, userId, role = "editor") {
  const result = await pool.query(
    `INSERT INTO document_collaborators (document_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (document_id, user_id) DO UPDATE SET role = EXCLUDED.role
     RETURNING *`,
    [documentId, userId, role]
  );
  return result.rows[0];
}

async function remove(documentId, userId) {
  const result = await pool.query(
    "DELETE FROM document_collaborators WHERE document_id=$1 AND user_id=$2 RETURNING *",
    [documentId, userId]
  );
  return result.rows[0] || null;
}

async function getRole(documentId, userId) {
  const result = await pool.query(
    "SELECT role FROM document_collaborators WHERE document_id=$1 AND user_id=$2",
    [documentId, userId]
  );
  return result.rows[0]?.role || null;
}

async function listByDocument(documentId) {
  const result = await pool.query(
    `SELECT dc.user_id, dc.role, dc.added_at, u.name, u.email
     FROM document_collaborators dc
     JOIN users u ON u.id = dc.user_id
     WHERE dc.document_id = $1
     ORDER BY dc.added_at ASC`,
    [documentId]
  );
  return result.rows;
}

/** Documentos onde este utilizador é colaborador (usado para aparecerem no dashboard de quem recebeu a partilha). */
async function listDocumentIdsForUser(userId) {
  const result = await pool.query(
    "SELECT document_id, role FROM document_collaborators WHERE user_id=$1",
    [userId]
  );
  return result.rows;
}

module.exports = { add, remove, getRole, listByDocument, listDocumentIdsForUser };