const fileInput = document.getElementById("fileInput");
const sortKeySelect = document.getElementById("sortKey");
const downloadBtn = document.getElementById("downloadBtn");
const jsonPreview = document.getElementById("jsonPreview");

let jsonDataOriginal = []; // copia original sin ordenar
let jsonData = [];

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

      jsonDataOriginal = [...content]; // Guardamos una copia original
      jsonData = [...content];

      // Poblar el selector con claves
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

sortKeySelect.addEventListener("change", () => {
  const key = sortKeySelect.value;

  if (!key) {
    jsonData = [...jsonDataOriginal]; // Restaurar original
  } else {
    jsonData.sort((a, b) => {
      if (a[key] < b[key]) return -1;
      if (a[key] > b[key]) return 1;
      return 0;
    });
  }

  jsonPreview.textContent = JSON.stringify(jsonData, null, 2);
});

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