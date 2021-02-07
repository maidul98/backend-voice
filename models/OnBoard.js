const mongoose = require("mongoose");

const OnBoard = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  phone_number: {
    type: Number,
    required: true,
  },
});

mongoose.model("OnBoard", OnBoard);
