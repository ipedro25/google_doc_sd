const redis = require("./RedisClient");

const EXPIRY_SECONDS = 60 * 60; // 1 hora de TTL

/**
 * Guarda o estado mais recente de um documento no Redis.
 * Usado como cache rápida antes de persistir no PostgreSQL.
 */
async function setDocumentState(roomId, state) {
  await redis.set(
    `doc:${roomId}`,
    JSON.stringify(state),
    "EX",
    EXPIRY_SECONDS
  );
}

/**
 * Lê o estado de um documento do Redis.
 * Retorna null se não existir (cache miss → vai ao PostgreSQL).
 */
async function getDocumentState(roomId) {
  const data = await redis.get(`doc:${roomId}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Remove o estado de um documento do Redis.
 * Chamado após persistência final no PostgreSQL.
 */
async function deleteDocumentState(roomId) {
  await redis.del(`doc:${roomId}`);
}

/**
 * Guarda a lista de utilizadores activos numa sala.
 */
async function setActiveUsers(roomId, users) {
  await redis.set(
    `users:${roomId}`,
    JSON.stringify(users),
    "EX",
    EXPIRY_SECONDS
  );
}

/**
 * Lê os utilizadores activos numa sala.
 */
async function getActiveUsers(roomId) {
  const data = await redis.get(`users:${roomId}`);
  return data ? JSON.parse(data) : {};
}

module.exports = {
  setDocumentState,
  getDocumentState,
  deleteDocumentState,
  setActiveUsers,
  getActiveUsers,
};