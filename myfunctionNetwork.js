// =============================
// Network Page (eth0 / wlan0 / Hotspot)
// Hardware feature-aware version
// =============================
var wsUri;
var ws;

var IVIEW_FEATURES = window.iviewFeatures || {};
var HAS_WIFI = !!IVIEW_FEATURES.wifi;
var HAS_HOTSPOT = !!IVIEW_FEATURES.hotspot;
var HAS_5G = !!IVIEW_FEATURES.cellular5g;

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

// ---------- Feature Guards ----------
function featureUnavailable(featureName) {
  alert(featureName + " is not available on this hardware profile.");
}

function canUseWifi(showAlert) {
  if (HAS_WIFI) return true;
  if (showAlert) featureUnavailable("Wi-Fi");
  return false;
}

function canUseHotspot(showAlert) {
  if (HAS_HOTSPOT) return true;
  if (showAlert) featureUnavailable("Hotspot");
  return false;
}

// ---------- Helpers ----------
function byId(id) {
  return document.getElementById(id);
}

function setDisplay(id, show) {
  var el = byId(id);
  if (el) el.style.display = show ? "block" : "none";
}

function setVisibility(ids, visible) {
  ids.forEach(function (id) {
    var el = byId(id);
    if (el) el.style.visibility = visible ? "visible" : "hidden";
  });
}

function setValue(id, v) {
  var el = byId(id);
  if (el) el.value = (v ?? "");
}

function getValue(id) {
  var el = byId(id);
  return el ? el.value : "";
}

function sendPayload(payload, successText) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
    if (successText) alert(successText);
    return true;
  }

  alert("Connection is closed...");
  return false;
}

function hasOption(selId, value) {
  var sel = byId(selId);
  if (!sel) return false;
  for (var i = 0; i < sel.options.length; i += 1) {
    if (String(sel.options[i].value) === String(value)) return true;
  }
  return false;
}

function splitNtpServers(s) {
  if (!s || typeof s !== "string") return [];
  return s.trim().split(/[\s,]+/).filter(Boolean).slice(0, 4);
}

function fillNtpInputsFromString(s) {
  var arr = splitNtpServers(s);
  setValue("ntpserver", arr[0] || "");
  setValue("ntpserver1", arr[1] || "");
  setValue("ntpserver2", arr[2] || "");
  setValue("ntpserver3", arr[3] || "");
}

// ---------- Eth0 (Local Network) ----------
function fillEth0(obj) {
  setValue("dhcpmethod", obj.dhcpmethod);
  setValue("ipaddress", obj.ipaddress);

  var methodEl = byId("dhcpmethod");
  var isStatic = methodEl && String(methodEl.value) === "0";
  setDisplay("showIP", isStatic);
  setVisibility(["ipaddress", "subnet", "gateway", "pridns", "secdns"], isStatic);

  if (isStatic) {
    setValue("subnet", obj.subnet);
    setValue("gateway", obj.gateway);
    setValue("pridns", obj.pridns);
    setValue("secdns", obj.secdns);
  }

  if (obj.ntpServer) fillNtpInputsFromString(obj.ntpServer);
}

function setdhcpmethod() {
  var methodEl = byId("dhcpmethod");
  var isStatic = methodEl && String(methodEl.value) === "0";
  setDisplay("showIP", isStatic);
  setVisibility(["ipaddress", "subnet", "gateway", "pridns", "secdns"], isStatic);
}

function updateNetwork() {
  var payload = {
    menuID: "updateLocalNetwork",
    dhcpmethod: Number(getValue("dhcpmethod")),
    ipaddress: getValue("ipaddress"),
    subnet: getValue("subnet"),
    gateway: getValue("gateway"),
    pridns: getValue("pridns"),
    secdns: getValue("secdns"),
    ntpServer: [
      getValue("ntpserver"),
      getValue("ntpserver1"),
      getValue("ntpserver2"),
      getValue("ntpserver3")
    ].filter(Boolean).join(" "),
    phyNetworkName: "eth0"
  };

  sendPayload(payload, "Setting up local network...");
}

// ---------- Wi-Fi (wlan0) ----------
function setWifiMethod() {
  if (!canUseWifi(false)) return;

  var methodEl = byId("wifi_dhcpmethod");
  var isStatic = methodEl && String(methodEl.value) === "0";
  setDisplay("wifi_showIP", isStatic);
  setVisibility(["wifi_ipaddress", "wifi_subnet", "wifi_gateway", "wifi_pridns", "wifi_secdns"], isStatic);
}

