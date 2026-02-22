const cluster = require('cluster');
const http = require('http');
const formidable = require('formidable');
const path = require('path');
var fs = require("fs");
const url_utils = require('url');
var coolauth = require('./inc/coolauth');
let uploadDir = `www`;
let port = 85
//////////////////////////////////////////////////////////////////////////
var os = require('os');
var ifaces = os.networkInterfaces();
Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;
  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }
    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log(ifname + ':' + alias, iface.address);
    } else {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address);
    }
    ++alias;
  });
});
function down_pip_file(filename, res) {
  mimetype_ = mimetype(filename);
  console.log('read static file_pipe:' + filename);
  try {
    if (fs.existsSync(filename)) {
      if (mimetype_ == "NULL") {
        res.setHeader('Content-disposition', 'attachment; filename=' + encodeURI(filename));
      } else {
        res.writeHead(200, { 'Content-Type': mimetype_ }); //,"Content-Disposition":"attachment;filename=""});
      }
      fs.createReadStream(filename).pipe(res);
    }
    else {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end("404 Not Found");
    }
  }
  catch (err) {
    console.log(err);
  }
};
function mimetype(filename) {
  var dotoffset = filename.lastIndexOf('.');
  if (dotoffset == -1)
    return "NULL";
  var extra_name = filename.substr(dotoffset);
  var mimetype_obj = {
    '.html': 'text/html',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.txt': 'text/plain'
  };
  for (var x in mimetype_obj) {
    if (extra_name == x)
      return mimetype_obj[x];
  }
  return "NULL";
};

var express = require('express');
var app = express();
app.disable('x-powered-by');
app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
  let curr_user=coolauth.get_User(req,res);
  res.render("index",{profile:curr_user});
});
app.get('/login',coolauth.authRequired, (req, res) => {
  let curr_user=coolauth.get_User(req,res);
  res.render("index",{profile:curr_user});
});

function show_dir(req, res) {
  res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
  var files = fs.readdirSync(uploadDir);
  files.forEach(function (file) {
    let file_stat = fs.statSync(uploadDir + "/" + file);
    if (file_stat.isDirectory()) {
      // filelist = walkSync(dir + file + '/', filelist);
    }
    else {
      //filelist.push(file);
      res.write("<a href=/down?file=" + encodeURI(file) + ">" + file + "</a>");
      res.write(`(${(file_stat.size / 1000000).toFixed(2)} m )<br> `);
    }
  });
  res.end("<div> down speend 8m/sec.</div>");
  return;
}
app.get('/dir', (req, res) => {
  show_dir(req, res);
});
app.get('/ls', (req, res) => {
  show_dir(req, res);
});
app.get('/down', (req, res) => {
  var query = url_utils.parse(req.url, true).query;
  if (typeof query.file != 'undefined') {
    down_pip_file(uploadDir + "/" + query.file, res)
  }
  return;
});
app.get('/file_upload_parser.php', coolauth.authRequired,(req, res) => {
  let curr_user=coolauth.get_User(req,res);
  res.render("fileUpform",{profile:curr_user});
})
app.post('/file_upload_parser.php',coolauth.authRequired, (req, res) => {
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
    console.log(path.join(form.uploadDir, file.name))
    if (file) fs.promises.rename(file.path, path.join(form.uploadDir, file.name));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ fields, files }, null, 2));
  });
  return;
});
if (cluster.isMaster) {
  // 跟踪 http 请求
  let numReqs = 0;
  setInterval(() => {
    console.log(`numReqs = ${numReqs}`);
  }, 30000);
  // 计算请求数目
  function messageHandler(msg) {
    if (msg.cmd && msg.cmd === 'notifyRequest') {
      numReqs += 1;
    }
  }
  // 启动 worker 并监听包含 notifyRequest 的消息
  const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  for (const id in cluster.workers) {
    cluster.workers[id].on('message', messageHandler);
  }
} else {
  var server = app.listen(port, function () {
    console.log(`app listening at http://localhost:${port}`)
  })
}
