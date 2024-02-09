function bind_txtinput_paste(cell_name,temp_col_id)
{	
	var c_cell_col_id=temp_col_id;
	$("input[name='"+cell_name+"']").bind('paste',function(e){ 
		var txt = e.originalEvent.clipboardData.getData('Text');
		var data_arr=new Array();
		var rowcnt=0;
		for(i=0;i<txt.length;i++)
		{
			if(txt[i]=='\n'){
			rowcnt++;
			}else{
			if(data_arr[rowcnt]==null) data_arr[rowcnt]="";
			data_arr[rowcnt]+=txt[i];
			}
		}		
		var colcnt=data_arr[0].split('\t').length;
		var f_data_arr=new Array();
		for(i=0;i<rowcnt;i++)
		{
			f_data_arr[i]=new Array();
		}
		for(j=0;j<rowcnt;j++)
		{
			var temp_ar=data_arr[j].split('\t');
			if(temp_ar.length>=colcnt){
			for(k=0;k<colcnt;k++)	f_data_arr[j][k]=temp_ar[k];				
			}
		}
		//return f_data_arr;
		if(rowcnt>1 || colcnt>1) 
		{  
			if( confirm("有 "+rowcnt+"x"+colcnt+" 格資料,是否粘貼相應"+rowcnt+"x"+colcnt+"格上?"))
			{
				cell=$(this).parent();
				var c_cell=cell;
				
				for(rid=0;rid<rowcnt;rid++)
				{
					for(cid=0;cid<colcnt;cid++)
					{
						if(c_cell.has(":input").length>0)
						{
							input=c_cell.children();
							strv=input.val(f_data_arr[rid][cid]);
						}else{
							c_cell.text(f_data_arr[rid][cid]);
						}
						if(cid<colcnt-1) c_cell=c_cell.next();
					}
					c_cell=c_cell.parent().next('tr').children('td:first');
					for(i=1;i<c_cell_col_id;i++){c_cell=c_cell.next();}
				}
				return false;
			}else{return true;}		
		}
	});
}

function mc(stud)
{
	ckn="ck_"+stud;
	document.getElementById(ckn).checked = true;
}
