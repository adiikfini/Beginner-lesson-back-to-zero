// Konstanta
const MAX_AMOUNT = 1_000_000_000;

// Elemen DOM
const incomeForm = document.getElementById("expense-form-in");
const incomeName = document.getElementById("expense-name-in");
const incomeAmount = document.getElementById("expense-amount-in");

const cashoutForm = document.getElementById("expense-form-out");
const cashoutName = document.getElementById("expense-name-out");
const cashoutAmount = document.getElementById("expense-amount-out");

const totalDisplay = document.getElementById("total-amount");
const toggleBtn = document.getElementById("toggle-dark");
const ctx = document.getElementById("expense-chart").getContext("2d");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let filtered = [...expenses];
let chart = null;

// Fungsi notifikasi
function showNotification(message, type = "success") {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.style.display = "block";
  notif.style.backgroundColor = type === "success" ? "#d4edda" : "#f8d7da";
  notif.style.color = type === "success" ? "#155724" : "#721c24";
  notif.style.border =
    type === "success" ? "1px solid #c3e6cb" : "1px solid #f5c6cb";
  notif.classList.add("show");
  setTimeout(() => {
    notif.classList.remove("show");
  }, 3000);
}

// Fungsi ambil tanggal hari ini
function getToday() {
  return new Date().toISOString().split("T")[0];
}

// Fungsi reusable submit pemasukan/pengeluaran
function handleSubmit(nameInput, amountInput, type) {
  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);

  if (name.length > 50) {
    showNotification("Nama terlalu panjang!", "error");
    return;
  }
  if (!name || isNaN(amount) || amount <= 0) {
    showNotification(`Input ${type} tidak valid!`, "error");
    return;
  }
  if (amount > MAX_AMOUNT) {
    showNotification("Nominal terlalu besar!", "error");
    return;
  }

  expenses.push({ name, amount, type, date: getToday() });
  nameInput.value = "";
  amountInput.value = "";
  applyFilter();
  showNotification(
    `${
      type === "income" ? "Pemasukan" : "Pengeluaran"
    } berhasil ditambahkan ✅`,
    "success"
  );
}

// Event listener form
incomeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleSubmit(incomeName, incomeAmount, "income");
});

cashoutForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleSubmit(cashoutName, cashoutAmount, "cashout");
});

// Update chart
function updateChart(filteredExpenses = expenses) {
  if (chart) chart.destroy();
  if (filteredExpenses.length === 0) return;

  const labels = filteredExpenses.map((e) => `${e.name} (${e.type})`);
  const data = filteredExpenses.map((e) => Math.abs(e.amount));

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          label: "Transaksi (Rp)",
          data,
          backgroundColor: labels.map(
            () => `hsl(${Math.random() * 360}, 70%, 60%)`
          ),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
    },
  });
}

// Update tabel transaksi
function updateList(filteredExpenses = expenses) {
  const tableBody = document.getElementById("expense-body");
  tableBody.innerHTML = "";
  let total = 0;

  filteredExpenses.forEach((expense, index) => {
    const row = document.createElement("tr");

    const createCell = (text, className = "") => {
      const cell = document.createElement("td");
      cell.textContent = text;
      if (className) cell.className = className;
      return cell;
    };

    row.appendChild(createCell(index + 1));
    row.appendChild(createCell(expense.name));
    row.appendChild(
      createCell(expense.type, expense.type === "income" ? "income" : "cashout")
    );
    row.appendChild(createCell(expense.date ? expense.date.slice(0, 10) : "-"));
    row.appendChild(
      createCell(
        `Rp ${
          expense.type === "income" ? "+" : "-"
        }${expense.amount.toLocaleString("id-ID")}`
      )
    );

    const actionCell = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => editExpense(index);
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.onclick = () => removeExpense(index);
    actionCell.append(editBtn, deleteBtn);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
    total += expense.type === "income" ? expense.amount : -expense.amount;
  });

  totalDisplay.textContent = total.toLocaleString("id-ID");
  localStorage.setItem("expenses", JSON.stringify(expenses));
  updateChart(filteredExpenses);

  const exportBtn = document.getElementById("export-btn");
  if (exportBtn) exportBtn.disabled = filtered.length === 0;
}

