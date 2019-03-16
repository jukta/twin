var assert = require('assert');
var db = require("../db");
var NodeCache = require( "node-cache" );

var userCache = new NodeCache({ stdTTL: 600, checkperiod: 60 });

module.exports = this;

db(function (c) {
    c.createCollection("users", function (err, res) {
        if (err) throw err;
        res.createIndex( { username: 1 }, {unique: true} );
        res.findOne({username: 'admin'}, function (err, done) {
            if (!done) {
                res.insertOne({username: 'admin', password: 'admin'}, function(err, res) {
                    if (err) throw err;
                });
            }

        });
    })
});

this.get = function (username, done) {
    var val = userCache.get(username);
    if (val) {
        done(null, val);
    } else {
        db(function (c) {
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
    db(function (c) {
        c.collection('users').find({}).toArray(function(err, result) {
            err ? done(err) : done(null, result);
        });
    });
};