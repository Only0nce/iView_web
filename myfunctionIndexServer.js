// JavaScript Document
var wsUri;
var ws;
var current_tmp = 0;
var busy = false;          // << อย่าประกาศซ้ำ
var vswr = 0;
var ampActive = 0;
var rssi = -130;
let nIntervId;
var dBUnit = false;
var current_ch = 0;
var current_sql = 0;
var pttOn = false;

var timeArrMap = {};
var fwdArrMap = {};
var rwdArrMap = {};
var vswrArrMap = {};


/* ---------- ที่หัวไฟล์ (global) ถ้ายังไม่มี ให้มี map พวกนี้ ---------- */
window.timeArrMap = window.timeArrMap || {};
window.fwdArrMap = window.fwdArrMap || {};
window.rwdArrMap = window.rwdArrMap || {};
window.vswrArrMap = window.vswrArrMap || {};
window.rssiArrMap = window.rssiArrMap || {};   // ✅ เพิ่ม rssi
window.canvasTrendChartMap = window.canvasTrendChartMap || {};

window.canvasTrendDataMap = window.canvasTrendDataMap || {};

// ===== Index performance guards =====
// หน้า index มีกราฟสูงสุด 16 ตัว ถ้าสร้าง CanvasJS.Chart ใหม่ทุก payload
// และเรียก resize หลาย timeout ต่อ payload จะค่อย ๆ หน่วง/ค้างเมื่อเปิดไว้นาน ๆ
const INDEX_MAX_TREND_POINTS = 600;          // ประมาณ 20 นาทีที่ sample 2 วินาที
const INDEX_PLOT_RENDER_MIN_MS = 900;        // จำกัด render กราฟต่อช่องไม่เกิน ~1 fps
const INDEX_PLOT_RESIZE_MIN_MS = 1500;       // จำกัด resize/render จาก resize ไม่ให้ถี่เกิน
const indexPlotRenderPendingMap = Object.create(null);
const indexPlotRenderTimerMap = Object.create(null);
const indexPlotLastRenderMap = Object.create(null);
const indexPlotResizePendingMap = Object.create(null);
const indexPlotResizeTimerMap = Object.create(null);
const indexPlotLastResizeMap = Object.create(null);
const indexPlotRedrawPendingMap = Object.create(null);
let indexDensityScheduled = false;
let indexDensityForceCount = null;
let indexWsReconnectTimer = null;
let indexWsManualClose = false;


// --- Safe DOM helpers (กัน null ทุกครั้ง) ---
const $ = (id) => document.getElementById(id);
const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const setValue = (id, v) => { const el = $(id); if (el) el.value = v; };
const setStyle = (id, prop, val) => { const el = $(id); if (el) el.style[prop] = val; };
const setWidth = (id, pct) => { const el = $(id); if (el) el.style.width = pct; };

// ===== Threshold helpers =====
// key = dashboard slot (card1..card16). Use databaseId first because Qt server already sends it as 1..16.
const thresholdMap = Object.create(null); // value = { fwd:{warn,alert}, rssi:{warn,alert}, vswr:{warn,alert} }


// ===== Index device visibility source =====
// listTransmitter = configuration source (which device should exist on dashboard)
// view_transmitter_list = live telemetry source (values/status/name source of truth)
const indexDeviceConfigMap = Object.create(null); // key = dashboard id 1..16
const indexDeviceLiveMap = Object.create(null);   // key = dashboard id 1..16

// ===== Stable transmitter identity mapping =====
// listTransmitter from Qt server is the authoritative config payload:
//   index    = real transmitter txIndex
//   webindex = display slot/card number
// view_transmitter_list is live telemetry:
//   radioID/txIndex = real transmitter txIndex
//   databaseId may be a compact/live order and must NOT be trusted as a stable slot
// for devices after disabled/offline transmitters.
const indexTxToSlotMap = Object.create(null);     // key = real txIndex/radioID, value = dashboard slot
const indexSlotToTxMap = Object.create(null);     // key = dashboard slot, value = real txIndex/radioID

// ===== Active SITE slot mapping =====
// SITE page owns the real display order through listRole chId1..chId16.
// listTransmitter.webindex is only the default/catalog order. When an active
// SITE is selected, index must follow chId slot order exactly.
let indexActiveSiteSlotKnown = false;
let indexActiveSiteSlotSignature = '';
const indexActiveSlotToTxMap = Object.create(null);       // key = slot 1..16, value = real txIndex/radioID
const indexTransmitterCatalogMap = Object.create(null);   // key = real txIndex/radioID, value = last listTransmitter payload

// ===== Header SITE summary state =====
// Keep this lightweight. The dashboard can receive many live payloads per second,
// so we do not recalculate/repaint the header for every device message.
const INDEX_SITE_SUMMARY_UPDATE_MS = 900;
const indexRoleSummaryState = {
  roleName: "--",
  allDevice: 0,
  connect: 0,
  disconnect: 0,
  lastRenderedSignature: "",
  updateTimer: null,
  pendingReason: ""
};

function isIndexConnectionOnline(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;

  const text = String(value ?? '').trim().toLowerCase();
  return ['1', 'true', 'online', 'connected', 'connect', 'active', 'ok'].includes(text);
}

function getIndexVisibleConfigIds() {
  return Object.keys(indexDeviceConfigMap).filter(function (id) {
    if (!normalizeIndexDashboardId(id)) return false;
    return indexDeviceConfigMap[id]?.enabled !== false;
  });
}

function renderIndexRoleSummaryFromLive(reason) {
  const liveIds = Object.keys(indexDeviceLiveMap).filter(function (id) {
    return !!normalizeIndexDashboardId(id);
  });
  const configIds = getIndexVisibleConfigIds();
  const serverAll = Number(indexRoleSummaryState.allDevice || 0);

  let total = Math.max(serverAll, configIds.length, liveIds.length);
  let connect = Number(indexRoleSummaryState.connect || 0);
  let disconnect = Number(indexRoleSummaryState.disconnect || 0);

  if (liveIds.length > 0) {
    connect = 0;
    for (let n = 1; n <= total; n++) {
      const live = indexDeviceLiveMap[String(n)];
      if (!live) continue;
      if (live.visible === false) continue;
      if (isIndexConnectionOnline(live.connectionStatus)) connect++;
    }
    disconnect = Math.max(0, total - connect);
  } else {
    if (!total) total = Number(connect) + Number(disconnect);
    disconnect = Math.max(0, total - connect);
  }

  const roleName = indexRoleSummaryState.roleName || "--";
  const signature = roleName + "|" + total + "|" + connect + "|" + disconnect;
  if (signature === indexRoleSummaryState.lastRenderedSignature) return;

  indexRoleSummaryState.lastRenderedSignature = signature;
  setHTML("roleNameDisplay", roleName);
  setHTML("roleDeviceSummary", "All: " + total + " | Connect: " + connect + " | Disconnect: " + disconnect);
}

function scheduleIndexRoleSummaryFromLive(reason) {
  indexRoleSummaryState.pendingReason = reason || indexRoleSummaryState.pendingReason || 'live';
  if (indexRoleSummaryState.updateTimer) return;

  indexRoleSummaryState.updateTimer = setTimeout(function () {
    indexRoleSummaryState.updateTimer = null;
    const pendingReason = indexRoleSummaryState.pendingReason;
    indexRoleSummaryState.pendingReason = "";
    renderIndexRoleSummaryFromLive(pendingReason);
  }, INDEX_SITE_SUMMARY_UPDATE_MS);
}

function isTruthyFlag(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return null;
  if (['1', 'true', 'on', 'yes', 'y', 'enable', 'enabled', 'active', 'show', 'visible'].includes(text)) return true;
  if (['0', 'false', 'off', 'no', 'n', 'disable', 'disabled', 'inactive', 'hide', 'hidden'].includes(text)) return false;
  return null;
}

function normalizeIndexDashboardId(raw) {
  if (raw === undefined || raw === null || raw === '') return '';

  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return '';

  // databaseId/webIndex is a 1-based display order: 1,2,3,...
  // Do not add +1 here and do not use txIndex/radioID as a dashboard slot.
  const intValue = Math.trunc(n);
  if (intValue <= 0) return '';

  const id = String(intValue);
  if ($("card" + id) || $("card_plot" + id) || $("deviceDashboard" + id)) return id;
  return '';
}

function normalizeIndexTxIdentity(raw) {
  if (raw === undefined || raw === null || raw === '') return '';

  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return '';

  const intValue = Math.trunc(n);
  return intValue > 0 ? String(intValue) : '';
}

function resolveIndexDeviceId(obj) {
  // Config payload (listTransmitter) owns the stable display slot.
  // Prefer webindex/webIndex because `index` is the real txIndex, not the card slot.
  let id = normalizeIndexDashboardId(obj?.webindex ?? obj?.webIndex);
  if (id) return id;

  // Compatibility for older payloads that used databaseId/display-style names.
  id = normalizeIndexDashboardId(obj?.databaseId);
  if (id) return id;

  return normalizeIndexDashboardId(obj?.displayIndex ?? obj?.dashboardIndex ?? obj?.slotIndex);
}

function resolveIndexLiveDeviceId(obj) {
  // Live telemetry must follow the real transmitter identity from the server.
  // Active SITE chId1..chId16 is authoritative. If tx is not selected in the
  // active SITE, do not place it by compact databaseId.
  const txIdentity = normalizeIndexTxIdentity(obj?.radioID ?? obj?.txIndex ?? obj?.index);

  if (indexActiveSiteSlotKnown) {
    if (txIdentity && indexTxToSlotMap[txIdentity]) {
      return normalizeIndexDashboardId(indexTxToSlotMap[txIdentity]);
    }
    return '';
  }

  if (txIdentity && indexTxToSlotMap[txIdentity]) {
    return normalizeIndexDashboardId(indexTxToSlotMap[txIdentity]);
  }

  // If the server already sends a stable display slot, use it.
  let id = normalizeIndexDashboardId(obj?.webIndex ?? obj?.webindex);
  if (id) return id;

  // Temporary startup fallback only. Once listTransmitter/listRole arrives,
  // txIdentity mapping wins.
  id = normalizeIndexDashboardId(obj?.databaseId);
  if (id) return id;

  return normalizeIndexDashboardId(obj?.displayIndex ?? obj?.dashboardIndex ?? obj?.slotIndex);
}


function clearObjectKeys(obj) {
  Object.keys(obj).forEach(function (key) { delete obj[key]; });
}

function getIndexRoleSlotTxId(obj, slotId) {
  if (!obj) return '';

  const keys = [
    'chId' + slotId,
    'txID' + slotId,
    'txId' + slotId,
    'tx' + slotId
  ];

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    return normalizeIndexTxIdentity(obj[key]);
  }

  return '';
}

