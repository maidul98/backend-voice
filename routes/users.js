const mongoose = require("mongoose");
const router = require("express").Router();
const User = mongoose.model("User");
const passport = require("passport");
const utils = require("../lib/utils");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const path = require("path");

/**
 * Uploading profiles to S3
 */
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  signatureVersion: "v4",
  region: "us-east-2",
});

const uploadProfile = multer({
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      return callback(new Error("Only .jpg, .png and .jpeg allowed"));
    }
    callback(null, true);
  },
  // limits: {
  //   fileSize: 1024 * 1024,
  // },
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_PROFILE_BUCKET,
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + path.extname(file.originalname));
    },
  }),
});

router.get(
  "/user",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    res.send(req.user);
    next();
  }
);

router.post("/login", function (req, res, next) {
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (!user) {
        res.status(401).json({ success: false, msg: "You are not registered" });
        next();
        return;
      }

      const isValid = utils.validPassword(
        req.body.password,
        user.hash,
        user.salt
      );
      if (isValid) {
        const jwt = utils.issueJWT(user);
        res.json({
          success: true,
          user: user,
          token: jwt.token,
          expiresIn: jwt.expires,
        });
      } else {
        res
          .status(401)
          .json({ success: false, msg: "Username or password is incorrect" });
        next();
      }
    })
    .catch((err) => {
      console.log(err);
      next();
    });
});

router.post("/register", function (req, res, next) {
  const saltHash = utils.genPassword(req.body.password);

  const salt = saltHash.salt;
  const hash = saltHash.hash;

  const newUser = new User({
    username: req.body.username,
    hash: hash,
    salt: salt,
    email: req.body.email,
  });

  newUser
    .save()
    .then((user) => {
      const jwt = utils.issueJWT(user);
      res.json({
        success: true,
        user: user,
        token: jwt.token,
        expiresIn: jwt.expires,
      });
      next();
    })
    .catch((err) => {
      const messages = [];
      if (err.name == "ValidationError") {
        res.status(422).json(err);
        next();
      } else {
        res.status(500).json(err);
        next();
      }
    });
});

router.post("/forgot", function (req, res, next) {
  const saltHash = utils.genPassword(req.body.password);
  const salt = saltHash.salt;
  const hash = saltHash.hash;

  const newUser = new User({
    username: req.body.username,
    hash: hash,
    salt: salt,
  });

  newUser
    .save()
    .then((user) => {
      const jwt = utils.issueJWT(user);
      res.json({
        success: true,
        user: user,
        token: jwt.token,
        expiresIn: jwt.expires,
      });
      next();
    })
    .catch((err) => next(err));
});

router.post(
  "/upload-profile-image",
  [
    passport.authenticate("jwt", { session: false }),
    uploadProfile.single("profile_img"),
  ],
  function (req, res, next) {
    User.findOneAndUpdate(
      { _id: req.user._id },
      {
        img_location: req.file.location,
      }
    ).then((user) => {});
    res.json({ msg: "Your profile image has been updated" });
  }
);

module.exports = router;
