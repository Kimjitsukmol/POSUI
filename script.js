// ไฟล์ script.js

let productList = [];
let totalPrice = 0;
let totalQty = 0;
let rangeTimer = null;

let isEnterPressed = false;
let isBackspacePressed = false;
let hasClearedHeldBill = false;
let currentHeldIndex = -1; // -1 = ยังไม่เคยเรียก


// === กำหนดปลายทาง ===
const SALES_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyL63QfbS9zh41-l_C3VtlPDWZOQoUfe5nhmREi_P-fyotSAjVH0NRBL4Nbz6xahF2E/exec";

// === helper สำหรับบันทึกยอดขาย ===
function sendSaleToSheet(received, change) {
  const items = [...document.querySelectorAll("#productBody tr")].map(row => {
    const tds = row.querySelectorAll("td");
    return {
      code : tds[0].textContent,
      name : tds[1].textContent,
      qty  : +tds[2].querySelector("input").value,
      price: +(tds[3].getAttribute("data-unit-price") || tds[3].textContent)
    };
  });

  const payload = {
    sheet      : "รายการขาย",          // ตรงกับชื่อที่ตั้งไว้ หรือแก้ให้ตรงชีตจริง
    datetime   : new Date().toISOString(),
    items      : JSON.stringify(items),
    totalQty   : totalQty,
    totalPrice : totalPrice,
    received   : received,
    change     : change
  };

  // บอดี้ส่งเป็น URL-encoded string ชื่อ data
const simpleBody = 'data=' + encodeURIComponent(JSON.stringify(payload));

fetch(SALES_ENDPOINT, {
  method : 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
  body   : simpleBody,
  mode   : 'no-cors'   // ← ใส่ได้ถ้าต้องการข้าม CORS
})
.catch(err => console.error('❌ ส่งข้อมูลไม่สำเร็จ:', err));


}




fetch("https://script.google.com/macros/s/AKfycbwoK3qwfpO4BXTpSN3jKxL4hXdp1E4YiuN2O-Z2Qa1He-b1k2TAPrxjoVlWDSdXOISH/exec")
  .then(response => response.json())
  .then(data => {
    productList = data;
    console.log("✅ โหลดสินค้าจาก Google Sheets สำเร็จแล้ว", productList);
  })
  .catch(error => {
    console.error("❌ โหลดสินค้าจาก Google Sheets ล้มเหลว:", error);
  });

  
  function speak(text) {
  // ✅ ยกเลิกเสียงที่ยังไม่พูดจบ (สำคัญ!)
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = 1; // ลองใช้ 1.5 หรือ 1.7
  speechSynthesis.speak(utterance);
}

window.addEventListener('load', () => {
  document.querySelector('.summary-box')?.classList.add('summary-fixed');
  document.querySelector('#changeBox')?.classList.add('change-fixed');
  document.getElementById("productCode").focus();
  document.getElementById("productCode").addEventListener("focus", () => {
    speak("");
  });

  document.getElementById("received").addEventListener("focus", () => {
  const rows = document.querySelectorAll("#productBody tr");

  if (rows.length === 0) {
    speak("");
  } else {
    const totalQty = rows.length;
    const totalPrice = Array.from(rows).reduce((sum, row) => {
      return sum + parseFloat(row.querySelector(".item-row-price").textContent);
    }, 0);
    speak(`รวม ${totalPrice} บาท`);
  }
});

});

 // ✅ 👉 เพิ่มส่วนนี้ต่อท้ายได้เลย
  window.addEventListener('keydown', function (e) {
    const codeInput = document.getElementById("productCode");

    // เช็กว่ากำลังกดเลข หรือ Enter
    const isTyping = /^[0-9]$/.test(e.key) || e.key === "Enter";

    // ถ้ายังไม่มีสินค้าในตาราง และกดพิมพ์ → ให้ focus ที่ช่องรหัส
    const isPopupOpen = document.getElementById("productPopup")?.style.display === "flex";

	if (!hasProductsInTable() && isTyping && !isPopupOpen) {
	  codeInput.focus();
	}

  });

