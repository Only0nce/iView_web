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


// --- Safe DOM helpers (กัน null ทุกครั้ง) ---
const $ = (id) => document.getElementById(id);
const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const setValue = (id, v) => { const el = $(id); if (el) el.value = v; };
const setStyle = (id, prop, val) => { const el = $(id); if (el) el.style[prop] = val; };
const setWidth = (id, pct) => { const el = $(id); if (el) el.style.width = pct; };

// ===== Threshold helpers =====
const thresholdMap = Object.create(null); // key = id (index/databaseId), value = { fwd:{warn,alert}, rssi:{warn,alert}, vswr:{warn,alert} }

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


WebSocketTest();
// window.onload = function(){
//   myCanvasfwd(0)
//   myCanvasrwd(0)
//   vswr = (vswr*1.0).toFixed(0)
//   animateResultCount(document.getElementById("fwd").innerHTML,0,document.getElementById("rwd").innerHTML,0)
// }

function WebSocketTest() {
  if ("WebSocket" in window) {
    wsUri = "ws://" + location.host + ":1234";
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

    ws.onclose = function () {
      // websocket is closed.
      alert("Connection is closed...");
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

  /* ---------- วางแทนบล็อคเดิมทั้งก้อนนี้ ---------- */
  else if (obj.menuID == "view_transmitter_list") {
    // ---- ไม่มี return กลางทาง ----
    try {
      // ใช้ index ที่แม็ปกับ id ใน PHP (card1..card12 / myPlot1..myPlot12)
      const id = String(
        obj.webindex ?? obj.index ?? obj.radioID ?? obj.databaseId ?? 0
      );
  
      // คำนวณค่า
      let swrmax = 2;
      let stationName = obj.stationName + " " + (obj.frequency/1e6).toFixed(4) + " MHz";
      if (obj.frequency == 0) stationName = obj.stationName;
  
      const fwd    = Number((obj.fwdPowerWatt*1.0).toFixed(2));
      let   fwdmax = Number((obj.maxFwdPowerWatt*1.0).toFixed(2));
      const rwd    = Number((obj.rwdPowerWatt*1.0).toFixed(2));
      let   rwdmax = Number((obj.maxFwdPowerWatt/2.0).toFixed(2));
      const fwd_dB = Number((obj.fwdPowerDB*1.0).toFixed(2));
      const rwd_dB = Number((obj.rwdPowerDB*1.0).toFixed(2));
      const swr    = Number((obj.vswr*1.0).toFixed(3));
      const rssiDb = Number(obj.rssi);
  
      const visible = (obj.visible == 1 || obj.visible === true || obj.visible === "1");
      const connectionStatus = (obj.connectionStatus == 1);
  
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
  
      // อัปเดตชื่อการ์ด
      const titleEl = get(ids.title);
      if (titleEl) titleEl.innerHTML = stationName;
  
      // normalize max
      if (fwd > fwdmax) fwdmax = fwd;
      if (rwd > rwdmax) rwdmax = rwd;
      if (swr > swrmax) swrmax = swr;
  
      // แสดง/ซ่อนการ์ดตาม visible โดยไม่ออกจากฟังก์ชัน
      const cardEl = get(ids.currentCard);
      const plotEl = get(ids.plotCard);
      if (cardEl) cardEl.style.display = visible ? "block" : "none";
      if (plotEl) plotEl.style.display = visible ? "block" : "none";
  
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
          if (rwdUnitEl) rwdUnitEl.innerHTML = "RSSI (dBm)";
        } else {
          if (fwdValEl)  fwdValEl.innerHTML = String(fwd);
          if (rwdValEl)  rwdValEl.innerHTML = String(rwd);
          if (fwdUnitEl) fwdUnitEl.innerHTML = "Forward Power (W)";
          if (rwdUnitEl) rwdUnitEl.innerHTML = "RSSI (dBm)";
        }
        if (swrValEl) swrValEl.innerHTML = String(swr);
  
        // เก็บ series + วาดกราฟ (ไม่ return ถ้า plot div หาย)
        const date = (obj.dateList || obj.date || "") + "T" + (obj.timestamp || obj.timeList || "");
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
  
          if (timeArrMap[id].length > 1000) {
            timeArrMap[id].shift(); fwdArrMap[id].shift(); rwdArrMap[id].shift(); vswrArrMap[id].shift(); rssiArrMap[id].shift();
          }
  
          if (get(ids.plotDiv) && typeof drawMyPlot === "function") {
            drawMyPlot(fwdArrMap[id], rwdArrMap[id], vswrArrMap[id], timeArrMap[id], id, dBUnit, rssiArrMap[id]);
          }
        }
      }
  
      // ปิดท้าย: ย้ำการมองเห็นตาม visible อีกครั้ง (idempotent)
      const cardEl2 = document.getElementById(ids.currentCard);
      const plotEl2 = document.getElementById(ids.plotCard);
      if (cardEl2) cardEl2.style.display = visible ? "block" : "none";
      if (plotEl2) plotEl2.style.display = visible ? "block" : "none";
    } catch (e) {
      // จับ error ไม่ให้ฟังก์ชันหลุด (ยังคงวนต่อไปได้)
      console.warn("view_transmitter_list error:", e);
    }
  }
  
  