function isIndexActiveRolePayload(obj) {
  if (!obj || obj.menuID !== 'listRole') return false;

  if (Object.prototype.hasOwnProperty.call(obj, 'currentActive')) {
    return isTruthyFlag(obj.currentActive) === true;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'selected')) {
    return isTruthyFlag(obj.selected) === true;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'active')) {
    return isTruthyFlag(obj.active) === true;
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'isActive')) {
    return isTruthyFlag(obj.isActive) === true;
  }

  // Some Qt5 builds send only the currently selected role and use
  // currentRoleSelected instead of currentActive. Treat the payload as active
  // when index matches currentRoleSelected.
  if (Object.prototype.hasOwnProperty.call(obj, 'currentRoleSelected')) {
    const selectedId = Number(obj.currentRoleSelected);
    const roleId = Number(obj.index);
    if (Number.isFinite(selectedId) && selectedId > 0) {
      return !Number.isFinite(roleId) || roleId === selectedId;
    }
  }

  return false;
}

function resetIndexLiveSlot(slotId, makeOffline) {
  const id = normalizeIndexDashboardId(slotId);
  if (!id) return;

  delete indexDeviceLiveMap[id];
  delete window.timeArrMap[id];
  delete window.fwdArrMap[id];
  delete window.rwdArrMap[id];
  delete window.vswrArrMap[id];
  delete window.rssiArrMap[id];

  if (makeOffline) {
    setTrendOfflineState(id, true);
    const dis1 = $('cardDisconnect' + id);
    const dis2 = $('cardplotDisconnect' + id);
    if (dis1) dis1.style.display = 'block';
    if (dis2) dis2.style.display = 'block';
    setHTML('lastUpdate' + id, '--:--:--');
    setDatasetState('deviceDashboard' + id, 'offline');
  }
}

function renderIndexSiteSlotFromCatalog(slotId, txIdentity) {
  const id = normalizeIndexDashboardId(slotId);
  if (!id) return;

  const tx = normalizeIndexTxIdentity(txIdentity);
  if (!tx) {
    indexDeviceConfigMap[id] = { enabled: false, txIdentity: '', name: '', frequency: '' };
    resetIndexLiveSlot(id, false);
    setIndexDeviceVisible(id, false);
    return;
  }

  const oldTx = indexDeviceConfigMap[id]?.txIdentity || '';
  if (oldTx && oldTx !== tx) {
    resetIndexLiveSlot(id, true);
  }

  const catalog = indexTransmitterCatalogMap[tx] || {
    index: tx,
    stationName: 'Device ' + id,
    frequency: '',
    visible: 1
  };

  indexDeviceConfigMap[id] = {
    enabled: true,
    txIdentity: tx,
    name: String(catalog.stationName ?? catalog.deviceName ?? catalog.name ?? '').trim(),
    frequency: catalog.frequency ?? catalog.freq ?? ''
  };

  // The SITE slot is authoritative. Force config text for the selected slot
  // until the live payload for the same tx arrives.
  if (oldTx !== tx && indexDeviceLiveMap[id]) {
    delete indexDeviceLiveMap[id].hasLiveName;
  }
  updateIndexDeviceHeaderFromConfig(id, catalog || {});
  setIndexDeviceVisible(id, true);
}

function applyIndexActiveSiteSlots(obj) {
  if (!isIndexActiveRolePayload(obj)) return;

  const roleName = String(obj.name ?? obj.roleName ?? obj.role ?? '').trim();
  const nextSlotToTx = Object.create(null);
  const signatureParts = [];

  for (let slotId = 1; slotId <= 16; slotId++) {
    const txIdentity = getIndexRoleSlotTxId(obj, slotId);
    nextSlotToTx[String(slotId)] = txIdentity || '';
    signatureParts.push(txIdentity || '0');
  }

  const nextSignature = (roleName || '--') + '|' + signatureParts.join(',');
  const mappingChanged = nextSignature !== indexActiveSiteSlotSignature;

  indexActiveSiteSlotKnown = true;
  indexActiveSiteSlotSignature = nextSignature;

  if (roleName) {
    indexRoleSummaryState.roleName = roleName;
  }

  // Rebuild the authoritative mapping from the active SITE page.
  clearObjectKeys(indexActiveSlotToTxMap);
  clearObjectKeys(indexTxToSlotMap);
  clearObjectKeys(indexSlotToTxMap);

  if (mappingChanged) {
    // The previous view may have been drawn from listTransmitter.webindex or an
    // older SITE mapping. Clear all live slots once so stale qwert/THRULAN cards
    // cannot remain in the wrong position.
    for (let slotId = 1; slotId <= 16; slotId++) {
      resetIndexLiveSlot(slotId, true);
      indexDeviceConfigMap[String(slotId)] = { enabled: false, txIdentity: '', name: '', frequency: '' };
      setIndexDeviceVisible(String(slotId), false);
    }
  }

  for (let slotId = 1; slotId <= 16; slotId++) {
    const slotKey = String(slotId);
    const txIdentity = nextSlotToTx[slotKey];

    if (txIdentity) {
      indexActiveSlotToTxMap[slotKey] = txIdentity;
      indexTxToSlotMap[txIdentity] = slotKey;
      indexSlotToTxMap[slotKey] = txIdentity;
      renderIndexSiteSlotFromCatalog(slotKey, txIdentity);
    } else {
      delete indexActiveSlotToTxMap[slotKey];
      indexDeviceConfigMap[slotKey] = { enabled: false, txIdentity: '', name: '', frequency: '' };
      setIndexDeviceVisible(slotKey, false);
    }
  }

  scheduleIndexRoleSummaryFromLive('listRole active site slots');
  syncDashboardDensity();
}


function updateIndexDeviceHeaderFromLive(id, obj) {
  const rawStationName = String(obj?.stationName ?? obj?.deviceName ?? obj?.name ?? '').trim();
  const rawFrequency = Number(obj?.frequency || obj?.freq || 0);
  const frequencyText = rawFrequency > 0
    ? ((rawFrequency > 1000000 ? rawFrequency / 1e6 : rawFrequency).toFixed(4) + " MHz")
    : "-- MHz";

  const titleEl = $("title" + id);
  const deviceNameEl = $("deviceName" + id);
  const deviceFrequencyEl = $("deviceFrequency" + id);
  const safeName = rawStationName || "RF Device " + id;
  const safeTitle = (safeName + (frequencyText !== "-- MHz" ? " " + frequencyText : '')).trim();

  if (titleEl) {
    titleEl.setAttribute("aria-label", safeTitle);
    titleEl.removeAttribute("title");
    titleEl.removeAttribute("data-full-title");
    titleEl.dataset.nameSource = "view_transmitter_list";
  }
  if (deviceNameEl) {
    deviceNameEl.textContent = safeName;
    deviceNameEl.dataset.nameSource = "view_transmitter_list";
  }
  if (deviceFrequencyEl) {
    deviceFrequencyEl.textContent = frequencyText;
    deviceFrequencyEl.dataset.nameSource = "view_transmitter_list";
  }

  indexDeviceLiveMap[id] = indexDeviceLiveMap[id] || {};
  indexDeviceLiveMap[id].hasLiveName = true;
  indexDeviceLiveMap[id].liveName = safeName;
  indexDeviceLiveMap[id].liveFrequency = frequencyText;
}

function resolveIndexDeviceEnabled(obj, defaultValue) {
  const keys = [
    'visible', 'enable', 'enabled', 'receive_enable', 'receiveEnable',
    'rxEnabled', 'active', 'isActive', 'status', 'deviceEnable', 'deviceEnabled'
  ];

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj || {}, key)) {
      const value = isTruthyFlag(obj[key]);
      if (value !== null) return value;
    }
  }
  return defaultValue;
}

function isIndexDeviceConfiguredVisible(id, liveObj) {
  const cfg = indexDeviceConfigMap[id];
  if (cfg && cfg.enabled === false) return false;
  if (cfg && cfg.enabled === true) return true;
  return resolveIndexDeviceEnabled(liveObj || {}, false) === true;
}

function setIndexDeviceVisible(id, visible) {
  const show = !!visible;
  const key = String(id);
  const cardEl = $("card" + key);
  const plotEl = $("card_plot" + key);
  const dashEl = $("deviceDashboard" + key);

  if (cardEl) cardEl.style.display = show ? "block" : "none";
  if (plotEl) {
    const wasVisible = plotEl.dataset.rfVisible === "1";
    plotEl.style.display = show ? "block" : "none";
    plotEl.dataset.rfVisible = show ? "1" : "0";
    if (show && !wasVisible) scheduleIndexPlotRedraw(key);
  }
  if (dashEl) dashEl.style.display = show ? "block" : "none";

  // Do not force the trend panel back to OFFLINE every time the card is shown.
  // view_transmitter_list updates connectionStatus first, then calls this function again.
  // The old unconditional setTrendOfflineState(id, true) re-enabled the OFFLINE overlay
  // even when connectionStatus=1 and graph data was already arriving.
  if (show) {
    const live = indexDeviceLiveMap[key];
    setTrendOfflineState(key, !(live && isIndexConnectionOnline(live.connectionStatus)));
  } else {
    setTrendOfflineState(key, false);
  }
}

function updateIndexDeviceHeaderFromConfig(id, obj) {
  // listTransmitter may arrive repeatedly. Use it only as a temporary placeholder.
  // Once view_transmitter_list has supplied the live stationName for this dashboard slot,
  // never let config overwrite that live name.
  if (indexDeviceLiveMap[id]?.hasLiveName === true) return;

  const rawStationName = String(obj?.stationName ?? obj?.deviceName ?? obj?.name ?? '').trim();
  const rawFrequency = Number(obj?.frequency || obj?.freq || 0);
  const frequencyText = rawFrequency > 0
    ? ((rawFrequency > 1000000 ? rawFrequency / 1e6 : rawFrequency).toFixed(4) + " MHz")
    : "-- MHz";

  const titleEl = $("title" + id);
  const deviceNameEl = $("deviceName" + id);
  const deviceFrequencyEl = $("deviceFrequency" + id);
  const safeName = rawStationName || "RF Device " + id;
  const safeTitle = (safeName + (frequencyText !== "-- MHz" ? " " + frequencyText : '')).trim();

  if (titleEl) {
    titleEl.setAttribute("aria-label", safeTitle);
    titleEl.removeAttribute("title");
    titleEl.removeAttribute("data-full-title");
  }
  if (deviceNameEl) deviceNameEl.textContent = safeName;
  if (deviceFrequencyEl) deviceFrequencyEl.textContent = frequencyText;
}

