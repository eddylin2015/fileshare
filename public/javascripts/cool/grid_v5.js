`
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="/static/javascripts/jquery.js"></script>
    <script src="/static/jquery-ui-dist/jquery-ui.min.js"></script>
    <link href= "/static/jquery-ui-dist/jquery-ui.min.css" rel="stylesheet">
    <script src="/static/javascripts/bootstrap.js"></script>
	<link rel="stylesheet" href="/static/stylesheets/bootstrap.min.css">
    <script src="/static/javascripts/cool/grid_v5.js"></script>
    <link rel="stylesheet" href="/static/javascripts/cool/grid.css">
    <style>
        textarea { min-width: 40px; min-height: 30px; }
		div.container { margin: 0px; }
    </style>
    <script>
	    $(document).ready(function () {
        let cgrid=new CoolGrid(document.getElementById('EDUTBL'));
		var fn = '';
        var PostUrl = '/internal/api/updaterow';   
        var returnUrl = '/api/DataViewGrid';
        //BindingFunctions("editbtn", "savebtn", 'readmodebtn');
        //GenOriginalData();
        //$('#exportxls_button').click(function () { exportxls_button('EDUTBL'); });
        //$("#exportcsv_button").on('click', function (event) { exportcsv_button("EDUTBL"); });
        //$('td').filter(function () { return this.innerHTML.match(/^[0-9\s\.,]+$/); }).css('text-align', 'right');
        });  
    </script>
</head>
<body>
    <div class="navbar navbar-default">
        <div class="container">
            <div class="navbar-header">
                <div class="navbar-brand"></div><a class="navbar-brand"><img src="DataViewGrid.png" width="50px"></a>
            </div>
            <ul class="nav navbar-nav">
                <li><a href="/"> <span class="glyphicon">&#xe021</span></a></li>
                <li><a href="/internal/attrollcall">DataViewGrid Component</a></li>
            </ul>
            <p class="navbar-text navbar-right"><span>UserNme &nbsp;<a href="/logout">(logout)</a></span></p>
        </div>
    </div>
    <div><a class="btn btn-primary btn-sm" href="#" style="color:yellow;" id="editbtn">編輯</a>
         <a class="btn btn-primary btn-sm" href="#" style="color:yellow;" id="savebtn">儲存</a>
         <a class="btn btn-primary btn-sm" href="#" style="color:yellow;" id="readmodebtn">唯讀</a>
         <a class="btn btn-primary btn-sm" href="#" style="color:yellow;" id="exportcsv_button">匯出csv</a>
         <a class="btn btn-primary btn-sm" href="#" style="color:yellow;" id="exportxls_button">匯出xls</a>
	</div>
    <div class="container">
        <table class="table" id="EDUTBL">
            <tr>
                <td>al-id</td>
                <td>act-c-id</td>
                <td>lesson</td>
                <td>shortname</td>
                <td>al-datetime</td>
                <td>al-datetime-end</td>
                <td>rpt</td>
                <td>disable</td>
            </tr>
            <tr>
                <td>16</td>
                <td class="M" id="MB_act-c-id_16">16</td>
                <td class="M" id="MC_lesson_16">小一信</td>
                <td class="M" id="MD_shortname_16">P1A</td>
                <td class="M" id="ME_al-datetime_16">202403191559</td>
                <td class="M" id="MF_al-datetime-end_16">202404291559</td>
                <td class="M" id="MG_rpt_16">1</td>
                <td class="M" id="MH_disable_16">0</td>
            </tr>
		</table>
	</div>
</body>
`
class FrmMessageBox {
	constructor() {
		this.messagebox = $("<div><h4>Message Bo<a href='#' onclick='FrmMessageBox.closebox(this);'>[x]</a></h4></div>")
			.css({
				'position': 'absolute',
				'right': '10%',
				'top': '10%',
				'border': '3px solid black',
				'background-color': 'white',
				'overflow': 'scroll',
				'height': '400px'
			}).width(400).height(300).appendTo("body");
		this.year = 0;
	}
	static closebox(x) { x.parentElement.parentElement.style.display = "none"; }
	msg(x) {
		this.messagebox.html(this.messagebox.html() + '<br>' + x);
	}
}

function ArrayPast2Table(tablename, fieldname, fill_data) {
	var table = document.getElementById(tablename);
	var rowLength = table.rows.length;
	var find_column_id = -1;
	var procmsg = '';
	loopcnt = rowLength;
	if (fill_data.length < loopcnt) loopcnt = fill_data.length;
	for (var i = 0; i < loopcnt; i += 1) {
		var row = table.rows[i];
		var cellLength = row.cells.length;
		if (i == 0) {
			for (var y = 1; y < cellLength; y++) {
				var cell = row.cells[y];
				//if(cell.innerHTML.trim()==fieldname)
				var cellinnerHTML = cell.innerHTML;
				try { cellinnerHTML = cell.innerHTML.trim(); } catch (e) { }
				if (cellinnerHTML == fieldname) {
					find_column_id = y;
					procmsg += "find field in table:" + fieldname + "at" + find_column_id;
				}
			}
		} else {
			for (var y = 1; y < cellLength; y++) {
				var cell = row.cells[y];
				if (y == find_column_id) {
					cell.innerHTML = fill_data[i];
					procmsg += "\n" + i + ":" + y + ":" + cell.innerHTML + "-" + fill_data[i];
				}
			}
		}
	}
	return procmsg;
}

