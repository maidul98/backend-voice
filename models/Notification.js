const mongoose = require("mongoose");

const Notification = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Notification creator
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Ids of the receivers of the notification
  message: { type: String, required: true },
  title: { type: String, required: true },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

mongoose.model("Notification", Notification);
