// ===============================
// APP.JS - SEHATCARE APOTEK ONLINE
// Versi final: tombol memakai event listener agar pasti berjalan
// ===============================

let lastCatalog = [];

function getEl(id) {
  return document.getElementById(id);
}

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function getTime() {
  return new Date().toLocaleTimeString("id-ID");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let message = "Terjadi kesalahan saat mengambil data.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      message = await response.text();
    }

    throw new Error(message);
  }

  return await response.json();
}

function updateSummary({ strategy = "-", status = "-", source = "-", time = "-" }) {
  const summaryStrategy = getEl("summaryStrategy");
  const summaryStatus = getEl("summaryStatus");
  const summarySource = getEl("summarySource");
  const summaryTime = getEl("summaryTime");

  if (summaryStrategy) summaryStrategy.textContent = strategy;
  if (summaryStatus) summaryStatus.textContent = status;
  if (summarySource) summarySource.textContent = source;
  if (summaryTime) summaryTime.textContent = time;

  if (summaryStatus) {
    summaryStatus.className = "";
    const statusText = String(status).toUpperCase();

    if (statusText.includes("HIT")) {
      summaryStatus.classList.add("status-hit");
    } else if (statusText.includes("MISS")) {
      summaryStatus.classList.add("status-miss");
    } else {
      summaryStatus.classList.add("status-normal");
    }
  }
}

function addActivity(message) {
  const box = getEl("activityLog");
  if (!box) return;

  if (box.textContent.includes("Belum ada aktivitas")) {
    box.innerHTML = "";
  }

  const item = document.createElement("div");
  item.className = "activity-item";
  item.textContent = `[${getTime()}] ${message}`;

  box.prepend(item);
}

function setMiniResult(id, message) {
  const el = getEl(id);
  if (!el) return;
  el.innerHTML = message;
}

