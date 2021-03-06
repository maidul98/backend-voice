const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  body: {
    type: String,
    required: [true, "Comment cannot be empty"],
  },
  votes: {
    type: mongoose.Types.ObjectId,
    ref: "Vote",
  },
  post: {
    type: mongoose.Types.ObjectId,
    ref: "Post",
  },
  repliesCount: {
    type: Number,
    default: 0,
  },
});

mongoose.model("Comment", CommentSchema);
