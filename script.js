// Updated script.js with editable summary discount percentage
let rowCount = 0;

let percentBelow5000 = 15;
let percentAbove5000 = 20;
let percentRun = 95;
let customPercentages = {}; // กำหนดเปอร์เซ็นต์รายบุคคล
let summaryDiscountPercent = 30; // ค่า default สำหรับการสรุปยอดรวม

let lastPlaceholderRow = null;
let lastPlaceholderTimeout = null;

function addRow() {
  rowCount++;
  const tbody = document.getElementById("dataBody");
  const newRow = tbody.insertRow();

  newRow.className = (rowCount % 2 === 0) ? "even-row" : "odd-row";

  const placeholders = ["เลข", "ยอดซื้อ", "ยอดวิ่ง", "2 ตัว", "3 ตรง", "3 โต๊ด", "3 ล่าง", "วิ่งบน", "วิ่งล่าง", "2ครึ่ง"];

  // 🔁 ลบ placeholder จากแถวก่อนหน้า ถ้ามี
  if (lastPlaceholderRow) {
    for (let i = 1; i < 12; i++) {
      const input = lastPlaceholderRow.cells[i]?.querySelector("input");
      if (input) input.placeholder = "";
    }
    clearTimeout(lastPlaceholderTimeout);
  }

  for (let i = 0; i < 12; i++) {
    const cell = newRow.insertCell();

    if (i === 0) {
      cell.textContent = rowCount;
    } else {
      const input = document.createElement("input");

      if (i === 1) {
        input.type = "text";
        input.style.textAlign = "center";
        input.placeholder = "ชื่อ";
      } else {
        input.type = "number";
        input.inputMode = "numeric";
        input.pattern = "[0-9]*";
        input.style.textAlign = "center";
        input.placeholder = placeholders[i - 2];
      }

      // 💡 คำนวณรวมเมื่อเปลี่ยนค่า
      input.addEventListener("input", () => {
        sumColumns();
        saveToLocalStorage();
      });

      // 💡 เพิ่มแถวใหม่เมื่อกด Enter
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          addRow();

          // โฟกัสช่องชื่อในแถวใหม่
          setTimeout(() => {
            const tbody = document.getElementById("dataBody");
            const lastRow = tbody.rows[tbody.rows.length - 1];
            if (lastRow && lastRow.cells[1]) {
              const input = lastRow.cells[1].querySelector("input");
              if (input) input.focus();
            }
          }, 10);
        }
      });

      cell.appendChild(input);
    }
  }

  sumColumns();
  saveToLocalStorage();

  // ⏱️ ลบ placeholder หลัง 15 วินาที
  lastPlaceholderRow = newRow;
  lastPlaceholderTimeout = setTimeout(() => {
    for (let i = 1; i < 12; i++) {
      const input = newRow.cells[i]?.querySelector("input");
      if (input) input.placeholder = "";
    }
    lastPlaceholderRow = null;
  }, 15000);
}





function sumColumns() {
  const tbody = document.getElementById("dataBody");
  const sumRow = document.getElementById("sumRow");
  sumRow.innerHTML = `<td colspan="3" style="font-weight: bold;">รวมยอด</td>`;

  const totals = new Array(9).fill(0);

  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];

    let colIndex = 0;
    for (let j = 3; j <= 11; j++) {
      const cell = row.cells[j];
      if (!cell) continue;
      const input = cell.querySelector("input");
      const value = input ? parseFloat(input.value) || 0 : 0;
      totals[colIndex] += value;
      colIndex++;
    }
  }

  for (let total of totals) {
    const td = document.createElement("td");
    td.textContent = total.toLocaleString();
    sumRow.appendChild(td);
  }
}

let discountPerTable = JSON.parse(localStorage.getItem("discountPerTable") || "{}");

