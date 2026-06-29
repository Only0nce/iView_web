/* myfunctionDatalogger.merged.js
 * - ข้อมูลใหม่จะอยู่ "บนสุด" เสมอ (unshift + ไม่ sort ซ้ำ)
 * - อัปเดต dropdown สถานีทันทีเมื่อมี station ใหม่
 * - รวมฟังก์ชัน dropdown ให้เหลือชุดเดียว: refreshStationDropdown(), addOrRefreshStation()
 */

var ws, wsUri;
var currentPage = 1;
const itemsPerPage = 15;

window.tableData = [];          // ข้อมูลทั้งหมด (เรียงใหม่→เก่า ตอนโหลดครั้งแรก)
window.filteredTableData = null; // ข้อมูลหลังฟิลเตอร์ (ถ้า null = ใช้ tableData)
window.stationSet = new Set();   // set ของ station ทั้งหมดที่แสดงอยู่ใน dropdown

// ===== BOOTSTRAP =====
document.addEventListener("DOMContentLoaded", () => {
  WebSocketTest();
  loadDataLog();

  // ปุ่ม/อินพุตที่หน้าอาจมี หยิบแล้วค่อยผูกถ้ามีอยู่จริง
  document.getElementById("reset-btn")?.addEventListener("click", resetFilters);
  document.getElementById("export-all-btn") && (document.getElementById("export-all-btn").onclick = exportAll);
  document.getElementById("delete-all-btn") && (document.getElementById("delete-all-btn").onclick = deleteAll);

  const startEl = document.getElementById("searchDateStart");
  const endEl   = document.getElementById("searchDateEnd");
  if (startEl && endEl) {
    startEl.addEventListener("change", applyCombinedFilters);
    endEl.addEventListener("change", applyCombinedFilters);
  }
  const stationEl = document.getElementById("searchStation");
  if (stationEl) stationEl.addEventListener("change", applyCombinedFilters);
});

// ===== WebSocket =====
function WebSocketTest() {
  wsUri = "ws://" + location.host + ":1234";
  ws = new WebSocket(wsUri);

  ws.onopen = () => {
    if (ws.readyState === 1) ws.send('{"menuID":"getMonitorPage"}');
  };
  ws.onmessage = (evt) => processMsg(evt.data);
  ws.onerror = (e) => console.error("WebSocket error:", e);
  ws.onclose = () => console.warn("WebSocket closed.");
}

// ===== Message Handler =====
function processMsg(message) {
  const obj = JSON.parse(message);

  if (obj.menuID === "view_transmitter_list") {
    // แถวใหม่เข้ามา real-time
    if (obj.insertDataLogger == 1) {
      // กันซ้ำด้วย key = datetime + station
      const key = `${obj.dateList} ${obj.timeList}|${obj.stationName || ""}`;
      const dupIdx = window.tableData.findIndex(row =>
        `${row.dateList} ${row.timeList}|${row.stationName || ""}` === key
      );
      if (dupIdx !== -1) {
        window.tableData.splice(dupIdx, 1);
      }

      // อัปเดต station dropdown ถ้ามี station ใหม่
      if (obj.stationName) addOrRefreshStation(obj.stationName);

      // อัดรายการใหม่ไว้ "หัวตาราง"
      window.tableData.unshift(obj);
    //   currentPage = 1; // กลับมาหน้าแรก

      renderTable(window.filteredTableData || window.tableData);
    }
    return;
  }

  // …เคสอื่น ๆ ของคุณ…
}

// ===== Load (ครั้งแรก) =====
async function loadDataLog() {
  try {
    const resp = await fetch("/get_data_log.php");
    const data = await resp.json();

    // โหลดครั้งแรก: เรียง "ใหม่→เก่า" แล้วคงลำดับนั้นไว้ใน tableData
    window.tableData = [...data].sort(
      (a, b) => new Date(`${b.dateList} ${b.timeList}`) - new Date(`${a.dateList} ${a.timeList}`)
    );

    // สร้างตารางถ้ายังไม่มี
    if (!document.getElementById("data-log-table")) buildDataloggerTable();

    // เติม stationSet แล้ววาด dropdown
    rebuildStationSetFromTable();
    refreshStationDropdown();

    currentPage = 1;
    renderTable(window.tableData);
  } catch (e) {
    console.error("loadDataLog error:", e);
    alert("Error loading Data Log.");
  }
}

// ===== Station dropdown (รวมฟังก์ชัน) =====
function rebuildStationSetFromTable() {
  window.stationSet.clear();
  for (const it of window.tableData) {
    if (it.stationName) window.stationSet.add(it.stationName);
  }
}

