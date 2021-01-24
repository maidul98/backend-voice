const mongoose = require("mongoose");
const router = require("express").Router();
const User = mongoose.model("User");
const passport = require("passport");
const utils = require("../lib/utils");

router.get(
  "/user",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    res.send(req.user);
    next();
  }
);

router.post("/login", function (req, res, next) {
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (!user) {
        res.status(401).json({ success: false, msg: "You are not registered" });
        next();
        return;
      }

      const isValid = utils.validPassword(
        req.body.password,
        user.hash,
        user.salt
      );
      if (isValid) {
        const jwt = utils.issueJWT(user);
        res.json({
          success: true,
          user: user,
          token: jwt.token,
          expiresIn: jwt.expires,
        });
      } else {
        res
          .status(401)
          .json({ success: false, msg: "Username or password is incorrect" });
        next();
      }
    })
    .catch((err) => {
      console.log(err);
      next();
    });
});

router.post("/register", function (req, res, next) {
  console.log(req.body);
  const saltHash = utils.genPassword(req.body.password);

  const salt = saltHash.salt;
  const hash = saltHash.hash;

  const newUser = new User({
    username: req.body.username,
    hash: hash,
    salt: salt,
    email: req.body.email,
  });

  newUser
    .save()
    .then((user) => {
      const jwt = utils.issueJWT(user);
      res.json({
        success: true,
        user: user,
        token: jwt.token,
        expiresIn: jwt.expires,
      });
      next();
    })
    .catch((err) => {
      const messages = [];
      if (err.name == "ValidationError") {
        res.status(422).json(err);
        next();
      } else {
        res.status(500).json(err);
        next();
      }
    });
});

router.post("/forgot", function (req, res, next) {
  const saltHash = utils.genPassword(req.body.password);
  const salt = saltHash.salt;
  const hash = saltHash.hash;

  const newUser = new User({
    username: req.body.username,
    hash: hash,
    salt: salt,
  });

  newUser
    .save()
    .then((user) => {
      const jwt = utils.issueJWT(user);
      res.json({
        success: true,
        user: user,
        token: jwt.token,
        expiresIn: jwt.expires,
      });
      next();
    })
    .catch((err) => next(err));
});

module.exports = router;