function renderIndexConfiguredDevice(id, obj) {
  const enabled = resolveIndexDeviceEnabled(obj, true);
  indexDeviceConfigMap[id] = {
    enabled: enabled,
    name: String(obj?.stationName ?? obj?.deviceName ?? obj?.name ?? '').trim(),
    frequency: obj?.frequency ?? obj?.freq ?? ''
  };

  updateIndexDeviceHeaderFromConfig(id, obj || {});
  setIndexDeviceVisible(id, enabled);

  const hasLive = !!indexDeviceLiveMap[id];
  const connectionStatus = hasLive && indexDeviceLiveMap[id].connectionStatus === true;
  const dis1 = $("cardDisconnect" + id);
  const dis2 = $("cardplotDisconnect" + id);
  if (dis1) dis1.style.display = connectionStatus ? "none" : "block";
  if (dis2) dis2.style.display = connectionStatus ? "none" : "block";
  setDatasetState("deviceDashboard" + id, connectionStatus ? "online" : "offline");
  syncDashboardDensity();
}

function debugIndexDeviceCount(reason) {
  const rows = Array.from(document.querySelectorAll('.rf-device-row'));
  const visibleRows = rows.filter(isDashboardDeviceVisible).length;
  const configEnabled = Object.keys(indexDeviceConfigMap).filter(id => indexDeviceConfigMap[id]?.enabled === true).length;
  const liveReceived = Object.keys(indexDeviceLiveMap).length;
  // console.log('[INDEX DEVICE COUNT]', reason, 'configEnabled=', configEnabled, 'liveReceived=', liveReceived, 'visibleRows=', visibleRows);
}

/** mode:
 *  'low-bad'  => ค่ายิ่งต่ำยิ่งแย่ (เช่น FWD Power, RSSI)
 *  'high-bad' => ค่ายิ่งสูงยิ่งแย่ (เช่น VSWR)
 * return: 'ok' | 'warn' | 'alert'
 */
function getSeverity(value, warn, alert, mode) {
  const v = Number(value), w = Number(warn), a = Number(alert);
  if (isNaN(v) || isNaN(w) || isNaN(a)) return 'ok';

  if (mode === 'low-bad') {
    // ต่ำกว่า alert = แดง, ต่ำกว่า warning (แต่ยัง >= alert) = ส้ม
    if (v < a) return 'alert';
    if (v < w) return 'warn';
    return 'ok';
  } else {
    // high-bad
    if (v > a) return 'alert';
    if (v > w) return 'warn';
    return 'ok';
  }
}

function colorFromSeverity(sev) {
  if (sev === 'alert') return '#FF0000';  // แดง
  if (sev === 'warn')  return '#FFA500';  // ส้ม
  return '#00FF00';                       // เขียว
}


// ===== Home dashboard visual helpers (UI only) =====
function setDatasetState(id, state) {
  const el = $(id);
  if (el) el.dataset.state = state;
}

function getVswrState(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return "idle";
  if (v >= 2.0) return "alert";
  if (v >= 1.5) return "warn";
  return "ok";
}

function getRssiState(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return "idle";
  if (v <= -115) return "alert";
  if (v <= -95) return "warn";
  return "ok";
}

function getPowerState(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return "idle";
  if (v <= 0) return "warn";
  return "ok";
}

function formatTimeFromPayload(obj) {
  const raw = obj.timestamp || obj.timeList || "";
  if (raw && String(raw).length >= 5) return String(raw).slice(-8);
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

function pad2(v) {
  return String(v).padStart(2, '0');
}

function localDatePart(dateObj) {
  const d = dateObj instanceof Date && !Number.isNaN(dateObj.getTime()) ? dateObj : new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function normalizeDatePart(rawDate) {
  const fallback = localDatePart(new Date());
  const value = String(rawDate || '').trim();
  if (!value) return fallback;

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[1] + '-' + isoMatch[2] + '-' + isoMatch[3];

  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const day = pad2(slashMatch[1]);
    const month = pad2(slashMatch[2]);
    const year = slashMatch[3];
    return year + '-' + month + '-' + day;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return localDatePart(parsed);
  return fallback;
}

function normalizeTimePart(rawTime) {
  const now = new Date();
  const fallback = pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
  const value = String(rawTime || '').trim();
  if (!value) return fallback;

  const timeMatch = value.match(/(\d{1,2}:\d{2}:\d{2}(?:\.\d+)?)/);
  if (timeMatch) return timeMatch[1];

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return pad2(parsed.getHours()) + ':' + pad2(parsed.getMinutes()) + ':' + pad2(parsed.getSeconds());
  }
  return fallback;
}

function normalizePlotTimestamp(rawDate, rawTime) {
  const timeValue = String(rawTime || '').trim();
  if (timeValue) {
    const parsedTime = new Date(timeValue);
    if (!Number.isNaN(parsedTime.getTime())) return parsedTime.toISOString();
  }

  const dateValue = String(rawDate || '').trim();
  if (dateValue && dateValue.includes('T')) {
    const parsedDate = new Date(dateValue);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate.toISOString();
  }

  return normalizeDatePart(dateValue) + 'T' + normalizeTimePart(timeValue);
}

function normalizePlotTimeValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  const raw = String(value || '').trim();
  if (!raw) return null;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();

  if (/^T\d{1,2}:\d{2}:\d{2}/.test(raw)) {
    return localDatePart(new Date()) + raw;
  }

  if (/^\d{1,2}:\d{2}:\d{2}/.test(raw)) {
    return localDatePart(new Date()) + 'T' + raw;
  }

  return null;
}

function setPill(id, state, text) {
  const el = $(id);
  if (!el) return;
  el.dataset.state = state;
  el.innerHTML = text;
}

function updateHomeOverviewPanel(id, obj, data) {
  const rssiState = getRssiState(data.rssiDb);
  const vswrState = getVswrState(data.swr);
  const powerState = getPowerState(data.fwd);
  const overallState = !data.connectionStatus ? "offline" :
    (rssiState === "alert" || vswrState === "alert" ? "alert" :
    (rssiState === "warn" || vswrState === "warn" || powerState === "warn" ? "warn" : "ok"));

  const overallText = overallState === "ok" ? "OK" :
    (overallState === "offline" ? "OFFLINE" : overallState.toUpperCase());

  setPill("overviewSeverity" + id, overallState, overallText);
  setPill("rssiState" + id, rssiState, rssiState === "ok" ? "OK" : (rssiState === "idle" ? "--" : (rssiState === "alert" ? "ALERT" : "WEAK")));
  setPill("vswrState" + id, vswrState, vswrState === "ok" ? "OK" : (vswrState === "idle" ? "--" : vswrState.toUpperCase()));
  setPill("reflectedState" + id, vswrState === "alert" ? "alert" : "ok", vswrState === "alert" ? "ALERT" : "OK");
  setPill("rxStatusState" + id, data.connectionStatus ? (overallState === "ok" ? "ok" : "warn") : "offline", data.connectionStatus ? (overallState === "ok" ? "OK" : "WEAK") : "OFFLINE");

  setHTML("rxStatusValue" + id, data.connectionStatus ? (overallState === "ok" ? "ACTIVE" : "CO_WARN") : "OFFLINE");
  setHTML("lastUpdate" + id, formatTimeFromPayload(obj));

  setDatasetState("overviewSeverity" + id, overallState);
  setDatasetState("rssiState" + id, rssiState);
  setDatasetState("vswrState" + id, vswrState);
  setDatasetState("rxStatusValue" + id, data.connectionStatus ? (overallState === "ok" ? "ok" : "warn") : "offline");
  setDatasetState("deviceDashboard" + id, data.connectionStatus ? "online" : "offline");
  setTrendOfflineState(id, data.visible && !data.connectionStatus);

  const dash = $("deviceDashboard" + id);
  if (dash) dash.style.display = data.visible ? "block" : "";
  syncDashboardDensity();
}


function setTrendOfflineState(id, isOffline) {
  const trendCard = $("card_plot" + id);
  const overlay = $("trendOfflineOverlay" + id);
  const offline = !!isOffline;

  if (trendCard) trendCard.classList.toggle("is-offline", offline);
  if (overlay) overlay.setAttribute("aria-hidden", offline ? "false" : "true");
}


function updateRoleSummaryPanel(obj) {
  const roleName = (obj.roleName ?? "--").toString();
  const allDevice = Number(obj.all_device ?? 0);
  const connect = Number(obj.connect ?? 0);
  const disconnect = Number(obj.disconnect ?? 0);

  indexRoleSummaryState.roleName = roleName || "--";
  indexRoleSummaryState.allDevice = Number.isFinite(allDevice) ? allDevice : 0;
  indexRoleSummaryState.connect = Number.isFinite(connect) ? connect : 0;
  indexRoleSummaryState.disconnect = Number.isFinite(disconnect) ? disconnect : 0;

  // Render once immediately for startup, then live telemetry will update it throttled.
  renderIndexRoleSummaryFromLive('view_update_Page');
  syncDashboardDensity(indexRoleSummaryState.allDevice);
}


function isDashboardDeviceVisible(row) {
  if (!row) return false;
  const visibleChild = row.querySelector('.rf-device-overview[style*="block"], .rf-trend-card[style*="block"], .rf-radio-control[style*="block"]');
  return !!visibleChild;
}

function syncDashboardDensity(forceCount) {
  if (Number.isFinite(Number(forceCount)) && Number(forceCount) > 0) {
    indexDensityForceCount = Number(forceCount);
  }

  if (indexDensityScheduled) return;
  indexDensityScheduled = true;

  requestAnimationFrame(function () {
    indexDensityScheduled = false;

    const rows = Array.from(document.querySelectorAll('.rf-device-row'));
    const visibleCount = Number.isFinite(Number(indexDensityForceCount)) && Number(indexDensityForceCount) > 0
      ? Number(indexDensityForceCount)
      : rows.filter(isDashboardDeviceVisible).length;
    indexDensityForceCount = null;

    // Always keep the index page in 2 columns x 8 rows layout without compact shrinking.
    // rf-dashboard-wall is intentionally removed because it is the old compressed wall mode.
    document.body.classList.remove('rf-dashboard-wall');
    document.body.classList.add('rf-dashboard-2x8');
    document.body.style.setProperty('--rf-visible-devices', String(visibleCount));
  });
}



function scheduleIndexWebSocketReconnect() {
  if (indexWsManualClose) return;
  if (indexWsReconnectTimer) clearTimeout(indexWsReconnectTimer);
  indexWsReconnectTimer = setTimeout(function () {
    indexWsReconnectTimer = null;
    WebSocketTest();
  }, 2000);
}

WebSocketTest();
// window.onload = function(){
//   myCanvasfwd(0)
//   myCanvasrwd(0)
//   vswr = (vswr*1.0).toFixed(0)
//   animateResultCount(document.getElementById("fwd").innerHTML,0,document.getElementById("rwd").innerHTML,0)
// }

