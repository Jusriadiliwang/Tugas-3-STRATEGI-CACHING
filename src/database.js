let medicines = [
  { id: 1, nama: 'Paracetamol', kategori: 'Obat Demam', harga: 8000, stok: 50, populer: true, deskripsi: 'Membantu meredakan demam dan nyeri ringan.' },
  { id: 2, nama: 'Amoxicillin', kategori: 'Antibiotik', harga: 12000, stok: 35, populer: true, deskripsi: 'Antibiotik sesuai anjuran tenaga kesehatan.' },
  { id: 3, nama: 'Vitamin C', kategori: 'Vitamin', harga: 15000, stok: 80, populer: true, deskripsi: 'Suplemen untuk membantu menjaga daya tahan tubuh.' },
  { id: 4, nama: 'OBH Batuk', kategori: 'Obat Batuk', harga: 18000, stok: 25, populer: false, deskripsi: 'Membantu meredakan batuk berdahak.' },
  { id: 5, nama: 'Antasida', kategori: 'Obat Lambung', harga: 10000, stok: 40, populer: false, deskripsi: 'Membantu mengurangi gejala asam lambung.' },
  { id: 6, nama: 'Cetirizine', kategori: 'Obat Alergi', harga: 9000, stok: 60, populer: false, deskripsi: 'Membantu meredakan gejala alergi.' }
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAllMedicines() { await wait(650); return medicines; }
async function getMedicineById(id) { await wait(450); return medicines.find((m) => m.id === Number(id)); }
async function getPopularMedicines() { await wait(550); return medicines.filter((m) => m.populer); }
async function updateStock(id, stok) {
  await wait(350);
  const item = medicines.find((m) => m.id === Number(id));
  if (!item) return null;
  item.stok = Number(stok);
  return item;
}

module.exports = { getAllMedicines, getMedicineById, getPopularMedicines, updateStock };