function showSummaryForTable(tableName) {
  const rows = JSON.parse(localStorage.getItem("data_" + tableName)) || [];

  let sumBuy = 0, sumRun = 0;
  let t2 = 0, t3s = 0, t3t = 0, t3l = 0, trunTop = 0, trunBot = 0, tHalf = 0;

  for (const row of rows) {
    const buy = parseFloat(row[2]) || 0;
    const run = parseFloat(row[3]) || 0;
    const c2 = parseFloat(row[4]) || 0;
    const c3s = parseFloat(row[5]) || 0;
    const c3t = parseFloat(row[6]) || 0;
    const c3l = parseFloat(row[7]) || 0;
    const ctop = parseFloat(row[8]) || 0;
    const cbot = parseFloat(row[9]) || 0;
    const chalf = parseFloat(row[10]) || 0;

    sumBuy += buy;
    sumRun += run;
    t2 += c2;
    t3s += c3s;
    t3t += c3t;
    t3l += c3l;
    trunTop += ctop;
    trunBot += cbot;
    tHalf += chalf;
  }

  const discount = discountPerTable[tableName] ?? 30; // ถ้าไม่มี ใช้ 30%
  const buyNet = Math.round(sumBuy * (1 - discount / 100));
  const runNet = Math.round(sumRun * 0.90);
  const totalIn = buyNet + runNet;

  const reward2 = Math.round(t2 * 70);
  const reward3s = Math.round(t3s * 500);
  const reward3t = Math.round(t3t * 100);
  const reward3l = Math.round(t3l * 120);
  const rewardTop = Math.round(trunTop * 3);
  const rewardBot = Math.round(trunBot * 4);
  const rewardHalf = Math.round(tHalf * 35);

  const totalOut = reward2 + reward3s + reward3t + reward3l + rewardTop + rewardBot + rewardHalf;
  const net = totalIn - totalOut;

  let allTables = JSON.parse(localStorage.getItem("tableList")) || [];
  let selectorHTML = `
    <div style="font-size:13px; margin: 6px 0;">
      เลือกชุด: 
      <select id="summaryTableSelector">
        ${allTables.map(name => `<option value="${name}" ${name === tableName ? 'selected' : ''}>${name}</option>`).join("")}
      </select>
      <label> หักยอดซื้อ: <input type="number" id="summaryDiscountInput" value="${discount}" style="width:40px"> %</label>
      <button onclick="applySummaryDiscount()">✅ ใช้</button>
    </div>
  `;

  let summaryHTML = selectorHTML + `
    <button onclick="shareSummary()">📤 แชร์</button>
    <h3>📌 สรุปยอดซื้อ</h3>
  `;

  if (sumBuy > 0) summaryHTML += `ยอดซื้อทั้งหมด: ${sumBuy.toLocaleString()} - ${discount}% = <strong>${buyNet.toLocaleString()} บาท</strong><br>`;
  if (sumRun > 0) summaryHTML += `ยอดวิ่งทั้งหมด: ${sumRun.toLocaleString()} - 10% = <strong>${runNet.toLocaleString()} บาท</strong><br>`;
  if (sumBuy > 0 || sumRun > 0) summaryHTML += `✅ รวมรายรับ: <strong>${totalIn.toLocaleString()} บาท</strong><br><br>`;

  summaryHTML += `<h3>🎯 สรุปยอดถูก</h3>`;
  if (t2 > 0) summaryHTML += `ถูก 2 ตัว: ${t2.toLocaleString()} × 70 = <strong>${reward2.toLocaleString()} บาท</strong><br>`;
  if (t3s > 0) summaryHTML += `ถูก 3 ตรง: ${t3s.toLocaleString()} × 500 = <strong>${reward3s.toLocaleString()} บาท</strong><br>`;
  if (t3t > 0) summaryHTML += `ถูก 3 โต๊ด: ${t3t.toLocaleString()} × 100 = <strong>${reward3t.toLocaleString()} บาท</strong><br>`;
  if (t3l > 0) summaryHTML += `ถูก 3 ล่าง: ${t3l.toLocaleString()} × 120 = <strong>${reward3l.toLocaleString()} บาท</strong><br>`;
  if (trunTop > 0) summaryHTML += `วิ่งบน: ${trunTop.toLocaleString()} × 3 = <strong>${rewardTop.toLocaleString()} บาท</strong><br>`;
  if (trunBot > 0) summaryHTML += `วิ่งล่าง: ${trunBot.toLocaleString()} × 4 = <strong>${rewardBot.toLocaleString()} บาท</strong><br>`;
  if (tHalf > 0) summaryHTML += `2 จ่ายครึ่ง: ${tHalf.toLocaleString()} × 35 = <strong>${rewardHalf.toLocaleString()} บาท</strong><br>`;
  if (totalOut > 0) summaryHTML += `✅ รวมรายจ่าย: <strong>${totalOut.toLocaleString()} บาท</strong><br><br>`;

  summaryHTML += `
    <h3>📊 สรุปรวม</h3>
    <strong style="color:${net < 0 ? 'red' : 'green'}">
      ${net < 0 ? 'จ่ายพิน' : 'พินจ่าย'}
    </strong>: ${Math.abs(net).toLocaleString()} บาท
  `;

  document.getElementById("summaryContent").innerHTML = summaryHTML;
  document.getElementById("summaryModal").style.display = "block";

  document.getElementById("summaryTableSelector").onchange = e => {
    const selectedTable = e.target.value;
    showSummaryForTable(selectedTable);
  };
}