function WebSocketTest() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  if ("WebSocket" in window) {
    wsUri = "ws://" + location.host + ":1234";
    indexWsManualClose = false;
    ws = new WebSocket(wsUri);

    ws.onopen = function () {
      ws.send('{"menuID":"getMonitorPage"}');
      ws.send('{"menuID":"getThruLan"}');
      // myProgressCircle(50, 10, 0, 50, 0, 10, 0, -130);
    };

    ws.onmessage = function (evt) {
      var received_msg = evt.data;
      // console.log("Received: " + received_msg);
      processMsg(received_msg);
    };

    ws.onerror = function () {
      // Let onclose handle reconnect. Avoid alert() because it blocks the UI thread.
      try { ws.close(); } catch (e) {}
    };

    ws.onclose = function () {
      // Reconnect quietly instead of showing alert dialogs that freeze long-running dashboards.
      scheduleIndexWebSocketReconnect();
    };
  } else {
    alert("WebSocket NOT supported by your Browser!");
  }
}

function showSerialRadioControl(ttyId) {
  const el = $("card_uart" + ttyId);
  if (el) el.style.display = "block";
}

function processMsg(message) {
  let obj = {};
  try { obj = JSON.parse(message); } catch (e) { return; }

  if (obj.menuID == "serialConnect") {
    const connected = obj.connected == 1;
    const ttyId = (obj.iCom_ttyDev == "ttyTHS2") ? "2" : "1";
    const card = $("card_uart" + ttyId);
    if (!card) return;
    card.style.display = connected ? "block" : "none";
  }

  else if (obj.menuID == "CTRLTEMP") {
    const ttyId = (obj.iCom_ttyDev == "ttyTHS2") ? "2" : "1";
    const card = $("card_uart" + ttyId);
    if (card) card.style.display = "block";
    setHTML("CTRLtemp" + ttyId, (obj.CTRLtemp * 1).toFixed(1) + "°C");
  }

  else if (obj.menuID == "CTRLSQL") {
    const ttyId = (obj.iCom_ttyDev == "ttyTHS2") ? "2" : "1";
    const card = $("card_uart" + ttyId);
    if (card) card.style.display = "block";

    // NOTE: ใช้ && (logical AND) ไม่ใช่ & (bitwise)
    busy = (obj.CTRLsql === "OPEN");

    if (busy && pttOn) {
      setStyle("card_uart" + ttyId, "backgroundColor", "rgba(100, 100, 0, 0.5)");
      setHTML("trxShow" + ttyId, "Tx&Rx");
    } else if (busy) {
      setStyle("card_uart" + ttyId, "backgroundColor", "rgba(0, 100, 0, 0.5)");
      setHTML("trxShow" + ttyId, "Rx");
    } else if (!pttOn) {
      setStyle("card_uart" + ttyId, "backgroundColor", "rgba(0, 0, 0, 0.2)");
      setHTML("trxShow" + ttyId, "");
    }
  }

  else if (obj.menuID == "CTRLTX" || obj.menuID == "CTRLEPTT") {
    const ttyId = (obj.iCom_ttyDev == "ttyTHS2") ? "2" : "1";
    const card = $("card_uart" + ttyId);
    if (card) card.style.display = "block";

    pttOn = (obj.CTRLtx === 1);

    if (busy && pttOn) {
      setStyle("card_uart" + ttyId, "backgroundColor", "rgba(100, 100, 0, 0.5)");
      setHTML("trxShow" + ttyId, "Tx&Rx");
    } else if (pttOn) {
      setStyle("card_uart" + ttyId, "backgroundColor", "rgba(100, 0, 0, 0.5)");
      setHTML("trxShow" + ttyId, "Tx");
    } else if (!busy) {
      setStyle("card_uart" + ttyId, "backgroundColor", "rgba(0, 0, 0, 0.2)");
      setHTML("trxShow" + ttyId, "");
    }
  }

  else if (obj.menuID == "CTRLRSSI") {
    const ttyId = (obj.iCom_ttyDev == "ttyTHS2") ? "2" : "1";
    const card = $("card_uart" + ttyId);
    if (card) card.style.display = "block";
    setHTML("rssi" + ttyId, obj.CTRLrssi);
    setWidth("barRSSILevel" + ttyId, ((obj.CTRLrssi + 130) / 130) * 100 + "%");
  }

  else if (obj.menuID == "SETMSQLLV") {
    const ttyId = (obj.iCom_ttyDev == "ttyTHS2") ? "2" : "1";
    const card = $("card_uart" + ttyId);
    if (card) card.style.display = "block";
    setHTML("sqlLevel" + ttyId, "SQL:" + obj.SETMSqllv);
    setHTML("sqlMirrorValue" + ttyId, obj.SETMSqllv);
    current_sql = obj.SETMSqllv;
  }

  else if (obj.menuID == "MCHSEL") {
    const ttyId = (obj.iCom_ttyDev == "ttyTHS2") ? "2" : "1";
    const card = $("card_uart" + ttyId);
    if (card) card.style.display = "block";
    setHTML("chSel" + ttyId, "CH:" + obj.MCHsel);
    current_ch = obj.MCHsel;
  }

  else if (obj.menuID == "MCHRFPWR") {
    const ttyId = (obj.iCom_ttyDev == "ttyTHS2") ? "2" : "1";
    const card = $("card_uart" + ttyId);
    if (card) card.style.display = "block";

    if ((obj.MCHrfpwr == "H") || (obj.MCHrfpwr == "HIGH")) {
      setStyle("sethipower", "backgroundColor", "#009688");
      setStyle("setl1power", "backgroundColor", "#00968880");
      setStyle("setl2power", "backgroundColor", "#00968880");
    } else if ((obj.MCHrfpwr == "L1") || (obj.MCHrfpwr == "LOW1")) {
      setStyle("sethipower", "backgroundColor", "#00968880");
      setStyle("setl1power", "backgroundColor", "#009688");
      setStyle("setl2power", "backgroundColor", "#00968880");
    } else if ((obj.MCHrfpwr == "L2") || (obj.MCHrfpwr == "LOW2")) {
      setStyle("sethipower", "backgroundColor", "#00968880");
      setStyle("setl1power", "backgroundColor", "#00968880");
      setStyle("setl2power", "backgroundColor", "#009688");
    }
  }

  else if (obj.menuID === "listRole") {
    applyIndexActiveSiteSlots(obj);
  }

  else if (obj.menuID == "view_update_Page") {
    updateRoleSummaryPanel(obj);
  }

  /* ---------- วางแทนบล็อคเดิมทั้งก้อนนี้ ---------- */
  else if (obj.menuID == "view_transmitter_list") {
    // ---- ไม่มี return กลางทาง ----
    try {
      // view_transmitter_list ต้อง map จาก radioID/txIndex จริง -> webindex ที่ได้จาก listTransmitter
      // databaseId ใช้เป็น fallback ชั่วคราวเท่านั้น เพราะบางกรณี server ส่งเป็นลำดับ live แบบ compact
      const id = resolveIndexLiveDeviceId(obj);
      if (!id) {
        console.warn("[INDEX] ignored view_transmitter_list because radioID/txIndex cannot map to a dashboard card", {
          radioID: obj.radioID,
          txIndex: obj.txIndex,
          databaseId: obj.databaseId,
          webIndex: obj.webIndex,
          webindex: obj.webindex,
          payload: obj
        });
        return;
      }
  
      // คำนวณค่า
      let swrmax = 2;
      const rawStationName = String(obj.stationName ?? "").trim();
      const frequencyMHz = Number(obj.frequency || 0) / 1e6;
      const frequencyText = Number(obj.frequency || 0) > 0 ? frequencyMHz.toFixed(4) + " MHz" : "";
      let stationName = frequencyText ? (rawStationName + " " + frequencyText).trim() : rawStationName;
  
      const fwd    = Number((obj.fwdPowerWatt*1.0).toFixed(2));
      let   fwdmax = Number((obj.maxFwdPowerWatt*1.0).toFixed(2));
      const rwd    = Number((obj.rwdPowerWatt*1.0).toFixed(2));
      let   rwdmax = Number((obj.maxFwdPowerWatt/2.0).toFixed(2));
      const fwd_dB = Number((obj.fwdPowerDB*1.0).toFixed(2));
      const rwd_dB = Number((obj.rwdPowerDB*1.0).toFixed(2));
      const swr    = Number((obj.vswr*1.0).toFixed(3));
      const rssiDb = Number(obj.rssi);
  
      const liveVisible = resolveIndexDeviceEnabled(obj, false);
      const visible = isIndexDeviceConfiguredVisible(id, obj) || liveVisible === true;
      const connectionStatus = (obj.connectionStatus == 1 || obj.connectionStatus === true || String(obj.connectionStatus).toLowerCase() === "true");
      const liveTxIdentity = normalizeIndexTxIdentity(obj.radioID ?? obj.txIndex ?? obj.index);
      indexDeviceLiveMap[id] = Object.assign(indexDeviceLiveMap[id] || {}, {
        txIdentity: liveTxIdentity,
        connectionStatus: connectionStatus,
        visible: visible,
        lastPayload: obj,
        lastSeenAt: Date.now()
      });
      scheduleIndexRoleSummaryFromLive('view_transmitter_list');
  
      // อ้างอิง element id ให้สอดคล้องกับ PHP
      const ids = {
        barFwd:         "barFwdLevel"      + id,
        barRwd:         "barRwdLevel"      + id,
        barSwr:         "barVswrLevel"     + id,
        rssiBar:        "barRssiLevel"     + id,
        fwdUnit:        "fwdUnit"          + id,
        rwdUnit:        "rwdUnit"          + id,
        fwdValue:       "fwdValue"         + id,
        rwdValue:       "rwdValue"         + id,
        swrValue:       "swrValue"         + id,
        rssiValue:      "rssiValue"        + id,
        title:          "title"            + id,
        currentCard:    "card"             + id,
        cardDisconnect: "cardDisconnect"   + id,
        plotCard:       "card_plot"        + id,      // ← ใช้ id เดียวกับที่ PHP สร้าง
        plotDisconnect: "cardplotDisconnect" + id,    // ← ให้ match กับ PHP
        plotDiv:        "myPlot"           + id
      };
  
      // กัน null แบบไม่ return
      const get = (x) => document.getElementById(x);

      // UI-only mirrors for the SVG-style index dashboard
      updateHomeOverviewPanel(id, obj, {
        fwd: fwd,
        rwd: rwd,
        swr: swr,
        rssiDb: rssiDb,
        connectionStatus: connectionStatus,
        visible: visible
      });
  
      // ชื่อบนหน้า index ต้องอิงจาก live payload นี้เป็นหลัก
      // listTransmitter ใช้ช่วยให้ card แสดงครบเท่านั้น ไม่ใช่ source สุดท้ายของชื่อ
      updateIndexDeviceHeaderFromLive(id, obj);
      // console.log("[INDEX NAME] source=view_transmitter_list id=", id,
      //   "webIndex=", obj.webIndex ?? obj.webindex,
      //   "txIndex=", obj.txIndex ?? obj.radioID,
      //   "index=", obj.index,
      //   "stationName=", rawStationName,
      //   "frequency=", frequencyText || "-- MHz");
  
      // normalize max
      if (fwd > fwdmax) fwdmax = fwd;
      if (rwd > rwdmax) rwdmax = rwd;
      if (swr > swrmax) swrmax = swr;
  
      // แสดง/ซ่อนการ์ดตาม config ก่อน ถ้า config enabled แล้ว live ขาดก็ยังต้องแสดง Offline
      setIndexDeviceVisible(id, visible);
  
      // การเชื่อมต่อ: โชว์/ซ่อนป้ายน็อตคอนเนค
      const dis1 = get(ids.cardDisconnect);
      const dis2 = get(ids.plotDisconnect);
      if (dis1) dis1.style.display = connectionStatus ? "none" : "block";
      if (dis2) dis2.style.display = connectionStatus ? "none" : "block";
  
      // ถ้าไม่ connected ก็ยัง “ไม่ return” — แค่ไม่อัปเดต bar ต่อ
      if (connectionStatus) {
        const fwdBarEl  = get(ids.barFwd);
        const rwdBarEl  = get(ids.barRwd);
        const swrBarEl  = get(ids.barSwr);
        const rssiBarEl = get(ids.rssiBar);
  
        // ความกว้างตามค่าจริง
        if (fwdBarEl) fwdBarEl.style.width = ((fwd * 100) / (fwdmax || 1)) + "%";
        if (swrBarEl) swrBarEl.style.width = ((swr * 100) / (swrmax || 1)) + "%";
  
        // ลง threshold ถ้ามี
        const th = thresholdMap[id];
        if (th) {
          const fwdSev  = getSeverity(fwd,   th.fwd.warn,  th.fwd.alert,  "low-bad");
          const rssiSev = getSeverity(rssiDb,th.rssi.warn, th.rssi.alert, "low-bad");
          const vswrSev = getSeverity(swr,   th.vswr.warn, th.vswr.alert, "high-bad");
  
          if (fwdBarEl) fwdBarEl.style.background = colorFromSeverity(fwdSev);
          if (swrBarEl) swrBarEl.style.background = colorFromSeverity(vswrSev);
  
          // RWD = 100% ตามดีไซน์คุณ
          if (rwdBarEl) {
            rwdBarEl.style.width = "100%";
            rwdBarEl.style.background = colorFromSeverity(vswrSev);
          }
          // RSSI = 100% ตามดีไซน์คุณ
          const rssiValEl = get(ids.rssiValue);
          if (!Number.isNaN(rssiDb)) {
            if (rssiValEl) rssiValEl.innerHTML = String(rssiDb);
            if (rssiBarEl) {
              rssiBarEl.style.width = "95%";
              rssiBarEl.style.background = colorFromSeverity(rssiSev);
            }
          }
        } else {
          // ไม่มี threshold → ค่าสี default
          if (rwdBarEl) { rwdBarEl.style.width = "100%"; rwdBarEl.style.background = colorFromSeverity("ok"); }
          if (!Number.isNaN(rssiDb)) {
            const rssiValEl = get(ids.rssiValue);
            if (rssiValEl) rssiValEl.innerHTML = String(rssiDb);
            if (rssiBarEl) { rssiBarEl.style.width = "100%"; rssiBarEl.style.background = colorFromSeverity("ok"); }
          }
        }
  
        // แสดงตัวเลข
        const fwdUnitEl = get(ids.fwdUnit);
        const rwdUnitEl = get(ids.rwdUnit);
        const fwdValEl  = get(ids.fwdValue);
        const rwdValEl  = get(ids.rwdValue);
        const swrValEl  = get(ids.swrValue);
  
        if (dBUnit) {
          if (fwdValEl)  fwdValEl.innerHTML = String(fwd_dB);
          if (rwdValEl)  rwdValEl.innerHTML = String(rwd_dB);
          if (fwdUnitEl) fwdUnitEl.innerHTML = "Forward Power (dBm)";
          if (rwdUnitEl) rwdUnitEl.innerHTML = "RSSI";
          setHTML("rwdMetricUnit" + id, "dBm");
        } else {
          if (fwdValEl)  fwdValEl.innerHTML = String(fwd);
          if (rwdValEl)  rwdValEl.innerHTML = String(rwd);
          if (fwdUnitEl) fwdUnitEl.innerHTML = "Forward Power (W)";
          if (rwdUnitEl) rwdUnitEl.innerHTML = "RSSI";
          setHTML("rwdMetricUnit" + id, "W");
        }
        if (swrValEl) swrValEl.innerHTML = String(swr);
  
        // เก็บ series + วาดกราฟ (ไม่ return ถ้า plot div หาย)
        // Normalize timestamp because Plotly date axes cannot render values like "T17:26:57".
        const date = normalizePlotTimestamp(obj.dateList || obj.date || "", obj.timestamp || obj.timeList || "");
        window.timeArrMap[id] = window.timeArrMap[id] || [];
        window.fwdArrMap[id]  = window.fwdArrMap[id]  || [];
        window.rwdArrMap[id]  = window.rwdArrMap[id]  || [];
        window.vswrArrMap[id] = window.vswrArrMap[id] || [];
        window.rssiArrMap[id] = window.rssiArrMap[id] || [];
  
        if (date && (timeArrMap[id].length === 0 || timeArrMap[id][timeArrMap[id].length - 1] !== date)) {
          timeArrMap[id].push(date);
          fwdArrMap[id].push(dBUnit ? fwd_dB : fwd);
          rwdArrMap[id].push(dBUnit ? rwd_dB : rwd);
          vswrArrMap[id].push(swr);
          rssiArrMap[id].push(Number.isNaN(rssiDb) ? null : rssiDb);
  
          if (timeArrMap[id].length > INDEX_MAX_TREND_POINTS) {
            timeArrMap[id].shift(); fwdArrMap[id].shift(); rwdArrMap[id].shift(); vswrArrMap[id].shift(); rssiArrMap[id].shift();
          }
  
          if (get(ids.plotDiv) && typeof drawMyPlot === "function") {
            drawMyPlot(fwdArrMap[id], rwdArrMap[id], vswrArrMap[id], timeArrMap[id], id, dBUnit, rssiArrMap[id]);
          }
        }
      }
  
      // ปิดท้าย: ย้ำการมองเห็นตาม config/live อีกครั้ง (idempotent)
      setIndexDeviceVisible(id, visible);
      if (visible && !indexDeviceLiveMap[id].plotInitialResizeDone) {
        indexDeviceLiveMap[id].plotInitialResizeDone = true;
        scheduleIndexPlotResize(document.getElementById(ids.plotDiv));
      }
      debugIndexDeviceCount('after view_transmitter_list id=' + id);
    } catch (e) {
      // จับ error ไม่ให้ฟังก์ชันหลุด (ยังคงวนต่อไปได้)
      console.warn("view_transmitter_list error:", e);
    }
  }
  
  
// เมื่อได้รับ listTransmitter ให้ใช้เป็น config source ว่า device ไหนควรแสดงบนหน้า index
else if (obj.menuID === 'listTransmitter') {
  const fallbackSlot = resolveIndexDeviceId(obj);
  const txIdentity = normalizeIndexTxIdentity(obj.index ?? obj.txIndex ?? obj.radioID);

  if (txIdentity) {
    indexTransmitterCatalogMap[txIdentity] = obj;
  }

  // Thresholds follow the slot where this transmitter is actually displayed.
  function rememberThresholdForSlot(slotId) {
    const id = normalizeIndexDashboardId(slotId);
    if (!id) return;
    thresholdMap[id] = {
      fwd:  { warn: Number(obj.warningFwdPowerWatt), alert: Number(obj.alertFwdPowerWatt) },
      rssi: { warn: Number(obj.warningRssi),         alert: Number(obj.alertRssi) },
      vswr: { warn: Number(obj.warningVSWR),         alert: Number(obj.alertVSWR) }
    };
  }

  if (indexActiveSiteSlotKnown) {
    const roleSlot = txIdentity ? normalizeIndexDashboardId(indexTxToSlotMap[txIdentity]) : '';
    if (roleSlot) {
      rememberThresholdForSlot(roleSlot);
      renderIndexSiteSlotFromCatalog(roleSlot, txIdentity);
    }
    // When active SITE is known, ignore fallback webindex for transmitters that
    // are not selected by chId1..chId16. This prevents qwert/THRULAN from being
    // rendered in the wrong SITE slot.
    scheduleIndexRoleSummaryFromLive('listTransmitter catalog with active site');
    debugIndexDeviceCount('after listTransmitter catalog tx=' + (txIdentity || '?'));
    return;
  }

  if (!fallbackSlot) {
    console.warn("[INDEX] ignored listTransmitter because webindex/webIndex does not match any dashboard card", obj);
    return;
  }

  if (txIdentity) {
    indexTxToSlotMap[txIdentity] = fallbackSlot;
    indexSlotToTxMap[fallbackSlot] = txIdentity;

    Object.keys(indexDeviceLiveMap).forEach(function (liveSlot) {
      if (liveSlot !== fallbackSlot && indexDeviceLiveMap[liveSlot]?.txIdentity === txIdentity) {
        delete indexDeviceLiveMap[liveSlot];
        setTrendOfflineState(liveSlot, true);
      }
    });
  }

  rememberThresholdForSlot(fallbackSlot);
  renderIndexConfiguredDevice(fallbackSlot, obj);
  scheduleIndexRoleSummaryFromLive('listTransmitter fallback order');
  debugIndexDeviceCount('after listTransmitter fallback id=' + fallbackSlot);
}

  else if (obj.menuID == "update") {
    if (obj.updateStatus == 2) {
      alert("System updated, Please restart your system.");
    }
  }

  // else { console.debug(message); }
}


