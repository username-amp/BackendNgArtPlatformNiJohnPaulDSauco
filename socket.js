const socketIo = require("socket.io");

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("message", (data) => {
      console.log("Received message:", data);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized");
  }
  return io;
};

module.exports = { initSocket, getIO };
