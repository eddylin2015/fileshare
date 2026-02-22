var os = require('os');
const path = require('path');
var fs = require("fs");
const url_utils = require('url');
const child_process = require('child_process');
function showIface(){
var ifaces = os.networkInterfaces();
Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;
  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) { return;  }
    console.log(ifname + ':' + alias, iface.address); 
    ++alias;
  });
});
}

///application/json
const http_=require("http")
const querystring = require('querystring')
function PostData2MLPredict(data,cb){
//let param_postData = querystring.stringify(data);
let param_postData = JSON.stringify(data);
console.log("xxxx",param_postData)
let options = {
    hostname: "192.168.101.249", port: 83,
    path: "/ml/predict", method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(param_postData) },
    timeout: 10000,
};
let req = http_.request(options, (res) => {
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        cb(rawData);
    });
});
req.on('error', (e) => { console.error(`problem with request: ${e.message}`); });
req.on('timeout', () => {  request.destroy();});
req.write(param_postData);
req.end();
}
///

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
function mimetype(filename) {
    var dotoffset = filename.lastIndexOf('.');
    if (dotoffset == -1)
        return "NULL";
    var extra_name = filename.substr(dotoffset);
    var mimetype_obj = {
        '.3g2':'video/3gpp2',
        '.3gp':'video/3gpp',
        '.7z':'application/x-7z-compressed',
        '.aac':'audio/aac',
        '.abw':'application/x-abiword',
        '.apk':'application/vnd.android.package-archive',
        '.apk':'application/vnd.android.package-archive',
        '.arc':'application/x-freearc',
        '.avi':'video/x-msvideo',
        '.avif':'image/avif',
        '.azw':'application/vnd.amazon.ebook',
        '.bin':'application/octet-stream',
        '.bmp':'image/bmp',
        '.bz':'application/x-bzip',
        '.bz2':'application/x-bzip2',
        '.c':'text/plain',
        '.cda':'application/x-cdf',
        '.cpp':'text/plain',
        '.cs':'text/plain',
        '.csh':'application/x-csh',
        '.css':'text/css',
        '.csv':'text/csv',
        '.doc':'application/msword',
        '.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.eot':'application/vnd.ms-fontobject',
        '.epub':'application/epub+zip',
        '.epub':'application/epub+zip',
        '.gif':'image/gif',
        '.gz':'application/gzip',
        '.htm':'text/html',
        '.html':'text/html',
        '.ico':'image/vnd.microsoft.icon',
        '.ico':'image/x-icon',
        '.ics':'text/calendar',
        '.jar':'application/java-archive',
        '.java':'text/plain',
        '.jpeg':'image/jpeg',
        '.jpg':'image/jpeg',
        '.js':'text/javascript',
        '.json':'application/json',
        '.jsonld':'application/ld+json',
        '.m':'text/plain',
        '.md':'text/plain',
        '.mid':'audio/midi,audio/x-midi',
        '.midi':'audio/midi,audio/x-midi',
        '.mjs':'text/javascript',
        '.mp3':'audio/mpeg',
        '.mp4':'video/mp4',
        '.mpeg':'video/mpeg',
        '.mpkg':'application/vnd.apple.installer+xml',
        '.odp':'application/vnd.oasis.opendocument.presentation',
        '.ods':'application/vnd.oasis.opendocument.spreadsheet',
        '.odt':'application/vnd.oasis.opendocument.text',
        '.oga':'audio/ogg',
        '.ogv':'video/ogg',
        '.ogx':'application/ogg',
        '.opus':'audio/opus',
        '.otf':'font/otf',
        '.pdf':'application/pdf',
        '.php':'application/x-httpd-php',
        '.png':'image/png',
        '.ppt':'application/vnd.ms-powerpoint',
        '.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.py':'text/plain',
        '.rar':'application/vnd.rar',
        '.rs':'text/plain',
        '.rtf':'application/rtf',
        '.sh':'application/x-sh',
        '.svg':'image/svg+xml',
        '.tar':'application/x-tar',
        '.tif':'image/tiff',
        '.tiff':'image/tiff',
        '.ts':'video/mp2t',
        '.ttf':'font/ttf',
        '.txt':'text/plain',
        '.vsd':'application/vnd.visio',
        '.wasm':'application/wasm',
        '.wav':'audio/wav',
        '.weba':'audio/webm',
        '.webm':'video/webm',
        '.webp':'image/webp',
        '.woff':'font/woff',
        '.woff2':'font/woff2',
        '.xhtml':'application/xhtml+xml',
        '.xls':'application/vnd.ms-excel',
        '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xml':'application/xml',
        '.xul':'application/vnd.mozilla.xul+xml',
        '.zip':'application/zip',
    };
    for (var x in mimetype_obj) {
        if (extra_name == x)
            return mimetype_obj[x];
    }
    return "NULL";
  };

  function rm_file (filename,  res) {
    try {
      if (fs.existsSync(filename)) {
        fs.unlinkSync(filename)
      }
    }catch (err) {
      console.log(err);
    }
  }
  function files_zip_downloads(req, res, folderpath) {
    // we want to use a sync exec to prevent returning response
    // before the end of the compression process
    //7z a -tzip archive.zip
    console.log(folderpath)
    child_process.execSync(`"C:\\Program Files\\7-Zip\\7z.exe"  a -tzip my_package.zip * -x!*.zip `, {
      cwd: folderpath
    });
    // zip archive of your folder is ready to download
    down_pip_file(folderpath + '/my_package.zip',res);
  }

  
function down_pip_file (filename,  res) {
  let mimetype_ =  mimetype(filename);
  console.log('read static file_pipe:' + filename,mimetype_);
  let temp_=filename.split("/")
  try {
    if (fs.existsSync(filename)) {
      if(mimetype_=="NULL"){
        res.setHeader('Content-disposition', 'attachment; filename=' + encodeURI(temp_[temp_.length-1]));
      }else if(mimetype_.indexOf("text")>-1){
        res.writeHead(200, { 'Content-Type': mimetype_ +'; charset=utf-8'}); 
      }else if(mimetype_.indexOf("image")>-1){
        res.writeHead(200, { 'Content-Type': mimetype_ }); 
      }else{
        res.setHeader('Content-Type', mimetype_ ); 
        res.setHeader('Content-disposition', 'attachment; filename=' + encodeURI(temp_[temp_.length-1]));
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
function getClientIP(request){
  let clientIP = request.headers['x-forwarded-for']?request.headers['x-forwarded-for'].split(',').shift() : request.socket?request.socket.remoteAddress:"";  
  return clientIP
}
module.exports={
    showIface:showIface,
    moveFile:moveFile,
    mimetype:mimetype,
    down_pip_file:down_pip_file,
    files_zip_downloads:files_zip_downloads,
    rm_file:rm_file,
    PostData2MLPredict:PostData2MLPredict,
    getClientIP:getClientIP,
}