class CoolGrid {
	constructor(tbl,cfg={fn:"ex_data",PostUrl:null}) {
		this.table = tbl;
		this.cfg=cfg;
		this.DebugFlag = null;
		this.EnabledUpDownKeyJumpToNextCell = true;
		this.ZeroMarkWarning_Flag = false;
		this.curr_td = null;
		this.PastFrm = null;
		this.CSVFrm = null;
		this.OriginalData = null;
		this.PostUrl = null;
		this._Field_Defs = null;
		this.head_editMod_status = new Object();
		let self=this;
		Array.from(this.table.rows).forEach((row) => Array.from(row.children).forEach((colu) => {
			colu.addEventListener("click", function (event) {
				var edit_cell = self.editCell($(this));
				if (edit_cell) edit_cell.focus();
			});
		}));
		//$('td.M').click(function (event) {});
	}
	GenOriginalData() {
		if (this.OriginalData == null) {
			//closeedit();
			this.OriginalData = {};
			let OD = this.OriginalData
			let self=this;
			$('.M').each(function (i) {
				OD[$(this).attr('id')] = self.GetCell($(this))
			});
		}
	}
	greet() {
		console.log(this.table)
	}
	bind_txtinput_paste($txtinput, cell) {
		$txtinput.bind('paste', function (e) {
			var txt = e.originalEvent.clipboardData.getData('Text').replace(/\n$/, "");
			var data_arr = txt.split('\n');
			var rowcnt = data_arr.length; let linefeed = false;
			var colcnt = data_arr[0].split('\t').length;
			var f_data_arr = new Array();
			for (let i = 0; i < rowcnt; i++) {
				f_data_arr[i] = new Array();
			}
			for (let j = 0; j < rowcnt; j++) {
				var temp_ar = data_arr[j].split('\t');
				if (temp_ar.length >= colcnt) {
					for (let k = 0; k < colcnt; k++)
						f_data_arr[j][k] = temp_ar[k].replace(/\n$/, "").replace(/\r$/, "");
				}
			}
			if (rowcnt > 1 || colcnt > 1) {
				if (confirm("DataGrid " + rowcnt + "x" + colcnt + " Paste " + rowcnt + "x" + colcnt + "?")) {
					var c_cell = cell;
					var c_cell_col_id = 0;
					var f_cell = c_cell.parent().children('td:first');
					for (let i = 0; i < 64; i++) {
						c_cell_col_id++;
						if (c_cell.attr('id') == f_cell.attr('id')) {
							break;
						}
						f_cell = f_cell.next();
					}
					for (let rid = 0; rid < rowcnt; rid++) {
						for (let cid = 0; cid < colcnt; cid++) {
							if (c_cell.has(":input").length > 0) {
								let input = c_cell.children();
								let strv = input.val(f_data_arr[rid][cid]);
							} else {
								c_cell.text(f_data_arr[rid][cid]);
							}
							if (cid < colcnt - 1)
								c_cell = c_cell.next();
						}
						c_cell = c_cell.parent().next('tr').children('td:first');
						for (let i = 1; i < c_cell_col_id; i++) { c_cell = c_cell.next(); }
					}
					return false;
				} else { return true; }
			}
		});
	}
	editCell(cell) {
		//$txt=$('<input type=text>');
		//$txt.width(cell.width()-3);
		let self=this;
		if (cell.has(":input").length == 0) {
			let $txt = $('<textarea></textarea>');
			$txt.width(cell.width() - 5);
			$txt.height(cell.height() - 5);
			self.bind_txtinput_paste($txt, cell);  //cell past 2014/06/03	
			var val = cell.text();
			cell.text("");
			$txt.val(val);
			cell.append($txt);
			return $txt;
		}
	}