let enterCooldown = false;
let backspaceCooldown = false;

document.getElementById("productCode").addEventListener("keydown", function (e) {
  const codeInput = document.getElementById("productCode");
  const code = codeInput.value.trim();
  const firstRow = document.querySelector("#productBody tr");

  // ======= ENTER เพิ่มจำนวนสินค้า =======
  if (e.key === "Enter" && !isEnterPressed) {
    isEnterPressed = true;
    e.preventDefault();

    if (code === "") {
      if (!firstRow) {
        speak("ยังไม่มีสินค้า");
        return;
      }

      const qtyInput = firstRow.querySelector("input[type='number']");
      let qty = parseInt(qtyInput.value);
      qty += 1;
      qtyInput.value = qty;

      qtyInput.classList.add("qty-animate");
      setTimeout(() => qtyInput.classList.remove("qty-animate"), 300);

      const thaiNumbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ"];
      const toSpeak = qty <= 10 ? thaiNumbers[qty] : qty.toString();
      speak(toSpeak);
      updateTotals();
    } else {
      findProduct();
    }
  }

  // ======= BACKSPACE ลดจำนวนสินค้า =======
  else if (e.key === "Backspace" && !isBackspacePressed) {
    if (code === "" && firstRow) {
      isBackspacePressed = true;
      e.preventDefault();

      const qtyInput = firstRow.querySelector("input[type='number']");
      let qty = parseInt(qtyInput.value);

      if (qty > 1) {
        qty -= 1;
        qtyInput.value = qty;

        qtyInput.classList.add("qty-animate");
        setTimeout(() => qtyInput.classList.remove("qty-animate"), 300);

        const thaiNumbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ"];
        const toSpeak = qty <= 10 ? thaiNumbers[qty] : qty.toString();
        speak(toSpeak);
      } else {
        speak("ลบไม่ได้");
      }

      updateTotals();
    }
  }
});

document.getElementById("productCode").addEventListener("keyup", function (e) {
  if (e.key === "Enter") isEnterPressed = false;
  if (e.key === "Backspace") isBackspacePressed = false;
});




document.getElementById("received").addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.repeat) {

    const rows = document.querySelectorAll("#productBody tr");
    if (rows.length === 0) {
    speak("กรุณาใส่สินค้าก่อน");
    return; // ❌ ยกเลิกไม่ให้ทำอะไรต่อ
}
    const received = parseFloat(document.getElementById("received").value);
    const change = received - totalPrice;

    const html = generateReceiptHTML();
    showReceiptPopup(html);
    saveReceiptToHistory(html);
    saveToLocalSummary();
    sendSaleToSheet(received, change);

    // ✅ ลบบิลเฉพาะกรณีที่ถูกเรียกกลับมาแล้วเท่านั้น
if (!hasClearedHeldBill && currentHeldIndex !== -1) {
  const realIndex = heldBills.length - 1 - currentHeldIndex;
  heldBills.splice(realIndex, 1); // ลบเฉพาะบิลที่เรียกกลับมา
  currentHeldIndex = -1; // reset index
  renderHeldBills();
  localStorage.setItem("heldBills", JSON.stringify(heldBills));
  hasClearedHeldBill = true;
}



    speak(`ขอบคุณค่ะ`);
    //ทอน ${change} 
    clearAll();
     setTimeout(() => {
      document.getElementById("productCode").focus();
    }, 3000); // 3000 = 3 วินาที
  }
});



document.getElementById("showTodayBtn").addEventListener("click", () => {
  const box = document.getElementById("todaySummaryBox");
  box.style.display = "block";
  setTimeout(() => box.style.display = "none", 10000);
});

