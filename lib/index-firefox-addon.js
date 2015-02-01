"use strict";

var PostMessageRPC = require("./postmessagerpc.js");
var rpc = new PostMessageRPC(postMessage, "devtool");
rpc.serve("reload", function () {
  global.location.href = "/pouchdb-fauxton/data/generated/fauxton/index.html";
});

var mainSide;

function postMessage(msg) {
  if (!mainSide) {
    return setTimeout(postMessage.bind(null, msg), 0);
  }
  mainSide.postMessage(msg);
}

global.addEventListener('message', function (event) {
  mainSide = event.ports[0];
  mainSide.addEventListener("message", rpc.onMessage);
  mainSide.start();
});

//inject the mock XHR object
var injectXHR = require("./injectxhr.js");
var req2resp = rpc.call.bind(rpc, "page", "req2resp");
injectXHR(req2resp);
