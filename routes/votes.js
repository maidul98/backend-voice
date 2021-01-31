const mongoose = require("mongoose");
const router = require("express").Router();
const Vote = mongoose.model("Vote");
const passport = require("passport");

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      var counterInc = 0;
      var voterType = null;

      let requestBody = req.body;
      let vote_on_id = requestBody["vote_on_id"];

      if (requestBody["voteType"] == "") {
        let changed = false;
        let voteChange = 0;

        const isInDownVote = await Vote.updateOne(
          { vote_on_id: vote_on_id },
          {
            $pull: {
              downvoters: req.user._id,
            },
          }
        );

        if (isInDownVote.nModified > 0) {
          changed = true;
          voteChange = 1;
        } else {
          const isInUpVote = await Vote.updateOne(
            { vote_on_id: vote_on_id },
            {
              $pull: {
                upvoters: req.user._id,
              },
            }
          );

          if (isInUpVote.nModified > 0) {
            changed = true;
            voteChange = -1;
          }
        }

        if (changed == true) {
          await Vote.updateOne(
            { vote_on_id: vote_on_id },
            {
              $inc: {
                voteCounts: voteChange,
              },
            }
          );
        }
      }

      if (requestBody["voteType"] == "up") {
        voterType = "upvoters";
        await Vote.updateOne(
          { vote_on_id: vote_on_id },
          {
            $pull: {
              downvoters: req.user._id,
            },
          },
          (error, result) => {
            if (result.nModified > 0) {
              counterInc = 2;
            } else {
              counterInc = 1;
            }
          }
        );
      } else if (requestBody["voteType"] == "down") {
        voterType = "downvoters";
        await Vote.updateOne(
          { vote_on_id: vote_on_id },
          {
            $pull: {
              upvoters: req.user._id,
            },
          },
          (error, result) => {
            if (result.nModified > 0) {
              counterInc = -2;
            } else {
              counterInc = -1;
            }
          }
        );
      }

      if (requestBody["voteType"] !== "") {
        const voterTypeObj = {};
        voterTypeObj[voterType] = req.user._id;

        Vote.updateOne(
          { vote_on_id: vote_on_id },
          {
            $addToSet: voterTypeObj,
          },
          async (error, result) => {
            if (result.nModified > 0) {
              await Vote.updateOne(
                { vote_on_id: vote_on_id },
                {
                  $inc: {
                    voteCounts: counterInc,
                  },
                }
              );
            }
          }
        );
      }
      res.json({ success: true, msg: "voted" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