function showSummary() {
  showSummaryForTable(currentTableName);
}

function applySummaryDiscount() {
  const input = document.getElementById("summaryDiscountInput");
  const newValue = parseFloat(input.value);
  const tableSelect = document.getElementById("summaryTableSelector");
  const selectedTable = tableSelect?.value || currentTableName;

  if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
    discountPerTable[selectedTable] = newValue;
    localStorage.setItem("discountPerTable", JSON.stringify(discountPerTable));
    showSummaryForTable(selectedTable);
  }
}

function setCustomPercentage() {
  const name = document.getElementById("personSelect").value;
  const percent = parseFloat(document.getElementById("customBuyPercent").value);
  if (name && !isNaN(percent)) {
    customPercentages[name] = percent;
    showIndividualSummary();
  }
}

function updatePercentages() {
  percentBelow5000 = parseFloat(document.getElementById("percentBelow")?.value) || 15;
  percentAbove5000 = parseFloat(document.getElementById("percentAbove")?.value) || 20;
  percentRun = parseFloat(document.getElementById("percentRun")?.value) || 5;
  showIndividualSummary(); // อัปเดต popup ทันที
}

function closeSummary() { document.getElementById("summaryModal").style.display = "none"; }

function showIndividualSummary() {
  const tableList = JSON.parse(localStorage.getItem("tableList")) || [];
  const summary = {};
  const detailList = {};
  let totalWorkSheets = 0;

  for (const tableName of tableList) {
    const rows = JSON.parse(localStorage.getItem("data_" + tableName)) || [];
    for (const row of rows) {
      const name = row[0]?.trim();
      const buy = parseFloat(row[2]) || 0;
      const run = parseFloat(row[3]) || 0;

      if (!name) continue;

      if (!summary[name]) {
        summary[name] = { buy: 0, run: 0, count: 0 };
        detailList[name] = [];
      }

      summary[name].buy += buy;
      summary[name].run += run;
      summary[name].count += 1;
      detailList[name].push({ table: tableName, amount: buy });
      totalWorkSheets += 1;
    }
  }

  let html = `
    <div style="font-size: 13px; margin-bottom: 8px">
      ตั้งค่าเปอร์เซ็นต์เฉพาะบุคคล:<br>
      <select id="personSelect">
        <option value="">-- เลือกชื่อ --</option>
        ${Object.keys(summary).map(name => `<option value="${name}">${name}</option>`).join('')}
      </select>
      <label> ยอดซื้อ: <input type="number" id="customBuyPercent" style="width:40px">%</label>
      <button onclick="setCustomPercentage()">✅ กำหนดให้บุคคลนี้</button>
    </div>
    <button onclick="shareSummary()">📤 แชร์</button>
    <h3>📋 สรุปรายบุคคล (รวมทุกชุด ${totalWorkSheets} ใบงาน)</h3>
  `;

  for (const name in summary) {
    const person = summary[name];
    const buys = detailList[name];
    const customRate = customPercentages[name];
    const buyRate = customRate !== undefined ? customRate : (person.buy < 5000 ? percentBelow5000 : percentAbove5000);
    const buyNet = person.buy * ((100 - buyRate) / 100);
    const runNet = person.run * (percentRun / 100);
    const totalNet = buyNet + runNet;

    html += `<strong>${name} ${person.count > 1 ? person.count + " ใบงาน" : ""}</strong><br>`;

    if (person.count > 1) {
      let count = 1;
      buys.forEach((b) => {
        html += `${count++}. ยอดซื้อ ${b.amount.toLocaleString()}<br>`;
      });
    }

    html += `ยอดซื้อรวม ${person.buy.toLocaleString()} - ${buyRate}% = <strong>${Math.round(buyNet).toLocaleString()}</strong> บาท<br>`;

    if (person.run > 0) {
      html += `ยอดวิ่ง ${person.run.toLocaleString()} - 5% = <strong>${Math.round(runNet).toLocaleString()}</strong> บาท<br>`;
    }

    html += `รวม: <strong>${Math.round(totalNet).toLocaleString()}</strong> บาท<hr>`;
  }

  document.getElementById("summaryContent").innerHTML = html;
  document.getElementById("summaryModal").style.display = "block";
}

