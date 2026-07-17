const pool = require("../config/db");

async function create({ id, documentId, authorName, quote, text }) {
  const result = await pool.query(
    `INSERT INTO document_comments (id, document_id, author_name, quote, text)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id, documentId, authorName, quote || null, text]
  );
  return result.rows[0];
}

async function findByDocument(documentId) {
  const result = await pool.query(
    `SELECT * FROM document_comments WHERE document_id=$1 ORDER BY created_at ASC`,
    [documentId]
  );
  return result.rows;
}

async function findById(id) {
  const result = await pool.query("SELECT * FROM document_comments WHERE id=$1", [id]);
  return result.rows[0] || null;
}

async function setResolved(id, resolved) {
  const result = await pool.query(
    "UPDATE document_comments SET resolved=$1 WHERE id=$2 RETURNING *",
    [resolved, id]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  const result = await pool.query(
    "DELETE FROM document_comments WHERE id=$1 RETURNING id",
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { create, findByDocument, findById, setResolved, remove };