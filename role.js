// ==========================
// IFZ RCMS Frontend (merged)
// รองรับ MAX_CH = 16
// ==========================
var wsUri;
var ws;
var current_tmp = 0;
var busy = false;
var vswr = 0;
var ampActive = 0;
var rssi = -130;
let nIntervId;
var current_fwd_voltage = 0.00;
var currentID = 0;
var transmitterID = 0;
var dBUnit = false;

const MAX_CH = 16;
function forEachChId(fn) {
  for (let i = 1; i <= MAX_CH; i++) {
    const el = document.getElementById("chId" + i);
    if (el) fn(el, i);
  }
}

function isVisibleFlag(value) {
  return !(value === false || value === 0 || value === "0");
}

function syncTransmitterOption(index, stationName, visible) {
  const txId = String(index);
  const label = stationName || ("TX " + txId);

  forEachChId((selectEl) => {
    const matched = Array.from(selectEl.options).filter((opt) => String(opt.value) === txId);

    if (!visible) {
      const wasSelected = String(selectEl.value) === txId;
      matched.forEach((opt) => opt.remove());
      if (wasSelected) selectEl.value = "0";
      return;
    }

    let option = matched[0];
    if (!option) {
      option = document.createElement("option");
      option.value = txId;
      selectEl.appendChild(option);
    }
    option.textContent = label;

    // กันข้อมูลซ้ำจากข้อความเดิมที่เคย append ไว้
    if (matched.length > 1) {
      matched.slice(1).forEach((opt) => opt.remove());
    }
  });
}

// ==========================
// WebSocket bootstrap
// ==========================
WebSocketTest();

function WebSocketTest() {
  if ("WebSocket" in window) {
    wsUri = "ws://" + location.host + ":1234";
    ws = new WebSocket(wsUri);

    ws.onopen = function() {
      const card0 = document.getElementById("cardTxId0");
      if (card0) card0.style.backgroundColor = "rgba(0, 255, 0, 0.6)";
      ws.send('{"menuID":"getRole"}');
      ws.send('{"menuID":"getThruLan"}');
    };

    ws.onmessage = function (evt) {
      processMsg(evt.data);
    };

    ws.onclose = function() {
      alert("Connection is closed...");
    };
  } else {
    alert("WebSocket NOT supported by your Browser!");
  }
}

// ==========================
// Helpers: voltage -> inputs
// ==========================
function loadHighVoltage() {
  const el = document.getElementById("highPowerVolt");
  if (el) el.value = current_fwd_voltage;
}
function loadLowVoltage() {
  const el = document.getElementById("lowPowerVolt");
  if (el) el.value = current_fwd_voltage;
}

// ==========================
/* Calibration Apply */
function updateCal() {
  const calLowPower   = Number(document.getElementById("lowPowerWatt")?.value || 0);
  const calHighPower  = Number(document.getElementById("highPowerWatt")?.value || 0);
  const calLowVoltage = Number(document.getElementById("lowPowerVolt")?.value || 0);
  const calHighVoltage= Number(document.getElementById("highPowerVolt")?.value || 0);
  const calRwdOffset  = Number(document.getElementById("rwdPowerOffset")?.value || 0);

  // ใช้ && (logical AND) ไม่ใช่ & (bitwise)
  if ((calHighPower > calLowPower) && (calHighVoltage > calLowVoltage)) {
    if (confirm("Start Calibration, Please confirm!") === true) {
      const msg = {
        menuID: "CalibrationEdit.ApplyCal",
        transmitterID: transmitterID,
        calLowPower: calLowPower,
        calHighPower: calHighPower,
        calLowVoltage: calLowVoltage,
        calHighVoltage: calHighVoltage,
        calRwdOffset: calRwdOffset
      };
      if (ws?.readyState === 1) {
        ws.send(JSON.stringify(msg));
      } else {
        alert("ERROR! Connection is closed...");
      }
    } else {
      const resetIds = ["lowPowerWatt","highPowerWatt","lowPowerVolt","highPowerVolt","rwdPowerOffset"];
      resetIds.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    }
  }
}