function setUnit(unit) {
  dBUnit = (unit == 1);
  if (dBUnit) {
    setStyle("unitWattActive", "left", "calc(100% - 80px)");
    setStyle("unitWattActive", "backgroundColor", "#00968840");
    setStyle("unitDBActive", "left", "calc(100% - 160px)");
    setStyle("unitDBActive", "backgroundColor", "#009688FF");
  }
  else {
    setStyle("unitWattActive", "left", "calc(100% - 80px)");
    setStyle("unitWattActive", "backgroundColor", "#009688FF");
    setStyle("unitDBActive", "left", "calc(100% - 160px)");
    setStyle("unitDBActive", "backgroundColor", "#00968840");
  }

  // UI-only unit labels for reflected metric. Live values continue to use the existing data flow.
  for (let i = 1; i <= 16; i++) {
    setHTML("rwdMetricUnit" + i, dBUnit ? "dBm" : "W");
  }
}

function updateRFPwr() {
  var rfPower = $("rfPower") ? $("rfPower").value : "LOW1";
  var setRFPWR = "L1"
  if (rfPower == "LOW2") setRFPWR = "L2"
  else if (rfPower == "HIGH") setRFPWR = "H"
  var jsonMessage = '{"menuID":"MCHRFPWR", "setTxOutputLevel":"' + setRFPWR + '"}';
  if (ws.readyState == 1) {
    ws.send(jsonMessage);
  } else {
    alert("ERROR! Connection is closed...");
  }
}

