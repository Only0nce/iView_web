// JavaScript Document
var wsUri;
var ws;
setInterval(reqCtrlInfo,1000);
WebSocketTest();
function WebSocketTest() {

if ("WebSocket" in window) {
   // Let us open a web socket
   wsUri = "ws://" + location.host + ":1234";
   ws = new WebSocket(wsUri);

   ws.onopen = function() {
	  // Web Socket is connected, send data using send()
	  ws.send('{"menuID":"getCtrlinfoPage","softPhoneID":0}');
   };

   ws.onmessage = function (evt) { 
	  var received_msg = evt.data;
	  processMsg(received_msg);
   };

   ws.onclose = function() { 
	  alert("Connection is closed..."); 
   };
} else {

   // The browser doesn't support WebSocket
   alert("WebSocket NOT supported by your Browser!");
}
}
function reqCtrlInfo()
{
	var softPhoneID = document.getElementById("ctrlSelect").value;
	
//	if (idInRole > 0)
	{
		if (ws.readyState == 1)
			ws.send('{"menuID":"getCtrlinfoPage","softPhoneID":' + softPhoneID +'}');
	}
}

function reconnect(trxid){
	var jsonMessage = '{"command":"trxReconnect", "trxID":' + trxid + '}';
	if (ws.readyState == 1){
		var r = confirm("please confirm to reconnect node: " + trxid);
		if (r == true) {
		  	ws.send(jsonMessage);
		}else{
			setTimeout(() => {location.reload();}, 2000);
		}
	}else{
		alert("Connection is closed...");
	}

}
function clearform()
{
	var style =   "width: 23%; border: 0; margin: 5px; padding: 15px; box-sizing: border-box;"
	var style2 =   "width: 47.5%; border: 0; margin: 5px; padding: 15px; box-sizing: border-box;"
	
	document.getElementById("radio1").style = style;
	document.getElementById("radio1uri").style = style2;
	document.getElementById("radio1ConnStatus").style = style;
	document.getElementById("radio1Connection").style = style;
	document.getElementById("radio1ConnDuradio").style = style;
	document.getElementById("radio1ConnectionDuration").style = style;
	document.getElementById("radio1Status").style = style;
	document.getElementById("radio1StatusLabel").style = style;
	
	document.getElementById("radio2").style = style;
	document.getElementById("radio2uri").style = style2;
	document.getElementById("radio2ConnStatus").style = style;
	document.getElementById("radio2Connection").style = style;
	document.getElementById("radio2ConnDuradio").style = style;
	document.getElementById("radio2ConnectionDuration").style = style;
	document.getElementById("radio2Status").style = style;
	document.getElementById("radio2StatusLabel").style = style;
	
	document.getElementById("radio1").value = "Main Radio Tx Info"
	document.getElementById("mainTrxMode").value = "";
	document.getElementById("mainRadioFrequency").value = "";
	document.getElementById("mainTxPower").value = "";
	document.getElementById("mainSqlLevel").value = "";
	document.getElementById("mainTrxStatus").value = "";

	document.getElementById("radio1uri").value = "";
	document.getElementById("radio1ConnStatus").value = "";
	document.getElementById("radio1ConnDuradio").value = "";
	document.getElementById("radio1Status").value = "";

	document.getElementById("radio2uri").value = "";
	document.getElementById("radio2ConnStatus").value = "";
	document.getElementById("radio2ConnDuradio").value = "";
	document.getElementById("radio2Status").value = "";

	document.getElementById("radio3").style = style;
	document.getElementById("radio3uri").style = style2;
	document.getElementById("radio3ConnStatus").style = style;
	document.getElementById("radio3Connection").style = style;
	document.getElementById("radio3ConnDuradio").style = style;
	document.getElementById("radio3ConnectionDuration").style = style;
	document.getElementById("radio3Status").style = style;
	document.getElementById("radio3StatusLabel").style = style;
	
	document.getElementById("radio4").style = style;
	document.getElementById("radio4uri").style = style2;
	document.getElementById("radio4ConnStatus").style = style;
	document.getElementById("radio4Connection").style = style;
	document.getElementById("radio4ConnDuradio").style = style;
	document.getElementById("radio4ConnectionDuration").style = style;
	document.getElementById("radio4Status").style = style;
	document.getElementById("radio4StatusLabel").style = style;
	
	document.getElementById("radio3").value = "standby Radio Tx Info"
	document.getElementById("standbyTrxMode").value = "";
	document.getElementById("standbyRadioFrequency").value = "";
	document.getElementById("standbyTxPower").value = "";
	document.getElementById("standbySqlLevel").value = "";
	document.getElementById("standbyTrxStatus").value = "";

	document.getElementById("radio3uri").value = "";
	document.getElementById("radio3ConnStatus").value = "";
	document.getElementById("radio3ConnDuradio").value = "";
	document.getElementById("radio3Status").value = "";

	document.getElementById("radio4uri").value = "";
	document.getElementById("radio4ConnStatus").value = "";
	document.getElementById("radio4ConnDuradio").value = "";
	document.getElementById("radio4Status").value = "";
}

