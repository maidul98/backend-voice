const mongoose = require("mongoose");

const Device = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fcmToken: { type: String, required: true },
  active: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

mongoose.model("Device", Device);
