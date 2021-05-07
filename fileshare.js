'use strict'
const https = require('http');
const fs = require("fs");
const url = require('url');
const staticfile = require('./inc/StaticFile');
const formidable = require('formidable');
const path = require('path');
const hostdir = "www/";
const port = 80;

https.Server((req, res) => {
	WebRouter(req, res)
	}).listen(port);
	
function WebRouter(req, res) {
	let q = url.parse(req.url, true);
	let filename = "." + q.pathname;
	filename = filename.replace("./", "");
	console.log("url_file_name:" + filename);
	let mimetype = "text/html";
	mimetype = staticfile.mimetype(filename);
	if (mimetype != 'NULL') {
		filename = filename.replace("..", "");
		filename = filename.replace(":", "");
		filename = filename.replace("//", "/");
		staticfile._out(fs, hostdir + filename, mimetype, res);
		return true;
	}
	console.log(req.headers);
	console.log(req.connection.remoteAddress);
	if (req.url.startsWith('/mbc')) {
		mimetype = "text/html";
		staticfile._pipe(fs, hostdir + 'index_mbc.htm', mimetype, res);
		return true;
	}
	var dir = "www/";
	//var coolauth = require('./coolauth');
	//var auth_username = coolauth.auth(req, res);
	//if (auth_username == null) return;
	var auth_username = "abc";

	if (req.url.startsWith('/down')) {
		staticfile.downfile(dir, req, res);
		return true;
	}
	if (req.url.startsWith('/uploadphp')) {
		try {
			staticfile.uploadphp(dir, auth_username, req, res);
		} catch (E) {
			console.log(E);
		}
		return true;
	}
	if (req.url.startsWith('/upload') && req.method.toLowerCase() == 'post') {
		let uploadDir = `www`;
		try {
			let form = formidable(
				{
					multiples: true,
					uploadDir: uploadDir,
					keepExtensions: true,
					maxFileSize: 8000 * 1024 * 1024,
				}
			);
			staticfile.uploadfile(dir, form, req, res);
		} catch (E) {
			console.log(E);
		}
		return true;
	}
	res.writeHead(301, { Location: '/uploadphp' });
	res.end();
}