window.addEventListener("keydown", function (e) {
  if (e.code === "NumpadDecimal") {
    document.getElementById("productCode").focus();
    e.preventDefault();
  } else if (e.code === "NumpadAdd") {
    document.getElementById("received").focus();
    e.preventDefault();
  } else if (e.code === "NumpadMultiply") {
    holdCurrentBill(); // เรียกฟังก์ชันพักบิล
    e.preventDefault();
  } else if (e.code === "NumpadDivide") {
  if (heldBills.length === 0) return;

  currentHeldIndex++;
  if (currentHeldIndex >= heldBills.length) currentHeldIndex = 0;

  restoreHeldBill(currentHeldIndex, true); // เพิ่ม true = เปิดแอนิเมชัน
  e.preventDefault();
}
});

function findProduct() {
  const code = document.getElementById("productCode").value.trim();
  document.getElementById("productCode").value = "";
  let found = false;

  for (let i = 0; i < productList.length; i++) {
    if (String(productList[i]["รหัสสินค้า"]) === code) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${productList[i]["รหัสสินค้า"]}</td>
        <td>${productList[i]["ชื่อสินค้า"]}</td>
        <td><input type='number' value='1' min='1' oninput='updateTotals()' style='width: 23px;'></td>
        <td class='item-row-price'>${productList[i]["ราคาขาย"]}</td>
        <td><button class='delete-btn'>❌</button></td>
      `;
      row.querySelector(".delete-btn").addEventListener("click", function () {
        row.remove();
        updateTotals();
        updateRowColors();
      });

      row.classList.add("row-animate");
      const tbody = document.getElementById("productBody");
      tbody.insertBefore(row, tbody.firstChild);
      updateTotals();
      updateRowColors();
      const unitPrice = productList[i]["ราคาขาย"];
      speak(`${unitPrice} บาท`);
      found = true;
      break;
    }
  }

  if (!found) {
    // ✅ ถ้า code เป็นตัวเลข 1-10000 ให้สร้างสินค้าอัตโนมัติ
    const num = parseInt(code);
    if (!isNaN(num) && num >= 1 && num <= 10000) {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${num}</td>
        <td>รายการสินค้า</td>
        <td><input type='number' value='1' min='1' oninput='updateTotals()' style='width: 23px;'></td>
        <td class='item-row-price'>${num}</td>
        <td><button class='delete-btn'>❌</button></td>
      `;
      row.querySelector(".delete-btn").addEventListener("click", function () {
        row.remove();
        updateTotals();
        updateRowColors();
      });

      row.classList.add("row-animate");
      const tbody = document.getElementById("productBody");
      tbody.insertBefore(row, tbody.firstChild);
      updateTotals();
      updateRowColors();
      speak(`${num} บาท`);
    } else {
      speak("ไม่มี");
    }
  }
}


function updateRowColors_DEPRECATED() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    row.style.backgroundColor = index % 2 === 0 ? "#f2f2f2" : "#ffffff";
  });
}


function updateTotals() {
  const rows = document.querySelectorAll("#productBody tr");
  totalPrice = 0;
  totalQty = 0;

  rows.forEach(row => {
    const qtyInput = row.querySelector("input[type='number']");
    const qty = parseInt(qtyInput.value);
    const unitPrice = parseFloat(row.querySelector(".item-row-price").getAttribute("data-unit-price") || row.querySelector(".item-row-price").textContent);
    const itemTotal = qty * unitPrice;
    row.querySelector(".item-row-price").textContent = itemTotal.toFixed(0);
    totalQty += qty;
    totalPrice += itemTotal;
    if (!row.querySelector(".item-row-price").getAttribute("data-unit-price")) {
      row.querySelector(".item-row-price").setAttribute("data-unit-price", unitPrice);
    }
  });

  document.getElementById("totalQty").textContent = `${totalQty} รายการ`;
  document.getElementById("totalPrice").textContent = `${totalPrice.toFixed(0)}`;
  const summaryBox = document.querySelector(".summary-box");
  summaryBox.classList.add("animate-grow");
  setTimeout(() => summaryBox.classList.remove("animate-grow"), 300);
  calculateChange();
}

