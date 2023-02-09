const forge = require("node-forge");

const pki = forge.pki;

async function generateCert() {
  return new Promise((resolve) => {
    const keys = pki.rsa.generateKeyPair(2048);
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = new Date().getTime() + "";
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(
      cert.validity.notBefore.getFullYear() - 10
    );
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(
      cert.validity.notAfter.getFullYear() + 10
    );

    const attrs = [
      {
        name: "commonName",
        value: "whistleMock" + new Date().toISOString().slice(0, 10),
      },
      {
        name: "countryName",
        value: "CN",
      },
      {
        shortName: "ST",
        value: "Shenzhen",
      },
      {
        name: "localityName",
        value: "Shenzhen",
      },
      {
        name: "organizationName",
        value: "whistleMock",
      },
      {
        shortName: "OU",
        value: "https://github.com/wandiao/whistle-mk",
      },
    ];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      {
        name: "basicConstraints",
        critical: true,
        cA: true,
      },
      {
        name: "keyUsage",
        critical: true,
        keyCertSign: true,
      },
      {
        name: "subjectKeyIdentifier",
      },
    ]);
    cert.sign(keys.privateKey, forge.md.sha256.create());
    const certPem = pki.certificateToPem(cert);
    const keyPem = pki.privateKeyToPem(keys.privateKey);

    resolve({
      key: keyPem,
      cert: certPem,
    });
  });
}

module.exports = generateCert;
