const express = require("express");
const PassThrough = require("stream").PassThrough;
const axios = require("axios");
const qs = require("qs");
const path = require("path");
const fs = require("fs");

var app = express();

let sleep = function (delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(1);
      } catch (e) {
        reject(0);
      }
    }, delay);
  });
};

function noop() {}
app.use(express.urlencoded({ extended: true, limit: "3mb" }));
app.use(express.json());

app.use(function (req, res, next) {
  req.on("error", noop);
  res.on("error", noop);
  next();
});

app.use(function (req, res, next) {
  var emitEndStream = new PassThrough();
  emitEndStream.on("data", noop).on("error", noop);
  emitEndStream.on("end", next);
  req.pipe(emitEndStream);
});

app.use(async function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/json; charset=utf-8",
  });
  const host = req.headers.host;
  const key = req.headers["x-whistle-rule-value"];
  const method = req.method;
  const url = req.originalReq.url;
  let api = url.split("?")[0].replace(/(http|https):\/\/\S+?\//g, "");
  if (key) {
    const query = qs.parse(url);
    const data = req.body;
    api = query[key] || data[key];
  }
  const dir = path.resolve(__dirname, "../data", host);
  const filename = `${dir}/${encodeURIComponent(api)}.json`;
  if (fs.existsSync(filename)) {
    const data = JSON.parse(fs.readFileSync(filename));
    if (data.delay) {
      await sleep(data.delay);
    }
    if (data.mock) {
      res.end(data.res.body);
      return;
    }
  }
  axios({
    url,
    method,
    data: req.body,
    headers: req.originalReq.headers,
  }).then((r) => {
    const data = r.data;
    res.end(JSON.stringify(data));
  });
});

module.exports = app;
