// JavaScript Document
var wsUri;
var ws;
var currentSoftPhoneID = 1;
WebSocketTest();
function WebSocketTest() {

	if ("WebSocket" in window) {
	   // Let us open a web socket
	   wsUri = "ws://" + location.host + ":1234";
	   ws = new WebSocket(wsUri);

	   ws.onopen = function() {
		  // Web Socket is connected, send data using send()
		  ws.send('{"menuID":"igateNumberSelect", "iGateNum":'+currentSoftPhoneID+'}');
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
	var defaultEthernet = ""
	if (document.getElementById("defaultEthernet").value == 0)
		defaultEthernet = "eth0"
	else
		defaultEthernet = "eth1"
	var jsonMessage = '{"menuID":"updateHostCfg", "name":\"' + hostname + '\", "keepAlivePeroid":' + keepAlivePeroid + ', "sipPort":' + sipPort + ', "defaultEthernet":"' + defaultEthernet + '", "softPhoneID":' + currentSoftPhoneID + '}';
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
// function updateHostCfg(){
// 	var hostname = document.getElementById("localname").value;
// 	var keepAlivePeroid = document.getElementById("keepaliveperoid").value;
// 	var sipPort = document.getElementById("hostSipPort").value;
// 	var jsonMessage = '{"menuID":"updateHostCfg", "name":\"' + hostname + '\", "keepAlivePeroid":' + keepAlivePeroid + ', "sipPort":' + sipPort + '}';
// 	console.debug(jsonMessage);
// 	if (ws.readyState == 1){
// 		var r = confirm("please confirm to update!");
// 		if (r == true) {
// 		  ws.send(jsonMessage);
// 		}else{
// 			location.reload();
// 		}
// 	}else{ๅ
// 		alert("Connection is closed...");
// 	}
// }
function disconnect(){
	var uriConnList = document.getElementById("uriConnList").value;
	var jsonMessage = '{"menuID":"disconnect", "uri":"' + uriConnList + '", "softPhoneID":' + currentSoftPhoneID + '}';
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
function select_iGate(){
var igateNumberSelect = document.getElementById("igateNumberSelect");
var jsonMessage = '{"menuID":"igateNumberSelect", "iGateNum":' + igateNumberSelect.value + '}';
	if (igateNumberSelect.value > 0)
	{
		if (ws.readyState == 1){
		  	ws.send(jsonMessage);
		}else{
			alert("Connection is closed...");
		}
	}
	else{
		alert("Please select iGate");
	}
}

function updateswitchInviteMode(){
var inviteModeIndex = document.getElementById("modeIndex");
var inviteMode = inviteModeIndex.getElementsByTagName("option");
var jsonMessage = '{"menuID":"updateswitchInviteMode", "inviteModeIndex":' + inviteModeIndex.value + '}';
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
var inputGainIndex = document.getElementById("inputgain").value;
var jsonMessage = '{"menuID":"updateInputgain", "inputGainIndex":' + inputGainIndex + ', "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}

function updateOutputgain(){
var outputGainIndex = document.getElementById("outputgain").value;
var jsonMessage = '{"menuID":"updateOutputgain", "outputGainIndex":' + outputGainIndex + ', "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}


// function updateInputgain(){
// var inputGainIndex = document.getElementById("inputgain").value;
// var jsonMessage = '{"menuID":"updateInputgain", "inputGainIndex":' + inputGainIndex + ', "softPhoneID":' + currentSoftPhoneID + '}';
// 	if (ws.readyState == 1){
// 		ws.send(jsonMessage)
// 	}else{
// 		alert("Connection is closed...");
// 	}
// }

// function updateOutputgain(){
// var outputGainIndex = document.getElementById("outputgain").value;
// var jsonMessage = '{"menuID":"updateOutputgain", "outputGainIndex":' + outputGainIndex + ', "softPhoneID":' + currentSoftPhoneID + '}';
// 	if (ws.readyState == 1){
// 		ws.send(jsonMessage)
// 	}else{
// 		alert("Connection is closed...");
// 	}
// }

function updatePortInterface(){
var portInterfaceIndex = document.getElementById("portInterface").value;
var jsonMessage = '{"menuID":"updatePortInterface", "portInterface":' + portInterfaceIndex + ', "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}

function updatetxScheduler(){
var pttSchedulerID = document.getElementById("pttScheduler").value;
var jsonMessage = '{"menuID":"updatetxScheduler", "pttScheduler":' + pttSchedulerID + ', "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}
function updateSqlInputActiveHigh(){
	var sqlInputActiveHigh = document.getElementById("sqlInputActiveHigh").checked ;
	var jsonMessage = '{"menuID":"updateSQLActiveHigh", "sqlActive":"' + sqlInputActiveHigh + '", "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}
function updateRadioMainStandby()
{
	var radioMainStandby = document.getElementById("radioMainStandby").value ;
	if (radioMainStandby < 0) {
		select_iGate()
		return;
	}
	var jsonMessage = '{"menuID":"updateRadioMainStandby", "radioMainStandby":' + radioMainStandby + ', "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}
function updateRadioAutoInactive()
{
	var radioAutoInactive = document.getElementById("radioAutoInactive").checked ;
	var jsonMessage = '{"menuID":"updateRadioAutoInactive", "radioAutoInactive":"' + radioAutoInactive + '", "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}
function updateMainRadioReceiverUsed(){
	var mainRadioReceiverUsed = document.getElementById("mainRadioReceiverUsed").checked ;
	var jsonMessage = '{"menuID":"updateMainRadioReceiverUsed", "mainRadioReceiverUsed":"' + mainRadioReceiverUsed + '", "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}

function updateMainRadioTransmitterUsed(){
	var mainRadioTransmitterUsed = document.getElementById("mainRadioTransmitterUsed").checked ;
	var jsonMessage = '{"menuID":"updateMainRadioTransmitterUsed", "mainRadioTransmitterUsed":"' + mainRadioTransmitterUsed + '", "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}

function updateSQLDefeat(){
	var sqlDefeat = document.getElementById("sqlDefeat").checked ;
	var jsonMessage = '{"menuID":"updateSQLDefeat", "sqlDefeat":"' + sqlDefeat + '", "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
	}else{
		alert("Connection is closed...");
	}
}

function toggleGPIOOut( gpioNum,  gpioVal){
	if(gpioNum == 1){
		alert("GPIO Define as PTT Out");
		return;
	}
	var jsonMessage = '{"menuID":"toggleGpioOut", "gpioNum":' + gpioNum + ', "gpioVal":' + gpioVal + ', "softPhoneID":' + currentSoftPhoneID + '}';
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
	var jsonMessage = '{"menuID":"updateURILits", "urlList":"' + urlList + '", "numconn":' + numconn + ', "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
		alert("Updating complete......"); 
	}else{
		alert("Connection is closed...");
	}
}
function update_DeviceName(){
	var deviceName = document.getElementById("deviceName").value;
	var jsonMessage = '{"menuID":"updateDeviceName", "deviceName":"' + deviceName + '", "softPhoneID":' + currentSoftPhoneID + '}';
	if (ws.readyState == 1){
		ws.send(jsonMessage)
		document.getElementById("headName").innerHTML = deviceName;
		document.title = obj.deviceName;
	}else{
		alert("Connection is closed...");
	}
}
function processMsg(message){
	
 var obj = JSON.parse(message);
 if (obj.menuID == "input")
 {
	 console.log(message)
	 document.title = obj.deviceName;
	 document.getElementById("headName").innerHTML = obj.deviceName;
	 document.getElementById("deviceName").value = obj.deviceName;
	 document.getElementById("localname").value = obj.sipUser;
	 document.getElementById("keepaliveperoid").value = obj.keepAlivePeroid;
	 document.getElementById("hostSipPort").value = obj.sipPort;
	 document.getElementById("inputgain").value = obj.inputgain;
	 document.getElementById("outputgain").value = obj.outputgain;
	 document.getElementById("portInterface").value = obj.portInterface;
	 document.getElementById("modeIndex").value = obj.invitemode;
	 document.getElementById("defaultEthernet").value = obj.defaultEthernet;
	 document.getElementById("radioAutoInactive").checked = (obj.radioAutoInactive == 1);
	 document.getElementById("mainRadioReceiverUsed").checked = (obj.mainRadioReceiverUsed == 1);
	 document.getElementById("mainRadioTransmitterUsed").checked = (obj.mainRadioTransmitterUsed == 1);
	 document.getElementById("radioMainStandby").value = obj.radioMainStandby;
 }
 else if (obj.menuID == "RadioActive")
 {
 	console.log(message);
 	if (obj.softPhoneID != currentSoftPhoneID) return;
	document.getElementById("radioAutoInactive").checked = (obj.radioAutoInactive == 1);
	// document.getElementById("mainRadioReceiverUsed").checked = (obj.mainRadioReceiverUsed == 1);
	// document.getElementById("mainRadioTransmitterUsed").checked = (obj.mainRadioTransmitterUsed == 1);
	document.getElementById("radioMainStandby").value = obj.radioMainStandby;
 }
 else if (obj.menuID == "uriAllowedList")
 {
 	currentSoftPhoneID = obj.softPhoneID;
	document.getElementById("allowConnNum").value = obj.numConn;
	document.getElementById("uriList1").value = obj.uri1;
	document.getElementById("uriList2").value = obj.uri2;
	document.getElementById("uriList3").value = obj.uri3;
	document.getElementById("uriList4").value = obj.uri4;
	document.getElementById("uriList5").value = obj.uri5;
	document.getElementById("uriList6").value = obj.uri6;
	document.getElementById("uriList7").value = obj.uri7;
	document.getElementById("uriList8").value = obj.uri8;
	document.getElementById("igateNumberSelect").value = obj.softPhoneID;
 }
 else if (obj.menuID == "updateDeviceName")
 {
 	document.getElementById("deviceName").value = obj.deviceName;
 	document.title = obj.deviceName;
 	document.getElementById("headName").innerHTML = obj.deviceName;
 	//location.reload();
 }
 else if (obj.menuID == "updateHostCfg")
 {
 	// console.log(message);
 	document.getElementById("localname").value = obj.name;
	document.getElementById("keepaliveperoid").value = obj.keepAlivePeroid;
	document.getElementById("hostSipPort").value = obj.sipPort;
 }
 else if (obj.menuID == "updateInputgain")
 {
 	// console.log(message)
 	if (obj.softPhoneID != currentSoftPhoneID) return;
 	document.getElementById("inputgain").value = obj.inputGainIndex;
 }
 else if (obj.menuID == "updateOutputgain")
 {
 	if (obj.softPhoneID != currentSoftPhoneID) return;
 	document.getElementById("outputgain").value = obj.outputGainIndex;
 }
 else if (obj.menuID == "updateSQLDefeat")
 {
 	if (obj.softPhoneID != currentSoftPhoneID) return;
 	document.getElementById("sqlDefeat").checked = obj.sqlDefeat == "true";
 }
 else if (obj.menuID == "updateRadioAutoInactive")
 {
 	if (obj.softPhoneID != currentSoftPhoneID) return;
 	document.getElementById("radioAutoInactive").checked = obj.radioAutoInactive == "true";
 }
 else if (obj.menuID == "updateRxRadioActive")
 {
 	if (obj.softPhoneID != currentSoftPhoneID) return;
 	document.getElementById("mainRadioReceiverUsed").checked = obj.mainRadioReceiverUsed == "true";
 }
 else if (obj.menuID == "updateMainRadioTransmitterUsed")
 {
 	if (obj.softPhoneID != currentSoftPhoneID) return;
 	document.getElementById("mainRadioTransmitterUsed").checked = obj.mainRadioTransmitterUsed == "true";
 }
 else if (obj.menuID == "updateSQLActiveHigh")
 {
 	if (obj.softPhoneID != currentSoftPhoneID) return;
 	document.getElementById("sqlInputActiveHigh").checked = obj.sqlActive == "true";
 }
 else if (obj.menuID == "connStatus")
 {
 	 if (obj.softPhoneID != currentSoftPhoneID) return;
	 document.getElementById("connNum").value = obj.connNum;
	 document.getElementById("pttURI").value = obj.pttURI;
	 if ((obj.TxRx == "Rx")||(obj.TxRx == "TRx")){
		 document.getElementById("RxIndicatorOff").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("RxIndicatorOn").style = "float: right; height: 30px; width: 60px;"
	 }
	 else
	 {
		 document.getElementById("RxIndicatorOff").style = "float: right; height: 30px; width: 60px;"
		 document.getElementById("RxIndicatorOn").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
	 
	 if ((obj.TxRx == "Tx")||(obj.TxRx == "TRx")){
		 document.getElementById("TxIndicatorOff").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("TxIndicatorOn").style = "float: right; height: 30px; width: 22px;"
	 }
	 else
	 {
		 document.getElementById("TxIndicatorOff").style = "float: right; height: 30px; width: 22px;"
		 document.getElementById("TxIndicatorOn").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
 }
  else if (obj.menuID == "dcInStatus")
 {
 	console.log(message)
 	 var dcIn1 = obj.dcIn1;
 	 var dcIn2 = obj.dcIn2;

	 if (dcIn1 == 1){
		 document.getElementById("dcIn2NotDetect").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("dcIn2Detected").style = "float: right; height: 30px; width: 60px;"

	 }
	 else
	 {
		 document.getElementById("dcIn2NotDetect").style = "float: right; height: 30px; width: 60px;"
		 document.getElementById("dcIn2Detected").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
	 
	 if (dcIn2 == 1){
		 document.getElementById("dcIn1NotDetect").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
		 document.getElementById("dcIn1Detected").style = "float: right; height: 30px; width: 22px;"
	 }
	 else
	 {
		 document.getElementById("dcIn1NotDetect").style = "float: right; height: 30px; width: 22px;"
		 document.getElementById("dcIn1Detected").style = "float: right; height: 30px; width: 0px; visibility: hidden;"
	 }
 }
 else if (obj.menuID == "sqlDefeat")
 {
	 document.getElementById("sqlDefeat").checked = (obj.sqlDefeat == 1);
 }
 else if (obj.menuID == "SqlActiveHigh")
 {
	 document.getElementById("sqlInputActiveHigh").checked = (obj.active == 1);
 }
 
else if (obj.menuID == "uriConnList")
 {
	//Create array of options to be added
	console.log(message);
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
	var softPhoneID = obj.softPhoneID;
	if (softPhoneID == currentSoftPhoneID)
	{
		var connUri = obj.uri;
		if (connUri == document.getElementById("uriConnList").value)		
		document.getElementById("connDuration").value = obj.duration;
	}
 }
  else if(obj.menuID == "broadcastLocalTime")
 {
		 document.getElementById("currentTime").value = obj.currentTime;
		 document.getElementById("currentDate").value = obj.currentDate;
 }
 else{
	 // console.debug(message);
 }

}