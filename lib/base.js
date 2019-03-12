var express = require('express');
var path = require('path');
var assert = require('assert');
var fs = require('fs');

var dynamicRouter = express.Router();
var routing = {};
var data = {};

try {
  routing = require(path.join(process.cwd(), 'config/routing.json'));
} catch (e) {}

module.exports = function (app) {

  app.staticRouter.use(express.static(path.join(process.cwd(), 'public')));
  app.baseRouter.use(dynamicRouter);

  loadRoutes(routing);

  app.baseRouter.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  });
};

var loadRoutes = function(routing) {
  dynamicRouter.stack = [];
  for (var i = 0; i < routing.length; i++) {
    var route = routing[i];
    addRoute(route, dynamicRouter);
  }
};

var addRoute = function (route, router) {
  var template = route.template;
  router.get(route.uri, function (req, res, next) {
    res.render(template, route.data);
  });
};
