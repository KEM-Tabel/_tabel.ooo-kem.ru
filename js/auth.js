

// CREATE ===========================

// ACTION ===========================

async function Login(){
	
	$('#desc').html("");
			
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
	
	$("#loader").show();
	
	var pass = $("#pass_in").val();
	var data = await getData(true, false, "Авторизация", [pass, userData]);

	if(data){
		
		if(!data.error && data.valid){
			SID 	= data.result.SID;
			UID   	= data.result.UID;
			LABEL 	= data.result.label;
			
			setCookie("SID", SID, "/", null, null);
			setCookie("UID", UID, "/", null, null);
			setCookie("LABEL", LABEL, "/", null, null);
			
			document.location.href="/report.htm";
		}else{
			 $('#loader').hide();
			 
			$('#desc-auth').html(data.des);
			$('#desc-auth').show();
		}
			
	}else{
		$('#loader').hide();
		 
		$('#desc-auth').html("Ошибка сервера.");
		$('#desc-auth').show();		
	}
	
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