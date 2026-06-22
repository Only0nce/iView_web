// JavaScript Document
var wsUri;
var ws;
var current_tmp = 0;
var busy = false
var vswr = 0
var ampActive = 0;
var rssi = -130
let nIntervId;
var current_fwd_voltage = 0.00
var SNMP_NEW_ID = -1;
var SNMP_NEW_CARD_ID = "cardTxNew";
var currentID = SNMP_NEW_ID
var transmitterID = 0
var dBUnit = false
var SNMP_FORM_FIELD_IDS = ["deviceName", "snmpCommunity", "snmpPort", "pollInterval", "oid_freq", "oid_rssi", "oid_radiostatus", "oid_sqllevel"];
var snmpProfiles = {};


let snmpOrder = [];
let snmpProfilesByRealId = {};
let currentOidRealId = SNMP_NEW_ID;

function upsertSnmpOrder(realId, visible) {
    realId = Number(realId) || 0;
    if (realId < 0) return;

    const pos = snmpOrder.indexOf(realId);

    if (visible) {
        if (pos === -1)
            snmpOrder.push(realId);   // เพิ่มตามลำดับที่เข้ามา
    } else {
        if (pos !== -1)
            snmpOrder.splice(pos, 1); // ลบออกจากลำดับ
    }
}

function removeAllSnmpCards() {
    const card0 = document.getElementById("card0");
    if (!card0) return;

    const oldCards = card0.querySelectorAll('.cardTxTab[id^="cardTxId"]');
    oldCards.forEach(el => el.remove());
}

function renderAllSnmpCards() {
    removeAllSnmpCards();

    const card0 = document.getElementById("card0");
    if (!card0) return;

    for (let i = 0; i < snmpOrder.length; i++) {
        const realId = snmpOrder[i];
        const profile = snmpProfilesByRealId[realId];
        if (!profile) continue;

        const index = i + 1; // display index ใหม่ เริ่มจาก 1
        const cardTxName = "cardTxId" + index;
        const cardNameId = "cardNameId" + index;
        const cardLabel = profile.profileName || ("OID #" + index);
        const visible = isVisibleFlag(profile.visible);

        const cardTx = document.createElement("div");
        cardTx.className = "cardTxTab";
        cardTx.id = cardTxName;
        cardTx.style.display = visible ? "block" : "none";
        cardTx.style.backgroundColor =
            (currentOidRealId === realId)
                ? "rgba(0, 255, 0, 0.6)"
                : "rgba(0, 0, 0, 0.1)";

        cardTx.onclick = function () {
            setCurrentID(realId);
        };

        const img = document.createElement("img");
        img.className = "cardTxTabImage";
        img.src = "img/iView.png";
        img.alt = "SNMP profile";

        const span = document.createElement("span");
        span.className = "cardTxTabText3";
        span.id = cardNameId;
        span.innerHTML = cardLabel;

        cardTx.appendChild(img);
        cardTx.appendChild(span);
        card0.appendChild(cardTx);
    }
}

function parseBoolean(value, defaultValue) {
    if (value === undefined || value === null || value === "") return !!defaultValue;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    var str = String(value).trim().toLowerCase();
    if (str === "true" || str === "1" || str === "yes" || str === "on") return true;
    if (str === "false" || str === "0" || str === "no" || str === "off") return false;
    return !!defaultValue;
}

function isVisibleFlag(visibleValue) {
    return !(visibleValue === false || visibleValue === 0 || visibleValue === "0");
}

function getFieldValue(id) {
    var element = document.getElementById(id);
    return element ? String(element.value || "").trim() : "";
}

function setFieldValue(id, value) {
    var element = document.getElementById(id);
    if (element) element.value = value || "";
}

