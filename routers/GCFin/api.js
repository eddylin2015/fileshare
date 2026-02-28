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

const GCPSheetByParams_Renderer = edge.func({
    assemblyFile: path.resolve(__dirname, "/code/Ex2511/WindowsFormsApp1/GPCRender/bin/Debug/GPCRender.dll"),
    typeName: 'GPCRender.SheetRender',
    methodName: 'Excel2CsvByTicket'
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
    const range = "工作表1!A1:Z178"; // Replace with your actual sheet name and range (A1 notation)
    GCPSheet_Renderer({ spreadsheetId: spreadsheetId, range: range }, (error, result) => {
        if (error) return console.log(error);
        let d = new Date().toLocaleString('sv').replace(/[: -]/g, "");
        // __dirname       /routers/GCFIN/
        // process.cwd()   /
        fs.writeFile(path.resolve(process.cwd(), `www/FINDATA/Fin${d.slice(0,8)}.json`), result, err => {
          if (err) {
            console.error(err);
          } else {
            // file written successfully
          }
        });
        
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

router.get('/:ticket', (req, res, next) => {
    let  ticket=req.params.ticket.replace("_",":")
    const spreadsheetId = "1GMVVwNNDQy7zAb7JusUGiHs4opVsMiYjt_OlsRfRH3Y"; // Replace with your actual Spreadsheet ID
    const range = `HISTORY!A1:Z400`; // Replace with your actual sheet name and range (A1 notation)
    GCPSheetByParams_Renderer({ 
        spreadsheetId: spreadsheetId, 
        range: range,
        updrange:"HISTORY!A1",
        updvalue:ticket }, (error, result) => {
        if (error) return console.log(error);
        let d = new Date().toLocaleString('sv').replace(/[: -]/g, "");
        let resultobj = JSON.parse(result);
        res.render('GCFin/table_.pug', {
            books: resultobj,
            date_str: d,
        })
        //
        //res.write("<table>")
        //for(let row of resultobj){
        //    res.write("<tr><td>")
        //    res.write(row.join("<td>"))
        //}
        //res.end("</table>")
    });
});
router.get('/sheetname/:ticket', (req, res, next) => {
    let  ticket=req.params.ticket.replace("_",":")
    const spreadsheetId = "1GMVVwNNDQy7zAb7JusUGiHs4opVsMiYjt_OlsRfRH3Y"; // Replace with your actual Spreadsheet ID
    const range = `${ticket}!A1:Z400`; // Replace with your actual sheet name and range (A1 notation)
    GCPSheet_Renderer({ spreadsheetId: spreadsheetId, range: range }, (error, result) => {
        if (error) return console.log(error);
        let d = new Date().toLocaleString('sv').replace(/[: -]/g, "");
        let resultobj = JSON.parse(result);
        res.render('GCFin/table_.pug', {
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
