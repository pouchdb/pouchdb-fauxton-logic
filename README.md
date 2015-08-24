pouchdb-fauxton-logic
=====================

[![Build Status](https://travis-ci.org/pouchdb/pouchdb-fauxton-logic.svg)](https://travis-ci.org/pouchdb/pouchdb-fauxton-logic)

This repository contains the JavaScript that's added to
[pouchdb-fauxton-base](https://github.com/marten-de-vries/pouchdb-fauxton-base)
to make a working version of Fauxton running on top of PouchDB.

It does that by injecting a mock XHR object in the Fauxton page, which
converts all requests made by Fauxton into
[CouchDB request objects](http://docs.couchdb.org/en/latest/json-structure.html#request-object).
These are then converted to PouchDB method calls by
[pouchdb-route](https://www.npmjs.org/package/pouchdb-route). The result
is a [CouchDB response object](http://docs.couchdb.org/en/latest/json-structure.html#response-object),
which is returned by the mock xhr object as the response to the request.

Demo
----

https://ma.rtendevri.es/fauxton/

Tests
-----

	npm install #first time only
	npm test

Building
--------

First, make sure the `/fauxton` directory contains the result of a build
of [pouchdb-fauxton-base](https://github.com/marten-de-vries/pouchdb-fauxton-base).

There are different ways to build PouchDB-Fauxton. The basic one is:

	npm install #first time only
	npm run build

Put the `/fauxton` directory somewhere on a web server, and that's it!

If you want to build a version of pouchdb-fauxton for use in a Firefox
add-on or Chrome extension, check out their
[respective](https://github.com/marten-de-vries/pouchdb-fauxton-firefox-addon)
[repositories](https://github.com/marten-de-vries/pouchdb-fauxton-chrome-extension)
for information on that.