function collectCurrentSnmpForm() {
    var rxEnabledEl = document.getElementById("rxEnabled");
    var pollIntervalValue = parseInt(getFieldValue("pollInterval"), 10);
    return {
        id: (Number(currentID) === SNMP_NEW_ID) ? 0 : (Number(currentID) || 0),
        profileName: getFieldValue("deviceName"),
        ip: getFieldValue("receive_ipaddress") || getFieldValue("ipaddress"),
        hasRxRadio: rxEnabledEl ? !!rxEnabledEl.checked : true,
        snmpCommunity: getFieldValue("snmpCommunity") || "public",
        snmpPort: getFieldValue("snmpPort") || "161",
        pollInterval: (Number.isFinite(pollIntervalValue) && pollIntervalValue > 0) ? pollIntervalValue : 2000,
        oidFrequency: getFieldValue("oid_freq"),
        oidRSSI: getFieldValue("oid_rssi"),
        oidRadioStatus: getFieldValue("oid_radiostatus"),
        oidSQLLevel: getFieldValue("oid_sqllevel")
    };
}

function applySnmpProfileToForm(profile) {
    if (!profile) return;
    setFieldValue("deviceName", profile.profileName || "");
    setFieldValue("snmpCommunity", profile.snmpCommunity || "public");
    setFieldValue("snmpPort", profile.snmpPort || "161");
    setFieldValue("pollInterval", profile.pollInterval || "2000");
    setFieldValue("oid_freq", profile.oidFrequency || "");
    setFieldValue("oid_rssi", profile.oidRSSI || "");
    setFieldValue("oid_radiostatus", profile.oidRadioStatus || "");
    setFieldValue("oid_sqllevel", profile.oidSQLLevel || "");
}

function normalizePollInterval(value) {
    var parsed = parseInt(value, 10);
    return (Number.isFinite(parsed) && parsed > 0) ? parsed : 2000;
}

function buildSnmpSavePayload(profile, snmpID, menuIDOverride) {
    var resolvedID = Number(snmpID) || 0;
    var menuID = menuIDOverride || (resolvedID === 0 ? "addSNMP" : "updateSNMP");
    return {
        menuID: menuID,
        id: resolvedID,
        name: String(profile?.profileName || "").trim(),
        community: String(profile?.snmpCommunity || "").trim() || "public",
        port: String(profile?.snmpPort || "").trim() || "161",
        intervalMs: normalizePollInterval(profile?.pollInterval),
        oidFrequency: String(profile?.oidFrequency || "").trim(),
        oidRSSI: String(profile?.oidRSSI || "").trim(),
        oidRadioStatus: String(profile?.oidRadioStatus || "").trim(),
        oidSQLLevel: String(profile?.oidSQLLevel || "").trim()
    };
}

function canSaveSnmpProfile(profile) {
    return !!(profile && String(profile.profileName || "").trim() && String(profile.oidFrequency || "").trim());
}

function normalizeSnmpProfile(raw, fallbackId) {
    if (!raw || typeof raw !== "object") return null;

    var id = Number(raw.id ?? raw.snmpID ?? raw.snmpId ?? fallbackId ?? 0);
    if (!isFinite(id)) id = 0;

    var profile = {
        id: id,
        profileName: String(raw.profileName ?? raw.name ?? raw.deviceName ?? "").trim(),
        radioModel: String(raw.radioModel ?? raw.profileName ?? raw.name ?? raw.deviceName ?? "").trim(),
        ip: String(raw.ip ?? raw.ipAddress ?? raw.receive_ipaddress ?? "").trim(),
        hasRxRadio: parseBoolean(raw.hasRxRadio ?? raw.receive_enable, true),
        snmpCommunity: String(raw.snmpCommunity ?? raw.community ?? "").trim(),
        snmpPort: String(raw.snmpPort ?? raw.port ?? "").trim(),
        pollInterval: String(raw.pollInterval ?? raw.interval ?? raw.intervalMs ?? "").trim(),
        oidFrequency: String(raw.oidFrequency ?? raw.freq ?? raw.oid_freq ?? "").trim(),
        oidRSSI: String(raw.oidRSSI ?? raw.oidRssi ?? raw.rssi ?? raw.oid_rssi ?? "").trim(),
        oidRadioStatus: String(raw.oidRadioStatus ?? raw.oidStatus ?? raw.radioStatus ?? raw.oid_radiostatus ?? "").trim(),
        oidSQLLevel: String(raw.oidSQLLevel ?? raw.oidSqlLevel ?? raw.sqlLevel ?? raw.oid_sqllevel ?? "").trim(),
        visible: isVisibleFlag(raw.visible)
    };

    if (!profile.profileName &&
        !profile.oidFrequency &&
        !profile.oidRSSI &&
        !profile.oidRadioStatus &&
        !profile.oidSQLLevel) {
        return null;
    }

    return profile;
}

