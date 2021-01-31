const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema({
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
    required: true,
  },
  parent: {
    type: mongoose.Types.ObjectId,
    ref: "Comment",
  },
  replying_to_user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
});

mongoose.model("Reply", ReplySchema);
