let TODAY			= -1;
let DATATIME		= new Date().format("yyyymmddHHMMss");
let DATA			= [];
let DAYS			= [];
let LOCATIONS		= [];
let WORKERS			= [];
let TABEL			= [];
let FILTER			= [];
let QUEUE 			= [];
let CANVASES 		= [];
let wShortDays		= ["пн","вт","ср","чт","пт","сб","вс"];
let selectedCells 	= [];
let symbolsDi 		= ['0','1','2','3','4','5','6','7','8','9'];
let symbolsRu 		= ['я','д','к','н','в','у','б','п','ж','о','т','м','р','г'];
let symbolsEn 		= ['z','l','r','y','d','e',',','g',';','j','n','v','h','u'];
let codesDi 		= ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16'];
let codesRu 		= ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','Я','Б','МО','Д','ОТ','ОБ','ОД','ДО','ОЖ','НН','НВ','Г','Р','У','УВ','ПК','В'];
let mFullDays		= ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
let mouseUp 		= false;
let mouseDown 		= false;
let isLeftMB		= false;
let isRightMB		= false;
let selectedFnt		= '#000000';
let YaFnt			= '#c80000';
let unselectedFnt	= '#000000';
let selectedBgd		= '#6690ef';
let unselectedBgd	= '#f6f7f6';
let unselectedNoBgd	= '#e7e77e';
let todayBgd		= '#ff0000';
let weekendBgd		= 'repeating-linear-gradient(-45deg, #d7db00 0px, #d7db00 2px, #ddd 2px, #ddd 5px)';
let VER 			= "19";

let TIMESTAMP_SESSION	= Math.floor(Date.now() / 1000);
let TIMESTAMP_ACTIVITY 	= Math.floor(Date.now() / 1000);

let wasShift = false;

document.addEventListener("mousedown", 	setMouseDownState);
document.addEventListener("mousemove", 	setMouseDownState);
document.addEventListener("mouseup", 	setMouseUpState);
document.addEventListener('keydown', 	setCellVal);
document.addEventListener('scroll', 	scrollDocument);


// CREATE ===========================

function checkSession(){
	if((Math.floor(Date.now() / 1000) - TIMESTAMP_SESSION) > 3600){
		toPage('exit');
	}
}

function checkActivity(){
	if((Math.floor(Date.now() / 1000) - TIMESTAMP_ACTIVITY) > 10){
		getDataTabel(false, false, UID, DATATIME, true);
	}
}

