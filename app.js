const express = require("express");
const cors = require("cors");
const path = require("path");
const passport = require("passport");
const fs = require("fs");
const mkdirp = require("mkdirp");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const swaggerUI = require("swagger-ui-express");
var app = express();

/**
 * -------------- LOAD MONGO MODELS ----------------
 */
require("./models/user");
require("./models/Post");
require("./models/Vote");
require("./models/Comment");
require("./models/Reply");

/**
 * -------------- OPEN API ----------------
 */
let openAPIFilePath = "./documentation/api.json";
mkdirp.sync(path.parse(openAPIFilePath).dir);

predefinedSpec = JSON.parse(
  fs.readFileSync(openAPIFilePath, { encoding: "utf-8" })
);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(predefinedSpec));

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
 * Default error handler
 */
app.use(function (err, req, res, next) {
  console.log(err);
  if (err.name == "wrongFileTypeError") {
    res.status(422).json({ msg: err.message });
  } else {
    res.status(500).json({ msg: "Something went wrong, please try again" });
  }
});

/**
 * -------------- SERVER ----------------
 */

const server = app.listen(process.env.PORT || 3000);
