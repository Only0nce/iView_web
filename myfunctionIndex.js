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
function updateTRxConfig(trxid){
//		 ws.send('{"command":"input", "name":"S4_1", "inputgain":1, "outputgain":10}');
 var trxID = trxid;
 var CallName;
 var Address;
 var sipPort;
 var trxMode;
 var active;
 var strTRxMode;
 var variableActive;

 if(trxID == 1){
	 CallName = document.getElementById("node1Name").value;
	 Address = document.getElementById("node1Address").value;
	 sipPort = document.getElementById("node1SipPort").value;
	 trxMode = document.getElementById("node1type").value;
	 active = document.getElementById("node1Active").value;
 }else if(trxID == 2){
	 CallName = document.getElementById("node2Name").value;
	 Address = document.getElementById("node2Address").value;
	 sipPort = document.getElementById("node2SipPort").value;
	 trxMode = document.getElementById("node2type").value;
	 active = document.getElementById("node2Active").value;
 }
 if (trxMode == 0){
	 strTRxMode = "TRx";
 }
 else if (trxMode == 1){
	 strTRxMode = "Tx";
 } 
 else if (trxMode == 2){
	 strTRxMode = "Rxonly";
 }
 if (active == 0){
	 variableActive = "false";
 }else{
	 variableActive = "true";
 }

 var jsonMessage = '{"command":"trxConfig", "trxID":' + trxID + ', "CallName":" ' + CallName + '", "Address":"' + Address + '", "sipPort":"' + sipPort + '", "trxMode":"' + strTRxMode + '", "enable":"' + variableActive + '"}';
//		 console.debug(jsonMessage);
	if (ws.readyState == 1){
		ws.send(jsonMessage)
		alert("Node" + trxid +": Update......"); 
	}
	else
	{
		alert("Connection is closed...");
	}

}

function reconnect(trxid){
	var jsonMessage = '{"command":"trxReconnect", "trxID":' + trxid + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
		alert("Node" + trxid +": Reconnecting......"); 
	}else{
		alert("Connection is closed...");
	}

}
function updateHostCfg(){
	var hostname = document.getElementById("localname").value;
	var keepAlivePeroid = document.getElementById("keepaliveperoid").value;
	var sipPort = document.getElementById("hostSipPort").value;
	var jsonMessage = '{"command":"updateHostCfg", "name":\"' + hostname + '\", "keepAlivePeroid":' + keepAlivePeroid + ', "sipPort":' + sipPort + '}';
	console.debug(jsonMessage);
	if (ws.readyState == 1){
		ws.send(jsonMessage)
		alert("Updating complete......"); 
	}else{
		alert("Connection is closed...");
	}
}

function updateswitchInviteMode(){
var inviteModeIndex = document.getElementById("modeIndex").value;
var jsonMessage = '{"command":"updateswitchInviteMode", "inviteModeIndex":' + inviteModeIndex + '}';
ws.send(jsonMessage);
}

function updateInputgain(){
var inputGainIndex = 31-document.getElementById("inputgain").value;
var jsonMessage = '{"command":"updateInputgain", "inputGainIndex":' + inputGainIndex + '}';
ws.send(jsonMessage);
}

function updateOutputgain(){
var outputGainIndex = document.getElementById("outputgain").value;
var jsonMessage = '{"command":"updateOutputgain", "outputGainIndex":' + outputGainIndex + '}';
ws.send(jsonMessage);
}

function updatePortInterface(){
var portInterfaceIndex = document.getElementById("portInterface").value;
var jsonMessage = '{"command":"updatePortInterface", "portInterface":' + portInterfaceIndex + '}';
ws.send(jsonMessage);
}

function updatetxScheduler(){
var pttSchedulerID = document.getElementById("pttScheduler").value;
var jsonMessage = '{"command":"updatetxScheduler", "pttScheduler":' + pttSchedulerID + '}';
ws.send(jsonMessage);
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
	 document.getElementById("pttScheduler").value = obj.pttScheduler;
 }
 else if(obj.menuID == "nodeCfg")
 {
	 if (obj.nodeID == 1){
		 document.getElementById("node1type").value = obj.nodeType;
		 document.getElementById("node1Name").value = obj.nodeName;
		 document.getElementById("node1Address").value = obj.ipAddress;
		 document.getElementById("node1SipPort").value = obj.sipPort;
		 document.getElementById("node1Active").value = obj.active;
		 document.getElementById("node1Freq").value = obj.frequency;
		 document.getElementById("node1Sql").value = obj.sqlLevel;
	 }else if(obj.nodeID == 2){
		 document.getElementById("node2type").value = obj.nodeType;
		 document.getElementById("node2Name").value = obj.nodeName;
		 document.getElementById("node2Address").value = obj.ipAddress;
		 document.getElementById("node2SipPort").value = obj.sipPort;
		 document.getElementById("node2Active").value = obj.active;
		 document.getElementById("node2Freq").value = obj.frequency;
		 document.getElementById("node2Sql").value = obj.sqlLevel;
	 }
 }
 else if(obj.menuID == "updatefrequency")
 {
//	 console.debug(message);
	 if (obj.nodeID == 1){
		 document.getElementById("node1Freq").value = obj.frequency;
		 document.getElementById("node1Sql").value = obj.sqlLevel;
	 }else if(obj.nodeID == 2){
		 document.getElementById("node2Freq").value = obj.frequency;
		 document.getElementById("node2Sql").value = obj.sqlLevel;
	 }
 }
 else if(obj.menuID == "connState")
 {
	 if (obj.nodeID == 1){
		 document.getElementById("node1Conn").value = obj.connStatus;
		 document.getElementById("node1Duration").value = obj.connDuration;
		 document.getElementById("node1TRx").value = obj.trxStatus;
		 document.getElementById("node1RadioStatus").value = obj.radioStatus;
		 document.getElementById("node1vswr").value = obj.vswr;
		 
	 }else if(obj.nodeID == 2){
		 document.getElementById("node2Conn").value = obj.connStatus;
		 document.getElementById("node2Duration").value = obj.connDuration;
		 document.getElementById("node2TRx").value = obj.trxStatus;
		 document.getElementById("node2RadioStatus").value = obj.radioStatus;
		 document.getElementById("node2vswr").value = obj.vswr;
		 
	 }
 }
  else if(obj.menuID == "broadcastLocalTime")
 {
		 document.getElementById("currentTime").value = obj.currentTime;
		 document.getElementById("currentDate").value = obj.currentDate;
 }

}