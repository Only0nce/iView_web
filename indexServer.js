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
 var channelName
 var CallNameRx;
 var AddressRx;
 var sipPortRx;
 var trxMode;
 var active;
 var strTRxMode;
 var variableActive;
 var alwaysConnect;
 var variableAlwaysConnect;
 var failed = 0;
 if(trxID == 1){
	 var nodeType = document.getElementById("node1type").value;
	 channelName = document.getElementById("node1IDName").value;	 
	 active = document.getElementById("node1Active").value;
	 trxMode = document.getElementById("node1type").value;
	 alwaysConnect = document.getElementById("node1AlwaysConnect").value;
	 if (nodeType != 3){
		 CallName = document.getElementById("node1Name").value;
		 Address = document.getElementById("node1Address").value;
		 sipPort = document.getElementById("node1SipPort").value;
	 }else{
		 CallName = document.getElementById("node1NameTx").value;
		 Address = document.getElementById("node1AddressTx").value;
		 sipPort = document.getElementById("node1SipPortTx").value;
		 CallNameRx = document.getElementById("node1NameRx").value;
		 AddressRx = document.getElementById("node1AddressRx").value;
		 sipPortRx = document.getElementById("node1SipPortRx").value;
	 }
	 
 }else if(trxID == 2){
	 var nodeType = document.getElementById("node2type").value;
	 channelName = document.getElementById("node2IDName").value;	 
	 active = document.getElementById("node2Active").value;
	 trxMode = document.getElementById("node2type").value;
	 alwaysConnect = document.getElementById("node2AlwaysConnect").value;
	 if (nodeType != 3){
		 CallName = document.getElementById("node2Name").value;
		 Address = document.getElementById("node2Address").value;
		 sipPort = document.getElementById("node2SipPort").value;
	 }else{
		 CallName = document.getElementById("node2NameTx").value;
		 Address = document.getElementById("node2AddressTx").value;
		 sipPort = document.getElementById("node2SipPortTx").value;
		 CallNameRx = document.getElementById("node2NameRx").value;
		 AddressRx = document.getElementById("node2AddressRx").value;
		 sipPortRx = document.getElementById("node2SipPortRx").value;
	 }
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
 else if (trxMode == 3){
	 strTRxMode = "Separate";
 }
 if (active == 0){
	 variableActive = "false";
 }else{
	 variableActive = "true";
 }

 if (alwaysConnect == 0){
	 variableAlwaysConnect = "false";
 }else{
	 variableAlwaysConnect = "true";
 }

 var jsonMessage = '{"command":"trxConfig", "trxID":' + trxID + ', "CallName":"' + CallName + '", "Address":"' + Address + '", "sipPort":"' + sipPort + '", "trxMode":"' + strTRxMode + '", "enable":"' + variableActive + '", "CallNameRx":"' + CallNameRx + '", "AddressRx":"' + AddressRx + '", "sipPortRx":"' + sipPortRx + '", "channelName":"' + channelName + '", "AlwaysConnect":"' + variableAlwaysConnect + '"}';
//		 console.debug(jsonMessage);
	if (trxMode != 3){
		if (CallName == ""){
			alert("URI is empty");
			failed = 1;
		}
		if (Address == ""){
			alert("IP Address is empty");
			failed = 1;
		}
		if ((sipPort == "")||(sipPort == 0)){
			alert("SIP Port is empty");
			failed = 1;
		}
	}else{
		if (CallName == ""){
			alert("Tx URI is empty");
			failed = 1;
		}
		if (Address == ""){
			alert("Tx IP Address is empty");
			failed = 1;
		}
		if ((sipPort == "")||(sipPort == 0)){
			alert("Tx SIP Port is empty");
			failed = 1;
		}
		
		if (CallNameRx == ""){
			alert("Rx URI is empty");
			failed = 1;
		}
		if (AddressRx == ""){
			alert("Rx IP Address is empty");
			failed = 1;
		}
		if ((sipPortRx == "")||(sipPortRx == 0)){
			alert("Rx SIP Port is empty");
			failed = 1;
		}
		
	}
	if (failed == 0){
		if (ws.readyState == 1){
			var r = confirm("please confirm to update node: " + channelName);
			if (r == true) {
			  ws.send(jsonMessage);
			}else{
				location.reload();
			}
		}else{
			alert("Connection is closed...");
		}
	}

}

