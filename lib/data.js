var fs = require('fs');
var path = require('path');
var eval = require('eval');
var Promise = require('promise');

var __file = function (str) {
    return fs.readFileSync(str).toString();
};

var walkSync = function(dir, data) {
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    data = data || {};
    files.forEach(function(file) {
        if (fs.statSync(dir + '/' + file).isDirectory()) {
            data[file] = {};
            walkSync(dir + '/' + file, data[file]);
        }
        else {
            var i = file.lastIndexOf('.json');
            if (i > 0) {
                var str = fs.readFileSync(path.join(dir, file)).toString();
                var s = eval("exports.x = " + str, {file: function (f) {
                        return __file(path.join(dir, f));
                    }});
                // var s = require(path.join(dir, file));
                data[file.substring(0,i)] = s.x;
            }
        }
    });
};

module.exports = function (app) {
    return new Promise(function (resolve, reject) {
        try {
            walkSync(path.join(process.cwd(), 'data'), app.services);
            resolve(app);
        } catch (e) {
            reject(e);
        }
    });
};
