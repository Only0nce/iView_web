<!doctype html>
<html>
<head>
  <title>IFZ ED137 Converter</title>
  <meta name="description" content="Professional Audio Streamer" />
  <meta name="keywords" content="ED137, SIP" />
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <link rel="stylesheet" type="text/css" href="style.css" title="style" />
  <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
  <script src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery-latest.min.js"></script>
  <script type="text/javascript" src="jquery-ui.js"></script>
  <script type = "text/javascript">
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
			  var jsonDataTest
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
		 ws.send(jsonMessage);
		 
	 }
	  
	  function reconnect(trxid){
		 var jsonMessage = '{"command":"trxReconnect", "trxID":' + trxid + '}';
		 console.debug(jsonMessage);
		 ws.send(jsonMessage);
		 
	 }
	  
	 function processMsg(message){
//		 var obj = JSON.parse('{"menuID":"input", "name":"S4_1", "inputgain":1, "outputgain":10}');
//		 var obj = JSON.parse('{"menuID":"nodeCfg", "nodeID":2, "nodeType":0, "nodeName":"t6tr1", "ipAddress":"10.45.110.11", "sipPort":"5060", "active":1}');
//		 var obj = JSON.parse('{"menuID":"connState", "nodeID":2, "connStatus":"Disconnected", "connDuration":"0", "trxStatus":"--"}');
		 var obj = JSON.parse(message);
//		 console.debug(message)
		 if (obj.menuID == "input"){
			 document.getElementById("localname").value = obj.name;
			 document.getElementById("inputgain").value = obj.inputgain;
			 document.getElementById("outputgain").value = obj.outputgain;
		 }else if(obj.menuID == "nodeCfg"){
			 if (obj.nodeID == 1){
				 document.getElementById("node1type").value = obj.nodeType;
				 document.getElementById("node1Name").value = obj.nodeName;
				 document.getElementById("node1Address").value = obj.ipAddress;
				 document.getElementById("node1SipPort").value = obj.sipPort;
				 document.getElementById("node1Active").value = obj.active;
			 }else if(obj.nodeID == 2){
				 document.getElementById("node2type").value = obj.nodeType;
				 document.getElementById("node2Name").value = obj.nodeName;
				 document.getElementById("node2Address").value = obj.ipAddress;
				 document.getElementById("node2SipPort").value = obj.sipPort;
				 document.getElementById("node2Active").value = obj.active;
			 }
		 }else if(obj.menuID == "connState"){
			 if (obj.nodeID == 1){
				 document.getElementById("node1Conn").value = obj.connStatus;
				 document.getElementById("node1Duration").value = obj.connDuration;
				 document.getElementById("node1TRx").value = obj.trxStatus;
			 }else if(obj.nodeID == 2){
				 document.getElementById("node2Conn").value = obj.connStatus;
				 document.getElementById("node2Duration").value = obj.connDuration;
				 document.getElementById("node2TRx").value = obj.trxStatus;
			 }
		 }
		 
	 }
  </script>	
	
</head>

<body>
	<div id="header">
		<div id="logo">
			<div id="logo_text">
			  	<h1><a href="index.php"><span class="logo_colour">IFZ ED137 Converter</span></a></h1>
			</div>
		</div>
		<div id="menubar">
			<ul id="menu">
				<li class="selected"><a href="index.php">Home</a></li>
				<li><a href="network.php">Network</a></li>
				<li><a href="update.php">UPDATE</a></li>
				<li><a href="logout.php">LOGOUT</a></li>
			</ul>
		</div>
	</div>
	
	<div id="site_content">
	<div class="sidebar">
        <h3>Host Configuration</h3>
        
        
      </div>
	
	
	<div id="content">
        <h3>Client  Configuratoin</h3>
        <div class="selected_list">
		    <h4>Node ID 1:</h4>
	    </div>
		
		
      </div>
	
	
	</div>
</body>
</html>