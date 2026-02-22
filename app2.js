'use strict'
const fs = require("fs");
const tools = require('./inc/utils')
const webfolder = require('./inc/webfolder')
const webfolder_mbc_doc = require('./inc/webfolder_mbc_doc')
const MBCDOCWebRouter=require('./routers/WebFolderLib/webfolder_mbc_doc')
const formidable = require('formidable');
const process = require('process');
const url_utils = require('url');
const path = require('path');
const { cwd } = require('process');
const escaptcha = require('./inc/escaptcha');
const uploadDir =process.cwd()+"/www";
const port = 81;
const ignore_files=["ignore.txt","app.yaml","config.py","__pycache__","static", "tox.ini","model_cloudsql.py","mySession.1.py","mySession.py","storage.py","main.py","crud.py"]
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var serveStatic = require('serve-static')
//app.use(express.static(path.join(__dirname, 'public')));
app.use(serveStatic(path.join(__dirname, 'public'), {
    maxAge: '1d',
    setHeaders: setCustomCacheControl
  }))
function setCustomCacheControl (res, path) {
    if (serveStatic.mime.lookup(path) === 'text/html') {
      // Custom Cache-Control for HTML files
      res.setHeader('Cache-Control', 'public, max-age=0')
    }
    else if (serveStatic.mime.lookup(path) === 'text/html') {
      // Custom Cache-Control for HTML files
      res.setHeader('Cache-Control', 'public, max-age=0')
    }
}  
app.disable('x-powered-by');
app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/GCFin', require('./routers/GCFin/api'));
app.use('/NewUI', function (req, res) { 
  req.user={id:1}
  return MBCDOCWebRouter.WebRouter(req,res,process.cwd(),"/NewUI",false);
});
function checkuser(req) {return true;}
function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
  }
app.use(function (req, res, next) {
    if(req.url.indexOf('/snd') > -1){
        process.send({type:'UserMsg',message:'snd'})
        return res.end('snd')
    }
    if(req.url.indexOf('/ml/captcha') > -1){
        res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
        return  res.end(`<img src='${escaptcha.DrawNum(getRandomInt(100,999))}' />`)
    }
    if(req.url.indexOf('/ml/predict') > -1){
        let curr_path =decodeURI(uploadDir) ;
        let form = formidable(
            {
                multiples: true,
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
            console.log(fields)
            let logfile="predictor.log";
            let content=JSON.stringify(fields)
            if(fs.existsSync(logfile)){
                fs.appendFile(logfile, content , err => {
                    if (err) {
                      console.error(err);
                    } else {
                      // file written successfully
                    }
                  });
            }else{
                fs.writeFile(logfile, content, err => {
                    if (err) {
                      console.error(err);
                    } else {
                      // done!
                    }
                  });
            }
        });
        return res.end("OK");
    }  
    if(req.url.indexOf('?down&file=') > -1){
        return webfolder.WebRouter(req,res,uploadDir,"/")
    }  
    if(req.url.indexOf('?edit&file=') > -1){
        return webfolder.WebRouter(req,res,uploadDir,"/")
    }    
    if(req.url.startsWith('/lite/') && req.url.length>8){
        return tools.down_pip_file(uploadDir + "/" +req.url.split("?")[0],res)
    }
    if(req.url.startsWith('/sudoku') && req.url.length>9){
        return tools.down_pip_file(uploadDir + "/" +req.url.split("?")[0],res)
    }
    if(req.url=='/js-sudoku/app/' ){
        return next();
    }
    if(req.url.startsWith('/js-sudoku/') && req.url.length>11){
        return tools.down_pip_file(uploadDir + "/" +req.url.split("?")[0],res)
    }
    if(req.url.indexOf("&file=")>-1){
        return next();
    }    
    let m=req.url.match(/[.](js|mjs|html|htm|py|css|txt|jpg|png|ico|zip|tar|csv|pdf|whl|wasm|json|ipynb|webmanifest)$/g);
    if(m && m.length==1) {    
        return tools.down_pip_file(uploadDir + "/" +req.url.split("?")[0],res)
    }
    next();
})