// ==========================
// Role: Add/Update (txID1..16)
// ==========================
function newRole() {
  const isUpdate = Number(currentID) !== 0;
  const menuID   = isUpdate ? "updaterole" : "addrole";

  const roleNameEl = document.getElementById("roleName");
  const roleName = (roleNameEl?.value || "").trim();
  if (!roleName) { roleNameEl?.focus(); return; }

  // เก็บค่า chId1..chId16 เป็นตัวเลข (ถ้าไม่ใช่ตัวเลขให้เป็น 0)
  const chIds = Array.from({ length: MAX_CH }, (_, i) => {
    const v = parseInt(document.getElementById("chId" + (i + 1))?.value, 10);
    return Number.isFinite(v) ? v : 0;
  });

  // rs232 เป็น boolean จริง ๆ
  let rs232ID1 = !!document.getElementById("rs232Id1")?.checked;
  let rs232ID2 = !!document.getElementById("rs232Id2")?.checked;

  // ถ้า chId1/chId2 เป็น 0 ให้บังคับปิด RS232 ตามเงื่อนไขเดิม
  if (chIds[0] === 0) rs232ID1 = false;
  if (chIds[1] === 0) rs232ID2 = false;

  // ประกอบ object → JSON
  const roleObj = {
    menuID,
    roleID: Number(currentID) || 0,
    roleName,
    rs232ID1,
    rs232ID2
  };
  chIds.forEach((val, idx) => { roleObj["txID" + (idx + 1)] = val; });

  const jsonMessage = JSON.stringify(roleObj);

  const sure = confirm(`${isUpdate ? "Update" : "Add"} Site, Please confirm!`);
  if (sure) {
    if (ws?.readyState === 1) {
      ws.send(jsonMessage);
      // console.log(jsonMessage);
    } else {
      alert("ERROR! Connection is closed...");
    }
  } else {
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify({ menuID: "getRole" }));
    } else {
      alert("ERROR! Connection is closed...");
    }
  }
}

// ==========================
// Transmitter Add/Update
// ==========================
function updateTrueLan() {
  var menuID = (currentID == 0) ? "addTransmitter" : "updateTransmitter";
  var name      = document.getElementById("deviceName").value;
  var ipaddress = document.getElementById("ipaddress").value;
  var maxPower  = document.getElementById("peakPower").value;
  var frequency = document.getElementById("deviceFrequency").value;

  if (name === '') {
    document.getElementById("deviceName").focus();
  } else if ((maxPower === '') || (Number(maxPower) === 0)) {
    document.getElementById("peakPower").focus();
  } else if (ipaddress === '') {
    document.getElementById("ipaddress").focus();
  } else {
    if (confirm("Update Device Info, Please confirm!") === true) {
      var msg = {
        menuID: menuID,
        transmitterID: currentID,
        name: name,
        ipaddress: ipaddress,
        maxFwdPowerWatt: Number(maxPower),
        frequency: Number(frequency)
      };
      if (ws?.readyState === 1) {
        ws.send(JSON.stringify(msg));
      } else {
        alert("ERROR! Connection is closed...");
      }
    } else {
      if (ws?.readyState === 1) {
        ws.send('{"menuID":"getRole"}');
      } else {
        alert("ERROR! Connection is closed...");
      }
    }
  }
}

// ==========================
// Role: select/remove & state
// ==========================
function setCurrentID(newID) {
  currentID = newID;
  if (ws?.readyState === 1) ws.send('{"menuID":"getRole"}');

  if (newID != 0) {
    // console.log("getrole if");
    document.getElementById("newtruelan").innerHTML = 'Edit Site';
    document.getElementById("saverolebutton").innerHTML = 'UPDATE';
    const c0 = document.getElementById("cardTxId0");
    if (c0) c0.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
    document.getElementById("removerolebutton").style.display = "block";
    document.getElementById("selectrolebutton").style.display = "inline-flex";
  } else {
    // console.log("getrole else");
    document.getElementById("newtruelan").innerHTML = 'New Site';
    document.getElementById("saverolebutton").innerHTML = 'NEW';
    document.getElementById("roleName").value = '';
    const c0 = document.getElementById("cardTxId0");
    if (c0) c0.style.backgroundColor = "rgba(0, 255, 0, 0.6)";
    document.getElementById("removerolebutton").style.display = "none";
    document.getElementById("selectrolebutton").style.display = "none";

    // รีเซ็ต chId1..chId16
    forEachChId((el) => { el.value = 0; });

    // รีเซ็ต RS232
    const rs1 = document.getElementById("rs232Id1");
    const rs2 = document.getElementById("rs232Id2");
    if (rs1) rs1.checked = false;
    if (rs2) rs2.checked = false;
  }

  // console.log("newID", currentID);
}

