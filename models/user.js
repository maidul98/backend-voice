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
    required: [true, "Your username cannot be blank."],
    minlength: [4, "Username must be at least 2 characters."],
    maxlength: [20, "Username must be less than 20 characters."],
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
    required: [true, "Your email cannot be blank."],
    validate: [validateEmail, "Please enter a valid email"],
    unique: true,
  },
});

UserSchema.plugin(uniqueValidator),
  { message: "{ message: '{PATH} must be unique' }" };

mongoose.model("User", UserSchema);
