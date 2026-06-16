const cacheStore = new Map();
const TTL = 30;

async function initCache() {
  console.log('Cache lokal siap digunakan.');
}

async function setCache(key, value, ttlSeconds = TTL) {
  cacheStore.set(key, { value, expiredAt: Date.now() + ttlSeconds * 1000 });
}

async function getCache(key) {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiredAt) {
    cacheStore.delete(key);
    return null;
  }
  return item.value;
}

async function deleteCache(key) {
  return cacheStore.delete(key);
}

async function clearCacheByPrefix(prefix) {
  let total = 0;
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
      total++;
    }
  }
  return total;
}

async function cacheInfo() {
  const rows = [];
  for (const [key, item] of cacheStore.entries()) {
    rows.push({
      key,
      status: Date.now() <= item.expiredAt ? 'Aktif' : 'Kedaluwarsa',
      sisa_ttl_detik: Math.max(0, Math.floor((item.expiredAt - Date.now()) / 1000))
    });
  }
  return { ttl_default_detik: TTL, jumlah_cache: rows.length, data: rows };
}

module.exports = { TTL, initCache, setCache, getCache, deleteCache, clearCacheByPrefix, cacheInfo };
