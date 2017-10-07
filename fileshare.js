'use strict'

const   formidable = require('formidable');
const 	https = require('http');
const 	util = require('util');
const 	fs = require("fs");
const 	url = require('url');
const 	staticfile = require('./StaticFile');
const 	querystring = require('querystring');

const hostdir = "www/";  //www

var server =null;
if (process.argv.length >= 3 && process.argv[2]=='-e') {
	console.log("None Express component!");
    server = https.createServer(WebRouter);	
}else{
	console.log("Express component!");
	var express = require('express');
	var app = express();
	app.disable('x-powered-by');
	app.use( function (req, res) {	WebRouter(req, res);});
	server = https.createServer(app);
}

server.listen(80, function () {
	console.log("server running at https://IP_ADDRESS:80/")
});

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
		return;
	}
	console.log(req.headers);
	console.log(req.connection.remoteAddress);
	if (req.url.startsWith('/mbc')) {
		mimetype = "text/html";
		staticfile._pipe(fs, hostdir + 'index_mbc.htm', mimetype, res);
		return;
	}
    var dir="tmp/";
	//var dir = 'F:/report_doc/outd/xml/';
	
//	var coolauth = require('./coolauth');
//var auth_username = coolauth.auth(req, res);
//	if (auth_username == null) return;
  
	var auth_username ="abc";
	
	if (req.url.startsWith('/down')) {
		staticfile.downfile(dir, req, res);
		return;
	}
	if (req.url.startsWith('/uploadphp')) {
		staticfile.uploadphp(dir, auth_username, req, res);
		return;
	}
	if (req.url.startsWith('/upload') && req.method.toLowerCase() == 'post')
		{
		   console.log("upload");
		   var form = new formidable.IncomingForm();
		   staticfile.uploadfile(dir, form, req, res);
		   return;
	   }
	/*if (req.url.startsWith('/index.php')) {
		mimetype = "text/html";
		staticfile._pipe(fs, hostdir + 'index_mbc.html', mimetype, res);
		return;
	}*/
	res.writeHead(301, { Location: '/uploadphp' });
	res.end();
}
