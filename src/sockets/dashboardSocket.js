// Sala especial "dashboard": quem estiver a ver o dashboard entra aqui
// (não é um documento) e recebe notificações leves de actividade — "Fulano
// editou o documento X" — sem precisar de estar dentro desse documento.

const THROTTLE_MS = 4000; // no máx. 1 notificação por sala a cada 4s
const lastNotified = new Map(); // roomId -> timestamp

function notifyDashboard(io, roomId, editorName, type) {
  const now = Date.now();
  const last = lastNotified.get(roomId) || 0;
  if (now - last < THROTTLE_MS) return;
  lastNotified.set(roomId, now);

  io.to("dashboard").emit("doc-activity", {
    documentId: roomId,
    editor: editorName,
    type, // 'word' | 'excel'
    at: new Date().toISOString(),
  });
}

module.exports = function dashboardSocket(io, socket) {
  socket.on("join-dashboard", () => {
    socket.join("dashboard");
  });
};

module.exports.notifyDashboard = notifyDashboard;