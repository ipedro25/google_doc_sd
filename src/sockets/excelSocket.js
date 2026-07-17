const { setDocumentState, getDocumentState } = require("../redis/documentCache");
const { markEdited } = require("../services/autosaveService");
const { notifyDashboard } = require("./dashboardSocket");

module.exports = function excelSocket(io, socket) {

  socket.on("excel-change", async (data) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    if (socket.isViewer) {
      socket.emit("edit-denied", { message: "Estás em modo de leitura. Não podes editar este documento." });
      return;
    }

    // Redis absorve a escrita em tempo real. O Postgres só é actualizado
    // pelo ciclo de autosave (a cada 10s) — ver services/autosaveService.js.
    const state = await getDocumentState(roomId).catch(() => ({})) || {};
    await setDocumentState(roomId, { ...state, excelData: data }).catch(() => null);
    markEdited(roomId, socket.user.name);
    notifyDashboard(io, roomId, socket.user.name, "excel");

    socket.to(roomId).emit("excel-update", data);
  });
};