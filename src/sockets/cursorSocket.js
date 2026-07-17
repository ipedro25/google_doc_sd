module.exports = function cursorSocket(io, socket) {
  socket.on("cursor-move", (cursor) => {
    if (!socket.roomId) return;
    socket.to(socket.roomId).emit("cursor-update", {
      user: socket.user.name,
      ...cursor,
    });
  });
};