let calculateSpeakTimer = null;

function calculateChange() {
  const receivedInput = document.getElementById("received");
  const changeBox = document.getElementById("changeAmount");
  const received = parseFloat(receivedInput.value);
  const summaryBox = document.querySelector(".summary-box");

  if (!receivedInput.value || isNaN(received)) {
    changeBox.textContent = "0";
    summaryBox.classList.remove("animate-shrink");
    clearTimeout(calculateSpeakTimer); // ป้องกันเสียงค้าง
    return;
  }

  const change = received - totalPrice;
  changeBox.textContent = `${change.toFixed(0)}`;
  summaryBox.classList.add("animate-shrink");

  changeBox.classList.remove("animate-grow");
  void changeBox.offsetWidth;
  changeBox.classList.add("animate-grow");

  // ✅ ✅ ✅ เพิ่มดีเลย์การพูดเมื่อหยุดพิมพ์แล้ว 1 วินาที
  clearTimeout(calculateSpeakTimer);
  calculateSpeakTimer = setTimeout(() => {
    if (change >= 0) {
      speak(`รับเงิน ${received.toFixed(0)} บาท`);
      setTimeout(() => speak(`เงินทอน ${change.toFixed(0)} บาท`), 800);
    } else {
      speak(`รับเงินไม่พอ`);
    }
  }, 1000); // ← รอ 1 วิ หลังหยุดพิมพ์
}



function clearAll() {
  document.getElementById("productBody").innerHTML = "";
  document.getElementById("received").value = "";
  totalPrice = 0;
  totalQty = 0;
  updateTotals();
  const summaryBox = document.querySelector(".summary-box");
  summaryBox.classList.remove("animate-shrink");
  summaryBox.style.opacity = "1";
}

function saveToLocalSummary() {
  const now = new Date();
  const dateKey = now.toLocaleDateString("th-TH");
  let summary = JSON.parse(localStorage.getItem("posSummary")) || {};
  
   // ✅ ทำความสะอาดก่อน
  summary = cleanupOldSummary(summary);

 if (summary[dateKey]) {
  summary[dateKey].price += totalPrice;
  summary[dateKey].qty += totalQty;
} else {
  summary[dateKey] = { price: totalPrice, qty: totalQty };
}


  localStorage.setItem("posSummary", JSON.stringify(summary));
  updateTodaySummaryBox();
}

function updateTodaySummaryBox() {
  const dateKey = new Date().toLocaleDateString("th-TH");
  const summary = JSON.parse(localStorage.getItem("posSummary")) || {};
  const todayTotal = summary[dateKey] || { price: 0, qty: 0 };
  document.getElementById("todayTotal").textContent = `ขายได้ ${todayTotal.qty} ชิ้น รวมยอด ฿${todayTotal.price.toFixed(2)}`;

}

// เรียกทันทีเมื่อโหลดหน้า
updateTodaySummaryBox();

function updateRowColors_OLD() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    row.style.backgroundColor = index % 2 === 0 ? "#f2f2f2" : "#ffffff";
  });
}


function updateRowColors_OLD() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    row.removeAttribute("class");
    row.style.backgroundColor = (index % 2 === 0) ? "#f2f2f2" : "#ffffff";
  });
}


function updateRowColors() {
  const rows = document.querySelectorAll("#productBody tr");
  rows.forEach((row, index) => {
    const bg = (index % 2 === 0) ? "#f2f2f2" : "#ffffff";
    row.querySelectorAll("td").forEach(cell => {
      cell.style.backgroundColor = bg;
    });
  });
}


