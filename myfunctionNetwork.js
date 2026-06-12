// =============================
// Network Page (eth0 / wlan0 / Hotspot)
// =============================
var wsUri;
var ws;

// ---------- Boot ----------
WebSocketTest();

function WebSocketTest() {
  if (!("WebSocket" in window)) {
    alert("WebSocket NOT supported by your Browser!");
    return;
  }
  wsUri = "ws://" + location.host + ":1234";
  ws = new WebSocket(wsUri);

  ws.onopen = function () {
    ws.send('{"menuID":"getNetworkPage"}');
  };

  ws.onmessage = function (evt) {
    processMsg(evt.data);
  };

  ws.onclose = function () {
    alert("Connection is closed...");
  };
}

// --- Helpers: ใช้ชุดเดียวพอ ---
function setDisplay(id, show) {
	const el = document.getElementById(id);
	if (el) el.style.display = show ? "block" : "none";
  }
  function setVisibility(ids, visible) {
	ids.forEach(id => {
	  const el = document.getElementById(id);
	  if (el) el.style.visibility = visible ? "visible" : "hidden";
	});
  }
  function setValue(id, v) {
	const el = document.getElementById(id);
	if (el) el.value = (v ?? "");
  }
  function wifiApply() { wifiUpdateNetwork(); }
function splitNtpServers(s) {
  if (!s || typeof s !== "string") return [];
  return s.trim().split(/[\s,]+/).filter(Boolean).slice(0, 4);
}
function fillNtpInputsFromString(s) {
  const arr = splitNtpServers(s);
  setValue("ntpserver",  arr[0] || "");
  setValue("ntpserver1", arr[1] || "");
  setValue("ntpserver2", arr[2] || "");
  setValue("ntpserver3", arr[3] || "");
}

// ---------- Eth0 (Local Network) ----------
function fillEth0(obj) {
  // console.log("fillEth0",obj)
  setValue("dhcpmethod", obj.dhcpmethod);
  setValue("ipaddress",  obj.ipaddress);

  var isStatic = (String(document.getElementById("dhcpmethod").value) === "0");
  setDisplay("showIP", isStatic);
  setVisibility(["ipaddress","subnet","gateway","pridns","secdns"], isStatic);

  if (isStatic) {
    setValue("subnet",  obj.subnet);
    setValue("gateway", obj.gateway);
    setValue("pridns",  obj.pridns);
    setValue("secdns",  obj.secdns);
  }
  // ถ้าฝั่งเซิร์ฟเวอร์ส่ง ntpServer มา ก็เติม 4 ช่องให้ด้วย
  if (obj.ntpServer) fillNtpInputsFromString(obj.ntpServer);
}

// ใช้กับ <select id="dhcpmethod" ...> ของ eth0
function setdhcpmethod() {
  var isStatic = (String(document.getElementById("dhcpmethod").value) === "0");
  setDisplay("showIP", isStatic);
  setVisibility(["ipaddress","subnet","gateway","pridns","secdns"], isStatic);
}

function updateNetwork() {
	const payload = {
	  menuID: "updateLocalNetwork",
	  dhcpmethod: Number(document.getElementById("dhcpmethod").value),
	  ipaddress:  document.getElementById("ipaddress").value,
	  subnet:     document.getElementById("subnet").value,
	  gateway:    document.getElementById("gateway").value,
	  pridns:     document.getElementById("pridns").value,
	  secdns:     document.getElementById("secdns").value,
	  ntpServer:  [
		document.getElementById("ntpserver")?.value || "",
		document.getElementById("ntpserver1")?.value || "",
		document.getElementById("ntpserver2")?.value || "",
		document.getElementById("ntpserver3")?.value || ""
	  ].filter(Boolean).join(" "),
	  phyNetworkName: "eth0"
	};
	if (ws && ws.readyState === 1) {
	  ws.send(JSON.stringify(payload));
	  alert("Setting up local network...");
	} else {
	  alert("Connection is closed...");
	}
  }
  