function refreshStationDropdown() {
  const select = document.getElementById("searchStation");
  if (!select) return;
  const currentVal = select.value; // จำค่าที่เลือกไว้

  // เคลียร์และเติมใหม่จาก stationSet
  select.innerHTML = '<option value="">-- Select Station --</option>';
  Array.from(window.stationSet).sort().forEach(st => {
    const opt = document.createElement("option");
    opt.value = st;
    opt.textContent = st;
    select.appendChild(opt);
  });

  // พยายามคืนค่าที่เคยเลือกไว้
  if (currentVal && window.stationSet.has(currentVal)) {
    select.value = currentVal;
  }
}

function addOrRefreshStation(stationName) {
  // ถ้าใหม่จริง ๆ → เพิ่มเข้า set แล้วอัปเดต dropdown
  if (!window.stationSet.has(stationName)) {
    window.stationSet.add(stationName);
    refreshStationDropdown();
  }
}

// ===== Table =====
function buildDataloggerTable() {
  const container = document.getElementById("dataloggerContainer");
  if (!container) return;
  container.innerHTML = `
    <table id="data-log-table" class="fl-table">
      <thead>
        <tr>
          <th>DateTime</th>
          <th>Station</th>
          <th>Frequency MHz</th>
          <th>FWD Watt</th>
          <th>FWD dBm</th>
          <th>RWD Watt</th>
          <th>RWD dBm</th>
          <th>VSWR</th>
          <th>Duration</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <div id="pagination" class="center"></div>
    <div id="pagination-info" style="margin-top:10px;font-size:14px;color:#FA057E;"></div>
  `;
}

/** Render แบบ "เคารพลำดับ data ที่ส่งมา"
 *  - ไม่ sort ซ้ำ เพื่อรักษา unshift() ที่หัวตาราง
 *  - แบ่งหน้าแบบง่าย
 */
