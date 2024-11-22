const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const methodOverride = require("method-override");
const engine = require("ejs-mate");
const path = require("path");
const session = require("express-session");
const https = require("https");
const http = require("http");
const indexRoute = require("./routes/index");
const fs = require("fs");
app.use(
  session({
    secret: "1234567890",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    },
  })
);
app.use(fileUpload());
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/", indexRoute);
// Load SSL certificate and key
const key = fs.readFileSync(
  path.join(__dirname, "./orphan_assist-privateKey.key"),
  "utf8"
);
const cert = fs.readFileSync(
  path.join(__dirname, "./orphan_assist.crt"),
  "utf8"
);

const PORT = process.env.PORT || 3000;

const httpsServer = https.createServer({ key, cert }, app);
const httpServer = http.createServer(app);

// Start both HTTP and HTTPS servers
httpServer.listen(80, () => {
  console.log("HTTP Server running on port 80");
});

httpsServer.listen(PORT, () => {
  console.log(`HTTPS Server running on port ${PORT}`);
  console.log(`https://localhost:${PORT}/`);
});
