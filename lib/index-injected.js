"use strict";

/*jshint node: true */

var PouchDB = global.PouchDB;

if (PouchDB) {
  PouchDB = PouchDB.defaults({});

  PouchDB.allDbs = function () {
    var prefix = typeof PouchDB.prefix === "undefined" ? "_pouch_" : PouchDB.prefix;
    return getIDBDatabaseNames().then(function (names) {
      return names.filter(function (name) {
        return name.indexOf(prefix) === 0;
      }).map(function (name) {
        return name.substr(prefix.length);
      }).filter(function (name) {
        return (
          ["_checkModernIdb", "pouch__all_dbs__"].indexOf(name) === -1 &&
          name.indexOf("-mrview-") === -1 &&
          name.indexOf("-session-") === -1
        );
      });
    });
  };
}

var req2resp = require("./req2resp.js")(PouchDB);
var PostMessageRPC = require("./postmessagerpc.js");

var rpc = new PostMessageRPC(global.postMessage, "page");
global.addEventListener("message", rpc.onMessage);
rpc.serve("req2resp", req2resp);

var getIDBDatabaseNames;
if (global.indexedDB.webkitGetDatabaseNames) {
  getIDBDatabaseNames = function () {
    //Promisify webkitGetDatabaseNames()
    return new global.Promise(function (resolve, reject) {
      var req = global.indexedDB.webkitGetDatabaseNames().onsuccess = function () {
        resolve(Array.prototype.slice.call(this.result));
      };
    });
  };
} else {
  //In Firefox, ask the add-on to provide the idb db names
  getIDBDatabaseNames = rpc.call.bind(rpc, "main", "getIDBDatabaseNames");
}