function processMsg(message){
	
 var obj = JSON.parse(message);
  
 // console.log(obj.idInRole,obj.channelID)
 if ((obj.menuID == "channelMessage") & (obj.softPhoneID == document.getElementById("ctrlSelect").value))
 {
 	console.log(message);
	var	channelID					= obj.channelID
	var	numConn						= obj.numConn
	var	channelName					= obj.channelName
	var	radioType					= obj.radioType
	var	frequency					= obj.frequency
	var	numTxRx						= obj.numTxRx
	var	mainRadioName				= obj.mainRadioName
	var	standbyRadioName			= obj.standbyRadioName
	var	mainTxConnStatus			= obj.mainTxConnStatus
	var	mainRxConnStatus			= obj.mainRxConnStatus
	var	standbyTxConnStatus			= obj.standbyTxConnStatus
	var	standbyRxConnStatus			= obj.standbyRxConnStatus
	var	mainTxPTTOn					= obj.mainTxPTTOn
	var	mainRxSQLOn					= obj.mainRxSQLOn
	var	standbyTxPTTOn				= obj.standbyTxPTTOn
	var	standbyRxSQLOn				= obj.standbyRxSQLOn
	var	mainRxRadioVolumeActive		= obj.mainRxRadioVolumeActive
	var	standbyRxRadioVolumeActive	= obj.standbyRxRadioVolumeActive
	var	mainRadioTRxType			= obj.mainRadioTRxType
	var	standbyRadioTRxType			= obj.standbyRadioTRxType
	var	trxMode						= obj.trxMode
	var	mainRadioBSSRxLevel			= obj.mainRadioBSSRxLevel
	var	standbyRadioBSSRxLevel		= obj.standbyRadioBSSRxLevel
	var	mainRadioTxRFPower			= obj.mainRadioTxRFPower
	var	standbyRadioTxRFPower		= obj.standbyRadioTxRFPower
	var	mainSqlchThrhCarrier		= obj.mainSqlchThrhCarrier
	var	standbySqlchThrhCarrier		= obj.standbySqlchThrhCarrier
	var	visible						= obj.visible
	var	idInRole					= obj.idInRole
	var	mainTxConnDuration			= obj.mainTxConnDuration
	var	mainRxConnDuration			= obj.mainRxConnDuration
	var	standbyTxConnDuration		= obj.standbyTxConnDuration
	var	standbyRxConnDuration		= obj.standbyRxConnDuration
	var	mainTxFrequency				= obj.mainTxFrequency
	var	mainRxFrequency				= obj.mainRxFrequency
	var	standbyTxFrequency			= obj.standbyTxFrequency
	var	standbyRxFrequency			= obj.standbyRxFrequency
	var	mainTxRadiostatus			= obj.mainTxRadiostatus
	var	mainRxRadiostatus			= obj.mainRxRadiostatus
	var	standbyTxRadiostatus		= obj.standbyTxRadiostatus
	var	standbyRxRadiostatus		= obj.standbyRxRadiostatus
	var	main01_is_mainTx			= obj.main01_is_mainTx
	var	main01_is_mainRx			= obj.main01_is_mainRx
	var	main02_is_mainRx			= obj.main02_is_mainRx
	var	standby01_is_mainTx			= obj.standby01_is_mainTx
	var	standby01_is_mainRx			= obj.standby01_is_mainRx
	var	standby02_is_mainRx			= obj.standby02_is_mainRx
	var	standByEnable				= obj.standByEnable
	var	mainRadio01URI				= obj.mainRadio01URI
	var	mainRadio02URI				= obj.mainRadio02URI
	var	standbyRadio01URI			= obj.standbyRadio01URI
	var	standbyRadio02URI			= obj.standbyRadio02URI

	 var mainTrxStatus = "";
	 
	 if ((mainTxPTTOn == 1) & (mainRxSQLOn == 1))
	 {
		 mainTrxStatus = "PTT On & SQL On";
	 }
	 else if((mainTxPTTOn == 1) & (mainRxSQLOn == 0))
	 {
		 mainTrxStatus = "PTT On";
	 }
	 else if((mainTxPTTOn == 0) & (mainRxSQLOn == 1))
	 {
		 mainTrxStatus = "SQL On";
	 }
	 else
	 {
		 mainTrxStatus = "";
	 }

 	 var standbyTrxStatus = "";
	 
	 if ((standbyTxPTTOn == 1) & (standbyRxSQLOn == 1))
	 {
		 standbyTrxStatus = "PTT On & SQL On";
	 }
	 else if((standbyTxPTTOn == 1) & (standbyRxSQLOn == 0))
	 {
		 standbyTrxStatus = "PTT On";
	 }
	 else if((standbyTxPTTOn == 0) & (standbyRxSQLOn == 1))
	 {
		 standbyTrxStatus = "SQL On";
	 }
	 else
	 {
		 standbyTrxStatus = "";
	 }
	 
	 
	 if (mainRadioTRxType != "Separate")
	 {
		document.getElementById("radio1").value = "Main Radio Info"
		document.getElementById("mainTrxMode").value = mainRadioTRxType;

		document.getElementById("mainRadioFrequency").value = (mainTxFrequency/1000000).toFixed(3) + " MHz";
		document.getElementById("mainTxPower").value = mainRadioTxRFPower;
		document.getElementById("mainSqlLevel").value = mainSqlchThrhCarrier;
		document.getElementById("mainTrxStatus").value = mainTrxStatus;

		document.getElementById("radio1uri").value = mainRadio01URI;
		document.getElementById("radio1ConnStatus").value = mainTxConnStatus == 1 ? "Connected" : "Disconnected";
		document.getElementById("radio1ConnDuradio").value = mainTxConnDuration;
		document.getElementById("radio1Status").value = mainTxRadiostatus;

		document.getElementById("radio2").style = "display: none;";
		document.getElementById("radio2uri").style = "display: none;";
		document.getElementById("radio2ConnStatus").style = "display: none;";
		document.getElementById("radio2Connection").style = "display: none;";
		document.getElementById("radio2ConnDuradio").style = "display: none;";
		document.getElementById("radio2ConnectionDuration").style = "display: none;";
		document.getElementById("radio2Status").style = "display: none;";
		document.getElementById("radio2StatusLabel").style = "display: none;";
	 }
	 else 
	 {
		var style =   "width: 23%; border: 0; margin: 5px; padding: 15px; box-sizing: border-box;"
		var style2 =  "width: 47.5%; border: 0; margin: 5px; padding: 15px; box-sizing: border-box;"
		document.getElementById("radio2").style = style;
		document.getElementById("radio2uri").style = style2;
		document.getElementById("radio2ConnStatus").style = style;
		document.getElementById("radio2Connection").style = style;
		document.getElementById("radio2ConnDuradio").style = style;
		document.getElementById("radio2ConnectionDuration").style = style;
		document.getElementById("radio2Status").style = style;
		document.getElementById("radio2StatusLabel").style = style;

		document.getElementById("radio1").value = "Main Radio Tx Info"
		document.getElementById("mainTrxMode").value = mainRadioTRxType;
		if (mainTxFrequency == mainRxFrequency)
			document.getElementById("mainRadioFrequency").value = (mainTxFrequency/1000000).toFixed(3) + " MHz";
		else 
		document.getElementById("mainRadioFrequency").value = "Rx:" + (mainRxFrequency/1000000).toFixed(3) + "/" + "Tx:" + (mainTxFrequency/1000000).toFixed(3) + " MHz";
		document.getElementById("mainTxPower").value = mainRadioTxRFPower;
		document.getElementById("mainSqlLevel").value = mainSqlchThrhCarrier;
		document.getElementById("mainTrxStatus").value = mainTrxStatus;

		document.getElementById("radio1uri").value = mainRadio01URI;
		document.getElementById("radio1ConnStatus").value = mainTxConnStatus == 1 ? "Connected" : "Disconnected";
		document.getElementById("radio1ConnDuradio").value = mainTxConnDuration;
		document.getElementById("radio1Status").value = mainTxRadiostatus;

		document.getElementById("radio2uri").value = mainRadio02URI;
		document.getElementById("radio2ConnStatus").value = mainRxConnStatus == 1 ? "Connected" : "Disconnected";
		document.getElementById("radio2ConnDuradio").value = mainRxConnDuration;
		document.getElementById("radio2Status").value = mainRxRadiostatus;
	 }

	 if (standByEnable == 0)
	 {
	 	document.getElementById("standbyRadio").style = "display: none;";
	 }

	 else if (standbyRadioTRxType != "Separate")
	 {
	 	document.getElementById("standbyRadio").style = "display: initial;";
		document.getElementById("radio3").value = "standby Radio Info"
		document.getElementById("standbyTrxMode").value = standbyRadioTRxType;

		document.getElementById("standbyRadioFrequency").value = (standbyTxFrequency/1000000).toFixed(3) + " MHz";
		document.getElementById("standbyTxPower").value = standbyRadioTxRFPower;
		document.getElementById("standbySqlLevel").value = standbySqlchThrhCarrier;
		document.getElementById("standbyTrxStatus").value = standbyTrxStatus;

		document.getElementById("radio3uri").value = standbyRadio01URI;
		document.getElementById("radio3ConnStatus").value = standbyTxConnStatus == 1 ? "Connected" : "Disconnected";
		document.getElementById("radio3ConnDuradio").value = standbyTxConnDuration;
		document.getElementById("radio3Status").value = standbyTxRadiostatus;

		document.getElementById("radio4").style = "display: none;";
		document.getElementById("radio4uri").style = "display: none;";
		document.getElementById("radio4ConnStatus").style = "display: none;";
		document.getElementById("radio4Connection").style = "display: none;";
		document.getElementById("radio4ConnDuradio").style = "display: none;";
		document.getElementById("radio4ConnectionDuration").style = "display: none;";
		document.getElementById("radio4Status").style = "display: none;";
		document.getElementById("radio4StatusLabel").style = "display: none;";
	 }
	 else 
	 {
		var style =   "width: 23%; border: 0; margin: 5px; padding: 15px; box-sizing: border-box;"
		var style2 =  "width: 47.5%; border: 0; margin: 5px; padding: 15px; box-sizing: border-box;"
		document.getElementById("radio4").style = style;
		document.getElementById("radio4uri").style = style2;
		document.getElementById("radio4ConnStatus").style = style;
		document.getElementById("radio4Connection").style = style;
		document.getElementById("radio4ConnDuradio").style = style;
		document.getElementById("radio4ConnectionDuration").style = style;
		document.getElementById("radio4Status").style = style;
		document.getElementById("radio4StatusLabel").style = style;

		document.getElementById("radio3").value = "standby Radio Tx Info"
		document.getElementById("standbyTrxMode").value = standbyRadioTRxType;
		if (standbyTxFrequency == standbyRxFrequency)
			document.getElementById("standbyRadioFrequency").value = (standbyTxFrequency/1000000).toFixed(3) + " MHz";
		else 
		document.getElementById("standbyRadioFrequency").value = "Rx:" + (standbyRxFrequency/1000000).toFixed(3) + "/" + "Tx:" + (standbyTxFrequency/1000000).toFixed(3) + " MHz";
		document.getElementById("standbyTxPower").value = standbyRadioTxRFPower;
		document.getElementById("standbySqlLevel").value = standbySqlchThrhCarrier;
		document.getElementById("standbyTrxStatus").value = standbyTrxStatus;

		document.getElementById("radio3uri").value = standbyRadio01URI;
		document.getElementById("radio3ConnStatus").value = standbyTxConnStatus == 1 ? "Connected" : "Disconnected";
		document.getElementById("radio3ConnDuradio").value = standbyTxConnDuration;
		document.getElementById("radio3Status").value = standbyTxRadiostatus;

		document.getElementById("radio4uri").value = standbyRadio02URI;
		document.getElementById("radio4ConnStatus").value = standbyRxConnStatus == 1 ? "Connected" : "Disconnected";
		document.getElementById("radio4ConnDuradio").value = standbyRxConnDuration;
		document.getElementById("radio4Status").value = standbyRxRadiostatus;
	 }
 }
}

