const fileInput = document.getElementById("fileInput");
const sortKeySelect = document.getElementById("sortKey");
const downloadBtn = document.getElementById("downloadBtn");
const jsonPreview = document.getElementById("jsonPreview");

let jsonDataOriginal = [];
let jsonData = [];

// 🌙 Tema con toggle + ícono
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// Aplicar tema guardado al cargar
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  themeIcon.textContent = "☀️";
} else {
  themeIcon.textContent = "🌙";
}

// Toggle del tema
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const isDark = document.body.classList.contains("dark-mode");
  themeIcon.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// 🚀 Carga de archivo
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const raw = JSON.parse(e.target.result);
      const content = Array.isArray(raw) ? raw : raw.result;

      if (!Array.isArray(content)) {
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

      jsonPreview.textContent = JSON.stringify(jsonData, null, 2);
    } catch (err) {
      alert("Error al leer el archivo JSON");
      console.error(err);
    }
  };
  reader.readAsText(file);
});

// Ordenar al seleccionar clave
sortKeySelect.addEventListener("change", () => {
  const key = sortKeySelect.value;

  if (!key) {
    jsonData = [...jsonDataOriginal];
  } else {
    jsonData.sort((a, b) => {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
      return 0;
    });
  }

  jsonPreview.textContent = JSON.stringify(jsonData, null, 2);
});

// Descargar CSV
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
  a.download = "json_ordenado_full.csv";
  a.click();
  URL.revokeObjectURL(url);
});
