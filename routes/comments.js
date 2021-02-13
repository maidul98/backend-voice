const mongoose = require("mongoose");
const router = require("express").Router();
const axios = require("axios");
const passport = require("passport");
const Comment = mongoose.model("Comment");
const Votes = mongoose.model("Vote");
const Post = mongoose.model("Post");
const Math = require("mathjs");
const notificaionModule = require("../modules/notificaions");

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

      const newVotes = await Votes.create({
        vote_on_id: new_comment._id,
        upvoters: [req.user._id],
        voteCounts: 1,
      });

      await Post.updateOne({ _id: post._id }, { $inc: { comments_count: 1 } });

      const populated_comment = await Comment.findByIdAndUpdate(
        {
          _id: new_comment._id,
        },
        { votes: newVotes._id },
        { new: true }
      )
        .populate({
          path: "user",
          select:
            "-hash -salt -email -resetPasswordExpires -resetPasswordToken -suspended",
        })
        .populate("votes");

      // notificaionModule.sendNotificaion(sd)
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

//https://medium.com/hacking-and-gonzo/how-reddit-ranking-algorithms-work-ef111e33d0d9
function _confidence(ups, downs) {
  const n = ups + downs;

  if (n == 0) return 0;

  const z = 1.281551565545;
  const p = parseFloat(ups) / n;

  const left = p + (1 / (2 * n)) * z * z;
  const right = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  const under = 1 + (1 / n) * z * z;

  return (left - right) / under;
}

function confidence(ups, downs) {
  if (ups + downs == 0) {
    return 0;
  } else {
    return _confidence(ups, downs);
  }
}

router.get("/sort/best/:post_id", function (req, res, next) {
  const skip =
    req.query.skip && /^\d+$/.test(req.query.skip) ? Number(req.query.skip) : 0;

  Comment.find({ post: req.params.post_id }, undefined, { skip, limit: 10 })
    .populate("votes")
    .populate({ path: "user", select: "-hash -salt -email" })
    .then((comments) => {
      res.send(
        comments.sort(function (a, b) {
          const scoreA = confidence(
            a.votes.upvoters.length,
            a.votes.downvoters.length
          );
          const scoreB = confidence(
            b.votes.upvoters.length,
            b.votes.downvoters.length
          );
          let comp = 0;
          if (scoreA > scoreB) comp = -1;
          else if (scoreA < scoreB) comp = 1;
          return comp;
        })
      );
    })
    .catch((error) => next(error));
});

router.get("/sort/new/:post_id", function (req, res, next) {
  const skip =
    req.query.skip && /^\d+$/.test(req.query.skip) ? Number(req.query.skip) : 0;

  Comment.find(
    {
      post: req.params.post_id,
    },
    undefined,
    { skip, limit: 10 }
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

router.delete("/:comment_id", async function (req, res, next) {
  try {
    const comment = await Comment.findById({ _id: req.params.comment_id });

    if (!comment) throw new Error("No such comment");

    await Comment.remove({ _id: comment._id });
    res.json({ msg: "Your comment has been removed" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
