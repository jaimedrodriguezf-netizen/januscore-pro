import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation Alignment', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('menu button should be vertically centered with the logo', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const logo = page.locator('header a.font-bold[href="#inicio"]');
    const menuBtn = page.locator('button[aria-label="Abrir menú"]');

    await expect(logo).toBeVisible();
    await expect(menuBtn).toBeVisible();

    const logoRect = await logo.boundingBox();
    const menuBtnRect = await menuBtn.boundingBox();

    if (logoRect && menuBtnRect) {
      const logoCenterY = logoRect.y + logoRect.height / 2;
      const menuBtnCenterY = menuBtnRect.y + menuBtnRect.height / 2;
      
      // Allow for 2px tolerance
      expect(Math.abs(logoCenterY - menuBtnCenterY)).toBeLessThanOrEqual(2);
    } else {
      throw new Error('Could not find bounding boxes for logo or menu button');
    }
  });

  test('menu button should have 24px right margin', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const menuBtn = page.locator('button[aria-label="Abrir menú"]');
    await expect(menuBtn).toBeVisible();

    const menuBtnRect = await menuBtn.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 375;

    if (menuBtnRect) {
      const rightMargin = viewportWidth - (menuBtnRect.x + menuBtnRect.width);
      expect(rightMargin).toBe(24); // px-6 = 1.5rem = 24px
    } else {
      throw new Error('Could not find bounding box for menu button');
    }
  });

  test('no horizontal overflow on small devices', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // Very small mobile
    await page.goto('http://localhost:3000');
    
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(overflow).toBe(false);
  });
});

test.describe('Desktop Navigation', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('desktop links should be visible', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const nav = page.locator('header nav.hidden.md\\:flex');
    await expect(nav).toBeVisible();

    const contactBtn = page.locator('header a[href="#contacto"]').filter({ hasText: 'Hablemos' });
    await expect(contactBtn).toBeVisible();
  });

  test('mobile menu button should be hidden on desktop', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const menuBtn = page.locator('button[aria-label="Abrir menú"]');
    await expect(menuBtn).not.toBeVisible();
  });
});