function renderTable(data) {
  const rows = data || [];
  const tbody = document.querySelector("#data-log-table tbody");
  if (!tbody) return;

  const totalPages = Math.ceil(rows.length / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const pageData = rows.slice(startIdx, startIdx + itemsPerPage);

  tbody.innerHTML = pageData.map(row => {
    const safeTime = (row.timeList || "").replace(/:/g, "-");
    const durationId = `duration-${row.dateList}-${safeTime}`;
    return `
      <tr data-key="${row.dateList} ${row.timeList}">
        <td>${row.dateList} ${row.timeList}</td>
        <td>${row.stationName || ""}</td>
        <td>${Number(row.frequency).toFixed(3)}</td>
        <td>${Number(row.fwdWattList).toFixed(3)}</td>
        <td>${Number(row.fwd_dBmList).toFixed(3)}</td>
        <td>${Number(row.rwdWattList).toFixed(3)}</td>
        <td>${Number(row.rwd_dBmList).toFixed(3)}</td>
        <td>${Number(row.vswrList).toFixed(3)}</td>
        <td id="${durationId}">${row.durationSec}</td>
        <td>${row.connectionStatus == 1 ? "✔️" : "❌"}</td>
      </tr>
    `;
  }).join("");

  renderPaginationToolbar(rows.length);
}

// ===== Filters =====
function applyCombinedFilters() {
  const stationValue = document.getElementById("searchStation")?.value || "";
  const dateStart = document.getElementById("searchDateStart")?.value || "";
  const dateEnd   = document.getElementById("searchDateEnd")?.value || "";

  if (!stationValue && !dateStart && !dateEnd) {
    window.filteredTableData = null;
    currentPage = 1;
    return renderTable(window.tableData);
  }

  const startTS = dateStart ? new Date(`${dateStart} 00:00:00`).getTime() : null;
  const endTS   = dateEnd   ? new Date(`${dateEnd} 23:59:59`).getTime() : null;

  window.filteredTableData = window.tableData.filter(row => {
    const byStation = stationValue ? row.stationName === stationValue : true;
    let byDate = true;
    if (startTS || endTS) {
      const ts = new Date(`${row.dateList} ${row.timeList}`).getTime();
      if (startTS && endTS) byDate = ts >= startTS && ts <= endTS;
      else if (startTS)     byDate = ts >= startTS;
      else if (endTS)       byDate = ts <= endTS;
    }
    return byStation && byDate;
  });

  currentPage = 1;
  renderTable(window.filteredTableData);
}

function resetFilters() {
  const sEl = document.getElementById("searchStation");
  const ds = document.getElementById("searchDateStart");
  const de = document.getElementById("searchDateEnd");
  if (sEl) sEl.value = "";
  if (ds) ds.value = "";
  if (de) de.value = "";

  window.filteredTableData = null;
  currentPage = 1;
  renderTable(window.tableData);
}

// ===== Pagination =====
function renderPaginationToolbar(totalRows) {
  const totalPages = Math.ceil(totalRows / itemsPerPage);
  const container = document.getElementById("pagination");
  const info = document.getElementById("pagination-info");
  if (!container || !info) return;

  container.innerHTML = "";
  if (totalPages <= 1) { info.textContent = ""; return; }

  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = startPage + maxButtons - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  const wrap = document.createElement("div");
  wrap.style.display = "inline-flex";
  wrap.style.gap = "5px";
  wrap.style.marginTop = "10px";

  wrap.appendChild(createPageButton("« First", 1, currentPage === 1));
  wrap.appendChild(createPageButton("Previous", currentPage - 1, currentPage === 1));
  for (let i = startPage; i <= endPage; i++) {
    wrap.appendChild(createPageButton(i, i, false, i === currentPage));
  }
  wrap.appendChild(createPageButton("Next", currentPage + 1, currentPage === totalPages));
  wrap.appendChild(createPageButton("Last »", totalPages, currentPage === totalPages));

  container.appendChild(wrap);
  info.textContent = `Page ${currentPage} of ${totalPages}`;
}

function createPageButton(label, page, disabled = false, active = false) {
  const btn = document.createElement("button");
  btn.innerText = label;
  btn.className = "systembutton";
  btn.style.width = "100px";
  btn.style.padding = "0 2px";
  btn.style.height = "24px";
  btn.disabled = disabled;

  if (active) {
    btn.style.backgroundColor = "#FA057E";
    btn.style.color = "#FFF";
  } else if (disabled) {
    btn.style.backgroundColor = "#555";
    btn.style.color = "#999";
  } else {
    btn.style.backgroundColor = "#000";
    btn.style.color = "#FFF";
    btn.onmouseover = () => (btn.style.backgroundColor = "#43A047");
    btn.onmouseout  = () => (btn.style.backgroundColor = "#000");
  }

  btn.onclick = () => {
    if (!disabled) {
      currentPage = page;
      renderTable(window.filteredTableData || window.tableData);
    }
  };
  return btn;
}

// ===== Export / Delete (ตัวเลือก) =====
function exportAll() {
  const data = window.filteredTableData ?? window.tableData;
  if (!data?.length) return alert("No data to export.");

  const header = [
    "DateTime","Station","Frequency MHz","FWD Watt","FWD dBm",
    "RWD Watt","RWD dBm","VSWR","Duration","Status"
  ];
  const rows = data.map(it => [
    `${it.dateList} ${it.timeList}`, it.stationName || "", it.frequency,
    it.fwdWattList, it.fwd_dBmList, it.rwdWattList, it.rwd_dBmList,
    it.vswrList, it.durationSec, it.connectionStatus == 1 ? "OK" : "NG"
  ]);
  const csv = [header, ...rows].map(a => a.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "datalogger_export.csv";
  link.click();
}

async function deleteAll() {
  const data = window.filteredTableData ?? window.tableData;
  if (!data?.length) return alert("No data to delete.");
  if (!confirm(`Delete all ${data.length} rows?`)) return;

  const rows = data.map(row => ({
    databaseId: row.databaseId ?? null,
    dateList: row.dateList ?? null,
    timeList: row.timeList ?? null,
    stationName: row.stationName ?? null
  }));

  const resp = await fetch("/delete_all_data_log.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows })
  }).then(r => r.json()).catch(e => ({ success: false, message: String(e) }));

  if (!resp || resp.success !== true) {
    alert("Delete failed: " + (resp?.message || "Unknown error"));
    return;
  }

  // ลบฝั่ง client
  const keySet = new Set(
    rows.map(r =>
      r.databaseId != null
        ? `id:${r.databaseId}`
        : `dt:${r.dateList} ${r.timeList}|st:${r.stationName}`
    )
  );
  window.tableData = window.tableData.filter(item => {
    const k = item.databaseId != null
      ? `id:${item.databaseId}`
      : `dt:${item.dateList} ${item.timeList}|st:${item.stationName}`;
    return !keySet.has(k);
  });
  window.filteredTableData = null;

  // rebuild station ทั้งชุด (เผื่อมีการลบจนบางสถานีหายไป)
  rebuildStationSetFromTable();
  refreshStationDropdown();

  renderTable(window.tableData);
  alert("Deleted successfully.");
}
