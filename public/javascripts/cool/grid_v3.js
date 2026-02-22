// grid_v2.js update 2022-10-13
// 基礎功能,表格弍操作
// javascripts/cool/grid_v2.js


/*pug
view_base.pug
    link(rel='stylesheet', href='/stylesheets/bootstrap.min.css')
    link( href='/jquery-ui-dist/jquery-ui.min.css',rel='stylesheet' )
	script(src='/javascripts/jquery.js')
    script(src='/jquery-ui-dist/jquery-ui.min.js')
	script(src='/javascripts/bootstrap.js')
    script(src='/javascripts/cool/grid_v2.js?v=7')
    link(rel='stylesheet' ,href='/javascripts/cool/grid.css')
    script.
      $(document).ready(function(){
        BindingFunctions("editbtn", "savebtn", 'readmodebtn');
        GenOriginalData();
        $('#exportxls_button').click(function(){ exportxls_button('EDUTBL');  });
        $("#exportcsv_button").on('click', function(event) {  exportcsv_button("EDUTBL");  });
        $('td').filter(function () {return this.innerHTML.match(/^[0-9\s\.,]+$/);}).css('text-align', 'right');
	  });    
extends ./view_base.pug
block content
  div
    a(href="#",class="btn btn-primary btn-sm",style="color:yellow;")#editbtn 編輯
    a(href="#",class="btn btn-primary btn-sm",style="color:yellow;")#savebtn 儲存
    a(href="#",class="btn btn-primary btn-sm",style="color:yellow;")#readmodebtn 唯讀
    a(href="#",class="btn btn-primary btn-sm",style="color:yellow;")#exportcsv_button 匯出csv  
    a(href="#",class="btn btn-primary btn-sm",style="color:yellow;")#exportxls_button 匯出xls  
  style.
    div.container{ margin:0px; }
    td{padding :10px;}
  - clist=["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]    
  table#EDUTBL  
    - crs=[  `KR-ID` ,  `Term` ,  `Semester` ,  `Stud_ref`,  `classno` ,  `seat`    ,  `c_name`  ,  `Reviews` ,  `honors` ,  `Later`   ,  `UpClass`      ]
    tr
      - cidx=0
      - headerfield={}
      each elm in crs
        - cidx++
        - headerfield[cidx]=elm
        td= elm
    each row in books 
      - ref= row.kr_id
      tr
        - cidx=0
        each elm in row
          - cidx++
          if cidx<6
            td= elm 
          else  
            td.M(id=`M${clist[cidx-6]}_${headerfield[cidx]}_${ref}`)= elm
  script.
    var fn= '!{fn}';
    var PostUrl='/postdata';  // /postdata/${ref}    
    $('#returnUrlBtn').attr("href", "/home");
    $(document).ready(function(){   });  
*/

//// PUBLIC VARIABLES
var EnabledUpDownKeyJumpToNextCell=true;
var ZeroMarkWarning_Flag = false;
var curr_td = null;
var PastFrm = null;
var CSVFrm = null;
var OriginalData = null;
var PostUrl = null;
var _Field_Defs = null;
const DebugFlag=null;
////  Program Start
function cell_closeedit() {
	$('.M').each(function (i) {	
		if ( $(this).has(":input[type=radio]").length > 0) {

		}else if ( $(this).has(":input").length > 0) {
			input = $(this).children();	$(this).text(input.val()); input.remove();
		}	});
}
function exportxls_button(EDUTBL){
	cell_closeedit();
	var universalBOM = "\uFEFF";
	var txt= document.getElementById(EDUTBL).innerHTML;
	var htmls = "";
	var uri = 'data:application/vnd.ms-excel;charset=UTF-8;base64,';
	var template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'; 
	var base64 = function(s) {
		return window.btoa(unescape(encodeURIComponent(s)))
	};
	var format = function(s, c) {
		return s.replace(/{(\w+)}/g, function(m, p) {
			return c[p];
		})
	};
	htmls = txt
	var ctx = {
		worksheet : 'Worksheet',
		table : htmls
	}
	var link = document.createElement("a");
	link.download = "export.xls";
	link.href = uri + base64(format(template, ctx));
	link.click();
  }
