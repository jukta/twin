'use strict';

var app = require('./lib/server');
var base = require('./lib/base');
var data = require('./lib/data');

base(app);
data(app);

module.exports = app;