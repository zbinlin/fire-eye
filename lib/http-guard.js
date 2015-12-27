"use strict";

const { Cc, Ci } = require("chrome");

const observerService = Cc["@mozilla.org/observer-service;1"].
                            getService(Ci.nsIObserverService);

function HttpGuard(req = [], res = []) {
    if (!(this instanceof HttpGuard)) {
        return new HttpGuard(req, res);
    }
    if (!Array.isArray(req)) {
        throw new TypeError("Argument 0 must be an array.");
    }
    if (!Array.isArray(res)) {
        throw new TypeError("Argument 1 must be an array.");
    }

    this.req = req;
    this.res = res;
}
HttpGuard.prototype = {
    pause() {
        this.unregister();
    },
    resume() {
        this.register();
    },
    register() {
        if (this.registered) return;
        observerService.addObserver(this, "http-on-modify-request", false);
        observerService.addObserver(this, "http-on-examine-response", false);
        observerService.addObserver(this, "http-on-examine-cached-response", false);
        observerService.addObserver(this, "http-on-examine-merged-response", false);
        this.registered = true;
    },
    unregister() {
        if (!this.registered) return;
        observerService.removeObserver(this, "http-on-modify-request");
        observerService.removeObserver(this, "http-on-examine-response");
        observerService.removeObserver(this, "http-on-examine-cached-response");
        observerService.removeObserver(this, "http-on-examine-merged-response");
        this.registered = false;
    },
    observe(aSubject, aTopic) {
        var httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);
        var uri = httpChannel.URI.spec.toLowerCase();
        switch (aTopic) {
            case "http-on-modify-request":
                this.match(this.req, uri, matchEl => {
                    this.exec(matchEl, httpChannel, "Request");
                });
                break;
            case "http-on-examine-cached-response":
            case "http-on-examine-response":
            case "http-on-examine-merged-response":
                this.match(this.res, uri, matchEl => {
                    this.exec(matchEl, httpChannel, "Response");
                });
                break;
        }
    },
    match(arr, uri, cb) {
        let len = arr.length;
        let idx = -1;
        while (++idx < len) {
            let item = arr[idx];
            let excludes = item.exclude;
            if (!excludes) {
                excludes = [];
            } else if (!Array.isArray(excludes)) {
                excludes = [excludes];
            }
            let excludesLen = excludes.length;
            let isExcluded = false;
            while (excludesLen--) {
                if (this.isMatch(excludes[excludesLen], uri)) {
                    isExcluded = true;
                    break;
                }
            }
            if (!isExcluded && this.isMatch(item.url, uri)) {
                cb(item);
            }
        }
    },
    isType(obj, type) {
        const toString = Object.prototype.toString;
        return toString.call(obj).slice(8, -1).toLowerCase() === (type + "").toLowerCase();
    },
    isMatch(e, uri) {
        return this.isType(e, "RegExp") && e.test(uri)
               || typeof e === "string" && e.toLowerCase() === uri;
    },
    exec(i, h, w) {
        var header = w + "Header";
        if ("" == i.fieldValue) {
            return h["set" + header](i.fieldName, "", false); // clear header
        }
        var extra = i.extraValue;
        if (extra) {
            let value = "";
            try {
                value = h["get" + header](i.fieldName);
            } catch (ex) {
                // empty
            }
            let {spec: href, scheme: protocol, prePath: origin, host, port, path: pathname} = h.URI;
            value = value.replace(i.fieldValue, "function" === typeof extra ? extra.bind({}, {
                location: {
                    host: host + (-1 == port ? "" : ":" + port),
                    hostname: host,
                    href: href,
                    origin: origin,
                    pathname: pathname,
                    port: port,
                    protocol: protocol,
                },
                http: h,
            }) : extra);
            return h["set" + header](i.fieldName, value, i.merge);
        }
        return h["set" + header](i.fieldName, i.fieldValue, i.merge);
    },
};

module.exports = HttpGuard;
