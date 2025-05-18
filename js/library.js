window.AUTH_HEADER = 'Basic d2ViOkFTRHFhejEyMw==';

Date.prototype.daysInMonth = function() {
	return 33 - new Date(this.getFullYear(), this.getMonth(), 33).getDate();
};
//====================================

function getCookie(name) {
	var cookie = " " + document.cookie;
	var search = " " + name + "=";
	var setStr = null;
	var offset = 0;
	var end = 0;
	if (cookie.length > 0) {
		offset = cookie.indexOf(search);
		if (offset != -1) {
			offset += search.length;
			end = cookie.indexOf(";", offset)
			if (end == -1) {
				end = cookie.length;
			}
			setStr = decodeURIComponent(cookie.substring(offset, end));
		}
	}
	
	return setStr;
}

function setCookie(name, value, expires, path, domain, secure){
	document.cookie = name + "=" + encodeURIComponent(value) +
	((expires) 	? "; expires=" 	+ expires : "") +
	((path) 	? "; path=" 	+ path : "") +
	((domain) 	? "; domain=" 	+ domain : "") + 
	((secure) 	? "' secure" : "");
}

function delCookie(name, path, domain){ 
	document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT" +
	((path) 	? "; path=" 	+ path : "") +
	((domain) 	? "; domain=" 	+ domain : "");
}

function delAllCookie(){
	var cookies = document.cookie.split(";");
	for (var i = 0; i < cookies.length; i++) {
		var cookie = cookies[i];
		var eqPos = cookie.indexOf("=");
		var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
		document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;";
		document.cookie = name + '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	}
}

function changeClass(obj_id, cls){
	document.getElementById(obj_id).className = cls;
}

function base64_encode(str) {
	var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var o1, o2, o3, h1, h2, h3, h4, bits, i=0, enc='';

	do {
		o1 = str.charCodeAt(i++);
		o2 = str.charCodeAt(i++);
		o3 = str.charCodeAt(i++);

		bits = o1<<16 | o2<<8 | o3;

		h1 = bits>>18 & 0x3f;
		h2 = bits>>12 & 0x3f;
		h3 = bits>>6 & 0x3f;
		h4 = bits & 0x3f;

		enc += b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
	} while (i < str.length);

	switch( str.length % 3 ){
		case 1:
			enc = enc.slice(0, -2) + '==';
		break;
		case 2:
			enc = enc.slice(0, -1) + '=';
		break;
	}

	return enc;
}

//====================================

var send = false;
function getData(loader=true, hideAfter=true, method, args=[]){
	
	return new Promise(function(resolve, reject) {
			
		if(send) return;
	
		$.ajax({
			crossDomain: true,
			url: 'https://1c.ooo-kem.ru:8443/kem-zup/hs/rc',
			type: 'POST',
			dataType: 'json',
			cache: false,
			headers: {'sid': String(SID).replace(/(undefined|null|')/i, ''),
						'Authorization': 'Basic d2ViOkFTRHFhejEyMw==',
						'Cache-Control': 'no-cache'},
			data: JSON.stringify({method: method, args:args}),
			beforeSend: function(){
				send = true;

				if(loader) $('#loader').show();	
			},
			success: function(res){			
				resolve(res);
				
				send = false;
				
				if(loader && hideAfter) $('#loader').hide();
			},
			error: function(xhr){			
				let res 		= {};
				res['valid'] 	= false;
				res['result'] 	= null;
				res['error'] 	= true;
				res['des'] 		= "Ошибка соединения с сервером.";

				resolve(res);
			},
			complete: function(data) {
				send = false;
				
				if(loader && hideAfter) $('#loader').hide();
			}
		});
	
	});
}

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

function throttle(func, limit) {
  let lastFunc;
  let lastRan;

  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

function debounce(func, delay) {
  let debounceTimer;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}
