const pool = require("../config/db");

async function add(projectId, userId, role = "member") {
  const result = await pool.query(
    `INSERT INTO project_members (project_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (project_id, user_id) DO NOTHING
     RETURNING *`,
    [projectId, userId, role]
  );
  return result.rows[0] || null;
}

async function remove(projectId, userId) {
  const result = await pool.query(
    "DELETE FROM project_members WHERE project_id=$1 AND user_id=$2 RETURNING *",
    [projectId, userId]
  );
  return result.rows[0] || null;
}

async function isMember(projectId, userId) {
  const result = await pool.query(
    "SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2",
    [projectId, userId]
  );
  return result.rows.length > 0;
}

async function getRole(projectId, userId) {
  const result = await pool.query(
    "SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2",
    [projectId, userId]
  );
  return result.rows[0]?.role || null;
}

async function listMembers(projectId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, pm.role
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY pm.role, u.name`,
    [projectId]
  );
  return result.rows;
}

module.exports = { add, remove, isMember, getRole, listMembers };