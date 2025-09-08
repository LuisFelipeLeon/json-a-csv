const fileInput = document.getElementById("fileInput");
const fileMultiInput = document.getElementById("fileMultiInput");

const sortKeySelect = document.getElementById("sortKey");

const downloadBtn = document.getElementById("downloadBtn");
const excelBtn = document.getElementById("excelBtn");

const mergeBtn = document.getElementById("mergeBtn");
const mergeExcelBtn = document.getElementById("mergeExcelBtn");

const jsonPreview = document.getElementById("jsonPreview");

// Estado
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

/* ------------------------------
   Utilidades
--------------------------------*/
function extractContent(raw) {
  // 1) Arreglo directamente
  if (Array.isArray(raw)) return raw;

  // 2) Objeto con `result` arreglo (compatible con tu versión actual)
  if (raw && Array.isArray(raw.result)) return raw.result;

  // 3) OpenAPI/Swagger con `paths`
  if (raw && raw.paths && typeof raw.paths === "object") {
    const out = [];
    for (const [path, methods] of Object.entries(raw.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        out.push({
          path,
          method,
          operationId: details?.operationId || "",
          description: details?.responses?.default?.description || "",
        });
      }
    }
    return out;
  }

  // 4) Fallback: objeto suelto
  if (raw && typeof raw === "object") return [raw];

  // No válido
  return null;
}

function enableSingleControls(enabled) {
  sortKeySelect.disabled = !enabled;
  downloadBtn.disabled = !enabled;
  excelBtn.disabled = !enabled;
}

function enableMultiControls(enabled) {
  sortKeySelect.disabled = !enabled;
  mergeBtn.disabled = !enabled;
  mergeExcelBtn.disabled = !enabled;
}

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

function refreshPreviewAndSortOptions() {
  const keys = Object.keys(jsonData[0] || {});
  sortKeySelect.innerHTML = `
    <option value="">(sin ordenar)</option>
    ${keys.map(k => `<option value="${k}">${k}</option>`).join("")}
  `;
  jsonPreview.textContent = JSON.stringify(jsonData, null, 2);
  renderTable(jsonData);
}

function toCsvString(data) {
  const headers = Object.keys(data[0] || {});
  const csvRows = [headers.join(",")];
  for (const row of data) {
    const values = headers.map(h => JSON.stringify(row[h] ?? ""));
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
}

function downloadBlob(content, name, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------
   Carga de archivo único
--------------------------------*/
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const raw = JSON.parse(e.target.result);
      const content = extractContent(raw);

      if (!content) {
        alert("El archivo JSON no contiene un array válido.");
        return;
      }

      jsonDataOriginal = [...content];
      jsonData = [...content];

      enableSingleControls(true);   // activa CSV/XLSX de archivo único
      enableMultiControls(false);   // no activamos merge hasta que seleccionen múltiples

      refreshPreviewAndSortOptions();
    } catch (err) {
      alert("Error al leer el archivo JSON");
      console.error(err);
    }
  };
  reader.readAsText(file);
});

/* ------------------------------
   Carga de múltiples archivos
--------------------------------*/
fileMultiInput.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  let combined = [];
  for (const f of files) {
    try {
      const text = await f.text();
      const raw = JSON.parse(text);
      const content = extractContent(raw);
      if (!content) {
        // si alguno no es válido, seguimos con los demás
        console.warn(`Archivo no válido: ${f.name}`);
        continue;
      }
      combined.push(...content);
    } catch (e) {
      console.warn(`Error al leer ${f.name}:`, e);
    }
  }

  if (!combined.length) {
    alert("No se pudo unificar datos de los archivos seleccionados.");
    return;
  }

  jsonDataOriginal = [...combined];
  jsonData = [...combined];

  // Para flujo múltiples: activa botones de merge
  enableSingleControls(false);
  enableMultiControls(true);

  refreshPreviewAndSortOptions();
});

/* ------------------------------
   Ordenamiento
--------------------------------*/
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

/* ------------------------------
   Descargas (archivo único)
--------------------------------*/
downloadBtn.addEventListener("click", () => {
  if (!jsonData.length) return;
  const csvContent = toCsvString(jsonData);
  downloadBlob(csvContent, "csv_jsonrealizado.csv", "text/csv");
});

excelBtn.addEventListener("click", () => {
  if (!jsonData.length) return;
  const worksheet = XLSX.utils.json_to_sheet(jsonData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
  XLSX.writeFile(workbook, "jsonCsv_ordenado_full.xlsx");
});

/* ------------------------------
   Descargas (múltiples)
--------------------------------*/
mergeBtn.addEventListener("click", () => {
  if (!jsonData.length) return;
  const csvContent = toCsvString(jsonData);
  downloadBlob(csvContent, "merged_json.csv", "text/csv");
});

mergeExcelBtn.addEventListener("click", () => {
  if (!jsonData.length) return;
  const worksheet = XLSX.utils.json_to_sheet(jsonData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
  XLSX.writeFile(workbook, "merged_json.xlsx");
});
