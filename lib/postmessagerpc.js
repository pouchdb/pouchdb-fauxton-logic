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

"use strict";

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
