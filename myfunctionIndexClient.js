// JavaScript Document
var wsUri;
var ws;
WebSocketTest();
function WebSocketTest() {

	if ("WebSocket" in window) {
	   // Let us open a web socket
	   wsUri = "ws://" + location.host + ":1234";
	   ws = new WebSocket(wsUri);

	   ws.onopen = function() {
		  // Web Socket is connected, send data using send()
		  ws.send("web:home");
	   };

	   ws.onmessage = function (evt) { 
		  var received_msg = evt.data;
		  processMsg(received_msg);
	   };

	   ws.onclose = function() { 
		  // websocket is closed.
		  
		  alert("Connection is closed..."); 
		  
	   };
	} else {

	   // The browser doesn't support WebSocket
	   alert("WebSocket NOT supported by your Browser!");
	}
}
function updateHostCfg(){
	var hostname = document.getElementById("localname").value;
	var keepAlivePeroid = document.getElementById("keepaliveperoid").value;
	var sipPort = document.getElementById("hostSipPort").value;
	var jsonMessage = '{"command":"updateHostCfg", "name":\"' + hostname + '\", "keepAlivePeroid":' + keepAlivePeroid + ', "sipPort":' + sipPort + '}';
	console.debug(jsonMessage);
	if (ws.readyState == 1){
		var r = confirm("please confirm to update!");
		if (r == true) {
		  ws.send(jsonMessage);
		}else{
			location.reload();
		}
	}else{ๅ
		alert("Connection is closed...");
	}
}
function disconnect(){
	var uriConnList = document.getElementById("uriConnList").value;
	var jsonMessage = '{"command":"disconnect", "uri":"' + uriConnList + '"}';
	if(uriConnList != "Select node URI"){
		if (ws.readyState == 1){
			var r = confirm("Disconnect to " + uriConnList);
			if (r == true) {
			  ws.send(jsonMessage);
			} else {
			  
			}
		}else{
			alert("Connection is closed...");
		}
	}
	else{
		alert("Please select node URI..."); 
	}
}
function updateswitchInviteMode(){
var inviteModeIndex = document.getElementById("modeIndex");
var inviteMode = inviteModeIndex.getElementsByTagName("option");
var jsonMessage = '{"command":"updateswitchInviteMode", "inviteModeIndex":' + inviteModeIndex.value + '}';
	if (inviteModeIndex.value > 0){
		if (ws.readyState == 1){
			var r = confirm("Hardware mode select \"" + inviteMode[inviteModeIndex.value].text + "\"");
			if (r == true) {
			  	ws.send(jsonMessage);
				location.reload();
			}else{
				location.reload();
			}
		}else{
			alert("Connection is closed...");
		}
	}
	else{
		alert("Please select HW mode");
	}
}

function updateInputgain(){
var inputGainIndex = 31-document.getElementById("inputgain").value;
var jsonMessage = '{"command":"updateInputgain", "inputGainIndex":' + inputGainIndex + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}

function updateOutputgain(){
var outputGainIndex = document.getElementById("outputgain").value;
var jsonMessage = '{"command":"updateOutputgain", "outputGainIndex":' + outputGainIndex + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}

function updatePortInterface(){
var portInterfaceIndex = document.getElementById("portInterface").value;
var jsonMessage = '{"command":"updatePortInterface", "portInterface":' + portInterfaceIndex + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}

function updatetxScheduler(){
var pttSchedulerID = document.getElementById("pttScheduler").value;
var jsonMessage = '{"command":"updatetxScheduler", "pttScheduler":' + pttSchedulerID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}
function updateURILits(){
	var numconn = document.getElementById("allowConnNum").value ;
	var urlList = document.getElementById("uriList1").value+','+
		document.getElementById("uriList2").value+','+
		document.getElementById("uriList3").value+','+
		document.getElementById("uriList4").value+','+
		document.getElementById("uriList5").value+','+
		document.getElementById("uriList6").value+','+
		document.getElementById("uriList7").value+','+
		document.getElementById("uriList8").value;
	var jsonMessage = '{"command":"updateURILits", "urlList":"' + urlList + '", "numconn":' + numconn + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
		alert("Updating complete......"); 
	}else{
		alert("Connection is closed...");
	}
}
function processMsg(message){
 var obj = JSON.parse(message);
 if (obj.menuID == "input")
 {
	 document.getElementById("localname").value = obj.name;
	 document.getElementById("keepaliveperoid").value = obj.keepAlivePeroid;
	 document.getElementById("hostSipPort").value = obj.sipPort;
	 document.getElementById("inputgain").value = obj.inputgain;
	 document.getElementById("outputgain").value = obj.outputgain;
	 document.getElementById("portInterface").value = obj.portInterface;
	 document.getElementById("modeIndex").value = obj.invitemode;
 }
 else if (obj.menuID == "uriAllowedList")
 {
	 document.getElementById("allowConnNum").value = obj.numConn;
	 document.getElementById("uriList1").value = obj.uri1;
	 document.getElementById("uriList2").value = obj.uri2;
	 document.getElementById("uriList3").value = obj.uri3;
	 document.getElementById("uriList4").value = obj.uri4;
	 document.getElementById("uriList5").value = obj.uri5;
	 document.getElementById("uriList6").value = obj.uri6;
	 document.getElementById("uriList7").value = obj.uri7;
	 document.getElementById("uriList8").value = obj.uri8;
 }
 else if (obj.menuID == "connStatus")
 {
	 document.getElementById("connNum").value = obj.connNum;
	 document.getElementById("TxRx").value = obj.TxRx;
	 document.getElementById("pttURI").value = obj.pttURI;
 }
else if (obj.menuID == "uriConnList")
 {
	//Create array of options to be added
	var array = obj.listURI.split(',');

	//Create and append select list
	var selectList = document.getElementById("uriConnList");
	var options = selectList.getElementsByTagName('option');
	while (selectList.childElementCount > 0){
		for (var i = 0; i < selectList.childElementCount; i++) {
			selectList.removeChild(options[i]);
		}
	}	
	var option1 = document.createElement("option");
	option1.value = "Select node URI";
	option1.text  = "Select node URI";
	selectList.appendChild(option1);
	for (var i = 0; i < array.length; i++) {
		var option = document.createElement("option");
		option.value = array[i];
		option.text = array[i];
		if (array[i] != "")
			selectList.appendChild(option);
	}
	
	
	document.getElementById("connDuration").value = '';
 }
  else if(obj.menuID == "ConnDuration")
 {
	 var connUri = obj.uri;
	 if (connUri == document.getElementById("uriConnList").value)		
		 document.getElementById("connDuration").value = obj.duration;
 }
  else if(obj.menuID == "broadcastLocalTime")
 {
		 document.getElementById("currentTime").value = obj.currentTime;
		 document.getElementById("currentDate").value = obj.currentDate;
 }
 else{
	 console.debug(message);
 }

}