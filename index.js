const http = require("http");
const app = require("./app");
const { port } = require("./config/keys");
const socketIo = require("socket.io");

const server = http.createServer(app);


const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
    credentials: true,
  }
});


io.on("connection", (socket) => {
  console.log("A user connected");


  io.on("message", (data) => {
    console.log("Received message:", data);
  });

  io.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
