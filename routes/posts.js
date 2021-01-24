const mongoose = require("mongoose");
const router = require("express").Router();
const axios = require("axios");
const Post = mongoose.model("Post");
const Votes = mongoose.model("Vote");
const passport = require("passport");
const utils = require("../lib/utils");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  signatureVersion: "v4",
  region: "us-east-2",
});

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_VOICE_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + ".mp3");
    },
  }),
});

/**
 * Get post by id
 */
router.get("/single/:id", function (req, res, next) {
  Post.findById(req.params.id)
    .populate({ path: "user", select: "-hash -salt -email" })
    .populate("votes")
    .then((post) => {
      res.send(post);
      next();
    })
    .catch(function (err) {
      res.status(500).json({ msg: "There was an error" });
      next();
    });
});

// /**
//  * Get all posts ordered by time
//  */
// router.get("/new", function (req, res, next) {
//   const skip =
//     req.query.skip && /^\d+$/.test(req.query.skip) ? Number(req.query.skip) : 0;
//   let query = {};
//   if (req.query.classId != undefined) {
//     query = { class_id: req.query.classId };
//   }

//   Post.find(query, undefined, { skip, limit: 20 })
//     .populate("class_id")
//     .populate("votes")
//     .populate({ path: "user", select: "-hash -salt -email" })
//     .sort({ createdAt: -1 })
//     .then((data) => res.send(data))
//     .catch((error) => console.log(error));
// });

/**
 * return all posts ordered by time and highest votes
 * Formula is the same as the Reddit "Hot" algorithm, found here:
 * https://medium.com/hacking-and-gonzo/how-reddit-ranking-algorithms-work-ef111e33d0d9
 */

function hot(score, date) {
  var order = Math.log(Math.max(Math.abs(score), 1)) / Math.LN10;
  var sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  var seconds = date.getTime() / 1000 - 1134028003;
  var product = order + (sign * seconds) / 45000;
  return Math.round(product * 10000000) / 10000000;
}

router.get("/trending-posts", function (req, res, next) {
  let query = {};
  if (req.query.classId != undefined) {
    query = { class_id: req.query.classId };
  }

  const skip =
    req.query.skip && /^\d+$/.test(req.query.skip) ? Number(req.query.skip) : 0;

  Post.find(query, undefined, { skip, limit: 10 })
    .populate("votes")
    .populate({ path: "user", select: "-hash -salt -email" })
    .then((posts) => {
      res.send(
        posts.sort(function (a, b) {
          const scoreA = hot(a.votes.voteCounts, a.createdAt);
          const scoreB = hot(b.votes.voteCounts, b.createdAt);
          var comp = 0;
          if (scoreA > scoreB) comp = -1;
          else if (scoreA < scoreB) comp = 1;
          return comp;
        })
      );
      next();
    })
    .catch((error) => console.log(error));
});

/**
 * Make a post
 */
router.post(
  "/new",
  [passport.authenticate("jwt", { session: false }), upload.single("photos")],
  async function (req, res, next) {
    console.log(req.file);
    Post.create({
      caption: req.body.caption,
      user: req.user._id,
      audio_key: req.file.key,
    })
      .then((post) => {
        Votes.create({
          post: post._id,
          upvoters: [req.user._id],
          voteCounts: 1,
        }).then((newVotes) => {
          Post.findByIdAndUpdate(
            {
              _id: post._id,
            },
            { votes: newVotes._id },
            { new: true }
          )
            .populate("votes")
            .then((updatedPost, obj) => {
              res.send(updatedPost);
              next();
            });
        });
      })
      .catch((error) => {
        console.log(error);
        res.status(500);
        next();
      });
  }
);

/**
 * Make a post
 */
router.get(
  "/audio/:audio_key",
  [passport.authenticate("jwt", { session: false })],
  async function (req, res, next) {
    try {
      const audio_key = req.params.audio_key;
      const signedUrlExpireSeconds = 60 * 5;
      const url = s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_VOICE_BUCKET,
        Key: audio_key,
        Expires: signedUrlExpireSeconds,
      });

      res.json({ audio_location: url });
      next();
    } catch (err) {
      res.status(400).json({ msg: "Something went wrong" });
      next();
    }
  }
);

module.exports = router;
