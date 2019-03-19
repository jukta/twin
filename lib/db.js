var MongoClient = require('mongodb').MongoClient;
var config = require('config');

var mongodb;

var url = config.get('db.url') || "mongodb://localhost:27017";
var dbName = config.get('db.name') || "twin";

module.exports = function (done) {
    if (mongodb) {
        done(null, mongodb);
    } else {
        MongoClient.connect(url, {useNewUrlParser: true}, function (err, db) {
            if (err) {
                return done(err);
            }
            mongodb = db.db(dbName);
            return done(null, mongodb);
        });
    }
};