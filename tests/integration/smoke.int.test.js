// COBA PILIHAN A dulu (kalau app.js di root)
import app from '../../app.js';
// --- kalau gagal, hapus baris di atas dan ganti ke PILIHAN B di bawah ---
// import app from '../../src/app.js'; // PILIHAN B (kalau app.js di /src)

test('smoke: app bisa diimport', () => {
  expect(typeof app).toBe('function');
});
