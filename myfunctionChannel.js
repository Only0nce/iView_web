// JavaScript Document
var wsUri;
var ws;
var channelNameList;
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
function updateChannelNameList(_channelNameList)
{
	channelNameList = _channelNameList;
	console.log(_channelNameList);
}
function checkChannelName(channelID,_x)
{
	var channelName = document.getElementById("channelName"+channelID).value;
	if (channelName == "") {		
		return false;
	}
	for (var i = 0; i < channelNameList.length; i++) 
	{
		if (i != _x)
		{
			if (channelName == channelNameList[i])
				return false;
		}
	}
	return true;
}
function updateChannel(channelID,_x)
{
	console.log("Update ChannelID:",channelID,document.getElementById("channelName"+channelID).value, document.getElementById("channelType"+channelID).value,document.getElementById("mainRadio01ID"+channelID).value,document.getElementById("mainRadio02ID"+channelID).value);
	var mainRadioType = "";
	if (checkChannelName(channelID,_x) == false)
	{
		var r = confirm("Please check channel name");
		if (r == true) 
		{
			document.getElementById("channelName"+channelID).focus();
		}
		else
		{
			document.getElementById("channelName"+channelID).focus();
		}	
		return false;
	}
	if (document.getElementById("channelType"+channelID).value == 1) mainRadioType = "TRx";
	else if (document.getElementById("channelType"+channelID).value == 2) mainRadioType = "Tx";
	else if (document.getElementById("channelType"+channelID).value == 3) mainRadioType = "Rx";
	else if (document.getElementById("channelType"+channelID).value == 4) mainRadioType = "Separate";
	else
	{
		setTimeout(() => {location.reload();}, 2000);
		return;
	}
	
	
	if (mainRadioType == 'Separate')
	{
		if (document.getElementById("mainRadio01ID"+channelID).value == 0) {
			document.getElementById("mainRadio01ID"+channelID).focus();
			var r = confirm("Please select Tx/TRx Main Radio");
			document.getElementById("channelName"+channelID).focus();
			return false;
		}
		else if (document.getElementById("mainRadio02ID"+channelID).value == 0) {
			document.getElementById("mainRadio02ID"+channelID).focus();
			var r = confirm("Please select Rx Main Radio");
			return;
		}
	}
	else
	{		
		if (document.getElementById("mainRadio01ID"+channelID).value == 0)
		{
			var length = document.getElementById("mainRadio01ID"+channelID).length;
			console.log("length dropdown",length);
			document.getElementById("mainRadio01ID"+channelID).focus();
			var r = confirm("Please select Tx/TRx Main Radio");
			return;
		}
	}


	var standbyRadioType = "";
	var standbyEnable = document.getElementById("standbyRadioChannelType"+channelID).value == 0 ? 0 : 1;
	if (document.getElementById("standbyRadioChannelType"+channelID).value == 1) standbyRadioType = "TRx";
	else if (document.getElementById("standbyRadioChannelType"+channelID).value == 2) standbyRadioType = "Tx";
	else if (document.getElementById("standbyRadioChannelType"+channelID).value == 3) standbyRadioType = "Rx";
	else if (document.getElementById("standbyRadioChannelType"+channelID).value == 4) standbyRadioType = "Separate";
	else
	{
		standbyEnable = 0;
	}
	
	
	if (document.getElementById("channelName"+channelID).value == '') return;
	
	console.log(document.getElementById("standbyRadio01ID"+channelID).value)
	if (standbyRadioType == 'Separate')
	{
		if (document.getElementById("standbyRadio01ID"+channelID).value == 0) {
			document.getElementById("standbyRadio01ID"+channelID).focus();
			var r = confirm("Please select Tx/TRx Standby Radio");
			document.getElementById("channelName"+channelID).focus();
			return false;
		}
		else if (document.getElementById("standbyRadio02ID"+channelID).value == 0) {
			document.getElementById("standbyRadio02ID"+channelID).focus();
			var r = confirm("Please select Rx Standby Radio");
			return;
		}
	}
	else if (standbyEnable == 1)
	{		
		if (document.getElementById("standbyRadio01ID"+channelID).value == 0)
		{
			var length = document.getElementById("standbyRadio01ID"+channelID).length;
			console.log("length dropdown",length);
			document.getElementById("standbyRadio01ID"+channelID).focus();
			var r = confirm("Please select Tx/TRx Standby Radio");
			return;
		}
	}

	if (document.getElementById("standbyRadio02ID"+channelID).value != 0)
	{
		var radioStandby02Failed = false;
		if (document.getElementById("mainRadio01ID"+channelID).value == document.getElementById("standbyRadio02ID"+channelID).value) radioStandby02Failed = true;
		if (document.getElementById("mainRadio02ID"+channelID).value == document.getElementById("standbyRadio02ID"+channelID).value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio01ID"+channelID).value == document.getElementById("standbyRadio02ID"+channelID).value) radioStandby02Failed = true;
		// if (document.getElementById("standbyRadio02ID"+channelID).value == document.getElementById("standbyRadio02ID"+channelID).value) radioStandby02Failed = true;
		if (radioStandby02Failed){
			alert("Standby Rx Radio already in use, Please select another radio");
			return;
		}
	}

	if (document.getElementById("standbyRadio01ID"+channelID).value != 0)
	{
		var radioStandby02Failed = false;
		if (document.getElementById("mainRadio01ID"+channelID).value == document.getElementById("standbyRadio01ID"+channelID).value) radioStandby02Failed = true;
		if (document.getElementById("mainRadio02ID"+channelID).value == document.getElementById("standbyRadio01ID"+channelID).value) radioStandby02Failed = true;
		// if (document.getElementById("standbyRadio01ID"+channelID).value == document.getElementById("standbyRadio01ID"+channelID).value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio02ID"+channelID).value == document.getElementById("standbyRadio01ID"+channelID).value) radioStandby02Failed = true;
		if (radioStandby02Failed){
			alert("Standby Tx/TRx Radio already in use, Please select another radio");
			return
		}
	}


	if (document.getElementById("mainRadio02ID"+channelID).value != 0)
	{
		var radioStandby02Failed = false;
		if (document.getElementById("mainRadio01ID"+channelID).value == document.getElementById("mainRadio02ID"+channelID).value) radioStandby02Failed = true;
		// if (document.getElementById("mainRadio02ID"+channelID).value == document.getElementById("mainRadio02ID"+channelID).value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio01ID"+channelID).value == document.getElementById("mainRadio02ID"+channelID).value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio02ID"+channelID).value == document.getElementById("mainRadio02ID"+channelID).value) radioStandby02Failed = true;
		if (radioStandby02Failed){
			alert("Main Rx Radio already in use, Please select another radio");
			return
		}
	}


	if (document.getElementById("mainRadio01ID"+channelID).value != 0)
	{
		var radioStandby02Failed = false;
		// if (document.getElementById("mainRadio01ID"+channelID).value == document.getElementById("mainRadio01ID"+channelID).value) radioStandby02Failed = true;
		if (document.getElementById("mainRadio02ID"+channelID).value == document.getElementById("mainRadio01ID"+channelID).value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio01ID"+channelID).value == document.getElementById("mainRadio01ID"+channelID).value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio02ID"+channelID).value == document.getElementById("mainRadio01ID"+channelID).value) radioStandby02Failed = true;
		if (radioStandby02Failed){
			alert("Main Tx/TRx  Radio already in use, Please select another radio");
			return
		}
	}
	
	var jsonMessage = '{"menuID":"updateChannel",'
					+ '"channelName":"' + document.getElementById("channelName"+channelID).value + '",'
					+'"mainRadioType":"' + mainRadioType + '",'
					+'"mainRadio01ID":' + document.getElementById("mainRadio01ID"+channelID).value + ','
					+'"mainRadio02ID":' + document.getElementById("mainRadio02ID"+channelID).value + ','
					+'"standbyEnable":' + standbyEnable + ','
					+'"standbyRadioType":"' + standbyRadioType + '",'
					+'"standbyRadio01ID":' + document.getElementById("standbyRadio01ID"+channelID).value + ','
					+'"standbyRadio02ID":' + document.getElementById("standbyRadio02ID"+channelID).value + ','
					+'"mainRadioName":"' + document.getElementById("mainRadioName"+channelID).value + '",'
					+'"standbyRadioName":"' + document.getElementById("standbyRadioName"+channelID).value + '",'
					+'"channelID":' + channelID + ''
					+'}';

	if (ws.readyState == 1){
		var r = confirm("Please confirm to update channel: "+ document.getElementById("channelName"+channelID).value);
		if (r == true) {
			ws.send(jsonMessage);
				setTimeout(() => {location.reload();}, 1000);
		}else{
			
		}					
	}else{
		alert("Connection is closed...");
	}
}
function removeChannel(channelID)
{
	console.log("Remove ChannelID:",channelID,document.getElementById("channelName"+channelID).value); 
	var jsonMessage = '{"menuID":"removeChannel",'
					+'"channelID":' + channelID + ''
					+'}';
		if (ws.readyState == 1){
		var r = confirm("Please confirm to remove channel: "+ document.getElementById("channelName"+channelID).value);
		if (r == true) {
			ws.send(jsonMessage);
				setTimeout(() => {location.reload();}, 1000);
		}else{
			
		}					
	}else{
		alert("Connection is closed...");
	}}
