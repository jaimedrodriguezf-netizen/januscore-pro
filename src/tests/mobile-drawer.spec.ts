import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation Drawer Redesign', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Open the drawer
    await page.click('button[aria-label="Abrir menú"]');
    // Wait for drawer animation
    await page.waitForSelector('nav[role="dialog"]', { state: 'visible' });
  });

  test('drawer should have glassmorphism styling', async ({ page }) => {
    const drawer = page.locator('nav[role="dialog"]');
    const backdropFilter = await drawer.evaluate((el) => window.getComputedStyle(el).backdropFilter);
    // backdrop-blur-xl is typically around 20px-24px depending on browser implementation, 
    // but just checking presence of blur is enough.
    expect(backdropFilter).toContain('blur');
  });

  test('drawer should contain professional contact information', async ({ page }) => {
    const email = page.locator('nav[role="dialog"] a[href^="mailto:"]');
    const phone = page.locator('nav[role="dialog"] a[href^="tel:"]');
    
    await expect(email).toBeAttached();
    await expect(email).toContainText('@gmail.com');
    await expect(phone).toBeAttached();
  });

  test('drawer should contain a prominent WhatsApp button', async ({ page }) => {
    const whatsapp = page.locator('nav[role="dialog"] a[href*="wa.me"]');
    await expect(whatsapp).toBeAttached();
    await expect(whatsapp).toContainText('WhatsApp');
  });

  test('drawer should contain social media links with icons', async ({ page }) => {
    const socialLinks = page.locator('nav[role="dialog"] .social-links-footer a');
    const count = await socialLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);
    
    const github = page.locator('nav[role="dialog"] a[href*="github.com"]');
    const linkedin = page.locator('nav[role="dialog"] a[href*="linkedin.com"]');
    await expect(github).toBeVisible();
    await expect(linkedin).toBeVisible();
  });

  test('menu items should be structured with hierarchy', async ({ page }) => {
    const menuHeader = page.locator('nav[role="dialog"] span:text-is("Menú")');
    const contactHeader = page.locator('nav[role="dialog"] span:text-is("Contacto")');
    
    await expect(menuHeader).toBeVisible();
    await expect(contactHeader).toBeVisible();
  });
});
