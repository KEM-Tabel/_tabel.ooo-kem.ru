var curDate		= new Date();
var curWorkers 	= [];
//var unixtime	= Math.floor(new Date().now() / 1000);
var wShortDays	= ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
var wFullDays	= ["Воскресенье", "Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
var mFullDays	= ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

// CREATE ===========================


// ACTION ===========================

function toPage(chapter=""){
	
	switch(chapter){
		default:
		case "menu":
			document.location.href = "/";
			break;
	}
	
}

async function getWorkers(UID, date){
	
	if(!UID || !date) return;
	
	$('#workers').empty();
				
	curWorkers = [];
	
	var data = await getData(true, true, "ПолучитьРаботниковМастера", [UID, date]);
	
	if(data){

		if(!data.error && data.valid){
		
			if(data.result.length > 0){
			
				for(let index in data.result) {
					
					var no = Number(index)+1;
					
					var item 		= {};
					item['uid'] 	= data.result[index]['uid'];
					item['value'] 	= data.result[index]['value'];
					
					var disabled = '';
					var worker_class = '';
					if(data.result[index]['lock']){
						disabled = 'disabled="disabled"';
						
						item['edit'] 	= false;
					}else{
						item['edit'] 	= true;
					}
					
					if(data.result[index]['value']){
						disabled+= 'checked="checked"';
						
						worker_class = 'worker_lb';
					}else{
						worker_class = 'worker_lb_disabled';
					}
					
					var worker = '<div class="worker">';
					worker += '<div id="'+data.result[index]['uid']+'_st" class="worker_state">'+data.result[index]['state']+'</div>';
					worker += '<div id="'+data.result[index]['uid']+'" class="'+worker_class+'">'+no+'. '+data.result[index]['fio']+'</div>';
					worker += '<div class="worker_cb"><input id="'+data.result[index]['uid']+'_in" '+disabled+' type="checkbox" class="checkbox" onChange="setYesNo(this)" />';
					worker += '<label for="'+data.result[index]['uid']+'_in"></label>';
					worker += '</div>';
					worker += '</div>';
					
					$('#workers').append(worker);
				
					curWorkers.push(item);
				}
			}
			
			$('#desc-main').html("");
			$('#desc-main').hide();

		}else{
			$('#desc-main').html(data.des);
			$('#desc-main').show();			
		}
			
	}else{
		$('#desc-main').html("Ошибка сервера.");
		$('#desc-main').show();		
	}
	
	$("#loader").hide();

}

async function sendData(){
	
	$('#desc').html("");
			
	await getData(true, false, "ЗаписатьОтсутствия", [UID, curDate.format("yyyymmdd"), curWorkers]);
	
	//location.reload();
	
	toPage('menu');
}

function setYesNo(element){
	
	var id = $(element).attr('id');	
	var uid = id.split('_')[0];
	
	if($('#'+id).prop('checked')){
		$("#"+uid+"_st").text('Работа');
		changeClass(uid, 'worker_lb');
	}else{
		$("#"+uid+"_st").text('Отсутствие');
		changeClass(uid, 'worker_lb_disabled');
	}
	
	for(let index in curWorkers) {
		if(uid == curWorkers[index]['uid']){
			curWorkers[index]['value'] = $('#'+id).prop('checked');
		}
	}
	
}

// EVENTS ===========================



