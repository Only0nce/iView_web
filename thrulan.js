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
var currentID = 0
var transmitterID = 0
var dBUnit = false
var pendingOidSelection = null // { value: string, type: "ui" | "real" } | null
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
            document.getElementById("cardTxId0").style.backgroundColor = "rgba(0, 255, 0, 0.6)"
            ws.send('{"menuID":"getOid"}');
            ws.send('{"menuID":"getThruLan"}');
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

function isVisibleOff(visible) {
    return visible === false || visible === 0 || visible === "0";
}

function setInputValueSafely(id, value) {
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

function clearTransmitterForm() {
    setInputValueSafely("deviceName", "");
    setInputValueSafely("peakPower", "");
    setInputValueSafely("deviceFrequency", "");
    setInputValueSafely("ipaddress", "");

    setInputValueSafely("alertRssi", "");
    setInputValueSafely("warningRssi", "");
    setInputValueSafely("alertVSWR", "");
    setInputValueSafely("warningVSWR", "");
    setInputValueSafely("alertFwdPowerWatt", "");
    setInputValueSafely("warningFwdPowerWatt", "");
    setInputValueSafely("receive_ipaddress", "");

    setCheckedSafely("rxEnabled", false);

    if (typeof updateRxEnabledStateLabel === "function") {
        updateRxEnabledStateLabel(false);
    }

    if (typeof selectOidSafely === "function") {
        selectOidSafely(0, "ui");
    }

    const warningRssiEl = document.getElementById("warningRssi");
    const alertRssiEl = document.getElementById("alertRssi");
    const ipEl = document.getElementById("receive_ipaddress");
    const dropdownBtn = document.getElementById("dropdown-oid-btn");

    if (typeof setDisabled === "function") {
        setDisabled(warningRssiEl, true);
        setDisabled(alertRssiEl, true);
        setDisabled(ipEl, true);
        setDisabled(dropdownBtn, true);
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

// ดึงค่า OID id ที่เลือกอยู่จากปุ่ม dropdown
function getSelectedOidId() {
    const btn = document.getElementById("dropdown-oid-btn");
    if (!btn) return 0;
    const v = parseInt(btn.dataset.id || "0", 10);
    return isNaN(v) ? 0 : v;
}


// แปลงตัวเลขแบบปลอดภัย
function num(v, def) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : def;
}

// ตรวจ IP แบบง่าย (ถ้ามีตัวตรวจอื่นอยู่แล้วจะใช้ของคุณก็ได้)
function isIp(ip) {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(String(ip).trim());
}


// ---------- REPLACE: updateTrueLan() ----------
function updateTrueLan() {
    // เลือกว่าจะเป็น add หรือ update
    var menuID = (currentID == 0) ? "addTransmitter" : "updateTransmitter";

    // เก็บสถานะ RX ก่อน (กัน state หลุดตอนรีเซ็ต)
    const rxEl = document.getElementById("rxEnabled");
    const wasRxEnabled = !!(rxEl && rxEl.checked);

    // อ่านค่าจากฟอร์ม (ซ้าย: Power Sensor / ขวา: Receiver)
    const name = (document.getElementById("deviceName")?.value || "").trim();
    const ipaddress = (document.getElementById("ipaddress")?.value || "").trim();
    const maxPower = num(document.getElementById("peakPower")?.value, 0);
    const frequency = num(document.getElementById("deviceFrequency")?.value, 0);

    const warningFwdPowerWatt = num(document.getElementById("warningFwdPowerWatt")?.value, 0);
    const alertFwdPowerWatt = num(document.getElementById("alertFwdPowerWatt")?.value, 0);
    const warningVSWR = num(document.getElementById("warningVSWR")?.value, 1.0);
    const alertVSWR = num(document.getElementById("alertVSWR")?.value, 1.0);

    const warningRssi = num(document.getElementById("warningRssi")?.value, -90);
    const alertRssi = num(document.getElementById("alertRssi")?.value, -90);
    const receive_ipaddress = (document.getElementById("receive_ipaddress")?.value || "").trim();
    const receive_enable = wasRxEnabled ? 1 : 0;

    // interval (ถ้าไม่มี slider ก็ใส่ default 1)
    const interval = num(document.getElementById("sliderInterval")?.value, 1);

    // OID ที่เลือกจาก dropdown (ปุ่ม)
    const oid = getSelectedOidId(); // 0 = ยังไม่เลือก

    // console.log("Form values:",oid , " oid",oid-1)
    // -------- validations แบบเดียวกับ QML/JS ที่ให้มา --------
    if (!name) {
        alert("Please input Power Sensor Name");
        document.getElementById("deviceName")?.focus();
        return;
    }
    if (!maxPower) {
        alert("Please input Max Power");
        document.getElementById("peakPower")?.focus();
        return;
    }
    if (!ipaddress) {
        alert("Please input Power Sensor IP Address");
        document.getElementById("ipaddress")?.focus();
        return;
    }
    if (!isIp(ipaddress)) {
        alert("Power Sensor IP Address is Invalid!");
        document.getElementById("ipaddress")?.focus();
        return;
    }

    // ตรวจฝั่ง Receiver เฉพาะตอน "update" และ RX เปิดอยู่
    if (menuID === "updateTransmitter" && receive_enable === 1) {
        if (!receive_ipaddress || !isIp(receive_ipaddress)) {
            alert("SNMP IP Address is Invalid!");
            document.getElementById("receive_ipaddress")?.focus();
            return;
        }
        if (oid <= 0) {
            alert("OID SNMP is Invalid!");
            // โฟกัสปุ่ม dropdown
            document.getElementById("dropdown-oid-btn")?.focus();
            return;
        }
    } else if (menuID === "addTransmitter") {
        // ตอน add: จะเปิด RX auto ถ้ามี ip SNMP (เลือกได้ตามต้องการ)
        if (receive_ipaddress && isIp(receive_ipaddress)) {
            // ถ้าอยากเปิดอัตโนมัติ: receive_enable = 1;
            // ถ้าอยากคงตามปุ่ม: ไม่ต้องทำอะไร
        }
    }

    var enabled_recv = receive_enable ? 1 : 0;
    // -------- สร้าง payload ให้ตรงกับฟอร์แมตที่ต้องการ --------
    const payload = {
        menuID,
        transmitterID: parseInt(currentID, 10) || 0,
        name,
        ipaddress,
        maxPower,
        frequency,

        warningFwdPowerWatt,
        warningVSWR,
        warningRssi,

        alertFwdPowerWatt,
        alertVSWR,
        alertRssi,

        receive_ipaddress,
        oid,                 // id ของ OID ที่เลือกใน dropdown (0=ยังไม่เลือก)
        interval,            // default: 1 ถ้าไม่มี slider
        receive_enable: enabled_recv       // 1/0 ตามสวิตช์
    };

    // ยืนยันก่อนส่ง
    if (!confirm("Update Device Info, Please confirm!")) {
        if (ws?.readyState === 1) ;
        else alert("ERROR! Connection is closed...");
        return;
    }

    var msgs = JSON.stringify(payload);
    // ส่ง
    if (ws?.readyState === 1) {
          ws.send(msgs);
        console.log("TX payload:", msgs);
    } else {
        alert("ERROR! Connection is closed...");
        return;
    }

    // -------- รีเซ็ตหลังบันทึก (สำหรับ add) --------
    if (menuID === "addTransmitter") {
        setCurrentID(0); // จะรีเซ็ตฟอร์มซ้าย และรีเซ็ตปุ่ม OID เป็น "Select OID"
        // คงสถานะสวิตช์ไว้ตามเดิมถ้าต้องการ
        const switchEl = document.getElementById("rxEnabled");
        if (switchEl) switchEl.checked = wasRxEnabled;
    }
}


function setCurrentID(newID) {
    const previousID = currentID;
    currentID = newID;

    // เปลี่ยนการ์ดแล้วให้ล้าง OID ที่เคยเลือกไว้ทันที
    if (previousID !== newID) {
      const dropdownBtn = document.getElementById("dropdown-oid-btn");
      if (dropdownBtn) {
        dropdownBtn.textContent = "Select Device";
        delete dropdownBtn.dataset.id;
        delete dropdownBtn.dataset.realId;
        delete dropdownBtn.dataset.name;
        delete dropdownBtn.dataset.freq;
        delete dropdownBtn.dataset.ipaddress;
        delete dropdownBtn.dataset.rssi;
      }
      if (typeof selectOidSafely === "function") {
        selectOidSafely(0);
      }
    }
  
    // refresh ข้อมูลฝั่ง THRULAN
    if (ws?.readyState === 1) {
      ws.send(JSON.stringify({ menuID: "getThruLan" }));
    }
  
    const titleEl = document.getElementById("newtruelan");
    const saveBtn = document.getElementById("newtruelanbutton");
    const delBtn  = document.getElementById("deletetruelanbutton");
    const card0   = document.getElementById("cardTxId0");
  
    if (newID !== 0) {
      // --- Edit mode ---
      titleEl && (titleEl.innerHTML = "Edit Power Sensor");
      saveBtn && (saveBtn.innerHTML = "UPDATE");
      card0   && (card0.style.backgroundColor = "rgba(0, 0, 0, 0.1)");
      delBtn  && (delBtn.style.display = "block");
    } else {
      // --- New mode + RESET ทุกค่า ---
      titleEl && (titleEl.innerHTML = "New Power Sensor");
      saveBtn && (saveBtn.innerHTML = "NEW");
      card0   && (card0.style.backgroundColor = "rgba(0, 255, 0, 0.6)");
      delBtn  && (delBtn.style.display = "none");
  
      // 1) เคลียร์ช่องกรอกฝั่ง TX (Power Sensor)
      const toClear = [
        "deviceName", "ipaddress", "deviceFrequency", "peakPower",
        "warningFwdPowerWatt", "alertFwdPowerWatt"
      ];
      toClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
  
      // 2) รีเซ็ตค่า VSWR/RSSI warning/alert
      const warningV = document.getElementById("warningVSWR");
      const alertV   = document.getElementById("alertVSWR");
      if (warningV) warningV.value = 1.1;
      if (alertV)   alertV.value   = 1.1;
  
      const warningR = document.getElementById("warningRssi");
      const alertR   = document.getElementById("alertRssi");
      if (warningR) warningR.value = "";
      if (alertR)   alertR.value   = "";
  
      // 3) เคลียร์ฝั่ง RX (SNMP)
      const rxIp = document.getElementById("receive_ipaddress");
      if (rxIp) rxIp.value = "";
  
      // ปิดการใช้งาน RX และบังคับ sync สถานะ disabled ของฟิลด์ที่เกี่ยวข้อง
      const rxEnabled = document.getElementById("rxEnabled");
      if (rxEnabled) {
        rxEnabled.checked = false;               // ปิดสวิตช์
        rxEnabled.dispatchEvent(new Event("change")); // ให้ handler ไป disable ฟิลด์ต่างๆ
      }
  
      // 4) รีเซ็ต Dropdown OID ให้กลับเป็นค่าเริ่มต้น
      const dropdownBtn = document.getElementById("dropdown-oid-btn");
      if (dropdownBtn) {
        dropdownBtn.textContent = "Select Device";
        // ล้าง data-* เผื่อมีการเก็บค่าไว้
        delete dropdownBtn.dataset.id;
        delete dropdownBtn.dataset.realId;
        delete dropdownBtn.dataset.name;
        delete dropdownBtn.dataset.freq;
        delete dropdownBtn.dataset.ipaddress;
        delete dropdownBtn.dataset.rssi;
      }
  
      // ถ้ามี helper ที่ทำงานกับทั้ง <a> และ <select> ให้เรียกเพื่อตั้งค่า default ด้วย
      if (typeof selectOidSafely === "function") {
        // พยายามเลือก oid=0; ถ้าไม่มีจะ fallback เป็น "Select OID"
        selectOidSafely(0);
      }
    }
  
    // console.log("newID", currentID);
  }
  

function deleteTrueLan() {
    if (confirm("Remove THRULAN, Please confirm!") == true) {
        var jsonMessage = '{"menuID":"removeTransmitter", "id":' + currentID + '}';
        if (ws.readyState == 1) {
            ws.send(jsonMessage);
        } else {
            alert("ERROR! Connection is closed...");
        }
    }
    else {
        if (ws.readyState == 1) {
            ws.send('{"menuID":"getThruLan"}');
        } else {
            alert("ERROR! Connection is closed...");
        }
    }
    setCurrentID(0);
}

function processMsg(message) {

    var obj = JSON.parse(message);
    // console.log(message)
    if (obj.menuID == "CTRLRSSI") {
        rssi = obj.CTRLrssi
    }
    else if (obj.menuID == "SETMSQLLV") {
        document.getElementById("sqlLevel").value = obj.SETMSqllv
    }
    else if (obj.menuID == "MCHSEL") {
        document.getElementById("chSel").value = obj.MCHsel
    }
    else if (obj.menuID == "MCHRFPWR") {
        document.getElementById("rfPower").value = obj.MCHrfpwr
    }
    else if (obj.menuID == "broadcastLocalTime") {
        // document.getElementById("currentTime").value = obj.currentTime;
        // document.getElementById("currentDate").value = obj.currentDate;
    }
    else if (obj.menuID == "listOidCommand") {
        // ตัวอย่าง obj:
        // {
        //   "freq": "onlyone",
        //   "id": 3,
        //   "menuID": "listOidCommand",
        //   "name": "Only",
        //   "rssi": "sunday",
        //   "visible": 1
        // }

        // อัปเดต/เพิ่ม anchor ใน dropdown
        upsertOidAnchor({
            id: obj.id,
            name: obj.name,
            freq: obj.freq,
            ipAddress: obj.ipAddress, // ถ้า server ไม่ส่งมาก็จะเป็น undefined
            rssi: obj.rssi,
            visible: obj.visible
        });

        // ถ้าเคยรอเลือก OID ไว้ ให้ลอง select ซ้ำเมื่อรายการกำลังทยอยมา
        const hadPendingSelection = !!(pendingOidSelection && pendingOidSelection.value);
        if (hadPendingSelection) {
            selectOidSafely(pendingOidSelection.value, pendingOidSelection.type);
        }

        // auto-select ครั้งแรกถ้ายังไม่ได้เลือกอะไร
        const ui = ensureOidDropdown();
        const isDefaultLabel = ui && (ui.btnEl.textContent === "Select OID" || ui.btnEl.textContent === "Select Device");
        if (!hadPendingSelection && isDefaultLabel && (obj.visible === 1 || obj.visible === true || obj.visible === "1")) {
            // listOidCommand.id คือ OID จริงจาก backend
            selectOidSafely(obj.id, "real");
        }
    }
    else if (obj.menuID == 'listTransmitter') {
        // console.log("listTransmitter::", obj);
    
        var index = obj.index;
        var cardTxName = "cardTxId" + index;
        var cardLabel = obj.stationName;
        var cardNameId = "cardNameId" + index;
        var peakPower = obj.maxFwdPowerWatt;
        var deviceFrequency = obj.frequency;
        var ipaddress = obj.ipAddress;
        var visible = obj.visible;
    
        var oid = obj.oid;
        var receive_enable = obj.receive_enable;
        var receive_ipaddress = obj.receive_ipaddress;
        var alertRssi = obj.alertRssi;
        var warningRssi = obj.warningRssi;
        var alertVSWR = obj.alertVSWR;
        var warningVSWR = obj.warningVSWR;
        var alertFwdPowerWatt = obj.alertFwdPowerWatt;
        var warningFwdPowerWatt = obj.warningFwdPowerWatt;
    
        var elementExists = document.getElementById(cardTxName);
    
        /*
         * Important:
         * If backend sends visible = false / 0 / "0",
         * remove the card from DOM completely.
         * Do not only hide it, because hidden cards can still keep old selected state.
         */
        if (isVisibleOff(visible)) {
            if (elementExists) {
                elementExists.remove();
            }
    
            /*
             * If removed transmitter is currently selected,
             * clear selected state and clear form data.
             */
            if (currentID == index) {
                currentID = 0;
                clearTransmitterForm();
            }
    
            return;
        }
    
        /*
         * Case 1:
         * Card already exists, update its data.
         */
        if (typeof (elementExists) != 'undefined' && elementExists != null) {
            // console.log("Updating existing card for transmitter index:", index);
    
            if (currentID == index) {
                elementExists.style.backgroundColor = "rgba(0, 255, 0, 0.6)";
    
                setInputValueSafely("deviceName", cardLabel);
                setInputValueSafely("peakPower", peakPower);
                setInputValueSafely("deviceFrequency", deviceFrequency);
                setInputValueSafely("ipaddress", ipaddress);
    
                setInputValueSafely("alertRssi", alertRssi);
                setInputValueSafely("warningRssi", warningRssi);
                setInputValueSafely("alertVSWR", alertVSWR);
                setInputValueSafely("warningVSWR", warningVSWR);
                setInputValueSafely("alertFwdPowerWatt", alertFwdPowerWatt);
                setInputValueSafely("warningFwdPowerWatt", warningFwdPowerWatt);
                setInputValueSafely("receive_ipaddress", receive_ipaddress);
    
                setCheckedSafely("rxEnabled", receive_enable == 1 ? true : false);
    
                if (typeof updateRxEnabledStateLabel === "function") {
                    updateRxEnabledStateLabel(receive_enable == 1);
                }
    
                /*
                 * listTransmitter.oid คือเลข OID แบบลำดับใน UI
                 */
                if (typeof selectOidSafely === "function") {
                    selectOidSafely(oid, "ui");
                }
    
                const disabled = receive_enable == 0;
    
                const warningRssiEl = document.getElementById("warningRssi");
                const alertRssiEl = document.getElementById("alertRssi");
                const ipEl = document.getElementById("receive_ipaddress");
                const dropdownBtn = document.getElementById("dropdown-oid-btn");
    
                if (typeof setDisabled === "function") {
                    setDisabled(warningRssiEl, disabled);
                    setDisabled(alertRssiEl, disabled);
                    setDisabled(ipEl, disabled);
                    setDisabled(dropdownBtn, disabled);
                }
            }
            else {
                elementExists.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
            }
    
            const cardNameEl = document.getElementById(cardNameId);
            if (cardNameEl) {
                cardNameEl.innerHTML = cardLabel;
            }
    
            elementExists.style.display = "block";
        }
    
        /*
         * Case 2:
         * Card does not exist, create new card.
         */
        else {
            const card0 = document.getElementById("card0");
    
            if (!card0) {
                console.warn("card0 container not found");
                return;
            }
    
            const cardTxId = document.createElement('div');
            cardTxId.className = 'cardTxTab';
            cardTxId.id = cardTxName;
            cardTxId.setAttribute("onclick", "setCurrentID(" + index + ");");
    
            const img = document.createElement('img');
            img.className = 'cardTxTabImage';
            img.src = "/img/Thrulan.png";
            img.alt = "Transmitter";
    
            const label = document.createElement('span');
            label.className = 'cardTxTabText3';
            label.id = cardNameId;
            label.innerHTML = cardLabel;
    
            cardTxId.appendChild(img);
            cardTxId.appendChild(label);
    
            cardTxId.style.display = "block";
    
            if (currentID == index) {
                cardTxId.style.backgroundColor = "rgba(0, 255, 0, 0.6)";
            }
            else {
                cardTxId.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
            }
    
            card0.appendChild(cardTxId);
        }
    }
    else if (obj.menuID == "view_transmitter_list") {

    }
    // {
    //    var id = (obj.databaseId*1.0).toFixed(0)
    //    var showSize = obj.listSize
    //    var deviceName = "cardNameId" + id
    //    var deviceFreq = "cardFreqId" + id
    //    var card2= "cardDisconn" + id

    //    var stationName  = obj.stationName
    //    var freq =  (obj.frequency/1e6).toFixed(4) + " MHz";
    //    var connectionStatus = obj.connectionStatus == 1

    //    document.getElementById(deviceName).innerHTML = stationName;
    //    document.getElementById(deviceFreq).innerHTML = freq;

    //    for (var i = 1; i <= 12; i= i+1 )
    //    {
    //        var card = "cardTxId" + i        

    //        if (i <= showSize)
    //        {
    //            document.getElementById(card).style.display = "block";

    //        }
    //        else
    //        {
    //            document.getElementById(card).style.display = "none"; 
    //        }

    //        if (i == currentID)
    //        {
    //            document.getElementById(card).style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    //        }
    //        else
    //        {
    //            document.getElementById(card).style.backgroundColor = "rgba(0, 0, 0, 0.1)";
    //        }

    //    }

    //    if (connectionStatus) 
    //    {
    //        document.getElementById(card2).style.display = "none";
    //    }
    //    else
    //    {
    //        document.getElementById(card2).style.display = "block";
    //    }

    //    if (id == currentID)
    //    {
    //        var swrmax = 5
    //        var stationName  = obj.stationName
    //        var freq =  (obj.frequency/1e6).toFixed(4) + " MHz";
    //        var fwd = (obj.fwdPowerWatt/1.0).toFixed(2)
    //        var fwd_dB = (obj.fwdPowerDB/1.0).toFixed(2)
    //        var rwd_dB = (obj.rwdPowerDB/1.0).toFixed(2)
    //        var fwdmax = (obj.maxFwdPowerWatt/1.0).toFixed(2)
    //        if (fwdmax == 0) fwdmax = 50
    //        var rwd = (obj.rwdPowerWatt/1.0).toFixed(2)
    //        var rwdmax = (fwdmax/2.0).toFixed(2)
    //        var swr = (obj.vswr*1.0).toFixed(3)
    //        var visible = obj.visible == 1
    //        transmitterID = obj.radioID


    //        var fwdVoltage = obj.fwdVoltage
    //        var rwdVoltage = obj.rwdVoltage

    //        current_fwd_voltage = fwdVoltage


    //        var barLevelFwdElementById = "barFwdLevel"
    //        var barLevelRwdElementById = "barRwdLevel"
    //        var barLevelSwrElementById = "barVswrLevel"
    //        var fwdValue = "fwdValue"
    //        var rwdValue = "rwdValue"
    //        var swrValue = "swrValue"
    //        var title = "title"
    //        var currentCard = "card"
    //        var cardDisconnect = "cardDisconnect"

    //        var vfwdValue = "vfwdValue"
    //        var vrwdValue = "vrwdValue"

    //        var barVFwdLevel = "barVFwdLevel"
    //        var barVRwdLevel = "barVRwdLevel"


    //        if (fwd > fwdmax) fwdmax = fwd;
    //        if (rwd > rwdmax) rwdmax = rwd;
    //        if (swr > swrmax) swrmax = swr;

    //        // console.log(document.getElementById("highPowerVolt").value)

    //        if (document.getElementById("highPowerVolt").value == '')
    //        {
    //            document.getElementById("highPowerVolt").value = obj.calHighVoltage
    //        }

    //        if (document.getElementById("highPowerWatt").value == '')
    //        {
    //            document.getElementById("highPowerWatt").value = obj.calHighPower
    //        }

    //        if (document.getElementById("lowPowerVolt").value == '')
    //        {
    //            document.getElementById("lowPowerVolt").value = obj.calLowVoltage
    //        }

    //        if (document.getElementById("lowPowerWatt").value == '')
    //        {
    //            document.getElementById("lowPowerWatt").value = obj.calLowPower
    //        }

    //        if (document.getElementById("rwdPowerOffset").value == '')
    //        {
    //            document.getElementById("rwdPowerOffset").value = obj.calRwdOffset
    //        }







    //    // console.log(fwdVoltage,rwdVoltage)

    //        // console.log(barLevelFwdElementById,barLevelRwdElementById,barLevelSwrElementById)


    //        if (connectionStatus) 
    //        {
    //            document.getElementById("cardDisconnect").style.display = "none"; 
    //            document.getElementById("cardDisconnect1").style.display = "none"; 
    //            document.getElementById("cardDisconnect2").style.display = "none"; 
    //            document.getElementById("cardDisconnect3").style.display = "none"; 
    //            document.getElementById(barLevelFwdElementById).style.width = ((fwd*100)/fwdmax) + "%";
    //            document.getElementById(barLevelRwdElementById).style.width = ((rwd*100)/rwdmax) + "%";
    //            document.getElementById(barLevelSwrElementById).style.width = ((swr*100)/swrmax) + "%";

    //            document.getElementById(barVFwdLevel).style.width = ((fwdVoltage*100)/4.095).toFixed(3) + "%";
    //            document.getElementById(barVRwdLevel).style.width = ((rwdVoltage*100)/4.095).toFixed(3) + "%";

    //            if(swr >= 1.5)
    //            {
    //               document.getElementById(barLevelSwrElementById).style.background = "#FF0000"; 
    //               document.getElementById(barLevelRwdElementById).style.background = "#FF0000"; 
    //            }
    //            else if(swr >= 1.2)
    //            {
    //               document.getElementById(barLevelSwrElementById).style.background = "#FFFF00"; 
    //               document.getElementById(barLevelRwdElementById).style.background = "#FFFF00"; 
    //            }
    //            else
    //            {
    //                document.getElementById(barLevelSwrElementById).style.background = "#00FF00";    
    //                document.getElementById(barLevelRwdElementById).style.background = "#00FF00";    
    //            }

    //            if(fwd/fwdmax >= 0.9)
    //            {
    //               document.getElementById(barLevelFwdElementById).style.background = "#FF0000"; 
    //            }
    //            else if(fwd/fwdmax >= 0.8)
    //            {
    //               document.getElementById(barLevelFwdElementById).style.background = "#FFFF00"; 
    //            }
    //            else
    //            {
    //                document.getElementById(barLevelFwdElementById).style.background = "#00FF00";    
    //            }

    //            document.getElementById(vfwdValue).innerHTML = fwdVoltage.toFixed(3) + " Volt";
    //            document.getElementById(vrwdValue).innerHTML = rwdVoltage.toFixed(3) + " Volt";

    //            if (dBUnit == false){
    //                document.getElementById(fwdValue).innerHTML = fwd + " W";
    //                document.getElementById(rwdValue).innerHTML = rwd + " W";
    //            }
    //            else
    //            {
    //                document.getElementById(fwdValue).innerHTML = fwd_dB + " dBm";
    //                document.getElementById(rwdValue).innerHTML = rwd_dB + " dBm";
    //            }
    //            document.getElementById(swrValue).innerHTML = swr;
    //            document.getElementById(title).innerHTML = stationName + " " + freq;        
    //        }
    //        else
    //        {
    //            document.getElementById(cardDisconnect).style.display = "block"; 

    //        }
    //    }
    // }
    else if (obj.menuID == "update") {
        var updateStatus = obj.updateStatus;
        if (updateStatus == 2) {
            alert("System updated, Please restart your system.");
        }
    }
    else if (obj.menuID == "listRole") {



    }
    else {
        console.debug(message);
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


// ===== OID dropdown helpers (for #dropdown-oid) =====
function ensureOidDropdown() {
    const listEl = document.getElementById("dropdown-oid");
    const btnEl = document.getElementById("dropdown-oid-btn");
    return (listEl && btnEl) ? { listEl, btnEl } : null;
}

function normalizeOidId(value) {
    if (value === undefined || value === null || value === "") return "";
    var n = Number(value);
    return Number.isFinite(n) ? String(n) : String(value).trim();
}

function normalizeOidType(type) {
    return type === "real" ? "real" : "ui";
}

function createPendingOidSelection(value, type) {
    const normalizedValue = normalizeOidId(value);
    if (normalizedValue === "" || normalizedValue === "0") return null;
    return {
        value: normalizedValue,
        type: normalizeOidType(type)
    };
}

function findOidAnchorByRealId(realId) {
    const ui = ensureOidDropdown();
    if (!ui) return null;
    const target = normalizeOidId(realId);
    if (!target) return null;

    const anchors = ui.listEl.querySelectorAll("a[data-real-id], a[data-id]");
    for (const a of anchors) {
        if (normalizeOidId(a.dataset.realId) === target) return a;
    }
    return null;
}

function findOidAnchorByUiId(id) {
    const ui = ensureOidDropdown();
    if (!ui) return null;
    const target = normalizeOidId(id);
    if (!target) return null;

    const anchors = ui.listEl.querySelectorAll("a[data-id]");
    for (const a of anchors) {
        if (normalizeOidId(a.dataset.id) === target) return a;
    }
    return null;
}

// backward-compatible alias (แยกความหมายจริงแล้ว: ID = ลำดับใน UI)
function findOidAnchorById(id) {
    return findOidAnchorByUiId(id);
}

function renumberOidAnchors() {
    const ui = ensureOidDropdown();
    if (!ui) return;
    const anchors = ui.listEl.querySelectorAll("a");
    let idx = 1;
    anchors.forEach((a) => {
        a.dataset.id = String(idx++);
    });

    const selectedRealId = normalizeOidId(ui.btnEl.dataset.realId);
    if (!selectedRealId) return;

    const selectedAnchor = findOidAnchorByRealId(selectedRealId);
    if (selectedAnchor) {
        ui.btnEl.dataset.id = selectedAnchor.dataset.id || ui.btnEl.dataset.id || "0";
    }
}

// แปะค่าที่เลือกลงปุ่ม + เก็บไว้ใน dataset ของปุ่ม
function applyOidSelection(data) {
    const ui = ensureOidDropdown();
    if (!ui) return;
    const uiId = normalizeOidId(data.id) || "0";
    const realId = normalizeOidId(data.realId ?? data.id) || "0";
    ui.btnEl.textContent = data.name || ("OID #" + uiId);
    ui.btnEl.dataset.id = uiId;
    ui.btnEl.dataset.realId = realId;
    ui.btnEl.dataset.name = data.name || "";
    ui.btnEl.dataset.freq = data.freq || "";
    ui.btnEl.dataset.ipaddress = data.ipAddress || "";
    ui.btnEl.dataset.rssi = data.rssi || "";
    pendingOidSelection = null;
}

/**
 * สร้าง/อัปเดตรายการ <a> ภายใต้ #dropdown-oid
 * obj = { id, name, freq, ipAddress, rssi, visible }
 */
// function upsertOidAnchor(obj) {
//     const ui = ensureOidDropdown();
//     if (!ui) return; // ถ้า HTML ยังไม่มี ให้ไปเช็คที่ไฟล์ .php ตามหัวข้อ #1

//     const { listEl } = ui;
//     // หา anchor เดิมจาก data-id
//     let a = listEl.querySelector(`a[data-id="${obj.id}"]`);

//     // visible 0/false → ลบทิ้งถ้ามี แล้วจบ
//     const isVisible = obj.visible === 1 || obj.visible === true || obj.visible === "1";
//     if (!isVisible) {
//         if (a) a.remove();
//         return;
//     }

//     // สร้างใหม่ถ้ายังไม่มี
//     if (!a) {
//         a = document.createElement("a");
//         a.href = "#";
//         a.dataset.id = String(obj.id);
//         listEl.appendChild(a);

//         // คลิกแล้ว apply เข้าฟอร์ม
//         a.addEventListener("click", function (e) {
//             e.preventDefault();
//             applyOidSelection({
//                 id: Number(this.dataset.id),
//                 name: this.dataset.name || "",
//                 freq: this.dataset.freq || "",
//                 ipAddress: this.dataset.ipaddress || "",
//                 rssi: this.dataset.rssi || ""
//             });
//         });
//     }

//     // อัปเดต label + dataset
//     a.textContent = obj.name || ("OID #" + obj.id);
//     a.dataset.name = obj.name || "";
//     a.dataset.freq = obj.freq || "";
//     a.dataset.ipaddress = obj.ipAddress || "";
//     a.dataset.rssi = obj.rssi || "";
// }

// const rxEnabled = document.getElementById('rxEnabled');
// console.log('enabled?', rxEnabled.checked);
// rxEnabled.addEventListener('change', () => {
//     // ส่งค่าไป server หรือปรับ UI
// });

function selectOidById(id) {
    const a = findOidAnchorByUiId(id);
    if (!a) return false;
    applyOidSelection({
        id: Number(a.dataset.id),
        realId: Number(a.dataset.realId || a.dataset.id),
        name: a.dataset.name || a.textContent || "",
        freq: a.dataset.freq || "",
        ipAddress: a.dataset.ipaddress || "",
        rssi: a.dataset.rssi || ""
    });
    return true;
}


function selectOidSafely(oid, oidType) {
    const resolvedOidType = normalizeOidType(oidType);
    const list = document.getElementById("dropdown-oid");
    // console.log("[OID] selectOidSafely called", { oid, oidType: resolvedOidType });
    if (!list) {
        console.debug("[OID] selectOidSafely: #dropdown-oid not found", { oid, oidType: resolvedOidType });
        return false;
    }
    const normalizedOid = normalizeOidId(oid);
    const debugBase = {
        oid,
        oidType: resolvedOidType,
        normalizedOid,
        pendingOidSelection,
        listTag: list.tagName,
        listChildCount: list.children ? list.children.length : 0
    };
    // console.log("[OID] selectOidSafely:start", debugBase);
    if (normalizedOid === "" || normalizedOid === "0") {
        console.debug("[OID] selectOidSafely:skip invalid/default oid", debugBase);
        pendingOidSelection = null;
        return false;
    }

    // กรณี custom dropdown: <div id="dropdown-oid"><a data-id="...">...</a></div>
    const a = (resolvedOidType === "real")
        ? findOidAnchorByRealId(normalizedOid)
        : findOidAnchorByUiId(normalizedOid);
    if (a) {
        console.debug("[OID] selectOidSafely:anchor found -> dispatch click", {
            ...debugBase,
            anchorDatasetId: a.dataset.id || null,
            anchorDatasetRealId: a.dataset.realId || null,
            anchorName: a.dataset.name || a.textContent || ""
        });
        pendingOidSelection = null;
        a.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }));
        return true;
    }

    // กรณีเป็น <select id="dropdown-oid"> (ถ้าคุณเปลี่ยนภายหลัง)
    if (list.tagName === "SELECT") {
        const options = Array.from(list.options);
        const matchedOption = options.find((o) => {
            if (resolvedOidType === "real") {
                return normalizeOidId(o.dataset.realId) === normalizedOid
                    || normalizeOidId(o.value) === normalizedOid;
            }
            return normalizeOidId(o.value) === normalizedOid;
        });
        const has = !!matchedOption;
        list.value = has ? matchedOption.value : (list.querySelector('option[value="0"]') ? "0" : "");
        list.dispatchEvent(new Event("change", { bubbles: true }));
        pendingOidSelection = has ? null : createPendingOidSelection(normalizedOid, resolvedOidType);
        console.debug("[OID] selectOidSafely:select branch", {
            ...debugBase,
            has,
            selectedValue: list.value,
            nextPendingOidSelection: pendingOidSelection
        });
        return has;
    }

    // ยังไม่เจอรายการ OID ณ ตอนนี้ ให้รอ listOidCommand รอบถัดไป
    pendingOidSelection = createPendingOidSelection(normalizedOid, resolvedOidType);
    console.debug("[OID] selectOidSafely:anchor not found -> set pending", {
        ...debugBase,
        nextPendingOidSelection: pendingOidSelection
    });
    return false;
}


function toggleDropdown() {
    document.getElementById("dropdown-oid").classList.toggle("show");
}

// เวลาคลิกรายการ → ซ่อน dropdown
function attachOidClickHandler(a) {
    a.addEventListener("click", function (e) {
        e.preventDefault();

        applyOidSelection({
            id: Number(this.dataset.id || 0),
            realId: Number(this.dataset.realId || this.dataset.id || 0),
            name: this.dataset.name || this.textContent || "",
            freq: this.dataset.freq || "",
            ipAddress: this.dataset.ipaddress || "",
            rssi: this.dataset.rssi || ""
        });
        pendingOidSelection = null;

        // ซ่อน dropdown
        document.getElementById("dropdown-oid").classList.remove("show");
    });
}

// ตัวอย่างใช้ใน upsertOidAnchor
function upsertOidAnchor(obj) {
    const list = document.getElementById("dropdown-oid");
    if (!list) return;
    const normalizedRealId = normalizeOidId(obj.id);
    const isVisible = (obj.visible === undefined || obj.visible === 1 || obj.visible === true || obj.visible === "1");

    let a = findOidAnchorByRealId(normalizedRealId);
    if (!isVisible) {
        if (a) {
            a.remove();
            renumberOidAnchors();
        }
        return;
    }

    if (!a) {
        a = document.createElement("a");
        a.href = "#";
        a.dataset.realId = normalizedRealId;
        list.appendChild(a);

        // ใช้ handler ที่ซ่อน dropdown ด้วย
        attachOidClickHandler(a);
    }
    a.dataset.realId = normalizedRealId;
    a.textContent = obj.name || ("OID #" + (a.dataset.id || ""));
    a.dataset.name = obj.name || "";
    a.dataset.freq = obj.freq || "";
    a.dataset.ipaddress = obj.ipAddress || "";
    a.dataset.rssi = obj.rssi || "";
    renumberOidAnchors();
    if (!obj.name) {
        a.textContent = "OID #" + (a.dataset.id || "");
    }
}

function myFunction() {
    document.getElementById("dropdown-oid").classList.toggle("show");
}


// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}


// เรียกหลัง DOM พร้อม
document.addEventListener("DOMContentLoaded", bindRxEnabled);

function bindRxEnabled() {
    const el = document.getElementById("rxEnabled");
    if (!el) {
        console.warn("rxEnabled not found yet");
        return;
    }
    if (el.dataset.bound === "1") return; // กันผูกซ้ำ

    const handler = function () {
        const state = this.checked ? 1 : 0;
        const disabled = state === 0; // 0=ปิดการใช้งาน, 1=เปิดใช้งาน
        updateRxEnabledStateLabel(state === 1);

        // element ที่ต้องควบคุม
        const warningRssiEl = document.getElementById("warningRssi");
        const alertRssiEl = document.getElementById("alertRssi");
        const ipEl = document.getElementById("receive_ipaddress");
        const dropdownBtn = document.getElementById("dropdown-oid-btn");

        setDisabled(warningRssiEl, disabled);
        setDisabled(alertRssiEl, disabled);
        setDisabled(ipEl, disabled);
        setDisabled(dropdownBtn, disabled);

        // console.log("rxEnabled state:", state);
    };

    el.addEventListener("change", handler);
    el.addEventListener("input", handler);
    el.dataset.bound = "1";

    // sync ครั้งแรกตามสถานะปัจจุบันของ checkbox
    el.dispatchEvent(new Event("change"));
}

function updateRxEnabledStateLabel(enabled) {
    const labelEl = document.getElementById("rxEnabledStateLabel");
    if (!labelEl) return;
    labelEl.textContent = enabled ? "SNMP Enable" : "SNMP Disable";
}

function setDisabled(el, disabled) {
    if (!el) return;
    el.disabled = !!disabled;
    // ปรับ cursor ให้สื่ออารมณ์ (ไม่พังถ้า element ไม่มี style)
    try { el.style.cursor = disabled ? "not-allowed" : "auto"; } catch (e) { }
}