app.use(function (req, res, next) {
    if (!checkuser(req)) return res.end("U are hacker!")
    const { headers, method, url } = req;
    let subpath = ""
    if (url[url.length - 1] == "/") { subpath = url }
    else {
        let l_ = url.split("/");
        for (let i = 0; i < l_.length - 1; i++) { subpath += l_[i] + "/" }
    }
    console.log(method, url, subpath)
    subpath=subpath.replace(/%25/g,"%").replace(/[/]+/g,"/")   
    let curr_path =decodeURI(uploadDir) +decodeURI(subpath);
    if (req.url.startsWith('/static/')){
        let filepath=uploadDir + "/" + decodeURI(req.url);
        filepath =filepath.replace(/[/]+/g,"/")         
        tools.down_pip_file(filepath, res)
        return;
    }
    if (req.url.indexOf('/api/SavaData') > -1) {
        res.end(JSON.stringify(req.body));
        return;
    }
    if (req.url.indexOf('/makedir') > -1) {
        var query = url_utils.parse(req.url, true).query;
        if (typeof query.dirname != 'undefined') {
            var dir = curr_path + "/" + query.dirname
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
        }
        res.writeHead(301, { Location: `${subpath}` });
        res.end();
        return;
    } 
    else if(req.url.indexOf('/playSafariVideo?file=') > -1){
        let videoPath=null;
        var query = url_utils.parse(req.url, true).query;
        if (typeof query.file != 'undefined') {
            videoPath =curr_path + "/" + query.file 
        }else{
            return;
        }
        // Ensure there is a range given for the video
        let range = req.headers.range;
        if(!range){range="bytes=0-"}
        console.log("in",range)
        // get video stats (about 61MB)
        let videoSize = fs.statSync(videoPath).size;
        // Parse Range
        // Example: "bytes=32324-"
        const CHUNK_SIZE = 10 ** 6; // 1MB
        const parts = range.split("-");
        console.log(parts)
        const start = Number(parts[0].replace(/\D/g, ""));
        let end = Math.min(start + CHUNK_SIZE, videoSize - 1);
        if(parts.length>1 && parts[1]!=="" ){
          end = Number(parts[1].replace(/\D/g, ""));
          if(end>1) {end = Math.min(start + CHUNK_SIZE, videoSize - 1);}
        }
        //Math.min(start + CHUNK_SIZE, videoSize - 1);
        // get video stats (about 61MB)
        const contentLength = end - start + 1;
        if(range=="bytes=0-1"){
            res.writeHead(206, {
                "Connection":"keep-alive",
                'Accept-Ranges': 'bytes',
                'Keep-Alive': 'timeout=2, max=100',
                'Content-Type': "video/mp4",
                'Content-Range': 'bytes 0-1/' + videoSize,
                "Content-Length": 2,
              });
              const fileStream = fs.createReadStream(videoPath, {start,end});
              fileStream.on("error", error => {
                  console.log(`Error reading file ${videoPath}.`);
                  console.log(error);
                  res.sendStatus(500);
              });
              fileStream.pipe(res);         
        }else{        
        // Listing 6.
        // res.statusCode = start !== undefined || end !== undefined ? 206 : 200;
        res.statusCode = 206;
        res.setHeader("content-type", "video/mp4");
        res.setHeader("content-length", contentLength);
        res.setHeader("content-range", `bytes ${start}-${end}/${videoSize}`);
        res.setHeader("accept-ranges", "bytes");
        console.log(`bytes ${start}-${end}/${videoSize}`)  
        // Listing 7.
        const fileStream = fs.createReadStream(videoPath, {start,end});
        fileStream.on("error", error => {
            console.log(`Error reading file ${videoPath}.`);
            console.log(error);
            res.sendStatus(500);
        });
        fileStream.pipe(res);         
       }
    } 
    else if(req.url.indexOf('/playvideo?file=') > -1){
        let videoPath=null;
        var query = url_utils.parse(req.url, true).query;
        if (typeof query.file != 'undefined') {
            videoPath =curr_path + "/" + query.file 
        }else{
            return;
        }
        // Ensure there is a range given for the video
        let range = req.headers.range;
        if (!range) {
          //res.status(400).send("Requires Range header");
          range="0";
        }
        // get video stats (about 61MB)
        let videoSize = fs.statSync(videoPath).size;
        // Parse Range
        // Example: "bytes=32324-"
        const CHUNK_SIZE = 10 ** 6; // 1MB
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
      
        // Create headers
        const contentLength = end - start + 1;

        console.log(`bytes ${start}-${end}/${videoSize}`,contentLength)
        let headers = {
          "Connection":"keep-alive",
          "Content-Range": `bytes ${start}-${end}/${videoSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": contentLength,
          "Content-Type": "video/mp4",
        };
        // HTTP Status 206 for Partial Content
        res.writeHead(206, headers);
        // create video read stream for this particular chunk
        const videoStream = fs.createReadStream(videoPath, { start, end });
        // Stream the video chunk to the client
        videoStream.pipe(res);            
    } 
    else if(req.url.indexOf('/pic10')>-1 )
    {
      var query = url_utils.parse(req.url, true).query;
      let token=0;
      if (typeof query.token != 'undefined') {
         token=Number(query.token);
      }
      let return_url=req.url.split("pic10")[0];
      let next_url=req.url.split("/pic10")[0]+"/pic10?token="+(token+10)
      res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
      var files = fs.readdirSync(decodeURI(curr_path));
      //res.write("<a href='/Up_Step'>..</a><br>");
      let piclist=[];
      files.forEach(function (file) {
        let file_stat=fs.statSync(decodeURI(curr_path +"/"+ file));
          if (file.toUpperCase().indexOf(".JPG")>-1||file.toUpperCase().indexOf(".PNG")>-1||file.toUpperCase().indexOf(".GIF")>-1||file.toUpperCase().indexOf(".JFIF")>-1) {
              if(subpath=="/") subpath=""
              piclist.push(`<img style="max-width:1500px" src=${subpath}?down&file=` + encodeURI(file) + ">" + file + "<br>");
          }
      });
      res.write(`<div style="position:fixed;top:0">
      <a href=${return_url}><button>return</button</a>
      <a href=${next_url}><button>next 10</button></a>
      </div>
      `);
      let cnt=0;
      for(let i=0;i<piclist.length;i++){
        if(i>=token && i<(token+10)){
          res.write( `<div id="posi${cnt}"></div>`);
          cnt++;
          res.write(piclist[i]);
        }
      }
      res.end();
      return;
    }
    else if (req.url.indexOf('/pic') > -1) {
        res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
        res.write(`<meta name="viewport" content="width=device-width, initial-scale=1"></meta>`);
        var files = fs.readdirSync(decodeURI(curr_path));
        //res.write("<a href='/Up_Step'>..</a><br>");
        files.forEach(function (file) {
            let file_stat = fs.statSync(curr_path + "/" + file);
            if (file.toUpperCase().indexOf(".JPEG") > -1 ||file.toUpperCase().indexOf(".JPG") > -1 || file.toUpperCase().indexOf(".PNG") > -1 || file.toUpperCase().indexOf(".GIF") > -1) {
                if (subpath == "/") subpath = ""
                subpath= subpath.replace(/[/]+/g,"/")         
                res.write(`<img style="max-width:1500px" src=${subpath}?down&file=` + encodeURI(file) + ">" + file + "<br>");
            }
        });
        res.end();
        return;
    } else if (req.url.indexOf('/dir') > -1 || req.url.indexOf('/ls') > -1) {
        res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
        var files = fs.readdirSync(curr_path);
        //res.write("<a href='/Up_Step'>..</a><br>");
        files.forEach(function (file) {
            let file_stat = fs.statSync(curr_path + "/" + file);
            if (file_stat.isDirectory()) {
                // filelist = walkSync(dir + file + '/', filelist);
                res.write(`<Div>Dir: <a href=${subpath}` + encodeURI(file) + "/>" + file + `</a></div> `);
            }
            else {
                //filelist.push(file);
                if (subpath == "/") subpath = ""
                res.write(`<a href=${subpath}?down&file=` + encodeURI(file) + ">" + file + "</a>");
                res.write(`(${(file_stat.size / 1000000).toFixed(2)} m )<br> `);
            }
        });
        res.end("<div> down speend 8m/sec.</div>");
        return;
    }
    else if (req.url.indexOf('?down&file=') > -1) {
        var query = url_utils.parse(req.url, true).query;
        if (typeof query.file != 'undefined') {
            let filepath=curr_path + "/" + decodeURI(query.file);
            filepath =filepath.replace(/[/]+/g,"/")   
            console.log(curr_path,query.file);      
            tools.down_pip_file(filepath, res)
        }
        return;
    }
    else if (req.method == 'POST' && req.url.indexOf('?edit&file=') > -1) {
        var query = url_utils.parse(req.url, true).query;
        if (typeof query.file != 'undefined') {
            let filepath=curr_path + "/" + query.file
            fs.writeFileSync(filepath,req.body.code)
            res.end('save.')
        }
        return;
    }
    else if (req.url.indexOf('?edit&file=') > -1) {
        var query = url_utils.parse(req.url, true).query;
        if (typeof query.file != 'undefined') {
            let filepath=curr_path + "/" + query.file
            let code=fs.readFileSync(filepath)
            res.render('edit.pug', {
                code: code
            });
        }
        return;
    }
    else if (req.method == 'POST' && req.url.indexOf('?code&file=') > -1) {
        var query = url_utils.parse(req.url, true).query;
        if (typeof query.file != 'undefined') {
            let filepath=curr_path + "/" + query.file
            if(req.body.code){
                fs.writeFileSync(filepath, req.body.code)
            }else{
                ////
                curr_path = decodeURI(curr_path).replace(/[/]+/g,"/")         
                let form = formidable(
                    {
                        multiples: true,
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
                    let filepath=curr_path + "/" + query.file
                    fs.writeFileSync(filepath, fields.code)
                    //let file = files.file1
                    //if(ignore_files.indexOf(file.name)==-1) {
                    //let ofilename=file.name.replace(/[/]/g, "---");;
                    //if (file) fs.promises.rename(file.path, path.join(form.uploadDir, ofilename));
                    //   res.writeHead(200, { 'Content-Type': 'application/json' });
                    //   res.end(JSON.stringify({ fields, files }, null, 2));
                    //}else{
                    //    res.end("err")
                    //}
                });
            }
            res.end(req.body.code)
        }
        return;
    }
    else if (req.url.indexOf('?code&file=') > -1) {
        let MyBaseUrl="";
        var query = url_utils.parse(req.url, true).query;
        if (typeof query.file != 'undefined') {
            let filepath=curr_path + "/" + query.file
            let code=fs.readFileSync(filepath)
            res.render('codeview.pug', {
                code: code,
                posturl:MyBaseUrl+req.url,
            });
        }
        return;
    }
    ////
    else if (req.method == 'POST') {
        // parse a file upload
        // if(req.url.indexOf('s=1')>-1){uploadDir=`xml/1`; }
        curr_path = decodeURI(curr_path).replace(/[/]+/g,"/")         
        let form = formidable(
            {
                multiples: true,
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
            let file = files.file1
            if(file){}else{return res.end("err")}
            if(ignore_files.indexOf(file.name)==-1) {
                ////modify 241003
                if(file){
                    let ofilename=file.name.replace(/[\/]/g,"___")
                    let file_name_=ofilename.split("___")
                    if(file_name_.length==1){
                      if(file) fs.promises.rename(file.path, path.join(form.uploadDir, ofilename));
                    }else{
                      let sub_path_=file_name_.slice(0,-1);
                      for(let i=0;i<sub_path_.length;i++){
                        let sub_path__=path.join(cwd(),path.join(form.uploadDir, sub_path_.slice(0,i+1).join("/")))
                        if(form.uploadDir.indexOf(":")>-1)
                          sub_path__=path.join(form.uploadDir, sub_path_.slice(0,i+1).join("/"))
                        console.log("MAKE Dir",sub_path__)
                        if (!fs.existsSync(sub_path__)){
                          fs.mkdirSync(sub_path__);
                        }
                      }
                      if(file) fs.promises.rename(file.path, path.join(form.uploadDir, file.name));
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ fields, files }, null, 2));
                  }else{
                    res.end('err')
                  }
               ////end 241003
            }else{
                res.end("err:ignore_files")
            }
        });
        return;
    } else {
        // let stream = fs.createReadStream(path.join(__dirname, 'index.html'));  stream.pipe(res);
        curr_path = decodeURI(curr_path).replace("//", "/")
        if(!fs.existsSync(decodeURI(curr_path))) return res.end("<Div>Dir: <a href=/>HOME</a></div>")
        var files = fs.readdirSync(decodeURI(curr_path));
        // res.write("<a href='/Up_Step'>..</a><br>");
        let file_list = []
        files.forEach(function (file) {
            if(ignore_files.indexOf(file)==-1) {
            let file_stat = fs.statSync(decodeURI(curr_path + "/" + file));
            if (file_stat.isDirectory()) {
                // filelist = walkSync(dir + file + '/', filelist);
                if (subpath == "") {
                    file_list.push(`<Div>Dir: <a href=${req.baseUrl}/` + encodeURI(file) + "/>" + file + `</a></div> `);
                } else {
                    file_list.push(`<Div>Dir: <a href=${req.baseUrl}${encodeURI(subpath)}` + encodeURI(file) + "/>" + file + `</a></div> `);
                }
            }
            else {
                //filelist.push(file);
                if (subpath == "/") subpath = ""
                ////
                let href_edit=`${req.baseUrl}${encodeURI(subpath)}?edit&file=` + encodeURI(file)
                let href_down=`${req.baseUrl}${encodeURI(subpath)}?down&file=` + encodeURI(file)
                let href_code=`${req.baseUrl}${encodeURI(subpath)}?code&file=` + encodeURI(file)                
                //let href_edit=`${req.baseUrl}${encodeURI(subpath)}/edit?file=` + encodeURI(file)
                //let href_down=`${req.baseUrl}${encodeURI(subpath)}/down?file=` + encodeURI(file)
                //let href_code=`${req.baseUrl}${encodeURI(subpath)}/code?file=` + encodeURI(file)
                if(file.indexOf(".py")>-1||file.indexOf(".htm")>-1||file.indexOf(".ino")>-1){
                   file_list.push(`<div>file:<a href=${href_down}>` + file + `</a>
                   <a href=${href_edit}><button>E</button></a>
                   <a href=${href_code}><button>C</button></a>    (${(file_stat.size / 1000000).toFixed(2)} m )</div>`);
                }
                else if(file.indexOf(".mp4")>-1||file.indexOf(".mp4")>-1){
                    let href_video=`${req.baseUrl}${encodeURI(subpath)}/playvideo?file=` + encodeURI(file)
                    let href_ios_video=`${req.baseUrl}${encodeURI(subpath)}/playSafariVideo?file=` + encodeURI(file)
                    file_list.push(`<div>file:<a href=${href_down}>` + file + `</a>
                    <a href=${href_ios_video}><button>i</button></a>
                    <a href=${href_video}><button>V</button></a>    (${(file_stat.size / 1000000).toFixed(2)} m )</div>`);
                }
                else
                {                
                //file_list.push(`<div>file: <a href=${req.baseUrl}${encodeURI(subpath)}/down?file=` + encodeURI(file) + ">" + file + `</a>(${(file_stat.size / 1000000).toFixed(2)} m )</div>`);
                file_list.push(`<div>file: <a href=${href_down}>` + file + `</a>(${(file_stat.size / 1000000).toFixed(2)} m )</div>`);
                }
            }
        }
        });

        res.render('upfile.pug', {
            file_list: file_list
        });
    }
});

//app.use((req, res) => { res.status(404).send('Not Found'); });
//app.listen(port, () => {
//	tools.hostIP(); console.log(`running at http://localhost:${port}`)
//})



///cluster
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const WorkerList=[];
if (cluster.isPrimary) { // 主进程逻辑
  console.log(`主进程 ${process.pid} 启动`);

  // 启动工作进程
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    WorkerList.push(worker)

    // 向工作进程发送消息
    worker.send({ type: 'init', message: '来自主进程的初始化消息' });

    // 监听工作进程的回复
    worker.on('message', (msg) => {
      if(msg?.type=='UserMsg'){
        console.log(`主进程收到工作进程 ${worker.id} 的消息:`, msg);
        WorkerList.forEach(wk=>{
            wk.send({ type: 'UserMsg', message: '2012014' })
        })
      }
      if(msg?.type=='reply')
        console.log(`主进程收到工作进程 ${worker.id} 的消息:`, msg);
    });
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.id} 退出，重启中...`);
    cluster.fork(); // 自动重启工作进程
  });

} else { // 工作进程逻辑
  // 工作进程监听主进程消息
  process.on('message', (msg) => {
    console.log(`工作进程 ${process.pid} 收到消息:`, msg);
    // 回复主进程
    process.send({ type: 'reply', message: `工作进程 ${process.pid} 已收到` });
  });

  // 工作进程业务逻辑（如启动 HTTP 服务）
  
  const server = require('http').createServer(app);
  server.listen(port, function () { tools.hostIP(); console.log("running at https://IP_ADDRESS:", port)});
  //const http = require('http');
  //http.createServer((req, res) => {
  //  res.end(`由工作进程 ${process.pid} 处理`);
  //}).listen(3000);
}

///