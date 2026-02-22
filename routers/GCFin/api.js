'use strict';
var express = require('express');
var router = express.Router();

const edge = require('edge-js');
const fs = require('fs');
const path = require('path');

const GCPRenderer = edge.func({
    assemblyFile: path.resolve(__dirname, "/code/Ex2511/WindowsFormsApp1/GPCRender/bin/Debug/GPCRender.dll"),
    typeName: 'GPCRender.DriverRender',
    methodName: 'Upload'
});

const GCPSheet_Renderer = edge.func({
    assemblyFile: path.resolve(__dirname, "/code/Ex2511/WindowsFormsApp1/GPCRender/bin/Debug/GPCRender.dll"),
    typeName: 'GPCRender.SheetRender',
    methodName: 'Excel2Csv'
});

router.use((req, res, next) => {
    res.set('Content-Type', 'text/html; charset=utf-8');
    next();
})

router.get('/DRV', (req, res, next) => {
    const _Params = {
        rdlcPath: path.resolve(__dirname, "RdlcRender/Report1.rdlc"),
        dataSetName: 'DataSet1',
        dataSourceJson: ""
    };

    GCPRenderer(_Params, (error, result) => {
        if (error) return console.log(error);
        let d = new Date().toLocaleString('sv').replace(/[: -]/g, "");
        console.log(d, result);
    });
});

router.get('/', (req, res, next) => {
    const spreadsheetId = "1GMVVwNNDQy7zAb7JusUGiHs4opVsMiYjt_OlsRfRH3Y"; // Replace with your actual Spreadsheet ID
    const range = "工作表1!A1:Z78"; // Replace with your actual sheet name and range (A1 notation)
    GCPSheet_Renderer({ spreadsheetId: spreadsheetId, range: range }, (error, result) => {
        if (error) return console.log(error);
        let d = new Date().toLocaleString('sv').replace(/[: -]/g, "");
        let resultobj = JSON.parse(result);
        res.render('GCFin/table.pug', {
            books: resultobj,
            date_str: d,
        })
        //res.write("<table>")
        //for(let row of resultobj){
        //    res.write("<tr><td>")
        //    res.write(row.join("<td>"))
        //}
        //res.end("</table>")
    });
});


module.exports = router;
