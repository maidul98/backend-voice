const fs = require("fs");
const path = require("path");
const User = require("mongoose").model("User");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const TwitterStrategy = require("passport-twitter").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

const pathToKey = path.join(__dirname, "..", "id_rsa_pub.pem");
const PUB_KEY = fs.readFileSync(pathToKey, "utf8");

// const options = {
//   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//   secretOrKey: PUB_KEY,
//   algorithms: ["RS256"],
// };

//passport middleware
const localAuth = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: PUB_KEY,
    algorithms: ["RS256"],
  },
  (payload, done) => {
    User.findOne({ _id: payload.sub })
      .then((user) => {
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      })
      .catch((err) => {
        done(err, null);
      });
  }
);

const twitterAuth = new TwitterStrategy(
  {
    consumerKey: "[TWITTERID]",
    consumerSecret: "[TWITTERSECRET]",
    callbackURL: "https://127.0.0.1:" + "/twitter-token", //this will need to be dealt with
  },
  function (token, tokenSecret, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
);

const googleAuth = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: "null",
  },
  async function (token, tokenSecret, profile, done) {
    try {
      let user = await grader.userWithEmailExists(profile._json.email);
      if (user == []) {
        return done(null, false, {
          message:
            "You are not listed are a listed grader. You are, please contact that course admin.",
        });
      }
      return done(null, user);
    } catch (error) {
      return done(null, false, {
        message: "Something went wrong, please try again later",
      });
    }
  }
);

// passport.use(
const facebookAuth = new FacebookStrategy(
  {
    clientID: "[FBID]",
    clientSecret: "[FBSECRET]",
    callbackURL: "https://127.0.0.1:" + "/facebook-token",
  },
  function (accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      // To keep the example simple, the user's Facebook profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Facebook account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
);
// );

module.exports = (passport) => {
  passport.use(localAuth);
};
