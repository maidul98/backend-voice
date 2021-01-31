const mongoose = require("mongoose");
const User = require("./user");

const PostSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  caption: {
    type: String,
  },
  art_location: {
    type: String,
    default:
      "https://audio-social-network-post-art.s3.us-east-2.amazonaws.com/default.jpg",
  },
  votes: {
    type: mongoose.Types.ObjectId,
    ref: "Vote",
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  comments_count: {
    type: Number,
    default: 0,
  },
  audio_key: {
    type: String,
    required: true,
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
});

mongoose.model("Post", PostSchema);