// ---------- Wi-Fi (wlan0) ----------
function setWifiMethod() {
  var isStatic = (String(document.getElementById("wifi_dhcpmethod").value) === "0");
  setDisplay("wifi_showIP", isStatic);
  setVisibility(["wifi_ipaddress","wifi_subnet","wifi_gateway","wifi_pridns","wifi_secdns"], isStatic);
}
function fillWifi(obj) {
	// console.log("fillWifi",obj)
  setValue("wifi_dhcpmethod", obj.dhcpmethod);
  setValue("wifi_ipaddress",  obj.ipaddress || "");

  var isStatic = (String(document.getElementById("wifi_dhcpmethod").value) === "0");
  setDisplay("wifi_showIP", isStatic);
  setVisibility(["wifi_ipaddress","wifi_subnet","wifi_gateway","wifi_pridns","wifi_secdns"], isStatic);

  if (isStatic) {
    setValue("wifi_subnet",  obj.subnet  || "");
    setValue("wifi_gateway", obj.gateway || "");
    setValue("wifi_pridns",  obj.pridns  || "");
    setValue("wifi_secdns",  obj.secdns  || "");
  }
  if (obj.ntpServer) fillNtpInputsFromString(obj.ntpServer);
}
function wifiUpdateNetwork() {
  var dhcpmethod = document.getElementById("wifi_dhcpmethod").value;
  var ipaddress  = document.getElementById("wifi_ipaddress").value;
  var subnet     = document.getElementById("wifi_subnet").value;
  var gateway    = document.getElementById("wifi_gateway").value;
  var pridns     = document.getElementById("wifi_pridns").value;
  var secdns     = document.getElementById("wifi_secdns").value;

  var jsonMessage =
    '{"menuID":"updateLocalNetworkWifi","dhcpmethod":' + dhcpmethod +
    ',"ipaddress":"' + ipaddress +
    '","subnet":"'   + subnet +
    '","gateway":"'  + gateway +
    '","pridns":"'   + pridns +
    '","secdns":"'   + secdns +
    '","phyNetworkName":"wlan0"}';

  if (ws && ws.readyState === 1) {
    ws.send(jsonMessage);
    alert("Setting up Wi-Fi network...");
  } else {
    alert("Connection is closed...");
  }
}

// ==== Utilities ====
function hasOption(selId, value){
	var sel = document.getElementById(selId);
	if (!sel) return false;
	for (var i=0;i<sel.options.length;i++){
	  if (String(sel.options[i].value) === String(value)) return true;
	}
	return false;
  }
  function setDisplay(id, show){
	var el = document.getElementById(id);
	if (el) el.style.display = show ? "block" : "none";
  }
  function setVisibility(ids, visible){
	ids.forEach(function(id){
	  var el = document.getElementById(id);
	  if (el) el.style.visibility = visible ? "visible" : "hidden";
	});
  }
  
  // ==== Hotspot toggle (รองรับ "static"/"shared" และ 0/1) ====
  function setHotspotMethod(){
	var v = (document.getElementById("ap_dhcpmethod")?.value || "").toString().toLowerCase();
	var isStatic = (v === "0" || v === "static" || v === "manual");
	setDisplay("ap_showIP", isStatic);
	setVisibility(["ap_ipaddress","ap_subnet","ap_gateway","ap_pridns","ap_secdns"], isStatic);
  }
  
  // ==== ส่งค่า Hotspot เหมือน Local Network ====
  function hotspotApply(){
	var v = (document.getElementById("ap_dhcpmethod")?.value || "").toString().toLowerCase();
	// map → dhcpmethod: 0 = static/manual, 1 = shared/auto
	var dhcpmethod = (v === "0" || v === "static" || v === "manual") ? 0 : 1;
  
	var ipaddress = document.getElementById("ap_ipaddress")?.value || "";
	var subnet    = document.getElementById("ap_subnet")?.value || "";
	var gateway   = document.getElementById("ap_gateway")?.value || "";
	var pridns    = document.getElementById("ap_pridns")?.value || "";
	var secdns    = document.getElementById("ap_secdns")?.value || "";
	var ssid    = document.getElementById("ssid_hotspot")?.value || "";
	var password    = document.getElementById("password_hotspot")?.value || "";
  
	var jsonMessage =
	  '{"menuID":"updateLocalNetworkHotspot","dhcpmethod":'+ dhcpmethod +
	  ',"ipaddress":"'+ ipaddress +
	  '","subnet":"'+ subnet +
	  '","gateway":"'+ gateway +
	  '","pridns":"'+ pridns +
	  '","secdns":"'+ secdns +
	  '","ssid":"'+ ssid +
	  '","password":"'+ password +
	  '","phyNetworkName":"Hotspot"}';
  
	if (ws && ws.readyState === 1){
	  ws.send(jsonMessage);
	  alert("Setting up Hotspot network...");
	} else {
	  alert("Connection is closed...");
	}
  }
  
  // ==== เติมค่าจาก WebSocket (รองรับทั้ง 0/1 และ static/shared) ====
  function fillHotspot(obj){
	// console.log("fillHotspot",obj)
	// เลือก option ให้ตรงกับค่า dhcpmethod ที่ส่งมา
	var targetValue;
	if (String(obj.dhcpmethod) === "0") {
	  // ถ้ามี option "static" ให้เซ็ตเป็น static ไม่งั้นเซ็ตเป็น "0"
	  targetValue = hasOption("ap_dhcpmethod","static") ? "static" : "0";
	} else {
	  // ถ้ามี option "shared" ให้เซ็ตเป็น shared ไม่งั้นเซ็ตเป็น "1"
	  targetValue = hasOption("ap_dhcpmethod","shared") ? "shared" : "1";
	}
	var sel = document.getElementById("ap_dhcpmethod");
	if (sel) sel.value = targetValue;
  
	// toggle ช่องกรอก
	setHotspotMethod();
  
	// ใส่ค่า IP เมื่อเป็น static/manual
	if (String(obj.dhcpmethod) === "0"){
	  document.getElementById("ap_ipaddress").value = obj.ipaddress || "";
	  document.getElementById("ap_subnet").value    = obj.subnet    || "";
	  document.getElementById("ap_gateway").value   = obj.gateway   || "";
	  document.getElementById("ap_pridns").value    = obj.pridns    || "";
	  document.getElementById("ap_secdns").value    = obj.secdns    || "";
	  document.getElementById("ssid_hotspot").value    = obj.ssid    || "";
	  document.getElementById("password_hotspot").value    = obj.pwd    || "";
	}
  }
  
