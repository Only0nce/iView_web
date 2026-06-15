/* myfunctionDatalogger.js
 * Event Log Explorer UI
 * Current scope:
 * - Use datalogger table fields from get_data_log.php.
 * - Keep table-only layout. No right-side detail panel.
 * - 10 rows per page.
 * - No Device, Status, or Message/Note columns.
 * - Add filters: Date/Time, Site, Station, and text search.
 * - Preserve existing backend/WebSocket menuID behavior as much as possible.
 */

var ws, wsUri;
var currentPage = 1;

const LOGX_UI = {
  rowsPerPage: 10,

  // Page width. Keep centered.
  pageWidth: "min(96vw, 2800px)",
  pageMarginLeft: "auto",
  pageMarginRight: "auto",

  tableFontSize: "13px",
  tableHeaderFontSize: "12px",
  tableCellPadding: "12px 10px",
  tableWhiteSpace: "normal",
  tableLayout: "auto",
  tableGridLine: "1px dashed rgba(88, 104, 122, 0.85)",

  searchMinWidth: "280px",
  searchFlexBasis: "420px",

  tableOuterPadding: "16px 18px 18px 18px",
  tableInnerPadding: "0 14px 14px 14px"
};

window.tableData = [];
window.filteredTableData = null;
window.stationSet = new Set();
window.logTextFilter = "";
window.logDateStartFilter = "";
window.logDateEndFilter = "";
window.logSiteFilter = "";
window.logStationFilter = "";

window.logTrendAggregate = "raw";
window.logTrendZoom = "all";
window.logTrendPowerUnit = "watt";
window.logTrendPowerValue = "max";

// =========================
// Safe helpers
// =========================
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
  const raw = valueForDisplay(value);
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
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

function normalizeDateTimeString(value) {
  const text = safeText(value);
  if (!text) return "";
  return text.includes("T") ? text : text.replace(" ", "T");
}

function dateTimeLocalToTimestamp(value) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function rowStartTimestamp(row) {
  const text = normalizeDateTimeString(getDateTime(row));
  if (!text) return null;
  const ts = new Date(text).getTime();
  return Number.isFinite(ts) ? ts : null;
}

// =========================
// Field getters
// =========================
function getDateTime(row) {
  return safeText(pickFirst(
    row.startLog,
    row.startTime,
    row.start_time,
    (row.dateList || row.timeList) ? `${row.dateList || ""} ${row.timeList || ""}`.trim() : ""
  ));
}

function getEndTime(row) {
  return safeText(pickFirst(
    row.endLog,
    row.endTime,
    row.end_time,
    (row.endDateList || row.endTimeList) ? `${row.endDateList || ""} ${row.endTimeList || ""}`.trim() : ""
  ));
}

function getSiteName(row) {
  // Important: datalogger.site is the historical site snapshot.
  // Do not derive this from the currently selected role on the web side.
  return safeText(pickFirst(row.site, row.siteName, row.site_name, row.siteID, row.siteId));
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
    row.fwdWattList,
    row.fwdPowerWatt
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
    row.fwdPowerDB,
    row.fwd_dBmList
  ), 3);
  if (direct !== "") return direct;
  return dbmFromWattValue(pickFirst(row.maxPowerWatt, row.forwardMaxHoldWatt, row.fwdWattList, row.fwdPowerWatt));
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
    row.fwdWattList
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
    row.fwd_dBmList
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
    row.rwdPowerWatt,
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
    row.rwdPowerDB,
    row.rwd_dBmList
  ), 3);
  if (direct !== "") return direct;
  return dbmFromWattValue(pickFirst(row.reflectedMaxHoldWatt, row.maxReflectedPowerWatt, row.maxRwdPowerWatt, row.rwdPowerWatt, row.rwdWattList));
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
    row.rwdWattList
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
    row.rwd_dBmList
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

