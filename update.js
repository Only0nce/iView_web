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
		  ws.send("web:system");
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
function processMsg(message){
	var obj = JSON.parse(message);
	if(obj.menuID == "broadcastLocalTime")
	{
		document.getElementById("currentTime").value = obj.currentTime;
		document.getElementById("currentDate").value = obj.currentDate;
	}
	else if(obj.menuID == "system")
	{
		document.getElementById("swversion").value = obj.SwVersion;
		document.getElementById("hwversion").value = obj.HwVersion;
		document.getElementById("dateTimeMethod").value = obj.dateTimeMethod;
		document.getElementById("ntpserver").value = obj.ntpServer;
		document.getElementById("LocationList").value = obj.location;
		datetimeMethod();
	}
	else  if (obj.menuID == "input")
	{
		document.title = obj.deviceName;
		document.getElementById("headName").innerHTML = obj.deviceName;
	}
}

function updateNTPServer(){
	var ntpServer = document.getElementById("ntpserver").value;
	var jsonMessage = '{"command":"updateNTPServer", "ntpServer":"' + ntpServer +'"}';
	if (ws.readyState == 1){
		ws.send(jsonMessage);
		alert("Setting up NTP..."); 
	}else{
		alert("Connection is closed...");
	}
}
function setLocation(){
	var location = document.getElementById("LocationList").value;
	var jsonMessage = '{"command":"setLocation", "location":"' + location +'"}';
	if (ws.readyState == 1){
		ws.send(jsonMessage);
		alert("Setting up Time Location..."); 
	}else{
		alert("Connection is closed...");
	}
}
function updateTime(){
	var startdate = document.getElementById("startdate").value;
	var jsonMessage = '{"command":"updateTime", "dateTime":"' + startdate +'"}';
	if (ws.readyState == 1){
		ws.send(jsonMessage);
		alert("Setting up NTP..."); 
	}else{
		alert("Connection is closed...");
	}
}
function datetimeMethod(){
	var dateTimeMethod = document.getElementById("dateTimeMethod").value;
//	console.debug(node1Type);
	if (dateTimeMethod == 0){
		document.getElementById("divManual").style.display = "none";
		document.getElementById("divNTP").style.display = "none";
	}else if (dateTimeMethod == 2){
		document.getElementById("divManual").style.display = "contents";
		document.getElementById("divNTP").style.display = "none";
	}else if (dateTimeMethod == 1){
		document.getElementById("divManual").style.display = "none";
		document.getElementById("divNTP").style.display = "contents";
	}
}

function systemupdate(){
	var jsonMessage = '{"command":"updateFirmware"}';
	if (ws.readyState == 1){
		var r = confirm("please confirm to update!");
		if (r == true) {
			ws.send(jsonMessage);
			alert("System update don't turn off your device"); 
		}else{
			
		}
	}
	else
	{
		alert("Connection is closed...");
	}
}