function hotspotUpdateNetwork() {
  var dhcpmethod = document.getElementById("ap_dhcpmethod").value;
  var ipaddress  = document.getElementById("ap_ipaddress").value;
  var subnet     = document.getElementById("ap_subnet").value;
  var gateway    = document.getElementById("ap_gateway").value;
  var pridns     = document.getElementById("ap_pridns").value;
  var secdns     = document.getElementById("ap_secdns").value;

  var jsonMessage =
    '{"menuID":"updateLocalNetwork","dhcpmethod":' + dhcpmethod +
    ',"ipaddress":"' + ipaddress +
    '","subnet":"'   + subnet +
    '","gateway":"'  + gateway +
    '","pridns":"'   + pridns +
    '","secdns":"'   + secdns +
    '","phyNetworkName":"Hotspot"}';

  if (ws && ws.readyState === 1) {
    ws.send(jsonMessage);
    alert("Setting up Hotspot network...");
  } else {
    alert("Connection is closed...");
  }
}

// ---------- Common Actions ----------
function restartnetwork() {
  var jsonMessage = '{"menuID":"restartnetwork"}';
  if (ws && ws.readyState === 1) {
    ws.send(jsonMessage);
    alert("Restarting local network...");
  } else {
    alert("ERROR! Connection is closed...");
  }
}

function updateNTPServer() {
  // รองรับ 4 ช่อง
  var s0 = document.getElementById("ntpserver")?.value || "";
  var s1 = document.getElementById("ntpserver1")?.value || "";
  var s2 = document.getElementById("ntpserver2")?.value || "";
  var s3 = document.getElementById("ntpserver3")?.value || "";
  var ntpJoined = [s0, s1, s2, s3].filter(Boolean).join(" ");

  var jsonMessage = JSON.stringify({
    menuID: "updateNTPServer",
    ntpServer: ntpJoined    // รักษา format เดิม (string) เพื่อเข้ากันได้
  });

  if (ws && ws.readyState === 1) {
    ws.send(jsonMessage);
    alert("Setting up NTP...");
  } else {
    alert("Connection is closed...");
  }
}

// ---------- Message Dispatcher ----------
function processMsg(message) {
  var obj = JSON.parse(message);

  if (obj.menuID == "network") {
	// console.log("obj.phyNetworkName",obj.phyNetworkName)
    if (obj.phyNetworkName == "eth0") {
      fillEth0(obj);
    } else if (obj.phyNetworkName == "wlan0") {
      fillWifi(obj);
    } else if (obj.phyNetworkName == "Hotspot") {
      fillHotspot(obj);
    }
  }
  else if(obj.menuID == "configureHotspot"){
	fillHotspot(obj);
  }
  else if (obj.menuID == "update") {
    var updateStatus = obj.updateStatus;
    if (updateStatus == 2) {
      alert("System updated, Please restart your system.");
    }
  }
  else if (obj.menuID == "lnaData") {
    if (obj.lna_a_failed == 1) alert("LNA-A Failed!");
    if (obj.lna_b_failed == 1) alert("LNA-B Failed!");
  }
  else if (obj.menuID == "broadcastLocalTime") {
    setValue("currentTime", obj.currentTime);
    setValue("currentDate", obj.currentDate);
  }
}

// ---------- Initial UI sync ----------
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("dhcpmethod"))       setdhcpmethod();
  if (document.getElementById("wifi_dhcpmethod"))  setWifiMethod();
  if (document.getElementById("ap_dhcpmethod"))    setHotspotMethod();
});
