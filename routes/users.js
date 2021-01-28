const mongoose = require("mongoose");
const router = require("express").Router();
const User = mongoose.model("User");
const passport = require("passport");
const utils = require("../lib/utils");
const multer = require("multer");
const multerS3 = require("multer-s3");
const nodemailer = require("nodemailer");
const path = require("path");
const AWS = require("aws-sdk");
const AWS_config = require("../config/aws.js");
const crypto = require("crypto");

/**
 * Uploading profiles to S3
 */
const s3 = new AWS.S3(AWS_config.config, {
  signatureVersion: "v4",
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
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + path.extname(file.originalname));
    },
  }),
});

/**
 * Sending emails
 */
let transporter = nodemailer.createTransport({
  SES: new AWS.SES(AWS_config.config, {
    apiVersion: "2010-12-01",
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

router.post("/password-reset/:token", function (req, res, next) {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  }).then((user) => {
    if (!user) {
      res
        .status(410)
        .json({ msg: "Password reset token is invalid or has expired." });
    } else {
      const saltHash = utils.genPassword(String(req.body.new_password));
      const salt = saltHash.salt;
      const hash = saltHash.hash;

      User.update(
        { username: req.params.username },
        {
          salt: salt,
          hash: hash,
        }
      )
        .then((user) => {
          const jwt = utils.issueJWT(user);
          res.json({
            msg: "Your password has been reset successfully",
            user: user,
            token: jwt.token,
            expiresIn: jwt.expires,
          });
          next();
        })
        .catch((err) => next(err));
    }
  });
});

router.put("/request-password-reset/:username", function (req, res, next) {
  const token = crypto.randomBytes(20).toString("hex");
  User.findOne({ username: req.params.username })
    .then((user) => {
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      user.save().then(() => {
        let fieldheader =
          `You're receiving this e-mail because you or someone else has requested a password reset for your user account. <br> <br> Click the link below to reset your password: <br> ` +
          `https://www.ourwebsite.com/?passwordreset=` +
          token +
          `<br> <br> If you did not request a password reset you can safely ignore this email.`;
        transporter
          .sendMail({
            from: "maidul98@gmail.com",
            to: "maidul98@gmail.com",
            subject: "Password reset request",
            html: fieldheader,
          })
          .then((info) => {
            res.json({
              msg:
                "If an account exists with this username, an email will be sent shorty",
            });
          });
      });
    })
    .catch((err) => {
      res.json({
        msg:
          "If an account exists with this username, an email will be sent shorty",
      });
    });
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
    ).then((user) => {
      res.json({ msg: "Your profile image has been updated" });
    });
  }
);

module.exports = router;
