"use strict";

/*jshint node: true */

var PouchDB = global.PouchDB;

if (PouchDB) {
    PouchDB = PouchDB.defaults({});

    PouchDB.allDbs = function () {
        var prefix = typeof PouchDB.prefix === "undefined" ? "_pouch_" : PouchDB.prefix;
        return getIDBDatabaseNames().then(function (databasesMap) {
            let names = databasesMap.map((databaseEntry) => {
                return databaseEntry.name;
            });

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
// supported on every browser except firefox at the time of writing
// https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/databases
if (global.indexedDB.databases) {
    getIDBDatabaseNames = function () {
        return global.indexedDB.databases();
    };
} else {
    // I don't know how the fallback worked before but it probably no longer work on those browsers
    //In Firefox, ask the add-on to provide the idb db names
    getIDBDatabaseNames = rpc.call.bind(rpc, "main", "getIDBDatabaseNames");
}
