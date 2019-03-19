var db = require("../db");
var NodeCache = require( "node-cache" );

var userCache = new NodeCache({ stdTTL: 600, checkperiod: 60 });

var self = this;

db(function (err, c) {
    if (err) done(err);
    c.createCollection("users", function (err, res) {
        if (err) throw done(err);
        res.createIndex( { username: 1 }, {unique: true}, function (mongoError) {
            res.findOne({username: 'admin'}, function (err, d) {
                if (err) done(err);
                if (!d) {
                    res.insertOne({username: 'admin', password: 'admin'}, function(err, res) {
                        if (err) done(err);
                        done(null, self);
                    });
                } else {
                    done(null, self);
                }
            });
        });
    })
});

var done = function(err, v) {
    if (err) {
        console.log("Users service error");
    } else {
        console.log("User service is ready")
    }
};


this.get = function (username, done) {
    var val = userCache.get(username);
    if (val) {
        done(null, val);
    } else {
        db(function (err, c) {
            c.collection('users').findOne({username: username}, function (err, result) {
                if (err) {
                    done(err);
                } else {
                    userCache.set(username, result);
                    done(null, result);
                }
            });
        });
    }
};

this.getAll = function(done) {
    db(function (err, c) {
        if (err) return done(err);
        c.collection('users').find({}).toArray(function(err, result) {
            err ? done(err) : done(null, result);
        });
    });
};

module.exports = this;