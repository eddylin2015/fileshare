const http = require('http');
const formidable = require('formidable');
const path = require('path');
const url_utils = require('url');
const coolauth = require('./coolauth');
const tools = require('./utils')
const fs = require('fs');
const child_process = require('child_process');


var moveFile = (file, dir2) => {
  //include the fs, path modules
  //gets file name and adds it to dir2
  var f = path.basename(file);
  if (!fs.existsSync(dir2)) return null;
  var dest = path.resolve(dir2, f);
  fs.rename(file, dest, (err) => {
    if (err) throw err;
    else console.log('Successfully moved');
  });
};


function WebRouter(req, res, FileShare_path = "", base_url = "/", authFlag = true) {
  const { headers, method, url } = req;
  if (url.indexOf('?rm&') > -1 ){
    let UserName =  coolauth.auth(req, res); if(UserName != 'pi') return res.end("err")
  }
  if (url.indexOf('InterDoc/eddy/') > -1 ){
    let UserName =  coolauth.auth(req, res); if(UserName != 'pi') return res.end("err")
  }

  let subpath, uploadDir, curr_path;
  if (base_url == "/") {
    subpath = ""; if (url[url.length - 1] == "/") { subpath = url } else { let l_ = url.split("/"); for (i = 0; i < l_.length - 1; i++) { subpath += l_[i] + "/" } }
    subpath = decodeURI(decodeURI(subpath))
    uploadDir = FileShare_path  //+`www`;
    curr_path = (uploadDir + subpath).replace(/[/]+/g, "/");
  } else {
    subpath = url.replace(base_url, "");
    if (url[url.length - 1] != "/") {
      let temp = "";
      let l_ = subpath.split("/");
      for (i = 0; i < l_.length - 1; i++) { temp += l_[i] + "/" }
      subpath = temp;
    }
    subpath = decodeURI(decodeURI(subpath))
    let www = "\\www"; if (FileShare_path.length > 0 && FileShare_path[FileShare_path.length - 1] == "\\") www = "www"
    uploadDir = FileShare_path //+`\\www`;
    uploadDir = uploadDir.replace(/\\\\/g, "\\")
    curr_path = uploadDir + subpath;
  }


  console.log(method, url, subpath, FileShare_path, curr_path);

  if (req.url.indexOf("?showinfo") > -1) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write(FileShare_path)
    res.write("<br>")
    res.write(base_url)
    res.write("<br>")
    res.write(curr_path)
    res.write("<br>")
    res.write(JSON.stringify([headers, method, url]))
    res.write("<br>")
    return res.end()
  }
  if (req.url.indexOf("/zipfiles") > -1) {
    return tools.files_zip_downloads(req, res, curr_path)
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
    return res.end();
  } else if (req.url.indexOf('renamefilename=') > -1) {
    var query = url_utils.parse(req.url, true).query;
    if (typeof query.file != 'undefined' && typeof query.renamefilename != 'undefined') {
      let sfile = path.join(curr_path, query.file)
      if (fs.existsSync(sfile)) {
        let dfile = path.join(curr_path, query.renamefilename);
        fs.promises.rename(sfile, dfile);
      }
    }
    res.end("rename!");
    return;
  } else if (req.url.indexOf("movallfiles") > -1) {
    var query = url_utils.parse(req.url, true).query;
    res.write(`${query.dirname}`)
    if (typeof query.dirname != 'undefined') {
      var dir = curr_path + "/" + query.dirname
      if (query.dirname == "MT") {
        dir = "C:/ASSETDIR/MT"
        if (fs.existsSync(dir)) {
          let files = fs.readdirSync(curr_path)
          for (let f of files) {
            if (f.match(/MT\d+[.]jpg/)) {
              res.write(`${f}`)
              tools.moveFile(curr_path + "/" + f, dir)
            }
            if (f.match(/SN[0-9a-zA-Z]+[.]jpg/)) {
              res.write(`${f}`)
              tools.moveFile(curr_path + "/" + f, dir)
            }
          }
        }
      } else {
        if (fs.existsSync(dir)) {
          let files = fs.readdirSync(curr_path)
          for (let f of files) {
            //if(f.match(/MT\d+[.]jpg/)){
            res.write(`${f}`)
            tools.moveFile(curr_path + "/" + f, dir)
            //}
          }
        }
      }
    }
    res.end("."); //res.writeHead(301, { Location: `${subpath}` });
    return;
  }
  else if (req.url.indexOf('?playSafariVideo&file=') > -1) {
    let videoPath = null;
    var query = url_utils.parse(req.url, true).query;
    if (typeof query.file != 'undefined') {
      videoPath = curr_path + "/" + query.file
    } else {
      return;
    }
    // Ensure there is a range given for the video
    let range = headers.range;
    if (!range) { range = "bytes=0-" }
    // get video stats (about 61MB)
    let videoSize = fs.statSync(videoPath).size;
    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const parts = range.split("-");
    //console.log("in", range, parts)
    const start = Number(parts[0].replace(/\D/g, ""));
    let end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    if (parts.length > 1 && parts[1] !== "") {
      end = Number(parts[1].replace(/\D/g, ""));
      if (end > 1) { end = Math.min(start + CHUNK_SIZE, videoSize - 1); }
    }
    //Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    // get video stats (about 61MB)
    if (range == "bytes=0-1") {
      console.log("0-1")
      res.writeHead(206, {
        //"Connection": "keep-alive",
        'Accept-Ranges': 'bytes',
        //'Keep-Alive': 'timeout=2, max=100',
        'Content-Type': "video/mp4",
        'Content-Range': 'bytes 0-1/' + videoSize,
        "Content-Length": 2,
        "Cache-Control": "max-age=2592000, public",
      });
      const fileStream = fs.createReadStream(videoPath, { start, end });
      fileStream.on("error", error => {
        console.log(`Error reading file ${videoPath}.`);
        console.log(error);
        res.sendStatus(500);
      });
      fileStream.pipe(res);
    } else {
      // Listing 6.
      //res.statusCode = start !== undefined || end !== undefined ? 206 : 200;
      res.statusCode = 206;
      res.setHeader("content-type", "video/mp4");
      res.setHeader("content-length", contentLength);
      res.setHeader("content-range", `bytes ${start}-${end}/${videoSize}`);
      res.setHeader("accept-ranges", "bytes");
      res.setHeader("Cache-Control", "max-age=2592000, public");
      console.log(`bytes ${start}-${end}/${videoSize}`)
      // Listing 7.
      const fileStream = fs.createReadStream(videoPath, { start, end });
      fileStream.on("error", error => {
        console.log(`Error reading file ${videoPath}.`);
        console.log(error);
        res.sendStatus(500);
      });
      fileStream.pipe(res);
    }
  }
  ///
  else if (req.url.indexOf('?playvideo&file=') > -1) {
    let videoPath = null;
    var query = url_utils.parse(req.url, true).query;
    if (typeof query.file != 'undefined') {
      videoPath = curr_path + "/" + query.file
    } else {
      return;
    }

    // Ensure there is a range given for the video
    let range = req.headers.range;
    if (!range) {
      //res.status(400).send("Requires Range header");
      range = "0";
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
    console.log(`bytes ${start}-${end}/${videoSize}`, contentLength)
    let headers = {
      "Connection": "keep-alive",
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
  ///
  else if (req.url.indexOf('/pic10') > -1) {
    var query = url_utils.parse(req.url, true).query;
    let token = (typeof query.token != 'undefined') ? Number(query.token) : 0;
    let return_url = req.url.split("pic10")[0];
    let next_url = req.url.split("/pic10")[0] + "/pic10?token=" + (token + 10)
    res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
    var files = fs.readdirSync(decodeURI(curr_path));
    let piclist = [];
    files.forEach(function (file) {
      let file_stat = fs.statSync(decodeURI(curr_path + "/" + file));
      if (file.toUpperCase().indexOf(".JPG") > -1 || file.toUpperCase().indexOf(".PNG") > -1 || file.toUpperCase().indexOf(".GIF") > -1 || file.toUpperCase().indexOf(".JFIF") > -1) {
        if (subpath == "/") subpath = ""
        piclist.push(`<img style="max-width:1500px" src=${subpath}${encodeURI(file)}?down&file=` + encodeURI(file) + ">" + file + "<br>");
      }
    });
    res.write(`<div style="position:fixed;top:0">
      <a href=${return_url}><button>return</button</a>
      <a href=${next_url}><button>next 10</button></a>
      </div>
      `);
    let cnt = 0;
    for (let i = 0; i < piclist.length; i++) {
      if (i >= token && i < (token + 10)) {
        res.write(`<div id="posi${cnt}"></div>`);
        cnt++;
        res.write(piclist[i]);
      }
    }
    res.end();
    return;
  }
  ///
  else if (req.url.indexOf('/pic') > -1) {
    res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
    res.write(`<meta name="viewport" content="width=device-width, initial-scale=1"></meta>`);
    var files = fs.readdirSync(curr_path);
    files.forEach(function (file) {
      let file_stat = fs.statSync(curr_path + "/" + file);
      if (file.toUpperCase().indexOf(".JPG") > -1 || file.toUpperCase().indexOf(".PNG") > -1 || file.toUpperCase().indexOf(".GIF") > -1 || file.toUpperCase().indexOf(".WEBP") > -1) {
        if (subpath == "/") subpath = ""
        res.write(`<img style="max-width: 75%;" src=${subpath}${encodeURI(file)}?down&file=` + encodeURI(file) + ">" + file + "<br>");
      }
    });
    res.end();
    return;
  } else if (req.url.indexOf('/dir') > -1 || req.url.indexOf('/ls') > -1) {
    res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
    if (!fs.existsSync(curr_path)) { return res.end(`"<a href=/>err</>"${curr_path}`); }
    var files = fs.readdirSync(curr_path);
    files.forEach(function (file) {
      let file_stat = fs.statSync(curr_path + "/" + file);
      if (subpath == undefined) subpath = ""
      let file_url = `${base_url}/${subpath}` + encodeURI(file)
      file_url = file_url.replace(/[/]+/g, "/")
      if (file_stat.isDirectory()) {
        // filelist = walkSync(dir + file + '/', filelist);
        res.write(`<Div>Dir: <a href=${file_url}` + "/>" + file + `</a></div> `);
      }
      else {
        // filelist.push(file);

        if (subpath == "/") subpath = ""
        let href_edit = `${file_url}?edit&file=` + encodeURI(file)//${req.baseUrl}
        let href_down = `${file_url}?down&file=` + encodeURI(file)
        let href_ios_video = `${file_url}?playSafariVideo&file=` + encodeURI(file)
        res.write(`<a href=${file_url}>` + file + `</a><a href=${href_down}><button>d</button></a>`);
        if (file.indexOf(".mp4") > -1 || file.indexOf(".webm") > -1) {
          res.write(`<a href=${href_ios_video}><button>i</button>I</a>`)
        }
        else if (file.indexOf(".htm") > -1 || file.indexOf(".txt") > -1 || file.endsWith(".py") || file.endsWith(".md")) {
          res.write(`<a href=${href_edit}><button>E</button></a>`);
        }
        res.write(`(${(file_stat.size / 1000000).toFixed(2)} m )<br>`);
      }
    });
    res.end("<div> download speed 8m/sec.</div>");
    return;
  }
  else if (req.url.indexOf('?down&file=') > -1) {
    var query = url_utils.parse(req.url, true).query;
    if (typeof query.file != 'undefined') {
      let filepath = curr_path + "/" + decodeURI(query.file)
      tools.down_pip_file(filepath.replace(/[/]+/g, "/"), res)
    }
    return;
  }
  else if (req.url.indexOf('?rm&file=') > -1) {
    var query = url_utils.parse(req.url, true).query;
    if (typeof query.file != 'undefined') {
      tools.rm_file(curr_path + "/" + query.file, res)
      res.end("ok")
    } else {
      res.end("err!")
    }
    return;
  }
  else if (req.url.indexOf('?mov&dirname=') > -1) {
    var query = url_utils.parse(req.url, true).query;
    if (typeof query.file != 'undefined' && typeof query.dirname != 'undefined') {
      let dir = curr_path + "/" + query.dirname
      moveFile(curr_path + "/" + query.file, dir)
      res.end("ok")
    } else {
      res.end("err!")
    }
    return;
  }
  else if (req.method == 'POST' && req.url.indexOf('?edit&file=') > -1) {
    let filename_ = decodeURI(req.url.split('?edit&file=').slice(-1))
    let filepath = (curr_path + "/" + filename_).replace(/[/]+/g, "/")
    let form_ = formidable.IncomingForm(); // form mulit-par
    form_.parse(req, (err, fields, files) => {
      if (err) {
        console.log(err);
        res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
        res.end(String(err));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      fs.writeFileSync(filepath, fields.code)
      //res.write(JSON.stringify({ fields, files }, null, 2));
      res.end('save.')
    });
    return;
  }
  else if (req.url.indexOf('?edit&file=') > -1) {
    var query = url_utils.parse(req.url, true).query;
    if (typeof query.file != 'undefined') {
      let filepath = curr_path + "/" + query.file
      if (!fs.existsSync(filepath)) return res.end("no file exists!")
      let code = fs.readFileSync(filepath, { encoding: 'utf8', flag: 'r' })
      let editor = filepath.indexOf(".py") > -1 ? 'views/html/edit2.html' : 'views/html/edit1.html'
      let htmlcode = fs.readFileSync(editor, { encoding: 'utf8', flag: 'r' })
      res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
      res.end(htmlcode.replace("!{code}", code).replace(/[!][{]filename[}]/g, query.file).replace(/[!][{]OriginUrl[}]/g, req.url))
    }
    return;
  }
  else if (req.method == 'POST') {
    curr_path = decodeURI(curr_path).replace(/[/]+/g, "/")
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
      if (file) fs.promises.rename(file.path, path.join(form.uploadDir, file.name));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ fields, files }, null, 2));
    });
    return;
  } else {
    let auth_username = null;
    if (authFlag) {
      auth_username = coolauth.auth(req, res);
      if (auth_username == null) return;
    }
    if (req.url.match(/(.md)/g)) {
      let filepath = uploadDir + "/" + decodeURI(req.url);
      if (!fs.existsSync(filepath)) return res.end("no file exists!")
      let code = fs.readFileSync(filepath, { encoding: 'utf8', flag: 'r' })
      let editor = 'views/html/marked.html'
      let htmlcode = fs.readFileSync(editor, { encoding: 'utf8', flag: 'r' })
      res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
      return res.end(htmlcode.replace("!{code}", code))
    }
    if (req.url.match(/[.](js|htm|py|css|txt|jpg|png|ico|zip|csv)/g)) {
      let filepath = uploadDir + "/" + decodeURI(req.url.replace(base_url,""));
      return tools.down_pip_file(filepath.replace(/[/]+/g, "/"), res)
    }
    if (req.url.indexOf('/MT/') > -1) {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      stream = fs.createReadStream(path.join(__dirname.replace("\\inc", ""), 'views/html/index_resizeimage.html'));
      return stream.pipe(res);
    }
    res.writeHead(200, { 'Content-Type': 'text/html' })
    stream = fs.createReadStream(path.join(__dirname.replace("\\inc", ""), 'views/html/index.html'));
    stream.pipe(res);
  }
}

module.exports = {
  WebRouter: WebRouter,
}