function renderCatalog(items) {
  const container = getEl("catalogContainer");
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        Data obat tidak ditemukan.
      </div>
    `;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const nama = escapeHTML(item.nama);
      const kategori = escapeHTML(item.kategori);
      const harga = formatRupiah(item.harga);
      const stok = escapeHTML(item.stok);
      const label = item.populer ? "Populer" : "Reguler";
      const tagClass = item.populer ? "tag popular" : "tag regular";

      return `
        <div class="product-card">
          <div class="product-top">
            <div class="product-icon">💊</div>
            <span class="${tagClass}">${label}</span>
          </div>

          <h3>${nama}</h3>
          <p class="category">${kategori}</p>

          <div class="price">${harga}</div>

          <div class="product-footer">
            <span class="stock">Stok: ${stok}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadCatalog() {
  try {
    const data = await fetchJSON("/api/obat");

    lastCatalog = data.data || [];

    updateSummary({
      strategy: data.strategi || "Cache Aside",
      status: data.kondisi || "-",
      source: data.sumber_data || "-",
      time: data.waktu_respons_ms ? `${data.waktu_respons_ms} ms` : "-",
    });

    renderCatalog(lastCatalog);

    addActivity(
      `${data.kondisi || "Data"}: katalog obat dimuat dari ${data.sumber_data || "sistem"}.`
    );
  } catch (error) {
    addActivity("Katalog obat gagal dimuat.");
    alert(`Katalog obat gagal dimuat: ${error.message}`);
    console.error(error);
  }
}

async function loadNoCache() {
  try {
    const data = await fetchJSON("/api/obat/no-cache");

    lastCatalog = data.data || [];

    updateSummary({
      strategy: data.strategi || "Database Langsung",
      status: data.kondisi || "Tanpa Cache",
      source: data.sumber_data || "Database",
      time: data.waktu_respons_ms ? `${data.waktu_respons_ms} ms` : "-",
    });

    renderCatalog(lastCatalog);

    setMiniResult(
      "techResult",
      `
        <b>Akses Database Langsung</b><br>
        Data katalog obat diambil langsung dari database tanpa menggunakan cache.<br><br>
        <b>Strategi:</b> ${escapeHTML(data.strategi || "Database Langsung")}<br>
        <b>Status:</b> ${escapeHTML(data.kondisi || "Tanpa Cache")}<br>
        <b>Sumber Data:</b> ${escapeHTML(data.sumber_data || "Database")}<br>
        <b>Waktu Respons:</b> ${escapeHTML(data.waktu_respons_ms || "-")} ms
      `
    );

    addActivity(
      `Akses database langsung dilakukan. Data diambil dari database dengan waktu respons ${data.waktu_respons_ms || "-"} ms.`
    );
  } catch (error) {
    addActivity("Akses database langsung gagal dilakukan.");
    alert(`Akses database langsung gagal: ${error.message}`);
    console.error(error);
  }
}

async function loadPopular() {
  try {
    const data = await fetchJSON("/api/obat/populer");

    lastCatalog = data.data || [];

    updateSummary({
      strategy: data.strategi || "Cache Aside",
      status: data.kondisi || "-",
      source: data.sumber_data || "-",
      time: data.waktu_respons_ms ? `${data.waktu_respons_ms} ms` : "-",
    });

    renderCatalog(lastCatalog);

    addActivity(
      `${data.kondisi || "Data"}: daftar obat populer dimuat dari ${data.sumber_data || "sistem"}.`
    );
  } catch (error) {
    addActivity("Daftar obat populer gagal dimuat.");
    alert(`Daftar obat populer gagal dimuat: ${error.message}`);
    console.error(error);
  }
}

function filterCatalog() {
  const input = getEl("searchInput");
  const keyword = input ? input.value.toLowerCase().trim() : "";

  if (!lastCatalog || lastCatalog.length === 0) {
    addActivity("Pencarian belum dapat dilakukan karena katalog belum dimuat.");
    alert("Klik Buka Katalog terlebih dahulu.");
    return;
  }

  const filtered = lastCatalog.filter((item) => {
    const nama = String(item.nama || "").toLowerCase();
    const kategori = String(item.kategori || "").toLowerCase();
    return nama.includes(keyword) || kategori.includes(keyword);
  });

  renderCatalog(filtered);
  addActivity(`Pencarian katalog dilakukan dengan kata kunci: ${keyword || "semua data"}.`);
}

async function updateStock() {
  try {
    const idInput = getEl("stockId");
    const stockInput = getEl("stockValue");

    const id = idInput ? idInput.value.trim() : "1";
    const stok = stockInput ? stockInput.value.trim() : "40";

    if (!id || !stok) {
      alert("ID obat dan stok baru wajib diisi.");
      return;
    }

    if (Number(stok) < 0) {
      alert("Stok tidak boleh bernilai negatif.");
      return;
    }

    const data = await fetchJSON(`/api/obat/${id}/stok`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stok: Number(stok) }),
    });

    updateSummary({
      strategy: data.strategi || "Cache Invalidation",
      status: "Cache Dibersihkan",
      source: "Database diperbarui",
      time: "-",
    });

    setMiniResult(
      "adminResult",
      `
        <b>Stok berhasil diperbarui.</b><br>
        Obat: ${escapeHTML(data.data.nama)}<br>
        Stok terbaru: <b>${escapeHTML(data.data.stok)}</b><br>
        Data sementara sudah dibersihkan agar pelanggan melihat stok terbaru.<br><br>
        Klik <b>Buka Katalog</b> untuk mengambil data terbaru dari database.
      `
    );

    setMiniResult(
      "techResult",
      `
        <b>Cache Invalidation Berhasil</b><br>
        Data stok obat telah diperbarui di database.<br>
        Cache katalog, cache obat populer, dan cache detail obat telah dibersihkan.<br><br>
        Setelah ini, klik <b>Buka Katalog</b>. Akses pertama akan menjadi <b>Cache Miss</b>
        karena sistem mengambil ulang data terbaru dari database.
      `
    );

    addActivity(
      `Stok ${data.data.nama} diperbarui menjadi ${data.data.stok}. Data sementara dibersihkan.`
    );
  } catch (error) {
    addActivity("Perubahan stok gagal disimpan.");
    alert(`Perubahan stok gagal disimpan: ${error.message}`);
    console.error(error);
  }
}

