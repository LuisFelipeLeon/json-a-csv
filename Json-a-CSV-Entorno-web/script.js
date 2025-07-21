const fileInput = document.getElementById("fileInput");
const sortKeySelect = document.getElementById("sortKey");
const downloadBtn = document.getElementById("downloadBtn");
const excelBtn = document.getElementById("excelBtn");
const jsonPreview = document.getElementById("jsonPreview");

let jsonDataOriginal = [];
let jsonData = [];

// 🌙 Modo oscuro con toggle e ícono
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  themeIcon.textContent = "☀️";
} else {
  themeIcon.textContent = "🌙";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  themeIcon.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// 📂 Cargar archivo JSON
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const raw = JSON.parse(e.target.result);
      let content;

      // 1. Caso arreglo directamente
      if (Array.isArray(raw)) {
        content = raw;

      // 2. Caso objeto con propiedad `result` que es arreglo
      } else if (Array.isArray(raw.result)) {
        content = raw.result;

      // 3. Caso OpenAPI o Swagger con propiedad paths
      } else if (raw.paths && typeof raw.paths === "object") {
        content = [];

        for (const [path, methods] of Object.entries(raw.paths)) {
          for (const [method, details] of Object.entries(methods)) {
            content.push({
              path,
              method,
              operationId: details.operationId || "",
              description: details?.responses?.default?.description || "",
            });
          }
        }

      } else {
        alert("El archivo JSON no contiene un array válido.");
        return;
      }

      jsonDataOriginal = [...content];
      jsonData = [...content];

      const keys = Object.keys(jsonData[0] || {});
      sortKeySelect.innerHTML = `
        <option value="">(sin ordenar)</option>
        ${keys.map(k => `<option value="${k}">${k}</option>`).join("")}
      `;

      sortKeySelect.disabled = false;
      downloadBtn.disabled = false;
      excelBtn.disabled = false;

      jsonPreview.textContent = JSON.stringify(jsonData, null, 2);
      renderTable(jsonData);
    } catch (err) {
      alert("Error al leer el archivo JSON");
      console.error(err);
    }
  };
  reader.readAsText(file);
});

// 🔀 Ordenar por clave
sortKeySelect.addEventListener("change", () => {
  const key = sortKeySelect.value;

  if (!key) {
    jsonData = [...jsonDataOriginal];
  } else {
    jsonData.sort((a, b) => {
      const valA = a[key] ?? "";
      const valB = b[key] ?? "";
      return valA < valB ? -1 : valA > valB ? 1 : 0;
    });
  }

  jsonPreview.textContent = JSON.stringify(jsonData, null, 2);
  renderTable(jsonData);
});

// 📤 Descargar CSV
downloadBtn.addEventListener("click", () => {
  if (!jsonData.length) return;

  const headers = Object.keys(jsonData[0]);
  const csvRows = [headers.join(",")];

  for (const row of jsonData) {
    const values = headers.map(h => JSON.stringify(row[h] ?? ""));
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "csv_jsonrealizado.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// 📤 Descargar Excel
excelBtn.addEventListener("click", () => {
  if (!jsonData.length) return;

  const worksheet = XLSX.utils.json_to_sheet(jsonData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
  XLSX.writeFile(workbook, "jsonCsv_ordenado_full.xlsx");
});

// 🖼️ Renderizar tabla visual
function renderTable(data) {
  const container = document.getElementById("tableContainer");
  container.innerHTML = "";

  if (!data.length) {
    container.textContent = "No hay datos para mostrar.";
    return;
  }

  const table = document.createElement("table");
  const thead = table.createTHead();
  const headerRow = thead.insertRow();

  Object.keys(data[0]).forEach(key => {
    const th = document.createElement("th");
    th.textContent = key;
    headerRow.appendChild(th);
  });

  const tbody = table.createTBody();
  data.forEach(row => {
    const tr = tbody.insertRow();
    Object.values(row).forEach(value => {
      const td = tr.insertCell();
      td.textContent = value ?? "";
    });
  });

  container.appendChild(table);
}

