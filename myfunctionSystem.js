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
		  ws.send('{"menuID":"getSystemPage"}');
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
	// console.log(message)
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
		const myArray = obj.ntpServer.split(" ");
		document.getElementById("ntpserver1").value = myArray[0];
		document.getElementById("ntpserver2").value = myArray[1];
		document.getElementById("ntpserver3").value = myArray[2];
		document.getElementById("ntpserver4").value = myArray[3];
		document.getElementById("LocationList").value = obj.location;
		datetimeMethod();
	}
	 else if(obj.menuID == "update")
	 {
		 var updateStatus = obj.updateStatus;
		 if (updateStatus == 2){
			 alert("System updated, Please restart your system.");
		 }
	 }
	else if(obj.menuID == "lnaData")
	 {
//		console.log(message);
		document.getElementById("normalCurrentA").value = obj.normalCurrentA;
		document.getElementById("normalCurrentB").value = obj.normalCurrentB;
		document.getElementById("normalVoltageA").value = obj.normalVoltageA;
		document.getElementById("normalVoltageB").value = obj.normalVoltageB;
		document.getElementById("criticalCurrent").value = obj.criticalCurrent;
		document.getElementById("criticalVoltage").value = obj.criticalVoltage;
		if (obj.lna_a_failed == 1) {
			alert("LNA-A Failed!")
		}
		if (obj.lna_b_failed == 1) {
			alert("LNA-B Failed!")
		}
	 }
}
function updateLNA(){
	var currentA = document.getElementById("normalCurrentA").value;
	var currentB = 	document.getElementById("normalCurrentB").value;
	var voltA = 	document.getElementById("normalVoltageA").value;
	var voltB = 	document.getElementById("normalVoltageB").value;
	var criticalcurrent = 	document.getElementById("criticalCurrent").value;
	var criticalvoltage = 	document.getElementById("criticalVoltage").value;
	var jsonMessage = '{"menuID":"updateLNAData", "currentA":' + currentA +', "currentB":' + currentB +', "voltA":' + voltA +', "voltB":' + voltB +', "criticalcurrent":' + criticalcurrent +', "criticalvoltage":' + criticalvoltage +'}';
	if (ws.readyState == 1){
		ws.send(jsonMessage);
		alert("Setting up LNA..."); 
	}else{
		alert("Connection is closed...");
	}
}
function updateNTPServer(){
	var ntpServer1 = document.getElementById("ntpserver1").value;
	var ntpServer2 = document.getElementById("ntpserver2").value;
	var ntpServer3 = document.getElementById("ntpserver3").value;
	var ntpServer4 = document.getElementById("ntpserver4").value;
	// var jsonMessage = '{"menuID":"updateNTPServer", "ntpServer":"' + ntpServer1 +' ' + ntpServer2 +' ' + ntpServer3 +' ' + ntpServer4 +'"}';
	const ntpServer = [ntpServer1, ntpServer2, ntpServer3, ntpServer4]
	.map(s => (s ?? '').trim())                 // กัน undefined/null และ trim
	.filter(s => s && s.toLowerCase() !== 'undefined') // ตัดค่าว่างและคำว่า "undefined"
	.join(' ');                                 // คั่นด้วย space เฉพาะที่เหลือ

	const jsonMessage = JSON.stringify({
	menuID: "updateNTPServer",
	ntpServer, // ถ้าว่างหมด -> ""
	});
	if (ws.readyState == 1){
		ws.send(jsonMessage);
		alert("Setting up NTP..."); 
	}else{
		alert("Connection is closed...");
	}
}
function setLocation(){
	var location = document.getElementById("LocationList").value;
	var jsonMessage = '{"menuID":"setLocation", "location":"' + location +'"}';
	if (ws.readyState == 1){
		ws.send(jsonMessage);
		alert("Setting up Time Location..."); 
	}else{
		alert("Connection is closed...");
	}
}
function updateTime(){
	var startdate = document.getElementById("startdate").value;
	var jsonMessage = '{"menuID":"updateTime", "dateTime":"' + startdate +'"}';
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
	var jsonMessage = '{"menuID":"updateFirmware"}';
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
