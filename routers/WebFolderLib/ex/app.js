const cluster = require('cluster');
const http = require('http');
const formidable = require('formidable');
const path = require('path');
var fs = require("fs");
const url_utils = require('url');
const coolauth = require('./inc/coolauth');
const tools=require('./inc/utils')
const {WebRouter}=require('./inc/webfolder')
const MBCDOCWebRouter=require('./inc/webfolder_mbc_doc')
var RamDisk=null;
const re_StrictIP = /^[/]StrictIP\d+/;
if(fs.existsSync("z:\\")) RamDisk="z:\\api\\";
tools.showIface()

var moveFile = (file, dir2)=>{
  //include the fs, path modules
  //gets file name and adds it to dir2
  var f = path.basename(file);
  var dest = path.resolve(dir2, f);
  fs.rename(file, dest, (err)=>{
    if(err) throw err;
    else console.log('Successfully moved');
  });
};

////
// const server = https.createServer(app);
// server.listen(port, function () {	});
////


if (cluster.isMaster) {
  let numReqs = 0; // 跟踪 http 请求
  setInterval(() => {
    console.log(`numReqs = ${numReqs}`);
  }, 30000);
  function messageHandler(msg) {if (msg.cmd && msg.cmd === 'notifyRequest') {  numReqs += 1; } }
  const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs; i++)    cluster.fork();
  for (let id in cluster.workers)      cluster.workers[id].on('message', messageHandler);
} else {
  http.Server((req, res) => {
    const { headers, method, url } = req;
    let subpath=""; if(url[url.length-1]=="/") {subpath=url}else{let l_ =url.split("/");for(i=0;i<l_.length-1;i++){subpath+=l_[i]+"/"} }
    console.log(method, url, subpath);
    //IP Strict-Start
    if(req.url.startsWith("/StrictIP"))
    {
      let ClientIP=tools.getClientIP(req);
      const ok = re_StrictIP.exec(req.url);
      if(ok&&ClientIP.indexOf(`192.168.${ok[0].replace("/StrictIP","")}`)>-1){ }else{ return res.end("StrictIP"+ClientIP); }
    }    
    //IP Strict-End
    //Ml / Predict-start
    if(req.method == 'POST' && req.url.startsWith("/ml/predict"))
    {
      let form_ = formidable.IncomingForm(); // form mulit-par
      form_.parse(req, (err, fields, files) => {
        if (err) {
          console.log(err);
          res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
          res.end(String(err));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        console.log(fields)
        tools.PostData2MLPredict(fields,(result)=>{
          console.log(result)
          res.end(result)
        })
      });
      return 
    }
    if(req.url.startsWith("/NewUI/"))
      {
        req.user={id:1}
        return MBCDOCWebRouter.WebRouter(req,res,"www/NewUI/","/NewUI",false);
      }    
    //Ml / Predict-end
    if(req.url.startsWith("/api/"))
    {
      if(RamDisk)
      {
        try{
          return WebRouter(req,res,RamDisk,"/api",false);
        }catch(exception_){

        }
      }
      else{
        return WebRouter(req,res,"www/temp/","/api",false);
      }
    }
    if(req.url.indexOf("/htm/")>-1)
    {
      let filename=req.url.split("/htm/")[1];
      let page=`views/html/${filename}`;
      res.writeHead(200, { 'Content-Type': 'text/html' })
      stream = fs.createReadStream(path.join(__dirname, page));
      stream.pipe(res);
      return
    }
    
	  var auth_username = coolauth.auth(req, res);
	  if (auth_username == null) return;
    let uploadDir=`www`;
    let curr_path=uploadDir+subpath;
    WebRouter(req,res,uploadDir,"/");
    // 通知 master 进程接收到了请求
    process.send({ cmd: 'notifyRequest' });
    
  }).listen(81);
}


// reference
// https://nodejs.org/en/knowledge/HTTP/servers/how-to-handle-multipart-form-data/
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
});
res.writeHead(200, { 'Content-Type': 'text/html' })
res.end(`<form action="" enctype="multipart/form-data" method="post">
 <input type="file" name="upload" multiple="multiple">
 <input type="submit" value="Upload">
 </form>
 `);
 */