function showReceiptPopup() {
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "55%";
  popup.style.transform = "translate(-50%, -50%)"; // <<< ให้กลางจริง
  popup.style.padding = "15px";
  popup.style.backgroundColor = "white";
  popup.style.color = "black";
  popup.style.border = "1px solid #ccc";
  popup.style.zIndex = "9999";
  popup.style.width = "300px";
  popup.style.fontFamily = "monospace";
  popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  popup.innerHTML = generateReceiptHTML();
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 5000);
}


function generateReceiptHTML() {
  const rows = document.querySelectorAll("#productBody tr");
  let listHTML = "<table style='width:100%; border-collapse: collapse; font-size: 12px;'>"
               + "<tr><th style='text-align:left;'>สินค้า</th><th style='text-align:center;'>จำนวน</th><th style='text-align:right;'>ราคา</th></tr>";

  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    const name = cols[1].textContent;
    const qty = cols[2].querySelector("input").value;
    const price = cols[3].textContent;
    listHTML += "<tr>"
              + `<td>${name}</td>`
              + `<td style='text-align:center;'>${qty}</td>`
              + `<td style='text-align:right;'>฿${price}</td>`
              + "</tr>";
  });

  listHTML += "</table>";

  const date = new Date();
  const time = date.toLocaleTimeString("th-TH");
  const dateStr = date.toLocaleDateString("th-TH");

  const received = parseFloat(document.getElementById("received").value || 0);
  const change = received - totalPrice;

  return `
    <div style="text-align:left;">
      <strong style="font-size:16px;">ร้านเจ้พิน</strong><br>
      <small>${dateStr} ${time}</small><br><hr>
      ${listHTML}<hr>
      <div style="text-align:right;">
        รวม: ฿${totalPrice.toFixed(2)}<br>
        รับเงิน: ฿${received.toFixed(2)}<br>
        เงินทอน: ฿${change.toFixed(2)}<br><br>
      </div>
      <div style="text-align:center;">ขอบคุณที่อุดหนุน ❤️</div>
    </div>
  `;
}

function saveReceiptToHistory(receiptHTML) {
  let history = JSON.parse(localStorage.getItem("receiptHistory")) || [];
  history.push(receiptHTML);

  if (history.length > 200) {
    history.shift(); // ลบใบแรกออก
  }

  localStorage.setItem("receiptHistory", JSON.stringify(history));
}


function showReceiptHistory() {
  const history = JSON.parse(localStorage.getItem("receiptHistory")) || [];
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "80vw";
  container.style.height = "100vh";
  container.style.overflowY = "scroll";
  container.style.overflow = "auto";
  container.style.background = "rgba(0,0,0,0.7)";
  container.style.zIndex = "9999";
  container.style.padding = "30px";
  container.style.color = "#000";

  let html = "<div style='background:white; padding:12px; max-width:500px; font-size:12px; margin:auto; border-radius:10px;'>";
  html += `<h3>ใบเสร็จย้อนหลัง (${history.length} ใบ)</h3><hr>`;
  for (let i = history.length - 1; i >= 0; i--) {
    html += `<div style='margin-bottom:20px; border-bottom:1px dashed #ccc;'>${history[i]}</div>`;
  }
html += "<button onclick='this.closest(`div`).parentElement.remove()' style='position:absolute; top:25px; right:370px;'>ปิด</button>";
html += `<h3 style='text-align:center;'>ใบเสร็จย้อนหลัง (${history.length} ใบ)</h3><hr>`;

  container.innerHTML = html;
  document.body.appendChild(container);
}


function updateDateTime() {
  const now = new Date();

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

  document.querySelector('.date').textContent = now.toLocaleDateString('th-TH', dateOptions);
  document.querySelector('.time').textContent = now.toLocaleTimeString('th-TH', timeOptions);
}

// เรียกทุกวินาที
setInterval(updateDateTime, 1000);

// เรียกครั้งแรก
updateDateTime();

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH"; // ตั้งค่าให้พูดภาษาไทย
  utterance.rate = 1.0;     // ความเร็วในการพูด (1.0 = ปกติ)
  speechSynthesis.speak(utterance);
}

