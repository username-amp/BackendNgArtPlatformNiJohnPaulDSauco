const http = require("http");
const app = require("./app");
const { port } = require("./config/keys");
const { initSocket } = require("./socket");
const os = require("os");

// Get the local IP address of the current machine
const networkInterfaces = os.networkInterfaces();
let localIp = "localhost"; // default

// Look for the correct interface (usually 'en0' or 'Wi-Fi')
for (const iface in networkInterfaces) {
  networkInterfaces[iface].forEach((details) => {
    if (details.family === "IPv4" && !details.internal) {
      localIp = details.address; // Set local IP address
    }
  });
}

const appAddress = `http://${localIp}:${port}`;

const server = http.createServer(app);
initSocket(server); // Initialize socket here

server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://${localIp}:${port}`);
});

module.exports = server; // Export the server
