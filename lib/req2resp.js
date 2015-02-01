"use strict";

var route = require("pouchdb-route");
var Promise = Promise || require("lie");
var uuid = require("random-uuid-v4");

module.exports = function (PouchDB) {
  return function req2resp(req) {
    if (!PouchDB) {
      return Promise.reject("no_pouchdb_found");
    }
    return Promise.resolve()
      .then(function () {
        if (!req.path.length) {
          return {
            version: "0.1.0",
          };
        } else if (req.path[0] === "_session") {
          return {
            ok: true,
            userCtx: {
              name: null,
              roles: ["_admin"]
            }
          };
        } else if (req.path[0] === "_uuids") {
          var uuids = [];
          for (var i = 0; i < (req.query.count || 1); i += 1) {
            uuids.push(uuid());
          }
          return {
            uuids: uuids
          };
        } else if (req.path[0] === "_active_tasks") {
          return [];
        } else {
          return route(PouchDB, req, {});
        }
      })
      .then(function (resp) {
        return {
          status: 200,
          body: JSON.stringify(resp)
        };
      })
      .catch(function (err) {
        return {
          status: err.status || 500,
          body: JSON.stringify(err)
        };
      });
  };
};