function cleanupOldSummary(summary) {
  const today = new Date();
  const maxDays = 60;

  const sortedKeys = Object.keys(summary).sort((a, b) => {
    const [da, ma, ya] = a.split('/');
    const [db, mb, yb] = b.split('/');
    const dateA = new Date(+ya - 543, +ma - 1, +da);
    const dateB = new Date(+yb - 543, +mb - 1, +db);
    return dateA - dateB;
  });

  // ถ้ามากกว่า 60 วัน → ตัดทิ้ง
  while (sortedKeys.length > maxDays) {
    const oldestKey = sortedKeys.shift();
    delete summary[oldestKey];
  }

  return summary;
}

function showLastDays(days) {
  const summary = JSON.parse(localStorage.getItem("posSummary")) || {};
  const now = new Date();
  let totalPrice = 0;
  let totalQty = 0;

  Object.keys(summary).forEach(dateKey => {
    const [d, m, y] = dateKey.split('/');
    const date = new Date(+y - 543, +m - 1, +d);
    const diff = (now - date) / (1000 * 60 * 60 * 24);
    if (diff <= days) {
      const item = summary[dateKey];
      if (item && typeof item.price === 'number' && typeof item.qty === 'number') {
      totalPrice += item.price;
      totalQty += item.qty;
      }
    }
  });

	const rangeBox = document.getElementById("rangeTotal");
	rangeBox.textContent = `${totalQty} ชิ้น / ฿${totalPrice.toFixed(2)}`;
	rangeBox.classList.remove("hidden");
	rangeBox.style.display = "block";
	rangeBox.offsetHeight; // trigger reflow

	clearTimeout(rangeTimer);
	rangeTimer = setTimeout(() => {
	  rangeBox.classList.add("hidden");
	  setTimeout(() => {
		rangeBox.style.display = "none";
	  }, 500); // รอ animation จบ
	}, 10000);

}

flatpickr("#customRange", {
  mode: "range",
  dateFormat: "d/m/Y",
  locale: "th",

  formatDate: (date, format, locale) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = (date.getFullYear() + 543).toString(); // แปลงเป็น พ.ศ.
    return `${d}/${m}/${y}`;
  },

  // ✨ ส่วนแสดง พ.ศ. ในปฏิทิน (ยังใช้เหมือนเดิม)
  onReady: ([selectedDates], dateStr, instance) => {
    convertToBuddhistYear(instance);
  },
  onMonthChange: function(selectedDates, dateStr, instance) {
    convertToBuddhistYear(instance);
  },
  onYearChange: function(selectedDates, dateStr, instance) {
    convertToBuddhistYear(instance);
  },
  onOpen: function(selectedDates, dateStr, instance) {
    convertToBuddhistYear(instance);
  },

  // ✅ ฟังก์ชันเดิมของคุณ
  onChange: function (selectedDates) {
  if (selectedDates.length === 2) {
    const summary = JSON.parse(localStorage.getItem("posSummary")) || {};
    const [startRaw, endRaw] = selectedDates;

    const normalizeDate = (d) => {
      const year = d.getFullYear();
      const realYear = year > 2500 ? year - 543 : year;
      return new Date(realYear, d.getMonth(), d.getDate());
    };

    const start = normalizeDate(startRaw);
    const end = normalizeDate(endRaw);

    let totalPrice = 0;
    let totalQty = 0;

    Object.keys(summary).forEach(dateKey => {
      const [d, m, y] = dateKey.split('/');
      const current = new Date(+y - 543, +m - 1, +d);

      if (current >= start && current <= end) {
        const item = summary[dateKey];
        totalPrice += item.price;
        totalQty += item.qty;
      }
    });

    const resultBox = document.getElementById("rangeTotal");
    if (totalPrice === 0 && totalQty === 0) {
      resultBox.textContent = "ไม่พบข้อมูล";
    } else {
      resultBox.textContent = `${totalQty} ชิ้น / ${totalPrice.toFixed(2)}฿`;
    }

    resultBox.classList.remove("hidden");
    resultBox.style.display = "block";
    resultBox.offsetHeight;

    clearTimeout(rangeTimer);
    rangeTimer = setTimeout(() => {
      resultBox.classList.add("hidden");
      setTimeout(() => {
        resultBox.style.display = "none";
      }, 500);
    }, 10000);
  }
}

});



