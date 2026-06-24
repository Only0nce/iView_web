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
var activeRoleName = "";
var activeRoleSummary = { all: 0, connect: 0, disconnect: 0 };
var activeRoleRefreshTimer = null;
var siteDeleteTxHideGuardUntil = 0;
var siteDeleteTxHideGuardReason = "";

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


function normalizeSiteName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getSiteCardName(cardEl) {
  if (!cardEl) return "";
  const nameEl = cardEl.querySelector(".cardTxTabText3");
  return nameEl ? nameEl.textContent : "";
}

function syncActiveSiteBadge(cardEl, isActive) {
  if (!cardEl) return;

  let badge = cardEl.querySelector(".cardTxActiveBadge");
  if (isActive) {
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "cardTxActiveBadge";
      badge.setAttribute("aria-hidden", "true");
      cardEl.appendChild(badge);
    }
    badge.textContent = "SELECTED";
  } else if (badge) {
    badge.remove();
  }
}

function syncSiteCardHighlight(cardEl, roleName, activeFromList) {
  if (!cardEl) return;

  const cardId = cardEl.id || "";
  const isAddNewCard = cardId === "cardTxId0";
  const normalizedRoleName = normalizeSiteName(roleName);
  const isActiveFromSummary = !!activeRoleName && normalizedRoleName === activeRoleName;
  const isActive = !isAddNewCard && (!!activeFromList || isActiveFromSummary);
  const isEditing = !isAddNewCard && Number(currentID) !== 0 && cardId === ("cardTxId" + currentID);

  cardEl.dataset.roleName = roleName || "";
  cardEl.dataset.currentActive = activeFromList ? "1" : "0";
  cardEl.classList.toggle("is-active-site", isActive);
  cardEl.classList.toggle("is-editing-site", isEditing);
  cardEl.setAttribute("aria-current", isActive ? "true" : "false");
  cardEl.title = isActive
    ? "Selected Site: " + (roleName || "--")
    : "Site: " + (roleName || "--");

  syncActiveSiteBadge(cardEl, isActive);
}

function refreshActiveSiteHighlights() {
  document.querySelectorAll('.cardTxTab[id^="cardTxId"]').forEach((cardEl) => {
    if (cardEl.id === "cardTxId0") {
      cardEl.classList.remove("is-active-site", "is-editing-site");
      syncActiveSiteBadge(cardEl, false);
      return;
    }

    const roleName = cardEl.dataset.roleName || getSiteCardName(cardEl);
    syncSiteCardHighlight(cardEl, roleName, cardEl.dataset.currentActive === "1");
  });
}

function setActiveSiteSummaryDom(roleName, summary, reason) {
  const safeRoleName = String(roleName ?? "").trim();
  const normalizedRoleName = normalizeSiteName(safeRoleName);

  activeRoleName = normalizedRoleName;
  activeRoleSummary = {
    all: Number(summary?.all ?? 0),
    connect: Number(summary?.connect ?? 0),
    disconnect: Number(summary?.disconnect ?? 0)
  };

  const nameEl = document.getElementById("activeRoleNameDisplay");
  if (nameEl) {
    nameEl.textContent = safeRoleName || "<unknown>";
  }

  const summaryEl = document.getElementById("activeRoleDeviceSummary");
  if (summaryEl) {
    summaryEl.textContent = "All: " + activeRoleSummary.all
      + " | Connect: " + activeRoleSummary.connect
      + " | Disconnect: " + activeRoleSummary.disconnect;
  }

  console.log("[ACTIVE SITE] DOM update", {
    reason,
    roleName: safeRoleName || "<unknown>",
    activeRoleName,
    summary: activeRoleSummary
  });

  refreshActiveSiteHighlights();
}

function clearActiveSiteSummary(reason = "clear") {
  console.warn("[ACTIVE SITE] clear", reason);

  activeRoleName = "";
  activeRoleSummary = { all: 0, connect: 0, disconnect: 0 };

  const nameEl = document.getElementById("activeRoleNameDisplay");
  if (nameEl) {
    nameEl.textContent = "<unknown>";
  }

  const summaryEl = document.getElementById("activeRoleDeviceSummary");
  if (summaryEl) {
    summaryEl.textContent = "All: 0 | Connect: 0 | Disconnect: 0";
  }

  document.querySelectorAll('.cardTxTab[id^="cardTxId"]').forEach((cardEl) => {
    cardEl.dataset.currentActive = "0";
    cardEl.classList.remove("is-active-site");
    cardEl.setAttribute("aria-current", "false");
    syncActiveSiteBadge(cardEl, false);
  });
}