async function getDataTabel(loader=true, hideAfter=false, UID, date, update=false){

	if(!UID || !date) return;
	
	let data = await getData(loader, hideAfter, "ПолучитьДанныеТабеля", [UID, date, update]);

	TIMESTAMP_SESSION	= Math.floor(Date.now() / 1000);
	TIMESTAMP_ACTIVITY 	= Math.floor(Date.now() / 1000);
	
	setInterval(() => checkSession(), 60*1000);
	setInterval(() => checkActivity(), 1*1000);
	
	if(data){

		if(!data.error && data.valid){	
			
			if(Number(VER) < Number(data.result.ver)){
				sleep(5).then(() => {document.location.reload();});
			}

			DAYS 		= data.result.days;
			LOCATIONS 	= data.result.locations;
			DATA 		= data.result.data;
				
			$("#loader").hide();
			
			if(DATA.length == 0) return;
			
			DATATIME = new Date().format("yyyymmddHHMMss");
			
			let pageX = window.pageXOffset;
			let pageY = window.pageYOffset;	
			
			createHead();
			createTabel();
			
			// Обновляем глобальные переменные для тултипов
			window.SAVED_DATA = DATA;
			window.SAVED_TODAY = TODAY;
			
			scrollTo(pageX, pageY);
			
			// Вызываем initTooltips ПОСЛЕ того, как данные загружены и таблица создана
			initTooltips();
			
		}else{
			
			console.log(data.des);
				
			$('#loader_dv').hide();
			$('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
			$('#loader_des').append(data.des);
			$('#loader_des').show();
			$('#loader').show();
/*
			SID = null;
			UID = null;	
			LABEL = null;
				
			delAllCookie();
				
			document.location.href="/auth.htm";
*/
			}
			
	}else{
		
		console.log(data.des);
		
		$('#loader_dv').hide();
		$('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
		$('#loader_des').append(data.des);
		$('#loader_des').show();
		$('#loader').show();	
	}
	
}

function createHead(){
	
	TODAY = -1;
	
	$('#head-days').empty();
	
	let headDays = '';
	for(let d in DAYS){
		
		let suffix = '';
		let title = '';
		if(DAYS[d]['today']){
			suffix = 'today';
			title = 'title="Сегодня"';
			
			TODAY = d;
		}else{
			suffix = DAYS[d]['weekend'] ? 'weekend' : 'work';
		}
		
		headDays += '<div id="0_'+Number(d)+'-day-dv" '+title+' class="head-day-'+suffix+'" onClick="selectCol('+Number(d)+')">';
		headDays += DAYS[d]['day'];
		headDays += '<div class="head-wday">'+wShortDays[DAYS[d]['dow']-1]+'</div>';
		headDays += '</div>';

	}
	
	$('#head-days').html(headDays);
	
	$('#menu-head').width($('#head').innerWidth()-10);
	// Удалена синхронизация ширины #head-days через JS

}

function createTabel(){

	$('#filter-firms-dv').empty();
	$('#filter-posts-dv').empty();
	$('#filter-locations-dv').empty();
	
	$('#table').empty();
	
	let firm_uid 		= [];
	let post_uid 		= [];
	let location_uid 	= [];
	
	let location_no		= 0;
	let chief_no		= 0;
	let master_no		= 0;
	let worker_no		= 0;
	
	let html = '<div style="width:'+$('#head').innerWidth()+'px;">';
	for(let l in DATA){
		
		let location = DATA[l];
		location_no		= location_no+1;
		let location_id	= location_no+'_'+location['uid'];
		
		let canvas 		= {};
		canvas['id'] 	= 'l_'+location_id;
		canvas['state'] = "show";
			
		CANVASES.push(canvas);
		
		//location-head++
		html += '<div id="l_'+location_id+'-head" class="location-head" data-location-idx="'+l+'" onclick="slideDiv('+"'l',"+"'"+location_id+"'"+')">';
		html += '<div class="toggle-bt" onclick="slideDiv('+"'l',"+"'"+location_id+"'"+')"></div>';
		html += '<span id="l_'+location_id+'-sp">'+location['name']+'</span>';
		html += '<div class="location-count-workers"><span id="l_'+location_id+'-empty-sp"></span></div>';
		html += '</div>';
		
		//location-canvas++
		html += '<div id="l_'+location_id+'-canvas" style="width:'+$('#head').innerWidth()+'px;">';
		
		for(let c in location['chiefs']){
			
			let chief 		= location['chiefs'][c];
			chief_no		= chief_no+1;
			let chief_id	= chief_no+'_'+chief['uid'];		
			
			//chief-head++
			let notChief = chief['name'].match(/(\=|\#|\<|\>)/ig);
			if(notChief == null) {
				html += '<div id="c_'+chief_id+'-head" class="chief-head" data-location-idx="'+l+'" data-chief-idx="'+c+'" onclick="slideDiv('+"'c',"+"'"+chief_id+"'"+')">';
				html += '<div class="toggle-bt" onclick="slideDiv('+"'c',"+"'"+chief_id+"'"+')"></div>';
				html += '<span id="c_'+chief_id+'-sp">НАЧАЛЬНИК: '+chief['name']+'</span>';
				html += '<div class="chief-count-workers"><span id="c_'+chief_id+'-empty-sp"></span></div>';
				html += '</div>';
				
				let canvas 		= {};
				canvas['id'] 	= 'c_'+chief_id;
				canvas['state'] = getCookie(canvas['id']);
				
				CANVASES.push(canvas);
			}else{
				let canvas 		= {};
				canvas['id'] 	= 'c_'+chief_id;
				canvas['state'] = "show";
				
				CANVASES.push(canvas);
			}
			
			//chief-canvas++
			html += '<div id="c_'+chief_id+'-canvas">';
			
			for(let m in chief['masters']){
				
				let master 		= chief['masters'][m];
				master_no		= master_no+1;
				let master_id	= master_no+'_'+master['uid'];
					
				Array.prototype.push.apply(WORKERS, master['workers']);
				
				let canvas 		= {};
				canvas['id'] 	= 'm_'+master_id;
				canvas['state'] = getCookie(canvas['id']);
			
				CANVASES.push(canvas);
				
				//master-head++
				let master_name = '';
				let notMaster = master['name'].match(/(\=|\#|\<|\>)/ig);
				if(notMaster == null) master_name = 'МАСТЕР: ';
				html += '<div id="m_'+master_id+'-head" class="master-head" data-location-idx="'+l+'" data-chief-idx="'+c+'" data-master-idx="'+m+'" onclick="slideDiv('+"'m',"+"'"+master_id+"'"+')">';
				html += '<div class="toggle-bt" onclick="slideDiv('+"'m',"+"'"+master_id+"'"+')"></div>';
				html += '<span id="m_'+master_id+'-short-sp" class="master-text-short">'+master_name+master['name']+'</span>';
				html += '<span id="m_'+master_id+'-full-sp" class="master-text-full">'+location['name']+' > НАЧАЛЬНИК: '+chief['name']+' > '+master_name+master['name']+'</span>';
				html += '<div class="master-count-workers"><span id="m_'+master_id+'-empty-sp"></span></div>';
				html += '</div>'; 
				
				//workers++
				html += '<div id="m_'+master_id+'-canvas" class="workers">';
				
				//items++
				html += '<div class="items">';
				
				let htmlDays = '';
				let htmlSumDays	= '';
				let htmlSumHours = '';
				
				for(let w in master['workers']){
					
					let worker 		= master['workers'][w];
					worker_no		= worker_no+1;
					let worker_id	= worker_no+'_'+worker['uid'];
					
					let notWorker 	= worker['fio'].match(/(\=|\#|\<|\>)/ig);
					
					if(typeof notWorker === 'object' && notWorker != null) continue;
					
					TABEL[worker_id] = worker['days'];
					
					//filter++
					if(!firm_uid.includes(worker['firm_uid'])){
						firm_uid.push(worker['firm_uid']);
						
						$('#filter-firms-dv').append('<label><input type="checkbox" onClick="changeFilter('+"'firm'"+')" checked="checked" name="'+worker['firm_uid']+'" />'+worker['firm_name']+'</label>');
					}
					
					if(!post_uid.includes(worker['post_uid'])){
						post_uid.push(worker['post_uid']);
						
						$('#filter-posts-dv').append('<label><input type="checkbox" onClick="changeFilter('+"'post'"+')"  checked="checked" name="'+worker['post_uid']+'" />'+worker['post_name']+'</label>');
					}
					
					if(!location_uid.includes(worker['location_uid'])){
						location_uid.push(worker['location_uid']);
						
						$('#filter-locations-dv').append('<label><input type="checkbox" onClick="changeFilter('+"'location'"+')"  checked="checked" name="'+worker['location_uid']+'" />'+worker['location_name']+'</label>');
					}
					//filter--
					
					html += '<div id="'+worker_id+'-row" class="worker-row">';
					html += '<div id="'+worker_no+'number-row" class="number-row">'+worker_no+'</div>';
					html += '<div id="'+worker_id+'" class="worker_lb">';
					html += '<span id="'+worker_id+'-sp">'+worker['fio']+'</span>';
					html += '<div id="'+worker_id+'-info-dv" onClick="showHideInfo(this, \''+worker_id+'\')" class="info-row"></div>';
					html += '</div>';
					html += '</div>';
					
					//days++
					htmlDays+= '<div id="'+worker_id+'-dv" class="row-days-dv">';
					for(let d in DAYS){
						
						let day			= worker['days'][d];
						let days_id		= worker_no+'-'+(Number(d)+1);
						let dayHours 	= "";
						let dayValue 	= "";
						
						if(day != undefined && day['vt'] != undefined){	
							dayValue = day['vt'];
						
							if(codesDi.includes(String(day['hours']))){
								dayHours = day['hours'];
							}
							
						}
						
						suffix = day['weekend'] ? 'weekend' : 'work';
						opacity = '1';//day['enable'] ? '1' : '.5';
					
						// Формируем красивый html для ячейки
						let hoursNum = Number(dayHours);
						let htmlCell = '';
						if(dayValue && !hoursNum){
							htmlCell = `<span class="cell-code-big">${dayValue}</span>`;
							htmlCell += `<div id="${days_id}-day-hours" class="days-hours"></div>`;
						}else if(dayValue && hoursNum){
							htmlCell = `<span class="cell-code-small">${dayValue}</span><span class="cell-hours-big">${hoursNum}</span>`;
						}else{
							htmlCell = '';
							htmlCell += `<div id="${days_id}-day-hours" class="days-hours"></div>`;
						}
						htmlCell += `<div id="${days_id}-day-comment" class="days-comment" style="display: ${day['comment'] != "" ? "block" : "none"};"></div>`;
						
						htmlDays += '<div id="'+days_id+'-day-dv" class="days-'+suffix+'" style="opacity:'+opacity+';" title="'+day['comment']+'" onMouseDown="startSelect('+Number(worker_no-1)+','+Number(d)+')" onMouseMove="endSelect('+Number(worker_no-1)+','+Number(d)+')" onMouseOver="overCell(\''+worker_no+'\','+Number(w)+','+Number(d)+')" onMouseOut="outCell(\''+worker_no+'\','+Number(w)+','+Number(d)+')" onContextMenu="onRightClick()" ondblclick="onDoubleClick()">'+htmlCell+'</div>';
						
					}
					
					//days--
					htmlDays += '</div>';
				
					htmlSumDays	+= '<div id="'+worker_id+'-days-dv" class="row-sum-days-dv"></div>';
					htmlSumHours+= '<div id="'+worker_id+'-hours-dv" class="row-sum-hours-dv"></div>';
								
				}
				
				//items--
				html += '</div>';
				
				//field++
				html += '<div id="field">';
				html += htmlDays;
				html += '</div>';
				
				//sum-days
				html += '<div id="sum-days-dv">';
				html += htmlSumDays;
				html += '</div>'
				
				//sum-hours		
				html += '<div id="sum-hours-dv">';
				html += htmlSumHours;
				html += '</div>'
				
				//workers--
				html += '</div>';
				
			}
			
			//chief-canvas--
			html += '</div>';
			
		}
		
		//location-canvas--
		html += '</div>';
		
	}
	
	html += '</div>';

	$('#table').html(html);
	// Удалена синхронизация ширины #head-days через JS

	for(let w in WORKERS){
		
		let row_no 	= Number(w)+1;
		let id 		= row_no+'_'+WORKERS[w]['uid'];
		
		for(let d in TABEL[id]){
			
			let col_no = Number(d)+1;
			let val = TABEL[id][d]['vt'];
			let hours = TABEL[id][d]['hours'];
			let $cell = $('#'+row_no+'-'+col_no+'-day-dv');
			$cell.removeClass('cell-attendance-missing-hours');
			// Применяем только для дней ДО сегодняшнего (не включая сегодня)
			if(col_no < Number(TODAY)+1) {
				if((!val || val === "") && (!hours || hours == 0)){
					$cell.addClass('cell-attendance-missing-hours');
					$cell.css({"color": YaFnt, "font-weight": "bold"});
				}else if(val === "Я" && (!hours || hours == 0)){
					$cell.addClass('cell-attendance-missing-hours');
					$cell.css({"color": YaFnt, "font-weight": "bold"});
				}else{
					$cell.css({"color": selectedFnt, "font-weight": "normal"});
				}
			} else {
				$cell.css({"color": selectedFnt, "font-weight": "normal"});
			}

		}
		
	}
	
	for(index in CANVASES){
		
		let canvas = CANVASES[index];
		
		if(canvas['state'] == "show" || master_no == 1){
			$('#'+canvas['id']+'-head .toggle-bt').css('background-image', 'url("/images/report/up.png")');
			$('#'+canvas['id']+'-canvas').show();
		}else{
			$('#'+canvas['id']+'-head .toggle-bt').css('background-image', 'url("/images/report/down.png")');
			$('#'+canvas['id']+'-canvas').hide();
		}
	}
	
	calcDays();
	
}

// ACTION ===========================

// Функция для показа уведомления о потере соединения
function showConnectionError(message = "Потеряно соединение с сервером! Изменения не сохранены.") {
    if ($('#connection-error-notify').length === 0) {
        $('body').append('<div id="connection-error-notify" style="position:fixed;top:30px;right:30px;z-index:99999;background:#ffdddd;border:1px solid #c00;padding:15px 25px;border-radius:8px;box-shadow:0 2px 8px #0002;font-size:18px;display:none;"></div>');
    }
    $('#connection-error-notify').text(message).fadeIn(200);
    setTimeout(() => { $('#connection-error-notify').fadeOut(500); }, 5000);
}

async function sendDataTabel(full=true){
    let items  = [];
    let arr_in = full ? TABEL : QUEUE.shift();
    for(let key in arr_in){
        let id_arr  = key.split('_');
        let no      = Number(id_arr[0]);
        let uid     = id_arr[1];
        let item            = {};
        item['uid']         = uid;
        item['master_uid']  = WORKERS[no-1]['master_uid'];
        item['tabel'] = [];
        for(let d in arr_in[key]){
            item['tabel'].push(arr_in[key][d]);
        }
        items.push(item);
    }
    // Логируем отправляемые данные
    console.log('Отправка данных на сервер 1С:', JSON.stringify(items, null, 2));
    if(items.length == 0) return;
    let data;
    try {
        data = await getData(full, !full, "ЗаписатьЗначенияТабеля", [UID, curDate.format("yyyymmdd"), items]);
    } catch (e) {
        showConnectionError("Ошибка соединения с сервером! Попробуйте позже.");
        return;
    }
    // Логируем ответ сервера
    console.log('Ответ сервера 1С:', data);
    if(!data || data.error || !data.valid) {
        showConnectionError("Изменения не сохранены! Проверьте соединение с сервером.");
        $('#loader_dv').hide();
        $('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
        $('#loader_des').append(data && data.des ? data.des : "Нет ответа от сервера");
        $('#loader_des').show();
        $('#loader').show();
        console.log(data && data.des ? data.des : "Нет ответа от сервера");
        return;
    }
    
    if(full){	
        if(!data.error && data.valid){
            location.reload();
        }else{
            $('#loader_dv').hide();
            $('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
            $('#loader_des').append(data.des);
            $('#loader_des').show();
            $('#loader').show();
            
            console.log(data.des);
        }	
    }else{
        if(!data.error && data.valid){
            
            $('#loader').hide();
            
            TIMESTAMP_SESSION 	= Math.floor(Date.now() / 1000);
            TIMESTAMP_ACTIVITY 	= Math.floor(Date.now() / 1000);
            
            if(QUEUE.length > 0) sendDataTabel(false);
            
        }else{
            $('#loader_dv').hide();
            $('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
            $('#loader_des').append(data.des);
            $('#loader_des').show();
            $('#loader').show();
            
            console.log(data.des);
        }
    }

}

async function changeData(...args){
	
	let full = false;
	let method = args.shift();
	
	args.unshift(UID);
	
	let data = await getData(full, !full, method, args);
	
	if(!data.error && data.valid){
		document.location.reload();
	}else{
		console.log(data.des);
		
		$('#loader_dv').hide();
		$('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
		$('#loader_des').append(data.des);
		$('#loader_des').show();
		$('#loader').show();
	}
}

function toPage(chapter=""){
	
	switch(chapter){
		default:
		case "menu":
			document.location.href = "/";
			break;
		case "exit":
			SID = null;
			UID = null;	
			LABEL = null;
				
			delAllCookie();
				
			document.location.href="/auth.htm";

			break;
	}
	
}

let changedCells = {};
function setCells(value, isComment=false, isFullClear=false){
	
	let uid = "";
	let day = -1;
	
	for(let key in selectedCells){
		
		let changed = false;
		
		let cell = selectedCells[key];
		
		uid = WORKERS[Number(cell['row'])]['uid'];
		day = Number(cell['col']);
		
		let no = Number(cell['row'])+1;
		let id = no+'_'+uid;
		
		if($('#'+id+'-row').is(':hidden')) continue;
		//if(!WORKERS[Number(cell['row'])]['days'][cell['col']]['enable']) continue;

		if(TODAY == -1) continue;
		//if((TODAY+1 >= 15 && Number(cell['col'])+1 <= 15) || Number(cell['col'])+1 < TODAY+1) continue;
		
		let matches = String(value).match(/(ПК|Б|ОТ|ОД|ДО|Р|УВ|ОЖ|У)/igu);
		
		if(Number(cell['col']) > TODAY && matches == null && !isComment && !isFullClear){
			continue; // Просто пропускаем, не трогаем ячейку
		}
		
		if(isComment || isFullClear){
			
			if(TABEL[id][day]['comment'] != value) {
				changed = true;
			}
			
			TABEL[id][day]['comment'] = value;			
			
			if(value != ""){
				$('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment').show();
			}else{
				$('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment').hide();
			}
			
			$('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').attr('title', value);			
			
		}
		
		if(!isComment || isFullClear){
			
			let htmlValue = '';
			let dayHours = '';
			let dayValue = String(TABEL[id][day]['vt']);
			if(codesDi.includes(value)){
				dayValue = dayValue == '' ? 'Я' : dayValue;
				dayHours = dayValue != '' ?  Number(value) : 0;
			}else{
				dayValue = Number(value) != 0 || value == '' ? value : "Я";
				dayHours = "";
			}
			if(TABEL[id][day]['vt'] != dayValue ||  Number(TABEL[id][day]['hours']) != Number(dayHours)) {
				changed = true;
			}
			TABEL[id][day]['vt']  = dayValue;
			TABEL[id][day]['hours'] = dayHours == "" ? 0 : dayHours;
			// Формируем красивый html
			let hoursNum = Number(dayHours);
			if(dayValue && !hoursNum){
				// Только буквенный код, без часов
				htmlValue = `<span class="cell-code-big">${dayValue}</span>`;
			} else if(dayValue && hoursNum) {
				// Есть и код, и часы
				htmlValue = `<span class="cell-code-small">${dayValue}</span><span class="cell-hours-big">${hoursNum}</span>`;
			} else {
				htmlValue = '';
			}
			htmlValue += '<div id="'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment" class="days-comment" title="'+TABEL[id][day]['comment']+'"></div>';
			if(hoursNum == 0) {
				htmlValue += '<div id="'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-hours" class="days-hours"></div>';
			}
			$('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').html(htmlValue);

			if(dayValue === "Я" && (!dayHours || dayHours == 0)){
				$('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').css({"color": YaFnt, "font-weight": "bold"});
			}else{
				$('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv').css({"color": selectedFnt, "font-weight": "normal"});
			}
			
			if(TABEL[id][day]['comment'] != ''){
				$('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment').show();
			}else{
				$('#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-comment').hide();
			}
		}
		
		if(changed){
			if (!changedCells[id]) changedCells[id] = {};
			changedCells[id][day] = TABEL[id][day];
			// Смещаем таймер активности на 10 секунд вперёд, если пользователь работает
			TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
		}
		
		let col = Number(cell['col'])+1;
		let $cell = $('#'+no+'-'+col+'-day-dv');
		$cell.removeClass('cell-attendance-missing-hours');
		if (col < Number(TODAY)+1) {
			let val = TABEL[id][day]['vt'];
			let hours = TABEL[id][day]['hours'];
			if ((!val || val === "") && (!hours || hours == 0)) {
				$cell.addClass('cell-attendance-missing-hours');
				$cell.css({"color": YaFnt, "font-weight": "bold"});
			} else if (val === "Я" && (!hours || hours == 0)) {
				$cell.addClass('cell-attendance-missing-hours');
				$cell.css({"color": YaFnt, "font-weight": "bold"});
			} else {
				$cell.css({"color": selectedFnt, "font-weight": "normal"});
			}
		} else {
			$cell.css({"color": selectedFnt, "font-weight": "normal"});
		}

	}
	
}

function getCellValue(indexRow, indexCol){
	
	for(let key in selectedCells){
	
		let cell = selectedCells[key];
		
		if(indexRow == cell['row'] && indexCol == cell['col']){
			
			let uid = WORKERS[Number(cell['row'])]['uid'];
			let day = Number(cell['col']);
			let no 	= Number(cell['row'])+1;
			let id 	= no+'_'+uid;
			
			return TABEL[id][day];
		}
		
	}
	
	return null;
}

function setComment(clear=false){
	
	if(clear){
		setCells("", true);
	}else{
		setCells($('#add-comment-in').val(), true);
	}
	
	$('#add-comment-in').val("");
	$('#add-comment-dv').removeClass('show');
	
	settingComment = false;
	
}

function calcDays(){
    let emptyDays = {};
    let allWorkers = {};
    let daysArr = [];
    let hoursArr = [];
    let masterMap = {};
    let chiefMap = {};
    let locationMap = {};

    // Сначала собираем все значения в массивы и строим маппинги
    for(let w in WORKERS){
        let days = 0, hours = 0;
        let row_no = Number(w)+1;
        let id = row_no+'_'+WORKERS[w]['uid'];
        let master_id = String($('#'+id+'-row').parent().parent().attr('id')).replace('-canvas', '');
        let chief_id = String($('#'+id+'-row').parent().parent().parent().attr('id')).replace('-canvas', '');
        let location_id = String($('#'+id+'-row').parent().parent().parent().parent().attr('id')).replace('-canvas', '');
        if (!masterMap[master_id]) masterMap[master_id] = [];
        if (!chiefMap[chief_id]) chiefMap[chief_id] = [];
        if (!locationMap[location_id]) locationMap[location_id] = [];
        masterMap[master_id].push(WORKERS[w]);
        chiefMap[chief_id].push(WORKERS[w]);
        locationMap[location_id].push(WORKERS[w]);
        for(let d in DAYS){
            let col_no = Number(d)+1;
            let $cell = $('#'+row_no+'-'+col_no+'-day-dv');
            let text = $cell.text();
            if(text != ""){
                let htmlDays = text.match(/(\d|Я|К)/igu);
                if(htmlDays != null) days++;
                hours += Number(text.replace(/[^0-9]/igu, 0));
            }
        }
        daysArr[w] = days;
        hoursArr[w] = hours;
    }

    // Потом одним циклом обновляем DOM
    for(let w in WORKERS){
        let row_no = Number(w)+1;
        let id = row_no+'_'+WORKERS[w]['uid'];
        let $days = $('#'+id+'-days-dv');
        let $hours = $('#'+id+'-hours-dv');
        if ($days.text() != daysArr[w]) {
            if(daysArr[w] > 0) $days.html(daysArr[w]);
            else $days.empty();
        }
        if ($hours.text() != hoursArr[w]) {
            if(hoursArr[w] > 0) $hours.html(hoursArr[w]);
            else $hours.empty();
        }
    }

    // --- Новая функция подсчёта, как в тултипе ---
    function tooltipStats(workersArr) {
        let todayIndex = TODAY;
        let countY = 0;
        let countB = 0;
        let countEmpty = 0;
        let detailedNotPresentCounts = {'НН': 0, 'НВ': 0, 'Г': 0, 'МО': 0};
        let detailedAbsentCounts = {'ОТ': 0, 'ОД': 0, 'У': 0, 'ОБ': 0, 'ПК': 0, 'Д': 0, 'ДО': 0, 'УВ': 0, 'Р': 0, 'ОЖ': 0};
        let totalWorkers = 0;
        for(let i=0;i<workersArr.length;i++){
            let worker = workersArr[i];
            if (
                !worker ||
                !worker.uid ||
                !worker.fio ||
                typeof worker.fio !== 'string' ||
                worker.fio.trim().startsWith('‹') ||
                !worker.days ||
                !Array.isArray(worker.days) ||
                worker.days.length <= todayIndex ||
                !worker.days[todayIndex] ||
                typeof worker.days[todayIndex] !== 'object'
            ) {
                countEmpty++;
                totalWorkers++;
                continue;
            }
            let vt = String(worker.days[todayIndex].vt).toUpperCase();
            totalWorkers++;
            if (vt === 'Я') {
                countY++;
            } else if (vt === 'Б') {
                countB++;
            } else if (detailedNotPresentCounts.hasOwnProperty(vt)) {
                detailedNotPresentCounts[vt]++;
            } else if (detailedAbsentCounts.hasOwnProperty(vt)) {
                detailedAbsentCounts[vt]++;
            } else if (vt === '') {
                countEmpty++;
            }
        }
        let sumNotPresent = countB + detailedNotPresentCounts['НВ'] + detailedNotPresentCounts['Г'] + detailedNotPresentCounts['МО'];
        let sumAbsent = 0;
        for (const code in detailedAbsentCounts) {
            sumAbsent += detailedAbsentCounts[code];
        }
        // let onObject = totalWorkers - sumAbsent;
        let onObject = totalWorkers - sumAbsent;
        return {countEmpty, onObject, sumAbsent};
    }
    // Мастера
    for(let id in masterMap){
        let stats = tooltipStats(masterMap[id]);
        let text = 'Пустых: ' + stats.countEmpty + ' из (' + stats.onObject + ' + ' + stats.sumAbsent + ')';
        let $empty = $('#'+id+'-empty-sp');
        if ($empty.text() !== text) $empty.html(text);
    }
    // Начальники
    for(let id in chiefMap){
        let stats = tooltipStats(chiefMap[id]);
        let text = 'Пустых: ' + stats.countEmpty + ' из (' + stats.onObject + ' + ' + stats.sumAbsent + ')';
        let $empty = $('#'+id+'-empty-sp');
        if ($empty.text() !== text) $empty.html(text);
    }
    // Локации
    for(let id in locationMap){
        let stats = tooltipStats(locationMap[id]);
        let text = 'Пустых: ' + stats.countEmpty + ' из (' + stats.onObject + ' + ' + stats.sumAbsent + ')';
        let $empty = $('#'+id+'-empty-sp');
        if ($empty.text() !== text) $empty.html(text);
    }
}

function unselectCells(){
	if(Object.keys(changedCells).length > 0){
		QUEUE.push(changedCells);
		changedCells = {};
		if(QUEUE.length > 0) sendDataTabel(false);
	}
	for(let key in selectedCells){
		let cell = selectedCells[key];
		if(!cell) continue;
		let idCell = '#'+Number(cell['row']+1)+'-'+Number(cell['col']+1)+'-day-dv';
		let today = false;
		let weekend = false;
		if($(idCell).attr('class')) weekend = Boolean($(idCell).attr('class').match(/weekend/iu));
		if($('#0_'+Number(cell['col'])+'-day-dv').attr('class')) today = Boolean($('#0_'+Number(cell['col'])+'-day-dv').attr('class').match(/today/iu));
		if(weekend){
			$(idCell).css("background", weekendBgd);
			$('#'+Number(cell['row']+1)+'number-row').css("background", unselectedNoBgd);
			if(today){
				$('#0_'+Number(cell['col'])+'-day-dv').css("background", todayBgd);
			}else{
				$('#0_'+Number(cell['col'])+'-day-dv').css("background", weekendBgd);
			}
		}else{
			$(idCell).css("background", unselectedBgd);
			$('#'+Number(cell['row']+1)+'number-row').css("background", unselectedNoBgd);
			if(today){
				$('#0_'+Number(cell['col'])+'-day-dv').css("background", todayBgd);
			}else{
				$('#0_'+Number(cell['col'])+'-day-dv').css("background", unselectedBgd);
			}
		}
		$(idCell).css("color", unselectedFnt);
		
	}
	selectedCells = [];
	$("#context-menu").hide(50);
	$("#cell-menu").hide(50);
	$('#history-menu').hide(50);
}

let curRow = -1;
let curCol = -1;
function selectCell(indexRow, indexCol, shiftSelection=false){
	// Поддержка Ctrl+ЛКМ для точечного выделения
	if (window.event && (window.event.ctrlKey || window.event.metaKey)) {
		// Проверяем, выделена ли уже эта ячейка
		let foundIdx = -1;
		for (let i = 0; i < selectedCells.length; i++) {
			let cell = selectedCells[i];
			if (cell.row === indexRow && cell.col === indexCol) {
				foundIdx = i;
				break;
			}
		}
		if (foundIdx !== -1) {
			// Уже выделена — снимаем выделение
			selectedCells.splice(foundIdx, 1);
			$('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("background", unselectedBgd);
			$('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("color", unselectedFnt);
			$('#'+Number(indexRow+1)+'number-row').css("background", unselectedNoBgd);
			$('#0_'+Number(indexCol)+'-day-dv').css("background", unselectedBgd);
		} else {
			// Не выделена — добавляем
			let cell = {};
			cell['row'] = indexRow;
			cell['col'] = indexCol;
			selectedCells.push(cell);
			$('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("background", selectedBgd);
			$('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("color", selectedFnt);
			$('#'+Number(indexRow+1)+'number-row').css("background", selectedBgd);
			$('#0_'+Number(indexCol)+'-day-dv').css("background", selectedBgd);
		}
		return;
	}
	// Если уже выделена эта ячейка и выделено больше одной — не сбрасываем выделение
	if (!shiftSelection && selectedCells.length > 1) {
		for (let cell of selectedCells) {
			if (cell.row === indexRow && cell.col === indexCol) {
				return;
			}
		}
	}
	showHideInfo(null,null);
	curRow = indexRow;
	curCol = indexCol;
	if(!shiftSelection) {
		unselectCells();
	}
	let cell = {};
	cell['row'] = indexRow;
	cell['col'] = indexCol;
	selectedCells.push(cell);
	$('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("background", selectedBgd);
	$('#'+Number(indexRow+1)+'-'+Number(indexCol+1)+'-day-dv').css("color", selectedFnt);
	$('#'+Number(indexRow+1)+'number-row').css("background", selectedBgd);
	$('#0_'+Number(indexCol)+'-day-dv').css("background", selectedBgd);
}

let startRow = -1;
let startCol = -1;
function startSelect(indexRow, indexCol, shiftSelection=false){
    // Если Shift нажат и уже есть одна выделенная ячейка
    if ((window.event && window.event.shiftKey) && selectedCells.length === 1) {
        let start = selectedCells[0];
        selectRectangle(start.row, start.col, indexRow, indexCol);
        startRow = start.row;
        startCol = start.col;
        curRow = indexRow;
        curCol = indexCol;
        return;
    }
    // Обычное поведение
    selectCell(indexRow, indexCol, shiftSelection);
    startRow = indexRow;
    startCol = indexCol;
}

function endSelect(indexRow, indexCol){

	if(!mouseDown || isRightMB) return;
	
	unselectCells();
	
	let rows = [];
	if(startRow > indexRow){
		for(let i = startRow; i >= indexRow; i--){
			if(!rows.includes(i)) rows.push(i);
		}
	}else{
		for(let i = startRow; i <= indexRow; i++){
			if(!rows.includes(i)) rows.push(i);
		}
	}
	
	let cols = [];
	if(startCol > indexCol){
		for(let i = startCol; i >= indexCol; i--){
			if(!cols.includes(i)) cols.push(i);
		}
	}else{
		for(let i = startCol; i <= indexCol; i++){
			if(!cols.includes(i)) cols.push(i);
		}
	}

	rows.forEach((row) => {
		cols.forEach((col) => {
			let cell 	= {};
			cell['row'] = row;
			cell['col'] = col;
			
			selectedCells.push(cell);
			
			$('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv').css("background", selectedBgd);
			$('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv').css("color", selectedFnt);
			
			$('#'+Number(row+1)+'number-row').css("background", selectedBgd);
			$('#0_'+Number(col)+'-day-dv').css("background", selectedBgd);
		});
	});
	
}

function selectRow(indexRow){
	
	unselectCells();
	
	for(let j in DAYS){	
		
		let col_no = Number(j)+1;
		
		let cell 	= {};
		cell['row'] = indexRow;
		cell['col'] = Number(j);
		
		selectedCells.push(cell);
		
		$('#'+Number(indexRow+1)+'-'+col_no+'-day-dv').css("background", selectedBgd);
		$('#'+Number(indexRow+1)+'-'+col_no+'-day-dv').css("color", selectedFnt);
	}
	
}

function selectCol(indexCol){
	
	unselectCells();
	
	for(let i in WORKERS){

		let row_no = Number(i)+1;
		
		let cell 	= {};
		cell['row'] = Number(i);
		cell['col'] = indexCol;
		
		selectedCells.push(cell);
		
		$('#'+row_no+'-'+Number(indexCol+1)+'-day-dv').css("background", selectedBgd);
		$('#'+row_no+'-'+Number(indexCol+1)+'-day-dv').css("color", selectedFnt);

	}
	
}

function overCell(worker_no, indexRow, indexCol){
	
	$('#'+worker_no+'number-row').css({opacity: .5});
	$('#0_'+indexCol+'-day-dv').css({opacity: .5});
	//$('#'+row_no+'-'+Number(indexCol+1)+'-day-dv').css("color", selectedFnt);
	
}

function outCell(worker_no, indexRow, indexCol){
	
	$('#'+worker_no+'number-row').css({opacity: 1});
	$('#0_'+indexCol+'-day-dv').css({opacity: 1});
	//$('#'+row_no+'-'+Number(indexCol+1)+'-day-dv').css("color", selectedFnt);
	
}

let settingComment = false;
function contextAction(act){
	let X, Y; // Объявляем переменные один раз в начале функции
	switch(act){
		default:
			break;
		case "history":
			let worker_uid = null;
			let historyDay = -1;
			for(let key in selectedCells){
				let cell = selectedCells[key];
				worker_uid = WORKERS[Number(cell['row'])]['uid'];
				historyDay = Number(cell['col']);
			}
			let historyDate = new Date(curDate.getFullYear(), curDate.getMonth(), historyDay+1);
			getDataHistory(UID, worker_uid, historyDate.format("yyyymmdd"));
			// УБРАТЬ отсюда позиционирование и показ меню!
			break;
		case "comment":
			console.log('contextAction(comment) вызван', {startRow, startCol, selectedCells});
			// Позиционируем окно комментария рядом с выбранной ячейкой
			let $cell = $('#' + Number(startRow+1) + '-' + Number(startCol+1) + '-day-dv');
			let cellOffset = $cell.offset();
			let cellHeight = $cell.outerHeight();
			let menuWidth = $('#add-comment-dv').outerWidth();
			let windowWidth = $(window).width();
			let margin = 10;
			let left = cellOffset.left + $cell.outerWidth() + 2;
			if (left + menuWidth > windowWidth - margin) {
				left = cellOffset.left - menuWidth - 2;
				if (left < margin) left = margin;
			}
			let top = cellOffset.top;
			$('#add-comment-dv').css({top: top + "px", left: left + "px"});
			$('#add-comment-dv').addClass('show');
			console.log('add-comment-dv должен быть видимым', $('#add-comment-dv').css('display'), $('#add-comment-dv').hasClass('show'));
			let cellVal = getCellValue(startRow, startCol);
			$('#add-comment-in').val(cellVal && cellVal['comment'] ? cellVal['comment'] : "");
			$('#add-comment-in').focus();
			settingComment = true;
			break;
		case "clear":
			showConfirmClearModal(function() {
				setCells("", false);
				setCells("", true);
			});
			break;
	}
	 $("#context-menu").hide(50);
}

function cellAction(vt){
	setCells(vt);
	$("#cell-menu").hide(50);
	unselectCells();
}

function filterAction(act){

	switch(act){
		case "apply":			
			break;
		case "clear":
			break;
	}
	
	$('#filter-dv').hide(50);
	
	settingFilter = false;
	
}

let settingFilter = false;
function showHideFilter(){
	
	if(settingFilter){
		
		$('#filter-dv').hide(50);
	
		settingFilter = false;
		
	}else{
		$('#filter-dv').finish().toggle(50);
	
		settingFilter = true;

	}
	
}

function changeFilter(type){
	
	unselectCells();
	
	if($('#fio-filter-in').val().length > 0){
			
		for(index in CANVASES){
			
			let canvas = CANVASES[index];
			
			$('#'+canvas['id']+'-head .toggle-bt').css('background-image', 'url("/images/report/up.png")');
			$('#'+canvas['id']+'-canvas').show();
		}
	}else{
								
		for(index in CANVASES){
			
			let canvas = CANVASES[index];
			
			$('#'+canvas['id']+'-head').show();
			
			if(canvas['state'] == "show" || CANVASES.length <=3){
				$('#'+canvas['id']+'-head .toggle-bt').css('background-image', 'url("/images/report/up.png")');
				$('#'+canvas['id']+'-canvas').show();
			}else{
				$('#'+canvas['id']+'-head .toggle-bt').css('background-image', 'url("/images/report/down.png")');
				$('#'+canvas['id']+'-canvas').hide();
			}
		}
	}
	
	for(let w in WORKERS){
		
		let worker = WORKERS[w];			
		let no = Number(w)+1;
		let id = no+'_'+worker['uid'];
		
		let showRow = true;
		
		if($('#fio-filter-in').val().length > 0){
			$('#clear-input-bt').show();
		}else{
			$('#clear-input-bt').hide();
		}
		
		let value = $('#fio-filter-in').val();
		let regexp = new RegExp(value, 'iu');
		let match = String(worker['fio']).match(regexp);
		
		if(match != null){
			let newFIO = $('#'+id+'-sp').text().replace(match[0], '<span class="worker-white-green">'+match[0]+'</span>');
			
			$('#'+id+'-sp').html(newFIO);			
		}else{
			$('#'+id+'-sp').html(worker['fio']);
			
			showRow = false;
		}

		$('#filter-firms-dv input').each(function(){
			let firm_uid = $(this).attr("name");	
				
			if(firm_uid == worker['firm_uid']){
				showRow = $(this).is(":checked") && showRow;
			}	
			
		});
		
		$('#filter-locations-dv input').each(function() {
			let location_uid = $(this).attr("name");	
			
			if(location_uid == worker['location_uid']){
				showRow = $(this).is(":checked") && showRow;
			}
		});
		
		$('#filter-posts-dv input').each(function() {
			let post_uid = $(this).attr("name");	
			
			if(post_uid == worker['post_uid']){
				showRow = $(this).is(":checked") && showRow;
			}
		});
		
		let master_id 	= String($('#'+id+'-row').parent().parent().attr('id')).replace('-canvas', '');	
		let chief_id 	= String($('#'+id+'-row').parent().parent().parent().attr('id')).replace('-canvas', '');
		let location_id = String($('#'+id+'-row').parent().parent().parent().parent().attr('id')).replace('-canvas', '');

		if(showRow){
			
			$('#'+id+'-row').show();
			$('#'+id+'-dv').show();
			$('#'+id+'-days-dv').show();
			$('#'+id+'-hours-dv').show();
			
			if($('#fio-filter-in').val().length > 0){	
				$('#'+location_id+'-head').show();
				$('#'+location_id+'-canvas').show();
				$('#'+chief_id+'-head').show();
				$('#'+chief_id+'-canvas').show();
				$('#'+master_id+'-head').show();
				$('#'+master_id+'-canvas').show();
			}
		}else{
			
			$('#'+id+'-row').hide();
			$('#'+id+'-dv').hide();
			$('#'+id+'-days-dv').hide();
			$('#'+id+'-hours-dv').hide();
			
			if($('#fio-filter-in').val().length > 0){	
				if($('#'+master_id+'-canvas').height() == 0){
					$('#'+master_id+'-head').hide();
					$('#'+master_id+'-canvas').hide();
				}
				
				if($('#'+chief_id+'-canvas').height() == 0){
					$('#'+chief_id+'-head').hide();
					$('#'+chief_id+'-canvas').hide();
				}
				
				if($('#'+location_id+'-canvas').height() == 0){
					$('#'+location_id+'-head').hide();
					$('#'+location_id+'-canvas').hide();
				}
			}

		}
		
	}
	
}

function changeChief(worker_id){
	
	let location_uid 	= $(':selected', $('#chiefs-sl')).parent().attr('value');
	let chief_uid 		= "";
	
	for(let w in WORKERS){
		
		let no = Number(w)+1;
		let id = no+'_'+WORKERS[w]['uid'];
		
		if(id == worker_id && w == no-1){
			
			//if(WORKERS[w]['location_uid'] != location_uid && chief_uid != $('#chiefs-sl').val()){
			if($('#chiefs-sl').val() != WORKERS[w]['chief_uid']){
			
				$('#info-dv .info-save-dv').show();
		
				$('#info-dv .info-save-dv').click(function(){
					changeData("НазначитьМастеруНовогоНачальника", location_uid, WORKERS[w]['location_uid'], $('#chiefs-sl').val(), WORKERS[w]['uid']);
					
					$('#info-dv .info-save-dv').hide();
				});
			
			}else{
				$('#info-dv .info-save-dv').hide();
			}
			
			break;
		}
	}
}

function changeMaster(worker_id){

	let location_uid 	= $(':selected', $('#masters-sl')).parent().attr('value');
	let chief_uid 		= "";
	
	for(let l in LOCATIONS){
		for(let m in LOCATIONS[l]['masters']){
			if($('#masters-sl').val() == LOCATIONS[l]['masters'][m]['uid']){
				chief_uid = LOCATIONS[l]['masters'][m]['chief_uid'];
			}		
		}
	}


	for(let w in WORKERS){
		
		let no = Number(w)+1;
		let id = no+'_'+WORKERS[w]['uid'];

		if(id == worker_id && w == no-1){
	
			if(location_uid != WORKERS[w]['location_uid'] || (chief_uid != "" && WORKERS[w]['master_uid'] != $('#masters-sl').val())){
			
				$('#info-dv .info-save-dv').show();
			
				$('#info-dv .info-save-dv').click(function(){
					changeData("НазначитьРаботникуНовогоМастера", location_uid, chief_uid, $('#masters-sl').val(), WORKERS[w]['uid']);

					$('#info-dv .info-save-dv').hide();
				});
				
			}else{
				$('#info-dv .info-save-dv').hide();
			}
		}
	}
}

function clearFio(){
	$('#fio-filter-in').val("");
	
	changeFilter('fio');
}

function slideDiv(type, uid){
	showHideInfo(null,null);

	let $head = $('#'+type+'_'+uid+'-head');
	let $canvas = $('#'+type+'_'+uid+'-canvas');
	if($canvas.is(':hidden')){
		$head.find('.toggle-bt').css('background-image', 'url("/images/report/up.png")');
		$canvas.slideDown(100);
		$head.removeClass('collapsed');
		setCookie(type+'_'+uid, "show", "/", null, null);
	}else{
		$head.find('.toggle-bt').css('background-image', 'url("/images/report/down.png")');
		$canvas.slideUp(100);
		$head.addClass('collapsed');
		setCookie(type+'_'+uid, "hide", "/", null, null);
	}
}

function rollAll(way){
	
	switch(way){
		default:
			return;
			break;
		case "up":
			for(index in CANVASES){
		
				let canvas = CANVASES[index];
				
				$('#'+canvas['id']+'-canvas').hide();
				
				delCookie(canvas['id'], "/", null);
			}
			
			scrollTo(0, 0);
			break;
		case "down": 		
			for(index in CANVASES){
		
				let canvas = CANVASES[index];
				
				$('#'+canvas['id']+'-canvas').show();
				
				setCookie(canvas['id'], "show", "/", null, null);
			}			
			break;
	}
	
}

// EVENTS ===========================

function showHideInfo(element, id){
	
	let action = "";
	if($(element).css('opacity') == .2){
		action = "show";
	}
	
	$('.info-row').css({opacity: .2});
	
	if(action == "show"){
		
		let id_arr 	= id.split('_');
		let no 		= Number(id_arr[0]);
		let uid 	= id_arr[1];
		
		$(element).css({opacity: 1});
	
		let e = window.event;
		
		let X = e.clientX+20;
		let Y = (e.clientY+250 > $(window).height()) ? $(window).height()-230 : e.clientY;
		
		$("#info-dv").css({top: Y + "px", left:  X + "px"});
		
		for(let w in WORKERS){
			
			let worker = WORKERS[w];
			
			if(uid == worker['uid'] && w == no-1){
				
				$('#info-dv .info-fio-dv').html("<strong>ФИО: </strong>"+worker['fio'].toUpperCase());
				$('#info-dv .info-organization-dv').html("<strong>Организация: </strong>"+worker['firm_name']);
				$('#info-dv .info-location-dv').html("<strong>Участок: </strong>"+worker['location_name']);
				
				let htmlChiefs = '<select id="chiefs-sl" onchange="changeChief('+"'"+id+"'"+')">';
				for(let l in LOCATIONS){
					htmlChiefs += '<optgroup label="'+LOCATIONS[l]['name']+'" value="'+LOCATIONS[l]['uid']+'" >';
					for(let c in LOCATIONS[l]['chiefs']){
						
						let chief = LOCATIONS[l]['chiefs'][c];
						
						if(worker['chief_uid'] == chief['uid'] && worker['location_uid'] == LOCATIONS[l]['uid']){
							htmlChiefs += '<option value="'+chief['uid']+'" selected="selected">'+chief['name']+'</option>';					
						}else{
							htmlChiefs += '<option value="'+chief['uid']+'">'+chief['name']+'</option>';
						}
						
					}
					htmlChiefs += '</optgroup>';
				}
				htmlChiefs += '</select>';
				
				let htmlMasters = '<select id="masters-sl" onchange="changeMaster('+"'"+id+"'"+')">';
				for(let l in LOCATIONS){
					htmlMasters += '<optgroup label="'+LOCATIONS[l]['name']+'" value="'+LOCATIONS[l]['uid']+'" >';
					for(let m in LOCATIONS[l]['masters']){
						
						let master = LOCATIONS[l]['masters'][m];
						
						if(worker['master_uid'] == master['uid']  && worker['location_uid'] == LOCATIONS[l]['uid']){
							htmlMasters += '<option value="'+master['uid']+'" selected="selected">'+master['name']+'</option>';					
						}else{
							htmlMasters += '<option value="'+master['uid']+'">'+master['name']+'</option>';
						}
						
					}
					htmlMasters += '</optgroup>';
				}
				htmlMasters += '</select>';
			
				if(worker['is_master']){
					if(!worker['is_chief']){
						$('#info-dv .info-master-dv').html("<strong>Начальник: </strong>"+htmlChiefs);
					}else{
						$('#info-dv .info-master-dv').html("<strong>Начальник: </strong>"+htmlChiefs);
					}
				}
				
				if(worker['is_worker']){
					$('#info-dv .info-master-dv').html("<strong>Мастер: </strong>"+htmlMasters);
				}
				
				$('#info-dv .info-post-dv').html("<strong>Должность: </strong>"+worker['post_name']);
				$('#info-dv .info-category-dv').html("<strong>Разряд: </strong>"+worker['category_name']);
				$('#info-dv .info-birthday-dv').html("<strong>Дата рождения: </strong>"+worker['birthday']+" ("+worker['age']+" л.)");
				
			}	
			
		}	
		
		$('#info-dv .info-save-dv').hide();
		$('#info-dv').show();
	}else{
		$('#info-dv .info-save-dv').hide();
		$('#info-dv').hide();
	}
	
}

function setMouseUpState(e) {
  
	let flags = e.buttons !== undefined ? e.buttons : e.which;

	mouseUp 	= (flags & 1) === 1;
	mouseDown 	= false;
	
	if(settingComment && !$(e.target).parents("#add-comment-dv").length > 0){
		setComment(true);
	}
		
	if(settingFilter && ($(e.target).parents("#workers").length > 0 || $(e.target).parents("#field").length > 0)){
		
		$('#filter-dv').hide(50);
	
		settingFilter = false;
	}
	
	TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);

}

function setMouseDownState(e) {
  
	let flags = e.buttons !== undefined ? e.buttons : e.which;

	mouseUp 	= false;
	mouseDown 	= (flags & 1) === 1;
	
	if("which" in e){
		isLeftMB 	= e.which == 1;
		isRightMB 	= e.which == 3;
	}else if("button" in e){
		isLeftMB 	= e.button == 1;
		isRightMB 	= e.button == 2;
	}
  
	if(flags > 0 && !$(e.target).parents("#context-menu").length > 0){
		//$("#context-menu").hide(50);	console.log("down");	
	}
	
	TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
}

let code = '';
function setCellVal(e){
	
	if($(document.activeElement).attr('id') == "fio-filter-in") return;
	
	let isShift;
	let keynum;
 
	if(window.event){
		isShift = !!window.event.shiftKey;
		keynum  = e.keyCode;
	}else if(e.which){
		isShift = !!ev.shiftKey;
		keynum  = e.which;
	}

	// Логика Excel-подобного выделения через Shift
	if (isShift && !wasShift) {
		startRow = curRow;
		startCol = curCol;
	}
	if (!isShift) {
		startRow = curRow;
		startCol = curCol;
	}
	wasShift = isShift;
	
	if(settingComment){
		
		switch(keynum){
			default:
				return;
				break;
			case 13: //enter
				setComment(false);
				break;
			case 27: //esc
				setComment(true);
				break;
		}
		
	}else{
	
		switch(keynum){
			default:
				let key = String(e.key).toLowerCase();
				
				if(symbolsDi.includes(key)){
				
					if(Number(code+key.toUpperCase()) > 16 || !codesRu.includes(String(code+key.toUpperCase()))){
						code = key.toUpperCase();
					}else{
						code+= key.toUpperCase();
					}
				
				}else if(symbolsRu.includes(key)){
					
					if(!codesRu.includes(String(code+key.toUpperCase()))){
						code = key.toUpperCase();
					}else{
						code+= key.toUpperCase();
					}
					
				}else if(symbolsEn.includes(key)){
					let index = symbolsEn.indexOf(key);
					
					key = symbolsRu[index];
					
					if(!codesRu.includes(String(code+String(key).toUpperCase()))){
						code = String(key).toUpperCase();
					}else{
						code+= String(key).toUpperCase();
					}
				}	
				
				if(code.length > 2) code = code.substring(code.length - 1);
				updateInputIndicator();
				setCells(code);
				calcDays();
				break;
			case 16: case 17: case 18: //shift ctrl alt
				
				break;
			case 9: case 32: //tab space
				break;
			case 13: //enter
				if(code != '' && codesRu.includes(code)) setCells(code);
				unselectCells();
				calcDays();
				code = '';
				updateInputIndicator();
				break;
			case 27: //esc
				unselectCells();
				code = '';
				updateInputIndicator();
				break;
			case 8: case 32: case 46: //backspace space delete
				showConfirmClearModal(function() {
					setCells('', false, true);
					unselectCells();
					calcDays();
					code = '';
					updateInputIndicator();
				});
				break;
			case 37: //left
				if(code != '' && codesRu.includes(code)) setCells(code);
				let newCol = curCol;
				if (!isShift) {
					startRow = curRow;
					startCol = curCol;
				}
				do {
					newCol--;
				} while (newCol >= 0 && !isCellVisible('#'+Number(curRow+1)+'-'+Number(newCol+1)+'-day-dv'));
				if (newCol >= 0) {
					if(!isShift){
						unselectCells();
						selectCell(curRow, newCol);
						curCol = newCol;
					}else{
						if (startRow === -1 || startCol === -1) { startRow = curRow; startCol = curCol; }
						curCol = newCol;
						selectRectangle(startRow, startCol, curRow, curCol);
					}
					calcDays();
					code = '';
					updateInputIndicator();
					let cellSelector = '#'+Number(curRow+1)+'-'+Number(curCol+1)+'-day-dv';
					scrollCellIntoViewWithHeader(cellSelector);
				}
				break;
			case 38: //up
				if(code != '' && codesRu.includes(code)) setCells(code);
				let newRowUp = curRow;
				if (!isShift) {
					startRow = curRow;
					startCol = curCol;
				}
				do {
					newRowUp--;
				} while (newRowUp >= 0 && !isCellVisible('#'+Number(newRowUp+1)+'-'+Number(curCol+1)+'-day-dv'));
				if (newRowUp >= 0) {
					if(!isShift){
						unselectCells();
						selectCell(newRowUp, curCol);
						curRow = newRowUp;
					}else{
						if (startRow === -1 || startCol === -1) { startRow = curRow; startCol = curCol; }
						curRow = newRowUp;
						selectRectangle(startRow, startCol, curRow, curCol);
					}
					calcDays();
					code = '';
					updateInputIndicator();
					let cellSelector = '#'+Number(curRow+1)+'-'+Number(curCol+1)+'-day-dv';
					scrollCellIntoViewWithHeader(cellSelector);
				}
				break;
			case 39: //right
				if(code != '' && codesRu.includes(code)) setCells(code);
				let newColR = curCol;
				if (!isShift) {
					startRow = curRow;
					startCol = curCol;
				}
				do {
					newColR++;
				} while (newColR < DAYS.length && !isCellVisible('#'+Number(curRow+1)+'-'+Number(newColR+1)+'-day-dv'));
				if (newColR < DAYS.length) {
					if(!isShift){
						unselectCells();
						selectCell(curRow, newColR);
						curCol = newColR;
					}else{
						if (startRow === -1 || startCol === -1) { startRow = curRow; startCol = curCol; }
						curCol = newColR;
						selectRectangle(startRow, startCol, curRow, curCol);
					}
					calcDays();
					code = '';
					updateInputIndicator();
					let cellSelector = '#'+Number(curRow+1)+'-'+Number(curCol+1)+'-day-dv';
					scrollCellIntoViewWithHeader(cellSelector);
				}
				break;
			case 40: //down
				if(code != '' && codesRu.includes(code)) setCells(code);
				let newRowDown = curRow;
				if (!isShift) {
					startRow = curRow;
					startCol = curCol;
				}
				do {
					newRowDown++;
				} while (newRowDown < WORKERS.length && !isCellVisible('#'+Number(newRowDown+1)+'-'+Number(curCol+1)+'-day-dv'));
				if (newRowDown < WORKERS.length) {
					if(!isShift){
						unselectCells();
						selectCell(newRowDown, curCol);
						curRow = newRowDown;
					}else{
						if (startRow === -1 || startCol === -1) { startRow = curRow; startCol = curCol; }
						curRow = newRowDown;
						selectRectangle(startRow, startCol, curRow, curCol);
					}
					calcDays();
					code = '';
					updateInputIndicator();
					let cellSelector = '#'+Number(curRow+1)+'-'+Number(curCol+1)+'-day-dv';
					scrollCellIntoViewWithHeader(cellSelector);
				}
				break;
		}
		
		if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
			e.preventDefault();
		}
		
	}
	
	TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
	
}

function onRightClick(){
    // Получаем id ячейки под курсором
    let e = window.event;
    let $target = $(e.target).closest('[id$="-day-dv"]');
    if ($target.length) {
        let id = $target.attr('id'); // например, "5-7-day-dv"
        let match = id.match(/^([0-9]+)-([0-9]+)-day-dv$/);
        if (match) {
            startRow = parseInt(match[1], 10) - 1;
            startCol = parseInt(match[2], 10) - 1;
        }
    }
    selectCell(startRow, startCol);

    if(selectedCells.length != 1) return;

    $("#context-menu").finish().toggle(50);

    let X = (e.clientX+310 > $(window).width()) ? $(window).width()-310 : e.pageX+10;
    let Y = (e.clientY+100 > $(window).height()) ? $(window).height()-140 : e.clientY+10;

    $("#context-menu").css({top: Y + "px", left:  X + "px"});
}

function onDoubleClick(){
	// Если выделено несколько ячеек — не трогаем выделение
	if (selectedCells.length > 1) {
		// только показываем меню
	} else {
		// если выделена одна или ни одна — выделяем текущую
		let value = getCellValue(startRow, startCol);
		selectCell(startRow, startCol);
	}
	let $menu = $("#cell-menu");
	$menu.show();
	// Показываем меню относительно первой выделенной ячейки (или текущей)
	let cell = selectedCells.length > 0 ? selectedCells[0] : {row: startRow, col: startCol};
	let $cell = $('#' + Number(cell.row+1) + '-' + Number(cell.col+1) + '-day-dv');
	showMenuNearCell($cell, $menu, 1);
	$menu.finish().fadeIn(50);
}

function scrollDocument(e){
	
	$("#context-menu").hide();
	$("#cell-menu").hide();
	
	TIMESTAMP_ACTIVITY = Math.floor(Date.now() / 1000);
	
	var $elems = [].slice.call(document.querySelectorAll('.master-head'));

	$elems.forEach(checkStickyState);
	
	
}

function checkStickyState($elem) {
    let currentOffset = $elem.getBoundingClientRect().top;
    let stickyOffset = parseInt(getComputedStyle($elem).top.replace("px", ""));
    let isStuck = currentOffset <= stickyOffset;

	let master_id = String($($elem).attr('id')).replace('-head', '');
    
	if(isStuck){
		$('#'+master_id+'-short-sp').hide();
		$('#'+master_id+'-full-sp').show();
    } else {
		$('#'+master_id+'-short-sp').show();
		$('#'+master_id+'-full-sp').hide();
    }
  }

// Проверка видимости ячейки и её родительских блоков
function isCellVisible(cellSelector) {
    const $cell = $(cellSelector);
    if ($cell.length === 0) return false;
    // Проверяем родителей: master, chief, location
    // master: ближайший .workers
    let $master = $cell.closest('.workers');
    if ($master.length && !$master.is(':visible')) return false;
    // chief: ближайший [id^='c_'][id$='-canvas']
    let $chief = $cell.closest("[id^='c_'][id$='-canvas']");
    if ($chief.length && !$chief.is(':visible')) return false;
    // location: ближайший [id^='l_'][id$='-canvas']
    let $location = $cell.closest("[id^='l_'][id$='-canvas']");
    if ($location.length && !$location.is(':visible')) return false;
    // Сама ячейка
    if (!$cell.is(':visible')) return false;
    return true;
}

function scrollCellIntoViewWithHeader(cellSelector) {
    if (!isCellVisible(cellSelector)) return;
    const $cell = $(cellSelector);
    if ($cell.length === 0) return;
    const cellRect = $cell[0].getBoundingClientRect();
    const headerHeight = 202; // высота фиксированной шапки
    const rowHeight = 32;     // высота строки таблицы
    // Смещение: шапка + одна строка + 1px
    const offset = headerHeight + rowHeight + 1;
    if (cellRect.top < offset) {
        window.scrollBy({
            top: cellRect.top - offset,
            behavior: 'smooth'
        });
    } else if (cellRect.bottom > window.innerHeight - rowHeight) {
        window.scrollBy({
            top: cellRect.bottom - window.innerHeight + rowHeight,
            behavior: 'smooth'
        });
    }
}

// Функция для выделения прямоугольной области
function selectRectangle(startRow, startCol, endRow, endCol) {
    unselectCells();
    let minRow = Math.min(startRow, endRow);
    let maxRow = Math.max(startRow, endRow);
    let minCol = Math.min(startCol, endCol);
    let maxCol = Math.max(startCol, endCol);
    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            if (!isCellVisible('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv')) continue;
            let cell = {};
            cell['row'] = row;
            cell['col'] = col;
            selectedCells.push(cell);
            $('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv').css('background', selectedBgd);
            $('#'+Number(row+1)+'-'+Number(col+1)+'-day-dv').css('color', selectedFnt);
            $('#'+Number(row+1)+'number-row').css('background', selectedBgd);
            $('#0_'+Number(col)+'-day-dv').css('background', selectedBgd);
        }
    }
}

// Универсальная функция позиционирования меню рядом с ячейкой
function showMenuNearCell($cell, $menu, offsetCol = 1) {
    // offsetCol: -1 (левее), 0 (по умолчанию), 1 (правее)
    let $targetCell = $cell;
    if (offsetCol !== 0) {
        // Получаем координаты текущей ячейки
        let id = $cell.attr('id'); // например, "5-7-day-dv"
        let match = id && id.match(/^(\d+)-(\d+)-day-dv$/);
        if (match) {
            let row = parseInt(match[1], 10);
            let col = parseInt(match[2], 10) + offsetCol;
            let $candidate = $('#' + row + '-' + col + '-day-dv');
            if ($candidate.length > 0 && $candidate.is(':visible')) {
                $targetCell = $candidate;
            }
        }
    }
    // Временно показываем меню невидимо для измерения размеров
    $menu.css({display: 'block', visibility: 'hidden'});
    let menuWidth = $menu.outerWidth();
    let menuHeight = $menu.outerHeight();
    $menu.css({display: '', visibility: ''});

    let cellRect = $targetCell[0].getBoundingClientRect();
    let windowWidth = $(window).width();
    let windowHeight = $(window).height();
    let margin = 10;

    let X = cellRect.left + window.scrollX;
    let Y = cellRect.bottom + window.scrollY;

    if (X + menuWidth > windowWidth + window.scrollX - margin) {
        X = windowWidth + window.scrollX - menuWidth - margin;
    }
    if (X < window.scrollX + margin) X = window.scrollX + margin;

    if (cellRect.bottom + menuHeight > windowHeight) {
        Y = cellRect.top + window.scrollY - menuHeight;
        if (Y < window.scrollY + margin) Y = window.scrollY + margin;
    }

    $menu.css({top: Y + "px", left: X + "px"});
}

// Глобальные функции для истории ячейки
async function getDataHistory(UID, worker_uid, date){
    if(!UID || !worker_uid || !date) return;
    let data = await getData(false, false, "ПолучитьИсториюДанных", [worker_uid, date]);
    if(data){
        if(!data.error && data.valid){
            createHistory(data.result);
        }else{
            console.log(data.des);
            $('#loader_dv').hide();
            $('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
            $('#loader_des').append(data.des);
            $('#loader_des').show();
            $('#loader').show();
        }
    }else{
        console.log(data.des);
        $('#loader_dv').hide();
        $('#loader_des').html('<strong>ЧТО-ТО ПОШЛО НЕ ТАК...</strong></br></br>');
        $('#loader_des').append(data.des);
        $('#loader_des').show();
        $('#loader').show();
    }
}

function createHistory(data){
    // Логируем полученные данные истории
    console.log('История редактирования (ответ сервера):', JSON.stringify(data, null, 2));
    $('#history-menu').empty().hide();
    // Больше не фильтруем по vt/hours, показываем все записи
    if(!data || data.length === 0) {
        $('#history-menu').html('<li style="color:#888;">Нет изменений</li>').show();
        return;
    }
    let html = '';
    for(let i in data){
        let item = data[i];
        html += '<li>';
        html += item.datetime+' <strong>['+(item.vt == null || item.vt == '' ?  ' ' : item.vt)+(item.hours > 0 ? '<sub>'+item.hours+'</sub>' : '')+']</strong> '+item.user;
        html += '</li>';
    }
    setTimeout(function(){
        if(html) {
            $('#history-menu').html(html);
            let $cell = $('#' + Number(startRow+1) + '-' + Number(startCol+1) + '-day-dv');
            let cellOffset = $cell.offset();
            let cellHeight = $cell.outerHeight();
            $('#history-menu').css({display: 'block', visibility: 'hidden'});
            let menuWidth = $('#history-menu').outerWidth();
            let menuHeight = $('#history-menu').outerHeight();
            $('#history-menu').css({display: '', visibility: ''});
            let windowWidth = $(window).width();
            let windowHeight = $(window).height();
            let margin = 10;
            let left = cellOffset.left + $cell.outerWidth() + 2;
            if (left + menuWidth > windowWidth - margin) {
                left = cellOffset.left - menuWidth - 2;
                if (left < margin) left = margin;
            }
            // --- Автоматический выбор позиции ---
            let topBelow = cellOffset.top + cellHeight + 5;
            let topAbove = cellOffset.top - menuHeight - 5;
            let top;
            if (topBelow + menuHeight < windowHeight - margin) {
                // Влезает снизу
                top = topBelow;
            } else if (topAbove > margin) {
                // Влезает сверху
                top = topAbove;
            } else {
                // По центру окна, если не влезает ни сверху, ни снизу
                top = Math.max((windowHeight - menuHeight) / 2 + $(window).scrollTop(), margin);
            }
            $('#history-menu').css({
                top: top + 'px',
                left: left + 'px',
                display: 'block',
                visibility: 'visible'
            }).hide().fadeIn(200); // Плавное появление
        }
    }, 500);
}

// Скрытие меню при клике вне его:
$(document).on('mousedown', function(e) {
    if (!$(e.target).closest('#history-menu').length) {
        $('#history-menu').fadeOut(200);
    }
});

let tooltipTimeoutId = null; // Глобальная переменная для таймера тултипа
let tooltipHideTimeoutId = null; // Новая переменная для таймера скрытия тултипа

function initTooltips() {
    // Удалены все console.log для чистоты кода
    const tooltip = $('#master-tooltip');
    
    if (!tooltip.length) {
        console.warn('Элемент #master-tooltip не найден. Создаем новый элемент тултипа.');
        // Создаем элемент тултипа и добавляем его в DOM с улучшенными стилями
        $('body').append('<div id="master-tooltip" class="tooltip-popup" style="position: absolute; z-index: 9999; background: white; border: 1px solid #788cad; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border-radius: 5px; padding: 10px; display: none; max-width: 400px;"></div>');
        // Получаем ссылку на созданный элемент
        return initTooltips();
    }
    
    // Обновляем стили тултипа для лучшего отображения
    tooltip.css({
        'z-index': 9999,
        'border': '1px solid #788cad',
        'box-shadow': '0 3px 8px rgba(0,0,0,0.3)',
        'border-radius': '5px',
        'padding': '10px',
        'max-width': '400px',
        'background-color': '#fff',
        'font-size': '12px',
        'line-height': '1.4'
    });

    // НОВЫЙ КОД: Сохраняем ссылку на данные в глобальной переменной
    window.SAVED_DATA = DATA;
    window.SAVED_TODAY = TODAY;
    
    // Проверим первую локацию и её структуру
    if (window.SAVED_DATA && window.SAVED_DATA.length > 0) {
        const location = window.SAVED_DATA[0];
        if (location.chiefs) {
            for (let chiefKey in location.chiefs) {
                const chief = location.chiefs[chiefKey];
                break;
            }
        }
    }

    // Проверяем наличие данных перед настройкой тултипов
    if (!DATA || DATA.length === 0) {
        console.warn('Массив DATA пуст. Тултипы будут настроены, но данных для отображения нет.');
    }

    // Проверяем наличие элементов, на которые навешиваем обработчики
    const masterHeads = $('.master-head');
    const chiefHeads = $('.chief-head');
    const locationHeads = $('.location-head');
    
    // Проверяем структуру DATA
    if (typeof DATA !== 'undefined' && Array.isArray(DATA)) {
        if (DATA.length > 0) {
        }
    }

    // Проверяем наличие data-атрибутов на заголовках
    if (masterHeads.length > 0) {
        const firstMasterHead = masterHeads.first();
    }

    // Снимаем предыдущие обработчики, если они были
    $(document).off('mouseenter.genericTooltip mouseleave.genericTooltip');

    const $window = $(window);

    // Добавляем проверку на успешное назначение обработчика
    $(document).on('mouseenter.genericTooltip', '.master-head, .chief-head, .location-head', function(e){
        const $hoveredElement = $(this);
        
        if (tooltipTimeoutId) {
            clearTimeout(tooltipTimeoutId);
        }

        // Гарантируем, что глобальные переменные доступны
        if (!window.SAVED_DATA || !Array.isArray(window.SAVED_DATA) || window.SAVED_DATA.length === 0) {
            return;
        }

        // Обновляем данные о TODAY
        let today = window.SAVED_TODAY;
        if (today === -1 || today >= DAYS.length) {
            // Попробуем найти сегодняшнюю дату сами
            for (let i = 0; i < DAYS?.length || 0; i++) {
                if (DAYS[i]?.today) {
                    today = i;
                    break;
                }
            }
            if (today === -1) {
                today = 0;
            }
        }

        tooltipTimeoutId = setTimeout(() => {
            let workersForTooltip = [];
            let elementType = '';

            // Запоминаем значение today от внешней области видимости
            let todayIndex = today;

            if ($hoveredElement.hasClass('master-head')) { elementType = 'master'; }
            else if ($hoveredElement.hasClass('chief-head')) { elementType = 'chief'; }
            else if ($hoveredElement.hasClass('location-head')) { elementType = 'location'; }

            // Получаем индексы из data-атрибутов
            const locationIdx = $hoveredElement.data('location-idx');
            const chiefIdx = $hoveredElement.data('chief-idx');
            const masterIdx = $hoveredElement.data('master-idx');
            
            // Проверяем, есть ли данные в DATA
            if (!window.SAVED_DATA || typeof window.SAVED_DATA !== 'object' || !window.SAVED_DATA.length) {
                tooltip.hide();
                return;
            }
            
            // Используем сохраненные данные вместо DATA
            const savedData = window.SAVED_DATA;
            
            // Проверка значений индексов перед использованием
            if (elementType === 'master' && locationIdx !== undefined && chiefIdx !== undefined && masterIdx !== undefined) {
            }
            
            // Используем глобальную переменную DATA
            if (elementType === 'master') {
                try {
                    // Получаем UID мастера из ID элемента
                    const masterId = $hoveredElement.attr('id').split('-')[0];
                    
                    // Проверяем прямой доступ через индексы
                    if (typeof locationIdx !== 'undefined' && typeof chiefIdx !== 'undefined' && 
                        typeof masterIdx !== 'undefined' && locationIdx >= 0 && locationIdx < savedData.length) {
                        const location = savedData[locationIdx];
                        
                        if (location && location.chiefs && chiefIdx in location.chiefs) {
                            const chief = location.chiefs[chiefIdx];
                            
                            if (chief && chief.masters && masterIdx in chief.masters) {
                                const master = chief.masters[masterIdx];
                                
                                if (master && master.workers) {
                                    workersForTooltip = [...master.workers];
                                } else {
                                }
                            } else {
                            }
                        } else {
                        }
                    } else {
                        // Перебираем всю структуру DATA в поисках нужного мастера
                        let found = false;
                        for (let locIdx = 0; locIdx < savedData.length && !found; locIdx++) {
                            const location = savedData[locIdx];
                            if (!location || !location.chiefs) continue;
                            
                            for (let chiefKey in location.chiefs) {
                                const chief = location.chiefs[chiefKey];
                                if (!chief || !chief.masters) continue;
                                
                                for (let masterKey in chief.masters) {
                                    const master = chief.masters[masterKey];
                                    
                                    // Проверяем ID мастера в UID элемента
                                    if (master && master.uid && masterId.includes(master.uid)) {
                                        if (master.workers) {
                                            workersForTooltip = [...master.workers];
                                            found = true;
                                            break;
                                        } else {
                                        }
                                    }
                                }
                                if (found) break;
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error searching for master workers:', e);
                }
            } else if (elementType === 'chief') {
                try {
                    // Получаем UID начальника из ID элемента
                    const chiefId = $hoveredElement.attr('id').split('-')[0];
                    
                    // Проверяем прямой доступ через индексы
                    if (typeof locationIdx !== 'undefined' && typeof chiefIdx !== 'undefined' && 
                        locationIdx >= 0 && locationIdx < savedData.length) {
                        const location = savedData[locationIdx];
                        
                        if (location && location.chiefs && chiefIdx in location.chiefs) {
                            const chief = location.chiefs[chiefIdx];
                            
                            if (chief && chief.masters) {
                                for (let m_key in chief.masters) {
                                    const master = chief.masters[m_key];
                                    if (master && master.workers) {
                                        workersForTooltip.push(...master.workers);
                                    }
                                }
                            } else {
                            }
                        } else {
                        }
                    } else {
                        // Перебираем всю структуру DATA в поисках нужного начальника
                        let found = false;
                        for (let locIdx = 0; locIdx < savedData.length && !found; locIdx++) {
                            const location = savedData[locIdx];
                            if (!location || !location.chiefs) continue;
                            
                            for (let chiefKey in location.chiefs) {
                                const chief = location.chiefs[chiefKey];
                                
                                // Проверяем ID начальника в UID элемента
                                if (chief && chief.uid && chiefId.includes(chief.uid)) {
                                    if (chief.masters) {
                                        for (let masterKey in chief.masters) {
                                            const master = chief.masters[masterKey];
                                            if (master && master.workers) {
                                                workersForTooltip.push(...master.workers);
                                            }
                                        }
                                    } else {
                                    }
                                } else {
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error searching for chief workers:', e);
                }
            } else if (elementType === 'location') {
                try {
                    // Получаем UID локации из ID элемента
                    const locationId = $hoveredElement.attr('id').split('-')[0];
                    
                    // Ищем соответствующие данные через индекс
                    if (typeof locationIdx !== 'undefined' && locationIdx >= 0 && locationIdx < savedData.length) {
                        const location = savedData[locationIdx];
                        
                        if (location && location.chiefs) {
                            const chiefs = location.chiefs;
                            
                            for (let c_key in chiefs) {
                                if (chiefs[c_key]?.masters) {
                                    const masters = chiefs[c_key].masters;
                                    for (let m_key in masters) {
                                        if (masters[m_key]?.workers) {
                                            workersForTooltip.push(...masters[m_key].workers);
                                        }
                                    }
                                }
                            }
                        } else {
                        }
                    } else {
                        // Если прямой доступ не сработал, ищем по ID
                        console.log('Direct access failed or not available, searching by ID:', locationId);
                        
                        // Перебираем всю структуру DATA в поисках нужной локации
                        for (let locIdx = 0; locIdx < savedData.length; locIdx++) {
                            const location = savedData[locIdx];
                            
                            // Выводим отладочную информацию о текущей локации
                            if (location) {
                                console.log('Checking location', locIdx, 'UID:', location.uid);
                            }
                            
                            // Проверяем, совпадает ли ID локации с частью ID элемента
                            if (location && locationId.includes(location.uid)) {
                                console.log('Found matching location by UID:', location.uid);
                                
                                if (location.chiefs) {
                                    const chiefCount = Object.keys(location.chiefs).length;
                                    console.log('Location has chiefs:', chiefCount);
                                    
                                    for (let chiefKey in location.chiefs) {
                                        const chief = location.chiefs[chiefKey];
                                        if (chief.masters) {
                                            const masterCount = Object.keys(chief.masters).length;
                                            console.log('Chief', chiefKey, 'has masters:', masterCount);
                                            
                                            for (let masterKey in chief.masters) {
                                                const master = chief.masters[masterKey];
                                                if (master.workers) {
                                                    console.log('Master', masterKey, 'has workers:', master.workers.length);
                                                    workersForTooltip.push(...master.workers);
                                                }
                                            }
                                        }
                                    }
                                }
                                console.log('Found workers for location (by ID):', workersForTooltip.length);
                                break;
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error searching for location workers:', e);
                }
            }

            if (workersForTooltip.length === 0) {
                console.log('No workers found for tooltip, hiding tooltip');
                tooltip.hide();
                return;
            }

            console.log('Found workers for tooltip:', workersForTooltip.length);
            
            // Восстанавливаем полную версию HTML для тултипа
            let statsTableHtml = '';
            
            // Проверяем валидность today и DAYS
            console.log('TODAY global value:', TODAY);
            console.log('Using todayIndex value:', todayIndex);
            console.log('DAYS exists:', typeof DAYS !== 'undefined' && Array.isArray(DAYS));
            if (typeof DAYS !== 'undefined' && Array.isArray(DAYS)) {
                console.log('DAYS length:', DAYS.length);
            }
            
            if (typeof DAYS !== 'undefined' && Array.isArray(DAYS) && DAYS.length > 0) {
                console.log('TODAY is valid and within DAYS range');
                // Фильтруем только реальных сотрудников
                const filteredWorkers = workersForTooltip.filter(
                    w => w && w.uid && w.fio && typeof w.fio === 'string' && !/^[<‹]/.test(w.fio.trim())
                );
                let countY = 0;
                let countB = 0;
                let countEmpty = 0;
                let detailedNotPresentCounts = {'НН': 0, 'НВ': 0, 'Г': 0, 'МО': 0};
                let detailedAbsentCounts = {'ОТ': 0, 'ОД': 0, 'У': 0, 'ОБ': 0, 'ПК': 0, 'Д': 0, 'ДО': 0, 'УВ': 0, 'Р': 0, 'ОЖ': 0};
                let totalWorkers = 0;
                let vtDebugArr = [];
                for(let w_idx in filteredWorkers){
                    let worker = filteredWorkers[w_idx];
                    let vt = '';
                    if (
                        !worker.days ||
                        !Array.isArray(worker.days) ||
                        worker.days.length <= todayIndex ||
                        !worker.days[todayIndex] ||
                        typeof worker.days[todayIndex] !== 'object'
                    ) {
                        continue;
                    }
                    vt = ('vt' in worker.days[todayIndex]) ? String(worker.days[todayIndex].vt) : '[NO VT FIELD]';
                    vtDebugArr.push({fio: worker.fio, vt: vt});
                    totalWorkers++;
                    if (!('vt' in worker.days[todayIndex]) || String(worker.days[todayIndex].vt).trim() === '') {
                        countEmpty++;
                        continue;
                    }
                    vt = String(worker.days[todayIndex].vt).toUpperCase();
                    if (vt === 'Я') {
                        countY++;
                    } else if (vt === 'Б') {
                        countB++;
                    } else if (detailedNotPresentCounts.hasOwnProperty(vt)) {
                        detailedNotPresentCounts[vt]++;
                    } else if (detailedAbsentCounts.hasOwnProperty(vt)) {
                        detailedAbsentCounts[vt]++;
                    } else if (vt === '') {
                        countEmpty++;
                    }
                }
                console.log('DEBUG VT LIST:', vtDebugArr);
                let sumNotPresent = countB + detailedNotPresentCounts['НВ'] + detailedNotPresentCounts['Г'] + detailedNotPresentCounts['МО'];
                let sumAbsent = 0;
                for (const code in detailedAbsentCounts) {
                    sumAbsent += detailedAbsentCounts[code];
                }
                // 'На объекте' — это totalWorkers - sumAbsent
                statsTableHtml = `
                <div class="master-tooltip-content">
                    <table style="width:100%; border-collapse: collapse; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;">
                        <tr>
                             <td style="padding: 2px;font-weight: bold; font-size: 13px;">На объекте</td>
                             <td style="padding: 2px; text-align:right; font-weight: bold; font-size: 13px;">${totalWorkers - sumAbsent}</td>
                        </tr>
                    </table>
                    <table style="width:100%; border-collapse: collapse; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;">
                        <tr>
                             <td style="padding: 2px;font-weight: bold; font-size: 13px;">Явка</td>
                             <td style="padding: 2px; text-align:right; font-weight: bold; font-size: 13px;">${countY}</td>
                        </tr>
                    </table>
                    <div style="display: flex; justify-content: space-between; margin-top: 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;">
                        <div style="width: 48%;">
                            <table style="width:100%; border-collapse: collapse;">
                                <tr><td style="padding: 1px 2px; font-weight: bold; font-size: 13px;">Не выход</td><td style="padding: 1px 2px; text-align:right; font-weight: bold;font-size: 13px"> ${sumNotPresent}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">Б</td><td style="padding: 1px 2px; text-align:right;">${countB}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">НВ</td><td style="padding: 1px 2px; text-align:right;">${detailedNotPresentCounts['НВ']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">Г</td><td style="padding: 1px 2px; text-align:right;">${detailedNotPresentCounts['Г']}</td></tr>
                                <tr><td style="padding: 1px 2px;">МО</td><td style="padding: 1px 2px; text-align:right;">${detailedNotPresentCounts['МО']}</td></tr>
                            </table>
                        </div>
                        <div style="width: 48%;">
                            <table style="width:100%; border-collapse: collapse;">
                                <tr><td style="padding: 1px 2px; font-weight: bold; font-size: 13px;">Отсутствуют</td><td style="padding: 1px 2px; text-align:right; font-weight: bold;font-size: 13px">${sumAbsent}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">ОТ</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ОТ']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">ОД</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ОД']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">У</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['У']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">ОБ</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ОБ']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">ПК</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ПК']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">Д</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['Д']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">ДО</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ДО']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">УВ</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['УВ']}</td></tr>
                                <tr style="border-bottom: 1px dotted #eee;"><td style="padding: 1px 2px;">Р</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['Р']}</td></tr>
                                <tr><td style="padding: 1px 2px;">ОЖ</td><td style="padding: 1px 2px; text-align:right;">${detailedAbsentCounts['ОЖ']}</td></tr>
                            </table>
                        </div>
                    </div>
                    <table style="width: 100%; margin-top: 5px; border-collapse: collapse;">
                         <tr>
                            <td style="padding: 1px 2px; width: 20%; font-weight: bold; font-size: 13px;">НН</td>
                            <td style="padding: 1px 2px; text-align:right; width: 28%; font-weight: bold; font-size: 13px;">${detailedNotPresentCounts['НН']}</td>
                            <td style="padding: 1px 2px; width: 20%; padding-left: 10px; font-weight: bold; font-size: 13px;">Пусто</td>
                            <td style="padding: 1px 2px; text-align:right; width: 28%; font-weight: bold; font-size: 13px;">${countEmpty}</td>
                        </tr>
                    </table>
                </div>
                `;
            } else {
                console.log('TODAY is not valid or not within DAYS range');
                statsTableHtml = '<div style="color:#888; padding: 5px;">Нет данных на сегодня</div>';
            }

            if (!statsTableHtml) { 
                console.log('statsTableHtml is empty, hiding tooltip');
                tooltip.hide();
                return;
            }
            
            console.log('HTML created for tooltip');
            tooltip.html(statsTableHtml);

            // Позиционирование тултипа с учетом размеров окна
            let $anchor = $hoveredElement; // всегда сам элемент!
            let offset = $anchor.offset();
            let anchorWidth = $anchor.outerWidth();
            let anchorHeight = $anchor.outerHeight();
            let menuWidth = tooltip.outerWidth();
            let menuHeight = tooltip.outerHeight();
            let windowWidth = $(window).width();
            let windowHeight = $(window).height();
            let scrollTop = $(window).scrollTop();
            let margin = 10;

            // По правому краю элемента
            let left = offset.left + anchorWidth - menuWidth;
            if (left < margin) {
                left = margin;
            }
            if (left + menuWidth > windowWidth - margin) {
                left = windowWidth - menuWidth - margin;
            }

            let top = offset.top + anchorHeight + 5;
            if (top + menuHeight > windowHeight + scrollTop - margin) {
                top = offset.top - menuHeight - 5;
                if (top < scrollTop + margin) {
                    top = Math.max((windowHeight - menuHeight) / 2 + scrollTop, scrollTop + margin);
                }
            }

            tooltip.css({
                opacity: 0,
                top: top + 'px',
                left: left + 'px'
            }).show().animate({opacity: 1}, 150);

        }, 1000);
    });

    console.log('Attaching mouseleave event handler...');
    $(document).on('mouseleave.genericTooltip', '.master-head, .chief-head, .location-head', function(){
        console.log('mouseleave event fired on:', this.className);
        if (tooltipTimeoutId) {
            clearTimeout(tooltipTimeoutId);
        }
        
        // Очищаем таймер скрытия, если он был установлен
        if (tooltipHideTimeoutId) {
            clearTimeout(tooltipHideTimeoutId);
        }
        
        // Устанавливаем новый таймер скрытия с задержкой
        tooltipHideTimeoutId = setTimeout(() => {
            tooltip.fadeOut(100);
        }, 300);
    });
    
    // Добавляем обработчик наведения на сам тултип для предотвращения скрытия
    tooltip.on('mouseenter', function() {
        if (tooltipHideTimeoutId) {
            clearTimeout(tooltipHideTimeoutId);
        }
    }).on('mouseleave', function() {
        tooltip.stop(true, true).fadeOut(100);
    });
    
    // Добавляем диагностическое логирование
    console.log('initTooltips configuration complete, checking headers...');
    
    // Проверяем несколько заголовков, чтобы убедиться, что data-атрибуты установлены
    if ($('.master-head').length > 0) {
        const sample = $('.master-head').first();
        console.log('Sample master-head data attributes:', {
            'id': sample.attr('id'),
            'location-idx': sample.data('location-idx'),
            'chief-idx': sample.data('chief-idx'),
            'master-idx': sample.data('master-idx')
        });
    }
    
    if ($('.chief-head').length > 0) {
        const sample = $('.chief-head').first();
        console.log('Sample chief-head data attributes:', {
            'id': sample.attr('id'),
            'location-idx': sample.data('location-idx'),
            'chief-idx': sample.data('chief-idx')
        });
    }
    
    if ($('.location-head').length > 0) {
        const sample = $('.location-head').first();
        console.log('Sample location-head data attributes:', {
            'id': sample.attr('id'),
            'location-idx': sample.data('location-idx')
        });
    }
}

// Также вызываем initTooltips только при загрузке страницы,
// а не после каждого вызова getDataTabel, так как сам getDataTabel
// теперь вызывает initTooltips только после успешной загрузки данных
$(document).ready(function() {
    console.log('Document ready - calling initTooltips');
    // Не нужно вызывать initTooltips здесь, так как он вызовется
    // внутри getDataTabel после успешной загрузки данных
    // initTooltips();
});

// Добавляем индикатор ввода при загрузке страницы
$(document).ready(function() {
    if ($('#input-indicator').length === 0) {
        $('body').append('<div id="input-indicator" style="position:fixed;top:210px;right:30px;z-index:9999;background:#fff;border:1px solid #ccc;padding:3px 8px;border-radius:5px;box-shadow:0 2px 6px #0002;display:none;font-size:16px;"></div>');
    }
});

// Функция для обновления индикатора ввода
function updateInputIndicator() {
    if (code && code.length > 0) {
        $('#input-indicator').text(code).show();
    } else {
        $('#input-indicator').hide();
    }
}

// Показываем модальное окно подтверждения удаления
function showConfirmClearModal(onConfirm) {
    $('#confirm-clear-modal').show();
    $('#confirm-clear-yes').off('click').on('click', function() {
        $('#confirm-clear-modal').hide();
        if (typeof onConfirm === 'function') onConfirm();
    });
    $('#confirm-clear-no').off('click').on('click', function() {
        $('#confirm-clear-modal').hide();
    });
}

// Фф