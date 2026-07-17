const versionService = require("../services/versionService");

module.exports = function versionSocket(io, socket) {
  socket.on("create-version", async () => {
    const roomId = socket.roomId;
    if (!roomId) return;
    try {
      await versionService.createVersion(roomId, socket.user.name);
      socket.emit("version-saved", { message: "Versão guardada com sucesso" });
    } catch (err) {
      console.error("[versionSocket] Erro:", err.message);
    }
  });
};