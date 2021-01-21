const router = require("express").Router();

router.use("/users", require("./users"));

// router.use("/posts", require("./posts"));

// router.use("/comments", require("./comments"));

// router.use("/votes", require("./votes"));

module.exports = router;
