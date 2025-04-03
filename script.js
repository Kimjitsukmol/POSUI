// ไฟล์ script.js

let productList = [];
let totalPrice = 0;
let totalQty = 0;
let rangeTimer = null;

let isEnterPressed = false;
let isBackspacePressed = false;

fetch("products.json")
  .then(response => response.json())
  .then(data => {
    productList = data;
    console.log("✅ โหลด products.json สำเร็จแล้ว", productList);
  })
  .catch(error => {
    console.error("❌ โหลด products.json ล้มเหลว:", error);
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
  }
});

//flatpickr("#calendar", {
  //dateFormat: "dd/MM/yyyy",
  //locale: "th",
  //onChange: function (selectedDates) {
    //const summary = JSON.parse(localStorage.getItem("posSummary")) || {};
    //const selected = new Date(selectedDates[0]);
    //const key = selected.toLocaleDateString("th-TH");
    //const value = summary[key] || 0;
    //document.getElementById("selectedTotal").textContent = `ยอดรวม: ฿${value.price.toFixed(2)} (${value.qty} ชิ้น)`;
  //}
//});

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
		<td><button class='edit-btn' style="font-size: 15px; padding: 2px 6px;">✏️</button></td>
      `;
      row.querySelector(".delete-btn").addEventListener("click", function () {
        row.remove();
        updateTotals();
        updateRowColors();
      });
	  row.querySelector(".edit-btn").addEventListener("click", function () {
	  openEditPopup(productList[i], row);
	});

		row.classList.add("row-animate"); // 👈 เพิ่มตรงนี้ก่อน insert
	   const tbody = document.getElementById("productBody");
	   tbody.insertBefore(row, tbody.firstChild);
       updateTotals();
       updateRowColors();
       const unitPrice = productList[i]["ราคาขาย"];
       speak(`${unitPrice} บาท`);
       //ชิ้นที่ ${totalQty}
       found = true;
      break;
    }
  }
  if (!found) {
    speak("ไม่มี"); // ✅ กรณีไม่พบ
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

function calculateChange() {
  const receivedInput = document.getElementById("received");
  const changeBox = document.getElementById("changeAmount");
  const received = parseFloat(receivedInput.value);
  const summaryBox = document.querySelector(".summary-box");

  if (!receivedInput.value || isNaN(received)) {
    changeBox.textContent = "";
    summaryBox.classList.remove("animate-shrink");
    return;
  }
	
  const change = received - totalPrice;
  changeBox.textContent = `${change.toFixed(0)}`;
  summaryBox.classList.add("animate-shrink");

	changeBox.classList.remove("animate-grow"); // reset ก่อน
	void changeBox.offsetWidth; // รีเฟรช DOM เพื่อให้ animation เล่นได้ทุกครั้ง
	changeBox.classList.add("animate-grow");


  // ✅ พูดหลังจากผ่านไป 3 วินาที
  clearTimeout(window.changeSpeakTimer); // ยกเลิกการพูดครั้งก่อนถ้ามี
  window.changeSpeakTimer = setTimeout(() => {
    if (change >= 0) {
      speak(`เงินทอน ${change.toFixed(0)} บาท`);
    } else {
      speak(`รับเงินไม่พอ`);
    }
  }, 700);
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


document.getElementById("addProductBtn").addEventListener("click", () => {
  document.getElementById("productPopup").style.display = "flex";
});

function closePopup() {
  document.getElementById("productPopup").style.display = "none";
  document.getElementById("newCode").value = "";
  document.getElementById("newName").value = "";
  document.getElementById("newPrice").value = "";
}

document.getElementById("saveProductBtn").addEventListener("click", () => {
  const code = document.getElementById("newCode").value.trim();
  const name = document.getElementById("newName").value.trim();
  const price = document.getElementById("newPrice").value.trim();

  if (!/^[0-9]+$/.test(code)) {
    alert("รหัสสินค้าต้องเป็นตัวเลขเท่านั้น");
    return;
  }

  if (!name) {
    alert("กรุณากรอกชื่อสินค้า");
    return;
  }

  if (!price || isNaN(price)) {
    alert("กรุณากรอกราคาขายเป็นตัวเลข");
    return;
  }

  // เพิ่มสินค้าใหม่เข้า productList
  productList.push({
    "รหัสสินค้า": code,
    "ชื่อสินค้า": name,
    "ราคาขาย": parseFloat(price)
  });
  closePopup();
});

let currentEditRow = null;
let currentEditItem = null;

function openEditPopup(product, row) {
  document.getElementById("editName").value = product["ชื่อสินค้า"];
  document.getElementById("editPrice").value = product["ราคาขาย"];
  document.getElementById("editPopup").style.display = "flex";

  currentEditRow = row;
  currentEditItem = product;
}

function closeEditPopup() {
  document.getElementById("editPopup").style.display = "none";
  currentEditRow = null;
  currentEditItem = null;
}

document.getElementById("saveEditBtn").addEventListener("click", () => {
  const newName = document.getElementById("editName").value.trim();
  const newPrice = parseFloat(document.getElementById("editPrice").value.trim());

  if (!newName || isNaN(newPrice)) {
    alert("กรุณากรอกข้อมูลให้ถูกต้อง");
    return;
  }

  // อัปเดตใน productList
  currentEditItem["ชื่อสินค้า"] = newName;
  currentEditItem["ราคาขาย"] = newPrice;

  // อัปเดตในตาราง
  const cells = currentEditRow.querySelectorAll("td");
  cells[1].textContent = newName;
  cells[3].textContent = newPrice.toFixed(2);

  closeEditPopup();
  updateTotals(); // อัปเดตราคารวม
});

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

