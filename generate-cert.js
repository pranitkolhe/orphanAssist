const pem = require("pem");
const fs = require("fs");

pem.createCertificate({ selfSigned: true }, (err, keys) => {
  if (err) {
    console.error(err);
    return;
  }

  fs.writeFileSync("server.key", keys.serviceKey);
  fs.writeFileSync("server.cert", keys.certificate);
  console.log("Self-signed certificate generated:");
  console.log("Key: server.key");
  console.log("Certificate: server.cert");
});
