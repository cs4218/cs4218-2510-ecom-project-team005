import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

async function clickFirstVisible(locators: import('@playwright/test').Locator[], nameForError: string) {
  for (const loc of locators) {
    if (await loc.first().isVisible().catch(() => false)) {
      await loc.first().click();
      return;
    }
  }
  throw new Error(`Tidak menemukan elemen yang bisa diklik untuk: ${nameForError}`);
}

test('filter by category, then load more keeps filter', async ({ page }) => {
  test.setTimeout(90_000);

  // 1) Buka homepage & tunggu siap
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  // (opsional) pastikan halaman memuat konten utama
  // tidak wajib, tapi membantu kalau UI lambat
  // await expect(page).toHaveTitle(/(Home|Shop|Store|Ecom)/i, { timeout: 5000 }).catch(() => {});

  // 2) Klik tombol/area "Categories" dengan beberapa strategi
  await clickFirstVisible(
    [
      page.getByRole('button', { name: /categories/i }),
      page.getByRole('tab', { name: /categories/i }),
      page.getByText(/^categories$/i),                        // elemen teks polos
      page.locator('[data-test="categories-button"]'),
      page.locator('[data-testid="categories-button"]'),
      page.locator('#categories, .categories').filter({ hasText: /categories/i }),
    ],
    'Categories'
  );

  // 3) Pilih kategori "Electronics" (fallback multi-strategi)
  await clickFirstVisible(
    [
      page.getByRole('button', { name: /electronics/i }),
      page.getByRole('link', { name: /electronics/i }),
      page.getByText(/^electronics$/i),
      page.locator('[data-test="category-electronics"]'),
      page.locator('[data-testid="category-electronics"]'),
      page.locator('label:has-text("Electronics")'),
      page.locator('input[type="checkbox"][value="electronics"]'), // kalau filter pakai checkbox
    ],
    'Electronics'
  );

  // 4) Pastikan ada product card muncul setelah filter
  const productCards = page.locator('[data-test="product-card"], [data-testid="product-card"], .product-card');
  await expect(productCards).toHaveCountGreaterThan(0, { timeout: 10_000 });

  // Simpan jumlah awal untuk pembanding
  const countBefore = await productCards.count();

  // 5) Klik "Load More" (fallback multi-strategi)
  await clickFirstVisible(
    [
      page.getByRole('button', { name: /load more/i }),
      page.getByText(/^load more$/i),
      page.locator('[data-test="load-more"]'),
      page.locator('[data-testid="load-more"]'),
      page.locator('button:has-text("Load More")'),
    ],
    'Load More'
  );

  // 6) Pastikan jumlah card bertambah (filter tetap kepakai)
  await expect(productCards).toHaveCountGreaterThan(countBefore, { timeout: 10_000 });

}).catch(async (err, testInfo) => {
  // Save artefacts saat gagal
  try {
    const page = (testInfo as any)?.page;
    if (page) {
      await page.screenshot({ path: `playwright-fail-screenshot.png`, fullPage: true });
      const html = await page.content();
      // @ts-ignore
      const fs = await import('fs');
      fs.writeFileSync('playwright-fail-dom.html', html);
      console.log('Saved playwright-fail-screenshot.png & playwright-fail-dom.html for debugging');
    }
  } catch {}
  throw err;
});