function reconnect(trxid){
	var jsonMessage = '{"command":"trxReconnect", "trxID":' + trxid + '}';
	if (ws.readyState == 1){
		var r = confirm("please confirm to reconnect node: " + trxid);
		if (r == true) {
		  ws.send(jsonMessage);
		}else{
			location.reload();
		}
	}else{ๅ
		alert("Connection is closed...");
	}

}
function updateSqlInputActiveHigh(){
	var sqlInputActiveHigh = document.getElementById("sqlInputActiveHigh").checked ;
	var jsonMessage = '{"command":"updateSQLActiveHigh", "sqlActive":"' + sqlInputActiveHigh + '"}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}
function updateHostCfg(){
	var hostname = document.getElementById("localname").value;
	var keepAlivePeroid = document.getElementById("keepaliveperoid").value;
	var sipPort = document.getElementById("hostSipPort").value;
	var defaultEthernet = ""
	if (document.getElementById("defaultEthernet").value == 0)
		defaultEthernet = "eth0"
	else
		defaultEthernet = "eth1"
	var jsonMessage = '{"command":"updateHostCfg", "name":\"' + hostname + '\", "keepAlivePeroid":' + keepAlivePeroid + ', "sipPort":' + sipPort + ', "defaultEthernet":"' + defaultEthernet + '"}';
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
			} 
			else{
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
function updateTestmode()
{
	var testModeIndex = document.getElementById("testModeEnable").value;
	var jsonMessage = '{"command":"updateTestmode", "testModeEnable":' + testModeIndex + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}
function setnode1Type(){
	var node1Type = document.getElementById("node1type").value;
//	console.debug(node1Type);
	if (node1Type != 3){
		document.getElementById("node1Normal").style.display = "contents";
		document.getElementById("divSeparateNode1").style.display = "none";
	}else{
		document.getElementById("node1Normal").style.display = "none";
		document.getElementById("divSeparateNode1").style.display = "contents";
	}
}
function setnode2Type(){
	var nodeType = document.getElementById("node2type").value;
//	console.debug(node1Type);
	if (nodeType != 3){
		document.getElementById("node2Normal").style.display = "contents";
		document.getElementById("divSeparateNode2").style.display = "none";
	}else{
		document.getElementById("node2Normal").style.display = "none";
		document.getElementById("divSeparateNode2").style.display = "contents";
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
function updateSiteTone(){
	var sitetone = document.getElementById("siteTone").value;
var jsonMessage = '{"command":"updateSiteTone", "siteToneIndex":' + sitetone + '}';
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
function updateCATISCfg()
{
	var enableRecordingEnable = "false";
	var backupAudioMin = document.getElementById("backupAudioMin").value;
	var warningPTTMinute = document.getElementById("warningPTTMinute").value;
	var warningAudioLevelTime = document.getElementById("warningAudioLevelTime").value;
	var warningPercentFault = document.getElementById("warningPercentFault").value;
	var enableRecording = document.getElementById("enableRecording").value;
	if (enableRecording == 0){
		enableRecordingEnable = "false";
	}else{
		enableRecordingEnable = "true";
	}
	if ((backupAudioMin > 0) & (warningPTTMinute > 0) & (warningAudioLevelTime > 0) & (warningPercentFault > 0))
	{
		var jsonMessage = '{"command":"updateCATISCONF", "enableRecording":"' + enableRecordingEnable + '", "backupAudioMin":' + backupAudioMin + ', "warningPTTMinute":' + warningPTTMinute + ', "warningAudioLevelTime":' + warningAudioLevelTime + ', "warningPercentFault":' + warningPercentFault + '}';
		if (ws.readyState == 1){
			ws.send(jsonMessage)
		}else{
			alert("Connection is closed...");
		}
	}else{
		alert("Please check Value Input out of Range");
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
function update_DeviceName(){
	var deviceName = document.getElementById("deviceName").value;
	var jsonMessage = '{"command":"updateDeviceName", "deviceName":"' + deviceName + '"}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
		document.getElementById("headName").innerHTML = deviceName;
	}else{
		alert("Connection is closed...");
	}
}
function processMsg(message){
	
 var obj = JSON.parse(message);
 if (obj.menuID == "input")
 {
	 // console.log(message)
	 document.title = obj.deviceName;
	 document.getElementById("headName").innerHTML = obj.deviceName;
	 document.getElementById("deviceName").value = obj.deviceName;
	 document.getElementById("localname").value = obj.name;
	 document.getElementById("defaultEthernet").value = obj.defaultEthernet;
	 document.getElementById("keepaliveperoid").value = obj.keepAlivePeroid;
	 document.getElementById("hostSipPort").value = obj.sipPort;
	 document.getElementById("inputgain").value = obj.inputgain;
	 document.getElementById("outputgain").value = obj.outputgain;
	 document.getElementById("portInterface").value = obj.portInterface;
	 document.getElementById("pttScheduler").value = obj.pttScheduler;
	 document.getElementById("modeIndex").value = obj.invitemode;
	 document.getElementById("siteTone").value = obj.siteTone;
//	 document.getElementById("testModeEnable").value = obj.testModeEnable;
//	 if (document.getElementById("modeIndex").value == 1){
//		 document.getElementById("C_ATISBackup").style.display = "contents";
//	 }else{
//		 document.getElementById("C_ATISBackup").style.display = "none";
//	 }
 }
 else if(obj.menuID == "updateCATIS"){
//	 document.getElementById("enableRecording").value = obj.enableRecording;
//	 document.getElementById("backupAudioMin").value = obj.backupAudioMin;
//	 document.getElementById("warningPTTMinute").value = obj.warningPTTMinute;
//	 document.getElementById("warningAudioLevelTime").value = obj.warningAudioLevelTime;
//	 document.getElementById("warningPercentFault").value = obj.warningPercentFault;
 }
 else if(obj.menuID == "testModeEnable")
 {
	 document.getElementById("testModeEnable").value = obj.testModeIndex;
 }
 else if(obj.menuID == "nodeCfg")
 {
 	console.log(message)
	 if (obj.nodeID == 1){
		 document.getElementById("node1type").value = obj.nodeType;
		 document.getElementById("node1Active").value = obj.active;
		 document.getElementById("node1AlwaysConnect").value = obj.AlwaysConnect;
		 document.getElementById("node1IDName").value = obj.channelName;
		 document.getElementById("node1RFPower").value = obj.rfPower;
		 if (obj.nodeType != 3){
			document.getElementById("node1Normal").style.display = "contents";
			document.getElementById("divSeparateNode1").style.display = "none";
			 
			
			document.getElementById("node1Name").value = obj.nodeName;
			document.getElementById("node1Address").value = obj.ipAddress;
			document.getElementById("node1SipPort").value = obj.sipPort;
			document.getElementById("node1Freq").value = obj.frequency/1000000.0 + "MHz";
			document.getElementById("node1Sql").value = obj.sqlLevel;
		}else{
			document.getElementById("node1Normal").style.display = "none";
			document.getElementById("divSeparateNode1").style.display = "contents";
			
			document.getElementById("node1NameTx").value = obj.nodeName;
			document.getElementById("node1AddressTx").value = obj.ipAddress;
			document.getElementById("node1SipPortTx").value = obj.sipPort;
			if (obj.frequency != obj.frequencyRx)
				document.getElementById("node1Freq").value = "Tx:" + obj.frequency/1000000.0 + "MHz Rx:" + obj.frequencyRx/1000000.0 +"MHz";
			else 
				document.getElementById("node1Freq").value = obj.frequency/1000000.0 + "MHz";
			document.getElementById("node1Sql").value = obj.sqlLevelRx;
			document.getElementById("node1NameRx").value = obj.nodeNameRx;
			document.getElementById("node1AddressRx").value = obj.ipAddressRx;
			document.getElementById("node1SipPortRx").value = obj.sipPortRx;
		}
	 }else if(obj.nodeID == 2){
		 document.getElementById("node2type").value = obj.nodeType;
		 document.getElementById("node2Active").value = obj.active;
		 document.getElementById("node2AlwaysConnect").value = obj.AlwaysConnect;
		 document.getElementById("node2IDName").value = obj.channelName;
		 document.getElementById("node2RFPower").value = obj.rfPower;
		 if (obj.nodeType != 3){
			document.getElementById("node2Normal").style.display = "contents";
			document.getElementById("divSeparateNode2").style.display = "none";
			 
			
			document.getElementById("node2Name").value = obj.nodeName;
			document.getElementById("node2Address").value = obj.ipAddress;
			document.getElementById("node2SipPort").value = obj.sipPort;
			document.getElementById("node2Freq").value = obj.frequency/1000000.0 + "MHz";
			document.getElementById("node2Sql").value = obj.sqlLevel;
		}else{
			document.getElementById("node2Normal").style.display = "none";
			document.getElementById("divSeparateNode2").style.display = "contents";
			
			document.getElementById("node2NameTx").value = obj.nodeName;
			document.getElementById("node2AddressTx").value = obj.ipAddress;
			document.getElementById("node2SipPortTx").value = obj.sipPort;
			if (obj.frequency != obj.frequencyRx)
				document.getElementById("node2Freq").value = "Tx:" + obj.frequency/1000000.0 + "MHz Rx:" + obj.frequencyRx/1000000.0 +"MHz";
			else 
				document.getElementById("node2Freq").value = obj.frequency/1000000.0 + "MHz";
			document.getElementById("node2Sql").value = obj.sqlLevelRx;
			document.getElementById("node2NameRx").value = obj.nodeNameRx;
			document.getElementById("node2AddressRx").value = obj.ipAddressRx;
			document.getElementById("node2SipPortRx").value = obj.sipPortRx;
	 }
   }
 }
 else if(obj.menuID == "updatefrequency")
 {
//	 console.debug(message);
	 
	 if (obj.nodeID == 1){
		var nodeType = document.getElementById("node1type").value;
		//	console.debug(node1Type);
		 if (nodeType == 3){
			 if (obj.frequency != obj.frequencyRx)
				document.getElementById("node1Freq").value = "Tx:" + obj.frequency/1000000.0 + "MHz Rx:" + obj.frequencyRx/1000000.0 +"MHz";
			 else 
				document.getElementById("node1Freq").value = obj.frequency/1000000.0 + "MHz";
		 }else{
			 document.getElementById("node1Freq").value = obj.frequency/1000000.0 + "MHz";
		 }
		 document.getElementById("node1Sql").value = obj.sqlLevel;
	 }else if(obj.nodeID == 2){
		 var nodeType = document.getElementById("node2type").value;
		 if (nodeType == 3){
			 if (obj.frequency != obj.frequencyRx)
				document.getElementById("node2Freq").value = "Tx:" + obj.frequency/1000000.0 + "MHz Rx:" + obj.frequencyRx/1000000.0 +"MHz";
			 else 
				document.getElementById("node2Freq").value = obj.frequency/1000000.0 + "MHz";
		 }else{
			 document.getElementById("node2Freq").value = obj.frequency/1000000.0 + "MHz";
		 }
		 document.getElementById("node2Sql").value = obj.sqlLevel;
	 }
 }
 else if(obj.menuID == "connState")
 {
//	 console.debug(message);
	 if (obj.nodeID == 1){
		 var nodeType = document.getElementById("node1type").value;
		 
		 if (nodeType == 3){
		 	 document.getElementById("node1Duration").value = "Tx: " + obj.connDuration + " Rx: " + obj.connDurationRx;
			 document.getElementById("node1Conn").value = "Tx: " + obj.connStatus  + " Rx: " + obj.connStatusRx;
			 document.getElementById("node1RadioStatus").value = "Tx: " + obj.radioStatus + " Rx: " + obj.radioStatusRx;
		 }
		 else{
		 	 document.getElementById("node1Duration").value = obj.connDuration;
			 document.getElementById("node1Conn").value = obj.connStatus;
			 document.getElementById("node1RadioStatus").value = obj.radioStatus;
		 }
		 document.getElementById("node1TRx").value = obj.localTrxStatus;
		 document.getElementById("node1vswr").value = obj.vswr;
		 
	 }else if(obj.nodeID == 2){
		 var nodeType = document.getElementById("node2type").value;
		 if (nodeType == 3){
		 	 document.getElementById("node2Duration").value = "Tx: " + obj.connDuration + " Rx: " + obj.connDurationRx;
			 document.getElementById("node2Conn").value = "Tx: " + obj.connStatus  + " Rx: " + obj.connStatusRx
			 document.getElementById("node2RadioStatus").value = "Tx: " + obj.radioStatus + " Rx: " + obj.radioStatusRx;
		 }
		 else{
		 	 document.getElementById("node2Duration").value = obj.connDuration;
			 document.getElementById("node2Conn").value = obj.connStatus;
			 document.getElementById("node2RadioStatus").value = obj.radioStatus;
		 }
		 document.getElementById("node2TRx").value = obj.localTrxStatus;
		 document.getElementById("node2vswr").value = obj.vswr;
		 
	 }
 }
  else if(obj.menuID == "broadcastLocalTime")
 {
//	console.debug(message);
//	document.getElementById("currentTime").value = obj.currentTime;
//	document.getElementById("currentDate").value = obj.currentDate;
	document.getElementById("nodeSelected").value = obj.nodeSelected;
 }
 else if (obj.menuID == "SqlActiveHigh")
 {
	 document.getElementById("sqlInputActiveHigh").checked = (obj.active == 1);
 }
	else{
//		console.debug(message);
	}

}