function updateSQLLevel() {
  var el = $("sqlLevel"); if (!el) return;
  var sqlLevelCmmd = el.value;
  var jsonMessage = '{"menuID":"SETMSQLLV", "sqlLevelCmmd":"' + sqlLevelCmmd + '"}';
  if (ws.readyState == 1) {
    ws.send(jsonMessage);
  } else {
    alert("ERROR! Connection is closed...");
  }
}

function updateCHSel() {
  var el = $("chSel"); if (!el) return;
  var setMemChSel = el.value;
  var jsonMessage = '{"menuID":"MCHSEL", "setMemChSel":"' + setMemChSel + '"}';
  if (ws.readyState == 1) {
    ws.send(jsonMessage);
  } else {
    alert("ERROR! Connection is closed...");
  }
}

function decChannel(ttyDev) {
  var newChannel = parseInt(current_ch) - 1;
  var jsonMessage = '{"menuID":"MCHSEL","ttyDev":"ttyTHS' + ttyDev + '", "setMemChSel":"' + newChannel + '"}';
  if (ws.readyState == 1) {
    ws.send(jsonMessage);
  } else {
    alert("ERROR! Connection is closed...");
  }
}
function incChannel(ttyDev) {
  var newChannel = parseInt(current_ch) + 1;
  var jsonMessage = '{"menuID":"MCHSEL","ttyDev":"ttyTHS' + ttyDev + '", "setMemChSel":"' + newChannel + '"}';
  if (ws.readyState == 1) {
    ws.send(jsonMessage);
  } else {
    alert("ERROR! Connection is closed...");
  }
}
function decSqlLevel(ttyDev) {
  var newSql = parseInt(current_sql) - 1;
  current_sql = newSql;
  if (current_sql < 0) current_sql = 0;
  var jsonMessage = '{"menuID":"SETMSQLLV","ttyDev":"ttyTHS' + ttyDev + '", "sqlLevelCmmd":"' + current_sql + '"}';
  if (ws.readyState == 1) {
    ws.send(jsonMessage);
  } else {
    alert("ERROR! Connection is closed...");
  }
}
function incSqlLevel(ttyDev) {
  var newSql = parseInt(current_sql) + 1;
  current_sql = newSql;
  if (current_sql > 15) current_sql = 15;
  var jsonMessage = '{"menuID":"SETMSQLLV","ttyDev":"ttyTHS' + ttyDev + '", "sqlLevelCmmd":"' + current_sql + '"}';
  if (ws.readyState == 1) {
    ws.send(jsonMessage);
  } else {
    alert("ERROR! Connection is closed...");
  }
}
function sethipower(ttyDev) {
  var setRFPWR = "H"
  var jsonMessage = '{"menuID":"MCHRFPWR","ttyDev":"ttyTHS' + ttyDev + '", "setTxOutputLevel":"' + setRFPWR + '"}';
  if (ws.readyState == 1) {
    ws.send(jsonMessage);
  } else {
    alert("ERROR! Connection is closed...");
  }
}
function setl1power(ttyDev) {
  var setRFPWR = "L1"
  var jsonMessage = '{"menuID":"MCHRFPWR","ttyDev":"ttyTHS' + ttyDev + '", "setTxOutputLevel":"' + setRFPWR + '"}';
  if (ws.readyState == 1) {
    ws.send(jsonMessage);
  } else {
    alert("ERROR! Connection is closed...");
  }
}
function setl2power(ttyDev) {
  var setRFPWR = "L2"
  var jsonMessage = '{"menuID":"MCHRFPWR","ttyDev":"ttyTHS' + ttyDev + '", "setTxOutputLevel":"' + setRFPWR + '"}';
  if (ws.readyState == 1) {
    ws.send(jsonMessage);
  } else {
    alert("ERROR! Connection is closed...");
  }
}

function animateResultCount(numberfwd, targetfwd, numberrwd, targetrwd) {
  const elF = $("fwd"), elR = $("rwd");
  if (!elF || !elR) return;

  var maxFwd = 50, maxRwd = 0;
  if (targetfwd > maxFwd) maxFwd = targetfwd;
  maxRwd = maxFwd / 2;
  var timeout = 20;

  if (nIntervId == null) {
    var count1 = 0;
    if (!((numberfwd * 1).toFixed(0) == (targetfwd * 1).toFixed(0))) {
      nIntervId = setInterval(function () {
        if ((numberfwd * 1).toFixed(0) == (targetfwd * 1).toFixed(0)) {
          clearInterval(nIntervId); nIntervId = null;
        }
        count1++;
        if (count1 == timeout) {
          targetfwd = numberfwd;
          clearInterval(nIntervId); nIntervId = null;
        }
        const elF2 = $("fwd"), elR2 = $("rwd");
        if (!elF2 || !elR2) { clearInterval(nIntervId); nIntervId = null; return; }
        myProgressCircle(elF2.innerHTML, elR2.innerHTML, 0, maxFwd, 0, maxRwd, vswr, rssi);
      }, 50);
    }
    myProgressCircle(elF.innerHTML, elR.innerHTML, 0, maxFwd, 0, maxRwd, vswr, rssi);
  } else {
    // console.log("busy");
  }
}

function myCanvasfwd(fwd) {
  const el = $("fwd"); if (!el) return;
  const options = { startVal: el.innerHTML, decimalPlaces: 2, useGrouping: false, duration: 1 };
  var c = new CountUp('fwd', fwd, options);
  c.start();
}

function myCanvasrwd(rwd) {
  const el = $("rwd"); if (!el) return;
  const options = { startVal: el.innerHTML, decimalPlaces: 2, useGrouping: false, duration: 1 };
  var c = new CountUp('rwd', rwd, options);
  c.start();
}

function myProgressCircle(fwd, rwd, fwdMin, fwdMax, rwdMin, rwdMax, vswr_val, rssi_val) {
  const c = $("myCanvas");
  if (!c) return;
  var gradient;
  var arcBegin = 0;
  var arcEnd = 180;
  var arcBgEnd = 360;
  var size = 300;
  var lineWidth = 2;
  var x = size / 2;
  var y = size / 2;
  var start = Math.PI * (arcBegin / 180);
  var end = Math.PI * (arcEnd / 180);
  var end_bg = Math.PI * (arcBgEnd / 180);
  var start_bg = Math.PI * (arcBegin / 180);
  var ctx = c.getContext("2d");
  var strvswr = "1:" + (vswr_val * 1.0).toFixed(2);

  ctx.clearRect(0, 0, size, size);
  // outline
  ctx.beginPath();
  ctx.arc(x, y, (size / 2) - lineWidth / 2, start_bg, end_bg, false);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  //Input Level (Forward)
  arcBegin = 180 + 270;
  if (fwd > fwdMax) fwd = fwdMax;
  arcEnd = (((fwd - fwdMin) / (fwdMax - fwdMin)) * 180) + 90;
  if (arcEnd < 90) arcEnd = 90;
  arcBgEnd = arcEnd;
  size = 280;
  lineWidth = 10;
  x = size / 2;
  y = size / 2;
  start = Math.PI * (arcBegin / 180);
  end = Math.PI * (arcEnd / 180);

  //background
  ctx.beginPath();
  ctx.arc(x + lineWidth, y + lineWidth, (size / 2) - lineWidth / 2, start_bg, end_bg, false);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = "gray";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + lineWidth, y + lineWidth, (size / 2) - lineWidth / 2, start, end, false);
  ctx.lineWidth = lineWidth;
  gradient = ctx.createLinearGradient(0, 0, size / 2, size);
  gradient.addColorStop(0, '#1DE9B6');
  gradient.addColorStop(0.3, '#1DE9B6');
  gradient.addColorStop(0.5, '#FFFF00');
  gradient.addColorStop(0.8, '#FF0000');
  gradient.addColorStop(1, '#FF0000');
  ctx.strokeStyle = gradient;
  ctx.stroke();

  // Reflected
  arcBegin = 180 + 90;
  if (rwd > rwdMax) rwd = rwdMax;
  arcEnd = (((rwd - rwdMin) / (rwdMax - rwdMin)) * 180) + 270;
  if (arcEnd < 270) arcEnd = 270;
  start = Math.PI * (arcBegin / 180);
  end = Math.PI * (arcEnd / 180);

  ctx.beginPath();
  ctx.arc(x + lineWidth, y + lineWidth, (size / 2) - lineWidth / 2, start, end, false);
  ctx.lineWidth = lineWidth;
  gradient = ctx.createLinearGradient(0, 0, size / 3, size);
  gradient.addColorStop(0, '#1DE9B6');
  gradient.addColorStop(0.4, '#FFFF00');
  gradient.addColorStop(0.6, '#FFFF00');
  gradient.addColorStop(0.8, '#FF0000');
  gradient.addColorStop(1, '#FF0000');
  ctx.strokeStyle = gradient;
  ctx.stroke();

  ctx.fillStyle = "#FA057E";
  ctx.font = "50px sans-serif";
  drawCenteredText(strvswr, x, y + lineWidth);

  ctx.fillStyle = "gray";
  ctx.font = "20px sans-serif";
  drawCenteredText("VSWR", x, y + lineWidth + 45);

  function drawCenteredText(text, centerX, centerY) {
    ctx.save();
    var approxFontHeight = parseInt(ctx.font);
    ctx.textAlign = "center";
    ctx.fillText(text, centerX, centerY + approxFontHeight / 4);
  }
}

// playground: stackblitz.com/edit/countup-typescript
var __assign = (this && this.__assign) || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
        t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};