function getRowKey(row, index = 0) {
  return safeText(pickFirst(
    row.databaseId,
    row.id,
    `${getDateTime(row)}|${getEndTime(row)}|${getSiteName(row)}|${getStationName(row)}|${getFrequencyMHz(row)}|${index}`
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

// =========================
// UI CSS / layout
// =========================
function installEventLogExplorerStyle() {
  const old = document.getElementById("event-log-explorer-style");
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = "event-log-explorer-style";
  style.textContent = `
    #dataloggerButtons, #table-pagination { display:none !important; }
    #site_content {
      width:${LOGX_UI.pageWidth} !important;
      max-width:${LOGX_UI.pageWidth} !important;
      margin-left:${LOGX_UI.pageMarginLeft} !important;
      margin-right:${LOGX_UI.pageMarginRight} !important;
      overflow:visible !important;
    }
    #dataloggerContainer { min-height:auto !important; display:block !important; width:100% !important; }

    .logx-root, .logx-root * { box-sizing:border-box; }
    .logx-root { width:100%; color:#e5edf7; font-family:Arial, Helvetica, sans-serif; margin-top:14px; }
    .logx-card { background:#101b2b; border:1px solid #233650; border-radius:14px; box-shadow:0 16px 35px rgba(0,0,0,.28); margin-bottom:18px; overflow:hidden; }
    .logx-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:16px 18px 10px 18px; }
    .logx-card-title { font-size:18px; line-height:1.2; margin:0; color:#e5edf7; font-weight:700; }
    .logx-actions { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .logx-btn { height:30px; border-radius:15px; padding:0 14px; font-size:12px; font-weight:700; color:#fff; cursor:pointer; border:1px solid #31506e; background:#1b2a3b; transition:background .15s ease, transform .15s ease; }
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

    .logx-control-grid { display:grid; grid-template-columns:repeat(4, minmax(180px, 1fr)); gap:10px; margin-bottom:12px; }
    .logx-control-box { min-height:74px; background:#0f1b2c; border:1px solid #233650; border-radius:12px; padding:10px 12px; }
    .logx-control-title { color:#8fa2b8; font-size:11px; font-weight:700; margin-bottom:8px; }
    .logx-chip-row { display:flex; gap:7px; flex-wrap:wrap; align-items:center; }
    .logx-chip { min-height:26px; padding:0 12px; border-radius:999px; border:1px solid #29435e; background:#1c2a3b; color:#b8c4d2; font-size:11px; font-weight:800; cursor:pointer; }
    .logx-chip:hover { background:#20354d; }
    .logx-chip-active { background:#1599d3 !important; color:#ffffff !important; border-color:#1fb6ff !important; }
    .logx-chip-green.logx-chip-active { background:#159a59 !important; border-color:#22c55e !important; }
    .logx-chip-orange.logx-chip-active { background:#d97706 !important; border-color:#f59e0b !important; }

    .logx-chart-card { border:1px solid #233650; border-radius:14px; background:#0d1826; padding:12px; margin-top:12px; overflow:hidden; }
    .logx-chart-title-row { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px; }
    .logx-chart-title { font-size:14px; color:#e5edf7; font-weight:800; }
    .logx-chart-sub { font-size:11px; color:#8fa2b8; margin-top:3px; }
    .logx-chart-legend { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .logx-chart-legend .logx-pill { min-height:22px; }
    .logx-big-svg { width:100%; height:310px; display:block; background:#0b1420; border:1px solid #26384e; border-radius:10px; }
    .logx-small-svg { width:100%; height:170px; display:block; background:#0b1420; border:1px solid #26384e; border-radius:10px; }
    #logxMainTrend { width:100%; min-height:330px; }
    #logxRssiTrend, #logxDurationTrend { width:100%; min-height:190px; }
    .logx-plotly-holder { width:100%; min-height:inherit; }
    .logx-small-chart-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; }
    .logx-chart-empty { min-height:140px; display:flex; align-items:center; justify-content:center; color:#8fa2b8; background:#0b1420; border:1px solid #26384e; border-radius:10px; }

    .logx-chart-grid { display:grid; grid-template-columns:1.25fr 1fr 1fr; gap:10px; }
    .logx-mini-chart { min-height:110px; border:1px solid #233650; border-radius:12px; background:#0d1826; padding:10px; overflow:hidden; }
    .logx-mini-title { font-size:12px; color:#e5edf7; font-weight:700; margin-bottom:7px; }
    .logx-svg { width:100%; height:70px; display:block; background:#0b1420; border:1px solid #26384e; border-radius:8px; }

    .logx-toolbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:12px 18px; background:#132136; border-top:1px solid #233650; border-bottom:1px solid #233650; }
    .logx-label { color:#8fa2b8; font-size:11px; margin-bottom:8px; display:block; }
    .logx-toolbar-label { color:#8fa2b8; font-size:11px; white-space:nowrap; }
    .logx-search { flex:1 1 ${LOGX_UI.searchFlexBasis}; min-width:${LOGX_UI.searchMinWidth}; height:34px; color:#e5edf7; background:#0d1826; border:1px solid #2c4260; border-radius:9px; padding:0 12px; outline:none; }
    .logx-search:focus { border-color:#2bb7f6; box-shadow:0 0 0 2px rgba(43,183,246,.15); }
    .logx-filter-input, .logx-filter-select { height:34px; color:#e5edf7; background:#0d1826; border:1px solid #2c4260; border-radius:9px; padding:0 10px; outline:none; font-size:12px; }
    .logx-filter-input:focus, .logx-filter-select:focus { border-color:#2bb7f6; box-shadow:0 0 0 2px rgba(43,183,246,.15); }
    .logx-filter-date { flex:0 0 190px; min-width:170px; }
    .logx-filter-select { flex:0 0 170px; min-width:150px; }

    .logx-layout { padding:${LOGX_UI.tableOuterPadding}; }
    .logx-panel { background:#0d1826; border:1px solid #233650; border-radius:14px; overflow:visible; width:100%; }
    .logx-panel-head { padding:14px 14px 8px 14px; }
    .logx-panel-title { margin:0; color:#e5edf7; font-size:16px; font-weight:700; }

    .logx-table-wrap { overflow:visible; padding:${LOGX_UI.tableInnerPadding}; }
    .logx-event-table { width:100%; table-layout:${LOGX_UI.tableLayout}; border-collapse:collapse; border-spacing:0; font-size:${LOGX_UI.tableFontSize}; color:#243241; }
    .logx-event-table th, .logx-event-table td {
      padding:${LOGX_UI.tableCellPadding};
      border-right:${LOGX_UI.tableGridLine};
      border-bottom:${LOGX_UI.tableGridLine};
      vertical-align:middle;
      white-space:${LOGX_UI.tableWhiteSpace};
      word-break:break-word;
      line-height:1.35;
    }
    .logx-event-table th:first-child, .logx-event-table td:first-child { border-left:${LOGX_UI.tableGridLine}; }
    .logx-event-table thead tr:first-child th { border-top:${LOGX_UI.tableGridLine}; }
    .logx-event-table th { background:#17304a; color:#f4f8fc; font-size:${LOGX_UI.tableHeaderFontSize}; font-weight:700; text-align:left; }
    .logx-event-table th.logx-fwd { background:#114a66; }
    .logx-event-table th.logx-rwd { background:#12523a; }
    .logx-event-table th.logx-cond { background:#5a3515; }
    .logx-event-table tbody tr { background:#f4f1e8; color:#243241; }
    .logx-event-table tbody tr:nth-child(even) { background:#efebe1; }
    .logx-event-table tbody tr:hover { background:#e7edf5; }
    .logx-event-table td { font-weight:500; }
    .logx-event-table tbody tr.logx-row-warning { background:#f3ead7; }
    .logx-event-table tbody tr.logx-row-alarm { background:#f3dada; }
    .logx-num { text-align:right; font-variant-numeric:tabular-nums; }
    .logx-center { text-align:center; }
    .logx-fwd-text { color:#1388d6; font-weight:600; }
    .logx-rwd-text { color:#15935a; font-weight:600; }
    .logx-cond-text { color:#c67a00; font-weight:600; }
    .logx-muted-text { color:#6a7684; font-weight:500; }
    .logx-event-table td:nth-child(4),
    .logx-event-table td:nth-child(5) {
      color:#1f2d3d;
      font-weight:700;
    }
    .logx-footer { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 14px 14px 14px; color:#8fa2b8; font-size:12px; }
    .logx-page-buttons { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .logx-page-btn {
      min-width:34px;
      height:34px;
      padding:0 12px;
      border-radius:8px;
      border:1px solid #31506e;
      background:#102033;
      color:#e5edf7;
      font-size:14px;
      font-weight:700;
      cursor:pointer;
      line-height:1;
    }
    .logx-page-btn:hover:not(:disabled) { background:#18324a; border-color:#4a6c8d; }
    .logx-page-btn:disabled { opacity:.45; cursor:not-allowed; }
    .logx-page-active { background:#e91e9b !important; color:#ffffff !important; border-color:#e91e9b !important; }
    .logx-page-first { background:#7b1b72; border-color:#8f2a86; color:#ffffff; }
    .logx-page-ellipsis {
      min-width:24px;
      height:34px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      color:#8fa2b8;
      font-weight:700;
    }
    .logx-empty { padding:36px 12px; color:#8fa2b8; text-align:center; }

    @media (max-width: 1400px) {
      .logx-metrics, .logx-chart-grid, .logx-control-grid, .logx-small-chart-grid { grid-template-columns:1fr; }
      .logx-event-table { font-size:10px; }
      .logx-event-table th, .logx-event-table td { padding:8px 6px; }
    }
  `;
  document.head.appendChild(style);
}

// =========================
// Bootstrap
// =========================
document.addEventListener("DOMContentLoaded", () => {
  installEventLogExplorerStyle();
  buildDataloggerTable();
  WebSocketTest();
  loadDataLog();
});

// =========================
// WebSocket
// =========================
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
    // Reload from DB so the row uses the saved datalogger.site and endLog values.
    loadDataLog();
  }
}

// =========================
// Load backend
// =========================
async function loadDataLog() {
  try {
    const resp = await fetch("/get_data_log.php", { cache: "no-store" });
    const data = await resp.json();

    if (data && data.error) throw new Error(data.message || "Data logger API error");

    // Keep the exact row order returned by get_data_log.php.
    // The backend already orders by id DESC, so the web UI must not re-sort
    // or alter table data unexpectedly.
    window.tableData = Array.isArray(data) ? data : [];

    rebuildStationSetFromTable();
    refreshStationDropdown();
    refreshLogFilterOptions();
    currentPage = 1;
    renderTable();
  } catch (e) {
    console.error("loadDataLog error:", e);
    const container = document.getElementById("logxEventBody");
    if (container) container.innerHTML = `<tr><td colspan="19" class="logx-empty">Error loading Data Log.</td></tr>`;
  }
}

// =========================
// Filter dropdowns
// =========================
function rebuildStationSetFromTable() {
  window.stationSet.clear();
  for (const it of window.tableData) {
    const station = getStationName(it);
    if (station) window.stationSet.add(station);
  }
}

function refreshStationDropdown() {
  // Kept for compatibility with older code paths.
}

function fillSelectOptions(selectId, values, allText, currentValue) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = allText;
  select.appendChild(allOption);

  values.forEach(value => {
    if (value === undefined || value === null || value === "") return;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  select.value = currentValue && values.includes(currentValue) ? currentValue : "";
}

function refreshLogFilterOptions() {
  const rows = window.tableData || [];

  const sites = Array.from(new Set(
    rows.map(row => getSiteName(row)).filter(value => value !== "")
  )).sort();

  const stations = Array.from(new Set(
    rows.map(row => getStationName(row)).filter(value => value !== "")
  )).sort();

  fillSelectOptions("logxSiteFilter", sites, "All Site", window.logSiteFilter);
  fillSelectOptions("logxStationFilter", stations, "All Station", window.logStationFilter);
}

// =========================
// Build UI
// =========================
function buildDataloggerTable() {
  const container = document.getElementById("dataloggerContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="logx-root">
      <section class="logx-card" id="logxOverview">
        <div class="logx-card-head">
          <div>
            <h2 class="logx-card-title">Logger Trend Overview</h2>
            <div class="logx-card-subtitle">Displays Forward, Reflected, VSWR, RSSI, and Duration trends from the current filtered dataset.</div>
          </div>
          <div class="logx-actions">
            <span class="logx-pill logx-pill-blue">Forward</span>
            <span class="logx-pill logx-pill-green">Reflected</span>
            <span class="logx-pill logx-pill-orange">VSWR</span>
          </div>
        </div>
        <div class="logx-overview-body">
          <div class="logx-control-grid">
            <div class="logx-control-box">
              <div class="logx-control-title">Aggregate</div>
              <div class="logx-chip-row">
                <button class="logx-chip" data-trend-type="aggregate" data-trend-value="raw" onclick="setTrendOption('aggregate','raw')">Raw</button>
                <button class="logx-chip" data-trend-type="aggregate" data-trend-value="daily" onclick="setTrendOption('aggregate','daily')">Daily</button>
                <button class="logx-chip" data-trend-type="aggregate" data-trend-value="weekly" onclick="setTrendOption('aggregate','weekly')">Weekly</button>
                <button class="logx-chip" data-trend-type="aggregate" data-trend-value="monthly" onclick="setTrendOption('aggregate','monthly')">Monthly</button>
              </div>
            </div>
            <div class="logx-control-box">
              <div class="logx-control-title">Zoom</div>
              <div class="logx-chip-row">
                <button class="logx-chip" data-trend-type="zoom" data-trend-value="24h" onclick="setTrendOption('zoom','24h')">24H</button>
                <button class="logx-chip" data-trend-type="zoom" data-trend-value="7d" onclick="setTrendOption('zoom','7d')">7D</button>
                <button class="logx-chip" data-trend-type="zoom" data-trend-value="30d" onclick="setTrendOption('zoom','30d')">30D</button>
                <button class="logx-chip" data-trend-type="zoom" data-trend-value="all" onclick="setTrendOption('zoom','all')">All</button>
              </div>
            </div>
            <div class="logx-control-box">
              <div class="logx-control-title">Power Unit</div>
              <div class="logx-chip-row">
                <button class="logx-chip logx-chip-green" data-trend-type="unit" data-trend-value="watt" onclick="setTrendOption('unit','watt')">Watt</button>
                <button class="logx-chip" data-trend-type="unit" data-trend-value="dbm" onclick="setTrendOption('unit','dbm')">dBm</button>
              </div>
            </div>
            <div class="logx-control-box">
              <div class="logx-control-title">Power Value</div>
              <div class="logx-chip-row">
                <button class="logx-chip" data-trend-type="powerValue" data-trend-value="max" onclick="setTrendOption('powerValue','max')">MAX-HOLD</button>
                <button class="logx-chip" data-trend-type="powerValue" data-trend-value="rms" onclick="setTrendOption('powerValue','rms')">RMS</button>
              </div>
            </div>
          </div>

          <div class="logx-metrics" id="logxMetrics"></div>

          <div class="logx-chart-card">
            <div class="logx-chart-title-row">
              <div>
                <div class="logx-chart-title">Forward / Reflected MAX-HOLD / VSWR</div>
                <div class="logx-chart-sub" id="logxMainTrendSub">Left axis = Power, Right axis = VSWR</div>
              </div>
              <div class="logx-chart-legend">
                <span class="logx-pill logx-pill-blue">Forward</span>
                <span class="logx-pill logx-pill-green">Reflected</span>
                <span class="logx-pill logx-pill-orange">VSWR</span>
              </div>
            </div>
            <div id="logxMainTrend"></div>
          </div>

          <div class="logx-small-chart-grid">
            <div class="logx-chart-card">
              <div class="logx-chart-title">RSSI Trend</div>
              <div class="logx-chart-sub">Uses the same aggregation and zoom as the main chart</div>
              <div id="logxRssiTrend"></div>
            </div>
            <div class="logx-chart-card">
              <div class="logx-chart-title">Duration Trend</div>
              <div class="logx-chart-sub">Raw = per log, Aggregated = total duration per bucket</div>
              <div id="logxDurationTrend"></div>
            </div>
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
          <input id="logxTextSearch" class="logx-search" type="text" placeholder="frequency / connection">

          <span class="logx-toolbar-label">From</span>
          <input id="logxDateStart" class="logx-filter-input logx-filter-date" type="datetime-local">

          <span class="logx-toolbar-label">To</span>
          <input id="logxDateEnd" class="logx-filter-input logx-filter-date" type="datetime-local">

          <span class="logx-toolbar-label">Site</span>
          <select id="logxSiteFilter" class="logx-filter-select"><option value="">All Site</option></select>

          <span class="logx-toolbar-label">Station</span>
          <select id="logxStationFilter" class="logx-filter-select"><option value="">All Station</option></select>

          <span class="logx-pill">All Records</span>
          <span class="logx-pill logx-pill-blue">Forward</span>
          <span class="logx-pill logx-pill-green">Reflected</span>
          <span class="logx-pill logx-pill-orange">VSWR</span>
          <span class="logx-pill logx-pill-red">Alarm</span>
        </div>

        <div class="logx-layout">
          <div class="logx-panel">
            <div class="logx-panel-head"><h3 class="logx-panel-title">Event List</h3></div>
            <div class="logx-table-wrap">
              <table class="logx-event-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Site</th>
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
                    <th class="logx-cond">Connection</th>
                  </tr>
                </thead>
                <tbody id="logxEventBody">
                  <tr><td colspan="19" class="logx-empty">Loading event log...</td></tr>
                </tbody>
              </table>
            </div>
            <div class="logx-footer">
              <div id="logxPageInfo">Showing 0 records</div>
              <div class="logx-page-buttons" id="logxPagination"></div>
            </div>
          </div>
        </div>
      </section>
    </div>`;

  const textSearch = document.getElementById("logxTextSearch");
  if (textSearch) {
    textSearch.addEventListener("input", () => {
      window.logTextFilter = textSearch.value || "";
      currentPage = 1;
      renderTable();
    });
  }

  const dateStart = document.getElementById("logxDateStart");
  if (dateStart) {
    dateStart.addEventListener("change", () => {
      window.logDateStartFilter = dateStart.value || "";
      currentPage = 1;
      renderTable();
    });
  }

  const dateEnd = document.getElementById("logxDateEnd");
  if (dateEnd) {
    dateEnd.addEventListener("change", () => {
      window.logDateEndFilter = dateEnd.value || "";
      currentPage = 1;
      renderTable();
    });
  }

  const siteFilter = document.getElementById("logxSiteFilter");
  if (siteFilter) {
    siteFilter.addEventListener("change", () => {
      window.logSiteFilter = siteFilter.value || "";
      currentPage = 1;
      renderTable();
    });
  }

  const stationFilter = document.getElementById("logxStationFilter");
  if (stationFilter) {
    stationFilter.addEventListener("change", () => {
      window.logStationFilter = stationFilter.value || "";
      currentPage = 1;
      renderTable();
    });
  }
}

// =========================
// Filtering / active rows
// =========================
function getBaseRows() {
  return window.filteredTableData || window.tableData || [];
}

function rowSearchText(row, idx) {
  return [
    idx + 1,
    getDateTime(row),
    getEndTime(row),
    getSiteName(row),
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
    getConnectionText(row)
  ].join(" ").toLowerCase();
}

function getDisplayedRows() {
  const base = getBaseRows();
  const q = String(window.logTextFilter || "").trim().toLowerCase();
  const site = String(window.logSiteFilter || "").trim();
  const station = String(window.logStationFilter || "").trim();
  const startTs = dateTimeLocalToTimestamp(window.logDateStartFilter);
  const endTs = dateTimeLocalToTimestamp(window.logDateEndFilter);

  return base.filter((row, idx) => {
    if (q && !rowSearchText(row, idx).includes(q)) return false;
    if (site && getSiteName(row) !== site) return false;
    if (station && getStationName(row) !== station) return false;

    if (startTs !== null || endTs !== null) {
      const rowTs = rowStartTimestamp(row);
      if (rowTs === null) return false;
      if (startTs !== null && rowTs < startTs) return false;
      if (endTs !== null && rowTs > endTs) return false;
    }

    return true;
  });
}

function logxClearTextSearch() {
  const input = document.getElementById("logxTextSearch");
  const dateStart = document.getElementById("logxDateStart");
  const dateEnd = document.getElementById("logxDateEnd");
  const siteFilter = document.getElementById("logxSiteFilter");
  const stationFilter = document.getElementById("logxStationFilter");

  if (input) input.value = "";
  if (dateStart) dateStart.value = "";
  if (dateEnd) dateEnd.value = "";
  if (siteFilter) siteFilter.value = "";
  if (stationFilter) stationFilter.value = "";

  window.logTextFilter = "";
  window.logDateStartFilter = "";
  window.logDateEndFilter = "";
  window.logSiteFilter = "";
  window.logStationFilter = "";

window.logTrendAggregate = "raw";
window.logTrendZoom = "all";
window.logTrendPowerUnit = "watt";
window.logTrendPowerValue = "max";

  currentPage = 1;
  renderTable();
}

// =========================
// Render
// =========================
function renderTable() {
  const rows = getDisplayedRows();
  renderOverview(rows);
  renderEventList(rows);
}


function setTrendOption(type, value) {
  if (type === "aggregate") window.logTrendAggregate = value;
  else if (type === "zoom") window.logTrendZoom = value;
  else if (type === "unit") window.logTrendPowerUnit = value;
  else if (type === "powerValue") window.logTrendPowerValue = value;
  renderTable();
}

function refreshTrendControlState() {
  const map = {
    aggregate: window.logTrendAggregate,
    zoom: window.logTrendZoom,
    unit: window.logTrendPowerUnit,
    powerValue: window.logTrendPowerValue
  };

  document.querySelectorAll(".logx-chip[data-trend-type]").forEach(btn => {
    const type = btn.getAttribute("data-trend-type");
    const value = btn.getAttribute("data-trend-value");
    btn.classList.toggle("logx-chip-active", map[type] === value);
  });
}

function sanitizeDbm(value) {
  const n = numericValueFromText(value);
  // -999 / -999.99 are common placeholder values. They destroy chart scaling,
  // so treat them as missing data for trend visualization.
  if (!Number.isFinite(n) || n <= -900) return null;
  return n;
}

function wattToDbmFromText(value) {
  const w = numericValueFromText(value);
  if (!Number.isFinite(w) || w <= 0) return null;
  return 10 * Math.log10(w * 1000);
}

function getTrendPower(row, side) {
  const unit = window.logTrendPowerUnit;
  const mode = window.logTrendPowerValue;

  if (side === "forward") {
    if (unit === "dbm") {
      if (mode === "max") return wattToDbmFromText(getForwardMaxW(row)) ?? sanitizeDbm(getForwardMaxDbm(row));
      return sanitizeDbm(getAvgForwardRmsDbm(row)) ?? wattToDbmFromText(getAvgForwardRmsW(row));
    }
    return numericValueFromText(mode === "rms" ? getAvgForwardRmsW(row) : getForwardMaxW(row));
  }

  if (unit === "dbm") {
    if (mode === "max") return wattToDbmFromText(getReflectedMaxW(row)) ?? sanitizeDbm(getReflectedMaxDbm(row));
    return sanitizeDbm(getAvgReflectedRmsDbm(row)) ?? wattToDbmFromText(getAvgReflectedRmsW(row));
  }
  return numericValueFromText(mode === "rms" ? getAvgReflectedRmsW(row) : getReflectedMaxW(row));
}

function getSortedTrendRows(rows) {
  return [...rows]
    .map(row => ({ row, ts: rowStartTimestamp(row) }))
    .filter(it => it.ts !== null)
    .sort((a, b) => a.ts - b.ts);
}

function applyTrendZoom(items) {
  if (!items.length || window.logTrendZoom === "all") return items;

  const latest = items[items.length - 1].ts;
  const spanMs = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000
  }[window.logTrendZoom];

  if (!spanMs) return items;
  const from = latest - spanMs;
  const filtered = items.filter(it => it.ts >= from);

  // A chart with only one point looks like a broken zoom.
  // Keep the selected range when it has enough data; otherwise fall back to
  // the latest nearby records so the trend remains readable and natural.
  if (filtered.length >= 2 || items.length <= 2) return filtered;
  return items.slice(Math.max(0, items.length - 80));
}

function effectiveTrendAggregate() {
  const agg = window.logTrendAggregate;
  const zoom = window.logTrendZoom;

  // These combinations are visually unnatural because they collapse to one bucket.
  // Use a more natural aggregation automatically while preserving the selected buttons.
  if (zoom === "24h" && agg !== "raw") return "raw";
  if (zoom === "7d" && agg === "monthly") return "daily";
  if (zoom === "30d" && agg === "monthly") return "daily";
  return agg;
}

function trendBucketKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  const aggregate = effectiveTrendAggregate();
  if (aggregate === "daily") return `${y}-${m}-${day}`;
  if (aggregate === "monthly") return `${y}-${m}`;

  if (aggregate === "weekly") {
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const weekDay = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - weekDay);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  return String(ts);
}

function avg(values) {
  const nums = values.filter(v => Number.isFinite(v));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

function sum(values) {
  const nums = values.filter(v => Number.isFinite(v));
  return nums.length ? nums.reduce((a, b) => a + b, 0) : null;
}

function maxFinite(values) {
  const nums = values.filter(v => Number.isFinite(v));
  return nums.length ? Math.max(...nums) : null;
}

function uniqueLabel(values, fallback = "") {
  const list = Array.from(new Set(values.filter(v => v !== undefined && v !== null && v !== "")));
  if (!list.length) return fallback;
  if (list.length === 1) return list[0];
  return `${list[0]} +${list.length - 1}`;
}

function makeTrendPoints(rows) {
  const zoomed = applyTrendZoom(getSortedTrendRows(rows));

  const aggregate = effectiveTrendAggregate();
  if (aggregate === "raw") {
    return zoomed.map(({ row, ts }) => ({
      ts,
      label: formatAxisDate(ts),
      startText: getDateTime(row),
      endText: getEndTime(row),
      site: getSiteName(row),
      station: getStationName(row),
      connection: getConnectionText(row),
      threshold: numericValueFromText(getThreshold(row)),
      samples: 1,
      forward: getTrendPower(row, "forward"),
      reflected: getTrendPower(row, "reflected"),
      vswr: numericValueFromText(getVswrMax(row)),
      rssi: numericValueFromText(getRssiDbm(row)),
      duration: numericValueFromText(getDuration(row))
    }));
  }

  const groups = new Map();
  zoomed.forEach(({ row, ts }) => {
    const key = trendBucketKey(ts);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ row, ts });
  });

  return Array.from(groups.entries()).map(([key, items]) => {
    const tsValues = items.map(it => it.ts);
    const sortedItems = [...items].sort((a, b) => a.ts - b.ts);
    return {
      ts: Math.min(...tsValues),
      label: key,
      startText: getDateTime(sortedItems[0].row),
      endText: getEndTime(sortedItems[sortedItems.length - 1].row),
      site: uniqueLabel(items.map(it => getSiteName(it.row))),
      station: uniqueLabel(items.map(it => getStationName(it.row))),
      connection: uniqueLabel(items.map(it => getConnectionText(it.row))),
      threshold: avg(items.map(it => numericValueFromText(getThreshold(it.row)))),
      samples: items.length,
      forward: avg(items.map(it => getTrendPower(it.row, "forward"))),
      reflected: avg(items.map(it => getTrendPower(it.row, "reflected"))),
      vswr: maxFinite(items.map(it => numericValueFromText(getVswrMax(it.row)))),
      rssi: avg(items.map(it => numericValueFromText(getRssiDbm(it.row)))),
      duration: sum(items.map(it => numericValueFromText(getDuration(it.row))))
    };
  }).sort((a, b) => a.ts - b.ts);
}

function sampleObjects(values, maxPoints = 160) {
  if (!values || values.length <= maxPoints) return values || [];
  const out = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * (values.length - 1) / (maxPoints - 1));
    out.push(values[idx]);
  }
  return out;
}

function formatAxisDate(ts) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

function formatNumber(value, decimals = 3, suffix = "") {
  return Number.isFinite(value) ? `${value.toFixed(decimals)}${suffix}` : "";
}

function scaleLinear(value, min, max, outMin, outMax) {
  if (!Number.isFinite(value)) return null;
  if (min === max) return (outMin + outMax) / 2;
  return outMax - ((value - min) / (max - min)) * (outMax - outMin);
}

function paddedRange(values, options = {}) {
  const nums = values.filter(Number.isFinite);
  if (!nums.length) return { min: 0, max: 1 };

  let min = Math.min(...nums);
  let max = Math.max(...nums);
  if (options.includeZero) min = Math.min(0, min);

  let range = max - min;
  if (range === 0) {
    const base = Math.max(Math.abs(max), 1);
    const pad = options.fixedPad ?? Math.max(base * 0.08, options.minPad ?? 1);
    return { min: min - pad, max: max + pad };
  }

  const pad = Math.max(range * 0.12, options.minPad ?? 0);
  return { min: min - pad, max: max + pad };
}

function circlesFromPoints(points, getter, min, max, left, right, top, bottom, color, radius = 3) {
  return points.map((p, i) => {
    const value = getter(p);
    if (!Number.isFinite(value)) return "";
    const x = points.length === 1 ? (left + right) / 2 : left + i * ((right - left) / (points.length - 1));
    const y = scaleLinear(value, min, max, top, bottom);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="${color}" opacity="0.95"/>`;
  }).join("");
}

function pathFromPoints(points, getter, min, max, left, right, top, bottom) {
  const valid = points
    .map((p, i) => {
      const value = getter(p);
      if (!Number.isFinite(value)) return null;
      const x = points.length === 1 ? (left + right) / 2 : left + i * ((right - left) / (points.length - 1));
      const y = scaleLinear(value, min, max, top, bottom);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean);
  return valid.length >= 2 ? `M ${valid.join(" L ")}` : "";
}

function makeMainTrendSvg(points) {
  const data = sampleObjects(points, 220);
  if (!data.length) return `<div class="logx-chart-empty">No trend data</div>`;

  const width = 1000, height = 300;
  const left = 54, right = 960, top = 20, bottom = 255;
  const powerUnit = window.logTrendPowerUnit === "dbm" ? "dBm" : "W";

  const powerValues = data.flatMap(p => [p.forward, p.reflected]).filter(Number.isFinite);
  const vswrValues = data.map(p => p.vswr).filter(Number.isFinite);
  const powerRange = paddedRange(powerValues, {
    includeZero: window.logTrendPowerUnit === "watt",
    minPad: window.logTrendPowerUnit === "dbm" ? 3 : 0.5,
    fixedPad: window.logTrendPowerUnit === "dbm" ? 5 : undefined
  });
  const vswrRange = paddedRange(vswrValues, { minPad: 0.05, fixedPad: 0.1 });
  let powerMin = powerRange.min;
  let powerMax = powerRange.max;
  let vswrMin = Math.max(0, vswrRange.min);
  let vswrMax = vswrRange.max;

  const fwdPath = pathFromPoints(data, p => p.forward, powerMin, powerMax, left, right, top, bottom);
  const rwdPath = pathFromPoints(data, p => p.reflected, powerMin, powerMax, left, right, top, bottom);
  const vswrPath = pathFromPoints(data, p => p.vswr, vswrMin, vswrMax, left, right, top, bottom);
  const fwdDots = data.length <= 80 ? circlesFromPoints(data, p => p.forward, powerMin, powerMax, left, right, top, bottom, "#2bb7f6", data.length === 1 ? 5 : 2.5) : "";
  const rwdDots = data.length <= 80 ? circlesFromPoints(data, p => p.reflected, powerMin, powerMax, left, right, top, bottom, "#43d39e", data.length === 1 ? 5 : 2.5) : "";
  const vswrDots = data.length <= 80 ? circlesFromPoints(data, p => p.vswr, vswrMin, vswrMax, left, right, top, bottom, "#f59e0b", data.length === 1 ? 5 : 2.5) : "";

  const labels = [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].filter(Boolean);
  const xLabels = labels.map((p, idx) => {
    const x = idx === 0 ? left : idx === 1 ? (left + right) / 2 : right;
    return `<text x="${x}" y="284" fill="#8fa2b8" font-size="11" text-anchor="${idx === 0 ? "start" : idx === 2 ? "end" : "middle"}">${escapeHtml(p.label)}</text>`;
  }).join("");

  let grid = "";
  for (let i = 0; i <= 5; i++) {
    const y = top + i * ((bottom - top) / 5);
    const pVal = powerMax - i * ((powerMax - powerMin) / 5);
    const vVal = vswrMax - i * ((vswrMax - vswrMin) / 5);
    grid += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#26384e" stroke-width="1"/>`;
    grid += `<text x="${left - 10}" y="${y + 4}" fill="#8fa2b8" font-size="11" text-anchor="end">${pVal.toFixed(powerUnit === "W" ? 1 : 0)}</text>`;
    grid += `<text x="${right + 10}" y="${y + 4}" fill="#8fa2b8" font-size="11" text-anchor="start">${vVal.toFixed(2)}</text>`;
  }

  return `
    <svg class="logx-big-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      ${grid}
      <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#31445c" stroke-width="1"/>
      <line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="#31445c" stroke-width="1"/>
      <line x1="${right}" y1="${top}" x2="${right}" y2="${bottom}" stroke="#31445c" stroke-width="1"/>
      ${fwdPath ? `<path d="${fwdPath}" fill="none" stroke="#2bb7f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
      ${rwdPath ? `<path d="${rwdPath}" fill="none" stroke="#43d39e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
      ${vswrPath ? `<path d="${vswrPath}" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
      ${fwdDots}${rwdDots}${vswrDots}
      ${xLabels}
      <text x="${left}" y="14" fill="#8fa2b8" font-size="11">${powerUnit}</text>
      <text x="${right}" y="14" fill="#8fa2b8" font-size="11" text-anchor="end">VSWR</text>
    </svg>`;
}

function makeSingleLineTrendSvg(points, field, color, label, decimals = 1) {
  const data = sampleObjects(points.filter(p => Number.isFinite(p[field])), 180);
  if (!data.length) return `<div class="logx-chart-empty">No ${escapeHtml(label)} data</div>`;

  const width = 1000, height = 170;
  const left = 54, right = 960, top = 18, bottom = 132;
  const range = paddedRange(data.map(p => p[field]), { minPad: field === "rssi" ? 3 : 1, fixedPad: field === "rssi" ? 5 : undefined });
  let min = range.min;
  let max = range.max;

  const path = pathFromPoints(data, p => p[field], min, max, left, right, top, bottom);
  const dots = data.length <= 80 ? circlesFromPoints(data, p => p[field], min, max, left, right, top, bottom, color, data.length === 1 ? 5 : 2.5) : "";
  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const y = top + i * ((bottom - top) / 4);
    const val = max - i * ((max - min) / 4);
    grid += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#26384e" stroke-width="1"/>`;
    grid += `<text x="${left - 10}" y="${y + 4}" fill="#8fa2b8" font-size="11" text-anchor="end">${val.toFixed(decimals)}</text>`;
  }

  const first = data[0], mid = data[Math.floor(data.length / 2)], last = data[data.length - 1];
  const xLabels = [
    `<text x="${left}" y="158" fill="#8fa2b8" font-size="11" text-anchor="start">${escapeHtml(first.label)}</text>`,
    `<text x="${(left + right) / 2}" y="158" fill="#8fa2b8" font-size="11" text-anchor="middle">${escapeHtml(mid.label)}</text>`,
    `<text x="${right}" y="158" fill="#8fa2b8" font-size="11" text-anchor="end">${escapeHtml(last.label)}</text>`
  ].join("");

  return `
    <svg class="logx-small-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      ${grid}
      <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#31445c" stroke-width="1"/>
      ${path ? `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
      ${dots}
      ${xLabels}
    </svg>`;
}

function makeDurationBarTrendSvg(points) {
  const data = sampleObjects(points.filter(p => Number.isFinite(p.duration)), 120);
  if (!data.length) return `<div class="logx-chart-empty">No duration data</div>`;

  const width = 1000, height = 170;
  const left = 54, right = 960, top = 18, bottom = 132;
  let max = Math.max(...data.map(p => p.duration));
  if (max <= 0) max = 1;
  const barW = Math.max(2, (right - left) / data.length * 0.55);

  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const y = top + i * ((bottom - top) / 4);
    const val = max - i * (max / 4);
    grid += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#26384e" stroke-width="1"/>`;
    grid += `<text x="${left - 10}" y="${y + 4}" fill="#8fa2b8" font-size="11" text-anchor="end">${Math.round(val)}s</text>`;
  }

  const bars = data.map((p, i) => {
    const x = data.length === 1 ? (left + right) / 2 - barW / 2 : left + i * ((right - left) / (data.length - 1)) - barW / 2;
    const h = Math.max(2, (p.duration / max) * (bottom - top));
    return `<rect x="${x.toFixed(1)}" y="${(bottom - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="#6d74b9" opacity="0.9"/>`;
  }).join("");

  const first = data[0], mid = data[Math.floor(data.length / 2)], last = data[data.length - 1];
  const xLabels = [
    `<text x="${left}" y="158" fill="#8fa2b8" font-size="11" text-anchor="start">${escapeHtml(first.label)}</text>`,
    `<text x="${(left + right) / 2}" y="158" fill="#8fa2b8" font-size="11" text-anchor="middle">${escapeHtml(mid.label)}</text>`,
    `<text x="${right}" y="158" fill="#8fa2b8" font-size="11" text-anchor="end">${escapeHtml(last.label)}</text>`
  ].join("");

  return `
    <svg class="logx-small-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      ${grid}
      ${bars}
      <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#31445c" stroke-width="1"/>
      ${xLabels}
    </svg>`;
}


function plotlyAvailable() {
  return typeof window.Plotly !== "undefined" && window.Plotly && typeof window.Plotly.react === "function";
}

function plotlyConfig() {
  return {
    responsive: true,
    displayModeBar: false,
    scrollZoom: true
  };
}

function plotlyCommonLayout(height) {
  return {
    height,
    paper_bgcolor: "#0d1826",
    plot_bgcolor: "#0b1420",
    font: { color: "#9fb0c3", family: "Arial, Helvetica, sans-serif", size: 12 },
    margin: { l: 58, r: 58, t: 16, b: 42 },
    hovermode: "x unified",
    hoverlabel: {
      bgcolor: "#101b2b",
      bordercolor: "#233650",
      font: { color: "#e5edf7", size: 12 }
    },
    xaxis: {
      showgrid: true,
      gridcolor: "#26384e",
      zeroline: false,
      color: "#8fa2b8",
      tickformat: "%d/%m %H:%M",
      rangeslider: { visible: false }
    },
    yaxis: {
      showgrid: true,
      gridcolor: "#26384e",
      zeroline: false,
      color: "#8fa2b8"
    },
    legend: {
      orientation: "h",
      x: 1,
      xanchor: "right",
      y: 1.18,
      bgcolor: "rgba(0,0,0,0)"
    }
  };
}

function pointCustomData(points) {
  return points.map(p => [
    p.startText || p.label || "",
    p.endText || "",
    p.site || "",
    p.station || "",
    Number.isFinite(p.reflected) ? p.reflected : null,
    Number.isFinite(p.forward) ? p.forward : null,
    Number.isFinite(p.vswr) ? p.vswr : null,
    Number.isFinite(p.rssi) ? p.rssi : null,
    Number.isFinite(p.duration) ? p.duration : null,
    Number.isFinite(p.threshold) ? p.threshold : null,
    p.connection || "",
    p.samples || 1
  ]);
}

function hoverTemplateFor(label, unit, valueName) {
  return `<b>%{customdata[0]}</b><br>` +
    `End: %{customdata[1]}<br>` +
    `Site: %{customdata[2]}<br>` +
    `Station: %{customdata[3]}<br>` +
    `${label}: %{y:.3f} ${unit}<br>` +
    `Forward: %{customdata[5]:.3f} ${unit}<br>` +
    `Reflected: %{customdata[4]:.3f} ${unit}<br>` +
    `VSWR: %{customdata[6]:.3f}<br>` +
    `RSSI: %{customdata[7]:.1f} dBm<br>` +
    `Threshold: %{customdata[9]:.3f} W<br>` +
    `Duration: %{customdata[8]} sec<br>` +
    `Connection: %{customdata[10]}<br>` +
    `Samples: %{customdata[11]}` +
    `<extra>${valueName}</extra>`;
}

function renderMainTrendPlotly(points) {
  const el = document.getElementById("logxMainTrend");
  if (!el) return;
  if (!plotlyAvailable()) {
    el.innerHTML = makeMainTrendSvg(points);
    return;
  }

  const data = sampleObjects(points, 900);
  if (!data.length) {
    el.innerHTML = `<div class="logx-chart-empty">No trend data</div>`;
    return;
  }

  const x = data.map(p => new Date(p.ts));
  const customdata = pointCustomData(data);
  const unit = window.logTrendPowerUnit === "dbm" ? "dBm" : "W";
  const modeText = window.logTrendPowerValue === "rms" ? "RMS" : "MAX-HOLD";

  const traces = [
    {
      name: "Forward",
      type: "scattergl",
      mode: "lines+markers",
      x,
      y: data.map(p => p.forward),
      customdata,
      line: { color: "#2bb7f6", width: 2.5 },
      marker: { color: "#2bb7f6", size: 5 },
      hovertemplate: hoverTemplateFor("Forward", unit, "Forward")
    },
    {
      name: "Reflected",
      type: "scattergl",
      mode: "lines+markers",
      x,
      y: data.map(p => p.reflected),
      customdata,
      line: { color: "#43d39e", width: 2 },
      marker: { color: "#43d39e", size: 5 },
      hovertemplate: hoverTemplateFor("Reflected", unit, "Reflected")
    },
    {
      name: "VSWR",
      type: "scattergl",
      mode: "lines+markers",
      x,
      y: data.map(p => p.vswr),
      customdata,
      yaxis: "y2",
      line: { color: "#f59e0b", width: 2 },
      marker: { color: "#f59e0b", size: 5 },
      hovertemplate: `<b>%{customdata[0]}</b><br>` +
        `End: %{customdata[1]}<br>` +
        `Site: %{customdata[2]}<br>` +
        `Station: %{customdata[3]}<br>` +
        `VSWR: %{y:.3f}<br>` +
        `Forward: %{customdata[5]:.3f} ${unit}<br>` +
        `Reflected: %{customdata[4]:.3f} ${unit}<br>` +
        `RSSI: %{customdata[7]:.1f} dBm<br>` +
        `Duration: %{customdata[8]} sec<br>` +
        `Samples: %{customdata[11]}<extra>VSWR</extra>`
    }
  ];

  const layout = plotlyCommonLayout(330);
  layout.yaxis.title = `${modeText} ${unit}`;
  layout.yaxis2 = {
    title: "VSWR",
    overlaying: "y",
    side: "right",
    showgrid: false,
    zeroline: false,
    color: "#8fa2b8"
  };

  window.Plotly.react(el, traces, layout, plotlyConfig());
}

function renderRssiTrendPlotly(points) {
  const el = document.getElementById("logxRssiTrend");
  if (!el) return;
  if (!plotlyAvailable()) {
    el.innerHTML = makeSingleLineTrendSvg(points, "rssi", "#9b5cff", "RSSI", 0);
    return;
  }

  const data = sampleObjects(points.filter(p => Number.isFinite(p.rssi)), 900);
  if (!data.length) {
    el.innerHTML = `<div class="logx-chart-empty">No RSSI data</div>`;
    return;
  }

  const customdata = pointCustomData(data);
  const layout = plotlyCommonLayout(205);
  layout.margin = { l: 58, r: 20, t: 12, b: 42 };
  layout.yaxis.title = "RSSI dBm";

  window.Plotly.react(el, [{
    name: "RSSI",
    type: "scattergl",
    mode: "lines+markers",
    x: data.map(p => new Date(p.ts)),
    y: data.map(p => p.rssi),
    customdata,
    line: { color: "#9b5cff", width: 2.5 },
    marker: { color: "#9b5cff", size: 5 },
    hovertemplate: `<b>%{customdata[0]}</b><br>` +
      `Site: %{customdata[2]}<br>` +
      `Station: %{customdata[3]}<br>` +
      `RSSI: %{y:.1f} dBm<br>` +
      `Duration: %{customdata[8]} sec<br>` +
      `Samples: %{customdata[11]}<extra>RSSI</extra>`
  }], layout, plotlyConfig());
}

function renderDurationTrendPlotly(points) {
  const el = document.getElementById("logxDurationTrend");
  if (!el) return;
  if (!plotlyAvailable()) {
    el.innerHTML = makeDurationBarTrendSvg(points);
    return;
  }

  const data = sampleObjects(points.filter(p => Number.isFinite(p.duration)), 900);
  if (!data.length) {
    el.innerHTML = `<div class="logx-chart-empty">No duration data</div>`;
    return;
  }

  const customdata = pointCustomData(data);
  const layout = plotlyCommonLayout(205);
  layout.margin = { l: 58, r: 20, t: 12, b: 42 };
  layout.yaxis.title = "Duration sec";

  window.Plotly.react(el, [{
    name: "Duration",
    type: "bar",
    x: data.map(p => new Date(p.ts)),
    y: data.map(p => p.duration),
    customdata,
    marker: { color: "#6d74b9", opacity: 0.9 },
    hovertemplate: `<b>%{customdata[0]}</b><br>` +
      `Site: %{customdata[2]}<br>` +
      `Station: %{customdata[3]}<br>` +
      `Duration: %{y} sec<br>` +
      `Samples: %{customdata[11]}<extra>Duration</extra>`
  }], layout, plotlyConfig());
}

function renderOverview(rows) {
  refreshTrendControlState();

  const metrics = document.getElementById("logxMetrics");
  if (!metrics) return;

  const points = makeTrendPoints(rows);
  const latest = points.length ? points[points.length - 1] : null;
  const forwardValues = points.map(p => p.forward).filter(Number.isFinite);
  const durationValues = points.map(p => p.duration).filter(Number.isFinite);
  const vswrValues = points.map(p => p.vswr).filter(Number.isFinite);
  const rssiValues = points.map(p => p.rssi).filter(Number.isFinite);
  const powerUnit = window.logTrendPowerUnit === "dbm" ? "dBm" : "W";
  const modeText = window.logTrendPowerValue === "rms" ? "RMS" : "MAX-HOLD";

  const items = [
    { label:`Latest Forward ${modeText} (${powerUnit})`, value:latest ? formatNumber(latest.forward, powerUnit === "W" ? 3 : 2, ` ${powerUnit}`) : "", sub:"Current filtered trend", color:"#e91e9b" },
    { label:`Latest Reflected ${modeText} (${powerUnit})`, value:latest ? formatNumber(latest.reflected, powerUnit === "W" ? 3 : 2, ` ${powerUnit}`) : "", sub:"Current filtered trend", color:"#2bb7f6" },
    { label:"Latest VSWR", value:latest ? formatNumber(latest.vswr, 3) : "", sub:"Latest visible value", color:"#f59e0b" },
    { label:"Latest RSSI", value:latest ? formatNumber(latest.rssi, 1, " dBm") : "", sub:latest ? latest.label : "", color:"#9b5cff" },
    { label:`Average Forward ${modeText} (${powerUnit})`, value:formatNumber(avg(forwardValues), powerUnit === "W" ? 3 : 2, ` ${powerUnit}`), sub:`Peak ${formatNumber(maxFinite(forwardValues), powerUnit === "W" ? 3 : 2, ` ${powerUnit}`)}`, color:"#e91e9b" },
    { label:"Average Duration", value:formatNumber(avg(durationValues), 0, " sec"), sub:`Peak ${formatNumber(maxFinite(durationValues), 0, " sec")} · Points ${points.length}`, color:"#9b5cff" }
  ];

  metrics.innerHTML = items.map(it => `
    <div class="logx-metric" style="--accent:${it.color}">
      <div class="logx-metric-label">${escapeHtml(it.label)}</div>
      <div class="logx-metric-value">${escapeHtml(it.value)}</div>
      <div class="logx-metric-sub">${escapeHtml(it.sub)}</div>
    </div>
  `).join("");

  const sub = document.getElementById("logxMainTrendSub");
  if (sub) {
    sub.textContent = `Left axis = ${modeText} ${powerUnit}, Right axis = VSWR · ${points.length} point(s) · ${effectiveTrendAggregate().toUpperCase()} · ${window.logTrendZoom.toUpperCase()}`;
  }

  renderMainTrendPlotly(points);
  renderRssiTrendPlotly(points);
  renderDurationTrendPlotly(points);
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

  const totalPages = Math.max(1, Math.ceil(rows.length / LOGX_UI.rowsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="19" class="logx-empty">No event log data</td></tr>`;
    renderPagination(0, totalPages);
    return;
  }

  const startIdx = (currentPage - 1) * LOGX_UI.rowsPerPage;
  const pageData = rows.slice(startIdx, startIdx + LOGX_UI.rowsPerPage);

  tbody.innerHTML = pageData.map((row, idx) => {
    const absoluteIndex = startIdx + idx;
    const status = getStatus(row);
    const connection = getConnectionText(row);
    const rowState = status === "Alarm" ? "logx-row-alarm" : status === "Warning" ? "logx-row-warning" : "";

    return `
      <tr class="${rowState}" data-log-key="${escapeHtml(getRowKey(row, absoluteIndex))}">
        <td class="logx-num">${absoluteIndex + 1}</td>
        <td>${escapeHtml(getDateTime(row))}</td>
        <td>${escapeHtml(getEndTime(row))}</td>
        <td><strong>${escapeHtml(getSiteName(row))}</strong></td>
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
        <td>${connection ? badgeHtml(connection, connectionKind(connection)) : ""}</td>
      </tr>`;
  }).join("");

  renderPagination(rows.length, totalPages);
}

function renderPagination(totalRows, totalPages) {
  const info = document.getElementById("logxPageInfo");
  const pagination = document.getElementById("logxPagination");

  if (info) {
    if (!totalRows) {
      info.textContent = "Showing 0 records";
    } else {
      const start = (currentPage - 1) * LOGX_UI.rowsPerPage + 1;
      const end = Math.min(currentPage * LOGX_UI.rowsPerPage, totalRows);
      info.textContent = `Showing ${start}–${end} of ${totalRows} records · Rows per page: ${LOGX_UI.rowsPerPage}`;
    }
  }

  if (!pagination) return;
  pagination.innerHTML = "";

  const makeButton = (text, disabled, handler, active = false, extraClass = "") => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `logx-page-btn ${active ? "logx-page-active" : ""} ${extraClass}`.trim();
    btn.textContent = text;
    btn.disabled = disabled;
    btn.onclick = handler;
    return btn;
  };

  const makeEllipsis = () => {
    const span = document.createElement("span");
    span.className = "logx-page-ellipsis";
    span.textContent = "…";
    return span;
  };

  const goPage = (page) => {
    currentPage = Math.min(Math.max(page, 1), totalPages);
    renderTable();
  };

  pagination.append(
    makeButton("First", currentPage <= 1, () => goPage(1), false, "logx-page-first"),
    makeButton("Prev", currentPage <= 1, () => goPage(currentPage - 1))
  );

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  startPage = Math.max(1, endPage - maxVisiblePages + 1);

  if (startPage > 1) {
    pagination.append(makeButton("1", false, () => goPage(1), currentPage === 1));
    if (startPage > 2) pagination.append(makeEllipsis());
  }

  for (let page = startPage; page <= endPage; page++) {
    pagination.append(
      makeButton(String(page), false, () => goPage(page), page === currentPage)
    );
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pagination.append(makeEllipsis());
    pagination.append(makeButton(String(totalPages), false, () => goPage(totalPages), currentPage === totalPages));
  }

  pagination.append(
    makeButton("Next", currentPage >= totalPages, () => goPage(currentPage + 1)),
    makeButton("Last", currentPage >= totalPages, () => goPage(totalPages))
  );
}

// =========================
// Export
// =========================
function eventLogExportRows(data) {
  return data.map((it, idx) => [
    idx + 1,
    getDateTime(it),
    getEndTime(it),
    getSiteName(it),
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
    getConnectionText(it)
  ]);
}

function exportAll() {
  const data = getDisplayedRows();
  if (!data?.length) return alert("No data to export.");

  const header = [
    "No.", "Start Time", "End Time", "Site", "Station", "Frequency MHz",
    "Forward MAX-HOLD (W)", "Forward MAX-HOLD (dBm)", "Forward AVG/RMS (W)", "Forward AVG/RMS (dBm)",
    "Reflected MAX-HOLD (W)", "Reflected MAX-HOLD (dBm)", "Reflected AVG/RMS (W)", "Reflected AVG/RMS (dBm)",
    "VSWR", "RSSI (dBm)", "Threshold (W)", "Duration (sec)", "Connection"
  ];

  const csv = [header, ...eventLogExportRows(data)].map(a => a.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "datalogger_export.csv";
  link.click();
}
