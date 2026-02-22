var stafref = null;
var md5stafref = null;
var Stud0;
function open_add_stud_dlg() {
    $('#AddNewStud_Dlg').dialog('open');;
}


function Q() {
    var person = prompt("Please enter your name", "Harry Potter");
    if (person != null) {
        window.open("../stud_upgrade_newstud/index.php?key=" + person);
    }
}


function Q1() {
    window.open("../stud_upgrade_newstud/stud_upgrade_temp_big_grid.php?key=" );
}
 

App = {}


$(document).ready(function () {
    var class_list = new Array('I1', 'I2', 'I3', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'SG1', 'SG2', 'SG3', 'SC1', 'SC2', 'SC3');
    var myStud;
    var myStud_Cnt;
    var oldval;

    //改班別
    var $ClassNo_dlg = $('#ClassNo_dlg');//息訊_Dlg
    $ClassNo_dlg.dialog({
        autoOpen: false, minWidth: 300, title: '請輸入班別(大寫):',
        open: function ()
        { $('#input_ClassNo').val($('#ClassNo').text().toUpperCase()); },
        buttons: {
            '更改': function () {
                $('#ClassNo').text($('#input_ClassNo').val().toUpperCase());
                $ClassNo_dlg.dialog('close');
                $('#StudList').hide();
            }
        }
    });
    $('#CHGCLASS_Dlg').dialog({
        autoOpen: false, minWidth: 300, title: '請輸入班別(大寫):',
        open: function () {
            $('#input_CHGGRADE_box').val($('#GradeNoT').val().toUpperCase());
            $('#input_CHGCLASS_box').val($('#ClassNoT').val().toUpperCase());
        },
        buttons: {
            '更改': function () {
                $('#GradeNoT').val($('#input_CHGGRADE_box').val().toUpperCase());
                $('#ClassNoT').val($('#input_CHGCLASS_box').val().toUpperCase());
                $('#CHGCLASS_Dlg').dialog('close');
                $('#StudList').hide();
                $.post("stud_upgrade_sclass_post.php",
                {
                    's': stafref,
                    'md5s': md5stafref,
                    'c': $('#ClassNoT').val(),
                    'g': $('#GradeNoT').val()
                },
                function (data) {
                    alert(data);
                });
            }
        }
    });
    var $AddNewStud_Dlg = $('#AddNewStud_Dlg');//息訊_Dlg
    $AddNewStud_Dlg.dialog({
        autoOpen: false, minWidth: 300, title: '查新學生:',
        open: function () {
            $('#input_searchstud_box').val('');
            $.get("stud_upgrade_select_stud_list.php", {
                's': stafref,
                'md5s': md5stafref,
                'g': $('#GradeNoT').val()
            }, function (data) {
                Stud0 = data;
                $("#input_searchstud_box").autocomplete({ source: Stud0 });
            }, "json");
        },
        buttons: {
            'ADD': function () {
                var res = $('#input_searchstud_box').val().split('|');
                if (res.length < 3) return;
                var table = document.getElementById("tbl_ShowClassSeatList");
                var row = table.insertRow(table.rows.length);
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                var cell4 = row.insertCell(3);
                var cell5 = row.insertCell(4);
                var cell6 = row.insertCell(5);
                stud_ref = res[1];
                c_no = "";
                classT = $('#ClassNoT').val();
                cell1.innerHTML = "<input type=hidden value=" + stud_ref + ">" + res[0] + stud_ref;
                cell2.innerHTML = res[2];
                cell3.innerHTML = "<input type=text size=1 name=class_" + stud_ref + " id=class_" + stud_ref + " maxlength=1 value=" + classT + ">"; "";
                cell4.innerHTML = "<input size=1  maxlength=2 name=seat_" + stud_ref + " id=seat_" + stud_ref + "  value=" + c_no + ">";
                cell5.innerHTML = res[3];
                cell6.innerHTML = "<input type=text size=0  maxlength=0 name=ov_" + stud_ref + " id=ov_" + stud_ref + "  value='" + stud_ref + "'>";
                $('#input_searchstud_box').val('');
            },
            'refresh': function () {
                $.get("stud_upgrade_select_stud_list.php", {
                    's': stafref,
                    'md5s': md5stafref,
                    'g': $('#GradeNoT').val()
                }, function (data) {
                    Stud0 = data;
                    $("#input_searchstud_box").autocomplete({ source: Stud0 });
                }, "json");
            }
        }
    });
    /*
    * 會議1(名單)
    **/
    function ShowStudList() {
        document.getElementById('StudList_txtInfo').innerHTML = "loading";
        $('#stud_cnt').text("");
        var m_id = $('#meeting_id').text();
        $.post("Get_StudList.php",
            { 'mid': m_id, 'classno': $('#ClassNo').text(), 's': stafref, 'md5s': md5stafref },
            function (data) {
                txt = "<table>";
                for (var i = 0; i < data.length; i++) {
                    var prtno = data[i]['prt_no'];//prt_no
                    var stud_ref = data[i]['stud_ref'];
                    var seat = data[i]['curr_seat'];//seat
                    var name_c = data[i]['c_name'];//name_c
                    var id_no = data[i]['ID_NO'];//name_c
                    var code = data[i]['DSEJ_REF'];//name_c
                    if (name_c == '') name_c = data[i]['e_name'];//name_p
                    var i_c = data[i]['studref'];
                    var c_v = stud_ref + '_' + prtno + '_' + i_c + '_' + seat + '_' + name_c+"_"+id_no+"_"+code;
                    var c_txt = seat + name_c;
                    if (prtno == '1' || prtno == '2') c_txt = c_txt + '(' + prtno + ')';
                    if (prtno == m_id) {
                        txt += "<td width=120 class=checkitem><input type=checkbox name=s_" + stud_ref + " value=" + c_v + " checked>" + c_txt + "</td>";
                    } else {
                        txt += "<td width=120><input type=checkbox name=s_" + stud_ref + " value=" + c_v + ">" + c_txt + "</td>";
                    }
                    if ((i + 1) % 5 == 0) {
                        txt += '<tr>';
                    }
                }
                txt += "</table>";
				//alert(txt)
                document.getElementById('StudList_txtInfo').innerHTML = txt;
                $("tr:even").css("background-color", "#CCC");
            }, "json");
    }
    function ShowUpgradeList() {
        document.getElementById('StudList_txtInfo').innerHTML = "loading";
        $('#stud_cnt').text("");
        var m_id = $('#meeting_id').text();
        $.post("Get_Upgrade.php",
            { 'mid': m_id, 'classno': $('#ClassNo').text() },
            function (data) {
                myStud = new Array();
                oldval = new Array();
                myStud_Cnt = 0;
                var txt = "<table><tr><td>學生";
                txt += "<td><spain id=u_t_1>升</spain>&#160;&nbsp;";
                txt += "<td><spian id=u_t_2>帶升</spian></td>";
                txt += "<td><spian id=u_t_3>留</spain>&#160;&nbsp;";
                txt += "<td><spian id=u_t_4>畢</spain>&#160;&nbsp;</td>";
                txt += "<td><spian id=u_t_5>退</spain>&#160;&nbsp;";
                txt += "<td><spian id=u_t_6>修</spain>&#160;&nbsp;";
                txt += "<td><spian id=u_t_7>其他</spain>&#160;&nbsp;";
                txt += "<td><spain id=fill_grade>級</spain><td><spain id=fill_class>班</spain>";
                txt += "<td>帶科升班描述<td>學年內離校日期及理由*沒有完成本學年課時,請填此項<tr>";
                for (var i = 0; i < data.length; i++) {
                    var stud_ref = data[i]["stud_ref"];
                    myStud_Cnt = i + 1;
                    myStud[i] = stud_ref;
                    oldval[i] = stud_ref;
                    var name_c = data[i]["name_c"];
                    var seat = data[i]["seat"];
                    var st_upgrade = data[i]["st_upgrade"];
                    var grade = data[i]["grade"];
                    var class_t = data[i]["class"];
                    var note = data[i]["note"]
                    var note1 = data[i]["note1"]
                    oldval[i] += "_" + st_upgrade + "_" + grade + "_" + class_t + "_" + note + "_" + note1;
                    var lockstat = data[i]["lock"];
                    txt += "<tr>";
                    txt += "<td><input type=checkbox id=ck_" + stud_ref + " disabled>" + seat + name_c + "</td>";;
                    for (j = 1; j < 8; j++) {
                        id_radio = 'up_' + stud_ref + j;
                        if (st_upgrade == j) {
                            txt += "<td><input type=radio value=" + j + " id=" + id_radio + " name='up_" + stud_ref + "' checked  onchange=\"mc('" + stud_ref + "');\">";
                        } else {
                            txt += "<td><input type=radio value=" + j + " id=" + id_radio + " name='up_" + stud_ref + "'  onchange=\"mc('" + stud_ref + "');\">";
                        }
                    }
                    txt += "<td><input type=text size=3 name=grade_" + stud_ref + " id=grade_" + stud_ref + " maxlength=3 value='" + grade + "' onchange=\"mc('" + stud_ref + "');\">";
                    txt += "<td><input type=text size=1 name=class_" + stud_ref + " id=class_" + stud_ref + " maxlength=1 value='" + class_t + "' onchange=\"mc('" + stud_ref + "');\">";
                    txt += "<td><input size=20 name=note_" + stud_ref + " id=note_" + stud_ref + " value='" + note + "'  onchange=\"mc('" + stud_ref + "');\">";
                    txt += "<td><input size=40 name=note1_" + stud_ref + " id=note1_" + stud_ref + " value='" + note1 + "'  onchange=\"mc('" + stud_ref + "');\">";
                }
                txt += "</table>";
                document.getElementById('StudList_txtInfo').innerHTML = txt;
                $('#u_t_1').click(function () {
                    for (i = 0; i < myStud_Cnt; i++)
                        if (typeof $('input[name=up_' + myStud[i] + ']:checked').val() != 'undefined')
                        { } else { $('#up_' + myStud[i] + '1').attr('checked', 'checked'); }
                });
                $('#u_t_2').click(function () {
                    for (i = 0; i < myStud_Cnt; i++)
                        if (typeof $('input[name=up_' + myStud[i] + ']:checked').val() != 'undefined')
                        { } else { $('#up_' + myStud[i] + '2').attr('checked', 'checked'); }
                });
                $('#u_t_3').click(function () {
                    for (i = 0; i < myStud_Cnt; i++)
                        if (typeof $('input[name=up_' + myStud[i] + ']:checked').val() != 'undefined')
                        { } else { $('#up_' + myStud[i] + '3').attr('checked', 'checked'); }
                });
                $('#u_t_4').click(function () {
                    for (i = 0; i < myStud_Cnt; i++)
                        if (typeof $('input[name=up_' + myStud[i] + ']:checked').val() != 'undefined')
                        { } else { $('#up_' + myStud[i] + '4').attr('checked', 'checked'); }
                });
                $('#u_t_5').click(function () {
                    for (i = 0; i < myStud_Cnt; i++)
                        if (typeof $('input[name=up_' + myStud[i] + ']:checked').val() != 'undefined')
                        { } else { $('#up_' + myStud[i] + '5').attr('checked', 'checked'); }
                });
				$('#fill_seat').click(function () {
					
				});
                $('#fill_grade').click(function () {
                    class_no = $('#ClassNo').text();
                    class_no = String(class_no).substring(0, String(class_no).length - 1)
                    for (i = 0; i < myStud_Cnt; i++) {
                        if (typeof $('input[name=up_' + myStud[i] + ']:checked').val() != 'undefined') {
                            var upgrade_key = $('input[name=up_' + myStud[i] + ']:checked').val();
                            if (upgrade_key == '3') {
                                var txt_id = '#grade_' + myStud[i];
                                $(txt_id).val(class_no);
                            } else if (upgrade_key == '1' || upgrade_key == '2') {
                                var txt_id = '#grade_' + myStud[i];
                                var index_class = -1;
                                for (c_i = 0; c_i < class_list.length; c_i++) {
                                    if (class_no == class_list[c_i]) index_class = c_i;
                                }
                                if (index_class > -1 && index_class < class_list.length - 1) {
                                    $('#grade_' + myStud[i]).val(class_list[index_class + 1]);
                                }
                            } else {
                                $('#grade_' + myStud[i]).val('');
                            }
                        }
                    }
                });
                $('#fill_class').click(function () {
                    let txt_id = '#class_' + myStud[0];
                    let class_no = $(txt_id).val();
                    for (i = 0; i < myStud_Cnt; i++) {
                        if (typeof $('input[name=up_' + myStud[i] + ']:checked').val() != 'undefined') {
                            var upgrade_key = $('input[name=up_' + myStud[i] + ']:checked').val();
                            if (upgrade_key == '1' || upgrade_key == '2') {
                                txt_id = '#class_' + myStud[i];
                                if ($(txt_id).val() === 'null' || $(txt_id).val() === '') {
                                    $(txt_id).val(class_no);
                                }
                                else {
                                    class_no = $(txt_id).val();
                                }

                            }
                        }
                    }
                });

                $("tr:even").css("background-color", "#CCC");
                $('#stud_cnt').text(myStud_Cnt);
            }, "json");
    }
    function ShowClassSeatList() {
        document.getElementById('StudList_txtInfo').innerHTML = "loading";
        $('#stud_cnt').text("");
        var m_id = $('#meeting_id').text();
        $.post("Get_NSTUD.php",
            { 'mid': m_id, 'GradeNo': $('#GradeNoT').val().toUpperCase(), 'ClassNo': $('#ClassNoT').val().toUpperCase() },
            function (data) {
                var txt = "<table id=tbl_ShowClassSeatList>";
                txt += "<tr><td>學生<td>級<td>班<td><spain id=fill_seat>座</spain><td>原有班別</tr>";
                for (var i = 0; i < data.length; i++) {
                    var stud_ref = data[i]["stud_ref"];
                    var name_c = data[i]["name_c"];
                    var grade = data[i]["grade"];
                    var classT = data[i]["class"];
                    var c_no = data[i]["c_no"];
                    var oldclass = data[i]["classno"]+data[i]["seat"];
                    var oldval_tmp = stud_ref + "_" + classT + "_" + c_no;
                    txt += "<tr><td><input type=hidden value=" + stud_ref + ">";
                    txt += "" + name_c + "<td>" + grade + "</td>";
                    txt += "<td><input type=text size=1 name=class_" + stud_ref + " id=class_" + stud_ref + " maxlength=1 value=" + classT + ">";
                    txt += "<td><input type=text size=1 maxlength=2 name=seat_" + stud_ref + " id=seat_" + stud_ref + "  value=" + c_no + ">";
                    txt += "<td>" + oldclass;
                    txt += "<td><input type=hidden size=0  maxlength=0 name=ov_" + stud_ref + " id=ov_" + stud_ref + "  value=" + oldval_tmp + "></td>";
                }
                txt += "</table><br><span id='clear_seat_no'>[clear seat_no] </span>";
                txt += "<span id='sort_seat_no'>[sort_seat_no]</span>";
                txt += "-----------------------<button onclick='open_add_stud_dlg();'>add Sellect New Stud</button><br><br><br><hr>";
                document.getElementById('StudList_txtInfo').innerHTML = txt;
                let table = document.getElementById("tbl_ShowClassSeatList");
                $('#stud_cnt').text(table.rows.length);
				myStud_Cnt=table.rows.length;
                $("tr:even").css("background-color", "#CCC");
                
                for (var i = 0; i < data.length; i++) {
					let stud_ref = data[i]["stud_ref"];
                    bind_txtinput_paste('seat_' + stud_ref, 4);
                    bind_txtinput_paste('class_' + stud_ref, 3);
                }

                $('#clear_seat_no').click(function () {
					var person = prompt("clear seat no ?(y/n)", "");

					if (person === 'Y' || person === 'y' ) {
                    let table = document.getElementById("tbl_ShowClassSeatList");
                    //var txt_id = '#seat_' + myStud[i];  $(txt_id).val('');
                    for (i = 1; i < table.rows.length; i++) {
                        x = table.rows[i].cells[3];
                        x.firstChild.value='';
                    }
					}
                });
                $('#sort_seat_no').click(function () {
                    let table = document.getElementById("tbl_ShowClassSeatList");
                    //var txt_id = '#seat_' + myStud[i];  $(txt_id).val('');
                    var org_seat=[];
                    var org_seat_cnt=0;
                    for (i = 1; i < table.rows.length; i++) {
                        x = table.rows[i].cells[3];
                        if(x.firstChild.value === '' || x.firstChild.value === 'null' ){
						}else{
                               org_seat.push(x.firstChild.value); 
							   console.log(x.firstChild.value);
                        }
                    }
					console.log(org_seat);
                    let assig_seat_no=0;
                    for (i = 1; i < table.rows.length; i++) {
                        x = table.rows[i].cells[3];
                        if(x.firstChild.value===''){
                            assig_seat_no++;
                            
                            while(org_seat.indexOf(assig_seat_no.toString())>-1 
							&& assig_seat_no<table.rows.length ){
                                assig_seat_no++;
                            }
                            x.firstChild.value=assig_seat_no;

                        }
                    }
                });
                

            }, "json");
    }
    /*
    * 會議1(名單) 提交
    **/
    $('#btnStudList').click(function (event) {
        console.log(myStud)
        btntxt = $(this).val();
        btnkey = btntxt.split('.')[0];
        if (btnkey == '1') {
            var studset = "";
            for (i = 0; i < myStud_Cnt; i++) {
                studset = studset + "'" + myStud[i] + "',";
            }
            checkedcnt = 0;
            var base_items = "";
            $('input:checkbox:checked').each(function (index) {
                checkedcnt++;
                base_items += $(this).val() + ',';
            });
            alert(base_items);
            $.post("Save_StudList.php",
                {
                    'staf': stafref,
                    'md5': md5stafref,
                    'studlist': base_items,
                    'classno': $('#ClassNo').text(),
                    'mid': $('#meeting_id').text(),
                    'bitems': studset,
                    'rand': Math.floor(Math.random() * 11)
                },
                function (data) {
                    if (data.errorcode == 0) {
                        alert(data.msg);
                        ShowStudList();
                    } else if (data.errorcode == 2) {
                        alert(data.msg);
                    } else {
                        alert(data.msg);
                    }
                }, "json");
        } else if (btnkey == '2') {
            checkedcnt = 0;
            var base_items = "";
            //$('input:radio:checked').each(function(index) {
            //	checkedcnt++;
            //	base_items+=$(this).val()+',';
            //});
            for (i = 0; i < myStud_Cnt; i++) {
                checkedcnt++;
                one_item = myStud[i] + '_';
                //alert(myStud[i]);
                if (typeof $('input[name=up_' + myStud[i] + ']:checked').val() != 'undefined') {
                    one_item += $('input[name=up_' + myStud[i] + ']:checked').val() + '_';
                } else {
                    one_item += '0_';
                }
                var grade = $('input[name=grade_' + myStud[i] + ']').val().toUpperCase();
                var class_t = $('input[name=class_' + myStud[i] + ']').val().toUpperCase();
                var note = $('input[name=note_' + myStud[i] + ']').val().replace(' ', ';');
                var note1 = $('input[name=note1_' + myStud[i] + ']').val().replace(' ', ';');
                one_item += grade + '_' + class_t + '_' + note + "_" + note1;
                if (one_item != oldval[i]) {
                    base_items += one_item + '\n';
                    oldval[i] = one_item;
                }
            }
            alert(base_items);
            $.post("Save_Upgrade.php",
                {
                    'staf': stafref,
                    'md5': md5stafref,
                    'studlist': base_items,
                    'classno': $('#ClassNo').text(),
                    'mid': $('#meeting_id').text(),
                    'rand': Math.floor(Math.random() * 11)
                },
                function (data) {
                    if (data.errorcode == 0) {
                        alert(data.msg);
                    } else if (data.errorcode == 1) {
                        alert(data.msg);
                    } else {
                        alert(data.msg);
                    }
                }, "json");

        } else if (btnkey == '3') {
            checkedcnt = 0;
            var base_items = "";
            var table = document.getElementById("tbl_ShowClassSeatList");
            for (i = 1; i < table.rows.length; i++) {
                input_col_cnt = 0;
                input_col_v = "";
                for (j = 0; j < table.rows[i].cells.length; j++) {
                    x = table.rows[i].cells[j];
                    if (x.hasChildNodes() && x.firstChild.nodeName == 'INPUT') {
                        input_col_cnt++;
                        if (input_col_cnt == 4) {
                            if (input_col_v != x.firstChild.value) { base_items += input_col_v + '\n'; x.firstChild.value = ""; }
                        } else { input_col_v += (input_col_cnt == 1 ? '' : "_") + x.firstChild.value; }
                    }
                }
            }
            alert(base_items);
            $.post("Save_NSTUD.php",
                {
                    's': stafref,
                    'md5s': md5stafref,
                    'studlist': base_items,
                    'classno': $('#ClassNo').text(),
                    'mid': $('#meeting_id').text(),
                    'rand': Math.floor(Math.random() * 11)
                },
                function (data) {
                    if (data.errorcode == 0) {
                        alert(data.msg);
                    } else if (data.errorcode == 2) {
                        alert(data.msg);
                    } else {
                        alert(data.msg);
                    }
                }, "json");
        }
    });
    $('#btn1stPrtMark').click(function (event) {
        $('#meeting_id').text('1');
        $('#btnStudList').val('1.提交第1次會後打印成績名單');
        $('#StudList').show();
        ShowStudList();
    });
    $('#btn2ndPrtMark').click(function (event) {
        $('#meeting_id').text('2');
        $('#btnStudList').val('1.提交第2次會後打印成績名單');
        $('#StudList').show();
        ShowStudList();
    });

    $('#btn1stUp').click(function (event) {
        $('#meeting_id').text('1');
        $('#btnStudList').val('2.提交第1次會後升留');
        $('#StudList').show();
        ShowUpgradeList();
    });

    $('#btn2stUp').click(function (event) {
        $('#meeting_id').text('2');
        $('#btnStudList').val('2.提交第2次會後升留');
        $('#StudList').show();
        ShowUpgradeList();
    });
    function ShowClassNoDlg() {
        $ClassNo_dlg.dialog('open');
    }
    $('#ClassNo').click(function (event) {
        ShowClassNoDlg();
    });
    $('#ClassNoTitle').click(function (event) {
        ShowClassNoDlg();
    });
    $('#NextClassNoTitle').click(function (event) {
        $('#CHGCLASS_Dlg').dialog('open');
    });
    $('#btnGradeClassNo').click(function (event) {
        $('#meeting_id').text('3');
        $('#btnStudList').val('3.提交第3次會後調班座號');
        $('#StudList').show();
        ShowClassSeatList();

    });
    $('#namelist1').click(function (event) {
        var s_classno = $('#ClassNo').text().toUpperCase();
        var url = "/a/stud_upgrade/downloadcsv.php?t=1&classno=" + s_classno;
        event.preventDefault();  //stop the browser from following
        window.location.href = "downloadxls.php?t=1&classno=" + s_classno;

    });
    $('#namelist2').click(function (event) {
        var s_grade = $('#GradeNoT').val().toUpperCase();
        var s_class = $('#ClassNoT').val().toUpperCase();
        var url = "/a/stud_upgrade/downloadcsv.php?t=2&classno=" + s_class + "&grade=" + s_grade;
        event.preventDefault();  //stop the browser from following
        window.location.href = "downloadxls.php?t=2&classno=" + s_class + "&grade=" + s_grade;

    });
    $('#namelist3').click(function (event) {
        var s_grade = $('#GradeNoT').val().toUpperCase();
        var s_class = $('#studinfo_classno').val();
        var url = "/a/stud_upgrade/downloadcsv.php?t=3&classno=" + s_class + "&grade=" + s_grade;
        event.preventDefault();  //stop the browser from following
        window.location.href = "downloadxls.php?t=3&classno=" + s_class + "&grade=" + s_grade;
    });
    $('#btn2form').click(function (event) {

        window.open("/a/stud_upgrade/dsejb39/index.php?classno=" + $('#ClassNo').text());
    });

    $('#btn2formPrint001').click(function (event) {
        var s_grade = $('#GradeNoT').val().toUpperCase();
        var s_class = $('#ClassNoT').val();
        window.open("/internal/markup/studupgrade/dsejb39/printform001.php?classno=" + s_class + "&grade=" + s_grade);
    });
	function selallbtnFunc(){
		btntxt = $('#btnStudList').val();
        btnkey = btntxt.split('.')[0];
		alert("sellect all:"+btnkey);
        if (btnkey == '1')//&& btntxt.includes('2次'))
        {
            $('input:checkbox').each(function (index) {
				
                if ($(this).val().includes('_0_0_')) {
                    $(this).prop("checked", true);
                }
            });
        }
	}
    $('#selallbtn').click(function (event) {
        ///////////////
        btntxt = $('#btnStudList').val();
        btnkey = btntxt.split('.')[0];
        if (btnkey == '1')//&& btntxt.includes('2次'))
        {
			var condi=prompt("selallbtn_id :["+btnkey+"] Please enter Condition","_0_")
			if (condi!=null && condi!="")
			{
				console.log($(this).val());
				$('input:checkbox').each(function (index) {
                if ($(this).val().includes(condi)) {
                    $(this).prop("checked", true);
                }
                });
			}
        }
        ///////////////
    });
    $('#unselallbtn').click(function (event) {

    });

    $('#info').hide();
    $('#StudList').hide();
});