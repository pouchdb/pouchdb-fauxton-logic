(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Mock XMLHttpRequest (see http://www.w3.org/TR/XMLHttpRequest)
 *
 * Written by Philipp von Weitershausen <philipp@weitershausen.de>
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * For test interaction it exposes the following attributes:
 *
 * - method, url, urlParts, async, user, password
 * - requestText
 *
 * as well as the following methods:
 *
 * - getRequestHeader(header)
 * - setResponseHeader(header, value)
 * - receive(status, data)
 * - err(exception)
 * - authenticate(user, password)
 *
 */
function MockHttpRequest () {
    // These are internal flags and data structures
    this.error = false;
    this.sent = false;
    this.requestHeaders = {};
    this.responseHeaders = {};
}
MockHttpRequest.prototype = {

    statusReasons: {
        100: 'Continue',
        101: 'Switching Protocols',
        102: 'Processing',
        200: 'OK',
        201: 'Created',
        202: 'Accepted',
        203: 'Non-Authoritative Information',
        204: 'No Content',
        205: 'Reset Content',
        206: 'Partial Content',
        207: 'Multi-Status',
        300: 'Multiple Choices',
        301: 'Moved Permanently',
        302: 'Moved Temporarily',
        303: 'See Other',
        304: 'Not Modified',
        305: 'Use Proxy',
        307: 'Temporary Redirect',
        400: 'Bad Request',
        401: 'Unauthorized',
        402: 'Payment Required',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        407: 'Proxy Authentication Required',
        408: 'Request Time-out',
        409: 'Conflict',
        410: 'Gone',
        411: 'Length Required',
        412: 'Precondition Failed',
        413: 'Request Entity Too Large',
        414: 'Request-URI Too Large',
        415: 'Unsupported Media Type',
        416: 'Requested range not satisfiable',
        417: 'Expectation Failed',
        422: 'Unprocessable Entity',
        423: 'Locked',
        424: 'Failed Dependency',
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Time-out',
        505: 'HTTP Version not supported',
        507: 'Insufficient Storage'
    },

    /*** State ***/

    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4,
    readyState: 0,


    /*** Request ***/

    open: function (method, url, async, user, password) {
        if (typeof method !== "string") {
            throw "INVALID_METHOD";
        }
        switch (method.toUpperCase()) {
        case "CONNECT":
        case "TRACE":
        case "TRACK":
            throw "SECURITY_ERR";

        case "DELETE":
        case "GET":
        case "HEAD":
        case "OPTIONS":
        case "POST":
        case "PUT":
            method = method.toUpperCase();
        }
        this.method = method;

        if (typeof url !== "string") {
            throw "INVALID_URL";
        }
        this.url = url;
        this.urlParts = this.parseUri(url);

        if (async === undefined) {
            async = true;
        }
        this.async = async;
        this.user = user;
        this.password = password;

        this.readyState = this.OPENED;
        this.onreadystatechange();
    },

    setRequestHeader: function (header, value) {
        header = header.toLowerCase();

        switch (header) {
        case "accept-charset":
        case "accept-encoding":
        case "connection":
        case "content-length":
        case "cookie":
        case "cookie2":
        case "content-transfer-encoding":
        case "date":
        case "expect":
        case "host":
        case "keep-alive":
        case "referer":
        case "te":
        case "trailer":
        case "transfer-encoding":
        case "upgrade":
        case "user-agent":
        case "via":
            return;
        }
        if ((header.substr(0, 6) === "proxy-")
            || (header.substr(0, 4) === "sec-")) {
            return;
        }

        // it's the first call on this header field
        if (this.requestHeaders[header] === undefined)
          this.requestHeaders[header] = value;
        else {
          var prev = this.requestHeaders[header];
          this.requestHeaders[header] = prev + ", " + value;
        }

    },

    send: function (data) {
        if ((this.readyState !== this.OPENED)
            || this.sent) {
            throw "INVALID_STATE_ERR";
        }
        if ((this.method === "GET") || (this.method === "HEAD")) {
            data = null;
        }

        //TODO set Content-Type header?
        this.error = false;
        this.sent = true;
        this.onreadystatechange();

        // fake send
        this.requestText = data;
        this.onsend();
    },

    abort: function () {
        this.responseText = null;
        this.error = true;
        for (var header in this.requestHeaders) {
            delete this.requestHeaders[header];
        }
        delete this.requestText;
        this.onreadystatechange();
        this.onabort();
        this.readyState = this.UNSENT;
    },


    /*** Response ***/

    status: 0,
    statusText: "",

    getResponseHeader: function (header) {
        if ((this.readyState === this.UNSENT)
            || (this.readyState === this.OPENED)
            || this.error) {
            return null;
        }
        return this.responseHeaders[header.toLowerCase()];
    },

    getAllResponseHeaders: function () {
        var r = "";
        for (var header in this.responseHeaders) {
            if ((header === "set-cookie") || (header === "set-cookie2")) {
                continue;
            }
            //TODO title case header
            r += header + ": " + this.responseHeaders[header] + "\r\n";
        }
        return r;
    },

    responseText: "",
    responseXML: undefined, //TODO


    /*** See http://www.w3.org/TR/progress-events/ ***/

    onload: function () {
        // Instances should override this.
    },

    onprogress: function () {
        // Instances should override this.
    },

    onerror: function () {
        // Instances should override this.
    },

    onabort: function () {
        // Instances should override this.
    },

    onreadystatechange: function () {
        // Instances should override this.
    },


    /*** Properties and methods for test interaction ***/

    onsend: function () {
        // Instances should override this.
    },

    getRequestHeader: function (header) {
        return this.requestHeaders[header.toLowerCase()];
    },

    setResponseHeader: function (header, value) {
        this.responseHeaders[header.toLowerCase()] = value;
    },

    makeXMLResponse: function (data) {
        var xmlDoc;
        // according to specs from point 3.7.5:
        // "1. If the response entity body is null terminate these steps
        //     and return null.
        //  2. If final MIME type is not null, text/xml, application/xml,
        //     and does not end in +xml terminate these steps and return null.
        var mimetype = this.getResponseHeader("Content-Type");
        mimetype = mimetype && mimetype.split(';', 1)[0];
        if ((mimetype == null) || (mimetype == 'text/xml') ||
           (mimetype == 'application/xml') ||
           (mimetype && mimetype.substring(mimetype.length - 4) == '+xml')) {
            // Attempt to produce an xml response
            // and it will fail if not a good xml
            try {
                if (window.DOMParser) {
                    var parser = new DOMParser();
                    xmlDoc = parser.parseFromString(data, "text/xml");
                } else { // Internet Explorer
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    xmlDoc.loadXML(data);
                }
            } catch (e) {
                // according to specs from point 3.7.5:
                // "3. Let document be a cookie-free Document object that
                // represents the result of parsing the response entity body
                // into a document tree following the rules from the XML
                //  specifications. If this fails (unsupported character
                // encoding, namespace well-formedness error etc.), terminate
                // these steps return null."
                xmlDoc = null;
            }
            // parse errors also yield a null.
            if ((xmlDoc && xmlDoc.parseError && xmlDoc.parseError.errorCode != 0)
                || (xmlDoc && xmlDoc.documentElement && xmlDoc.documentElement.nodeName == "parsererror")
                || (xmlDoc && xmlDoc.documentElement && xmlDoc.documentElement.nodeName == "html"
                    &&  xmlDoc.documentElement.firstChild &&  xmlDoc.documentElement.firstChild.nodeName == "body"
                    &&  xmlDoc.documentElement.firstChild.firstChild && xmlDoc.documentElement.firstChild.firstChild.nodeName == "parsererror")) {
                xmlDoc = null;
            }
        } else {
            // mimetype is specified, but not xml-ish
            xmlDoc = null;
        }
        return xmlDoc;
    },

    // Call this to simulate a server response
    receive: function (status, data) {
        if ((this.readyState !== this.OPENED) || (!this.sent)) {
            // Can't respond to unopened request.
            throw "INVALID_STATE_ERR";
        }

        this.status = status;
        this.statusText = status + " " + this.statusReasons[status];
        this.readyState = this.HEADERS_RECEIVED;
        this.onprogress();
        this.onreadystatechange();

        this.responseText = data;
        this.responseXML = this.makeXMLResponse(data);

        this.readyState = this.LOADING;
        this.onprogress();
        this.onreadystatechange();

        this.readyState = this.DONE;
        this.onreadystatechange();
        this.onprogress();
        this.onload();
    },

    // Call this to simulate a request error (e.g. NETWORK_ERR)
    err: function (exception) {
        if ((this.readyState !== this.OPENED) || (!this.sent)) {
            // Can't respond to unopened request.
            throw "INVALID_STATE_ERR";
        }

        this.responseText = null;
        this.error = true;
        for (var header in this.requestHeaders) {
            delete this.requestHeaders[header];
        }
        this.readyState = this.DONE;
        if (!this.async) {
            throw exception;
        }
        this.onreadystatechange();
        this.onerror();
    },

    // Convenience method to verify HTTP credentials
    authenticate: function (user, password) {
        if (this.user) {
            return (user === this.user) && (password === this.password);
        }

        if (this.urlParts.user) {
            return ((user === this.urlParts.user)
                    && (password === this.urlParts.password));
        }

        // Basic auth.  Requires existence of the 'atob' function.
        var auth = this.getRequestHeader("Authorization");
        if (auth === undefined) {
            return false;
        }
        if (auth.substr(0, 6) !== "Basic ") {
            return false;
        }
        if (typeof atob !== "function") {
            return false;
        }
        auth = atob(auth.substr(6));
        var pieces = auth.split(':');
        var requser = pieces.shift();
        var reqpass = pieces.join(':');
        return (user === requser) && (password === reqpass);
    },

    // Parse RFC 3986 compliant URIs.
    // Based on parseUri by Steven Levithan <stevenlevithan.com>
    // See http://blog.stevenlevithan.com/archives/parseuri
    parseUri: function (str) {
        var pattern = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;
        var key = ["source", "protocol", "authority", "userInfo", "user",
                   "password", "host", "port", "relative", "path",
                   "directory", "file", "query", "anchor"];
        var querypattern = /(?:^|&)([^&=]*)=?([^&]*)/g;

        var match = pattern.exec(str);
		var uri = {};
		var i = 14;
	    while (i--) {
            uri[key[i]] = match[i] || "";
        }

	    uri.queryKey = {};
	    uri[key[12]].replace(querypattern, function ($0, $1, $2) {
		    if ($1) {
                uri.queryKey[$1] = $2;
            }
	    });

	    return uri;
    }
};


/*
 * A small mock "server" that intercepts XMLHttpRequest calls and
 * diverts them to your handler.
 *
 * Usage:
 *
 * 1. Initialize with either
 *       var server = new MockHttpServer(your_request_handler);
 *    or
 *       var server = new MockHttpServer();
 *       server.handle = function (request) { ... };
 *
 * 2. Call server.start() to start intercepting all XMLHttpRequests.
 *
 * 3. Do your tests.
 *
 * 4. Call server.stop() to tear down.
 *
 * 5. Profit!
 */
function MockHttpServer (handler) {
    if (handler) {
        this.handle = handler;
    }
};
MockHttpServer.prototype = {

    start: function () {
        var self = this;

        function Request () {
            this.onsend = function () {
                self.handle(this);
            };
            MockHttpRequest.apply(this, arguments);
        }
        Request.prototype = MockHttpRequest.prototype;

        window.OriginalHttpRequest = window.XMLHttpRequest;
        window.XMLHttpRequest = Request;
    },

    stop: function () {
        window.XMLHttpRequest = window.OriginalHttpRequest;
    },

    handle: function (request) {
        // Instances should override this.
    }
};

module.exports = MockHttpRequest;

},{}],2:[function(require,module,exports){
(function (global){
var PostMessageRPC = require("./postmessagerpc.js");

var port = chrome.runtime.connect({name: "index-chrome-extension.js"});
setTimeout(function () {
  port.onMessage.addListener(rpc.onMessage);
}, 0);

var rpc = new PostMessageRPC(setTimeout.bind(null, function (msg) {
  port.postMessage(msg);
}, 0), "devtool");

rpc.serve("reload", function () {
  global.location.href = chrome.runtime.getURL("generated/fauxton/index.html");
});

//inject the mock XHR object
var injectXHR = require("./injectxhr.js");
var req2resp = rpc.call.bind(rpc, "page", "req2resp");
injectXHR(req2resp);

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./injectxhr.js":3,"./postmessagerpc.js":4}],3:[function(require,module,exports){
(function (global){
var MockHttpRequest = require("./MockHttpRequest/lib/mock.js");
var querystring = require("querystring");

module.exports = function injectXHR(req2resp) {
  var OriginalXHR = global.XMLHttpRequest;
  global.XMLHttpRequest = MockHttpRequest;

  MockHttpRequest.prototype.onsend = function () {
    var xhr = this;
    var info = new global.URL(xhr.url, "http://localhost:5984/_utils");
    if (["http:", "https:"].indexOf(info.protocol) === -1) {
      var realXhr = new OriginalXHR();
      realXhr.open(xhr.method, xhr.url);
      for (var header in xhr.requestHeaders) {
        realXhr.setRequestHeader(header, xhr.requestHeaders[header]);
      }
      realXhr.responseType = xhr.responseType;
      realXhr.send(xhr.requestText);
      realXhr.onload = function () {
        var headers = realXhr.getAllResponseHeaders();
        headers.trim().split("\n").forEach(function (line) {
          var name = line.split(":")[0].trim();
          var value = line.split(":")[1].trim();
          xhr.setResponseHeader(name, value);
        });
        if (realXhr.responseType === "") {
          xhr.responseText = realXhr.responseText;
        } else {
          xhr.response = realXhr.response;
        }
        xhr.receive(realXhr.status);
      };
      return;
    }
    var req = {
      path: info.pathname.split("/").filter(function (piece) {return piece; }),
      query: querystring.parse(info.search.substr(1)),
      method: xhr.method,
      body: xhr.requestText === null ? "undefined" : xhr.requestText,
      headers: xhr.requestHeaders
    };
    req2resp(req)
      .then(function (resp) {
        xhr.setResponseHeader("Content-Type", "application/json");
        xhr.receive(resp.status, resp.body);
      })
      .catch(function (err) {
        if (err !== "no_pouchdb_found") {
          throw err;
        }
        global.location.href = "no-pouchdb-found.html";
      });
  };

  var org = MockHttpRequest.prototype.receive;
  MockHttpRequest.prototype.receive = function (status, resp) {
    console.log(this.method, this.url, "-", status, resp);
    return org.apply(this, arguments);
  };
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./MockHttpRequest/lib/mock.js":1,"querystring":26}],4:[function(require,module,exports){
/*
Example usage:

var rpc = new PostMessageRPC(window.postMessage, "thispage");
window.addEventListener("message", rpc.onMessage);

rpc.serve("getThingy", function () {
  return Promise.resolve("Hello World!");
});

rpc.call("getThingy").then(function (resp) {
  console.log(resp); // "Hello World!"
});

A window.postMessage() on the client side needs to be connected to the
server's onmessage event - and the other way around for this to work.
Also, the thisName in the constructor needs to match with the one passed
to PostMessageRPC.call.

When the connection isn't sound, the promise PostMessageRPC.call returns
is never resolved.

*/

var Promise = Promise || require("lie");

function PostMessageRPC(postMessage, thisName) {
  this._postMessage = function (msg) {
    postMessage(msg, "*");
  };
  this._thisName = thisName;
  this.onMessage = this._onMessage.bind(this);

  this._idCount = 0;
  this._served = {};
  this._responseHandlers = {};
}
module.exports = PostMessageRPC;

PostMessageRPC.prototype._onMessage = function (event) {
  // || event for not-so-strict implementations (i.e. in browser addons)
  var info = event.data || event;

  if (info.destination === this._thisName) {
    this._handleServing(info);
    this._handleResponses(info);
  }
};

PostMessageRPC.prototype._handleServing = function (info) {
  var self = this;
  if (info.type !== "call") {
    return;
  }

  var msg = {};
  Promise.resolve().then(function () {
    return self._served[info.name].apply(null, info.arguments);
  }).then(function (resp) {
    msg.response = resp;
  }).catch(function (err) {
    msg.error = err;
  }).then(function () {
    msg.id = info.id;
    msg.type = "response";
    msg.destination = info.returnto;

    self._postMessage(msg);
  });
};

PostMessageRPC.prototype._handleResponses = function (info) {
  if (info.type === "response" && this._responseHandlers[info.id]) {
    this._responseHandlers[info.id](info);
  }
};

PostMessageRPC.prototype.serve = function (name, func) {
  this._served[name] = func;
};

PostMessageRPC.prototype.call = function (destination, name) {
  var self = this;
  var args = Array.prototype.slice.call(arguments, 2);
  var currentId = self._idCount++;

  return new Promise(function (resolve, reject) {
    self._responseHandlers[currentId] = function (data) {
      delete self._responseHandlers[currentId];

      if (data.error) {
        reject(data.error);
      } else {
        resolve(data.response);
      }
    };

    self._postMessage({
      id: currentId,
      name: name,
      arguments: args,
      type: "call",
      destination: destination,
      returnto: self._thisName
    });
  });
};

},{"lie":8}],5:[function(require,module,exports){
'use strict';

module.exports = INTERNAL;

function INTERNAL() {}
},{}],6:[function(require,module,exports){
'use strict';
var Promise = require('./promise');
var reject = require('./reject');
var resolve = require('./resolve');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = all;
function all(iterable) {
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new Promise(INTERNAL);
  
  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    resolve(value).then(resolveFromAll, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len & !called) {
        called = true;
        handlers.resolve(promise, values);
      }
    }
  }
}
},{"./INTERNAL":5,"./handlers":7,"./promise":9,"./reject":12,"./resolve":13}],7:[function(require,module,exports){
'use strict';
var tryCatch = require('./tryCatch');
var resolveThenable = require('./resolveThenable');
var states = require('./states');

exports.resolve = function (self, value) {
  var result = tryCatch(getThen, value);
  if (result.status === 'error') {
    return exports.reject(self, result.value);
  }
  var thenable = result.value;

  if (thenable) {
    resolveThenable.safely(self, thenable);
  } else {
    self.state = states.FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {
      self.queue[i].callFulfilled(value);
    }
  }
  return self;
};
exports.reject = function (self, error) {
  self.state = states.REJECTED;
  self.outcome = error;
  var i = -1;
  var len = self.queue.length;
  while (++i < len) {
    self.queue[i].callRejected(error);
  }
  return self;
};

function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then;
  if (obj && typeof obj === 'object' && typeof then === 'function') {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}
},{"./resolveThenable":14,"./states":15,"./tryCatch":16}],8:[function(require,module,exports){
module.exports = exports = require('./promise');

exports.resolve = require('./resolve');
exports.reject = require('./reject');
exports.all = require('./all');
exports.race = require('./race');
},{"./all":6,"./promise":9,"./race":11,"./reject":12,"./resolve":13}],9:[function(require,module,exports){
'use strict';

var unwrap = require('./unwrap');
var INTERNAL = require('./INTERNAL');
var resolveThenable = require('./resolveThenable');
var states = require('./states');
var QueueItem = require('./queueItem');

module.exports = Promise;
function Promise(resolver) {
  if (!(this instanceof Promise)) {
    return new Promise(resolver);
  }
  if (typeof resolver !== 'function') {
    throw new TypeError('reslover must be a function');
  }
  this.state = states.PENDING;
  this.queue = [];
  this.outcome = void 0;
  if (resolver !== INTERNAL) {
    resolveThenable.safely(this, resolver);
  }
}

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' && this.state === states.FULFILLED ||
    typeof onRejected !== 'function' && this.state === states.REJECTED) {
    return this;
  }
  var promise = new Promise(INTERNAL);

  
  if (this.state !== states.PENDING) {
    var resolver = this.state === states.FULFILLED ? onFulfilled: onRejected;
    unwrap(promise, resolver, this.outcome);
  } else {
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
  }

  return promise;
};

},{"./INTERNAL":5,"./queueItem":10,"./resolveThenable":14,"./states":15,"./unwrap":17}],10:[function(require,module,exports){
'use strict';
var handlers = require('./handlers');
var unwrap = require('./unwrap');

module.exports = QueueItem;
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === 'function') {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === 'function') {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function (value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function (value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function (value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function (value) {
  unwrap(this.promise, this.onRejected, value);
};
},{"./handlers":7,"./unwrap":17}],11:[function(require,module,exports){
'use strict';
var Promise = require('./promise');
var reject = require('./reject');
var resolve = require('./resolve');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = race;
function race(iterable) {
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return resolve([]);
  }

  var resolved = 0;
  var i = -1;
  var promise = new Promise(INTERNAL);
  
  while (++i < len) {
    resolver(iterable[i]);
  }
  return promise;
  function resolver(value) {
    resolve(value).then(function (response) {
      if (!called) {
        called = true;
        handlers.resolve(promise, response);
      }
    }, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
  }
}
},{"./INTERNAL":5,"./handlers":7,"./promise":9,"./reject":12,"./resolve":13}],12:[function(require,module,exports){
'use strict';

var Promise = require('./promise');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = reject;

function reject(reason) {
	var promise = new Promise(INTERNAL);
	return handlers.reject(promise, reason);
}
},{"./INTERNAL":5,"./handlers":7,"./promise":9}],13:[function(require,module,exports){
'use strict';

var Promise = require('./promise');
var INTERNAL = require('./INTERNAL');
var handlers = require('./handlers');
module.exports = resolve;

var FALSE = handlers.resolve(new Promise(INTERNAL), false);
var NULL = handlers.resolve(new Promise(INTERNAL), null);
var UNDEFINED = handlers.resolve(new Promise(INTERNAL), void 0);
var ZERO = handlers.resolve(new Promise(INTERNAL), 0);
var EMPTYSTRING = handlers.resolve(new Promise(INTERNAL), '');

function resolve(value) {
  if (value) {
    if (value instanceof Promise) {
      return value;
    }
    return handlers.resolve(new Promise(INTERNAL), value);
  }
  var valueType = typeof value;
  switch (valueType) {
    case 'boolean':
      return FALSE;
    case 'undefined':
      return UNDEFINED;
    case 'object':
      return NULL;
    case 'number':
      return ZERO;
    case 'string':
      return EMPTYSTRING;
  }
}
},{"./INTERNAL":5,"./handlers":7,"./promise":9}],14:[function(require,module,exports){
'use strict';
var handlers = require('./handlers');
var tryCatch = require('./tryCatch');
function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false;
  function onError(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }

  function onSuccess(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.resolve(self, value);
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }
  
  var result = tryCatch(tryToUnwrap);
  if (result.status === 'error') {
    onError(result.value);
  }
}
exports.safely = safelyResolveThenable;
},{"./handlers":7,"./tryCatch":16}],15:[function(require,module,exports){
// Lazy man's symbols for states

exports.REJECTED = ['REJECTED'];
exports.FULFILLED = ['FULFILLED'];
exports.PENDING = ['PENDING'];
},{}],16:[function(require,module,exports){
'use strict';

module.exports = tryCatch;

function tryCatch(func, value) {
  var out = {};
  try {
    out.value = func(value);
    out.status = 'success';
  } catch (e) {
    out.status = 'error';
    out.value = e;
  }
  return out;
}
},{}],17:[function(require,module,exports){
'use strict';

var immediate = require('immediate');
var handlers = require('./handlers');
module.exports = unwrap;

function unwrap(promise, func, value) {
  immediate(function () {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}
},{"./handlers":7,"immediate":18}],18:[function(require,module,exports){
'use strict';
var types = [
  require('./nextTick'),
  require('./mutation.js'),
  require('./messageChannel'),
  require('./stateChange'),
  require('./timeout')
];
var draining;
var queue = [];
//named nextTick for less confusing stack traces
function nextTick() {
  draining = true;
  var i, oldQueue;
  var len = queue.length;
  while (len) {
    oldQueue = queue;
    queue = [];
    i = -1;
    while (++i < len) {
      oldQueue[i]();
    }
    len = queue.length;
  }
  draining = false;
}
var scheduleDrain;
var i = -1;
var len = types.length;
while (++ i < len) {
  if (types[i] && types[i].test && types[i].test()) {
    scheduleDrain = types[i].install(nextTick);
    break;
  }
}
module.exports = immediate;
function immediate(task) {
  if (queue.push(task) === 1 && !draining) {
    scheduleDrain();
  }
}
},{"./messageChannel":19,"./mutation.js":20,"./nextTick":23,"./stateChange":21,"./timeout":22}],19:[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  if (global.setImmediate) {
    // we can only get here in IE10
    // which doesn't handel postMessage well
    return false;
  }
  return typeof global.MessageChannel !== 'undefined';
};

exports.install = function (func) {
  var channel = new global.MessageChannel();
  channel.port1.onmessage = func;
  return function () {
    channel.port2.postMessage(0);
  };
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],20:[function(require,module,exports){
(function (global){
'use strict';
//based off rsvp https://github.com/tildeio/rsvp.js
//license https://github.com/tildeio/rsvp.js/blob/master/LICENSE
//https://github.com/tildeio/rsvp.js/blob/master/lib/rsvp/asap.js

var Mutation = global.MutationObserver || global.WebKitMutationObserver;

exports.test = function () {
  return Mutation;
};

exports.install = function (handle) {
  var called = 0;
  var observer = new Mutation(handle);
  var element = global.document.createTextNode('');
  observer.observe(element, {
    characterData: true
  });
  return function () {
    element.data = (called = ++called % 2);
  };
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],21:[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  return 'document' in global && 'onreadystatechange' in global.document.createElement('script');
};

exports.install = function (handle) {
  return function () {

    // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
    // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
    var scriptEl = global.document.createElement('script');
    scriptEl.onreadystatechange = function () {
      handle();

      scriptEl.onreadystatechange = null;
      scriptEl.parentNode.removeChild(scriptEl);
      scriptEl = null;
    };
    global.document.documentElement.appendChild(scriptEl);

    return handle;
  };
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],22:[function(require,module,exports){
'use strict';
exports.test = function () {
  return true;
};

exports.install = function (t) {
  return function () {
    setTimeout(t, 0);
  };
};
},{}],23:[function(require,module,exports){

},{}],24:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],25:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],26:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":24,"./encode":25}]},{},[2])