function newChannel()
{
	console.log("Update ChannelID:",document.getElementById("channelName").value, document.getElementById("channelType").value,document.getElementById("mainRadio01ID").value,document.getElementById("mainRadio02ID").value);

	var mainRadioType = "";
	if (checkChannelName('',-1) == false)
	{
		var r = confirm("Please check channel name");
		if (r == true) 
		{
			document.getElementById("channelName").focus();
		}
		else
		{
			document.getElementById("channelName").focus();
		}	
		return false;
	}
	if (document.getElementById("channelType").value == 1) mainRadioType = "TRx";
	else if (document.getElementById("channelType").value == 2) mainRadioType = "Tx";
	else if (document.getElementById("channelType").value == 3) mainRadioType = "Rx";
	else if (document.getElementById("channelType").value == 4) mainRadioType = "Separate";
	else
	{
		// setTimeout(() => {location.reload();}, 2000);
		alert("Please select Tx-Rx Mode");
		return;
	}
	
	
	if (mainRadioType == 'Separate')
	{
		if (document.getElementById("mainRadio01ID").value == 0) {
			document.getElementById("mainRadio01ID").focus();
			var r = confirm("Please select Tx/TRx Main Radio");
			document.getElementById("channelName").focus();
			return false;
		}
		else if (document.getElementById("mainRadio02ID").value == 0) {
			document.getElementById("mainRadio02ID").focus();
			var r = confirm("Please select Rx Main Radio");
			return;
		}
	}
	else
	{		
		if (document.getElementById("mainRadio01ID").value == 0)
		{
			var length = document.getElementById("mainRadio01ID").length;
			console.log("length dropdown",length);
			document.getElementById("mainRadio01ID").focus();
			var r = confirm("Please select Tx/TRx Main Radio");
			return;
		}
	}


	var standbyRadioType = "";
	var standbyEnable = document.getElementById("standbyRadioChannelType").value == 0 ? 0 : 1;
	if (document.getElementById("standbyRadioChannelType").value == 1) standbyRadioType = "TRx";
	else if (document.getElementById("standbyRadioChannelType").value == 2) standbyRadioType = "Tx";
	else if (document.getElementById("standbyRadioChannelType").value == 3) standbyRadioType = "Rx";
	else if (document.getElementById("standbyRadioChannelType").value == 4) standbyRadioType = "Separate";
	else
	{
		standbyEnable = 0;
	}
	
	
	if (document.getElementById("channelName").value == '') return;
	
	console.log(document.getElementById("standbyRadio01ID").value)
	if (standbyRadioType == 'Separate')
	{
		if (document.getElementById("standbyRadio01ID").value == 0) {
			document.getElementById("standbyRadio01ID").focus();
			var r = confirm("Please select Tx/TRx Standby Radio");
			document.getElementById("channelName").focus();
			return false;
		}
		else if (document.getElementById("standbyRadio02ID").value == 0) {
			document.getElementById("standbyRadio02ID").focus();
			var r = confirm("Please select Rx Standby Radio");
			return;
		}
	}
	else if (standbyEnable == 1)
	{		
		if (document.getElementById("standbyRadio01ID").value == 0)
		{
			var length = document.getElementById("standbyRadio01ID").length;
			console.log("length dropdown",length);
			document.getElementById("standbyRadio01ID").focus();
			var r = confirm("Please select Tx/TRx Standby Radio");
			return;
		}
	}

	if (document.getElementById("standbyRadio02ID").value != 0)
	{
		var radioStandby02Failed = false;
		if (document.getElementById("mainRadio01ID").value == document.getElementById("standbyRadio02ID").value) radioStandby02Failed = true;
		if (document.getElementById("mainRadio02ID").value == document.getElementById("standbyRadio02ID").value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio01ID").value == document.getElementById("standbyRadio02ID").value) radioStandby02Failed = true;
		// if (document.getElementById("standbyRadio02ID").value == document.getElementById("standbyRadio02ID").value) radioStandby02Failed = true;
		if (radioStandby02Failed){
			alert("Standby Rx Radio already in use, Please select another radio");
			return;
		}
	}

	if (document.getElementById("standbyRadio01ID").value != 0)
	{
		var radioStandby02Failed = false;
		if (document.getElementById("mainRadio01ID").value == document.getElementById("standbyRadio01ID").value) radioStandby02Failed = true;
		if (document.getElementById("mainRadio02ID").value == document.getElementById("standbyRadio01ID").value) radioStandby02Failed = true;
		// if (document.getElementById("standbyRadio01ID").value == document.getElementById("standbyRadio01ID").value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio02ID").value == document.getElementById("standbyRadio01ID").value) radioStandby02Failed = true;
		if (radioStandby02Failed){
			alert("Standby Tx/TRx Radio already in use, Please select another radio");
			return
		}
	}


	if (document.getElementById("mainRadio02ID").value != 0)
	{
		var radioStandby02Failed = false;
		if (document.getElementById("mainRadio01ID").value == document.getElementById("mainRadio02ID").value) radioStandby02Failed = true;
		// if (document.getElementById("mainRadio02ID").value == document.getElementById("mainRadio02ID").value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio01ID").value == document.getElementById("mainRadio02ID").value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio02ID").value == document.getElementById("mainRadio02ID").value) radioStandby02Failed = true;
		if (radioStandby02Failed){
			alert("Main Rx Radio already in use, Please select another radio");
			return
		}
	}


	if (document.getElementById("mainRadio01ID").value != 0)
	{
		var radioStandby02Failed = false;
		// if (document.getElementById("mainRadio01ID").value == document.getElementById("mainRadio01ID").value) radioStandby02Failed = true;
		if (document.getElementById("mainRadio02ID").value == document.getElementById("mainRadio01ID").value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio01ID").value == document.getElementById("mainRadio01ID").value) radioStandby02Failed = true;
		if (document.getElementById("standbyRadio02ID").value == document.getElementById("mainRadio01ID").value) radioStandby02Failed = true;
		if (radioStandby02Failed){
			alert("Main Tx/TRx  Radio already in use, Please select another radio");
			return
		}
	}	
	
	var jsonMessage = '{"menuID":"addNewChannel",'
					+ '"channelName":"' + document.getElementById("channelName").value + '",'
					+'"mainRadioType":"' + mainRadioType + '",'
					+'"mainRadio01ID":' + document.getElementById("mainRadio01ID").value + ','
					+'"mainRadio02ID":' + document.getElementById("mainRadio02ID").value + ','
					+'"standbyEnable":' + standbyEnable + ','
					+'"standbyRadioType":"' + standbyRadioType + '",'
					+'"standbyRadio01ID":' + document.getElementById("standbyRadio01ID").value + ','
					+'"standbyRadio02ID":' + document.getElementById("standbyRadio02ID").value + ','
					+'"mainRadioName":"' + document.getElementById("mainRadioName").value + '",'
					+'"standbyRadioName":"' + document.getElementById("standbyRadioName").value + '"'
					+'}';
	if (ws.readyState == 1)
	{
		ws.send(jsonMessage)
		setTimeout(() => {location.reload();}, 2000);
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
 else{
//	 console.debug(message);
 }

}