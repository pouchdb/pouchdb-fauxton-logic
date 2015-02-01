"use strict";

var PouchDB = require("pouchdb");
require("pouchdb-all-dbs")(PouchDB);

var req2resp = require("./req2resp.js")(PouchDB);
var injectXHR = require("./injectxhr.js");
injectXHR(req2resp);
