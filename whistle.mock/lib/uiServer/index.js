const path = require("path");
const express = require("express");
const app = express();
const proxy = require("express-http-proxy");
const router = require("./router");

function noop() {}
app.use(function (req, res, next) {
  req.on("error", noop);
  res.on("error", noop);
  next();
});

app.use(express.urlencoded({ extended: true, limit: "3mb" }));
app.use(express.json());
app.use(router);

if (process.env.SERVER_MODE == "dev") {
  app.use("/", proxy("http://localhost:8081/"));
} else {
  app.use(express.static(path.join(__dirname, "../../../dist")));
}

module.exports = (server /* , options */) => {
  server.on("request", app);
};
