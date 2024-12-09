const http = require("http");
const app = require("./app");
const { port } = require("./config/keys");
const { initSocket } = require("./socket");
const os = require("os");

const networkInterfaces = os.networkInterfaces();
let localIp = "localhost";

for (const iface in networkInterfaces) {
  networkInterfaces[iface].forEach((details) => {
    if (details.family === "IPv4" && !details.internal) {
      localIp = details.address;
    }
  });
}

const appAddress = `http://${localIp}:${port}`;

const server = http.createServer(app);
initSocket(server);

server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://${localIp}:${port}`);
});

module.exports = server;