function toPortableSnmpJson(profile) {
    var port = parseInt(profile.snmpPort || "161", 10);
    if (!Number.isFinite(port)) port = 161;
    var intervalMs = parseInt(profile.pollInterval || "2000", 10);
    if (!Number.isFinite(intervalMs)) intervalMs = 2000;
    var name = profile.profileName || profile.radioModel || "";
    return {
        profileName: name,
        radioModel: profile.radioModel || name,
        hasRxRadio: parseBoolean(profile.hasRxRadio, true),
        ip: profile.ip || "",
        community: profile.snmpCommunity || "public",
        port: port,
        intervalMs: intervalMs,
        oidFrequency: profile.oidFrequency || "",
        oidRssi: profile.oidRSSI || "",
        oidStatus: profile.oidRadioStatus || "",
        oidSqlLevel: profile.oidSQLLevel || ""
    };
}

function getSnmpProfilesForExport() {
    return Object.keys(snmpProfiles)
        .map(function (idKey) { return Number(idKey); })
        .filter(function (id) { return id >= 0; })
        .sort(function (a, b) { return a - b; })
        .map(function (id) { return snmpProfiles[id]; })
        .filter(function (profile) { return !!profile; })
        .map(function (profile) { return toPortableSnmpJson(profile); });
}

function getExportFileTime() {
    var now = new Date();
    var pad = function (value) { return String(value).padStart(2, "0"); };
    return now.getFullYear() +
        pad(now.getMonth() + 1) +
        pad(now.getDate()) + "_" +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds());
}

function exportSnmpProfiles() {
    var profiles = getSnmpProfilesForExport();
    if (!profiles.length) {
        alert("No SNMP profile data to export.");
        return;
    }

    var payload = profiles;

    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);

    link.href = url;
    link.download = "snmp_profiles_" + getExportFileTime() + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function openSnmpImportFile() {
    var input = document.getElementById("snmpImportFile");
    if (!input) return;
    input.value = "";
    input.click();
}

function extractProfilesFromImportData(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.profiles)) return data.profiles;
    if (data && data.currentForm) return [data.currentForm];
    if (data && typeof data === "object") return [data];
    return [];
}

