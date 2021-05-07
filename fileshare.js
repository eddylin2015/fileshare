'use strict'
const https = require('http');
const fs = require("fs");
const url = require('url');
const staticfile = require('./inc/StaticFile');
const formidable = require('formidable');
const path = require('path');
const hostdir = "www/";
const port = 81;

var express = require('express');
var app = express();
//app.disable('x-powered-by');
//app.disable('etag');
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'pug');
app.get('/', (req, res) => {
	console.log('xxx')
	res.redirect("/form")
});
app.get('/form', (req, res) => {
	let mimetype = "text/html";
	staticfile._pipe(fs, 'views/html/fileshare_form.html', mimetype, res);
});
app.post('/form', (req, res)=> {
	let uploadDir = `www`;
	//if(req.url.indexOf('s=1')>-1){uploadDir=`xml/1`; }
	let form = formidable(
		{
			multiples: true,
			uploadDir: uploadDir,
			keepExtensions: true,
			maxFileSize: 8000 * 1024 * 1024,
		}
	);
	form.parse(req, (err, fields, files) => {
		if (err) {
			console.error(err);
			res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
			res.end(String(err));
			return;
		}
		let file = files.file1
		if (file) fs.promises.rename(file.path, path.join(form.uploadDir, file.name));
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ fields, files }, null, 2));
	});
});

app.use(function (req, res) { WebRouter(req, res); });
// Basic 404 handler
//app.use((req, res) => {	res.status(404).send('Not Found');  });
 
app.listen(port, () => {
	staticfile.hostIP()	;console.log(`Example app listening at http://localhost:${port}`)
  })
//const server = https.createServer(app);

//server.listen(port, function () {	staticfile.hostIP()	;console.log("server running at https://IP_ADDRESS:", port)});

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
	var dir = "www/";
	//var coolauth = require('./coolauth');
	//var auth_username = coolauth.auth(req, res);
	//if (auth_username == null) return;
	var auth_username = "abc";

	if (req.url.startsWith('/down')) {
		staticfile.downfile(dir, req, res);
		return;
	}
	if (req.url.startsWith('/uploadphp')) {
		try {
			staticfile.uploadphp(dir, auth_username, req, res);
		} catch (E) {
			console.log(E);
		}
		return;
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
		return;
	}
	res.writeHead(301, { Location: '/uploadphp' });
	res.end();
}