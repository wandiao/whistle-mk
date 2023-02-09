const app = require("./proxyServer");

module.exports = (server, options) => {
  // handle http request
  server.on("request", app);

  // handle websocket request
  server.on("upgrade", (req, socket) => {
    // do something
    req.passThrough();
  });

  // handle tunnel request
  server.on("connect", (req, socket) => {
    // do something
    req.passThrough();
  });
};