function fillWifi(obj) {
  if (!canUseWifi(false)) return;

  setValue("wifi_dhcpmethod", obj.dhcpmethod);
  setValue("wifi_ipaddress", obj.ipaddress || "");

  var methodEl = byId("wifi_dhcpmethod");
  var isStatic = methodEl && String(methodEl.value) === "0";
  setDisplay("wifi_showIP", isStatic);
  setVisibility(["wifi_ipaddress", "wifi_subnet", "wifi_gateway", "wifi_pridns", "wifi_secdns"], isStatic);

  if (isStatic) {
    setValue("wifi_subnet", obj.subnet || "");
    setValue("wifi_gateway", obj.gateway || "");
    setValue("wifi_pridns", obj.pridns || "");
    setValue("wifi_secdns", obj.secdns || "");
  }

  if (obj.ntpServer) fillNtpInputsFromString(obj.ntpServer);
}

function wifiApply() {
  wifiUpdateNetwork();
}

function wifiUpdateNetwork() {
  if (!canUseWifi(true)) return;

  var payload = {
    menuID: "updateLocalNetworkWifi",
    dhcpmethod: Number(getValue("wifi_dhcpmethod")),
    ipaddress: getValue("wifi_ipaddress"),
    subnet: getValue("wifi_subnet"),
    gateway: getValue("wifi_gateway"),
    pridns: getValue("wifi_pridns"),
    secdns: getValue("wifi_secdns"),
    phyNetworkName: "wlan0"
  };

  sendPayload(payload, "Setting up Wi-Fi network...");
}

// ---------- Hotspot (AP) ----------
function setHotspotMethod() {
  if (!canUseHotspot(false)) return;

  var v = (getValue("ap_dhcpmethod") || "").toString().toLowerCase();
  var isStatic = (v === "0" || v === "static" || v === "manual");
  setDisplay("ap_showIP", isStatic);
  setVisibility(["ap_ipaddress", "ap_subnet", "ap_gateway", "ap_pridns", "ap_secdns"], isStatic);
}

function hotspotApply() {
  if (!canUseHotspot(true)) return;

  var v = (getValue("ap_dhcpmethod") || "").toString().toLowerCase();
  var dhcpmethod = (v === "0" || v === "static" || v === "manual") ? 0 : 1;

  var payload = {
    menuID: "updateLocalNetworkHotspot",
    dhcpmethod: dhcpmethod,
    ipaddress: getValue("ap_ipaddress"),
    subnet: getValue("ap_subnet"),
    gateway: getValue("ap_gateway"),
    pridns: getValue("ap_pridns"),
    secdns: getValue("ap_secdns"),
    ssid: getValue("ssid_hotspot"),
    password: getValue("password_hotspot"),
    phyNetworkName: "Hotspot"
  };

  sendPayload(payload, "Setting up Hotspot network...");
}

function fillHotspot(obj) {
  if (!canUseHotspot(false)) return;

  var targetValue;
  if (String(obj.dhcpmethod) === "0") {
    targetValue = hasOption("ap_dhcpmethod", "static") ? "static" : "0";
  } else {
    targetValue = hasOption("ap_dhcpmethod", "shared") ? "shared" : "1";
  }

  var sel = byId("ap_dhcpmethod");
  if (sel) sel.value = targetValue;

  setHotspotMethod();

  if (String(obj.dhcpmethod) === "0") {
    setValue("ap_ipaddress", obj.ipaddress || "");
    setValue("ap_subnet", obj.subnet || "");
    setValue("ap_gateway", obj.gateway || "");
    setValue("ap_pridns", obj.pridns || "");
    setValue("ap_secdns", obj.secdns || "");
    setValue("ssid_hotspot", obj.ssid || "");
    setValue("password_hotspot", obj.pwd || obj.password || "");
  }
}

function hotspotUpdateNetwork() {
  hotspotApply();
}

// ---------- Common Actions ----------
function restartnetwork() {
  var payload = { menuID: "restartnetwork" };
  sendPayload(payload, "Restarting local network...");
}

function updateNTPServer() {
  var ntpJoined = [
    getValue("ntpserver"),
    getValue("ntpserver1"),
    getValue("ntpserver2"),
    getValue("ntpserver3")
  ].filter(Boolean).join(" ");

  var payload = {
    menuID: "updateNTPServer",
    ntpServer: ntpJoined
  };

  sendPayload(payload, "Setting up NTP...");
}

// ---------- Message Dispatcher ----------
function processMsg(message) {
  var obj;
  try {
    obj = JSON.parse(message);
  } catch (err) {
    console.warn("Invalid JSON from WebSocket:", err, message);
    return;
  }

  if (obj.menuID == "network") {
    if (obj.phyNetworkName == "eth0") {
      fillEth0(obj);
    } else if (obj.phyNetworkName == "wlan0") {
      if (HAS_WIFI) fillWifi(obj);
    } else if (obj.phyNetworkName == "Hotspot") {
      if (HAS_HOTSPOT) fillHotspot(obj);
    }
  }
  else if (obj.menuID == "configureHotspot") {
    if (HAS_HOTSPOT) fillHotspot(obj);
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
  if (byId("dhcpmethod")) setdhcpmethod();
  if (HAS_WIFI && byId("wifi_dhcpmethod")) setWifiMethod();
  if (HAS_HOTSPOT && byId("ap_dhcpmethod")) setHotspotMethod();
});
