const mongoose = require("mongoose");
const router = require("express").Router();
const User = mongoose.model("User");
const Post = mongoose.model("Post");
const passport = require("passport");
const utils = require("../lib/utils");
const twilio = require("twilio");
var twilioClient = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  { lazyLoading: true }
);

router.post("/send-sms-verificacion/:phone_number", function (req, res, next) {
  twilioClient.verify
    .services(process.env.TWILIO_SID)
    .verifications.create({ to: "+" + req.params.phone_number, channel: "sms" })
    .then((verification) => {
      res.json({ msg: "A verification code has been sent" });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        msg:
          "Something went wrong when sending the verification code to this number",
      });
    });
});

router.post("/login/:phone_number/:code", async function (req, res, next) {
  try {
    const user = await User.findOne({ phone_number: req.params.phone_number });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, msg: "You are not registered" });
    }

    const verification = await twilioClient.verify
      .services(process.env.TWILIO_SID)
      .verificationChecks.create({
        to: "+" + req.params.phone_number,
        code: req.params.code,
      });

    if (verification.status == "approved") {
      const jwt = utils.issueJWT(user);
      res.json({
        user: user,
        token: jwt.token,
        expiresIn: jwt.expires,
      });
    } else {
      res.status(401).json({ msg: "The code you entered is incorrect" });
      next();
    }
  } catch (error) {
    return res.status(422).send({
      msg: "The code you have entered has expired, please request a new one",
    });
  }
});

router.post("/register/:phone_number/:code", async function (req, res, next) {
  try {
    const newUser = new User({
      username: req.body.username,
      phone_number: req.params.phone_number,
      email: req.body.email,
    });

    var user = await newUser.save();

    const verification = await twilioClient.verify
      .services(process.env.TWILIO_SID)
      .verificationChecks.create({
        to: "+" + req.params.phone_number,
        code: req.params.code,
      });

    if (verification.status == "approved") {
      const jwt = utils.issueJWT(user);
      res.json({
        success: true,
        user: user,
        token: jwt.token,
        expiresIn: jwt.expires,
      });
    } else {
      return res.status(422).json({ msg: "The code you entered is incorrect" });
    }
  } catch (error) {
    console.log(error);
    if (error.name == "ValidationError") {
      res.status(422).json(error);
    } else {
      // remove the account created
      await User.remove(
        { _id: user._id },
        {
          justOne: true,
        }
      );
      res.status(422).json({
        msg: "The code you have entered has expired, please request a new one",
      });
    }
  }
});

module.exports = router;
