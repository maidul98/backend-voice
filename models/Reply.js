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
  to_id: {
    type: mongoose.Types.ObjectId, // can be a comment id or reply id
  },
});

mongoose.model("Reply", ReplySchema);
