'use strict';

var controller = require("./controller");
var service = require("./service");
var passport = require("./security");
var moment = require('moment');
var _ = require('underscore');
var createError = require('http-errors');
var Promise = require('promise');

module.exports = function(app) {

    app.initRouter.use(passport.initialize());
    app.initRouter.use(passport.session());

    app.baseRouter.get('/login', function (req, res) {
        res.render('login', {});
    });

    app.baseRouter.post('/login', passport.authenticate('local',
        {
            successReturnToOrRedirect: '/',
            failureRedirect: '/login'
        }));

    app.adminRouter.use(function (req, res, next) {
        if (req.isAuthenticated()) {
            var roles = req.user.roles;
            if (roles && _.contains(roles, 'admin')) {
                next();
            } else {
                next(createError(403, "forbidden"));
            }

        } else {
            req.session.returnTo = req.originalUrl;
            res.redirect('/login');
        }
    });

    app.adminRouter.use(controller);
    app.services['users'] = service;
    app.services['moment'] = moment;
    return Promise.resolve(app);
};