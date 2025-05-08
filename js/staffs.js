var curDate		= new Date();
var curWorkers 	= [];
//var unixtime	= Math.floor(new Date().now() / 1000);
var wShortDays	= ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
var wFullDays	= ["Воскресенье", "Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
var mFullDays	= ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];


// CREATE ===========================

async function getWorkers(UID, date){
	
	if(!UID || !date) return;
	
	$('#workers').empty();
	
	var data = await getData(true, false, "ПолучитьРаботников", [UID, date]);
	
	if(data){

		if(!data.error && data.valid){			
			
			if(data.result.length > 0){
				
				for(let index in data.result) {
					
					var no = Number(index)+1;
					
					var worker = '<div class="number-row">'+no+'</div>';
					worker += '<div class="worker_lb">'+data.result[index]['fio']+'</div>';
					worker += '<div class="worker_lb">'+data.result[index]['age']+'</div>';
					worker += '<div class="worker_lb">'+data.result[index]['gender']+'</div>';
					worker += '<div class="worker_lb">'+data.result[index]['company']+'</div>';
					worker += '<div class="worker_lb">'+data.result[index]['post']+'</div>';
					worker += '<div class="worker_lb"></div>';
					
					$('#workers').append(worker);
				}
				
				$("#loader").hide();

			}
			
			$('#loader_des').html('');
			$('#loader_des').hide();

		}else{
			$('#loader_dv').hide();
			$('#loader_des').append('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
			$('#loader_des').append(data.des);
			$('#loader_des').show();		
		}
			
	}else{
		$('#loader_dv').hide();
		$('#loader_des').append('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
		$('#loader_des').append("Ошибка сервера.");
		$('#loader_des').show();	
	}

}

// ACTION ===========================

function toPage(chapter=""){
	
	switch(chapter){
		default:
		case "menu":
			document.location.href = "/";
			break;
	}
	
}

async function sendData(){
	
	$('#desc').html("");
			
	await getData(true, false, "ЗаписатьЗначенияТабеля", [UID, curDate.format("yyyymmdd"), curWorkers]);
	
	//location.reload();
	
	toPage('menu');
}

// EVENTS ===========================
