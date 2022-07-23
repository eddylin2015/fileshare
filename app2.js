'use strict'
const fs = require("fs");
const staticfile = require('./inc/StaticFile');
const formidable = require('formidable');
const process = require('process');
const url_utils = require('url');
const path = require('path');
const uploadDir =process.cwd()+"/www";
const port = 81;
const ignore_files=["ignore.txt","app.yaml","config.py","__pycache__","static", "tox.ini","model_cloudsql.py","mySession.1.py","mySession.py","storage.py","main.py","crud.py"]

function down_pip_file (filename,  res) {
    filename=decodeURI(filename)
    let mimetype_ =  mimetype(filename);
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
        '.jepg': 'image/jpeg',
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
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.disable('x-powered-by');
app.disable('etag');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded())

//app.use('/internal/photo', require('./routers/photo/api'));
function checkuser(req) {return true;}
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
        const headers = {
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
              piclist.push(`<img style="max-width:1500px" src=${subpath}/down?file=` + encodeURI(file) + ">" + file + "<br>");
          }
      });
      res.write(`<div style="position:fixed;top:0">
      <a href=${return_url}><button>return</button</a>
      <a href=${next_url}><button>next 10</button></a>
      <!-- a href=#posi0>pic 0</button></a -->
      <!-- a href=#posi1>pic 1</button></a -->
      <!-- a href=#posi2>pic 2</button></a -->
      <!-- a href=#posi3>pic 3</button></a -->
      <!-- a href=#posi4>pic 4</button></a -->
      <!-- a href=#posi5>pic 5</button></a -->
      <!-- a href=#posi6>pic 6</button></a -->
      <!-- a href=#posi7>pic 7</button></a -->
      <!-- a href=#posi8>pic 8</button></a -->
      <!-- a href=#posi9>pic 9</button></a -->

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
                res.write(`<img style="max-width:1500px" src=${subpath}/down?file=` + encodeURI(file) + ">" + file + "<br>");
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
                res.write(`<a href=${subpath}/down?file=` + encodeURI(file) + ">" + file + "</a>");
                res.write(`(${(file_stat.size / 1000000).toFixed(2)} m )<br> `);
            }
        });
        res.end("<div> down speend 8m/sec.</div>");
        return;
    }
    else if (req.url.indexOf('/down?file=') > -1) {
        var query = url_utils.parse(req.url, true).query;
        if (typeof query.file != 'undefined') {
            let filepath=curr_path + "/" + decodeURI(query.file);
            filepath =filepath.replace(/[/]+/g,"/")         
            down_pip_file(filepath, res)
        }
        return;
    }
    else if (req.method == 'POST' && req.url.indexOf('/edit?file=') > -1) {
        var query = url_utils.parse(req.url, true).query;
        if (typeof query.file != 'undefined') {
            let filepath=curr_path + "/" + query.file
            fs.writeFileSync(filepath,req.body.code)
            res.end('save.')
        }
        return;
    }
    else if (req.url.indexOf('/edit?file=') > -1) {
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
    else if (req.method == 'POST' && req.url.indexOf('/code?file=') > -1) {
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
    else if (req.url.indexOf('/code?file=') > -1) {
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
            if(ignore_files.indexOf(file.name)==-1) {
            let ofilename=file.name.replace(/[/]/g, "---");;
            if (file) fs.promises.rename(file.path, path.join(form.uploadDir, ofilename));
               res.writeHead(200, { 'Content-Type': 'application/json' });
               res.end(JSON.stringify({ fields, files }, null, 2));
            }else{
                res.end("err")
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
                let href_edit=`${req.baseUrl}${encodeURI(subpath)}/edit?file=` + encodeURI(file)
                let href_down=`${req.baseUrl}${encodeURI(subpath)}/down?file=` + encodeURI(file)
                let href_code=`${req.baseUrl}${encodeURI(subpath)}/code?file=` + encodeURI(file)
                if(file.indexOf(".py")>-1||file.indexOf(".htm")>-1){
                   file_list.push(`<div>file:<a href=${href_down}>` + file + `</a>
                   <a href=${href_edit}><button>E</button></a>
                   <a href=${href_code}><button>C</button></a>    (${(file_stat.size / 1000000).toFixed(2)} m )</div>`);
                }
                else if(file.indexOf(".mp4")>-1||file.indexOf(".mp4")>-1){
                    let href_video=`${req.baseUrl}${encodeURI(subpath)}/playvideo?file=` + encodeURI(file)
                    file_list.push(`<div>file:<a href=${href_down}>` + file + `</a>
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

//app.use((req, res) => {	res.status(404).send('Not Found');  });

app.listen(port, () => {
	staticfile.hostIP(); console.log(`Example app listening at http://localhost:${port}`)
})

//const server = https.createServer(app);
//server.listen(port, function () {	staticfile.hostIP()	;console.log("server running at https://IP_ADDRESS:", port)});
