const jwt = require("jsonwebtoken");

function socketAuth(socket, next) {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No token provided"));

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new Error("Invalid token"));
    socket.user = user;
    next();
  });
}

module.exports = socketAuth;