function removeRole() {
  if (confirm("Remove Site, Please confirm!") === true) {
    var msg = { menuID: "removeRole", id: currentID };
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify(msg));
    } else {
      alert("ERROR! Connection is closed...");
    }

    setCurrentID(0); // reset currentID หลังลบ
  } else {
    if (ws?.readyState === 1) {
      ws.send('{"menuID":"getRole"}');
    } else {
      alert("ERROR! Connection is closed...");
    }
  }
}


function selectedRole() {
  if (confirm("Selected Site, Please confirm!") === true) {
    var msg = { menuID: "selectedRole", id: currentID };
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify(msg));
    } else {
      alert("ERROR! Connection is closed...");
    }
  } else {
    if (ws?.readyState === 1) {
      ws.send('{"menuID":"getRole"}');
    } else {
      alert("ERROR! Connection is closed...");
    }
  }
  setCurrentID(0);
}

// ==========================
// WS message handler
// ==========================
function processMsg(message) {
  var obj = {};
  try { obj = JSON.parse(message); } catch(e) { console.warn("Invalid JSON:", message); return; }

  if (obj.menuID == 'listRole') {
    var index = obj.index;
    var roleName = obj.name;
    var visible = obj.visible === 0 ? false : true;
    var cardTxName = "cardTxId" + index;
    var cardNameId = "cardNameId" + index;
    var elementExists = document.getElementById(cardTxName);

    // console.log("index:",index," visible:",visible)
    if (typeof(elementExists) != 'undefined' && elementExists != null) {
      // Exists.
      if (currentID == index) {
        document.getElementById(cardTxName).style.backgroundColor = "rgba(0, 255, 0, 0.6)";

        // ตั้งค่า chId1..chId16 จาก payload obj.chId1..obj.chId16
        for (let i = 1; i <= MAX_CH; i++) {
          const el = document.getElementById("chId" + i);
          if (el) {
            const key = "chId" + i;
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              el.value = obj[key];
            } else {
              el.value = 0;
            }
          }
        }

        document.getElementById("roleName").value = roleName;
        document.getElementById(cardNameId).textContent = roleName;
        // console.log("roleName",roleName)
        document.getElementById("rs232Id1").checked = (obj.rs232Id1 == 1 || obj.rs232Id1 === true);
        document.getElementById("rs232Id2").checked = (obj.rs232Id2 == 1 || obj.rs232Id2 === true);
        if (obj.currentActive) {
          const selectBtn = document.getElementById("selectrolebutton");
          if (selectBtn) selectBtn.style.display = "inline-flex";
          document.getElementById(cardTxName).style.backgroundColor = "rgba(0, 255, 0, 0.6)";
        }
      } else {
        document.getElementById(cardTxName).style.backgroundColor = "rgba(0, 0, 0, 0.1)";
        if (obj.currentActive) {
          document.getElementById(cardTxName).style.backgroundColor = "rgba(0, 255, 0, 0.3)";
        }
      }
      // console.log("elementExists.style.display = (visible === false) == ",(visible === false))
      elementExists.style.display = (visible === false) ? "none" : "block";
    } else {
      const card0 = document.getElementById("card0");
      if (!card0) return;

      card0.appendChild(
        Object.assign(document.createElement('div'), { className : 'cardTxTab', id: cardTxName })
      ).appendChild(
        Object.assign(document.createElement('img'), { className : 'cardTxTabImage', src: "img/site.png", alt: "Flowers in Chania" })
      );

      const cardTxId = document.getElementById(cardTxName);
      cardTxId.setAttribute("onclick", "setCurrentID("+index+");");

      cardTxId.appendChild(
        Object.assign(document.createElement('span'), { className : 'cardTxTabText3', id: cardNameId, innerHTML: roleName })
      );

      cardTxId.style.display = (visible === false) ? "none" : "block";
      cardTxId.style.backgroundColor = obj.currentActive ? "rgba(0, 255, 0, 0.3)" : "rgba(0, 0, 0, 0.1)";
    }
  }
  else if (obj.menuID == 'listTransmitter') {
    const index = Number(obj.index);
    if (!Number.isFinite(index) || index <= 0) return;

    const cardLabel = obj.stationName;
    const visible = isVisibleFlag(obj.visible);
    syncTransmitterOption(index, cardLabel, visible);
  }
  else if (obj.menuID == "view_transmitter_list") {
    // reserved
  }
  else if (obj.menuID == "update") {
    var updateStatus = obj.updateStatus;
    if (updateStatus == 2){
      alert("System updated, Please restart your system.");
    }
  } else {
    // console.debug(message);
  }
}

