const express = require("express");
const expressOasGenerator = require("express-oas-generator");
const cors = require("cors");
const path = require("path");
const passport = require("passport");
const fs = require("fs");
const mkdirp = require("mkdirp");
const axios = require("axios");
// const socketio = require("socket.io");

/**
 * -------------- GENERAL SETUP ----------------
 */

var whitelist = [];
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

require("dotenv").config();

var app = express();

// api docs
if (process.env.NODE_ENV !== "production") {
  const openAPIFilePath = "./documentation/api.json";

  mkdirp.sync(path.parse(openAPIFilePath).dir);

  let predefinedSpec;

  try {
    predefinedSpec = JSON.parse(
      fs.readFileSync(openAPIFilePath, { encoding: "utf-8" })
    );
  } catch (e) {
    console.log(e);
  }

  expressOasGenerator.handleResponses(app, {
    specOutputPath: openAPIFilePath,
    writeIntervalMs: 0,
    predefinedSpec: predefinedSpec ? () => predefinedSpec : undefined,
  });
}

// Configuring the database and opening a global connection
require("./config/database");

// loading the models
require("./models/user");
// require("./models/Post");
// require("./models/Comment");

// Passing the global passport object into the configuration function
require("./config/passport")(passport);

// Initialize the passport object on every request
app.use(passport.initialize());

// Replace of body-parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.options("*", cors());

/**
 * -------------- ROUTES ----------------
 */
// Imports all of the routes from ./routes/index.js
app.use(require("./routes"));

// OAS
expressOasGenerator.handleRequests();

/**
 * Serve react app
 */
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("/*", function (req, res) {
    res.sendFile(path.join(__dirname, "./client/build/index.html"));
  });
}

/**
 * -------------- SERVER ----------------
 */

const server = app.listen(process.env.PORT || 3000);
/**
 * -------------- WEB SOCKET ----------------
 */

// const io = socketio.listen(server);

// io.sockets.on("connection", function (socket) {
//   socket.on("join", (data) => {
//     console.log(data);
//   });
//   socket.on("disconnect", () => {
//     console.log("gone");
//   });
// });
// });