function importSnmpProfiles(event) {
    var input = event?.target;
    var file = input?.files?.[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (loadEvent) {
        try {
            var data = JSON.parse(String(loadEvent?.target?.result || ""));
            var rawProfiles = extractProfilesFromImportData(data);
            var profiles = rawProfiles
                .map(function (rawProfile, index) {
                    return normalizeSnmpProfile(rawProfile, index + 1);
                })
                .filter(function (profile) { return profile !== null; });

            if (!profiles.length) {
                alert("Import file has no valid SNMP profile.");
                return;
            }

            if (ws?.readyState !== 1) {
                alert("ERROR! Connection is closed...");
                return;
            }

            var profilesToAdd = profiles.filter(function (profile) {
                return canSaveSnmpProfile(profile);
            });

            if (!profilesToAdd.length) {
                alert("Import file has no profile that can be added (required: Device Name and OID Frequency).");
                return;
            }

            if (!confirm("Import " + profilesToAdd.length + " SNMP profile(s), Please confirm!")) {
                return;
            }

            profilesToAdd.forEach(function (profile) {
                var payload = buildSnmpSavePayload(profile, 0, "addSNMP");
                ws.send(JSON.stringify(payload));
            });

            setCurrentID(SNMP_NEW_ID);
            applySnmpProfileToForm(profilesToAdd[profilesToAdd.length - 1]);

            var skippedCount = profiles.length - profilesToAdd.length;
            var resultMessage = "Import complete. Added " + profilesToAdd.length + " profile(s).";
            if (skippedCount > 0) {
                resultMessage += " Skipped " + skippedCount + " invalid profile(s).";
            }
            alert(resultMessage);
        } catch (error) {
            alert("Import file format is invalid JSON.");
        } finally {
            if (input) input.value = "";
        }
    };

    reader.onerror = function () {
        alert("Cannot read import file.");
        if (input) input.value = "";
    };

    reader.readAsText(file);
}

WebSocketTest();
// window.onload = function(){
//  myCanvasfwd(0)
//  myCanvasrwd(0)
//  vswr = (vswr*1.0).toFixed(0)
//  animateResultCount(document.getElementById("fwd").innerHTML,0,document.getElementById("rwd").innerHTML,0)
// }
function WebSocketTest() {

    if ("WebSocket" in window) {
        // Let us open a web socket
        wsUri = "ws://" + location.host + ":1234";
        ws = new WebSocket(wsUri);

        ws.onopen = function () {
            // Web Socket is connected, send data using send()
            var newCardEl = document.getElementById(SNMP_NEW_CARD_ID);
            if (newCardEl) newCardEl.style.backgroundColor = "rgba(0, 255, 0, 0.6)"
            ws.send('{"menuID":"getOid"}');
            // myProgressCircle(50, 10, 0, 50, 0, 10, 0, -130);
        };

        ws.onmessage = function (evt) {
            var received_msg = evt.data;
            processMsg(received_msg);
        };

        ws.onclose = function () {
            // websocket is closed.
            alert("Connection is closed...");
        };
    } else {

        // The browser doesn't support WebSocket
        alert("WebSocket NOT supported by your Browser!");
    }


}
function loadHighVoltage() {
    document.getElementById("highPowerVolt").value = current_fwd_voltage
}

function loadLowVoltage() {
    document.getElementById("lowPowerVolt").value = current_fwd_voltage
}
function updateCal() {
    var calLowPower = document.getElementById("lowPowerWatt").value
    var calHighPower = document.getElementById("highPowerWatt").value
    var calLowVoltage = document.getElementById("lowPowerVolt").value
    var calHighVoltage = document.getElementById("highPowerVolt").value
    var calRwdOffset = document.getElementById("rwdPowerOffset").value

    if ((calHighPower > calLowPower) & (calHighVoltage > calLowVoltage)) {
        if (confirm("Start Calibration, Please confirm!") == true) {
            var jsonMessage = '{"menuID":"CalibrationEdit.ApplyCal", "transmitterID":' + transmitterID + ', "calLowPower":' + calLowPower + ', "calHighPower":' + calHighPower + ', "calLowVoltage":' + calLowVoltage + ', "calHighVoltage":' + calHighVoltage + ', "calRwdOffset":' + calRwdOffset + '}'
            if (ws.readyState == 1) {
                ws.send(jsonMessage);
            } else {
                alert("ERROR! Connection is closed...");
            }
        }
        else {
            document.getElementById("lowPowerWatt").value = ''
            document.getElementById("highPowerWatt").value = ''
            document.getElementById("lowPowerVolt").value = ''
            document.getElementById("highPowerVolt").value = ''
            document.getElementById("rwdPowerOffset").value = ''
        }
    }
}
function updateTrueLan() {
    var snmpID = Number(currentID);
    if (!Number.isFinite(snmpID)) snmpID = SNMP_NEW_ID;
    var menuID = (snmpID === SNMP_NEW_ID) ? "addSNMP" : "updateSNMP";

    var formProfile = collectCurrentSnmpForm();
    var profileName = formProfile.profileName;
    var oidFrequency = formProfile.oidFrequency;

    if (!profileName) { document.getElementById("deviceName").focus(); return; }
    if (!oidFrequency) { document.getElementById("oid_freq").focus(); return; }

    if (!confirm("Save SNMP Profile, Please confirm!")) {
        if (ws?.readyState === 1) ws.send('{"menuID":"getOid"}');
        else alert("ERROR! Connection is closed...");
        return;
    }

    var payload = buildSnmpSavePayload(formProfile, (snmpID === SNMP_NEW_ID ? 0 : snmpID), menuID);

    if (snmpID !== SNMP_NEW_ID) {
        var localProfile = normalizeSnmpProfile(payload, snmpID);
        if (localProfile) {
            snmpProfiles[snmpID] = localProfile;
            snmpProfilesByRealId[snmpID] = localProfile;
        }
    }

    var msgs = JSON.stringify(payload);

    if (ws?.readyState === 1) {
        ws.send(msgs);
        // console.log("msgs:::", msgs);
    } else {
        alert("ERROR! Connection is closed...");
    }
}
  
  function setCurrentID(newID) {
    var parsedID = Number(newID);
    if (!Number.isFinite(parsedID)) parsedID = SNMP_NEW_ID;
    currentID = parsedID;
    currentOidRealId = parsedID;
  
    // refresh รายการ OID ให้ทันสมัย (ไฟล์นี้ใช้ getOid)
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify({ menuID: "getOid" }));
    }
  
    const titleEl = document.getElementById("newtruelan");
    const saveBtn = document.getElementById("newtruelanbutton");
    const delBtn = document.getElementById("deletetruelanbutton");
    const card0 = document.getElementById(SNMP_NEW_CARD_ID);
  
    if (parsedID !== SNMP_NEW_ID) {
      // Edit mode
      titleEl && (titleEl.innerHTML = "Edit SNMP Profile");
      saveBtn && (saveBtn.innerHTML = "SAVE");
      card0 && (card0.style.backgroundColor = "rgba(0, 0, 0, 0.1)");
      delBtn && (delBtn.style.display = "block");
      var selectedProfile = snmpProfilesByRealId[parsedID] || snmpProfiles[parsedID];
      if (selectedProfile) applySnmpProfileToForm(selectedProfile);
    } else {
      // New mode + reset fields
      titleEl && (titleEl.innerHTML = "New SNMP Profile");
      saveBtn && (saveBtn.innerHTML = "NEW");
  
      SNMP_FORM_FIELD_IDS.forEach(id=>{
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

      setFieldValue("snmpCommunity", "public");
      setFieldValue("snmpPort", "161");
      setFieldValue("pollInterval", "2000");
  
      card0 && (card0.style.backgroundColor = "rgba(0, 255, 0, 0.6)");
      delBtn && (delBtn.style.display = "none");
    }

    renderAllSnmpCards();
  
    // console.log("newID", currentID);
  }
  
  function deleteTrueLan() {
    var snmpID = Number(currentID);
    if (!Number.isFinite(snmpID)) snmpID = SNMP_NEW_ID;
    if (snmpID === SNMP_NEW_ID) {
      alert("Please select SNMP Profile.");
      return;
    }

    // ลบโปรไฟล์ SNMP (สมมติเมนูเซิร์ฟเวอร์รองรับ deleteSNMP)
    if (!confirm("Remove SNMP Profile, Please confirm!")) {
      if (ws?.readyState === 1) ws.send('{"menuID":"getOid"}');
      else alert("ERROR! Connection is closed...");
      return;
    }
  
    var payload = { menuID: "removeSNMP", id: snmpID };
    var msgs = JSON.stringify(payload);
    if (ws?.readyState === 1) {
    //   console.log("removeSNMP::",msgs)
      ws.send(msgs);
    } else {
      alert("ERROR! Connection is closed...");
    }
  
    delete snmpProfiles[snmpID];
    delete snmpProfilesByRealId[snmpID];
    upsertSnmpOrder(snmpID, false);
    setCurrentID(SNMP_NEW_ID);
  }
  
function processMsg(message) {

    var obj = JSON.parse(message);
    // console.log(message)
    if (obj.menuID == "CTRLRSSI") {
        // rssi = obj.CTRLrssi
    }
    else if (obj.menuID == "SETMSQLLV") {
        // document.getElementById("sqlLevel").value = obj.SETMSqllv
    }
    else if (obj.menuID == "MCHSEL") {
        // document.getElementById("chSel").value = obj.MCHsel
    }
    else if (obj.menuID == "MCHRFPWR") {
        // document.getElementById("rfPower").value = obj.MCHrfpwr
    }
    else if (obj.menuID == "broadcastLocalTime") {
        // document.getElementById("currentTime").value = obj.currentTime;
        // document.getElementById("currentDate").value = obj.currentDate;
    }
    else if (obj.menuID == "listOidCommand") {
        const realId = Number(obj.id);
        const visible = isVisibleFlag(obj.visible);

        if (!Number.isFinite(realId) || realId < 0) {
            console.warn("listOidCommand: invalid realId =", obj.id);
            return;
        }

        // เก็บลำดับตามข้อมูลที่เข้ามา
        upsertSnmpOrder(realId, visible);

        // หา display index ใหม่จากลำดับปัจจุบัน
        const displayIndex = snmpOrder.indexOf(realId) + 1;

        const cardLabel = (obj.name ?? ("OID #" + displayIndex));

        const profileData = normalizeSnmpProfile({
            id: realId,
            realId: realId,
            profileName: cardLabel,
            radioModel: (obj.radioModel ?? cardLabel),
            ip: (obj.ip ?? ""),
            hasRxRadio: (obj.hasRxRadio ?? true),
            snmpCommunity: (obj.snmpCommunity ?? ""),
            snmpPort: (obj.snmpPort ?? ""),
            pollInterval: (obj.pollInterval ?? ""),
            oidFrequency: (obj.oidFrequency ?? ""),
            oidRSSI: (obj.oidRssi ?? ""),
            oidRadioStatus: (obj.oidStatus ?? ""),
            oidSQLLevel: (obj.oidSqlLevel ?? ""),
            visible: visible
        }, realId);

        if (profileData) {
            profileData.id = realId;
            profileData.realId = realId;
            profileData.visible = visible;
            snmpProfilesByRealId[realId] = profileData;
            snmpProfiles[realId] = profileData;
        }

        // ถ้าตัวที่เลือกอยู่โดนลบ ให้ reset
        if (!visible && currentOidRealId === realId) {
            setCurrentID(SNMP_NEW_ID);
            return;
        }

        if (visible && currentOidRealId === realId && profileData) {
            applySnmpProfileToForm(profileData);
        }

        renderAllSnmpCards();
    }
    else {
        console.debug("else << ",message);
    }
}
function setUnit(unit) {
    dBUnit = (unit == 1);
    if (dBUnit) {
        document.getElementById("unitWattActive").style = "left: calc(100% - 80px); background-color: #00968840;"
        document.getElementById("unitDBActive").style = "left: calc(100% - 160px); background-color: #009688FF;"
    }
    else {
        document.getElementById("unitWattActive").style = "left: calc(100% - 80px); background-color: #009688FF;"
        document.getElementById("unitDBActive").style = "left: calc(100% - 160px); background-color: #00968840;"
    }
}
function updateRFPwr() {
    var rfPower = document.getElementById("rfPower").value;
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
    var sqlLevelCmmd = document.getElementById("sqlLevel").value;
    var jsonMessage = '{"menuID":"SETMSQLLV", "sqlLevelCmmd":"' + sqlLevelCmmd + '"}';
    if (ws.readyState == 1) {
        ws.send(jsonMessage);
    } else {
        alert("ERROR! Connection is closed...");
    }
}
function updateCHSel() {
    var setMemChSel = document.getElementById("chSel").value;
    var jsonMessage = '{"menuID":"MCHSEL", "setMemChSel":"' + setMemChSel + '"}';
    if (ws.readyState == 1) {
        ws.send(jsonMessage);
    } else {
        alert("ERROR! Connection is closed...");
    }
}
function animateResultCount(numberfwd, targetfwd, numberrwd, targetrwd) {
    var maxFwd = 50
    var maxRwd = 0

    if (targetfwd > maxFwd)
        maxFwd = targetfwd
    maxRwd = maxFwd / 2
    var timeout = 20


    if (nIntervId == null) {
        var count1 = 0
        var count2 = 0
        if (!((numberfwd * 1).toFixed(0) == (targetfwd * 1).toFixed(0))) {
            // if (nIntervId)
            {
                nIntervId = setInterval(function () {
                    if ((numberfwd * 1).toFixed(0) == (targetfwd * 1).toFixed(0)) {
                        clearInterval(nIntervId);
                        nIntervId = null;
                        // console.log("clearInterval(interval)",nIntervId)
                        // return;
                    }
                    count1 = count1 + 1
                    if (count1 == timeout) {
                        targetfwd = numberfwd
                        // console.log(numberfwd, targetfwd)
                        clearInterval(nIntervId);
                        nIntervId = null;
                        // console.log("clearInterval(interval)",nIntervId)
                    }
                    numberfwd = document.getElementById("fwd").innerHTML;
                    numberrwd = document.getElementById("rwd").innerHTML;
                    myProgressCircle(document.getElementById("fwd").innerHTML, document.getElementById("rwd").innerHTML, 0, maxFwd, 0, maxRwd, vswr, rssi)
                    myProgressCircle(document.getElementById("fwd").innerHTML, document.getElementById("rwd").innerHTML, 0, maxFwd, 0, maxRwd, vswr, rssi)

                }, 50);
            }
        }



        //      if(!((numberrwd*1).toFixed(0) == (targetrwd*1).toFixed(0))) 
        //         {
        //          var interval = setInterval(function() {
        //              if ((numberrwd*1).toFixed(0) == (targetrwd*1).toFixed(0)) 
        //                 {
        //                  clearInterval(interval);
        //                  return;
        //              }
        //                 count2 = count2 + 1
        //                 if (count2 == timeout) {
        //                     targetrwd = numberrwd
        //                     console.log(targetrwd, numberrwd)
        //                 }


        // //               console.log("numberrwd")
        //          }, 50);
        //      }

        myProgressCircle(document.getElementById("fwd").innerHTML, document.getElementById("rwd").innerHTML, 0, maxFwd, 0, maxRwd, vswr, rssi)
    }
    else {
        // console.log("busy")
    }
}
function myCanvasfwd(fwd) {
    const options = {
        startVal: document.getElementById("fwd").innerHTML,
        decimalPlaces: 2,
        useGrouping: false,
        duration: 1
    };
    var c = new CountUp('fwd', fwd, options);
    c.start();
}
function myCanvasrwd(rwd) {
    const options = {
        startVal: document.getElementById("rwd").innerHTML,
        decimalPlaces: 2,
        useGrouping: false,
        duration: 1
    };
    var c = new CountUp('rwd', rwd, options)
    c.start();
}
function myProgressCircle(fwd, rwd, fwdMin, fwdMax, rwdMin, rwdMax, vswr_val, rssi_val) {
    var gradient
    var arcBegin = 0
    var arcEnd = 180
    var arcBgEnd = 360
    var size = 300
    var lineWidth = 2
    var x = size / 2
    var y = size / 2
    var start = Math.PI * (arcBegin / 180)
    var end = Math.PI * (arcEnd / 180)
    var end_bg = Math.PI * (arcBgEnd / 180)
    var start_bg = Math.PI * (arcBegin / 180)
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    var strvswr = "1:" + (vswr_val * 1.0).toFixed(2)

    ctx.clearRect(0, 0, size, size)
    // outline
    ctx.beginPath();
    ctx.arc(x, y, (size / 2) - lineWidth / 2, start_bg, end_bg, false);
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = "#ffffff"
    ctx.stroke();

    //Input Level
    arcBegin = 180 + 270
    if (fwd > fwdMax) fwd = fwdMax
    arcEnd = (((fwd - fwdMin) / (fwdMax - fwdMin)) * 180) + 90;
    if (arcEnd < 90)
        arcEnd = 90
    arcBgEnd = arcEnd
    size = 280
    lineWidth = 10
    x = size / 2
    y = size / 2
    start = Math.PI * (arcBegin / 180)
    end = Math.PI * (arcEnd / 180)

    //background
    ctx.beginPath();
    ctx.arc(x + lineWidth, y + lineWidth, (size / 2) - lineWidth / 2, start_bg, end_bg, false);
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = "gray"
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + lineWidth, y + lineWidth, (size / 2) - lineWidth / 2, start, end, false);
    ctx.lineWidth = lineWidth
    gradient = ctx.createLinearGradient(0, 0, size / 2, size)
    gradient.addColorStop(0, '#1DE9B6')
    gradient.addColorStop(0.3, '#1DE9B6')
    gradient.addColorStop(0.5, '#FFFF00')
    gradient.addColorStop(0.8, '#FF0000')
    gradient.addColorStop(1, '#FF0000')
    ctx.strokeStyle = gradient
    ctx.stroke();

    arcBegin = 180 + 90
    if (rwd > rwdMax) rwd = rwdMax
    arcEnd = (((rwd - rwdMin) / (rwdMax - rwdMin)) * 180) + 270;
    if (arcEnd < 270)
        arcEnd = 270
    start = Math.PI * (arcBegin / 180)
    end = Math.PI * (arcEnd / 180)

    ctx.beginPath();
    ctx.arc(x + lineWidth, y + lineWidth, (size / 2) - lineWidth / 2, start, end, false);
    ctx.lineWidth = lineWidth
    gradient = ctx.createLinearGradient(0, 0, size / 3, size)
    gradient.addColorStop(0, '#1DE9B6')
    gradient.addColorStop(0.4, '#FFFF00')
    gradient.addColorStop(0.6, '#FFFF00')
    gradient.addColorStop(0.8, '#FF0000')
    gradient.addColorStop(1, '#FF0000')
    ctx.strokeStyle = gradient
    ctx.stroke();

    // ctx.fillStyle = "#FA057E";
    // ctx.font = "60px sans-serif";
    // drawCenteredText(rssi_val, x, y + lineWidth);

    ctx.fillStyle = "#FA057E";
    ctx.font = "50px sans-serif";
    drawCenteredText(strvswr, x, y + lineWidth);

    ctx.fillStyle = "gray";
    ctx.font = "20px sans-serif";
    drawCenteredText("VSWR", x, y + lineWidth + 45);

    function drawCenteredText(text, centerX, centerY) {
        // save the unaltered context
        ctx.save();

        // approximate the font height
        var approxFontHeight = parseInt(ctx.font);

        // alter the context to center-align the text
        ctx.textAlign = "center";

        // draw the text centered at [centerX,centerY]
        ctx.fillText(text, centerX, centerY + approxFontHeight / 4);

    }

}
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
// playground: stackblitz.com/edit/countup-typescript
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
            // to ease or not to ease
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
            // don't go past endVal since progress can exceed duration in the last frame
            if (_this.countDown) {
                _this.frameVal = (_this.frameVal < _this.endVal) ? _this.endVal : _this.frameVal;
            }
            else {
                _this.frameVal = (_this.frameVal > _this.endVal) ? _this.endVal : _this.frameVal;
            }
            // decimal
            _this.frameVal = Math.round(_this.frameVal * _this.decimalMult) / _this.decimalMult;
            // format and print value
            _this.printValue(_this.frameVal);
            // whether to continue
            if (progress < _this.duration) {
                _this.rAF = requestAnimationFrame(_this.count);
            }
            else if (_this.finalEndVal !== null) {
                // smart easing
                _this.update(_this.finalEndVal);
            }
            else {
                if (_this.callback) {
                    _this.callback();
                }
            }
        };
        // default format and easing functions
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
            // optional numeral substitution
            if (_this.options.numerals && _this.options.numerals.length) {
                x1 = x1.replace(/[0-9]/g, function (w) { return _this.options.numerals[+w]; });
                x2 = x2.replace(/[0-9]/g, function (w) { return _this.options.numerals[+w]; });
            }
            return neg + _this.options.prefix + x1 + x2 + _this.options.suffix;
        };
        this.easeOutExpo = function (t, b, c, d) {
            return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
        };
        this.options = __assign({}, this.defaults, options);
        this.formattingFn = (this.options.formattingFn) ?
            this.options.formattingFn : this.formatNumber;
        this.easingFn = (this.options.easingFn) ?
            this.options.easingFn : this.easeOutExpo;
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
    // determines where easing starts and whether to count down or up
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
    // start animation
    CountUp.prototype.start = function (callback) {
        if (this.error) {
            return;
        }
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
    // pause/resume animation
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
    // reset to startVal so animation can be run again
    CountUp.prototype.reset = function () {
        cancelAnimationFrame(this.rAF);
        this.paused = true;
        this.resetDuration();
        this.startVal = this.validateValue(this.options.startVal);
        this.frameVal = this.startVal;
        this.printValue(this.startVal);
    };
    // pass a new endVal and start animation
    CountUp.prototype.update = function (newEndVal) {
        cancelAnimationFrame(this.rAF);
        this.startTime = null;
        this.endVal = this.validateValue(newEndVal);
        if (this.endVal === this.frameVal) {
            return;
        }
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
//export { CountUp };
