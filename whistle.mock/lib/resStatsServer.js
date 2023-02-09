const fs = require("fs");
const path = require("path");
const qs = require("qs");

function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}

module.exports = (server) => {
  server.on("request", (req) => {
    req.getSession((s) => {
      // 如果设置了 enable://hide 会获取到空数据
      if (!s) {
        return;
      }
      // 无视option请求
      if (s.req.method == "OPTIONS") return;

      const type = s.req.headers["x-whistle-rule-value"];

      const host = s.req.headers.host;
      let api = s.url.split("?")[0].replace(/(http|https):\/\/\S+?\//g, "");
      if (type) {
        const query = qs.parse(s.url);
        const data = s.req.body && JSON.parse(s.req.body);
        api = query[type] || data[type];
        if (!api) {
          return;
        }
      }

      const dir = path.resolve(__dirname, "../data", host);
      mkdirsSync(dir);
      const filename = `${dir}/${encodeURIComponent(api)}.json`;
      // fs.writeFileSync('/Users/wanjie/hll/whislte-mock/test.json', filename)
      if (fs.existsSync(filename)) {
        const data = fs.readFileSync(filename);
        const content = data && JSON.parse(data);
        if (content) {
          s = {
            ...content,
            ...s,
          };
        }
      }
      fs.writeFile(filename, JSON.stringify(s, "", "\t"), (err) => {
        if (err) {
          console.log(err);
        }
      });
    });
  });
};
