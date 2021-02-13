const mongoose = require("mongoose");
const router = require("express").Router();
const axios = require("axios");
const passport = require("passport");
const Comment = mongoose.model("Comment");
const Votes = mongoose.model("Vote");
const Notification = mongoose.model("Notification");
const Math = require("mathjs");
const admin = require("firebase-admin");

router.put(
  "/mark-as-read/:id",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    Notification.findOneAndUpdate(
      { _id: req.params.id },
      { $addToSet: { read_by: { readerId: req.user.id, read_at: Date.now() } } }
    )
      .then((result) => {
        if (!result) {
          res.status(500).json({ msg: "Unknown notification" });
        } else {
          res.json({ msg: "Notification has been marked as read" });
        }
      })
      .catch((error) => {
        next(error);
      });
  }
);

router.get(
  "/unread/",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    Notification.find({ receiver: { $in: { _id: req.user._id } } })
      .populate("receiver")
      .then((notifs) => {
        console.log(notifs);
        res.json(notifs);
      })
      .catch((ss) => {
        console.log(ss);
      });
  }
);

router.post(
  "/read/",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const new_push_notif = new Notification();
      new_push_notif.sender = req.user._id;
      new_push_notif.receiver = req.user._id;
      new_push_notif.message = req.user._id;
      await new_push_notif.save();
      res.json(new_push_notif);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
