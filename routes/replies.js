const mongoose = require("mongoose");
const router = require("express").Router();
const axios = require("axios");
const passport = require("passport");
const Comment = mongoose.model("Comment");
const Reply = mongoose.model("Reply");
const Post = mongoose.model("Post");

router.post(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const comment_or_reply = await (req.body.response_type == "comment"
        ? Comment.findById(req.params.id)
        : Reply.findById(req.params.id));

      const new_reply = new Reply();
      new_reply.body = req.body.body;
      new_reply.to_id = comment_or_reply._id;
      new_reply.user = req.user._id;
      await new_reply.save();

      const populated_reply = await Reply.populate(new_reply, {
        path: "user",
        select:
          "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
      });

      res.send(populated_reply);
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
      const replies = await Reply.find({ to_id: comment._id });
      if (!comment) throw new Error("No such comment");
      if (!comment) throw new Error("No replies");
      res.send(replies);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
