const http = require("http");
const app = require("./app");
const { port } = require("./config/keys");
const { initSocket } = require("./socket");

const server = http.createServer(app);
initSocket(server); // Initialize socket here

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = server; // Export the server
