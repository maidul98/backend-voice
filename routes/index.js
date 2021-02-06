const router = require("express").Router();

router.use("/users", require("./users"));

router.use("/posts", require("./posts"));

router.use("/comments", require("./comments"));

router.use("/replies", require("./replies"));

router.use("/votes", require("./votes"));

router.use("/authentication", require("./authentication"));

module.exports = router;