function updateActiveSiteFromSummary(obj) {
  const rawRoleName = String(obj.roleName ?? obj.name ?? "").trim();
  const normalizedRoleName = normalizeSiteName(rawRoleName);
  const all = Number(obj.all_device ?? obj.allDevice ?? obj.all ?? 0);
  const connect = Number(obj.connect ?? obj.connected ?? 0);
  const disconnect = Number(obj.disconnect ?? obj.disconnected ?? 0);

  const looksEmpty =
    !rawRoleName ||
    normalizedRoleName === "unknown" ||
    normalizedRoleName === "<unknown>";

  if (looksEmpty) {
    clearActiveSiteSummary("view_update_Page has no active site");
    return;
  }

  setActiveSiteSummaryDom(rawRoleName, { all, connect, disconnect }, "view_update_Page");
}

function syncTransmitterOption(index, stationName, visible) {
  const txId = String(index);
  const label = stationName || ("TX " + txId);

  forEachChId((selectEl) => {
    const matched = Array.from(selectEl.options).filter((opt) => String(opt.value) === txId);

    if (!visible) {
      if (isSiteDeleteTransmitterHideGuardActive()) {
        let option = matched[0];
        if (!option) {
          option = document.createElement("option");
          option.value = txId;
          selectEl.appendChild(option);
        }

        option.textContent = label;

        if (matched.length > 1) {
          matched.slice(1).forEach((opt) => opt.remove());
        }

        console.warn("[SITE DELETE GUARD] keep transmitter option although visible=false", {
          txId,
          label,
          selectId: selectEl.id,
          reason: siteDeleteTxHideGuardReason
        });
        return;
      }

      const wasSelected = String(selectEl.value) === txId;
      matched.forEach((opt) => opt.remove());
      if (wasSelected) selectEl.value = "0";
      console.warn("[TRANSMITTER OPTION] removed because backend sent visible=false", {
        txId,
        label,
        selectId: selectEl.id
      });
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

function sendWsJson(obj, reason = "") {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === 1) {
    ws.send(JSON.stringify(obj));
    if (reason) {
      console.log("[WS SEND]", reason, obj);
    }
    return true;
  }

  console.warn("[WS SEND] skipped, websocket not ready", { reason, obj });
  return false;
}

function requestSiteDataRefresh(reason = "manual", delayMs = 0) {
  const run = () => {
    console.log("[SITE REFRESH] request", reason);
    sendWsJson({ menuID: "getRole" }, reason + ": getRole");
    sendWsJson({ menuID: "getMonitorPage" }, reason + ": getMonitorPage");
    sendWsJson({ menuID: "getThruLan" }, reason + ": getThruLan");
  };

  if (delayMs > 0) {
    window.setTimeout(run, delayMs);
  } else {
    run();
  }
}

function requestSiteDataRefreshNowAndLater(reason = "manual") {
  if (activeRoleRefreshTimer) {
    window.clearTimeout(activeRoleRefreshTimer);
    activeRoleRefreshTimer = null;
  }

  requestSiteDataRefresh(reason + " immediate", 0);

  activeRoleRefreshTimer = window.setTimeout(() => {
    requestSiteDataRefresh(reason + " delayed", 0);
    activeRoleRefreshTimer = null;
  }, 250);
}

function requestSiteOnlyRefresh(reason = "manual", delayMs = 0) {
  const run = () => {
    console.log("[SITE REFRESH] site-only request", reason);
    sendWsJson({ menuID: "getRole" }, reason + ": getRole");
    sendWsJson({ menuID: "getMonitorPage" }, reason + ": getMonitorPage");
  };

  if (delayMs > 0) {
    window.setTimeout(run, delayMs);
  } else {
    run();
  }
}

function requestSiteOnlyRefreshNowAndLater(reason = "manual") {
  if (activeRoleRefreshTimer) {
    window.clearTimeout(activeRoleRefreshTimer);
    activeRoleRefreshTimer = null;
  }

  requestSiteOnlyRefresh(reason + " immediate", 0);

  activeRoleRefreshTimer = window.setTimeout(() => {
    requestSiteOnlyRefresh(reason + " delayed", 0);
    activeRoleRefreshTimer = null;
  }, 250);
}

function armSiteDeleteTransmitterHideGuard(reason = "site delete", durationMs = 3000) {
  siteDeleteTxHideGuardUntil = Date.now() + durationMs;
  siteDeleteTxHideGuardReason = reason;

  console.warn("[SITE DELETE GUARD] armed", {
    reason,
    durationMs,
    until: new Date(siteDeleteTxHideGuardUntil).toISOString()
  });
}

function isSiteDeleteTransmitterHideGuardActive() {
  return Date.now() < siteDeleteTxHideGuardUntil;
}

function getRoleNameById(roleID) {
  const cardEl = document.getElementById("cardTxId" + roleID);
  const cardName = getSiteCardName(cardEl);
  const formName = document.getElementById("roleName")?.value || "";

  return String(cardName || formName || "").trim();
}

function countSelectedTransmittersFromForm() {
  const ids = new Set();

  forEachChId((selectEl) => {
    const value = Number(selectEl.value);
    if (Number.isFinite(value) && value > 0) {
      ids.add(value);
    }
  });

  return ids.size;
}

function markActiveSiteImmediately(roleID, reason = "selected") {
  const numericRoleID = Number(roleID);
  const roleName = getRoleNameById(numericRoleID);
  const all = countSelectedTransmittersFromForm();

  if (!numericRoleID || numericRoleID <= 0 || !roleName) {
    clearActiveSiteSummary(reason + ": invalid selected site");
    return;
  }

  document.querySelectorAll('.cardTxTab[id^="cardTxId"]').forEach((cardEl) => {
    const isCurrent = cardEl.id === "cardTxId" + numericRoleID;
    cardEl.dataset.currentActive = isCurrent ? "1" : "0";
    const cardRoleName = cardEl.dataset.roleName || getSiteCardName(cardEl);
    syncSiteCardHighlight(cardEl, cardRoleName, isCurrent);
  });

  setActiveSiteSummaryDom(roleName, { all, connect: 0, disconnect: 0 }, reason + " optimistic");
}

function isActiveSiteRole(roleID, roleName = "") {
  const cardEl = document.getElementById("cardTxId" + roleID);
  const activeFromCard = cardEl?.dataset?.currentActive === "1";
  const activeFromName = !!activeRoleName && normalizeSiteName(roleName || getRoleNameById(roleID)) === activeRoleName;

  return !!activeFromCard || !!activeFromName;
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
      if (card0) {
        card0.style.backgroundColor = "rgba(0, 255, 0, 0.6)";
        card0.classList.remove("is-active-site", "is-editing-site");
      }
      requestSiteDataRefresh("websocket open");
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
      requestSiteDataRefreshNowAndLater(isUpdate ? "role updated" : "role added");
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

  refreshActiveSiteHighlights();

  // console.log("newID", currentID);
}

function removeRole() {
  const removeID = Number(currentID) || 0;
  const removeName = getRoleNameById(removeID);
  const removingActiveSite = isActiveSiteRole(removeID, removeName);

  if (confirm("Remove Site, Please confirm!") === true) {
    var msg = { menuID: "removeRole", id: removeID };
    if (ws?.readyState === 1) {
      /*
       * Deleting a Site must not delete/hide Transmitters in this page.
       * Some backend builds temporarily broadcast listTransmitter visible=false
       * while clearing the selected Site mapping. During this short window,
       * keep transmitter options alive in chId1..chId16.
       */
      armSiteDeleteTransmitterHideGuard("removeRole id=" + removeID, 3000);

      ws.send(JSON.stringify(msg));

      if (removingActiveSite) {
        clearActiveSiteSummary("active site removed: " + (removeName || removeID));
      }

      /*
       * Refresh only Site data here. Do not request getThruLan immediately after
       * removeRole, because getThruLan can replay visible=false transmitter states
       * from the Site-delete path and make transmitter options disappear.
       */
      requestSiteOnlyRefreshNowAndLater("role removed");
    } else {
      alert("ERROR! Connection is closed...");
    }

    setCurrentID(0); // reset currentID หลังลบ
  } else {
    requestSiteDataRefreshNowAndLater("remove role canceled");
  }
}


function selectedRole() {
  const selectedID = Number(currentID) || 0;

  if (selectedID <= 0) {
    clearActiveSiteSummary("selectedRole called without site");
    requestSiteDataRefreshNowAndLater("selectedRole no site");
    setCurrentID(0);
    return;
  }

  if (confirm("Selected Site, Please confirm!") === true) {
    var msg = { menuID: "selectedRole", id: selectedID };
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify(msg));

      // Update the selected-site card immediately so the UI does not stay as <unknown>.
      // The backend summary will overwrite this optimistic value after getMonitorPage responds.
      markActiveSiteImmediately(selectedID, "selectedRole");
      requestSiteDataRefreshNowAndLater("selectedRole");
    } else {
      alert("ERROR! Connection is closed...");
    }
  } else {
    requestSiteDataRefreshNowAndLater("selectedRole canceled");
  }

  setCurrentID(0);
}

function isVisibleOff(visible) {
  return (
    visible === false ||
    visible === 0 ||
    visible === "0" ||
    visible === "false" ||
    visible === null ||
    typeof visible === "undefined"
  );
}

function setValueSafely(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.value = value;
  }
}