function downloadPDF() {
  const element = document.getElementById("only-table");

  const opt = {
    margin: 0.5,
    filename: `รายงาน_เฉพาะตาราง.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}


function shareSummary() {
  const summaryText = document.getElementById("summaryContent").innerText;

  if (navigator.share) {
    navigator.share({
      title: '📋 สรุปรายการ',
      text: summaryText,
    })
    .then(() => console.log('แชร์สำเร็จ'))
    .catch((error) => console.error('เกิดข้อผิดพลาดในการแชร์:', error));
  } else {
    alert('เบราว์เซอร์นี้ไม่รองรับการแชร์');
  }
}

function saveToLocalStorage() {
  const rows = [];
  const tbody = document.getElementById("dataBody");
  for (let row of tbody.rows) {
    const inputs = Array.from(row.querySelectorAll("input")).map(input => input.value);
    rows.push(inputs);
  }
  localStorage.setItem("data_" + currentTableName, JSON.stringify(rows));
}

function loadFromLocalStorage() {
  const data = JSON.parse(localStorage.getItem("myTableData"));
  if (data) {
    for (let inputs of data) {
      addRowWithData(inputs);
    }
    sumColumns();
  }
}

function addRowWithData(data) {
  rowCount++;
  const tbody = document.getElementById("dataBody");
  const newRow = tbody.insertRow();
  newRow.className = (rowCount % 2 === 0) ? "even-row" : "odd-row";

  for (let i = 0; i < 12; i++) {
    const cell = newRow.insertCell();
    if (i === 0) {
      cell.textContent = rowCount;
    } else {
      const input = document.createElement("input");
      input.value = data[i - 1] || "";
      if (i === 1) {
        input.type = "text";
      } else {
        input.type = "number";
        input.addEventListener("input", () => {
          sumColumns();
          saveToLocalStorage();
        });
      }
      cell.appendChild(input);
    }
  }
}

function clearAllData() {
  if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลทั้งหมด?")) {
    localStorage.removeItem("myTableData");
    document.getElementById("dataBody").innerHTML = "";
    rowCount = 0;
    sumColumns();
  }
}
function showTodayDate() {
  const today = new Date();
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  const formatted = today.toLocaleDateString('th-TH', options);
  document.getElementById('today-date').textContent = `วันที่ ${formatted}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const savedTables = JSON.parse(localStorage.getItem("tableList")) || [];
  if (savedTables.length === 0) {
    // ถ้ายังไม่มีข้อมูลเลย ให้สร้างชุดเริ่มต้น
    localStorage.setItem("tableList", JSON.stringify(["น้ำหอม+ยุพิน"]));
    updateTableTitle();

  }

  // โหลดชื่อชุดล่าสุด
  currentTableName = savedTables.includes(currentTableName) ? currentTableName : savedTables[0];
  loadTable(currentTableName);
  showTodayDate();
});


