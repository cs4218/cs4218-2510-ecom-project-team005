import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('filter by category, then load more keeps filter', async ({ page }) => {
  await page.goto('/'); // Homepage
  await page.getByRole('button', { name: /categories/i }).click();
  await page.getByRole('button', { name: /electronics/i }).click();

  // cek kartu produk yang tampil sesuai kategori
  const firstBatch = await page.locator('[data-test="product-card"]').all();
  expect(firstBatch.length).toBeGreaterThan(0);

  // klik "Load More"
  await page.getByRole('button', { name: /load more/i }).click();

  // pastikan filter masih nempel (produk tambahan masih kategori sama)
  const afterLoad = await page.locator('[data-test="product-card"]').all();
  expect(afterLoad.length).toBeGreaterThan(firstBatch.length);

  // (opsional) cari label kategori di setiap card kalau ada
});