function setCheckedSafely(id, checked) {
  const el = document.getElementById(id);
  if (el) {
    el.checked = checked;
  }
}

function clearRoleForm() {
  setValueSafely("roleName", "");

  for (let i = 1; i <= MAX_CH; i++) {
    setValueSafely("chId" + i, 0);
  }

  setCheckedSafely("rs232Id1", false);
  setCheckedSafely("rs232Id2", false);

  const selectBtn = document.getElementById("selectrolebutton");
  if (selectBtn) {
    selectBtn.style.display = "none";
  }
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
    var visible = !isVisibleOff(obj.visible);
  
    var cardTxName = "cardTxId" + index;
    var cardNameId = "cardNameId" + index;
    var elementExists = document.getElementById(cardTxName);
  
    /*
     * If backend says this role is invisible,
     * remove the role card from DOM completely.
     * Do not only set display:none, because hidden role cards may keep old selected state.
     */
    if (!visible) {
      const wasActiveSite = isActiveSiteRole(index, roleName);

      if (elementExists) {
        elementExists.remove();
      }
  
      if (currentID == index) {
        currentID = 0;
        clearRoleForm();
      }

      if (wasActiveSite) {
        clearActiveSiteSummary("active site hidden by listRole: " + (roleName || index));
        requestSiteDataRefreshNowAndLater("active site hidden");
      }
  
      return;
    }
  
    /*
     * Case 1:
     * Existing role card.
     */
    if (typeof(elementExists) != 'undefined' && elementExists != null) {
      elementExists.dataset.roleName = roleName || "";
      elementExists.dataset.currentActive = obj.currentActive ? "1" : "0";

      if (currentID == index) {
        elementExists.style.backgroundColor = "rgba(0, 255, 0, 0.6)";
  
        /*
         * Set chId1..chId16 from payload obj.chId1..obj.chId16
         */
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
  
        setValueSafely("roleName", roleName);
  
        const cardNameEl = document.getElementById(cardNameId);
        if (cardNameEl) {
          cardNameEl.textContent = roleName;
        }
  
        setCheckedSafely("rs232Id1", obj.rs232Id1 == 1 || obj.rs232Id1 === true);
        setCheckedSafely("rs232Id2", obj.rs232Id2 == 1 || obj.rs232Id2 === true);
  
        if (obj.currentActive) {
          const selectBtn = document.getElementById("selectrolebutton");
          if (selectBtn) {
            selectBtn.style.display = "inline-flex";
          }
  
          elementExists.style.backgroundColor = "rgba(0, 255, 0, 0.6)";
        }
      } else {
        elementExists.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
  
        if (obj.currentActive) {
          elementExists.style.backgroundColor = "rgba(0, 255, 0, 0.3)";
        }
      }
  
      syncSiteCardHighlight(elementExists, roleName, obj.currentActive);
      if (obj.currentActive && !activeRoleName) {
        setActiveSiteSummaryDom(roleName, activeRoleSummary, "listRole currentActive existing");
      }
      elementExists.style.display = "block";
    }
  
    /*
     * Case 2:
     * New role card.
     */
    else {
      const card0 = document.getElementById("card0");
      if (!card0) return;
  
      const cardTxId = document.createElement('div');
      cardTxId.className = 'cardTxTab';
      cardTxId.id = cardTxName;
      cardTxId.setAttribute("onclick", "setCurrentID(" + index + ");");
  
      const img = document.createElement('img');
      img.className = 'cardTxTabImage';
      img.src = "img/site.png";
      img.alt = "Role";
  
      const span = document.createElement('span');
      span.className = 'cardTxTabText3';
      span.id = cardNameId;
      span.textContent = roleName;

      cardTxId.dataset.roleName = roleName || "";
      cardTxId.dataset.currentActive = obj.currentActive ? "1" : "0";
  
      cardTxId.appendChild(img);
      cardTxId.appendChild(span);
  
      cardTxId.style.display = "block";
      cardTxId.style.backgroundColor = obj.currentActive
        ? "rgba(0, 255, 0, 0.3)"
        : "rgba(0, 0, 0, 0.1)";
      syncSiteCardHighlight(cardTxId, roleName, obj.currentActive);
      if (obj.currentActive && !activeRoleName) {
        setActiveSiteSummaryDom(roleName, activeRoleSummary, "listRole currentActive new");
      }
  
      card0.appendChild(cardTxId);
    }
  }
  else if (obj.menuID == 'listTransmitter') {
    const index = Number(obj.index);
    if (!Number.isFinite(index) || index <= 0) return;

    const cardLabel = obj.stationName;
    const visible = isVisibleFlag(obj.visible);
    syncTransmitterOption(index, cardLabel, visible);
  }
  else if (obj.menuID == "view_update_Page") {
    updateActiveSiteFromSummary(obj);
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
