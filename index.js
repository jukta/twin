'use strict';
var Promise = require('promise');
var app = require('./lib/server');
var base = require('./lib/base');
var data = require('./lib/data');

Promise.all([base(app), data(app)]).then(function () {
    resolve(app);
}).catch(function (reason) {
    reject(reason);
});

module.exports = app;