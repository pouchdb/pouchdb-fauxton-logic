var PostMessageRPC = require("../lib/postmessagerpc.js");
var Promise = require("lie");

var assert = require("assert");

it("should call the served function successfully", function (done) {
  function postMessage(msg) {
    rpc.onMessage(msg);
  }

  var rpc = new PostMessageRPC(postMessage, "thispage");

  rpc.serve("getThingy", function () {
    return Promise.resolve("Hello World!");
  });

  rpc.call("thispage", "getThingy").then(function (resp) {
    assert.strictEqual(resp, "Hello World!");
    done();
  });
});
