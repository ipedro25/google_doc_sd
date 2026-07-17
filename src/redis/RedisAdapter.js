const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");

/**
 * Cria dois clientes Redis dedicados ao adapter do Socket.IO.
 * Pub/Sub requer clientes separados — não reutilizar o cliente principal.
 */
function createRedisAdapter() {
  const pubClient = new Redis(process.env.REDIS_URL);
  const subClient = pubClient.duplicate();

  pubClient.on("error", (err) => console.error("[Redis Adapter - pub]", err.message));
  subClient.on("error", (err) => console.error("[Redis Adapter - sub]", err.message));

  return createAdapter(pubClient, subClient);
}

module.exports = createRedisAdapter;