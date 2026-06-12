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
function updateControler(ctrlID)
{
	console.log("Update ctrlID:",ctrlID,document.getElementById("ctrlURI"+ctrlID).value); 
	if (document.getElementById("ctrlURI"+ctrlID).value == "") return;
	
	var jsonMessage = '{"menuID":"updateControler",'
					+'"sipUser":"' + document.getElementById("ctrlURI"+ctrlID).value + '",'
					+'"keepAlivePeroid":' + document.getElementById("keepAlivePeroid"+ctrlID).value + ','
					+'"sipPort":' + document.getElementById("sipPort"+ctrlID).value + ','
					+'"rtpStartPort":' + document.getElementById("rtpStartPort"+ctrlID).value + ','
					+'"softPhoneID":' + ctrlID + ''
					+'}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)		
	}
	else
	{
		alert("Connection is closed...");
	}
}
function newRadio()
{
	console.log("Update RadioID:",document.getElementById("radioName").value, document.getElementById("radioUri").value,document.getElementById("radioIP").value,document.getElementById("sipPort").value);
	var trxMode = "";
	if (document.getElementById("nodetype").value == 1) trxMode = "TRx";
	else if (document.getElementById("nodetype").value == 2) trxMode = "Tx";
	else if (document.getElementById("nodetype").value == 3) trxMode = "Rx";
	else
	{
		location.reload();
		return;
	}
	if (document.getElementById("radioName").value == "") return;
	if (document.getElementById("radioUri").value == "") return;
	if (document.getElementById("sipPort").value == "") return;
	
	var jsonMessage = '{"menuID":"newRadio",'
					+'"radioName":"' + document.getElementById("radioName").value + '",'
					+'"trxMode":"' + trxMode + '",'
					+'"uri":"' + document.getElementById("radioUri").value + '",'
					+'"ipAddress":"' + document.getElementById("radioIP").value + '",'
					+'"r2sPeroid":' + '200' + ','
					+'"sipPort":' + document.getElementById("sipPort").value + ','
					+'"frequency":"' + '0' + '"'
					+'}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
		location.reload();
	}else{
		alert("Connection is closed...");
	}
}
function removeRadio(radioID)
{
	console.log("Remove RadioID:",radioID,document.getElementById("radioName"+radioID).value, document.getElementById("radioUri"+radioID).value,document.getElementById("radioIP"+radioID).value,document.getElementById("sipPort"+radioID).value);
	var jsonMessage = '{"menuID":"removeRadio",'
					+'"radioID":' + radioID + ''
					+'}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
		location.reload();
	}else{
		alert("Connection is closed...");
	}
}
function toggleGPIOOut( gpioNum,  gpioVal){
	if(gpioNum == 1){
		alert("GPIO Define as PTT Out");
		return;
	}
	var jsonMessage = '{"command":"toggleGpioOut", "gpioNum":' + gpioNum + ', "gpioVal":' + gpioVal + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}

function processMsg(message){
 var obj = JSON.parse(message);
 
 if (obj.menuID == "AudioInfo")
 {
	 
//	 document.getElementById("inputLevel").style = "width:" + obj.audioInLevel*100.0 + "%";
	 document.getElementById("outputLevel").style = "width:" + obj.audioOutLevel*100.0 + "%";
 }
 else if (obj.menuID == "GpioInStatus")
 {
	 if (obj.gpio1Val == 1){
		 document.getElementById("GPIO1Off").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("GPIO1On").style = "float: right; height: 30px; width: 22px;"
	 }
	 else
	 {
		 document.getElementById("GPIO1Off").style = "float: right; height: 30px; width: 22px;"
		 document.getElementById("GPIO1On").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
	 
	 if (obj.gpio2Val == 1){
		 document.getElementById("GPIO2Off").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("GPIO2On").style = "float: right; height: 30px; width: 30px;"
	 }
	 else
	 {
		 document.getElementById("GPIO2Off").style = "float: right; height: 30px; width: 30px;"
		 document.getElementById("GPIO2On").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
	 
	 if (obj.gpio3Val == 1){
		 document.getElementById("GPIO3Off").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("GPIO3On").style = "float: right; height: 30px; width: 30px;"
	 }
	 else
	 {
		 document.getElementById("GPIO3Off").style = "float: right; height: 30px; width: 30px;"
		 document.getElementById("GPIO3On").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
	 
	 if (obj.gpio4Val == 1){
		 document.getElementById("GPIO4Off").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("GPIO4On").style = "float: right; height: 30px; width: 30px;"
	 }
	 else
	 {
		 document.getElementById("GPIO4Off").style = "float: right; height: 30px; width: 30px;"
		 document.getElementById("GPIO4On").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
	 
	 
	 if (obj.gpio1OutVal == 1){
		 document.getElementById("gpioOut1Off").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("gpioOut1On").style = "float: right; height: 30px; width: 22px;"
	 }
	 else
	 {
		 document.getElementById("gpioOut1Off").style = "float: right; height: 30px; width: 22px;"
		 document.getElementById("gpioOut1On").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
	 
	 if (obj.gpio2OutVal == 1){
		 document.getElementById("gpioOut2Off").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("gpioOut2On").style = "float: right; height: 30px; width: 30px;"
	 }
	 else
	 {
		 document.getElementById("gpioOut2Off").style = "float: right; height: 30px; width: 30px;"
		 document.getElementById("gpioOut2On").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
	 
	 if (obj.gpio3OutVal == 1){
		 document.getElementById("gpioOut3Off").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("gpioOut3On").style = "float: right; height: 30px; width: 30px;"
	 }
	 else
	 {
		 document.getElementById("gpioOut3Off").style = "float: right; height: 30px; width: 30px;"
		 document.getElementById("gpioOut3On").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
	 
	 if (obj.gpio4OutVal == 1){
		 document.getElementById("gpioOut4Off").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("gpioOut4On").style = "float: right; height: 30px; width: 30px;"
	 }
	 else
	 {
		 document.getElementById("gpioOut4Off").style = "float: right; height: 30px; width: 30px;"
		 document.getElementById("gpioOut4On").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
	 
 }
 else if (obj.menuID == "connStatus")
 {
	 
	 
 }
 else if (obj.menuID == "updateControler")
 {
	 
	 location.reload();
 }
 else{
//	 console.debug(message);
 }

}