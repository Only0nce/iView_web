// JavaScript Document
var wsUri;
var ws;
var inputMin_volt;
var inputMax_volt;
var outputMin_volt;
var outputMax_volt;

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
function updateInputMin(){
	var jsonMessage = '{"command":"rfCalGetVal", "getVal":"inputMin"}';
	console.debug(jsonMessage);
	if (ws.readyState == 1){
		ws.send(jsonMessage);
	}else{
		alert("ERROR! Connection is closed...");
	}
}
function updateInputMax(){
	var jsonMessage = '{"command":"rfCalGetVal", "getVal":"inputMax"}';
	console.debug(jsonMessage);
	if (ws.readyState == 1){
		ws.send(jsonMessage);
	}else{
		alert("ERROR! Connection is closed...");
	}
}
function updateOutputMin(){
	var jsonMessage = '{"command":"rfCalGetVal", "getVal":"outputMin"}';
	console.debug(jsonMessage);
	if (ws.readyState == 1){
		ws.send(jsonMessage);
	}else{
		alert("ERROR! Connection is closed...");
	}
}
function updateOutputMax(){
	var jsonMessage = '{"command":"rfCalGetVal", "getVal":"outputMax"}';
	console.debug(jsonMessage);
	if (ws.readyState == 1){
		ws.send(jsonMessage);
	}else{
		alert("ERROR! Connection is closed...");
	}
}
function updateRFCal(){
	var inputMin_dB = document.getElementById("inputMinCal").value;
	var inputMax_dB = document.getElementById("inputMaxCal").value;
	var outputMin_dB = document.getElementById("outputMinCal").value;
	var outputMax_dB = document.getElementById("outputMaxCal").value;
	var jsonMessage = '{"command":"rfCalSetVal", "inputMin_dB":'+ (inputMin_dB*1.0).toFixed(1) +', "outputMin_dB":'+ (outputMin_dB*1.0).toFixed(1) +', "inputMin_volt":'+ (inputMin_volt*1.0).toFixed(4) +', "outputMin_volt":'+ (outputMin_volt*1.0).toFixed(4) +', "inputMax_dB":'+ (inputMax_dB*1.0).toFixed(1) +', "outputMax_dB":'+ (outputMax_dB*1.0).toFixed(1) +', "inputMax_volt":'+ (inputMax_volt*1.0).toFixed(4) +', "outputMax_volt":'+ (outputMax_volt*1.0).toFixed(4) +'}';
	console.debug(jsonMessage);
	if (ws.readyState == 1){
		ws.send(jsonMessage);
	}else{
		alert("ERROR! Connection is closed...");
	}
}
function processMsg(message){
	var obj = JSON.parse(message);
	if(obj.menuID == "updateCalVal")
	 {
		if (obj.calVal == "inputMin") {
			inputMin_volt = obj.val;
			document.getElementById("inputMinLabel").innerHTML = "Input Level Min (Voltage Level =" + (inputMin_volt*1.0).toFixed(4) + " Volt)"
		}
		else if (obj.calVal == "inputMax") {
			inputMax_volt = obj.val;
			document.getElementById("inputMaxLabel").innerHTML = "Input Level Max (Voltage Level =" + (inputMax_volt*1.0).toFixed(4) + " Volt)"
		}
		else if (obj.calVal == "outputMin") {
			outputMin_volt = obj.val;
			document.getElementById("outputMinLabel").innerHTML = "Output Level Min (Voltage Level =" + (outputMin_volt*1.0).toFixed(4) + " Volt)"
		}
		else if (obj.calVal == "outputMax") {
			outputMax_volt = obj.val;
			document.getElementById("outputMaxLabel").innerHTML = "Output Level Max (Voltage Level =" + (outputMax_volt*1.0).toFixed(4) + " Volt)"
		}
		
	 }
	else if(obj.menuID == "lnaData")
	 {
		if (obj.lna_a_failed == 1) {
			alert("LNA-A Failed!")
		}
		if (obj.lna_b_failed == 1) {
			alert("LNA-B Failed!")
		}
	 }
}

