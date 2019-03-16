var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var config = require('config');

var mongodb;

var url = config.get('db.url') || "mongodb://localhost:27017";
var dbName = config.get('db.name') || "twin";

module.exports = function (done) {
    if (mongodb) {
        done(mongodb);
    } else {
        MongoClient.connect(url, {useNewUrlParser: true}, function (err, db) {
                assert.equal(null, err);
                mongodb = db.db(dbName);
                done(mongodb);
            }
        );
    }
};