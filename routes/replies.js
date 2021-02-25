const mongoose = require("mongoose");
const router = require("express").Router();
const axios = require("axios");
const passport = require("passport");
const Comment = mongoose.model("Comment");
const Reply = mongoose.model("Reply");
const Post = mongoose.model("Post");
const User = mongoose.model("User");
const notificaionModule = require("../modules/notificaions");

router.post(
  "/new/:id",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const parent = await Comment.findOneAndUpdate(
        { _id: req.params.id },
        { $inc: { repliesCount: 1 } },
        { upsert: false, new: true }
      );

      const replying_to_user = await User.findById({
        _id: req.body.replying_to_user,
      });

      const new_reply = new Reply();
      new_reply.body = req.body.body;
      new_reply.parent = parent._id;
      new_reply.user = req.user._id;
      new_reply.replying_to_user = req.body.replying_to_user;

      await new_reply.save();

      const populated_with_user = await Reply.populate(new_reply, {
        path: "user",
        select:
          "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
      });

      const fully_populated = await Reply.populate(populated_with_user, {
        path: "replying_to_user",
        select:
          "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
      });

      notificaionModule.sendNotificaion(
        req.user._id,
        parent.user._id,
        req.body.body,
        `${req.user.username} replied to your comment`
      );

      res.send(fully_populated);
    } catch (err) {
      if (err.name != undefined && err.name == "ValidationError") {
        res.status(422).json(err);
      } else {
        next(err);
      }
    }
  }
);

router.get(
  "/:comment_id",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const comment = await Comment.findById(req.params.comment_id);
      const skip =
        req.query.skip && /^\d+$/.test(req.query.skip)
          ? Number(req.query.skip)
          : 0;
      const replies = await Reply.find({ parent: comment._id }, undefined, {
        skip,
        limit: 10,
      })
        .populate({
          path: "replying_to_user",
          select:
            "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
        })
        .populate({
          path: "user",
          select:
            "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
        });
      if (!comment) throw new Error("No such comment");
      if (!replies) throw new Error("No replies");
      res.send(replies);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
