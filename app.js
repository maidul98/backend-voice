const express = require("express");
const cors = require("cors");
const path = require("path");
const passport = require("passport");
const fs = require("fs");
const mkdirp = require("mkdirp");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const swaggerUI = require("swagger-ui-express");
const admin = require("firebase-admin");
var app = express();

/**
 * -------------- LOAD MONGO MODELS ----------------
 */
require("./models/user");
require("./models/Post");
require("./models/Vote");
require("./models/Comment");
require("./models/Reply");
require("./models/OnBoard");
require("./models/Notification");
require("./models/Device");

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
 * -------------- FIRE BASE NOTIFICATIONS ----------------
 */
admin.initializeApp({
  credential: admin.credential.cert({
    type: "service_account",
    project_id: "voice-app-303802",
    private_key_id: "b9727cd1120a753cf645cd88e727bb2108c224ef",
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: "117153503833213314972",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-g9qw3%40voice-app-303802.iam.gserviceaccount.com",
  }),
});

/**
 * -------------- SERVER ----------------
 */

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

const server = app.listen(process.env.PORT || 3000);
