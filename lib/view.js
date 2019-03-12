var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var uuid = require('uuid');
var server;

function View(name, options) {
    this.dirs = options.root;

    this.engine = options.engines['.tmpl'];
    this.path = resolve(options, name);
    this.name = path.basename(name);
}

View.prototype.render = function render(options, callback) {

    options.root = this.dirs;

    var engine = this.engine;

    var parts = {};
    var body = [];
    var count = 0;

    options["__name"] = options["__name"] || this.name;

    options.incl = function (rel, extraOptions) {
        var p = resolve(options, rel, options["__name"]);

        var id = uuid.v4();
        count++;

        if (typeof p === 'function') {
            p(options, function (tmpl, opt) {
                count--;
                parts[id] = options.incl(tmpl, opt);
            });
        } else {
            engine(p, _.extend({}, options, extraOptions), function (err, str) {
                if (process.env.NODE_ENV === "development") {
                    str = "<!--" + p + "-->" + str + "<!--/" + p + "-->";
                }
                parts[id] = str;
                count--;
                if (count === 0) end(parts, body[0], callback);
            });
        }
        return id;
    };

    if (typeof this.path === 'function') {
        this.path(options, function (options, tmpl) {
            options.incl(tmpl, options);
        });
    } else {
        engine(this.path, options, function (err, str) {
            body[0] = str;
            if (count === 0) end(parts, body[0], callback);
        });
    }

};

var end = function (parts, body, callback) {
    var f = true;
    while (f) {
        f = false;
        for (var p in parts) {
            if (parts.hasOwnProperty(p)) {
                f = true;
                var b = body.replace(p, parts[p]);
                if (b !== body) delete parts[p];
                body = b;
            }
        }
    }
    callback(null, body);

};

var resolve = function(options, name, dir) {

    var names = [];
    if (dir) {
        names.push(path.join(dir, name));
    }

    names.push(name);
    var n = name;

    while (true) {
        var idx = n.lastIndexOf("-");
        if (idx === -1) break;
        n = n.substring(0, idx);
        names.push(n);
    }

    for (var i = options.root.length - 1; i >= 0; i--) {

        for (var s in names) {
            var f = path.join(options.root[i], names[s] + ".js");
            if (tryStat(f)) return require(path.resolve(options.root[i], names[s]));

            var f = path.join(options.root[i], names[s] + ".tmpl");
            if (tryStat(f)) return path.resolve(options.root[i], names[s] + ".tmpl");

        }

    }
};

function tryStat(path) {
    try {
        var st = fs.statSync(path);
        return st && st.isFile();
    } catch (e) {
        return false;
    }
}

module.exports = function(app) {
    server = app;
    return View;
};