// เมื่อได้รับ listTransmitter สะสม threshold ไว้ก่อน
else if (obj.menuID === 'listTransmitter') {
  const id = String(obj.index); // หรือ databaseId ตามหน้า
  thresholdMap[id] = {
    fwd:  { warn: Number(obj.warningFwdPowerWatt), alert: Number(obj.alertFwdPowerWatt) },     // low-bad
    rssi: { warn: Number(obj.warningRssi),         alert: Number(obj.alertRssi) },              // low-bad
    vswr: { warn: Number(obj.warningVSWR),         alert: Number(obj.alertVSWR) }               // high-bad
  };
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

function drawMyPlot(fwd, rwd, vswr, time, id, dBUnit) {
  if (time.length === 0) return;
  const targetId = `myPlot${id}`;
  if (!$(targetId)) return; // ถ้า div ยังไม่มา ให้ข้าม

  let powerUnit = dBUnit ? "dBm" : "W";
  let hoverSuffix = dBUnit ? " dBm" : " W";

  let latest = new Date(time[time.length - 1]);
  let earliest = new Date(latest.getTime() - 10 * 60 * 1000);

  let filteredTimes = [];
  let filteredFwd = [];
  let filteredRwd = [];
  let filteredVswr = [];

  for (let i = 0; i < time.length; i++) {
    let t = new Date(time[i]);
    if (t >= earliest) {
      filteredTimes.push(time[i]);
      filteredFwd.push(fwd[i]);
      filteredRwd.push(rwd[i]);
      filteredVswr.push(vswr[i]);
    }
  }

  var trace1 = {
    x: filteredTimes,
    y: filteredFwd,
    type: 'scatter',
    name: 'Forward',
    hovertemplate:
      '<b>Time:</b> %{x|%H:%M:%S}<br>' +
      '<b>Forward Power:</b> %{y}' + hoverSuffix + '<br>' +
      '<extra></extra>',
    marker: {
      color: "rgb(68, 252, 68)",
      line: { color: "rgb(255, 254, 254)", width: 2 }
    }
  };

  var trace2 = {
    x: filteredTimes,
    y: filteredRwd,
    type: 'scatter',
    name: 'Reflected',
    hovertemplate:
      '<b>Time:</b> %{x|%H:%M:%S}<br>' +
      '<b>Reflected Power:</b> %{y}' + hoverSuffix + '<br>' +
      '<extra></extra>',
    marker: {
      color: "rgb(226, 223, 39)",
      line: { color: "rgb(255, 254, 254)", width: 2 }
    }
  };

  var trace3 = {
    x: filteredTimes,
    y: filteredVswr,
    type: 'scatter',
    name: 'VSWR',
    yaxis: 'y2',
    hovertemplate:
      '<b>Time:</b> %{x|%H:%M:%S}<br>' +
      '<b>VSWR:</b> %{y}<br>' +
      '<extra></extra>',
    marker: {
      color: "rgb(54, 124, 253)",
      line: { color: "rgb(255, 254, 254)", width: 2 }
    }
  };

  var data = [trace1, trace2, trace3];

  var layout = {
    legend: { orientation: "h", x: 0.5, y: 1.15, xanchor: 'center' },
    margin: { l: 45, r: 45, t: 10, b: 40 },
    paper_bgcolor: '#21323E',
    plot_bgcolor: '#21323E',
    font: { color: '#FFFFFF' },
    xaxis: {
      title: { text: 'Time (m)', font: { color: '#FFFFFF' } },
      color: '#FFFFFF',
      showline: true,
      linecolor: '#FFFFFF',
      linewidth: 2,
      tickformat: "%H:%M:%S",
      type: 'date'
    },
    yaxis: {
      title: { text: 'Power (' + powerUnit + ')', font: { color: '#FFFFFF' } },
      color: '#FFFFFF',
      showline: true,
      linecolor: '#FFFFFF',
      linewidth: 2,
      zeroline: false,
    },
    yaxis2: {
      title: { text: 'VSWR', font: { color: '#FFFFFF' } },
      color: '#FFFFFF',
      overlaying: 'y',
      side: 'right',
      showline: true,
      linecolor: '#FFFFFF',
      linewidth: 2,
      zeroline: false,
    }
  };

  Plotly.react(targetId, data, layout, { responsive: true });
}


// helper (วางบนสุดใกล้ ๆ setHTML)
function paintFullBar(barEl, color) {
  if (!barEl) return;
  barEl.style.removeProperty('width');
  barEl.style.removeProperty('flex-basis');
  barEl.style.setProperty('width', '95%', 'important'); // เต็มตลอด
  barEl.style.background = color; // ลงสีตาม severity
}