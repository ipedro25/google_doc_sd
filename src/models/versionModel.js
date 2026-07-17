const pool = require("../config/db");

async function create({ documentId, snapshot, editorName = null }) {
  const snapshotJson = typeof snapshot === "string"
    ? snapshot
    : JSON.stringify(snapshot);

  const result = await pool.query(
    `INSERT INTO document_versions (document_id, snapshot, editor_name)
     VALUES ($1, $2::jsonb, $3)
     RETURNING *`,
    [documentId, snapshotJson, editorName]
  );
  return result.rows[0];
}

async function findByDocument(documentId) {
  const result = await pool.query(
    `SELECT id, document_id, created_at, editor_name,
            snapshot->>'name' AS name
     FROM document_versions
     WHERE document_id=$1
     ORDER BY created_at DESC
     LIMIT 50`,
    [documentId]
  );
  return result.rows;
}

async function findById(id) {
  const result = await pool.query(
    "SELECT * FROM document_versions WHERE id=$1",
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { create, findByDocument, findById };