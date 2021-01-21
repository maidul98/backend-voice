const mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

var validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: [true, "Username is taken, please try a new username"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  hash: String,
  salt: String,
  verified: {
    type: Boolean,
    default: false,
  },
  suspended: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    required: true,
    validate: [validateEmail, "Please enter a valid Cornell email"],
    unique: [true, "This email is already in use"],
  },
});

UserSchema.plugin(uniqueValidator), { message: "{PATH} is already in use" };

mongoose.model("User", UserSchema);
