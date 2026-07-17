const { Server } = require("socket.io");
const Client = require("socket.io-client");

describe("Socket.IO", () => {
  let io, serverSocket, clientSocket;

  beforeAll((done) => {
    io = new Server(4000);
    io.on("connection", (socket) => {
      serverSocket = socket;
    });
    clientSocket = new Client("http://localhost:4000");
    clientSocket.on("connect", done);
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  it("should connect client", () => {
    expect(clientSocket.connected).toBe(true);
  });
});