// Edit transaksi
function editExpense(index) {
  const tableBody = document.getElementById("expense-body");
  const expense = filtered[index];
  const row = tableBody.children[index];
  row.innerHTML = "";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = expense.name;
  nameInput.style.width = "100%";

  const amountInput = document.createElement("input");
  amountInput.type = "number";
  amountInput.value = expense.amount;
  amountInput.style.width = "100%";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "💾";
  saveBtn.onclick = () => {
    const newName = nameInput.value.trim();
    const newAmount = parseInt(amountInput.value);
    if (
      !newName ||
      isNaN(newAmount) ||
      newAmount <= 0 ||
      newAmount > MAX_AMOUNT
    ) {
      showNotification("Data tidak valid saat edit!", "error");
      return;
    }

    const originalIndex = expenses.findIndex(
      (e) =>
        e.name === expense.name &&
        e.date === expense.date &&
        e.amount === expense.amount &&
        e.type === expense.type
    );
    if (originalIndex === -1) {
      showNotification("Data tidak ditemukan di database.", "error");
      return;
    }

    expenses[originalIndex].name = newName;
    expenses[originalIndex].amount = newAmount;
    applyFilter();
    showNotification("Data berhasil diperbarui ✅", "success");
  };

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "❌";
  cancelBtn.onclick = () => applyFilter();

  // Fungsi bantu membuat <td>
  const createCell = (content) => {
    const td = document.createElement("td");
    td.style.display = "table-cell";
    td.style.verticalAlign = "middle";
    if (typeof content === "string" || typeof content === "number") {
      td.textContent = content;
    } else {
      td.appendChild(content);
    }
    return td;
  };

  row.appendChild(createCell(index + 1)); // No
  row.appendChild(createCell(nameInput)); // Input nama
  row.appendChild(createCell(expense.type)); // Jenis
  row.appendChild(createCell(expense.date.slice(0, 10))); // Tanggal
  row.appendChild(createCell(amountInput)); // Input amount

  const actionTd = createCell(""); // Tombol aksi
  actionTd.appendChild(saveBtn);
  actionTd.appendChild(cancelBtn);
  row.appendChild(actionTd);
}
// Hapus transaksi
function removeExpense(index) {
  const target = filtered[index];
  const originalIndex = expenses.findIndex(
    (e) =>
      e.name === target.name &&
      e.date === target.date &&
      e.amount === target.amount &&
      e.type === target.type
  );
  if (originalIndex !== -1) {
    expenses.splice(originalIndex, 1);
    applyFilter();
  }
}

// Filter berdasarkan tanggal
function applyFilter() {
  const filterDate = document.getElementById("filter-date").value;
  filtered = filterDate
    ? expenses.filter((exp) => exp.date && exp.date.startsWith(filterDate))
    : [...expenses];
  updateList(filtered);
}

// Export ke Excel
function exportToExcel(data = filtered) {
  if (data.length === 0)
    return showNotification("Tidak ada data untuk diekspor.", "error");
  const sheetData = [
    ["Nama", "Jenis", "Tanggal", "Nominal"],
    ...data.map((e) => [e.name, e.type, e.date || "-", e.amount]),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
  XLSX.writeFile(workbook, "data-transaksi.xlsx");
  showNotification("Berhasil diekspor ke Excel ✅", "success");
}

// Reset filter
function resetFilter() {
  document.getElementById("filter-date").value = "";
  applyFilter();
}

// Toggle dark mode
function updateToggleText(isDark) {
  toggleBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

toggleBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("dark-mode", isDark ? "enabled" : "disabled");
  updateToggleText(isDark);
});

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("filter-date").value = "";
  const saved = localStorage.getItem("dark-mode");
  const isDark = saved === "enabled";
  if (isDark) document.body.classList.add("dark-mode");
  updateToggleText(isDark);
  applyFilter();
});


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((reg) => console.log("Service Worker registered ✅", reg))
      .catch((err) => console.error("Service Worker failed ❌", err));
  });
}


