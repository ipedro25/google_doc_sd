// Os comentários são criados/resolvidos/eliminados via REST (documentRoutes.js
// e commentRoutes.js), que já tratam de autenticação e persistência. Este
// módulo serve só para avisar, em tempo real, quem mais estiver a colaborar
// no mesmo documento — sem isto, teriam de recarregar a página para ver
// comentários novos de outra pessoa.

module.exports = function commentSocket(io, socket) {
  socket.on("comment-sync", (payload) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    socket.to(roomId).emit("comment-sync", payload);
  });
};