async function showCacheInfo() {
  try {
    const data = await fetchJSON("/api/cache/info");

    updateSummary({
      strategy: "Monitoring Cache",
      status: "Info Cache",
      source: "Memori Cache",
      time: "-",
    });

    const jumlahCache = data.jumlah_cache ?? 0;
    const ttl = data.ttl_default_detik ?? data.ttl_detik ?? "-";

    let html = `
      <b>Status Cache</b><br>
      Jumlah data sementara aktif: <b>${jumlahCache}</b><br>
      Batas waktu penyimpanan: <b>${ttl} detik</b><br><br>
    `;

    if (data.data && data.data.length > 0) {
      html += data.data
        .map(
          (item) => `
            <div class="cache-line">
              Nama cache: <b>${escapeHTML(item.key)}</b><br>
              Status: ${escapeHTML(item.status)}<br>
              Sisa waktu: ${escapeHTML(item.sisa_ttl_detik)} detik
            </div>
          `
        )
        .join("");
    } else {
      html += "Belum ada data katalog yang tersimpan sementara.";
    }

    setMiniResult("techResult", html);
    addActivity("Informasi cache ditampilkan.");
  } catch (error) {
    addActivity("Status cache gagal ditampilkan.");
    alert(`Status cache gagal ditampilkan: ${error.message}`);
    console.error(error);
  }
}

async function clearCache() {
  try {
    const data = await fetchJSON("/api/cache/obat", { method: "DELETE" });

    updateSummary({
      strategy: data.strategi || "Clear Cache",
      status: data.kondisi || "Cache Dibersihkan",
      source: "Cache Lokal",
      time: "-",
    });

    setMiniResult(
      "techResult",
      `
        <b>Cache Dibersihkan</b><br>
        ${escapeHTML(data.message)}<br>
        Setelah ini, akses katalog berikutnya akan kembali mengambil data dari database.
      `
    );

    addActivity("Semua cache obat dibersihkan secara manual.");
  } catch (error) {
    addActivity("Cache gagal dibersihkan.");
    alert(`Cache gagal dibersihkan: ${error.message}`);
    console.error(error);
  }
}

async function showEvictionInfo() {
  try {
    const data = await fetchJSON("/api/pengujian/eviction");

    updateSummary({
      strategy: data.strategi || "Cache Eviction / TTL",
      status: "TTL Aktif",
      source: "Cache Lokal",
      time: `${data.ttl_detik || "-"} detik`,
    });

    const langkahList = Array.isArray(data.langkah_uji)
      ? data.langkah_uji
      : [
          "Bersihkan cache terlebih dahulu.",
          "Buka katalog untuk membuat Cache Miss.",
          "Buka katalog lagi untuk melihat Cache Hit.",
          `Tunggu lebih dari ${data.ttl_detik || 30} detik.`,
          "Buka katalog lagi untuk melihat cache yang sudah kedaluwarsa.",
        ];

    const langkah = langkahList.map((item) => `<li>${escapeHTML(item)}</li>`).join("");

    setMiniResult(
      "techResult",
      `
        <b>Cache Eviction / TTL</b><br>
        ${escapeHTML(data.penjelasan || "Cache akan dihapus otomatis setelah batas waktu tertentu.")}<br><br>
        Batas waktu cache: <b>${escapeHTML(data.ttl_detik || 30)} detik</b>
        <ol>${langkah}</ol>
      `
    );

    addActivity(`Informasi cache eviction ditampilkan. TTL: ${data.ttl_detik || 30} detik.`);
  } catch (error) {
    addActivity("Informasi eviction gagal ditampilkan.");
    alert(`Informasi eviction gagal ditampilkan: ${error.message}`);
    console.error(error);
  }
}

