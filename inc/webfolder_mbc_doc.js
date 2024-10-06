const http = require('http');
const formidable = require('formidable');
const path = require('path');
const url_utils = require('url');
const coolauth = require('../inc/coolauth');
const tools=require('../inc/utils')
const fs = require('fs');
const { cwd } = require('process');
console.log(`Current directory: ${cwd()}`);

var moveFile = (file, dir2)=>{
  //include the fs, path modules
  //gets file name and adds it to dir2
  var f = path.basename(file);
  if(!fs.existsSync(dir2)) return null;
  var dest = path.resolve(dir2, f);
  fs.rename(file, dest, (err)=>{
    if(err) throw err;
    else console.log('Successfully moved');
  });
};

function WebRouter(req, res, FileShare_path="", base_url="", adminRight=false) {
    const { headers, method, url } = req;
    
    let subpath=url.replace(base_url,"");
    if(url[url.length-1]!="/") {
      let temp="";
      let l_ =subpath.split("/");for(i=0;i<l_.length-1;i++){temp+=l_[i]+"/"} 
      subpath=temp;
    }
    subpath=decodeURI(decodeURI(subpath))
    let www="\\www"; if(FileShare_path.length>0&&FileShare_path[FileShare_path.length-1]=="\\") www="www"
    let uploadDir=FileShare_path+`\\www`;uploadDir.replace(/\\\\/g,"\\")
    let curr_path=uploadDir+subpath;

    console.log(method, url,subpath,curr_path);
    if(req.url.indexOf('/makedir')>-1 )
    {
      var query = url_utils.parse(req.url, true).query;
      if (typeof query.dirname != 'undefined') {
          var dir = curr_path +"/"+ query.dirname
          if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
          }
      }
      //res.writeHead(301, { Location: `${base_url}/${subpath}` });
      res.end("ok! [dir]");
      return;      
    }else if(req.url.indexOf("movallfiles")>-1){
      var query = url_utils.parse(req.url, true).query;
      res.write(`${query.dirname}`)
      if (typeof query.dirname != 'undefined') {
          var dir = curr_path +"/"+ query.dirname
          if(query.dirname=="MT"){
            dir ="C:/ASSETDIR/MT"
            if (fs.existsSync(dir)){
              let files=fs.readdirSync(curr_path)
              for(let f of files){
                if(f.match(/MT\d+[.]jpg/)){
                res.write(`${f}`)
                moveFile(curr_path+"/"+f, dir)
               }
              }
            }
          }else{
            if (fs.existsSync(dir)){
              let files=fs.readdirSync(curr_path)
              for(let f of files){
                //if(f.match(/MT\d+[.]jpg/)){
                res.write(`${f}`)
                moveFile(curr_path+"/"+f, dir)
               //}
              }
            }
          }
      }
      //res.writeHead(301, { Location: `${subpath}` });
      res.end(".");
      return; 

    }
    ///
    else if(req.url.indexOf('/playSafariVideo?file=') > -1){
      let videoPath=null;
      var query = url_utils.parse(req.url, true).query;
      if (typeof query.file != 'undefined') {
          videoPath =curr_path + "/" + query.file 
      }else{
          return;
      }
      // Ensure there is a range given for the video
      let range = headers.range;
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
      const contentLength = end - start + 1;
      // get video stats (about 61MB)
      if(range=="bytes=0-1"){
          console.log("0-1")

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
      //res.statusCode = start !== undefined || end !== undefined ? 206 : 200;
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
    ///
    else if(req.url.indexOf('/pic')>-1 )
    {
      res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
      var files = fs.readdirSync(curr_path);
      //res.write("<a href='/Up_Step'>..</a><br>");
      files.forEach(function (file) {
        let file_stat=fs.statSync(curr_path +"/"+ file);
        if (file.toUpperCase().indexOf(".JPG")>-1||file.toUpperCase().indexOf(".PNG")>-1||file.toUpperCase().indexOf(".GIF")>-1||file.toUpperCase().indexOf(".WEBP")>-1) {
              if(subpath=="/") subpath=""
              res.write(`<img style="max-width: 75%;" src=${subpath}/down?file=` + encodeURI(file) + ">" + file + "<br>");
          }
      });
      res.end();
      return;
    }else if(req.url.indexOf('/dir')>-1 || req.url.indexOf('/ls')>-1 )
    {
      res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
      if (!fs.existsSync(curr_path)) {return res.end(curr_path);}
      var files = fs.readdirSync(curr_path);
      files.forEach(function (file) {
        let file_stat=fs.statSync(curr_path +"/"+ file);
          if (file_stat.isDirectory()) {
              // filelist = walkSync(dir + file + '/', filelist);
              res.write(`Dir: <a href=${base_url}/${subpath}` + encodeURI(file) + "/>" + file + `</a><br>`);
          }
          else {
              // filelist.push(file);
              if(subpath=="/") subpath=""
              res.write(`<a href=${base_url}/${subpath}/down?file=` + encodeURI(file) + ">" + file + "</a>");
              if(file.indexOf(".mp4")>-1||file.indexOf(".webm")>-1){
                let href_ios_video=`${encodeURI(subpath)}/playSafariVideo?file=` + encodeURI(file)
                res.write(`<a href=${href_ios_video}><button>i</button>I</a>`)
              }              
              res.write(`(${(file_stat.size/1000000).toFixed(2)} m )<br> `);
          }
      });
      res.end("<div>.</div>");
      return;
    }
    else if(req.url.indexOf('/down?file=')>-1)
    {
      var query = url_utils.parse(req.url, true).query;
      if (typeof query.file != 'undefined') {
        tools.down_pip_file(curr_path +"/"+ query.file,res)
      }
      return;
    }
    else if(req.url.indexOf('filerename?')>-1 )
    {
      var query = url_utils.parse(req.url, true).query;
      console.log(query.file);
      console.log(query.renamefilename);
      if (typeof query.file != 'undefined' && typeof query.renamefilename != 'undefined') {
        let sfile = path.join(curr_path , query.file)
        console.log(sfile)
        //if (fs.existsSync(path.join(__dirname,sfile))){
        if (fs.existsSync(sfile)){
        let dfile = path.join(curr_path , query.renamefilename);
        console.log(dfile)
        fs.promises.rename(sfile,dfile);
        }
      }
      res.end("rename!");
      return;      
    }    
    else if(req.url.indexOf('/rm?file=')>-1)
    {
      var query = url_utils.parse(req.url, true).query;
      if (typeof query.file != 'undefined') {
        tools.rm_file(curr_path +"/"+ query.file,res)
        res.end("ok")
      }else{
        res.end("err!")
      }
      return;
    }    
    else if(req.url.indexOf('/mov?dirname=')>-1)
    {
      var query = url_utils.parse(req.url, true).query;
      if (typeof query.file != 'undefined' && typeof query.dirname != 'undefined') {
        let dir = curr_path +"/"+ query.dirname
        moveFile(curr_path +"/"+ query.file,dir)
        res.end("ok")
      }else{
        res.end("err!")
      }
      return;
    }    
    else if (req.method == 'POST' && req.url.indexOf('/edit?file=') > -1) {
      var query = url_utils.parse(req.url, true).query;
      if (typeof query.file != 'undefined') {
          let filepath=(curr_path + "/" + query.file).replace(/[/]+/g,"/")
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
            res.writeHead(200, { 'Content-Type': 'application/json' });
            fs.writeFileSync(filepath,fields.code)
            //res.write(JSON.stringify({ fields, files }, null, 2));
            res.end('save.')              
          });
          return;            

      }
      return;
  }
  else if (req.url.indexOf('/edit?file=') > -1) {
      var query = url_utils.parse(req.url, true).query;
      if (typeof query.file != 'undefined') {
          let filepath=curr_path + "/" + query.file
          //res.end(filepath.replace(/[/]+/g,"/"))
          if(!fs.existsSync(filepath)) return res.end("no file exists!")
          let code=fs.readFileSync(filepath,{encoding:'utf8', flag:'r'})
          let htmlcode=fs.readFileSync('views/html/edit1.html',{encoding:'utf8', flag:'r'})
          res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
           //OriginUrl
           //filename
          res.end(htmlcode.replace("!{code}",code).replace(/[!][{]filename[}]/g,query.file).replace(/[!][{]OriginUrl[}]/g,req.url))
      }
      return;
  }    
  else if(req.method == 'POST' && req.url.indexOf("/cmd")>-1)
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
          res.end("result.")
        });
        return 
    }

    else if (req.method == 'POST') {
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
        if(file.name){
          let file_name_=file.name.replace(/[\/]/g,"___")
          file_name_=file_name_.split("___")
          if(file_name_.length==1){
            if(file) fs.promises.rename(file.path, path.join(form.uploadDir, file.name));
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
      });
      return;
    }else {
      //var auth_username = coolauth.auth(req, res);
      var auth_username = req.user? req.user.id : null;
      if (auth_username == null) return res.end("login");
      res.writeHead(200, { 'Content-Type': 'text/html' })
      stream = fs.createReadStream(path.join(__dirname.replace("\\inc", ""), 'views/webfolder/index_mbc_doc.pug'));
      stream.pipe(res);
      //res.render('webfolder/index_mbc_doc.pug', {
      //  profile: req.user,
      //  adminRight:adminRight
      //});      
    }

}


module.exports={
    WebRouter:WebRouter,
}