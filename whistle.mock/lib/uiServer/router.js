// For help see https://github.com/ZijianHe/koa-router#api-reference
const fs = require("fs");
const path = require("path");
const express = require("express");

const router = express.Router();

function delDir(path) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach((file) => {
      let curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) {
        delDir(curPath); //递归删除文件夹
      } else {
        fs.unlinkSync(curPath); //删除文件
      }
    });
    fs.rmdirSync(path);
  }
}

router.get("/api/list", (req, res) => {
  const dir = path.resolve(__dirname, "../../data");
  if (!fs.existsSync(dir)) {
    return res.json([]);
  }
  const hosts = fs.readdirSync(dir).map((i) => {
    const apis = fs.readdirSync(`${dir}/${i}`);
    return {
      name: i,
      apis: apis.map((j) => {
        const data = fs.readFileSync(`${dir}/${i}/${j}`, "utf8");
        return {
          name: j.slice(0, -5),
          data: JSON.parse(data),
        };
      }),
    };
  });
  res.json(hosts);
});
router.post("/api/modify", (req, res) => {
  const params = req.body;
  const file = path.resolve(
    __dirname,
    "../../data",
    `${params.host}/${params.api}.json`
  );
  fs.writeFileSync(file, JSON.stringify(params.body, "", "\t"));
  res.json({
    msg: "ok",
    file: file,
  });
});

router.post("/api/clear", (req, res) => {
  const dir = path.resolve(__dirname, "../../data");
  delDir(dir);
  fs.mkdirSync(dir);
  res.json({
    msg: "ok",
  });
});

module.exports = router;