var CountUp = /** @class */ (function () {
  function CountUp(target, endVal, options) {
    var _this = this;
    this.target = target;
    this.endVal = endVal;
    this.options = options;
    this.version = '2.0.4';
    this.defaults = {
      startVal: 0,
      decimalPlaces: 0,
      duration: 2,
      useEasing: true,
      useGrouping: true,
      smartEasingThreshold: 999,
      smartEasingAmount: 333,
      separator: ',',
      decimal: '.',
      prefix: '',
      suffix: ''
    };
    this.finalEndVal = null; // for smart easing
    this.useEasing = true;
    this.countDown = false;
    this.error = '';
    this.startVal = 0;
    this.paused = true;
    this.count = function (timestamp) {
      if (!_this.startTime) {
        _this.startTime = timestamp;
      }
      var progress = timestamp - _this.startTime;
      _this.remaining = _this.duration - progress;
      if (_this.useEasing) {
        if (_this.countDown) {
          _this.frameVal = _this.startVal - _this.easingFn(progress, 0, _this.startVal - _this.endVal, _this.duration);
        }
        else {
          _this.frameVal = _this.easingFn(progress, _this.startVal, _this.endVal - _this.startVal, _this.duration);
        }
      }
      else {
        if (_this.countDown) {
          _this.frameVal = _this.startVal - ((_this.startVal - _this.endVal) * (progress / _this.duration));
        }
        else {
          _this.frameVal = _this.startVal + (_this.endVal - _this.startVal) * (progress / _this.duration);
        }
      }
      if (_this.countDown) {
        _this.frameVal = (_this.frameVal < _this.endVal) ? _this.endVal : _this.frameVal;
      }
      else {
        _this.frameVal = (_this.frameVal > _this.endVal) ? _this.endVal : _this.frameVal;
      }
      _this.frameVal = Math.round(_this.frameVal * _this.decimalMult) / _this.decimalMult;
      _this.printValue(_this.frameVal);
      if (progress < _this.duration) {
        _this.rAF = requestAnimationFrame(_this.count);
      }
      else if (_this.finalEndVal !== null) {
        _this.update(_this.finalEndVal);
      }
      else {
        if (_this.callback) {
          _this.callback();
        }
      }
    };
    this.formatNumber = function (num) {
      var neg = (num < 0) ? '-' : '';
      var result, x, x1, x2, x3;
      result = Math.abs(num).toFixed(_this.options.decimalPlaces);
      result += '';
      x = result.split('.');
      x1 = x[0];
      x2 = x.length > 1 ? _this.options.decimal + x[1] : '';
      if (_this.options.useGrouping) {
        x3 = '';
        for (var i = 0, len = x1.length; i < len; ++i) {
          if (i !== 0 && (i % 3) === 0) {
            x3 = _this.options.separator + x3;
          }
          x3 = x1[len - i - 1] + x3;
        }
        x1 = x3;
      }
      if (_this.options.numerals && _this.options.numerals.length) {
        x1 = x1.replace(/[0-9]/g, function (w) { return _this.options.numerals[+w]; });
        x2 = x2.replace(/[0-9]/g, function (w) { return _this.options.numerals[+w]; });
      }
      return neg + _this.options.prefix + x1 + x2;
    };
    this.easeOutExpo = function (t, b, c, d) {
      return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
    };
    this.options = __assign({}, this.defaults, options);
    this.formattingFn = (this.options.formattingFn) ? this.options.formattingFn : this.formatNumber;
    this.easingFn = (this.options.easingFn) ? this.options.easingFn : this.easeOutExpo;
    this.startVal = this.validateValue(this.options.startVal);
    this.frameVal = this.startVal;
    this.endVal = this.validateValue(endVal);
    this.options.decimalPlaces = Math.max(0 || this.options.decimalPlaces);
    this.decimalMult = Math.pow(10, this.options.decimalPlaces);
    this.resetDuration();
    this.options.separator = String(this.options.separator);
    this.useEasing = this.options.useEasing;
    if (this.options.separator === '') {
      this.options.useGrouping = false;
    }
    this.el = (typeof target === 'string') ? document.getElementById(target) : target;
    if (this.el) {
      this.printValue(this.startVal);
    }
    else {
      this.error = '[CountUp] target is null or undefined';
    }
  }
  CountUp.prototype.determineDirectionAndSmartEasing = function () {
    var end = (this.finalEndVal) ? this.finalEndVal : this.endVal;
    this.countDown = (this.startVal > end);
    var animateAmount = end - this.startVal;
    if (Math.abs(animateAmount) > this.options.smartEasingThreshold) {
      this.finalEndVal = end;
      var up = (this.countDown) ? 1 : -1;
      this.endVal = end + (up * this.options.smartEasingAmount);
      this.duration = this.duration / 2;
    }
    else {
      this.endVal = end;
      this.finalEndVal = null;
    }
    if (this.finalEndVal) {
      this.useEasing = false;
    }
    else {
      this.useEasing = this.options.useEasing;
    }
  };
  CountUp.prototype.start = function (callback) {
    if (this.error) { return; }
    this.callback = callback;
    if (this.duration > 0) {
      this.determineDirectionAndSmartEasing();
      this.paused = false;
      this.rAF = requestAnimationFrame(this.count);
    }
    else {
      this.printValue(this.endVal);
    }
  };
  CountUp.prototype.pauseResume = function () {
    if (!this.paused) {
      cancelAnimationFrame(this.rAF);
    }
    else {
      this.startTime = null;
      this.duration = this.remaining;
      this.startVal = this.frameVal;
      this.determineDirectionAndSmartEasing();
      this.rAF = requestAnimationFrame(this.count);
    }
    this.paused = !this.paused;
  };
  CountUp.prototype.reset = function () {
    cancelAnimationFrame(this.rAF);
    this.paused = true;
    this.resetDuration();
    this.startVal = this.validateValue(this.options.startVal);
    this.frameVal = this.startVal;
    this.printValue(this.startVal);
  };
  CountUp.prototype.update = function (newEndVal) {
    cancelAnimationFrame(this.rAF);
    this.startTime = null;
    this.endVal = this.validateValue(newEndVal);
    if (this.endVal === this.frameVal) { return; }
    this.startVal = this.frameVal;
    if (!this.finalEndVal) {
      this.resetDuration();
    }
    this.determineDirectionAndSmartEasing();
    this.rAF = requestAnimationFrame(this.count);
  };
  CountUp.prototype.printValue = function (val) {
    var result = this.formattingFn(val);
    if (this.el.tagName === 'INPUT') {
      var input = this.el;
      input.value = result;
    }
    else if (this.el.tagName === 'text' || this.el.tagName === 'tspan') {
      this.el.textContent = result;
    }
    else {
      this.el.innerHTML = result;
    }
  };
  CountUp.prototype.ensureNumber = function (n) {
    return (typeof n === 'number' && !isNaN(n));
  };
  CountUp.prototype.validateValue = function (value) {
    var newValue = Number(value);
    if (!this.ensureNumber(newValue)) {
      this.error = "[CountUp] invalid start or end value: " + value;
      return null;
    }
    else {
      return newValue;
    }
  };
  CountUp.prototype.resetDuration = function () {
    this.startTime = null;
    this.duration = Number(this.options.duration) * 1000;
    this.remaining = this.duration;
  };
  return CountUp;
}());


function getIndexPlotTheme() {
  const isLight = document.documentElement.getAttribute('data-rf-theme') === 'light';
  if (isLight) {
    return {
      paper: '#dfeaf5',
      plot: '#dfeaf5',
      text: '#111827',
      muted: '#243447',
      grid: '#8fa8bf',
      line: '#111827',
      forwardColor: '#0284c7',
      reflectedColor: '#059669',
      vswrColor: '#d97706',
      markerBorder: '#ffffff'
    };
  }
  return {
    paper: '#0b1420',
    plot: '#0b1420',
    text: '#eaf2ff',
    muted: '#94a7bf',
    grid: '#29435e',
    line: '#eaf2ff',
    forwardColor: '#38bdf8',
    reflectedColor: '#22c55e',
    vswrColor: '#f59e0b',
    markerBorder: '#0b1420'
  };
}

function renderEmptyTrend(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const isLight = document.documentElement.getAttribute('data-rf-theme') === 'light';
  el.classList.remove('rf-plot-rendered');
  el.innerHTML = '<div class="rf-trend-empty-state">' +
    '<span class="rf-trend-empty-title">No trend data</span>' +
    '<small>Waiting for live RF samples</small>' +
    '</div>';
  el.style.background = isLight ? '#dfeaf5' : '#0b1420';
}

function getIndexPlotSize(targetEl) {
  if (!targetEl) return { width: 720, height: 300 };
  const trendCard = targetEl.closest('.rf-trend-card') || targetEl.parentElement;
  const head = trendCard ? trendCard.querySelector('.rf-trend-head') : null;
  const rect = targetEl.getBoundingClientRect ? targetEl.getBoundingClientRect() : { width: 0, height: 0 };
  const parentRect = trendCard && trendCard.getBoundingClientRect ? trendCard.getBoundingClientRect() : { width: 0, height: 0 };
  const headHeight = head ? (head.getBoundingClientRect().height || 0) : 0;
  const width = Math.max(360, Math.floor(rect.width || targetEl.clientWidth || parentRect.width || 720));
  const height = Math.max(240, Math.floor(rect.height || targetEl.clientHeight || (parentRect.height ? parentRect.height - headHeight - 16 : 300)));
  return { width, height };
}

function renderIndexChartNow(id, chart) {
  const key = String(id);
  if (!chart || typeof chart.render !== 'function') return;
  try {
    chart.render();
    indexPlotLastRenderMap[key] = Date.now();
  } catch (e) {
    console.warn('CanvasJS render skipped:', e);
  }
}

function scheduleIndexChartRender(id, chart, force) {
  const key = String(id);
  if (!chart || typeof chart.render !== 'function') return;

  // Do not spend CPU rendering hidden browser tabs; data continues to be buffered.
  // When the tab becomes visible again, setupIndexVisibilityResume() redraws visible plots once.
  if (document.hidden) return;

  const now = Date.now();
  const last = indexPlotLastRenderMap[key] || 0;
  const elapsed = now - last;

  if (force || elapsed >= INDEX_PLOT_RENDER_MIN_MS) {
    if (indexPlotRenderTimerMap[key]) {
      clearTimeout(indexPlotRenderTimerMap[key]);
      indexPlotRenderTimerMap[key] = null;
    }
    if (indexPlotRenderPendingMap[key]) return;
    indexPlotRenderPendingMap[key] = true;
    requestAnimationFrame(function () {
      indexPlotRenderPendingMap[key] = false;
      renderIndexChartNow(key, chart);
    });
    return;
  }

  if (indexPlotRenderTimerMap[key]) return;
  indexPlotRenderTimerMap[key] = setTimeout(function () {
    indexPlotRenderTimerMap[key] = null;
    scheduleIndexChartRender(key, chart, true);
  }, Math.max(80, INDEX_PLOT_RENDER_MIN_MS - elapsed));
}

