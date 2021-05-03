const cluster = require('cluster');
const http = require('http');
const formidable = require('formidable');
const path = require('path');
var fs = require("fs");


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
//////////////////////////////////////////////////////////////////////////




if (cluster.isMaster) {

  // 跟踪 http 请求
  let numReqs = 0;
  setInterval(() => {
    console.log(`numReqs = ${numReqs}`);
  }, 10000);

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
    if (req.method == 'POST') {
      // parse a file upload
      let uploadDir=`www`;
      //if(req.url.indexOf('s=1')>-1){uploadDir=`xml/1`; }
    let form = formidable(
      { multiples: true,
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
      let file=files.file1
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
      stream = fs.createReadStream(path.join(__dirname, 'views/index.html'));
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
  }).listen(80);
}

//https://nodejs.org/en/knowledge/HTTP/servers/how-to-handle-multipart-form-data/
//How to handle multipart form data
