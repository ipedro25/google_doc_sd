const Redis = require("ioredis");

const client = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 0,
  retryStrategy: () => null,
  enableOfflineQueue: false,
});

client.on("connect", () => console.log("[Redis] Ligado com sucesso"));
client.on("error",   () => {}); // silencia erros quando Redis está offline

module.exports = client;