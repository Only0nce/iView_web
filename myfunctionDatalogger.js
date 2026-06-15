var ws, wsUri;
window.tableData = [];
window.filteredTableData = null;
window.stationSet = new Set();
window.logTextFilter = "";

function valueForDisplay(value) {
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i--) {
      if (value[i] !== undefined && value[i] !== null && value[i] !== "") return value[i];
    }
    return "";
  }
  return value;
}

function pickFirst(...vals) {
  for (const v of vals) {
    const value = valueForDisplay(v);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function safeText(value, fallback = "") {
  const v = valueForDisplay(value);
  return v === undefined || v === null || v === "" ? fallback : String(v);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function toNumber(value) {
  const n = Number(valueForDisplay(value));
  return Number.isFinite(n) ? n : null;
}

function safeNumber(value, decimals = 3, fallback = "") {
  const n = toNumber(value);
  return n === null ? fallback : n.toFixed(decimals);
}

function numericValueFromText(value) {
  const n = Number(String(value ?? "").replace(/[^0-9+\-.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function dbmFromWattValue(value) {
  const w = toNumber(value);
  if (w === null || w <= 0) return "";
  return (10 * Math.log10(w * 1000)).toFixed(3);
}

function getDateTime(row) {
  return safeText(pickFirst(
    row.startLog,
    row.startTime,
    row.start_time,
    (row.dateList || row.timeList) ? `${row.dateList || ""} ${row.timeList || ""}`.trim() : "",
    row.endLog
  ));
}

function getEndTime(row) {
  return safeText(pickFirst(row.endLog, row.endTime, row.end_time));
}

function getSiteName(row) {
  return safeText(pickFirst(row.siteName, row.site_name, row.site, row.siteID, row.siteId));
}

function getDeviceName(row) {
  return safeText(pickFirst(
    row.deviceName,
    row.device_name,
    row.device,
    row.deviceID,
    row.deviceId,
    row.txIndex,
    row.radioID
  ));
}

function getStationName(row) {
  return safeText(pickFirst(row.stationName, row.station_name, row.station));
}

function getFrequencyMHz(row) {
  const raw = valueForDisplay(pickFirst(row.frequencyMHz, row.frequency_mhz, row.frequency));
  const n = Number(raw);
  if (!Number.isFinite(n)) return safeText(raw);
  return (n > 100000 ? n / 1000000 : n).toFixed(3);
}

function getForwardMaxW(row) {
  return safeNumber(pickFirst(
    row.forwardMaxHoldWatt,
    row.forwardMaxHoldW,
    row.maxPowerWatt,
    row.fwdPowerMaxHoldWatt,
    row.fwdPowerMaxHold,
    row.forwardMax,
    row.maxForwardPowerWatt,
    row.maxFwdPowerWatt,
    row.fwdWattList
  ));
}

function getForwardMaxDbm(row) {
  const direct = safeNumber(pickFirst(
    row.forwardMaxHoldDbm,
    row.forwardMaxHoldDB,
    row.maxPowerDB,
    row.maxPowerDbm,
    row.fwdPowerMaxHoldDbm,
    row.fwdPowerMaxHoldDB,
    row.forwardMaxDbm,
    row.forwardMaxDB,
    row.maxForwardPowerDB,
    row.maxFwdPowerDB,
    row.fwd_dBmList
  ), 3);
  if (direct !== "") return direct;
  return dbmFromWattValue(pickFirst(row.forwardMaxHoldWatt, row.maxPowerWatt, row.fwdWattList));
}

function getAvgForwardRmsW(row) {
  return safeNumber(pickFirst(
    row.averageForwardRmsWatt,
    row.averageForwardRmsW,
    row.averageForwardRms,
    row.forwardAvgRmsWatt,
    row.forwardAvgRmsW,
    row.forwardAvgRms,
    row.forwardRmsWatt,
    row.forwardRms,
    row.fwdAvgRmsWatt,
    row.fwdRmsWatt,
    row.fwdRms,
    row.fwdPowerWatt,
    row.fwdWattList,
    row.fwdPowerRmsWattList,
    row.fwdRmsWattList,
    row.fwdPowerRmsWatt,
    row.fwdPowerCurrentRmsW
  ));
}

function getAvgForwardRmsDbm(row) {
  return safeNumber(pickFirst(
    row.averageForwardRmsDbm,
    row.averageForwardRmsDB,
    row.forwardAvgRmsDbm,
    row.forwardAvgRmsDB,
    row.forwardRmsDbm,
    row.forwardRmsDB,
    row.fwdAvgRmsDbm,
    row.fwdAvgRmsDB,
    row.fwdRmsDbm,
    row.fwdRmsDB,
    row.fwdPowerDB,
    row.fwd_dBmList,
    row.fwdPowerRmsDBList,
    row.fwdRms_dBmList,
    row.fwdPowerRmsDB,
    row.fwdPowerCurrentRmsDB
  ), 3);
}

function getReflectedMaxW(row) {
  return safeNumber(pickFirst(
    row.reflectedMaxHoldWatt,
    row.reflectedMaxHoldW,
    row.reflectedMaxHold,
    row.rwdPowerMaxHoldWatt,
    row.rwdPowerMaxHold,
    row.reflectedMax,
    row.maxReflectedPowerWatt,
    row.maxRwdPowerWatt,
    row.rwdWattList
  ));
}

function getReflectedMaxDbm(row) {
  const direct = safeNumber(pickFirst(
    row.reflectedMaxHoldDbm,
    row.reflectedMaxHoldDB,
    row.rwdPowerMaxHoldDbm,
    row.rwdPowerMaxHoldDB,
    row.reflectedMaxDbm,
    row.reflectedMaxDB,
    row.maxReflectedPowerDB,
    row.maxRwdPowerDB,
    row.rwd_dBmList
  ), 3);
  if (direct !== "") return direct;
  return dbmFromWattValue(pickFirst(row.reflectedMaxHoldWatt, row.maxReflectedPowerWatt, row.maxRwdPowerWatt, row.rwdWattList));
}

function getAvgReflectedRmsW(row) {
  return safeNumber(pickFirst(
    row.averageReflectedRmsWatt,
    row.averageReflectedRmsW,
    row.averageReflectedRms,
    row.averageRwdRmsWatt,
    row.averageRwdRms,
    row.reflectedAvgRmsWatt,
    row.reflectedAvgRmsW,
    row.reflectedAvgRms,
    row.reflectedRmsWatt,
    row.reflectedRms,
    row.rwdAvgRmsWatt,
    row.rwdRmsWatt,
    row.rwdRms,
    row.rwdPowerWatt,
    row.rwdWattList,
    row.rwdPowerRmsWattList,
    row.rwdRmsWattList,
    row.rwdPowerRmsWatt,
    row.rwdPowerCurrentRmsW
  ));
}

function getAvgReflectedRmsDbm(row) {
  return safeNumber(pickFirst(
    row.averageReflectedRmsDbm,
    row.averageReflectedRmsDB,
    row.averageRwdRmsDbm,
    row.averageRwdRmsDB,
    row.reflectedAvgRmsDbm,
    row.reflectedAvgRmsDB,
    row.reflectedRmsDbm,
    row.reflectedRmsDB,
    row.rwdAvgRmsDbm,
    row.rwdAvgRmsDB,
    row.rwdRmsDbm,
    row.rwdRmsDB,
    row.rwdPowerDB,
    row.rwd_dBmList,
    row.rwdPowerRmsDBList,
    row.rwdRms_dBmList,
    row.rwdPowerRmsDB,
    row.rwdPowerCurrentRmsDB
  ), 3);
}

function getVswrMax(row) {
  return safeNumber(pickFirst(row.vswrMax, row.vswr_max, row.maxVswr, row.vswrList, row.vswr), 2);
}

function getRssiDbm(row) {
  return safeNumber(pickFirst(row.averageRssi, row.avgRssi, row.rssiDbm, row.rssiDB, row.rssiList, row.rssi), 1);
}

function getThreshold(row) {
  return safeNumber(pickFirst(row.eventLogWattThreshold, row.event_log_watt_threshold, row.thresholdWatt, row.threshold, row.wattThresholdW, row.wattThreshold));
}

function getDuration(row) {
  return safeText(valueForDisplay(pickFirst(row.durationSec, row.durationList, row.duration)));
}

function getRawStatus(row) {
  return safeText(pickFirst(row.statusAlarm, row.status_alarm, row.status, row.alarmLevel, row.alarm_level, row.alarm));
}

function getStatus(row) {
  const raw = getRawStatus(row);
  if (!raw) return "";
  const t = raw.toLowerCase();
  if (t.includes("alarm") || t.includes("alert") || t.includes("fault") || t.includes("error")) return "Alarm";
  if (t.includes("warn")) return "Warning";
  if (t.includes("normal") || t.includes("ok")) return "Normal";
  return raw;
}

function getConnectionText(row) {
  const raw = valueForDisplay(pickFirst(row.connectionStatus, row.connection_status, row.connection));
  if (raw === "" || raw === undefined || raw === null) return "";
  const n = Number(raw);
  if (Number.isFinite(n)) return n === 1 ? "Connected" : "Disconnected";
  const t = String(raw).toLowerCase();
  if (t.includes("disconnect") || t.includes("closed") || t.includes("offline") || t === "ng" || t === "nogo") return "Disconnected";
  if (t.includes("connect") || t === "ok" || t === "go") return "Connected";
  return safeText(raw);
}

function getMessage(row) {
  return safeText(pickFirst(row.message, row.note, row.description, row.remark, row.eventMessage));
}

function getRowKey(row, index = 0) {
  return safeText(pickFirst(
    row.databaseId,
    row.id,
    `${getDateTime(row)}|${getEndTime(row)}|${getStationName(row)}|${getFrequencyMHz(row)}|${index}`
  ));
}

function statusKind(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("alarm") || s.includes("alert") || s.includes("fault") || s.includes("error")) return "red";
  if (s.includes("warn")) return "orange";
  if (s.includes("normal") || s.includes("ok")) return "green";
  return "neutral";
}

function connectionKind(connection) {
  return String(connection || "").toLowerCase().includes("disconnect") ? "red" : "blue";
}

function installEventLogExplorerStyle() {
  const old = document.getElementById("event-log-explorer-style");
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = "event-log-explorer-style";
  style.textContent = `
    #dataloggerButtons, #table-pagination { display:none !important; }
    #dataloggerContainer { min-height:auto !important; display:block !important; width:100% !important; }

    .logx-root, .logx-root * { box-sizing:border-box; }
    .logx-root { width:100%; color:#e5edf7; font-family:Arial, Helvetica, sans-serif; margin-top:14px; }
    .logx-card { background:#101b2b; border:1px solid #233650; border-radius:14px; box-shadow:0 16px 35px rgba(0,0,0,.28); margin-bottom:18px; overflow:hidden; }
    .logx-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:16px 18px 10px 18px; }
    .logx-card-title { font-size:18px; line-height:1.2; margin:0; color:#e5edf7; font-weight:700; }
    .logx-actions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .logx-btn { height:30px; border-radius:15px; padding:0 14px; font-size:12px; font-weight:700; color:#fff; cursor:pointer; border:1px solid #31506e; background:#1b2a3b; transition: background .15s ease, transform .15s ease; }
    .logx-btn:hover { transform:translateY(-1px); }
    .logx-btn-blue { background:#0f8bc4; }
    .logx-btn-green { background:#129a59; border-color:#22c55e; }
    .logx-pill { display:inline-flex; align-items:center; gap:6px; min-height:24px; padding:0 10px; border-radius:999px; border:1px solid #29435e; background:#1c2a3b; color:#8fa2b8; font-size:11px; font-weight:700; white-space:nowrap; }
    .logx-pill::before { content:""; width:6px; height:6px; border-radius:50%; background:#8fa2b8; flex:0 0 auto; }
    .logx-pill-blue { background:#123d5a; color:#2bb7f6; } .logx-pill-blue::before { background:#2bb7f6; }
    .logx-pill-green { background:#123a2d; color:#43d39e; } .logx-pill-green::before { background:#22c55e; }
    .logx-pill-orange { background:#452d0c; color:#ffb020; } .logx-pill-orange::before { background:#f59e0b; }
    .logx-pill-red { background:#451a1a; color:#ff6b6b; } .logx-pill-red::before { background:#ef4444; }
    .logx-pill-neutral { background:#1c2a3b; color:#cbd5e1; } .logx-pill-neutral::before { background:#94a3b8; }

    .logx-overview-body { padding:0 18px 18px 18px; }
    .logx-metrics { display:grid; grid-template-columns:repeat(6, minmax(120px, 1fr)); gap:10px; margin-bottom:12px; }
    .logx-metric { min-height:78px; background:#122033; border:1px solid #233650; border-radius:12px; padding:12px 12px 10px 16px; position:relative; overflow:hidden; }
    .logx-metric::before { content:""; position:absolute; left:0; top:0; bottom:0; width:4px; background:var(--accent, #2bb7f6); }
    .logx-metric-label { color:#8fa2b8; font-size:11px; margin-bottom:7px; }
    .logx-metric-value { color:var(--accent, #2bb7f6); font-size:24px; font-weight:800; line-height:1; }
    .logx-metric-sub { color:#65788f; font-size:10px; margin-top:7px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    .logx-chart-grid { display:grid; grid-template-columns:1.25fr 1fr 1fr; gap:10px; }
    .logx-mini-chart { min-height:110px; border:1px solid #233650; border-radius:12px; background:#0d1826; padding:10px; overflow:hidden; }
    .logx-mini-title { font-size:12px; color:#e5edf7; font-weight:700; margin-bottom:7px; }
    .logx-svg { width:100%; height:70px; display:block; background:#0b1420; border:1px solid #26384e; border-radius:8px; }

    .logx-toolbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:12px 18px; background:#132136; border-top:1px solid #233650; border-bottom:1px solid #233650; }
    .logx-label { color:#8fa2b8; font-size:11px; margin-bottom:8px; display:block; }
    .logx-search { flex:1 1 420px; min-width:280px; height:34px; color:#e5edf7; background:#0d1826; border:1px solid #2c4260; border-radius:9px; padding:0 12px; outline:none; }
    .logx-search:focus { border-color:#2bb7f6; box-shadow:0 0 0 2px rgba(43,183,246,.15); }

    .logx-layout { padding:16px 18px 18px 18px; }
    .logx-panel { background:#0d1826; border:1px solid #233650; border-radius:14px; overflow:visible; width:100%; }
    .logx-panel-head { padding:14px 14px 8px 14px; }
    .logx-panel-title { margin:0; color:#e5edf7; font-size:16px; font-weight:700; }

    .logx-table-wrap { overflow:visible; padding:0 14px 14px 14px; }
    .logx-event-table { width:100%; table-layout:auto; border-collapse:separate; border-spacing:0; font-size:11px; color:#e5edf7; }
    .logx-event-table th, .logx-event-table td { padding:10px 8px; border-bottom:1px solid #20324a; vertical-align:top; white-space:normal; word-break:break-word; }
    .logx-event-table th { position:sticky; top:0; z-index:2; background:#15263a; color:#e5edf7; font-size:11px; font-weight:700; }
    .logx-event-table th.logx-fwd { background:#12384a; }
    .logx-event-table th.logx-rwd { background:#123a2d; }
    .logx-event-table th.logx-cond { background:#3a2618; }
    .logx-event-table tbody tr { background:#0f1a2a; }
    .logx-event-table tbody tr:nth-child(even) { background:#111e30; }
    .logx-event-table tbody tr:hover { background:#17283f; }
    .logx-event-table tbody tr.logx-row-warning { background:#201c13; }
    .logx-event-table tbody tr.logx-row-alarm { background:#211624; }
    .logx-num { text-align:right; }
    .logx-center { text-align:center; }
    .logx-fwd-text { color:#2bb7f6; }
    .logx-rwd-text { color:#43d39e; }
    .logx-cond-text { color:#f59e0b; }
    .logx-muted-text { color:#8fa2b8; }
    .logx-footer { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 14px 14px 14px; color:#8fa2b8; font-size:12px; }
    .logx-empty { padding:36px 12px; color:#8fa2b8; text-align:center; }

    @media (max-width: 1400px) {
      .logx-metrics, .logx-chart-grid { grid-template-columns:1fr; }
      .logx-event-table { font-size:10px; }
      .logx-event-table th, .logx-event-table td { padding:8px 6px; }
    }
  `;
  document.head.appendChild(style);
}

document.addEventListener("DOMContentLoaded", () => {
  installEventLogExplorerStyle();
  buildDataloggerTable();
  WebSocketTest();
  loadDataLog();
});

function WebSocketTest() {
  wsUri = "ws://" + location.host + ":1234";
  try {
    ws = new WebSocket(wsUri);
    ws.onopen = () => {
      if (ws.readyState === 1) ws.send('{"menuID":"getMonitorPage"}');
    };
    ws.onmessage = (evt) => processMsg(evt.data);
    ws.onerror = (e) => console.error("WebSocket error:", e);
    ws.onclose = () => console.warn("WebSocket closed.");
  } catch (e) {
    console.error("WebSocket init failed:", e);
  }
}

function processMsg(message) {
  let obj;
  try {
    obj = JSON.parse(message);
  } catch (e) {
    console.error("Invalid WebSocket JSON:", e, message);
    return;
  }

  if (obj.menuID === "view_transmitter_list" && obj.insertDataLogger == 1) {
    const key = `${obj.databaseId || ""}|${obj.dateList || ""} ${obj.timeList || ""}|${obj.stationName || ""}`;
    const dupIdx = window.tableData.findIndex(row =>
      `${row.databaseId || ""}|${row.dateList || ""} ${row.timeList || ""}|${row.stationName || ""}` === key
    );
    if (dupIdx !== -1) window.tableData.splice(dupIdx, 1);
    if (obj.stationName) addOrRefreshStation(obj.stationName);
    window.tableData.unshift(obj);
    renderTable();
  }
}

async function loadDataLog() {
  try {
    const resp = await fetch("/get_data_log.php", { cache: "no-store" });
    const data = await resp.json();
    if (data && data.error) throw new Error(data.message || "Data logger API error");

    window.tableData = [...(Array.isArray(data) ? data : [])].sort(
      (a, b) => new Date(getDateTime(b)) - new Date(getDateTime(a))
    );

    rebuildStationSetFromTable();
    refreshStationDropdown();
    renderTable();
  } catch (e) {
    console.error("loadDataLog error:", e);
    const container = document.getElementById("logxEventBody");
    if (container) container.innerHTML = `<tr><td colspan="22" class="logx-empty">Error loading Data Log.</td></tr>`;
  }
}

function rebuildStationSetFromTable() {
  window.stationSet.clear();
  for (const it of window.tableData) {
    const station = pickFirst(it.stationName, it.station_name, it.station);
    if (station) window.stationSet.add(station);
  }
}

function refreshStationDropdown() {}

function addOrRefreshStation(stationName) {
  if (!window.stationSet.has(stationName)) window.stationSet.add(stationName);
}

function buildDataloggerTable() {
  const container = document.getElementById("dataloggerContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="logx-root">
      <section class="logx-card" id="logxOverview">
        <div class="logx-card-head">
          <div><h2 class="logx-card-title">Logger Trend Overview</h2></div>
          <div class="logx-actions">
            <span class="logx-pill logx-pill-blue">Forward</span>
            <span class="logx-pill logx-pill-green">Reflected</span>
            <span class="logx-pill logx-pill-orange">VSWR</span>
          </div>
        </div>
        <div class="logx-overview-body">
          <div class="logx-metrics" id="logxMetrics"></div>
          <div class="logx-chart-grid">
            <div class="logx-mini-chart"><div class="logx-mini-title">Forward / Reflected / VSWR</div><div id="logxMainTrend"></div></div>
            <div class="logx-mini-chart"><div class="logx-mini-title">RSSI Trend</div><div id="logxRssiTrend"></div></div>
            <div class="logx-mini-chart"><div class="logx-mini-title">Duration Trend</div><div id="logxDurationTrend"></div></div>
          </div>
        </div>
      </section>

      <section class="logx-card" id="logxExplorer">
        <div class="logx-card-head">
          <div><h2 class="logx-card-title">Event Log Explorer</h2></div>
          <div class="logx-actions">
            <button type="button" class="logx-btn" onclick="logxClearTextSearch()">Clear Search</button>
            <button type="button" class="logx-btn logx-btn-green" onclick="exportAll()">CSV</button>
          </div>
        </div>

        <div class="logx-toolbar">
          <span class="logx-label" style="margin:0;">Search</span>
          <input id="logxTextSearch" class="logx-search" type="text" placeholder="Station / frequency / status / connection / note">
          <span class="logx-pill">All Records</span>
          <span class="logx-pill logx-pill-blue">Forward</span>
          <span class="logx-pill logx-pill-green">Reflected</span>
          <span class="logx-pill logx-pill-orange">VSWR</span>
          <span class="logx-pill logx-pill-red">Alarm</span>
        </div>

        <div class="logx-layout">
          <div class="logx-panel">
            <div class="logx-panel-head">
              <h3 class="logx-panel-title">Event List</h3>
            </div>
            <div class="logx-table-wrap">
              <table class="logx-event-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Site</th>
                    <th>Device</th>
                    <th>Station</th>
                    <th>Freq MHz</th>
                    <th class="logx-fwd">FWD MAX W</th>
                    <th class="logx-fwd">FWD MAX dBm</th>
                    <th class="logx-fwd">FWD AVG/RMS W</th>
                    <th class="logx-fwd">FWD AVG/RMS dBm</th>
                    <th class="logx-rwd">RWD MAX W</th>
                    <th class="logx-rwd">RWD MAX dBm</th>
                    <th class="logx-rwd">RWD AVG/RMS W</th>
                    <th class="logx-rwd">RWD AVG/RMS dBm</th>
                    <th class="logx-cond">VSWR</th>
                    <th class="logx-cond">RSSI</th>
                    <th class="logx-cond">Threshold W</th>
                    <th class="logx-cond">Duration sec</th>
                    <th class="logx-cond">Status</th>
                    <th class="logx-cond">Connection</th>
                    <th>Message / Note</th>
                  </tr>
                </thead>
                <tbody id="logxEventBody">
                  <tr><td colspan="22" class="logx-empty">Loading event log...</td></tr>
                </tbody>
              </table>
            </div>
            <div class="logx-footer">
              <div id="logxPageInfo">Showing 0 records</div>
              <div id="logxPagination"></div>
            </div>
          </div>
        </div>
      </section>
    </div>`;

  const textSearch = document.getElementById("logxTextSearch");
  if (textSearch) {
    textSearch.addEventListener("input", () => {
      window.logTextFilter = textSearch.value || "";
      renderTable();
    });
  }
}

function getBaseRows() {
  return window.filteredTableData || window.tableData || [];
}

function rowSearchText(row, idx) {
  return [
    idx + 1,
    getDateTime(row),
    getEndTime(row),
    getSiteName(row),
    getDeviceName(row),
    getStationName(row),
    getFrequencyMHz(row),
    getForwardMaxW(row),
    getForwardMaxDbm(row),
    getAvgForwardRmsW(row),
    getAvgForwardRmsDbm(row),
    getReflectedMaxW(row),
    getReflectedMaxDbm(row),
    getAvgReflectedRmsW(row),
    getAvgReflectedRmsDbm(row),
    getVswrMax(row),
    getRssiDbm(row),
    getThreshold(row),
    getDuration(row),
    getStatus(row),
    getConnectionText(row),
    getMessage(row)
  ].join(" ").toLowerCase();
}

function getDisplayedRows() {
  const base = getBaseRows();
  const q = String(window.logTextFilter || "").trim().toLowerCase();
  if (!q) return base;
  return base.filter((row, idx) => rowSearchText(row, idx).includes(q));
}

function logxClearTextSearch() {
  const input = document.getElementById("logxTextSearch");
  if (input) input.value = "";
  window.logTextFilter = "";
  renderTable();
}

function renderTable() {
  const rows = getDisplayedRows();
  renderOverview(rows);
  renderEventList(rows);
}

function renderOverview(rows) {
  const metrics = document.getElementById("logxMetrics");
  if (!metrics) return;

  const latest = rows[0] || {};
  const forwardValues = rows.map(getForwardMaxW).map(numericValueFromText).filter(n => n !== null);
  const reflectedValues = rows.map(getReflectedMaxW).map(numericValueFromText).filter(n => n !== null);
  const vswrValues = rows.map(getVswrMax).map(numericValueFromText).filter(n => n !== null);
  const durationValues = rows.map(getDuration).map(numericValueFromText).filter(n => n !== null);
  const alarmCount = rows.filter(r => getStatus(r) === "Alarm").length;
  const warningCount = rows.filter(r => getStatus(r) === "Warning").length;

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const max = arr => arr.length ? Math.max(...arr) : null;

  const items = [
    { label:"Total Logs", value:String(rows.length), sub:"Visible records", color:"#43d39e" },
    { label:"Alarm Events", value:String(alarmCount), sub:"Derived or backend status", color:"#ef4444" },
    { label:"Warning Events", value:String(warningCount), sub:"Derived or backend status", color:"#f59e0b" },
    { label:"Latest Forward", value:getForwardMaxW(latest) ? `${getForwardMaxW(latest)} W` : "", sub:getForwardMaxDbm(latest) ? `${getForwardMaxDbm(latest)} dBm` : "", color:"#2bb7f6" },
    { label:"Max VSWR", value:max(vswrValues) !== null ? max(vswrValues).toFixed(2) : "", sub:"Highest visible VSWR", color:"#f59e0b" },
    { label:"Avg Duration", value:avg(durationValues) !== null ? `${Math.round(avg(durationValues))} sec` : "", sub:"Average visible duration", color:"#9b5cff" }
  ];

  metrics.innerHTML = items.map(it => `
    <div class="logx-metric" style="--accent:${it.color}">
      <div class="logx-metric-label">${escapeHtml(it.label)}</div>
      <div class="logx-metric-value">${escapeHtml(it.value)}</div>
      <div class="logx-metric-sub">${escapeHtml(it.sub)}</div>
    </div>
  `).join("");

  const mainValues = forwardValues.length ? forwardValues : reflectedValues.length ? reflectedValues : vswrValues;
  document.getElementById("logxMainTrend").innerHTML = makeLineSvg(mainValues, "#2bb7f6", reflectedValues, "#43d39e", vswrValues, "#f59e0b");
  document.getElementById("logxRssiTrend").innerHTML = makeLineSvg(rows.map(getRssiDbm).map(numericValueFromText).filter(n => n !== null), "#9b5cff");
  document.getElementById("logxDurationTrend").innerHTML = makeBarSvg(durationValues, "#6d74b9");
}

function samplePoints(values, maxPoints = 80) {
  if (!values || !values.length) return [];
  if (values.length <= maxPoints) return values;
  const out = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * (values.length - 1) / (maxPoints - 1));
    out.push(values[idx]);
  }
  return out;
}

function polyline(values, color, width = 3, invert = false) {
  const data = samplePoints(values);
  if (data.length < 2) return "";
  let min = Math.min(...data);
  let max = Math.max(...data);
  if (min === max) { min -= 1; max += 1; }
  const pts = data.map((v, i) => {
    const x = 8 + i * (284 / (data.length - 1));
    const normalized = (v - min) / (max - min);
    const y = invert ? 12 + normalized * 46 : 58 - normalized * 46;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function makeLineSvg(valuesA, colorA, valuesB = [], colorB = "#43d39e", valuesC = [], colorC = "#f59e0b") {
  return `
    <svg class="logx-svg" viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="18" x2="300" y2="18" stroke="#26384e" stroke-width="1"/>
      <line x1="0" y1="35" x2="300" y2="35" stroke="#26384e" stroke-width="1"/>
      <line x1="0" y1="52" x2="300" y2="52" stroke="#26384e" stroke-width="1"/>
      ${polyline(valuesA, colorA, 3)}
      ${polyline(valuesB, colorB, 2)}
      ${polyline(valuesC, colorC, 2)}
    </svg>`;
}

function makeBarSvg(values, color) {
  const data = samplePoints(values, 60);
  if (!data.length) return `<svg class="logx-svg" viewBox="0 0 300 70" preserveAspectRatio="none"></svg>`;
  let max = Math.max(...data);
  if (max <= 0) max = 1;
  const bars = data.map((v, i) => {
    const x = 6 + i * (288 / data.length);
    const h = Math.max(2, (v / max) * 48);
    return `<rect x="${x.toFixed(1)}" y="${(60-h).toFixed(1)}" width="3.8" height="${h.toFixed(1)}" rx="1" fill="${color}"/>`;
  }).join("");
  return `
    <svg class="logx-svg" viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="18" x2="300" y2="18" stroke="#26384e" stroke-width="1"/>
      <line x1="0" y1="35" x2="300" y2="35" stroke="#26384e" stroke-width="1"/>
      <line x1="0" y1="52" x2="300" y2="52" stroke="#26384e" stroke-width="1"/>
      ${bars}
    </svg>`;
}

function badgeHtml(text, kind) {
  if (!text) return "";
  return `<span class="logx-pill logx-pill-${kind}">${escapeHtml(text)}</span>`;
}

function renderEventList(rows) {
  const tbody = document.getElementById("logxEventBody");
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="22" class="logx-empty">No event log data</td></tr>`;
    renderPagination(0);
    return;
  }

  tbody.innerHTML = rows.map((row, idx) => {
    const status = getStatus(row);
    const connection = getConnectionText(row);
    const rowState = status === "Alarm" ? "logx-row-alarm" : status === "Warning" ? "logx-row-warning" : "";

    return `
      <tr class="${rowState}" data-log-key="${escapeHtml(getRowKey(row, idx))}">
        <td class="logx-num">${idx + 1}</td>
        <td>${escapeHtml(getDateTime(row))}</td>
        <td>${escapeHtml(getEndTime(row))}</td>
        <td>${escapeHtml(getSiteName(row))}</td>
        <td>${escapeHtml(getDeviceName(row))}</td>
        <td><strong>${escapeHtml(getStationName(row))}</strong></td>
        <td class="logx-num">${escapeHtml(getFrequencyMHz(row))}</td>
        <td class="logx-num logx-fwd-text">${escapeHtml(getForwardMaxW(row))}</td>
        <td class="logx-num logx-fwd-text">${escapeHtml(getForwardMaxDbm(row))}</td>
        <td class="logx-num logx-fwd-text">${escapeHtml(getAvgForwardRmsW(row))}</td>
        <td class="logx-num logx-fwd-text">${escapeHtml(getAvgForwardRmsDbm(row))}</td>
        <td class="logx-num logx-rwd-text">${escapeHtml(getReflectedMaxW(row))}</td>
        <td class="logx-num logx-rwd-text">${escapeHtml(getReflectedMaxDbm(row))}</td>
        <td class="logx-num logx-rwd-text">${escapeHtml(getAvgReflectedRmsW(row))}</td>
        <td class="logx-num logx-rwd-text">${escapeHtml(getAvgReflectedRmsDbm(row))}</td>
        <td class="logx-num logx-cond-text">${escapeHtml(getVswrMax(row))}</td>
        <td class="logx-num logx-muted-text">${escapeHtml(getRssiDbm(row))}</td>
        <td class="logx-num">${escapeHtml(getThreshold(row))}</td>
        <td class="logx-num">${escapeHtml(getDuration(row))}</td>
        <td>${status ? badgeHtml(status, statusKind(status)) : ""}</td>
        <td>${connection ? badgeHtml(connection, connectionKind(connection)) : ""}</td>
        <td>${escapeHtml(getMessage(row))}</td>
      </tr>`;
  }).join("");

  renderPagination(rows.length);
}

function renderPagination(totalRows) {
  const info = document.getElementById("logxPageInfo");
  const pagination = document.getElementById("logxPagination");
  if (info) info.textContent = `Showing ${totalRows} records`;
  if (pagination) pagination.innerHTML = "";
}

function eventLogExportRows(data) {
  return data.map((it, idx) => [
    idx + 1,
    getDateTime(it),
    getEndTime(it),
    getSiteName(it),
    getDeviceName(it),
    getStationName(it),
    getFrequencyMHz(it),
    getForwardMaxW(it),
    getForwardMaxDbm(it),
    getAvgForwardRmsW(it),
    getAvgForwardRmsDbm(it),
    getReflectedMaxW(it),
    getReflectedMaxDbm(it),
    getAvgReflectedRmsW(it),
    getAvgReflectedRmsDbm(it),
    getVswrMax(it),
    getRssiDbm(it),
    getThreshold(it),
    getDuration(it),
    getStatus(it),
    getConnectionText(it),
    getMessage(it)
  ]);
}

function exportAll() {
  const data = getDisplayedRows();
  if (!data?.length) return alert("No data to export.");

  const header = [
    "No.", "Start Time", "End Time", "Site", "Device", "Station", "Frequency MHz",
    "Forward MAX-HOLD (W)", "Forward MAX-HOLD (dBm)", "Forward AVG/RMS (W)", "Forward AVG/RMS (dBm)",
    "Reflected MAX-HOLD (W)", "Reflected MAX-HOLD (dBm)", "Reflected AVG/RMS (W)", "Reflected AVG/RMS (dBm)",
    "VSWR", "RSSI (dBm)", "Threshold (W)", "Duration (sec)", "Status / Alarm", "Connection", "Message / Note"
  ];

  const csv = [header, ...eventLogExportRows(data)].map(a => a.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "datalogger_export.csv";
  link.click();
}