function convertToBuddhistYear(fpInstance) {
  setTimeout(() => {
    const yearElements = fpInstance.calendarContainer.querySelectorAll(".flatpickr-current-month .cur-year");
    yearElements.forEach(el => {
      const year = parseInt(el.value || el.innerText);
      if (year < 2500) {
        const buddhistYear = year + 543;
        el.value = buddhistYear;
        el.innerText = buddhistYear;
      }
    });
  }, 5);
}

function showYesterday() {
  const summary = JSON.parse(localStorage.getItem("posSummary")) || {};
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const key = yesterday.toLocaleDateString("th-TH");
  const value = summary[key];
  const rangeBox = document.getElementById("rangeTotal");

  if (value) {
    rangeBox.textContent = `${value.qty} ชิ้น / ฿${value.price.toFixed(2)}`;
  } else {
    rangeBox.textContent = `ไม่มีข้อมูล`;
  }

  rangeBox.classList.remove("hidden");
  rangeBox.style.display = "block";
  rangeBox.offsetHeight;

  clearTimeout(rangeTimer);
  rangeTimer = setTimeout(() => {
    rangeBox.classList.add("hidden");
    setTimeout(() => {
      rangeBox.style.display = "none";
    }, 500);
  }, 10000);
}

function hasProductsInTable() {
  return document.querySelectorAll("#productBody tr").length > 0;
}

// ✅ ให้ Enter ใช้แทนการกด "บันทึก" ใน popup เพิ่มสินค้า
document.addEventListener("keydown", function (e) {
  const popup = document.getElementById("productPopup");
  const isVisible = popup && popup.style.display === "flex";

  // กด Enter ขณะ popup เปิด
  if (isVisible && e.key === "Enter") {
    e.preventDefault(); // ป้องกัน Enter ไปกระตุ้นฟอร์มอื่น
    document.getElementById("saveProductBtn").click(); // คลิกปุ่มบันทึก
  }
});

window.addEventListener("load", () => {
  const localData = localStorage.getItem("productList");
  if (localData) {
    productList = JSON.parse(localData);
    console.log("✅ โหลดสินค้าจาก localStorage แล้ว", productList);
  } else {
    fetchAndStoreProductList(); // ถ้าไม่มีใน local ให้โหลดจากเน็ต
  }
    const held = localStorage.getItem("heldBills");
    if (held) {
      const parsed = JSON.parse(held);
      if (Array.isArray(parsed) && parsed.length > 0) {
        heldBills = parsed;
        renderHeldBills();
      }
    }
});

// โหลดจาก Google Sheets แล้วเก็บไว้ใน localStorage
function fetchAndStoreProductList() {
  fetch("https://script.google.com/macros/s/AKfycbwoK3qwfpO4BXTpSN3jKxL4hXdp1E4YiuN2O-Z2Qa1He-b1k2TAPrxjoVlWDSdXOISH/exec")
    .then(res => res.json())
    .then(data => {
      productList = data;
      localStorage.setItem("productList", JSON.stringify(data));
      console.log("✅ โหลดจาก Google Sheets แล้วบันทึกไว้ใน localStorage", productList);
    })
    .catch(err => {
      console.error("❌ โหลดจาก Google Sheets ล้มเหลว", err);
    });
}
    
    // ✅ เพิ่มเงื่อนไขพักบิล

let heldBills = []; // เก็บบิลที่พักไว้

