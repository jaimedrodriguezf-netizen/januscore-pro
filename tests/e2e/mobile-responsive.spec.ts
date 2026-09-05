import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 667 } }); // Mobile iPhone SE viewport

test.describe('Mobile Responsive Layout', () => {
  test('renders mobile hamburger button and opens/closes sidebar drawer', async ({ page }) => {
    await page.goto('/');

    // 1. Sidebar should initially be off-screen / drawer closed on mobile
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/translate-x-full/);

    // 2. Mobile hamburger menu button should be visible in header
    const menuButton = page.getByRole('button', { name: 'Abrir menú' });
    await expect(menuButton).toBeVisible();

    // 3. Click menu button to open sidebar drawer
    await menuButton.click();
    await expect(sidebar).toHaveClass(/translate-x-0/);

    // 4. Close button should be visible inside drawer
    const closeButton = page.getByRole('button', { name: 'Cerrar menú' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await expect(sidebar).toHaveClass(/translate-x-full/);
  });
});