	closeedit() {
		$('.M').each(function (i) {
			if ($(this).has(":input[type=radio]").length > 0) {

			}
			else if ($(this).has(":input").length > 0) {
				input = $(this).children();
				$(this).text(input.val());
				input.remove();
			}
		});
	}
	GetCell(x) {
		if (x.has(":input[type=radio]").length > 0) {
			let a = x.has(":input[type=radio]")
			for (let b of a.children())
				if (b.checked) {
					alert(b.value)
					return b.value;
				}
		} else if ($(this).has(":input").length > 0) {
			return $(this).children().val();
		}
		return $(x).text()
	}
	cell_closeedit() {
		$('.M').each(function (i) {
			if ($(this).has(":input[type=radio]").length > 0) {

			} else if ($(this).has(":input").length > 0) {
				let input = $(this).children();
				$(this).text(input.val());
				input.remove();
			}
		});
	}
	exportxls(EDUTBL) {
	    let self=this;
		self.cell_closeedit();
		var universalBOM = "\uFEFF";
		var txt = document.getElementById(EDUTBL).innerHTML;
		var htmls = "";
		var uri = 'data:application/vnd.ms-excel;charset=UTF-8;base64,';
		var template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>';
		var base64 = function (s) {
			return window.btoa(unescape(encodeURIComponent(s)))
		};
		var format = function (s, c) {
			return s.replace(/{(\w+)}/g, function (m, p) {
				return c[p];
			})
		};
		htmls = txt
		var ctx = {
			worksheet: 'Worksheet',
			table: htmls
		}
		var link = document.createElement("a");
		link.download = "export.xls";
		link.href = uri + base64(format(template, ctx));
		link.click();
	}
	exportcsv(EDUTBL) {
		let self=this;
		self.cell_closeedit();
		var table = document.getElementById(EDUTBL);
		var rows = [];
		for (var i = 0, row; row = table.rows[i]; i++) {
			let cols = []
			for (var j = 0; j < row.cells.length; j++) {
				cols.push(row.cells[j].innerText);
			}
			rows.push(cols);
		}
		var universalBOM = "\uFEFF";
		let csvContent = "data:text/csv;charset=utf-8," + universalBOM
		rows.forEach(function (rowArray) {
			row = rowArray.join(",");
			csvContent += row + "\r\n";
		});
		var encodedUri = encodeURI(csvContent);
		var link = document.createElement("a");
		link.setAttribute("href", encodedUri);
		link.setAttribute("download", "Report.csv");
		document.body.appendChild(link);
		link.click();
	}
	posturl(PostUrl, rowid, jsondata, frmMessageBox) {
		return new Promise((resolve, reject) => {
			$.ajax({
				method: "POST",
				url: PostUrl + `/${rowid}`,
				data: JSON.stringify(jsondata),
				contentType: "application/json",
				timeout: 6000,
				statusCode: {
					500: function () {
						resolve(rowid);
					}
				}
			}).done(function (data) {
				frmMessageBox.msg(JSON.stringify(data))
				resolve(0)
			}).fail(function (jqXHR, textStatus, errorThrown) {
				frmMessageBox.msg("over time!")
				resolve(rowid);
			});
		})
	}
	BindingFunctions(self,editbtn, savebtn, readmodbtn) {
		$('#' + editbtn).click(function (event) {
			var input_first = null;
			$('.M').each(function (i) {
				if ($(this).has(":input").length == 0) {
					inputtxt = editCell($(this));
					if (input_first == null) input_first = inputtxt;
				}
			});
			if (input_first) input_first.focus();
		});

		$('#' + savebtn).click(function (event) {
			self.cell_closeedit();
			var json = {};
			var result_set = "";
			var error_msg = "";
			var frmMessageBox = new FrmMessageBox();
			
			$('.M').each(function (i) {
				let _Field_Defs={}
				if (self.OriginalData[$(this).attr('id')] != self.GetCell($(this))) {
					let elarr = $(this).attr('id').split("_")
					let fH = elarr[0]
					let el_key = elarr[1].replace(/-/g, "_")
					let el_id = elarr[2]
					if (el_id in json) { } else { json[el_id] = {} }
					if (_Field_Defs == null) {
						json[el_id][el_key] = self.GetCell($(this)).trim();
					} else {
						if ((_Field_Defs[fH] == 'INT' || _Field_Defs[fH] == 'DEC') && !$(this).text().trim().match(/^[0-9.]+$/)) {
							error_msg = 'ERROR:INT !\n' + $(this).attr('id') + '\n' + $(this).text();
						} else {
							json[el_id][el_key] = self.GetCell($(this)).trim();
						}
					}
					//if (DebugFlag) console.log(elarr, el_id, el_key, json[el_id][el_key])
					//	self.OriginalData[$(this).attr('id')] = -1
				}
			});
			if (error_msg != "") { alert(error_msg); }
			if (self.cfg.PostUrl != null) {
				for (let rowid in json) {
					let jsondata = json[rowid]
					if (Object.keys(jsondata).length > 0) {
						self.posturl(self.cfg.PostUrl, rowid, jsondata, frmMessageBox)
					}
					//$.ajax({
					//	method: "POST",
					//	url: PostUrl + `/${rowid}`,
					//	data: JSON.stringify(jsondata),
					//	contentType: "application/json"
					//}).done(function (data) { console.log(data) });
				}
				for (var key in json) {
					self.OriginalData[key] = "-1";
				}
			} else {
				alert("constructing ... POST:\n" + JSON.stringify(json));
			}
		});
		$('#' + readmodbtn).click(function () { self.cell_closeedit(); });
	}
}