function exportcsv_button(EDUTBL) {
	  cell_closeedit();
	  var table = document.getElementById(EDUTBL);
	  var rows =[];
	  for(var i=0,row; row = table.rows[i];i++){
		  let cols=[]
		  for(var j=0;j<row.cells.length;j++)
		  {
			cols.push(row.cells[j].innerText);
		  }
		  rows.push(cols);
	  }
	  var universalBOM = "\uFEFF";
	  csvContent = "data:text/csv;charset=utf-8,"+universalBOM
	  rows.forEach(function(rowArray){
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

function BindingZeroClipboard(id, tbl) { alert("Error:Not implement ZeroClipboard!") }
function bind_txtinput_paste($txtinput, cell) {
	$txtinput.bind('paste', function (e) {
		var txt = e.originalEvent.clipboardData.getData('Text').replace(/\n$/, "");
		var data_arr = txt.split('\n');
		var rowcnt = data_arr.length; let linefeed = false;
		var colcnt = data_arr[0].split('\t').length;
		var f_data_arr = new Array();
		for (i = 0; i < rowcnt; i++) {
			f_data_arr[i] = new Array();
		}
		for (j = 0; j < rowcnt; j++) {
			var temp_ar = data_arr[j].split('\t');
			if (temp_ar.length >= colcnt) {
				for (k = 0; k < colcnt; k++)
					f_data_arr[j][k] = temp_ar[k].replace(/\n$/, "").replace(/\r$/, "");
			}
		}
		if (rowcnt > 1 || colcnt > 1) {
			if (confirm("DataGrid " + rowcnt + "x" + colcnt + " Paste " + rowcnt + "x" + colcnt + "?")) {
				var c_cell = cell;
				var c_cell_col_id = 0;
				var f_cell = c_cell.parent().children('td:first');
				for (i = 0; i < 64; i++) {
					c_cell_col_id++;
					if (c_cell.attr('id') == f_cell.attr('id')) {
						break;
					}
					f_cell = f_cell.next();
				}
				for (rid = 0; rid < rowcnt; rid++) {
					for (cid = 0; cid < colcnt; cid++) {
						if (c_cell.has(":input").length > 0) {
							input = c_cell.children();
							strv = input.val(f_data_arr[rid][cid]);
						} else {
							c_cell.text(f_data_arr[rid][cid]);
						}
						if (cid < colcnt - 1)
							c_cell = c_cell.next();
					}
					c_cell = c_cell.parent().next('tr').children('td:first');
					for (i = 1; i < c_cell_col_id; i++) { c_cell = c_cell.next(); }
				}
				return false;
			} else { return true; }
		}
	});
}

function editCell(cell) {
	//$txt=$('<input type=text>');
	//$txt.width(cell.width()-3);
	if (cell.has(":input").length == 0) {
		$txt = $('<textarea></textarea>');
		$txt.width(cell.width() - 5);
		$txt.height(cell.height() - 5);
		bind_txtinput_paste($txt, cell);  //cell past 2014/06/03	
		var val = cell.text();
		cell.text("");
		$txt.val(val);
		cell.append($txt);
		return $txt;
	}
}

function closeedit() {
	$('.M').each(function (i) {
		if ( $(this).has(":input[type=radio]").length > 0) {

		}
		else if ($(this).has(":input").length > 0) {
			input = $(this).children();
			$(this).text(input.val());
			input.remove();
		}
	});
}

function BindingFieldDefsIntegerFields(fielddef_obj) { _Field_Defs = fielddef_obj; }

function GenOriginalData() {
	if (OriginalData == null) {
		//closeedit();
		OriginalData = {};
		$('.M').each(function (i) {
			OriginalData[$(this).attr('id')]=GetCell($(this))
		});
	}   
}

function SplitPastFrmText(txt) {
	var data_arr = new Array();
	var rowcnt = 0;
	for (i = 0; i < txt.length; i++) {
		if (txt[i] == '\n') {
			rowcnt++;
		} else {
			if (data_arr[rowcnt] == null) data_arr[rowcnt] = "";
			data_arr[rowcnt] += txt[i];
		}
	}
	var colcnt = data_arr[0].split('\t').length;
	var f_data_arr = new Array();
	for (i = 0; i < colcnt; i++) {
		f_data_arr[i] = new Array();
	}
	for (j = 0; j < rowcnt; j++) {
		var temp_ar = data_arr[j].split('\t');
		if (temp_ar.length >= colcnt) {
			for (k = 0; k < colcnt; k++)
				f_data_arr[k][j] = temp_ar[k];
		}
	}
	return f_data_arr;
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

function BindingPastFrm(frm, txt, table) {
	PastFrm = frm;
	$("#" + frm).dialog(
		{
			autoOpen: false,
			minWidth: 500,
			title: 'Past:',
			buttons: {
				"past": function () {
					closeedit();
					// if( DebugFlag ) console.log($("#"+txt).val());
					var fill_data = SplitPastFrmText($("#" + txt).val());
					for (i = 0; i < fill_data.length; i++) {
						var fieldname = "";
						if (fill_data[i].length > 0) {
							fieldname = fill_data[i][0];
						}
						var conf = confirm("field name:" + fieldname + "?");
						if (conf == true) {
							alert(ArrayPast2Table(table, fieldname, fill_data[i]));
						}
					}
					$(this).dialog("close");
				}
			},
			open: function () {
				$('#' + txt).val("");
			}
		});
}
///

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

function posturl(PostUrl, rowid, jsondata, frmMessageBox) {
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
///
function GetCell(x)
{   if (x.has(":input[type=radio]").length > 0) {
	let a=x.has(":input[type=radio]")
	for(let b of a.children())
	   if(b.checked){
		alert(b.value)
		return b.value;
	   }
    }else if ($(this).has(":input").length > 0) {
	  return $(this).children().val();
	}
	return $(x).text()
}
async function BindingFunctions(editbtn, savebtn, readmodbtn) {
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

	$('#' + savebtn).click( async function (event) {
		closeedit();
		var json = {};
		var result_set = "";
		var error_msg = "";
		var frmMessageBox = new FrmMessageBox();
		$('.M').each(function (i) {

			if (OriginalData[$(this).attr('id')] != GetCell($(this))) {
				let elarr = $(this).attr('id').split("_")
				fH = elarr[0]
				el_key = elarr[1].replace(/-/g, "_")
				el_id = elarr[2]
				if (el_id in json) { } else { json[el_id] = {} }
				if (_Field_Defs == null) {
					json[el_id][el_key] = GetCell($(this)).trim();
				} else {
					if ((_Field_Defs[fH] == 'INT'||_Field_Defs[fH] == 'DEC' )&& !$(this).text().trim().match(/^[0-9.]+$/)) {
						error_msg = 'ERROR:INT !\n' + $(this).attr('id') + '\n' + $(this).text();
					} else {
						json[el_id][el_key] = GetCell($(this)).trim();
					}
				}
				if(DebugFlag) console.log(elarr,el_id,el_key,json[el_id][el_key] )
				OriginalData[$(this).attr('id')]=-1
			}
		});
		if(error_msg !="" ){ alert(error_msg);}
        if (PostUrl != null) {
			for (let rowid in json) {
				let jsondata = json[rowid]
				if(Object.keys(jsondata).length >0){
				   let stat_ = await posturl(PostUrl, rowid, jsondata, frmMessageBox)
				}
				//$.ajax({
				//	method: "POST",
				//	url: PostUrl + `/${rowid}`,
				//	data: JSON.stringify(jsondata),
				//	contentType: "application/json"
				//}).done(function (data) { console.log(data) });
			}
			console.log("Updated!");
			for (var key in json) {
				OriginalData[key] = "-1";
			}
		} else {
			alert("constructing ... POST:\n" + JSON.stringify(json));
		}
	});
	$('#' + readmodbtn).click(function () { closeedit(); });
}

var head_editMod_status = new Object();

function BindingHead_EditMode(head_arr) {
	for (i = 0; i < head_arr.length; i++) {
		head_editMod_status[head_arr[i]] = false;
		$("#" + head_arr[i]).click(function (event) {
			fix = $(this).attr('id').split('_')[0];
			if (head_editMod_status[$(this).attr('id')]) {
				var input_first = null;
				$('.M').each(function (i) {
					if ($(this).attr('id').substr(0, fix.length) == fix && $(this).has(":input").length > 0) {
						input = $(this).children();
						strv = input.val();
						$(this).text(strv);
						input.remove();
					}
				});
				if (input_first) input_first.focus();
			} else {
				var input_first = null;
				$('.M').each(function (i) {
					if ($(this).attr('id').substr(0, fix.length) == fix && $(this).has(":input").length == 0) {
						if (input_first == null) { input_first = editCell($(this)); } else { editCell($(this)); }
					}
				});
				input_first.focus();
			}
			head_editMod_status[$(this).attr('id')] = !head_editMod_status[$(this).attr('id')];
		});
	}
}

$(document).ready(function () {
	$('td.M').click(function (event) {
		var edit_cell = editCell($(this));
		if (edit_cell) edit_cell.focus();
	});
	function EndModify() {
		$('.M').each(function (i) {
			if ($(this).has(":input").length == 0) {
			} else {
				input = $(this).children();
				strv = input.val();
				$(this).text(strv);
				input.remove();
			}
		});
	}
	$("td.M").keydown(function (e) {
		var cell_id = $(this).attr('id');
		var rowid = 0;
		var count = 0;
		var cells = new Array();
		$('.M').each(function (i) {
			if ($(this).has(":input").length != 0) {
				cells[count] = $(this);
				if ($(this).attr('id') == cell_id) rowid = count;
				count++;
			}
		});
        if(EnabledUpDownKeyJumpToNextCell){
		    switch (e.keyCode) {
		    	case 38: //this is up!
		    		rowid--;
		    		e.preventDefault();
		    		break;
		    	case 40: //this is down! 
		    	case 13:
		    		rowid++;
		    		e.preventDefault();
		    		break;
		    }
		    if (rowid < count && rowid >= 0) {
		    	cells[rowid].children().focus();
		    }
	    }
	});
});
