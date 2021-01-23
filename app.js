const express = require("express");
const cors = require("cors");
const path = require("path");
const passport = require("passport");
const fs = require("fs");
const mkdirp = require("mkdirp");
const bodyParser = require("body-parser");
const expressOasGenerator = require("express-oas-generator");
const mongoose = require("mongoose");
var app = express();

/**
 * -------------- LOAD MONGO MODELS ----------------
 */
require("./models/user");
require("./models/Post");
require("./models/Vote");
// require("./models/Comment");

/**
 * -------------- INTERCEPT RESPONSES ----------------
 */
if (process.env.NODE_ENV !== "production") {
  let openAPIFilePath = "./documentation/api.json";
  mkdirp.sync(path.parse(openAPIFilePath).dir);
  let predefinedSpec;

  try {
    predefinedSpec = JSON.parse(
      fs.readFileSync(openAPIFilePath, { encoding: "utf-8" })
    );
  } catch (e) {}

  expressOasGenerator.handleResponses(app, {
    specOutputPath: openAPIFilePath,
    writeIntervalMs: 0,
    mongooseModels: mongoose.modelNames(),
    predefinedSpec: predefinedSpec ? predefinedSpec : undefined,
  });
}

// Replace of body-parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Configuring the database and opening a global connection
require("./config/database");

// Passing the global passport object into the configuration function
require("./config/passport")(passport);

// Initialize the passport object on every request
app.use(passport.initialize());

app.use(cors());
app.options("*", cors());

/**
 * -------------- ROUTES ----------------
 */
// Imports all of the routes from ./routes/index.js
app.use(require("./routes"));

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
 * -------------- WEB SOCKET ----------------
 */

// INTERCEPT REQUESTS
if (process.env.NODE_ENV !== "production") {
  expressOasGenerator.handleRequests(app);
}

/**
 * -------------- SERVER ----------------
 */

const server = app.listen(process.env.PORT || 3000);
