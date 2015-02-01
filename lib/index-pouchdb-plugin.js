"use strict";

var fs = require("fs");

var html = fs.readFileSync(__dirname + "/../fauxton/index.html", {encoding: "UTF-8"});
var scr = fs.readFileSync(__dirname + "/../fauxton/js/require.js", {encoding: "UTF-8"});
scr += fs.readFileSync(__dirname + "/../fauxton/js/pouchdb-offline.js", {encoding: "UTF-8"});
var css = fs.readFileSync(__dirname + "/../fauxton/css/index.css", {encoding: "UTF-8"});

module.exports = function enableFauxton(PouchDB, allDbs) {
  var iframe = global.document.createElement("iframe");
  document.body.appendChild(iframe);

  iframe.onload = function () {
    iframe.contentDocument.write(html);
    iframe.contentWindow.PouchDB = PouchDB;

    var style = iframe.contentDocument.createElement("style");
    var script = iframe.contentDocument.createElement("script");

    style.appendChild(iframe.contentDocument.createTextNode(css));
    script.appendChild(iframe.contentDocument.createTextNode(scr));

    iframe.contentDocument.body.appendChild(style);
    iframe.contentDocument.body.appendChild(script);
  };
  iframe.style.width = "90%";
  iframe.style.height = "500px";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.border = "3px groove #CBCBCB";
};