function loadTable(name) {
  currentTableName = name;
  rowCount = 0;
  document.getElementById("dataBody").innerHTML = "";
  const data = JSON.parse(localStorage.getItem("data_" + name));
  if (data) {
    data.forEach(inputs => addRowWithData(inputs));
    sumColumns();
  }
  updateTableSelector();
  updateTableTitle();

}

let currentTableName = "น้ำหอม+ยุพิน";

function createNewTable() {
  const name = document.getElementById("newTableName").value.trim();
  if (!name) return alert("กรุณาใส่ชื่อชุด");
  let tableList = JSON.parse(localStorage.getItem("tableList")) || [];
  if (!tableList.includes(name)) {
    tableList.push(name);
    localStorage.setItem("tableList", JSON.stringify(tableList));
  }
  document.getElementById("newTableName").value = "";
  loadTable(name);
}

function updateTableSelector() {
  const selector = document.getElementById("tableSelector");
  const list = JSON.parse(localStorage.getItem("tableList")) || [];
  selector.innerHTML = list.map(name => `<option value="${name}" ${name === currentTableName ? 'selected' : ''}>${name}</option>`).join("");
  selector.onchange = e => loadTable(e.target.value);
}

function deleteCurrentTable() {
  if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบชุด "${currentTableName}"?`)) return;

  // ลบข้อมูลชุดนี้
  localStorage.removeItem("data_" + currentTableName);

  // ลบออกจาก list
  let list = JSON.parse(localStorage.getItem("tableList")) || [];
  list = list.filter(name => name !== currentTableName);
  localStorage.setItem("tableList", JSON.stringify(list));

  // ถ้ามีชุดเหลืออยู่ ให้โหลดชุดใหม่
  if (list.length > 0) {
    currentTableName = list[0];
    loadTable(currentTableName);
  } else {
    // ถ้าไม่มีชุดเลย ให้เคลียร์ตาราง
    currentTableName = "";
    document.getElementById("dataBody").innerHTML = "";
    rowCount = 0;
    sumColumns();
    updateTableSelector();
  }
}

function updateTableTitle() {
  const title = document.getElementById("tableTitle");
  if (title && currentTableName) {
    title.textContent = currentTableName;
  }
}

function showProfitSummary() {
  const tableList = JSON.parse(localStorage.getItem("tableList")) || [];
  let total3Lower = 0;
  let totalBuyAll = 0;
  let totalRunAll = 0;
  const percentInputs = {};

  let html = `
    <div style="font-size:14px; font-weight:bold; margin-bottom: 6px;">
      🧾 ยอดซื้อรวมทั้งหมด: <span id="totalAll">-</span> บาท
    </div>
    <h3>💰 สรุปยอดกำไร</h3>
    <div style="font-size:13px; margin-bottom: 12px;">
      <strong>กรอกเปอร์เซ็นต์แต่ละชุด</strong><br>
  `;

  for (const tableName of tableList) {
    const rows = JSON.parse(localStorage.getItem("data_" + tableName)) || [];

    let sumBuy = 0, sumRun = 0, sum3Lower = 0;
    for (const row of rows) {
      sumBuy += parseFloat(row[2]) || 0;
      sumRun += parseFloat(row[3]) || 0;
      sum3Lower += parseFloat(row[7]) || 0;
    }

    if (sumBuy === 0 && sumRun === 0) continue;

    let defaultBuy = "";
    if (tableName.includes("น้ำหอม + ยุพิน")) defaultBuy = 8;
    else if (tableName.includes("ติ๊ก + ยุพิน")) defaultBuy = 10;

    const defaultRun = 5;

    percentInputs[tableName] = { buy: sumBuy, run: sumRun };
    total3Lower += sum3Lower;
    totalBuyAll += sumBuy;
    totalRunAll += sumRun;

    html += `<div style="margin-top:8px;"><strong>ชุด ${tableName}</strong><br>`;
    if (sumBuy > 0) {
      html += `ยอดซื้อ: ${sumBuy.toLocaleString()} บาท 
        <input type="number" id="buyPercent_${tableName}" value="${defaultBuy}" style="width:50px"> %<br>`;
    }
    if (sumRun > 0) {
      html += `ยอดวิ่ง: ${sumRun.toLocaleString()} บาท 
        <input type="number" id="runPercent_${tableName}" value="${defaultRun}" style="width:50px"> %<br>`;
    }
    html += `</div>`;
  }

  html += `
    <br><button onclick="calculateProfitSummary()" style="margin-top:10px;">📊 คำนวณกำไร</button>
    </div>
  `;

  document.getElementById("summaryContent").innerHTML = html;
  document.getElementById("summaryModal").style.display = "block";
  document.getElementById("totalAll").textContent = (totalBuyAll + totalRunAll).toLocaleString();

  window.calculateProfitSummary = function () {
    let profitLines = "";
    let totalProfit = 0;

    for (const tableName of tableList) {
      const sums = percentInputs[tableName];
      if (!sums) continue;

      const sumBuy = sums.buy;
      const sumRun = sums.run;

      const buyInput = document.getElementById("buyPercent_" + tableName);
      const runInput = document.getElementById("runPercent_" + tableName);

      const buyPercent = buyInput ? parseFloat(buyInput.value) || 0 : 0;
      const runPercent = runInput ? parseFloat(runInput.value) || 0 : 0;

      const profitBuy = Math.round(sumBuy * buyPercent / 100);
      const profitRun = Math.round(sumRun * runPercent / 100);
      const sumTotal = profitBuy + profitRun;

      totalProfit += sumTotal;

      profitLines += `<strong>ชุด ${tableName}</strong><br>`;
      if (sumBuy > 0) profitLines += `${sumBuy.toLocaleString()} × ${buyPercent}% = <strong>${profitBuy.toLocaleString()}</strong> บาท<br>`;
      if (sumRun > 0) profitLines += `${sumRun.toLocaleString()} × ${runPercent}% = <strong>${profitRun.toLocaleString()}</strong> บาท<br>`;
      profitLines += `<br>`;
    }

    const reward3Lower = Math.round(total3Lower * 20);
    const grandTotal = totalProfit + reward3Lower;
    const finalProfit = grandTotal - 6000 - 2000;

    const resultHTML = `
      <div style="font-size:14px; font-weight:bold; margin-bottom: 6px;">
  ยอดซื้อรวมทั้งหมด: ${(totalBuyAll + totalRunAll).toLocaleString()} บาท
    </div>

      ${profitLines}
      <hr>
      ถูก 3 ล่างรวม: ${total3Lower.toLocaleString()} × 20 = <strong>${reward3Lower.toLocaleString()} บาท</strong><br><br>
      ✅ รวมเปอร์เซ็นต์ขายได้ = <strong>${grandTotal.toLocaleString()} บาท</strong><br><br>
      ➖ หักค่าเสมียน 6,000 บาท<br>
      ➖ หักค่าเสมียนจด 2,000 บาท<br>
      <h3>✔️ ยอดคงเหลือ = <strong style="color:green">${finalProfit.toLocaleString()} บาท</strong></h3>
    `;

    document.getElementById("summaryContent").innerHTML = resultHTML;
  };
}




