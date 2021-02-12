const mongoose = require("mongoose");
const router = require("express").Router();
const User = mongoose.model("User");
const Post = mongoose.model("Post");
const OnBoard = mongoose.model("OnBoard");
const passport = require("passport");
const utils = require("../lib/utils");
const twilio = require("twilio");
var twilioClient = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  { lazyLoading: true }
);

router.post("/send-otp/:phone_number", function (req, res, next) {
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
    const onboardExists = await User.findOne({
      phone_number: req.params.phone_number,
    }).countDocuments((limit = 1));
    const user = await User.findOne({
      phone_number: req.params.phone_number,
    });

    console.log(user);

    if (!onboardExists) {
      return res.status(401).json({
        success: false,
        msg: "You are not registered yet, please sign up!",
      });
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
      res.status(422).json({ msg: "The code you entered is incorrect" });
      next();
    }
  } catch (error) {
    return res.status(410).send({
      msg: "The code you have entered has expired, please request a new one",
    });
  }
});

/**
 * Will send token only if the code is valid and the phone number isn't yet asisged to a user
 */
router.post(
  "/onboard/verify-otp/:phone_number/:code",
  async function (req, res, next) {
    try {
      const userWithThisPhoneNum = await User.find({
        phone_number: req.params.phone_number,
      }).countDocuments((limit = 1));

      if (userWithThisPhoneNum)
        return res.status(400).json({
          msg:
            "This user already exists. If this is your account, please login",
        });

      const verification = await twilioClient.verify
        .services(process.env.TWILIO_SID)
        .verificationChecks.create({
          to: "+" + req.params.phone_number,
          code: req.params.code,
        });

      console.log(req.params.code);
      console.log(verification);

      if (verification.status == "approved") {
        const onBoard = await OnBoard.findOneAndUpdate(
          { phone_number: req.params.phone_number },
          { phone_number: req.params.phone_number },
          { upsert: true, new: true }
        );

        const jwt = utils.issueJWT(onBoard, ""); // get JTW without Bear
        return res.json({
          token: jwt.token,
          expiresIn: jwt.expires,
        });
      } else {
        return res
          .status(422)
          .json({ msg: "The code you entered is incorrect" });
      }
    } catch (error) {
      console.log(error);
      res.status(422).json({
        msg: "The code you have entered has expired, please request a new one",
      });
    }
  }
);

router.post("/onboard/check-username/:username", async (req, res, next) => {
  try {
    const payload = utils.verifyJWT(req.body.onboard_token);
    const onboard_id = payload.sub;
    const onboardExists = await OnBoard.findOne({
      _id: onboard_id,
    }).countDocuments((limit = 1));
    if (!onboardExists)
      return res
        .status(401)
        .json({ msg: "Your session has expired, please start over" });

    const userNameExists = await User.findOne({
      username: req.params.username,
    }).countDocuments((limit = 1));

    if (userNameExists) {
      res.send({ msg: "This username is taken", taken: true });
    } else {
      res.send({ msg: "This username is all yours", taken: false });
    }
  } catch (error) {
    if (error.name == "JsonWebTokenError") {
      return res.status(401).json({
        msg: "Your session has expired, please start over",
      });
    } else {
      next(error);
    }
  }
  res.send(req.user);
  next();
});

router.post("/onboard/register-username", async function (req, res, next) {
  try {
    const payload = utils.verifyJWT(req.body.onboard_token);
    const onboard_id = payload.sub;
    const onboardCollection = OnBoard.findOne({ _id: onboard_id });
    const onboardObject = await onboardCollection;
    const onboardExists = await onboardCollection.countDocuments((limit = 1));
    if (!onboardExists)
      return res
        .status(401)
        .json({ msg: "Your session has expired, please start over" });

    const newUser = new User({
      username: req.body.username,
      phone_number: onboardObject.phone_number,
    });

    const user = await newUser.save();
    const jwt = utils.issueJWT(newUser); // with bear prefix
    res.json({
      success: true,
      user: user,
      token: jwt.token,
      expiresIn: jwt.expires,
    });
    await OnBoard.findByIdAndDelete({ _id: onboardObject._id });
  } catch (error) {
    console.log(error);
    if (error.name == "ValidationError") {
      return res.status(422).json(error);
    } else if (error.name == "JsonWebTokenError") {
      return res.status(401).json({
        msg: "Your session has expired, please start over",
      });
    } else {
      return res.status(500).json({
        msg: "Something went wrong. Please try again later",
      });
    }
  }
});

module.exports = router;
