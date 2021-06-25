'use strict';
var express = require('express');
var fs = require("fs");
var router = express.Router();
const upfileTools=require("../../inc/upfile")
const opt={uploadDir : 'www', title:"PhotoDir"}

function checkuser(req) {
    return true;   //return config.checkuser(req);
}

router.get('/',  (req, res, next) => {
    res.render('Photo/index.pug', {
        profile: req.user,
    });
});

/* GET home page. */
router.use(function (req, res, next) {
    if(!checkuser(req)) return res.end("U are Hacker!")
    upfileTools.WebRouter(req,res,opt);
});

module.exports = router;