$(document).ready(function(){
	$("#hex").on('input', function(){
		var hex = $("#hex").val();
		$("#btn").css({"background-color":hex});
	});
});
function connStatus(idInRole, numConn,numTxRx)
{
	var connStatusID = "#connStatus" + idInRole;
	var disconnTextColor = "red";
	var connTextColor = "green";
	if (numConn == numTxRx){
		document.getElementById("connStatus" + idInRole).value = "Connected";
		$(connStatusID).css({"color": connTextColor});
	}
	else if (numConn == 0){
		document.getElementById("connStatus" + idInRole).value = "Disconnected";
		$(connStatusID).css({"color": disconnTextColor});
	}
	else if (numConn < numTxRx){
		document.getElementById("connStatus" + idInRole).value = "Connected(" + numConn + "/" + numTxRx + ")";
		$(connStatusID).css({"color": connTextColor});
	}
	
	
}

function trxButtonMode( mode,  idInRole, pttOn, sqlOn)
{
	var txEnable;
	var rxEnable;
	var rxButtonID = "#rxButton" + idInRole;
	var txButtonID = "#txButton" + idInRole;
	var backgroundcolorEnable = "#2196f3";
	var backgroundcolorDisable = "#f2f2f2";
	var textcolorEnable = "#FFFFFF";
	var textcolorDisable = "#000000";
	var pttSqlOnBGColor = "#FFEB3B";
	var pttSqlOnTextColor = "#E91E63";
	
	switch (mode)
	{
		case 0: 
			txEnable = 0;
			rxEnable = 0;
			break;
		case 1:
			txEnable = 1;
			rxEnable = 1;
			break;
		case 2:
			txEnable = 1;
			rxEnable = 0;
			break;
		case 3:
			txEnable = 0;
			rxEnable = 1;
			break;
	}
	
	
	if (sqlOn == 1)
		$(rxButtonID).css({"background-color":pttSqlOnBGColor, "color": pttSqlOnTextColor});
	else if (rxEnable == 1)
		$(rxButtonID).css({"background-color":backgroundcolorEnable, "color": textcolorEnable});
	else
		$(rxButtonID).css({"background-color":backgroundcolorDisable, "color": textcolorDisable});
	
	if (pttOn == 1)
		$(txButtonID).css({"background-color":pttSqlOnBGColor, "color": pttSqlOnTextColor});
	else if (txEnable == 1)
		$(txButtonID).css({"background-color":backgroundcolorEnable, "color": textcolorEnable});
	else
		$(txButtonID).css({"background-color":backgroundcolorDisable, "color": textcolorDisable});
}

function updateRxButton(idInRole)
{
	ws.send('{"menuID":"toggleRxEnable", "idInRole":' + idInRole + '}');
}

function updateTxButton(idInRole)
{
	ws.send('{"menuID":"toggleTxEnable", "idInRole":' + idInRole + '}');
}

function restart(idInRole)
{
	ws.send('{"menuID":"restartSoftphone", "idInRole":' + idInRole + '}');
}