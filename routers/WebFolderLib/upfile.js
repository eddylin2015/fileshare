'use strict';
var fs = require('fs');
const formidable = require('formidable');
const path = require('path');
const url_utils = require('url');
//express pug formidable
//cont opt={ uploadDir : config.get("StudentPhotoTmpDir"),  title: "TempDir"}

function down_pip_file(filename, res,uploadDir="") {
    let mimetype_ = mimetype(filename);
    filename = decodeURI(filename)
    console.log('read static file_pipe:' + filename);
    try {
        if (fs.existsSync(filename)) {
            if (mimetype_ == "NULL") {
                res.setHeader('Content-disposition', 'attachment; filename=' + encodeURI(filename.replace(uploadDir, "")));
            } else {
                res.writeHead(200, { 'Content-Type': mimetype_ });
            }
            fs.createReadStream(filename).pipe(res);
        }
        else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            return res.end("404 Not Found");
        }
    } catch (err) {
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

/* GET home page. */
function WebRouter(req, res, opt, code = []) {
    const { headers, method, url } = req;
    let subpath = ""
    if (url[url.length - 1] == "/") { subpath = url }
    else {
        let l_ = url.split("/");
        for (let i = 0; i < l_.length - 1; i++) { subpath += l_[i] + "/" }
    }
    console.log(method, url, subpath)
    let curr_path = opt.uploadDir + subpath; curr_path = decodeURI(curr_path).replace(/[/][/]/g, "/")

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
    } else if (req.url.indexOf('/pic') > -1) {
        res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
        var files = fs.readdirSync(curr_path);
        files.forEach(function (file) {
            let file_stat = fs.statSync(curr_path + "/" + file);
            if (file.toUpperCase().indexOf(".JPG") > -1 || file.toUpperCase().indexOf(".PNG") > -1 || file.toUpperCase().indexOf(".GIF") > -1) {
                if (subpath == "/") subpath = ""
                //res.write(`<img src=${subpath}/down?file=` + encodeURI(file) + ">" + file + "<br>");
                res.write(`<img src=down?file=` + encodeURI(file) + ">" + file + "<br>");
            }
        });
        res.end();
        return;
    } else if (req.url.indexOf('/dir') > -1 || req.url.indexOf('/ls') > -1) {
        res.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
        var files = fs.readdirSync(curr_path);
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
        var fpath = decodeURI(curr_path) + "/" + decodeURI(query.file);
        fpath = fpath.replace(/[/][/]/g, "/")
        if (typeof query.file != 'undefined') {
            down_pip_file(fpath, res, opt.uploadDir )
        }
        return;
    }
    else if (req.method == 'POST') {
        curr_path = decodeURI(curr_path).replace("//", "/")
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
            console.log(files)
            let file = files.file1
            let subdir = null;
            let filename = file.name.split("/")
            if (filename.length > 1) subdir = filename[filename.length - 2]
            filename = filename[filename.length - 1]
            if (subdir) {
                let subpath_ = path.join(form.uploadDir, subdir)
                if (fs.existsSync(subpath_)) {
                    filename = subdir + "\\" + filename
                }
            }
            console.log(path.join(form.uploadDir, file.name), filename)
            if (file) fs.promises.rename(file.path, path.join(form.uploadDir, filename));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ fields, files }, null, 2));
        });
        return;
    } else {
        //let stream = fs.createReadStream(path.join(__dirname, 'index.html'));  stream.pipe(res);
        var files = fs.readdirSync(decodeURI(curr_path));
        let file_list = []
        files.forEach(function (file) {
            let file_stat = fs.statSync(curr_path + "/" + file);
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
                file_list.push(`<div>file: <a href=${req.baseUrl}${encodeURI(subpath)}/down?file=` + encodeURI(file) + ">" + file + `</a>(${(file_stat.size / 1000000).toFixed(2)} m )</div>`);
            }
        });
        res.render('Photo/upfile4pic.pug', {
            profile: req.user,
            file_list: file_list,
            code: JSON.stringify([]),    //JSON.stringify(code) ,
            title: opt.title
        });
    }
}

module.exports = {
    WebRouter: WebRouter,
    mimetype: mimetype,
    down_pip_file: down_pip_file,
};


