"use strict";

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
