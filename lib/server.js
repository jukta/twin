var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');

var app = express();

app.adminRouter = express.Router();
app.baseRouter = express.Router();
app.initRouter = express.Router();

app.staticRouter = express.Router();
app.staticRouter._use = app.staticRouter.use;
app.staticRouter.use = function use(fn) {
    app.staticRouter.stack.reverse();
    app.staticRouter._use(fn);
    app.staticRouter.stack.reverse();
};

app.services = {};

app._render = app.render;
app.render = function render(name, options, callback) {
  options['__req'] = app.request;
  options['__res'] = app.response;

  for (var s in app.services) {
      options[s] = app.services[s];
  }

  app._render(name, options, callback);
};

app.use(app.staticRouter);
if (process.env.NODE_ENV === "development") {
    app.use(logger('dev'));
}
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser());
app.use(session({ secret: 'SECRET' }));

require('underscore-express')(app);
var View = require('./view')(app);

var views = [];
views.push(path.join(__dirname, '../views'));

app.set('views', views);
app.set('view engine', 'tmpl');
app.set('view', View);

app.use(app.initRouter);
app.use('/admin', app.adminRouter);
app.use(app.baseRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error', {err: err});
});


module.exports = app;