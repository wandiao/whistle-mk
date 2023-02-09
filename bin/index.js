#!/usr/bin/env node
const startWhistle = require('whistle/index');
const path = require('path');
const ip = require('ip');
const fs = require('fs');
const glob = require('glob');
const { execSync } = require('child_process');
const program = require('commander');
const packConfig = require('../package.json');

const generateCert = require('./generateCert');
const {
  DEFAULT_PORT,
  CERT_FILE_NAME,
  CERT_KEY_FILE_NAME,
} = require('../config/const');

const start = (options) => {
  return new Promise((resolve) => {
    startWhistle(options, resolve);
  });
};

const pluginPaths = glob
  .sync('/usr/local/lib/node_modules/')
  .concat(
    glob.sync(process.env.HOME + '/.nvm/versions/node/*/lib/node_modules/'),
  )
  .concat(glob.sync(__dirname + '../../'));

let port = DEFAULT_PORT;

program.version(packConfig.version);

const proxyHelperPath = path.resolve(__dirname, '../scripts/proxy_conf_helper');

program
  .command('setup')
  .description('信任证书 & 安装 helper')
  .action(async () => {
    try {
      execSync(
        `sudo chown -R $USER ${path.resolve(
          __dirname,
          '../',
        )} && sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${path.resolve(
          __dirname,
          '../cert',
          CERT_FILE_NAME,
        )}" && sudo chown root:admin ${proxyHelperPath} && sudo chmod a+rx+s ${proxyHelperPath}`,
      );
      const keyFilePath = path.resolve(
        __dirname,
        '../cert',
        CERT_KEY_FILE_NAME,
      );
      const certFilePath = path.resolve(__dirname, '../cert', CERT_FILE_NAME);
      if (!keyFilePath) {
        const certs = await generateCert();
        await fs.writeFileSync(keyFilePath, certs.key, 'utf-8');
        await fs.writeFileSync(certFilePath, certs.cert, 'utf-8');
      }
      console.log('success');
    } catch (e) {
      console.log(e);
    }
  });

program
  .command('start')
  .description('启动whistle-mk')
  .option('-p, --port <number>', '设置端口号')
  .action((options) => {
    if (options.port) {
      port = options.port;
    }
    const socksPort = +port + 1;
    start({
      host: '0.0.0.0',
      port,
      socksPort,
      storage: path.resolve(__dirname, '../storage'),
      certDir: path.resolve(__dirname, '../cert'),
      pluginPaths: pluginPaths.filter(
        (item) => typeof item === 'string' && item !== 'undefined',
      ),
      mode: 'capture',
    }).then(() => {
      console.info(
        `Whistle start: http://${ip.address()}:${port} or http://local.whistlejs.com`,
      );
      console.info(
        'Whistle.mock start: http://local.whistlejs.com/whistle.mock',
      );
      const output = execSync(
        `${proxyHelperPath} -m global -p ${port} -r ${port} -s 127.0.0.1`,
      );
      console.log(output.toString());
    });
  });

program.parse(process.argv);

// 退出关闭代理
process.on('SIGINT', function () {
  const output = execSync(`${proxyHelperPath} -m off`);
  console.log(output.toString());
  process.exit(0);
});
