var passport       = require('passport');
var LocalStrategy  = require('passport-local').Strategy;
var users = require('./service');

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, function (username, password, done) {
    users.get(username, function (err, res) {
        if (err || !res || res.password !== password) {
            done(null, false, {message: 'Incorrect user'});
        } else {
            done(null, res);
        }
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user.username);
});

passport.deserializeUser(function(id, done) {
    users.get(id, function (err, res) {
        done(null, res);
    });
});

module.exports = passport;