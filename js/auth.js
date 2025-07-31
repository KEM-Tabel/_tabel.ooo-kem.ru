// CREATE ===========================

// ACTION ===========================

async function Login(){
	
	$('#desc-auth').html("");
	
	// Проверяем, что пароль введен
	var pass = $("#pass_in").val();
	if (!pass || pass.trim() === '') {
		$('#desc-auth').html("Введите пароль");
		$('#desc-auth').show();
		return;
	}
	
	// Начинаем анимацию загрузки в кнопке
	startLoginAnimation();
			
	var userData 			= {};
	userData['browser']		= window.navigator.userAgent;
	userData['os']			= window.navigator.appVersion;
	userData['lang']		= window.navigator.language;
	userData['isMobile']	= Boolean(window.navigator.userAgent.toLowerCase().match(/(mobile|tablet|android|iphone|ipad)/i));
	
	/*	
	$.getJSON('https://json.geoiplookup.io/?callback=?', function(data) {
		userData['provider'] = data;
	});	
	*/

	console.log('Отправляю авторизацию:', {pass, userData});

	var data = await getData(true, false, "Авторизация", [pass, userData]);

	if(data){
		
		if(!data.error && data.valid){
			SID 	= data.result.SID;
			UID   	= data.result.UID;
			LABEL 	= data.result.label;
			var readonly = data.result.readonly ? '1' : '0';
			setCookie("SID", SID, "/", null, null);
			setCookie("UID", UID, "/", null, null);
			setCookie("LABEL", LABEL, "/", null, null);
			setCookie("READONLY", readonly, "/", null, null);
			if ('readAll' in data.result) {
				console.log('[DEBUG] Установка readAll cookie:', data.result.readAll);
				setReadAllCookie(data.result.readAll === true);
			}
			
			// Плавный переход к основному лоадеру
			transitionToMainLoader();
			
		}else{
			// Ошибка авторизации - возвращаем кнопку в исходное состояние
			stopLoginAnimation();
			$('#desc-auth').html(data.des);
			$('#desc-auth').show();
		}
			
	}else{
		// Ошибка сервера - возвращаем кнопку в исходное состояние
		stopLoginAnimation();
		$('#desc-auth').html("Ошибка сервера.");
		$('#desc-auth').show();		
	}
	
}

// Функция для запуска анимации загрузки в кнопке
function startLoginAnimation() {
	$('#login-button').addClass('loading');
	$('#auth-loader').fadeIn(300);
	$('#pass_in').prop('disabled', true);
}

// Функция для остановки анимации загрузки в кнопке
function stopLoginAnimation() {
	$('#login-button').removeClass('loading');
	$('#auth-loader').fadeOut(300);
	$('#pass_in').prop('disabled', false);
}

// Функция для плавного перехода к основному лоадеру
function transitionToMainLoader() {
	// Добавляем класс для плавного исчезновения формы
	$('#auth').addClass('fade-out');
	
	// Через 500ms показываем основной лоадер и перенаправляем
	setTimeout(() => {
		$("#loader").show();
		document.location.href="/report.htm";
	}, 500);
}

// --- Глобальная функция для установки куки readAll ---
function setReadAllCookie(value) {
	console.log('[DEBUG] Устанавливаем readAll cookie =', value);
	document.cookie = `readAll=${value}; path=/;`;
	console.log('[DEBUG] Cookie установлен. Все cookies:', document.cookie);
}

// EVENTS ===========================

function authEnter(e){
	
	var keynum;
 
	if(window.event){
		keynum = e.keyCode;
	}else if(e.which){
		keynum = e.which;
	}
	
	switch(keynum){
		default:
			break;
		case 13:
			Login();
			break;
	}
}