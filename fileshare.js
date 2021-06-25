'use strict'
const fs = require("fs");
const staticfile = require('./inc/StaticFile');
const formidable = require('formidable');
const path = require('path');
const hostdir = "www/";
const port = 81;

var express = require('express');
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.disable('x-powered-by');
app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use('/internal/photo', require('./routers/photo/api'));
app.get('/', (req, res) => {
	res.redirect("/form")
});
app.get('/mathkeyboard', (req, res) => {
	let mimetype = "text/html";
	staticfile._pipe(fs, 'views/html/mathkeyboard.html', mimetype, res);
});

app.get('/form', (req, res) => {
	let mimetype = "text/html";
	staticfile._pipe(fs, 'views/html/fileshare_form.html', mimetype, res);
});
app.post('/form', (req, res) => {
	let uploadDir = `www`;
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

//app.use(function (req, res) { WebRouter(req, res); });
//app.use((req, res) => {	res.status(404).send('Not Found');  });

app.listen(port, () => {
	staticfile.hostIP(); console.log(`Example app listening at http://localhost:${port}`)
})

//const server = https.createServer(app);
//server.listen(port, function () {	staticfile.hostIP()	;console.log("server running at https://IP_ADDRESS:", port)});
