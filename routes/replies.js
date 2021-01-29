const mongoose = require("mongoose");
const router = require("express").Router();
const axios = require("axios");
const passport = require("passport");
const Comment = mongoose.model("Comment");
const Reply = mongoose.model("Reply");
const Post = mongoose.model("Post");

router.post(
  "/:comment_id",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    Comment.findById(req.params.comment_id)
      .then((comment) => {
        if (comment) {
          const reply = new Reply();
          new_comment.body = req.body.reply;
          new_comment.comment_id = post._id;
          new_comment.user = req.user._id;

          Reply.populate(reply, {
            path: "user",
            select:
              "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
          })
            .then((new_reply) => {
              res.send(new_reply);
            })
            .catch((error) => {
              next(error);
            });
        } else {
          throw next(Error("comment not found"));
        }
      })
      .catch((error) => {
        if (err.name == "ValidationError") {
          res.status(422).json(err);
        } else {
          next(error);
        }
      });
  }
);

module.exports = router;