async function testCdn() {
  try {
    const data = await fetchJSON("/api/cdn/status");

    updateSummary({
      strategy: "Optimasi File Halaman",
      status: "Cache File Aktif",
      source: "File Statis",
      time: "-",
    });

    setMiniResult(
      "cdnResult",
      `
        <b>Cache file halaman aktif.</b><br>
        File pendukung seperti logo, CSS, JavaScript, dan data ringan dapat
        disimpan sementara oleh browser selama halaman digunakan.<br><br>
        <b>Header cache:</b> ${escapeHTML(data.header_cache || "Cache-Control aktif")}<br>
        <b>Manfaat:</b> halaman lebih cepat dibuka karena file yang sama tidak
        perlu dimuat ulang terus-menerus.
      `
    );

    addActivity("Cache file halaman diperiksa dan aktif.");
  } catch (error) {
    setMiniResult(
      "cdnResult",
      `
        <b>Informasi file halaman.</b><br>
        Aplikasi menggunakan file pendukung seperti logo, CSS, JavaScript,
        dan data ringan. File ini dapat disimpan sementara agar halaman lebih cepat dimuat.
      `
    );

    addActivity("Informasi optimasi file halaman ditampilkan.");
    console.error(error);
  }
}

async function loadStaticFile() {
  try {
    const start = performance.now();
    const response = await fetch("/static/assets/cdn-demo-data.json");

    if (!response.ok) {
      throw new Error("File pendukung tidak ditemukan.");
    }

    const data = await response.json();
    const end = performance.now();
    const duration = Math.round(end - start);

    updateSummary({
      strategy: "File Pendukung",
      status: "Berhasil Dimuat",
      source: "Aset Halaman",
      time: `${duration} ms`,
    });

    setMiniResult(
      "cdnResult",
      `
        <b>File pendukung berhasil dimuat.</b><br>
        Nama file: <b>cdn-demo-data.json</b><br>
        Waktu muat: <b>${duration} ms</b><br><br>
        ${escapeHTML(data.message || "File pendukung berhasil dimuat.")}
      `
    );

    addActivity(`File pendukung halaman dimuat dalam ${duration} ms.`);
  } catch (error) {
    setMiniResult(
      "cdnResult",
      `
        <b>File pendukung belum ditemukan.</b><br>
        Pastikan file <b>public/assets/cdn-demo-data.json</b> tersedia.
      `
    );

    addActivity("File pendukung halaman gagal dimuat.");
    console.error(error);
  }
}

function bindButton(id, handler) {
  const button = getEl(id);
  if (!button) return;

  button.addEventListener("click", (event) => {
    event.preventDefault();
    handler();
  });
}

function setupButtons() {
  bindButton("btnLoadCatalog", loadCatalog);
  bindButton("btnHeroCatalog", loadCatalog);
  bindButton("btnNoCache", loadNoCache);
  bindButton("btnNoCacheTech", loadNoCache);
  bindButton("btnHeroPopular", loadPopular);
  bindButton("btnSearch", filterCatalog);
  bindButton("btnUpdateStock", updateStock);
  bindButton("btnCacheInfo", showCacheInfo);
  bindButton("btnClearCache", clearCache);
  bindButton("btnEviction", showEvictionInfo);
  bindButton("btnCdnCheck", testCdn);
  bindButton("btnStaticFile", loadStaticFile);

  const input = getEl("searchInput");
  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        filterCatalog();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateSummary({ strategy: "-", status: "-", source: "-", time: "-" });
  setupButtons();
  addActivity("Aplikasi SehatCare siap digunakan.");
});
