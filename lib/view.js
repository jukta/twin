var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var uuid = require('uuid');
var server;

function View(name, options) {
    this.dirs = options.root;

    this.engine = options.engines['.tmpl'];
    this.path = resolve(options, name);
    this.name = name;
    this.tmpl = name;
}

View.prototype.render = function render(options, callback) {

    options.root = this.dirs;

    var engine = this.engine;

    var parts = {};
    var body = [];
    var count = 0;

    options["__name"] = options["__name"] || this.name;
    options["__tmpl"] = options["__tmpl"] || this.tmpl;

    options.incl = function (rel, extraOptions) {
        var p = resolve(options, rel, options["__name"]);

        if (typeof p === 'undefined') {
            throw new Error('Template "' + rel + '" could not be found');
        }

        var opts = _.extend({}, options, extraOptions, {"__tmpl": rel});
        var stack = opts['__stack'] || [];

        if (stack.length > 20 && _.contains(stack, rel)) {
            stack.push(rel);
            throw new Error('Cyclic template dependencies: "' + stack.join(" > ") + '"');
        }
        stack.push(rel);

        opts.incl = function (rel, extraOptions) {
            extraOptions = extraOptions || {};
            extraOptions['__stack'] = _.clone(stack);
            return options.incl(rel, extraOptions);
        };

        var id = uuid.v4();
        count++;

        if (typeof p === 'function') {
            p(opts, function (err, tmpl, opt) {
                if (err) {
                    if (typeof err === 'string') {
                        callback(new Error(err));
                    } else {
                        callback(err);
                    }
                } else {
                    count--;
                    try {
                        parts[id] = opts.incl(tmpl, _.extend({}, options, opt));
                    } catch (e) {
                        callback(e);
                    }

                }
            });
        } else {
            engine(p, opts, function (err, str) {
                if (err) {
                    err.message = "Error rendering '" + p + "' - " + err.message;
                    callback(err);
                } else {
                    if (process.env.NODE_ENV === "development") {
                        str = "<!--" + p + "-->" + str + "<!--/" + p + "-->";
                    }
                    parts[id] = str;
                    count--;
                    if (count === 0) end(parts, body[0], callback);
                }
            });
        }
        return id;
    };
    if (typeof this.path === 'function') {
        this.path(options, function (err, tmpl, opt) {
            if (err) {
                if (typeof err === 'string') {
                    callback(new Error(err));
                } else {
                    callback(err);
                }
            } else {
                if (typeof opt === 'undefined') {
                    opt = tmpl;
                    tmpl = null;
                }
                body[0] = options.incl(tmpl, _.extend({}, options, opt));
            }
        });
    } else {
        engine(this.path, options, function (err, str) {
            if (err) {
                err.message = "Error rendering '" + p + "' - " + err.message;
                callback(err);
            } else {
                body[0] = str;
                if (count === 0) end(parts, body[0], callback);
            }
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
    var exclController = name === null;
    name = name || options["__tmpl"];
    var names = [];
    while (dir) {
        names.push(path.join(dir, name));
        var j = dir.lastIndexOf("/");
        if (j > 0) {
            dir = dir.substring(0,j);
        } else {
            break;
        }
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
            if (!exclController) {
                var f = path.join(options.root[i], names[s] + ".js");
                if (tryStat(f)) return require(path.resolve(options.root[i], names[s]));
            }

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
