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

    // options.incl1 = function(rel, extraOptions) {
    //     this["__name"] = rel;
    //     return this.incl(rel, extraOptions);
    // };

    options.__root = options["__name"];

    options.incl = function (rel, extraOptions) {

        var ex = {};
        if (!rel) {
            var res = resolve(options, this.__name, this.__root, true);
            ex.__name = res.name;
            ex.__root = this.__root;
            ex.__tmpl = res.block;
        } else if (rel.startsWith("/")) {
            rel = rel.substring(1);

            var res = resolve(options, rel, null);
            ex.__name = res.name;
            ex.__root = res.name;
            ex.__tmpl = res.block;
        } else if (rel.startsWith("./")) {
            rel = rel.substring(2);

            var res = resolve(options, rel, this.__name);
            ex.__name = res.name;
            ex.__root = this.__name;
            ex.__tmpl = res.block;
        } else {
            var res = resolve(options, rel, this.__root);
            ex.__name = res.name;
            ex.__root = this.__root;
            ex.__tmpl = res.block;
        }



        if (typeof ex.__tmpl === 'undefined') {
            throw new Error('Template "' + (rel || this.__name) + '" could not be found');
        }

        var opts = _.extend({}, options, extraOptions, ex);
        opts.incl = options.incl;

        // var stack = opts['__stack'] || [];
        //
        // if (stack.length > 20 && _.contains(stack, rel)) {
        //     stack.push(rel);
        //     throw new Error('Cyclic template dependencies: "' + stack.join(" > ") + '"');
        // }
        // stack.push(rel);
        //


        // opts.incl = function (rel, extraOptions) {
        //     extraOptions = extraOptions || {};
        //     extraOptions['__stack'] = _.clone(stack);
        //     return options.incl(rel, extraOptions);
        // };

        // opts.incl1 = options.incl1;

        var id = uuid.v4();
        count++;

        var p = ex.__tmpl;
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
                    if (typeof opt === 'undefined') {
                        opt = tmpl;
                        tmpl = null;
                    }
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

    var p = this.path.block;
    if (typeof this.path === 'function') {
        p(options, function (err, tmpl, opt) {
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
        engine(p, options, function (err, str) {
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

var resolve = function(options, name, dir, exclController) {
    exclController = exclController || false;
    // name = name || options["__tmpl"];
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
            var res = {
                dir: options.root[i],
                name: names[s]

            };
            if (!exclController) {
                var f = path.join(res.dir, res.name + ".js");
                if (tryStat(f)) {
                    res.block = require(path.resolve(res.dir, res.name));
                    return res;
                }
            }

            var f = path.join(res.dir, res.name + ".tmpl");
            if (tryStat(f)) {
                res.block = path.resolve(res.dir, res.name + ".tmpl");
                return res;
            }

        }

    }
    return {};
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
