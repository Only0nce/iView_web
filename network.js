// JavaScript Document
var wsUri;
var ws;
var latitude = 0;
var longitude = 0;
WebSocketTest();
function WebSocketTest() {

	if ("WebSocket" in window) {
	   // Let us open a web socket
	   wsUri = "ws://" + location.host + ":1234";
	   ws = new WebSocket(wsUri);

	   ws.onopen = function() {
		  // Web Socket is connected, send data using send()
		  ws.send("web:network");
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
function opengooglemap()
{
	window.open("http://maps.google.com/?q=" + latitude + "," + longitude);
}
function processMsg(message){
	//console.log(message)
	var obj = JSON.parse(message);
	
	if(obj.menuID == "network")
	{
		console.log(message,obj.phyNetworkName)
		if (obj.phyNetworkName == "eth0"){
			document.getElementById("dhcpmethod").value = obj.dhcpmethod;
			document.getElementById("ipaddress").value = obj.ipaddress;
			document.getElementById("subnet").value = obj.subnet;
			document.getElementById("gateway").value = obj.gateway;
			document.getElementById("pridns").value = obj.pridns;
			document.getElementById("secdns").value = obj.secdns;
			document.getElementById("openvpnEnable").value = obj.vpnEnable;
			if (document.getElementById("dhcpmethod").value != 0){
				document.getElementById("showIP").style.display = "none";
				document.getElementById("ipaddress").style.visibility = "hidden";
				document.getElementById("subnet").style.visibility = "hidden";
				document.getElementById("gateway").style.visibility = "hidden";
				document.getElementById("pridns").style.visibility = "hidden";
				document.getElementById("secdns").style.visibility = "hidden";
			}
			else {
				document.getElementById("showIP").style.display = "block";
				document.getElementById("ipaddress").style.visibility = "visible";
				document.getElementById("subnet").style.visibility = "visible";
				document.getElementById("gateway").style.visibility = "visible";
				document.getElementById("pridns").style.visibility = "visible";
				document.getElementById("secdns").style.visibility = "visible";
			}
		}
		else if (obj.phyNetworkName == "eth1"){
			document.getElementById("dhcpmethod1").value = obj.dhcpmethod;
			document.getElementById("ipaddress1").value = obj.ipaddress;
			document.getElementById("subnet1").value = obj.subnet;
			document.getElementById("gateway1").value = obj.gateway;
			document.getElementById("pridns1").value = obj.pridns;
			document.getElementById("secdns1").value = obj.secdns;
			if (document.getElementById("dhcpmethod1").value != 0){
				document.getElementById("ipaddress1").style.visibility = "hidden";
				document.getElementById("subnet1").style.visibility = "hidden";
				document.getElementById("gateway1").style.visibility = "hidden";
				document.getElementById("pridns1").style.visibility = "hidden";
				document.getElementById("secdns1").style.visibility = "hidden";
			}
			else {
				document.getElementById("ipaddress1").style.visibility = "visible";
				document.getElementById("subnet1").style.visibility = "visible";
				document.getElementById("gateway1").style.visibility = "visible";
				document.getElementById("pridns1").style.visibility = "visible";
				document.getElementById("secdns1").style.visibility = "visible";
			}
		}
	}
	else if(obj.menuID == "broadcastLocalTime")
 	{
		 document.getElementById("currentTime").value = obj.currentTime;
		 document.getElementById("currentDate").value = obj.currentDate;
 	}
 	else  if (obj.menuID == "input")
	{
		document.title = obj.deviceName;
		document.getElementById("headName").innerHTML = obj.deviceName;
	}
	else  if (obj.menuID == "internetVpn")
	{

		document.getElementById("vpnServerAddr").value = obj.vpnServerAddress;
		document.getElementById("vpnLocalAddr").value = obj.vpnClientAddress;
		//document.getElementById("vpnConnected").value = obj.vpnConnected;
	}
	else  if (obj.menuID == "modemInfo")
	{
		
		document.getElementById("accessTech").value = obj.accessTech;
		document.getElementById("LteStatus").value = obj.StatusState;
		document.getElementById("signalQuality").value = obj.signalQuality;
		document.getElementById("OperationName").value = obj.operationID;		
	}
	else  if (obj.menuID == "GPS_Data")
	{
		
		document.getElementById("GPS_Date").value = obj.GPS_Date;
		document.getElementById("GPS_Time").value = obj.GPS_Time;
		document.getElementById("GPS_Lat").value = obj.GPS_Lat;
		document.getElementById("GPS_Long").value = obj.GPS_Long;		
		document.getElementById("GPS_Alt").value = obj.GPS_Alt;
		document.getElementById("GPS_SatUse").value = obj.GPS_SatUse + "/" + obj.GPS_Sat;
		document.getElementById("GPS_Speed").value = obj.GPS_Speed;
		document.getElementById("map").style.display = "contents";
		latitude = obj.GPS_Lat;
		longitude = obj.GPS_Long;		
	}

}

function setVpnEnable()
{
	document.getElementById("updateVpnEnable").style.display = "contents";
}

function vpnupdatefile()
{
	var jsonMessage = '{"command":"updateFirmware"}';
	if (ws.readyState == 1){
		ws.send(jsonMessage);
		alert("Setting up VPN File config..."); 
	}else{
		alert("Connection is closed...");
	}
}

function updateVpnEnable()
{
	var openvpnEnable = document.getElementById("openvpnEnable").value;
	var jsonMessage = '{"command":"updateVpnEnable", "vpnEnable":' + openvpnEnable +'}';
	if (ws.readyState == 1){
		ws.send(jsonMessage);
		alert("Setting up VPN..."); 
	}else{
		alert("Connection is closed...");
	}
}
function setdhcpmethod(eth){
	if (eth == "eth0")
	{
		if (document.getElementById("dhcpmethod").value != 0){
			document.getElementById("showIP").style.display = "none";
			document.getElementById("ipaddress").style.visibility = "hidden";
			document.getElementById("subnet").style.visibility = "hidden";
			document.getElementById("gateway").style.visibility = "hidden";
			document.getElementById("pridns").style.visibility = "hidden";
			document.getElementById("secdns").style.visibility = "hidden";
		}
		else {
			document.getElementById("showIP").style.display = "block";
			document.getElementById("ipaddress").style.visibility = "visible";
			document.getElementById("subnet").style.visibility = "visible";
			document.getElementById("gateway").style.visibility = "visible";
			document.getElementById("pridns").style.visibility = "visible";
			document.getElementById("secdns").style.visibility = "visible";
		}
	}
	else
	{
		if (document.getElementById("dhcpmethod1").value != 0){
			document.getElementById("ipaddress1").style.visibility = "hidden";
			document.getElementById("subnet1").style.visibility = "hidden";
			document.getElementById("gateway1").style.visibility = "hidden";
			document.getElementById("pridns1").style.visibility = "hidden";
			document.getElementById("secdns1").style.visibility = "hidden";
		}
		else {
			document.getElementById("ipaddress1").style.visibility = "visible";
			document.getElementById("subnet1").style.visibility = "visible";
			document.getElementById("gateway1").style.visibility = "visible";
			document.getElementById("pridns1").style.visibility = "visible";
			document.getElementById("secdns1").style.visibility = "visible";
		}
	}
}
function restartnetwork(){
	var jsonMessage = '{"command":"restartnetwork"}';
	console.debug(jsonMessage);
	if (ws.readyState == 1){
		ws.send(jsonMessage);
		alert("Restarting local network..."); 
	}else{
		alert("Connection is closed...");
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
function updateNetwork(phyNetworkName)
{
	if(phyNetworkName == "eth0"){
		var dhcpmethod = document.getElementById("dhcpmethod").value;
		var ipaddress = document.getElementById("ipaddress").value;
		var subnet = document.getElementById("subnet").value;
		var gateway = document.getElementById("gateway").value;
		var pridns = document.getElementById("pridns").value;
		var secdns = document.getElementById("secdns").value;
	}else if(phyNetworkName == "eth1"){
		var dhcpmethod = document.getElementById("dhcpmethod1").value;
		var ipaddress = document.getElementById("ipaddress1").value;
		var subnet = document.getElementById("subnet1").value;
		var gateway = document.getElementById("gateway1").value;
		var pridns = document.getElementById("pridns1").value;
		var secdns = document.getElementById("secdns1").value;
	}
	var jsonMessage = '{"command":"updateLocalNetwork", "dhcpmethod":' + dhcpmethod + ', "ipaddress":"' + ipaddress + '", "subnet":"' + subnet + '", "gateway":"' + gateway + '", "pridns":"' + pridns + '", "secdns":"' + secdns + '", "phyNetworkName":"' + phyNetworkName + '"}';
	console.debug(jsonMessage);
	if (ws.readyState == 1)
	{
		ws.send(jsonMessage);
		alert("Setting up local network..."); 
	}
	else{
		alert("Connection is closed...");
	}
	
	
}

