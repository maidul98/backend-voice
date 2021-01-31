const mongoose = require("mongoose");

const Vote = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  vote_on_id: { type: mongoose.Types.ObjectId, required: true },
  upvoters: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  downvoters: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  voteCounts: {
    default: 0,
    type: Number,
  },
});

mongoose.model("Vote", Vote);
