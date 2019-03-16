module.exports = function(options, callback) {
    options['users'].getAll(function (err, result) {
        callback(err, {userList: result});
    });
};