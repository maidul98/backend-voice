const mongoose = require("mongoose");

const RegisterToken = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  phone_number: {
    type: Number,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
});

mongoose.model("RegisterToken", RegisterToken);
