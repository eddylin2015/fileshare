const cluster = require('cluster');
const http = require('http');
const formidable = require('formidable');
const path = require('path');
var fs = require("fs");
const url_utils = require('url');

/////
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
function down_pip_file (filename,  res) {
  mimetype_ =  mimetype(filename);
  console.log('read static file_pipe:' + filename);
  try {
    if (fs.existsSync(filename)) {
      if(mimetype_=="NULL"){
        res.setHeader('Content-disposition', 'attachment; filename=' + encodeURI(filename));
      }else{
        res.writeHead(200, { 'Content-Type': mimetype_ }); 
      }
      fs.createReadStream(filename).pipe(res);
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        return res.end("404 Not Found");
    }
  }catch (err) {
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
  // Worker 进程有一个http服务器
  http.Server((req, res) => {
    const { headers, method, url } = req;
    let subpath=""
    if(url[url.length-1]=="/") {subpath=url}else{let l_ =url.split("/");for(i=0;i<l_.length-1;i++){subpath+=l_[i]+"/"} }
    console.log(method, url,subpath)
    var coolauth = require('./inc/coolauth');
	  var auth_username = coolauth.auth(req, res);
	  if (auth_username == null) return;
    let uploadDir=`www`;
    let curr_path=uploadDir+subpath;
    if(req.url.indexOf('/makedir')>-1 )
    {
      var query = url_utils.parse(req.url, true).query;
      if (typeof query.dirname != 'undefined') {
          var dir = curr_path +"/"+ query.dirname
          if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
          }
      }
      res.writeHead(301, { Location: `${subpath}` });
      res.end();
      return;      
    }else if(req.url.indexOf('/dir')>-1 || req.url.indexOf('/ls')>-1 )
    {
      res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
      var files = fs.readdirSync(curr_path);
      //res.write("<a href='/Up_Step'>..</a><br>");
      files.forEach(function (file) {
        let file_stat=fs.statSync(curr_path +"/"+ file);
          if (file_stat.isDirectory()) {
              // filelist = walkSync(dir + file + '/', filelist);
              res.write(`<Div>Dir: <a href=${subpath}` + encodeURI(file) + "/>" + file + `</div> `);
          }
          else {
              //filelist.push(file);
              if(subpath=="/") subpath=""
              res.write(`<a href=${subpath}/down?file=` + encodeURI(file) + ">" + file + "</a>");
              res.write(`(${(file_stat.size/1000000).toFixed(2)} m )<br> `);
          }
      });
      res.end("<div> down speend 8m/sec.</div>");
      return;
    }
    else if(req.url.indexOf('/down?file=')>-1)
    {
      var query = url_utils.parse(req.url, true).query;
      if (typeof query.file != 'undefined') {
          down_pip_file(curr_path +"/"+ query.file,res)
      }
      return;
    }
    else if (req.method == 'POST') {
      // parse a file upload
      //if(req.url.indexOf('s=1')>-1){uploadDir=`xml/1`; }
    let form = formidable(
      { multiples: true,
        uploadDir: curr_path,
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
      let file=files.file1
      console.log( path.join(form.uploadDir, file.name))
      if(file) fs.promises.rename(file.path, path.join(form.uploadDir, file.name));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ fields, files }, null, 2));
    });
    return;
      /*
      let body = [];
      let len=0;
      req.on('error', (err) => {
         console.error(err);
      }).on('data', (chunk) => {
         //body.push(chunk);
         len+=chunk.length;
         console.log(len)
      }).on('end', () => {
         //body = Buffer.concat(body).toString();
         console.log(len);
         res.end(`Body accepted ${len} . `); 
      });*/
    }else {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      stream = fs.createReadStream(path.join(__dirname, 'views/html/index.html'));
      stream.pipe(res);
      /*
      res.end(`<form action="" enctype="multipart/form-data" method="post">
       <input type="file" name="upload" multiple="multiple">
       <input type="submit" value="Upload">
       </form>
       `);
       */
    }
  // 通知 master 进程接收到了请求
    process.send({ cmd: 'notifyRequest' });
  }).listen(81);
}

//https://nodejs.org/en/knowledge/HTTP/servers/how-to-handle-multipart-form-data/
//How to handle multipart form data
