// Device profile page for opening remote CAL pages.
(function () {
  "use strict";

  var ws = null;
  var reconnectTimer = null;

  // Optional fallback mapping when payload has no IP.
  // Example: 1: "192.168.1.101"
  var DEVICE_IP_BY_ID = {
  };

  // Optional fallback by station name.
  // Example: "TX-01": "192.168.1.101"
  var DEVICE_IP_BY_NAME = {
  };

  var DEVICE_CAL_PATH = "/check_login_cal.php";
  var DEVICE_CAL_PROTOCOL = "http";
  // Login endpoint on remote device (old flow: check_login_cal.php).
  var DEVICE_CAL_LOGIN_ENABLED = true;
  var DEVICE_CAL_LOGIN_PATH = "/check_login_cal.php";
  var DEVICE_CAL_LOGIN_USER = "admin";
  var DEVICE_CAL_LOGIN_PASS = "password";
  // Fallback for devices that still use HTTP Basic Auth.
  // Leave username empty to disable URL-embedded credentials.
  var DEVICE_CAL_BASIC_USER = "";
  var DEVICE_CAL_BASIC_PASS = "";

  var deviceState = {};

  function init() {
    connectWebSocket();
  }

  function connectWebSocket() {
    if (!("WebSocket" in window)) {
      alert("WebSocket NOT supported by your browser.");
      return;
    }

    var wsUri = "ws://" + location.host + ":1234";
    ws = new WebSocket(wsUri);

    ws.onopen = function () {
      ws.send('{"menuID":"getMonitorPage"}');
    };

    ws.onmessage = function (evt) {
      processMessage(evt.data);
    };

    ws.onclose = function () {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
      }
      reconnectTimer = setTimeout(connectWebSocket, 3000);
    };
  }

  function processMessage(message) {
    var obj = null;
    try {
      obj = JSON.parse(message);
    }
    catch (error) {
      return;
    }

    if (!obj || !obj.menuID) {
      return;
    }

    if (obj.menuID === "view_transmitter_list") {
      updateCardFromPayload(obj);
    }
    else if (obj.menuID === "listTransmitter") {
      updateCardFromPayload(obj);
    }
  }

  function resolveDeviceId(obj) {
    var keys = ["webindex", "index", "databaseId", "radioID", "id"];
    var i;

    for (i = 0; i < keys.length; i++) {
      var value = parseInt(obj[keys[i]], 10);
      if (Number.isFinite(value) && value > 0 && document.getElementById("cardTxId" + value)) {
        return value;
      }
    }

    return 0;
  }

  function updateCardFromPayload(obj) {
    var id = resolveDeviceId(obj);
    if (!id) {
      return;
    }

    var card = document.getElementById("cardTxId" + id);
    if (!card) {
      return;
    }

    var stationName = String(obj.stationName || "Device " + id);
    var frequency = formatFrequency(obj.frequency);
    var visible = (obj.visible === undefined) ? true : (obj.visible === true || obj.visible === 1 || obj.visible === "1");
    var connected = (obj.connectionStatus === undefined) ? true : (obj.connectionStatus === true || obj.connectionStatus === 1 || obj.connectionStatus === "1");

    var ip = resolveDeviceIp(id, stationName, obj.ipAddress || obj.ipaddress || obj.host || obj.address);

    // console.log("Updating device card:",obj , " each value", { id, stationName, frequency, ip, visible, connected });   
    deviceState[id] = {
      name: stationName,
      frequency: frequency,
      ip: ip,
      connected: connected,
      visible: visible
    };

    card.style.display = visible ? "block" : "none";
    card.classList.toggle("connected", connected);

    setText("cardNameId" + id, stationName);
    setText("cardFreqId" + id, "Frequency: " + frequency);
    setText("cardIpId" + id, ip ? ("IP: " + ip) : "IP: Not configured");
    setText("cardStatusId" + id, connected ? "Online" : "Offline");

    card.dataset.deviceIp = ip || "";
    card.dataset.deviceName = stationName;
  }

  function setText(elementId, text) {
    var element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
    }
  }

  function formatFrequency(freqHz) {
    var numeric = Number(freqHz);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return "-";
    }
    return (numeric / 1000000).toFixed(4) + " MHz";
  }

  function resolveDeviceIp(id, stationName, payloadIp) {
    var fromPayload = normalizeHost(payloadIp);
    if (fromPayload) {
      return fromPayload;
    }

    var fromById = normalizeHost(DEVICE_IP_BY_ID[id]);
    if (fromById) {
      return fromById;
    }

    var fromByName = normalizeHost(DEVICE_IP_BY_NAME[stationName]);
    if (fromByName) {
      return fromByName;
    }

    if (deviceState[id] && deviceState[id].ip) {
      return deviceState[id].ip;
    }

    return "";
  }

  function normalizeHost(rawValue) {
    if (!rawValue) {
      return "";
    }

    var value = String(rawValue).trim();
    if (!value) {
      return "";
    }

    if (/^https?:\/\//i.test(value)) {
      try {
        return new URL(value).host;
      }
      catch (error) {
        return "";
      }
    }

    return value.replace(/^\/+/, "").replace(/\/.*$/, "");
  }

  function buildCalUrl(hostOrUrl) {
    if (!hostOrUrl) {
      return "";
    }

    if (/^https?:\/\//i.test(hostOrUrl)) {
      return hostOrUrl.replace(/\/+$/, "") + DEVICE_CAL_PATH;
    }

    return DEVICE_CAL_PROTOCOL + "://" + hostOrUrl.replace(/\/+$/, "") + DEVICE_CAL_PATH;
  }

  function buildDeviceOrigin(hostOrUrl) {
    if (!hostOrUrl) {
      return "";
    }

    if (/^https?:\/\//i.test(hostOrUrl)) {
      try {
        var parsedUrl = new URL(hostOrUrl);
        return parsedUrl.origin;
      }
      catch (error) {
        return "";
      }
    }

    return DEVICE_CAL_PROTOCOL + "://" + hostOrUrl.replace(/\/+$/, "");
  }

  function buildLoginUrl(hostOrUrl, calUrl) {
    var origin = buildDeviceOrigin(hostOrUrl);
    if (!origin) {
      return "";
    }

    try {
      var loginUrl = new URL(origin + DEVICE_CAL_LOGIN_PATH);
      if (calUrl) {
        loginUrl.searchParams.set("next", calUrl);
        loginUrl.searchParams.set("redirect", calUrl);
        loginUrl.searchParams.set("redirect_url", calUrl);
        loginUrl.searchParams.set("returnUrl", calUrl);
      }
      return loginUrl.toString();
    }
    catch (error) {
      return "";
    }
  }

  function escapeHtmlAttr(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function openCalWithLogin(hostOrUrl, calUrl) {
    var loginUrl = buildLoginUrl(hostOrUrl, calUrl);
    if (!loginUrl) {
      return false;
    }

    var username = String(DEVICE_CAL_LOGIN_USER || "").trim();
    if (!username) {
      return false;
    }

    var password = String(DEVICE_CAL_LOGIN_PASS || "");
    var popup = window.open("", "_blank");
    if (!popup) {
      alert("Popup blocked. Please allow popups, then try again.");
      return true;
    }

    var fields = [
      { name: "username", value: username },
      { name: "password", value: password },
      { name: "user", value: username },
      { name: "pass", value: password },
      { name: "remoteUser", value: username },
      { name: "remotePass", value: password },
      { name: "next", value: calUrl },
      { name: "redirect", value: calUrl },
      { name: "redirect_url", value: calUrl },
      { name: "returnUrl", value: calUrl }
    ];

    var inputHtml = fields.map(function (item) {
      return '<input type="hidden" name="' + escapeHtmlAttr(item.name) + '" value="' + escapeHtmlAttr(item.value) + '">';
    }).join("");

    var html = ""
      + "<!doctype html><html><head><meta charset=\"utf-8\"><title>Opening CAL...</title></head><body>"
      + "<form id=\"autoLoginForm\" method=\"post\" action=\"" + escapeHtmlAttr(loginUrl) + "\">"
      + inputHtml
      + "</form>"
      + "<p>Signing in to remote device...</p>"
      + "<script>document.getElementById('autoLoginForm').submit();<\/script>"
      + "<noscript><button type=\"submit\" form=\"autoLoginForm\">Continue</button></noscript>"
      + "</body></html>";

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    return true;
  }

  function applyCalCredentials(targetUrl) {
    if (!targetUrl) {
      return "";
    }

    var username = String(DEVICE_CAL_BASIC_USER || "").trim();
    if (!username) {
      return targetUrl;
    }

    var password = String(DEVICE_CAL_BASIC_PASS || "");
    try {
      var url = new URL(targetUrl);
      url.username = username;
      url.password = password;
      return url.toString();
    }
    catch (error) {
      return "";
    }
  }

function openDeviceCal(id) {
  var card = document.getElementById("cardTxId" + id);
  if (!card) {
    return;
  }

  var ip = (card.dataset.deviceIp || "").trim();
  if (!ip) {
    alert("IP of this device is not available. Please set mapping in cal.js.");
    return;
  }

  // เช็คสถานะจาก deviceState ที่ WebSocket อัปเดตไว้
  var state = deviceState[id];
  if (!state || !state.connected) {
    var name = (state && state.name) ? state.name : "Device " + id;
    alert("⚠️ Device is offline.\n" + name + " (" + ip + ") is not connected.");
    return;
  }

  var targetUrl = buildCalUrl(ip);
  if (!targetUrl) {
    alert("Target CAL URL is invalid.");
    return;
  }

  console.log("Opening CAL for device ID " + id + " at URL: " + targetUrl);
  window.open(targetUrl, "_blank", "noopener,noreferrer");
}

  window.openDeviceCal = openDeviceCal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  }
  else {
    init();
  }
})();
