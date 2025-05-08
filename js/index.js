

// CREATE ===========================

// ACTION ===========================

function toPage(chapter=""){
	
	switch(chapter){
		default:
			break;
		case "notwork":
			document.location.href = "/notwork.htm";
			break;
		case "report":
			document.location.href = "/report.htm";		
			break;
		case "staffs":
			document.location.href = "/staffs.htm";		
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

// EVENTS ===========================
