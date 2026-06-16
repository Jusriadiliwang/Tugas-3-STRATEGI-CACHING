const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const db = require("./database");
const cache = require("./cache");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Simulasi CDN/static cache: file CSS, JS, SVG, dan JSON diberi header cache 1 jam.
app.use(
  "/static",
  express.static(path.join(__dirname, "../public"), {
    maxAge: "1h",
    etag: true,
    setHeaders: (res) => {
      res.setHeader("X-CDN-Simulation", "Static assets cached for 1 hour");
      res.setHeader("Cache-Control", "public, max-age=3600");
    },
  })
);

const nowMs = () => Date.now();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "Aktif",
    aplikasi: "SehatCare Online",
    waktu: new Date().toLocaleString("id-ID"),
  });
});

app.get("/api/obat/no-cache", async (req, res) => {
  const start = nowMs();
  const data = await db.getAllMedicines();

  res.json({
    status: "berhasil",
    strategi: "Database Langsung",
    kondisi: "Tanpa Cache",
    sumber_data: "Database",
    waktu_respons_ms: nowMs() - start,
    data,
  });
});

app.get("/api/obat", async (req, res) => {
  const start = nowMs();
  const key = "obat:katalog";
  const cached = await cache.getCache(key);

  if (cached) {
    return res.json({
      status: "berhasil",
      strategi: "Cache Aside",
      kondisi: "Cache Hit",
      sumber_data: "Cache Memori",
      waktu_respons_ms: nowMs() - start,
      ttl_detik: cache.TTL,
      data: cached,
    });
  }

  const data = await db.getAllMedicines();
  await cache.setCache(key, data);

  res.json({
    status: "berhasil",
    strategi: "Cache Aside",
    kondisi: "Cache Miss",
    sumber_data: "Database lalu disimpan ke cache",
    waktu_respons_ms: nowMs() - start,
    ttl_detik: cache.TTL,
    data,
  });
});

app.get("/api/obat/populer", async (req, res) => {
  const start = nowMs();
  const key = "obat:populer";
  const cached = await cache.getCache(key);

  if (cached) {
    return res.json({
      status: "berhasil",
      strategi: "Cache Aside",
      kondisi: "Cache Hit",
      sumber_data: "Cache Memori",
      waktu_respons_ms: nowMs() - start,
      data: cached,
    });
  }

  const data = await db.getPopularMedicines();
  await cache.setCache(key, data);

  res.json({
    status: "berhasil",
    strategi: "Cache Aside",
    kondisi: "Cache Miss",
    sumber_data: "Database lalu disimpan ke cache",
    waktu_respons_ms: nowMs() - start,
    data,
  });
});

app.get("/api/obat/:id", async (req, res) => {
  const start = nowMs();
  const key = `obat:detail:${req.params.id}`;
  const cached = await cache.getCache(key);

  if (cached) {
    return res.json({
      status: "berhasil",
      strategi: "Cache Aside Detail Produk",
      kondisi: "Cache Hit",
      sumber_data: "Cache Memori",
      waktu_respons_ms: nowMs() - start,
      data: cached,
    });
  }

  const data = await db.getMedicineById(req.params.id);

  if (!data) {
    return res.status(404).json({ status: "gagal", message: "Obat tidak ditemukan" });
  }

  await cache.setCache(key, data);

  res.json({
    status: "berhasil",
    strategi: "Cache Aside Detail Produk",
    kondisi: "Cache Miss",
    sumber_data: "Database lalu disimpan ke cache",
    waktu_respons_ms: nowMs() - start,
    data,
  });
});

app.put("/api/obat/:id/stok", async (req, res) => {
  const { stok } = req.body;

  if (stok === undefined || stok === "") {
    return res.status(400).json({ status: "gagal", message: "Stok wajib diisi" });
  }

  const updated = await db.updateStock(req.params.id, stok);

  if (!updated) {
    return res.status(404).json({ status: "gagal", message: "Obat tidak ditemukan" });
  }

  await cache.deleteCache("obat:katalog");
  await cache.deleteCache("obat:populer");
  await cache.deleteCache(`obat:detail:${req.params.id}`);

  res.json({
    status: "berhasil",
    strategi: "Cache Invalidation",
    kondisi: "Cache Diperbarui",
    sumber_data: "Database diperbarui dan cache lama dibersihkan",
    message: "Stok berhasil diperbarui. Cache lama dihapus agar data yang tampil tetap terbaru.",
    data: updated,
  });
});

app.get("/api/cache/info", async (req, res) => {
  const info = await cache.cacheInfo();
  res.json(info);
});

app.delete("/api/cache/obat", async (req, res) => {
  const jumlah = await cache.clearCacheByPrefix("obat:");

  res.json({
    status: "berhasil",
    strategi: "Clear Cache",
    kondisi: "Cache Dibersihkan",
    message: `${jumlah} cache katalog berhasil dibersihkan.`,
  });
});

app.get("/api/cdn/status", (req, res) => {
  res.json({
    status: "Aktif",
    konsep: "CDN / Static Asset Cache",
    penjelasan:
      "File statis seperti CSS, JavaScript, SVG, dan JSON diberi cache header selama 1 jam. Pada aplikasi nyata, file ini dapat disimpan di CDN agar pengguna lebih cepat memuat halaman dari lokasi server terdekat.",
    header_cache: "Cache-Control: public, max-age=3600",
    etag: "Aktif",
    contoh_file: [
      "/static/style.css",
      "/static/app.js",
      "/static/assets/apotek-icon.svg",
      "/static/assets/cdn-demo-data.json",
    ],
  });
});

app.get("/api/pengujian/eviction", (req, res) => {
  res.json({
    status: "success",
    strategi: "Cache Eviction / TTL",
    judul: "Cache Eviction / TTL",
    penjelasan:
      "Cache eviction adalah proses penghapusan data cache secara otomatis setelah melewati batas waktu tertentu. Pada aplikasi ini, cache memiliki TTL sehingga data sementara akan kedaluwarsa dan request berikutnya kembali mengambil data dari database.",
    ttl_detik: cache.TTL || 30,
    langkah_uji: [
      "Klik Bersihkan Cache terlebih dahulu.",
      "Klik Buka Katalog untuk membuat kondisi Cache Miss.",
      "Klik Buka Katalog lagi untuk membuat kondisi Cache Hit.",
      `Tunggu lebih dari ${cache.TTL || 30} detik sampai TTL habis.`,
      "Klik Buka Katalog lagi, maka data kembali Cache Miss karena cache sudah kedaluwarsa.",
    ],
  });
});

async function startServer() {
  try {
    await cache.initCache();

    app.listen(PORT, () => {
      console.log("====================================");
      console.log(`SehatCare berjalan di http://localhost:${PORT}`);
      console.log("====================================");
    });
  } catch (error) {
    console.error("Gagal menjalankan server:");
    console.error(error);
  }
}

startServer();