function resizeIndexPlot(targetEl) {
  if (!targetEl) return;
  const id = String(targetEl.id || '').replace('myPlot', '');
  const chart = window.canvasTrendChartMap && window.canvasTrendChartMap[id];
  if (chart && typeof chart.render === 'function') {
    scheduleIndexChartRender(id, chart, true);
  }
}

function scheduleIndexPlotResize(targetEl) {
  if (!targetEl) return;
  const id = String(targetEl.id || '').replace('myPlot', '');
  const now = Date.now();
  const last = indexPlotLastResizeMap[id] || 0;

  if ((now - last) < INDEX_PLOT_RESIZE_MIN_MS) {
    clearTimeout(indexPlotResizeTimerMap[id]);
    indexPlotResizeTimerMap[id] = setTimeout(function () {
      indexPlotLastResizeMap[id] = Date.now();
      resizeIndexPlot(targetEl);
    }, INDEX_PLOT_RESIZE_MIN_MS - (now - last));
    return;
  }

  if (indexPlotResizePendingMap[id]) return;
  indexPlotResizePendingMap[id] = true;
  indexPlotLastResizeMap[id] = now;
  requestAnimationFrame(function () {
    indexPlotResizePendingMap[id] = false;
    resizeIndexPlot(targetEl);
  });
}

function redrawIndexPlotById(id, force) {
  const key = String(id);
  const targetEl = document.getElementById('myPlot' + key);
  if (!targetEl) return;
  if (timeArrMap[key] && timeArrMap[key].length && typeof drawMyPlot === 'function') {
    drawMyPlot(fwdArrMap[key] || [], rwdArrMap[key] || [], vswrArrMap[key] || [], timeArrMap[key] || [], key, dBUnit, rssiArrMap[key] || [], { forceRender: !!force });
  } else {
    renderEmptyTrend('myPlot' + key);
  }
  scheduleIndexPlotResize(targetEl);
}

function scheduleIndexPlotRedraw(id) {
  const key = String(id);
  if (indexPlotRedrawPendingMap[key]) return;
  indexPlotRedrawPendingMap[key] = true;
  requestAnimationFrame(function () {
    indexPlotRedrawPendingMap[key] = false;
    redrawIndexPlotById(key, false);
  });
}

function refreshIndexPlotsForTheme() {
  try {
    for (let id = 1; id <= 16; id++) {
      const plotCard = document.getElementById('card_plot' + id);
      const isVisible = plotCard && plotCard.style.display !== 'none';
      if (isVisible) redrawIndexPlotById(id, true);
    }
  } catch (e) {
    console.warn('Plot theme refresh skipped:', e);
  }
}

function setupIndexPlotThemeObserver() {
  if (window.__indexPlotThemeObserverInstalled) return;
  window.__indexPlotThemeObserverInstalled = true;
  const refreshSoon = function () {
    requestAnimationFrame(refreshIndexPlotsForTheme);
  };
  const observer = new MutationObserver(refreshSoon);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-rf-theme'] });
  window.addEventListener('rf-theme-change', refreshSoon);
}

(function initIndexPlotThemeObserver() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupIndexPlotThemeObserver);
  } else {
    setupIndexPlotThemeObserver();
  }
})();

(function setupIndexVisibilityResume() {
  if (window.__indexVisibilityResumeInstalled) return;
  window.__indexVisibilityResumeInstalled = true;
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) requestAnimationFrame(refreshIndexPlotsForTheme);
  });
})();

function toCanvasPoint(xValue, yValue) {
  const x = normalizePlotTimeValue(xValue);
  const xDate = x ? new Date(x) : new Date();
  const y = Number(yValue);
  return {
    x: Number.isNaN(xDate.getTime()) ? new Date() : xDate,
    y: Number.isFinite(y) ? y : null
  };
}

function applyIndexChartOptions(chart, targetId, id, forwardPoints, reflectedPoints, vswrPoints, plotTheme, tooltipBg, tooltipBorder, powerUnit) {
  const commonLine = {
    type: 'line',
    showInLegend: true,
    lineThickness: 2,
    markerSize: 0
  };

  const options = {
    animationEnabled: false,
    zoomEnabled: false,
    backgroundColor: plotTheme.plot,
    culture: 'en',
    title: { text: '' },
    legend: {
      horizontalAlign: 'center',
      verticalAlign: 'top',
      fontColor: plotTheme.text,
      fontSize: 11,
      cursor: 'pointer'
    },
    toolTip: {
      shared: true,
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      fontColor: plotTheme.text,
      contentFormatter: function (e) {
        const date = e.entries && e.entries.length ? e.entries[0].dataPoint.x : new Date();
        const timeText = date instanceof Date ? date.toTimeString().slice(0, 8) : '';
        let html = '<strong>' + timeText + '</strong><br/>';
        e.entries.forEach(function (entry) {
          const unit = entry.dataSeries.options.axisYType === 'secondary' ? '' : ' ' + powerUnit;
          html += entry.dataSeries.name + ': ' + entry.dataPoint.y + unit + '<br/>';
        });
        return html;
      }
    },
    axisX: {
      valueFormatString: 'HH:mm:ss',
      labelFontColor: plotTheme.text,
      labelFontSize: 10,
      lineColor: plotTheme.line,
      tickColor: plotTheme.line,
      gridColor: plotTheme.grid,
      gridThickness: 1,
      margin: 8
    },
    axisY: {
      title: 'Power (' + powerUnit + ')',
      titleFontColor: plotTheme.text,
      labelFontColor: plotTheme.text,
      labelFontSize: 10,
      lineColor: plotTheme.line,
      tickColor: plotTheme.line,
      gridColor: plotTheme.grid,
      gridThickness: 1,
      includeZero: false
    },
    axisY2: {
      title: 'VSWR',
      titleFontColor: plotTheme.text,
      labelFontColor: plotTheme.text,
      labelFontSize: 10,
      lineColor: plotTheme.line,
      tickColor: plotTheme.line,
      gridThickness: 0,
      includeZero: false
    },
    data: [
      Object.assign({}, commonLine, {
        name: 'Forward',
        color: plotTheme.forwardColor,
        markerColor: plotTheme.forwardColor,
        markerBorderColor: plotTheme.markerBorder,
        markerBorderThickness: 1,
        dataPoints: forwardPoints
      }),
      Object.assign({}, commonLine, {
        name: 'Reflected',
        color: plotTheme.reflectedColor,
        markerColor: plotTheme.reflectedColor,
        markerBorderColor: plotTheme.markerBorder,
        markerBorderThickness: 1,
        dataPoints: reflectedPoints
      }),
      Object.assign({}, commonLine, {
        name: 'VSWR',
        axisYType: 'secondary',
        color: plotTheme.vswrColor,
        markerColor: plotTheme.vswrColor,
        markerBorderColor: plotTheme.markerBorder,
        markerBorderThickness: 1,
        dataPoints: vswrPoints
      })
    ]
  };

  // CanvasJS exposes .options; updating it avoids constructing thousands of chart objects.
  chart.options = options;
  return chart;
}

function buildIndexTrendPoints(fwd, rwd, vswr, time) {
  const normalizedTimes = time.map(normalizePlotTimeValue);
  let latest = new Date(normalizedTimes[normalizedTimes.length - 1] || Date.now());
  if (Number.isNaN(latest.getTime())) latest = new Date();
  const earliest = new Date(latest.getTime() - 10 * 60 * 1000);

  const forwardPoints = [];
  const reflectedPoints = [];
  const vswrPoints = [];

  for (let i = 0; i < normalizedTimes.length; i++) {
    if (!normalizedTimes[i]) continue;
    const t = new Date(normalizedTimes[i]);
    if (!Number.isNaN(t.getTime()) && t >= earliest) {
      forwardPoints.push(toCanvasPoint(normalizedTimes[i], fwd[i]));
      reflectedPoints.push(toCanvasPoint(normalizedTimes[i], rwd[i]));
      vswrPoints.push(toCanvasPoint(normalizedTimes[i], vswr[i]));
    }
  }

  if (forwardPoints.length === 0) {
    const startIndex = Math.max(0, normalizedTimes.length - 60);
    for (let i = startIndex; i < normalizedTimes.length; i++) {
      if (!normalizedTimes[i]) continue;
      forwardPoints.push(toCanvasPoint(normalizedTimes[i], fwd[i]));
      reflectedPoints.push(toCanvasPoint(normalizedTimes[i], rwd[i]));
      vswrPoints.push(toCanvasPoint(normalizedTimes[i], vswr[i]));
    }
  }

  return { forwardPoints, reflectedPoints, vswrPoints };
}

function drawMyPlot(fwd, rwd, vswr, time, id, dBUnit, rssiSeries, options) {
  const targetId = `myPlot${id}`;
  const key = String(id);
  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;

  if (typeof CanvasJS === 'undefined') {
    targetEl.innerHTML = '<div class="rf-trend-empty-state">' +
      '<span class="rf-trend-empty-title">CanvasJS not loaded</span>' +
      '<small>Check local canvasjs.min.js</small>' +
      '</div>';
    return;
  }

  if (!Array.isArray(time) || time.length === 0) {
    renderEmptyTrend(targetId);
    return;
  }

  const powerUnit = dBUnit ? "dBm" : "W";
  const points = buildIndexTrendPoints(fwd, rwd, vswr, time);

  if (points.forwardPoints.length === 0) {
    renderEmptyTrend(targetId);
    return;
  }

  const plotTheme = getIndexPlotTheme();
  const isLight = document.documentElement.getAttribute('data-rf-theme') === 'light';
  const tooltipBg = isLight ? '#ffffff' : '#0b1420';
  const tooltipBorder = isLight ? '#9fb6cc' : '#29435e';

  targetEl.classList.add('rf-plot-rendered', 'rf-canvasjs-plot');
  targetEl.style.visibility = 'visible';
  targetEl.style.opacity = '1';

  let chart = window.canvasTrendChartMap[key];
  const isNewChart = !chart;

  if (isNewChart) {
    targetEl.innerHTML = '';
    chart = new CanvasJS.Chart(targetId, {});
    window.canvasTrendChartMap[key] = chart;
  }

  applyIndexChartOptions(
    chart,
    targetId,
    key,
    points.forwardPoints,
    points.reflectedPoints,
    points.vswrPoints,
    plotTheme,
    tooltipBg,
    tooltipBorder,
    powerUnit
  );

  scheduleIndexChartRender(key, chart, !!(options && options.forceRender) || isNewChart);
  if (isNewChart) scheduleIndexPlotResize(targetEl);
}


// helper (วางบนสุดใกล้ ๆ setHTML)
function paintFullBar(barEl, color) {
  if (!barEl) return;
  barEl.style.removeProperty('width');
  barEl.style.removeProperty('flex-basis');
  barEl.style.setProperty('width', '95%', 'important'); // เต็มตลอด
  barEl.style.background = color; // ลงสีตาม severity
}