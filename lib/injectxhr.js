"use strict";

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
