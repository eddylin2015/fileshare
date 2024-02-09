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
       '.ipynb':'application/vnd.jupyter',
       '.jar':'application/java-archive',
       '.java':'text/plain',
       '.jpeg':'image/jpeg',
       '.jpg':'image/jpeg',
       '.js':'application/javascript',
       '.json':'application/json',
       '.jsonld':'application/ld+json',
       '.m':'text/plain',
       '.md':'text/plain',
       '.mid':'audio/midi,audio/x-midi',
       '.midi':'audio/midi,audio/x-midi',
       '.mjs':'application/javascript',
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
       '.webmanifest':'application/manifest+json',
       '.webp':'image/webp',
       '.whl':'application/x-pywheel+zip',
       '.whl':'application/x-wheel+zip',
       '.woff':'font/woff',
       '.woff2':'font/woff2',
       '.xhtml':'application/xhtml+xml',
       '.xls':'application/vnd.ms-excel',
       '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       '.xml':'application/xml',
       '.xul':'application/vnd.mozilla.xul+xml',
       '.zip':'application/zip',
      
    };
    //</^[^.]+$|.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|html|xlsx|mjs|webmanifest|properties)$)([^.]+$)/>
    for (var x in mimetype_obj) {
        if (extra_name == x)
            return mimetype_obj[x];
    }
    return "NULL";
  };
  function files_zip_package(req, res, folderpath){
    child_process.execSync(`"C:\\Program Files\\7-Zip\\7z.exe"  a -tzip my_package.zip *.py -r -ir!*.txt -ir!*.csv -ir!*.db -xr!*.zip `, {
      cwd: folderpath
    });  
    res.end("my_package.zip")
  }
  function files_zip_downloads(req, res, folderpath) {
    // we want to use a sync exec to prevent returning response
    // before the end of the compression process
    //7z a -tzip archive.zip
    child_process.execSync(`"C:\\Program Files\\7-Zip\\7z.exe"  a -tzip my_package.zip * -x!*.zip `, {
      cwd: folderpath
    });
    // zip archive of your folder is ready to download
    tools.down_pip_file(folderpath + '/my_package.zip',res);
  }

  
function down_pip_file (filename,  res) {
  let mimetype_ =  mimetype(filename);
  
  filename=decodeURI(decodeURI(filename))
  filename=filename.replace(/[/]+/g,"/")
  console.log('read static file_pipe:' + filename);
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
function hostIP(postData, suburl, response) {
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
  }
module.exports={
    showIface:showIface,
    moveFile:moveFile,
    mimetype:mimetype,
    down_pip_file:down_pip_file,
    files_zip_downloads:files_zip_downloads,
    files_zip_package:files_zip_package,
    hostIP:hostIP,
}