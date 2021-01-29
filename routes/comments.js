const mongoose = require("mongoose");
const router = require("express").Router();
const axios = require("axios");
const passport = require("passport");
const Comment = mongoose.model("Comment");
const Post = mongoose.model("Post");

router.post(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    Post.findById(req.params.id)
      .then((post) => {
        if (post) {
          const new_comment = new Comment();
          new_comment.body = req.body.comment;
          new_comment.post = post._id;
          new_comment.user = req.user._id;

          Comment.populate(new_comment, {
            path: "user",
            select:
              "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
          })
            .then((newComment) => {
              Post.updateOne(
                { _id: post._id },
                { $inc: { comments_count: 1 } }
              ).then(() => res.send(newComment));
            })
            .catch((error) => {
              console.log(error);
              next(error);
            });
        } else {
          throw next(Error("Post not found"));
        }
      })
      .catch((error) => next(error));
  }
);

router.get("/new/:post_id", function (req, res, next) {
  const skip =
    req.query.skip && /^\d+$/.test(req.query.skip) ? Number(req.query.skip) : 0;

  Comment.find(
    {
      post: req.params.post_id,
    },
    undefined,
    { skip, limit: 3 }
  )
    .populate({
      path: "user",
      select:
        "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
    })
    .sort({ createdAt: -1 })
    .then((result) => {
      res.send(result);
    })
    .catch((err) => next(err));
});

router.put("/:comment_id", function (req, res, next) {
  Comment.findOneAndUpdate(
    {
      id_: req.params.comment_id,
    },
    {
      body: req.body.body,
    }
  )
    .populate({
      path: "user",
      select:
        "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
    })
    .then((result) => {
      res.send(result);
    })
    .catch((err) => next(err));
});

router.get("single/:comment_id", function (req, res, next) {
  Comment.findOne({
    id_: req.params.comment_id,
  })
    .populate({
      path: "user",
      select:
        "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
    })
    .then((result) => {
      res.send(result);
    })
    .catch((err) => next(err));
});

module.exports = router;