function holdCurrentBill() {
  const rows = document.querySelectorAll("#productBody tr");
  if (rows.length === 0) {
    return;
  }

  const items = Array.from(rows).map(row => {
  const cols = row.querySelectorAll("td");
  const unitPrice = parseFloat(cols[3].getAttribute("data-unit-price") || cols[3].textContent);
  const qty = parseInt(cols[2].querySelector("input").value);

  return {
    code: cols[0].textContent,
    name: cols[1].textContent,
    qty: qty,
    unitPrice: unitPrice
  };
});


  const total = totalPrice;
  const timestamp = new Date().getTime();
  heldBills.push({ id: timestamp, items, total });
  localStorage.setItem("heldBills", JSON.stringify(heldBills));
  renderHeldBills();
  clearAll();
}

function renderHeldBills(activeIndex = -1) {
  const existing = document.getElementById("heldBillPopup");
  if (existing) existing.remove();

  if (heldBills.length === 0) return;

  const container = document.createElement("div");
  container.id = "heldBillPopup";
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.zIndex = "9999";
  container.style.background = "#f39c12";
  container.style.color = "#fff";
  container.style.padding = "10px";
  container.style.borderRadius = "10px";
  container.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  container.style.width = "180px";
  container.style.height = "5vh";
  container.style.overflowY = "auto";
  container.style.boxSizing = "border-box";

  for (let displayIndex = 0; displayIndex < heldBills.length; displayIndex++) {
  const i = heldBills.length - 1 - displayIndex; // แปลง index แสดง → index จริง

    const bill = heldBills[i];
    const btn = document.createElement("button");
    btn.style.display = "block";
    btn.style.margin = "5px 0";
    btn.style.padding = "8px";
    btn.style.width = "100%";
    btn.style.fontSize = "13px";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";
    btn.style.background = "#e67e22";
    btn.textContent = `พักบิล ${i + 1} - ฿${bill.total.toFixed(0)}`;
    btn.onclick = () => {
      currentHeldIndex = displayIndex;
      restoreHeldBill(displayIndex, true);
      };

    if (displayIndex === activeIndex) {
      btn.style.transform = "scale(1.5)";
      btn.style.transition = "transform 0.3s ease";
      btn.style.boxShadow = "0 0 10px white";
      btn.style.color = "black";
      setTimeout(() => {
        btn.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 10);
    }

    container.appendChild(btn);
  }

  document.body.appendChild(container);
}


function restoreHeldBill(index, animate = false) {
  // 👉 เก็บ index ที่เรียกกลับมาไว้เพื่อลบตอนกด Enter
  const realIndex = heldBills.length - 1 - index;   // index จริงในอาเรย์
  currentHeldIndex = realIndex;                     // ⭐ สำคัญมาก
  hasClearedHeldBill = false;                       // รอลบหลังคิดเงินเสร็จ

  clearAll();

  const bill = heldBills[realIndex];
  bill.items.forEach(item => {
    const row = document.createElement("tr");
    const total = item.unitPrice * item.qty;
    row.innerHTML = `
      <td>${item.code}</td>
      <td>${item.name}</td>
      <td><input type='number' value='${item.qty}' min='1'
                 oninput='updateTotals()' style='width: 23px;'></td>
      <td class='item-row-price' data-unit-price='${item.unitPrice}'>${total.toFixed(0)}</td>
      <td><button class='delete-btn'>❌</button></td>
    `;
    row.querySelector(".delete-btn").addEventListener("click", () => {
      row.remove();
      updateTotals();
      updateRowColors();
    });
    document.getElementById("productBody").appendChild(row);
  });

  updateTotals();
  updateRowColors();

  renderHeldBills(index);          // เอาไว้ไฮไลท์บิลใน popup ได้ถ้าต้องการ
  //localStorage.setItem("heldBills", JSON.stringify(heldBills));
}



document.getElementById("holdBillBtn").addEventListener("click", holdCurrentBill);
