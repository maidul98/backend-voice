const mongoose = require("mongoose");
const router = require("express").Router();
const axios = require("axios");
const passport = require("passport");
const Device = mongoose.model("Device");
const Math = require("mathjs");
const notificaionModule = require("../modules/notificaions");

router.post(
  "/add-device",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    Device.updateOne(
      { user: req.user._id },
      {
        user: req.user._id,
        fcmToken: req.body.fcmToken,
        active: true,
      },
      {
        upsert: true,
      }
    )
      .then(() => {
        res.json({ msg: "Device has been registered" });
      })
      .catch((error) => {
        next(error);
      });
  }
);

module.exports = router;
