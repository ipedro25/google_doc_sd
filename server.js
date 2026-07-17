require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const setupSockets = require("./src/sockets/index");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// setupSockets já trata da autenticação de sockets e inicia o
// autosave internamente — não é preciso chamar startAutoSave aqui.
setupSockets(server);

server.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});