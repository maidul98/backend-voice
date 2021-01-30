const mongoose = require("mongoose");
const router = require("express").Router();
const axios = require("axios");
const passport = require("passport");
const Comment = mongoose.model("Comment");
const Post = mongoose.model("Post");

router.post(
  "/:post_id",
  passport.authenticate("jwt", { session: false }),
  async function (req, res, next) {
    try {
      const post = await Post.findById(req.params.post_id);
      const new_comment = new Comment();
      new_comment.body = req.body.body;
      new_comment.post = post._id;
      new_comment.user = req.user._id;
      await new_comment.save();

      const populated_comment = await Comment.populate(new_comment, {
        path: "user",
        select:
          "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
      });

      await Post.updateOne({ _id: post._id }, { $inc: { comments_count: 1 } });

      res.send(populated_comment);
    } catch (err) {
      if (err.name != undefined && err.name == "ValidationError") {
        res.status(422).json(err);
      } else {
        next(err);
      }
    }
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

router.get("/all/:post_id", async function (req, res, next) {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) throw new Error("No such post");

    const comments = await Comment.find({ post: post._id });
    res.send(comments);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