// ==========================
// UI Toggles / Commands
// ==========================
function setUnit(unit) {
  dBUnit = (unit == 1);
  if (dBUnit){
    document.getElementById("unitWattActive").style = "left: calc(100% - 80px); background-color: #00968840;";
    document.getElementById("unitDBActive").style   = "left: calc(100% - 160px); background-color: #009688FF;";
  } else {
    document.getElementById("unitWattActive").style = "left: calc(100% - 80px); background-color: #009688FF;";
    document.getElementById("unitDBActive").style   = "left: calc(100% - 160px); background-color: #00968840;";
  }
}

function updateRFPwr(){
  var rfPower = document.getElementById("rfPower").value;
  var setRFPWR = "L1";
  if (rfPower == "LOW2") setRFPWR = "L2";
  else if (rfPower == "HIGH") setRFPWR = "H";
  var msg = { menuID: "MCHRFPWR", setTxOutputLevel: setRFPWR };
  if (ws?.readyState === 1) ws.send(JSON.stringify(msg));
  else alert("ERROR! Connection is closed...");
}

function updateSQLLevel(){
  var sqlLevelCmmd = document.getElementById("sqlLevel").value;
  var msg = { menuID: "SETMSQLLV", sqlLevelCmmd: sqlLevelCmmd };
  if (ws?.readyState === 1) ws.send(JSON.stringify(msg));
  else alert("ERROR! Connection is closed...");
}

function updateCHSel(){
  var setMemChSel = document.getElementById("chSel").value;
  var msg = { menuID: "MCHSEL", setMemChSel: setMemChSel };
  if (ws?.readyState === 1) ws.send(JSON.stringify(msg));
  else alert("ERROR! Connection is closed...");
}

// ==========================
// Gauge animation
// ==========================
function animateResultCount(numberfwd, targetfwd, numberrwd, targetrwd) {
  var maxFwd = 50;
  var maxRwd = 0;

  if (targetfwd > maxFwd) maxFwd = targetfwd;
  maxRwd = maxFwd / 2;
  var timeout = 20;

  if(nIntervId == null) {
    var count1 = 0;
    if(!((numberfwd*1).toFixed(0) == (targetfwd*1).toFixed(0))) {
      nIntervId = setInterval(function() {
        if ((numberfwd*1).toFixed(0) == (targetfwd*1).toFixed(0)) {
          clearInterval(nIntervId);
          nIntervId = null;
        }
        count1 = count1 + 1;
        if (count1 == timeout) {
          targetfwd = numberfwd;
          clearInterval(nIntervId);
          nIntervId = null;
        }
        numberfwd = document.getElementById("fwd").innerHTML;
        numberrwd = document.getElementById("rwd").innerHTML;
        myProgressCircle(document.getElementById("fwd").innerHTML, document.getElementById("rwd").innerHTML, 0, maxFwd, 0, maxRwd, vswr, rssi);
        myProgressCircle(document.getElementById("fwd").innerHTML, document.getElementById("rwd").innerHTML, 0, maxFwd, 0, maxRwd, vswr, rssi);
      }, 50);
    }

    myProgressCircle(document.getElementById("fwd").innerHTML, document.getElementById("rwd").innerHTML, 0, maxFwd, 0, maxRwd, vswr, rssi);
  } else {
    // console.log("busy");
  }
}
