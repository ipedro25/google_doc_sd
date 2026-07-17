const { Server } = require("socket.io");
const socketAuth = require("../middleware/socketAuth");
const wordSocket = require("./wordSocket");
const excelSocket = require("./excelSocket");
const cursorSocket = require("./cursorSocket");
const versionSocket = require("./versionSocket");
const dashboardSocket = require("./dashboardSocket");
const { startAutoSave } = require("../services/autosaveService");

function setupSockets(server) {
  const io = new Server(server, {
    cors: { origin: "*" },
    transports: ["websocket"],
  });

  // Redis adapter desactivado temporariamente
  // Activar quando o Redis estiver a correr:
  // const createRedisAdapter = require("../redis/redisAdapter");
  // io.adapter(createRedisAdapter());

  io.use(socketAuth);

  io.on("connection", (socket) => {
    wordSocket(io, socket);
    excelSocket(io, socket);
    cursorSocket(io, socket);
    versionSocket(io, socket);
    dashboardSocket(io, socket);
  });

  // Inicia o serviço de autosave (Redis -> Postgres a cada 10s).
  // Guarda a função de paragem caso seja preciso desligar graciosamente.
  io.stopAutoSave = startAutoSave();

  return io;
}

module.exports = setupSockets;