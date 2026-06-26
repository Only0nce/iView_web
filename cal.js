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
  // Stable map from real transmitter ID (txIndex/radioID) to CAL card slot.
  // listTransmitter sends: index = real txIndex, webindex = global display slot.
  // listRole(currentActive) sends: chId1..chId16 = selected site slot mapping.
  // view_transmitter_list sends: radioID = real txIndex, databaseId = compact live slot.
  // CAL must follow the selected Site slot mapping, not compact databaseId, otherwise
  // disabled qwert/THRULAN slots are overwritten by the next live device.
  var calSlotByTxIdentity = {};
  var calActiveRoleKnown = false;
  var calActiveRoleSlots = {};
  var calTxCatalogByIdentity = {};
  var calGlobalSlotCatalog = {};
  var calRoleRenderTimer = null;
  var MAX_CAL_DEVICES = 16;
  var calConfiguredTxCount = 0;
  var calRenderedOnce = false;
  // databaseId is the display slot used by index.php/card1..card16.
  // txIndex/radioID are real DB/device IDs and must not be used as the card slot
  // when databaseId/webIndex is available.
  var CAL_DEVICE_ID_KEYS = ["databaseId", "webIndex", "webindex", "displayIndex", "dashboardIndex", "slotIndex", "index", "deviceIndex", "id"];
  // Do not use receive_enable here. In this project receive_enable means RX/SNMP
  // receive feature, not whether the transmitter/device card should be visible.
  var CAL_ENABLE_KEYS = ["enable", "enabled", "active", "isActive"];
  var CAL_CONNECTED_KEYS = ["connectionStatus", "connected", "connect", "online", "isConnected", "status"];

  function normalizeFlag(value, defaultValue) {
    if (typeof value === "undefined" || value === null || value === "") {
      return !!defaultValue;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }

    var text = String(value).trim().toLowerCase();
    if (!text) {
      return !!defaultValue;
    }
    if (["0", "false", "off", "no", "n", "disabled", "disable", "inactive", "hidden", "hide", "offline", "disconnect", "disconnected"].indexOf(text) >= 0) {
      return false;
    }
    if (["1", "true", "on", "yes", "y", "enabled", "enable", "active", "visible", "show", "online", "connect", "connected"].indexOf(text) >= 0) {
      return true;
    }

    var numeric = Number(text);
    if (Number.isFinite(numeric)) {
      return numeric !== 0;
    }
    return !!defaultValue;
  }

  function firstOwnValue(obj, keys) {
    if (!obj) {
      return undefined;
    }
    for (var i = 0; i < keys.length; i++) {
      if (Object.prototype.hasOwnProperty.call(obj, keys[i])) {
        return obj[keys[i]];
      }
    }
    return undefined;
  }

  function resolvePayloadVisible(obj, defaultValue) {
    // For CAL page, visibility should follow the transmitter/card visibility only.
    // Do not hide the CAL card when receive_enable/rxEnabled is 0, because that
    // field is used for RX/SNMP status and many valid devices have it disabled.
    var visibleValue = Object.prototype.hasOwnProperty.call(obj, "visible") ? obj.visible : undefined;
    var visible = normalizeFlag(visibleValue, defaultValue);
    var enableValue = firstOwnValue(obj, CAL_ENABLE_KEYS);
    var enabled = normalizeFlag(enableValue, true);
    return visible && enabled;
  }

  function resolvePayloadConnected(obj, defaultValue) {
    var rawValue = firstOwnValue(obj, CAL_CONNECTED_KEYS);
    if (typeof rawValue === "undefined") {
      return !!defaultValue;
    }
    return normalizeFlag(rawValue, defaultValue);
  }

  function logCalDeviceCount() {
    // Keep this lightweight. The previous version logged the entire state on every
    // WebSocket payload, which made CAL slower when many devices updated often.
    if (!window.CAL_DEBUG) {
      return;
    }
    var visibleCards = 0;
    for (var i = 1; i <= MAX_CAL_DEVICES; i++) {
      var card = document.getElementById("cardTxId" + i);
      if (card && card.style.display !== "none") {
        visibleCards++;
      }
    }
    var configuredVisible = Object.keys(deviceState).filter(function (key) {
      return deviceState[key] && deviceState[key].visible;
    }).length;
    console.log("[CAL DEVICE COUNT] visibleCards=", visibleCards, "configuredVisible=", configuredVisible, "state=", deviceState);
  }

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
      // getRole is required here because CAL card order must match the selected Site
      // page slots chId1..chId16. getMonitorPage/getThruLan alone only provide
      // compact live order and global transmitter order.
      ws.send('{"menuID":"getRole"}');
      ws.send('{"menuID":"getMonitorPage"}');
      ws.send('{"menuID":"getThruLan"}');
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
      updateCardFromPayload(obj, true);
    }
    else if (obj.menuID === "listTransmitter") {
      rememberTransmitterCatalog(obj);

      if (calActiveRoleKnown) {
        scheduleRenderActiveRoleSlots();
      }
      else {
        // Temporary fallback before the selected-role slot map arrives.
        // Use the listTransmitter order/count sent by the server, not station name.
        updateCardFromPayload(obj, false);
        calConfiguredTxCount = countVisibleCatalogTransmitters();
        updateCalDeviceCount(calConfiguredTxCount);
      }
    }
    else if (obj.menuID === "listRole") {
      updateActiveRoleSlotMap(obj);
    }
  }

  function normalizeCalDeviceId(value) {
    var id = parseInt(value, 10);
    if (!Number.isFinite(id) || id < 1 || id > MAX_CAL_DEVICES) {
      return 0;
    }
    return document.getElementById("cardTxId" + id) ? id : 0;
  }

  function getRealTxIdentity(obj) {
    if (!obj) {
      return "";
    }

    // For listTransmitter, "index" is the real txIndex.
    // For view_transmitter_list, "radioID" is the real txIndex.
    var candidates = [obj.radioID, obj.txIndex, obj.index];
    for (var i = 0; i < candidates.length; i++) {
      var value = candidates[i];
      if (typeof value === "undefined" || value === null || value === "") {
        continue;
      }
      var id = parseInt(value, 10);
      if (Number.isFinite(id) && id > 0) {
        return String(id);
      }
    }
    return "";
  }

  function rememberCalSlotForPayload(obj, slotId) {
    var txIdentity = getRealTxIdentity(obj);
    if (!txIdentity || !slotId) {
      return;
    }
    calSlotByTxIdentity[txIdentity] = slotId;
  }

  function resolveDisplaySlotFromPayload(obj) {
    if (!obj) {
      return 0;
    }

    // Preferred display-slot fields. Do not include plain "index" here because
    // listTransmitter uses index as txIndex, not display index.
    var slotKeys = ["webIndex", "webindex", "databaseId", "displayIndex", "dashboardIndex", "slotIndex", "deviceIndex", "id"];
    for (var i = 0; i < slotKeys.length; i++) {
      var id = normalizeCalDeviceId(obj[slotKeys[i]]);
      if (id) {
        return id;
      }
    }
    return 0;
  }

  function getRoleSlotTxId(obj, slotId) {
    if (!obj) {
      return 0;
    }

    var keys = [
      "chId" + slotId,
      "txID" + slotId,
      "txId" + slotId,
      "tx" + slotId
    ];

    for (var i = 0; i < keys.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(obj, keys[i])) {
        continue;
      }
      var value = parseInt(obj[keys[i]], 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    }

    return 0;
  }

  function rememberTransmitterCatalog(obj) {
    var txIdentity = getRealTxIdentity(obj);
    var displaySlot = resolveDisplaySlotFromPayload(obj);

    var catalog = {
      txIdentity: txIdentity,
      name: String(obj.stationName || obj.deviceName || obj.name || (displaySlot ? "Device " + displaySlot : "Device")),
      frequency: formatFrequency(obj.frequency),
      rawFrequency: obj.frequency,
      ip: normalizeHost(obj.ipAddress || obj.ipaddress || obj.host || obj.address),
      visible: resolvePayloadVisible(obj, true)
    };

    if (txIdentity) {
      calTxCatalogByIdentity[txIdentity] = catalog;
    }

    if (displaySlot) {
      calGlobalSlotCatalog[displaySlot] = catalog;
    }
  }

  function isActiveRolePayload(obj) {
    if (!obj || obj.menuID !== "listRole") {
      return false;
    }

    // Newer backend may send currentActive/selected/active.
    if (Object.prototype.hasOwnProperty.call(obj, "currentActive")) {
      return normalizeFlag(obj.currentActive, false);
    }
    if (Object.prototype.hasOwnProperty.call(obj, "selected")) {
      return normalizeFlag(obj.selected, false);
    }
    if (Object.prototype.hasOwnProperty.call(obj, "active")) {
      return normalizeFlag(obj.active, false);
    }
    if (Object.prototype.hasOwnProperty.call(obj, "isActive")) {
      return normalizeFlag(obj.isActive, false);
    }

    // Current Qt5 backend getMonitorPage() sends only the selected role and uses
    // currentRoleSelected instead of currentActive. Treat that payload as active
    // only when its role index matches currentRoleSelected.
    if (Object.prototype.hasOwnProperty.call(obj, "currentRoleSelected")) {
      var selectedId = parseInt(obj.currentRoleSelected, 10);
      var roleId = parseInt(obj.index, 10);
      if (Number.isFinite(selectedId) && selectedId > 0) {
        return !Number.isFinite(roleId) || roleId === selectedId;
      }
    }

    return false;
  }

  function updateActiveRoleSlotMap(obj) {
    if (!isActiveRolePayload(obj)) {
      return;
    }

    calActiveRoleKnown = true;
    calActiveRoleSlots = {};
    calSlotByTxIdentity = {};

    for (var slotId = 1; slotId <= MAX_CAL_DEVICES; slotId++) {
      var txId = getRoleSlotTxId(obj, slotId);
      var txIdentity = txId > 0 ? String(txId) : "";

      calActiveRoleSlots[slotId] = {
        slotId: slotId,
        txIdentity: txIdentity,
        enabled: !!txIdentity
      };

      if (txIdentity) {
        calSlotByTxIdentity[txIdentity] = slotId;
      }
    }

    renderActiveRoleSlots();
  }

  function scheduleRenderActiveRoleSlots() {
    if (calRoleRenderTimer !== null) {
      return;
    }

    calRoleRenderTimer = window.setTimeout(function () {
      calRoleRenderTimer = null;
      renderActiveRoleSlots();
    }, 120);
  }

  function getCatalogForSlot(slotId, txIdentity) {
    if (txIdentity && calTxCatalogByIdentity[txIdentity]) {
      return calTxCatalogByIdentity[txIdentity];
    }
    if (calGlobalSlotCatalog[slotId]) {
      return calGlobalSlotCatalog[slotId];
    }
    return null;
  }

  function updateCalDeviceCount(activeCount) {
    var count = Number(activeCount);
    if (!Number.isFinite(count) || count < 0) {
      count = 0;
    }
    count = Math.min(MAX_CAL_DEVICES, Math.trunc(count));

    var element = document.getElementById("calDeviceCount");
    if (element) {
      element.textContent = count + (count === 1 ? " Device" : " Devices");
      element.setAttribute("aria-label", "CAL active device count: " + count);
    }
  }

  function countActiveRoleSlots() {
    var count = 0;
    for (var slotId = 1; slotId <= MAX_CAL_DEVICES; slotId++) {
      var slot = calActiveRoleSlots[slotId];
      if (slot && slot.enabled && slot.txIdentity) {
        count++;
      }
    }
    return count;
  }

  function countVisibleCatalogTransmitters() {
    var seen = {};
    var count = 0;
    Object.keys(calTxCatalogByIdentity).forEach(function (key) {
      var item = calTxCatalogByIdentity[key];
      if (!seen[key] && item && item.visible) {
        seen[key] = true;
        count++;
      }
    });
    return count;
  }

  function renderActiveRoleSlots() {
    if (!calActiveRoleKnown) {
      return;
    }

    for (var slotId = 1; slotId <= MAX_CAL_DEVICES; slotId++) {
      var slot = calActiveRoleSlots[slotId] || { slotId: slotId, txIdentity: "", enabled: false };
      var catalog = getCatalogForSlot(slotId, slot.txIdentity);

      if (!slot.enabled) {
        renderDisabledRoleSlot(slotId, catalog);
        continue;
      }

      renderConfiguredRoleSlot(slotId, slot, catalog);
    }

    calConfiguredTxCount = countActiveRoleSlots();
    calRenderedOnce = true;
    updateCalDeviceCount(calConfiguredTxCount);
  }

  function renderDisabledRoleSlot(slotId, catalog) {
    // Disabled site slots must stay disabled. Do not borrow the transmitter name
    // from the same global slot, otherwise Device 5 can show qwert even when
    // chId5 is 0 / Disable.
    deviceState[slotId] = {
      name: "Disable",
      frequency: "-",
      ip: "",
      connected: false,
      visible: true,
      liveSeen: false,
      disabledBySite: true,
      txIdentity: ""
    };

    applyCardState(slotId, deviceState[slotId]);
  }

  function renderConfiguredRoleSlot(slotId, slot, catalog) {
    var previous = deviceState[slotId] || {};
    // Catalog from listTransmitter is the source of truth for transmitter name/IP.
    // Prefer it over previous UI state to avoid stale qwert/THRULAN labels after
    // changing selected Site mapping.
    var name = (catalog && catalog.name) || previous.name || ("Device " + slotId);
    var frequency = (catalog && catalog.frequency) || previous.frequency || "-";
    var ip = (catalog && catalog.ip) || previous.ip || "";

    deviceState[slotId] = {
      name: name,
      frequency: frequency,
      ip: ip,
      connected: !!previous.connected,
      visible: true,
      liveSeen: !!previous.liveSeen,
      disabledBySite: false,
      txIdentity: slot.txIdentity
    };

    applyCardState(slotId, deviceState[slotId]);
  }

  function applyCardState(id, state) {
    var card = document.getElementById("cardTxId" + id);
    if (!card || !state) {
      return;
    }

    card.style.display = state.visible ? "block" : "none";
    card.classList.toggle("connected", !!state.connected);

    setText("cardNameId" + id, state.name || ("Device " + id));
    setText("cardFreqId" + id, "Frequency: " + (state.frequency || "-"));
    setText("cardIpId" + id, state.ip ? ("IP: " + state.ip) : "IP: Not configured");
    setText("cardStatusId" + id, state.connected ? "Online" : "Offline");

    card.dataset.deviceIp = state.ip || "";
    card.dataset.deviceName = state.name || "";
    card.dataset.txIdentity = state.txIdentity || "";
    card.dataset.disabledBySite = state.disabledBySite ? "1" : "0";
  }

  function resolveDeviceId(obj, isLivePayload) {
    if (!obj) {
      return 0;
    }

    var txIdentity = getRealTxIdentity(obj);

    // After selected Site mapping is known, live telemetry must only update the
    // slot where that txIndex is selected. If the txIndex is not selected, ignore it.
    // This prevents compact databaseId from moving an online qwert/THRULAN into a
    // disabled slot.
    if (isLivePayload && calActiveRoleKnown) {
      return txIdentity && calSlotByTxIdentity[txIdentity] ? calSlotByTxIdentity[txIdentity] : 0;
    }

    if (isLivePayload && txIdentity && calSlotByTxIdentity[txIdentity]) {
      return calSlotByTxIdentity[txIdentity];
    }

    var displaySlot = resolveDisplaySlotFromPayload(obj);
    if (displaySlot) {
      if (!isLivePayload) {
        rememberCalSlotForPayload(obj, displaySlot);
      }
      return displaySlot;
    }

    // Legacy fallback only if the backend does not send display-slot fields.
    // This is intentionally last because current txIndex/radioID values can be 4..19.
    var legacySlot = normalizeCalDeviceId(obj.radioID || obj.txIndex || obj.index);
    if (legacySlot && !isLivePayload) {
      rememberCalSlotForPayload(obj, legacySlot);
    }
    return legacySlot;
  }

  function updateCardFromPayload(obj, isLivePayload) {
    var id = resolveDeviceId(obj, isLivePayload);
    if (!id) {
      console.warn("[CAL] ignored transmitter payload because no matching card id was found", obj);
      return;
    }

    var card = document.getElementById("cardTxId" + id);
    if (!card) {
      return;
    }

    var stationName = String(obj.stationName || obj.deviceName || obj.name || "Device " + id);
    var frequency = formatFrequency(obj.frequency);
    var visible = resolvePayloadVisible(obj, true);
    var hasConnectionStatus = typeof firstOwnValue(obj, CAL_CONNECTED_KEYS) !== "undefined";
    var previousConnected = deviceState[id] && deviceState[id].liveSeen && deviceState[id].connected;
    var connected = resolvePayloadConnected(obj, isLivePayload ? false : previousConnected);

    if (!isLivePayload && !hasConnectionStatus && previousConnected) {
      connected = true;
    }

    var ip = resolveDeviceIp(id, stationName, obj.ipAddress || obj.ipaddress || obj.host || obj.address);
    var txIdentity = getRealTxIdentity(obj);

    // console.log("Updating device card:",obj , " each value", { id, stationName, frequency, ip, visible, connected });
    deviceState[id] = {
      name: stationName,
      frequency: frequency,
      ip: ip,
      connected: connected,
      visible: visible,
      liveSeen: isLivePayload || (deviceState[id] && deviceState[id].liveSeen) || hasConnectionStatus,
      disabledBySite: false,
      txIdentity: txIdentity
    };

    applyCardState(id, deviceState[id]);

    if (window.CAL_DEBUG) {
      console.log("[CAL DEVICE]", { id: id, txIdentity: txIdentity, txMap: calSlotByTxIdentity, activeRoleKnown: calActiveRoleKnown, visible: visible, connected: connected, menuID: obj.menuID, raw: obj });
      logCalDeviceCount();
    }
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
