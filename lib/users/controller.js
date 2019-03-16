var express = require('express');
var router = express.Router();

var service = require("./service");

router.get("/users", function (req, res, next) {
    res.render("admin/users");
});

router.post("/user", function (req, res, next) {
    res.render("admin/users");
});

module.exports = router;