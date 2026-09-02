import { test, expect } from '@playwright/test';

test.describe('Login & Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin');
  });

  test('renders the login page elements in Latin American Spanish', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ingresar a JanusCore Pro' })).toBeVisible();
    await expect(page.getByText('JanusCore Pro', { exact: true })).toBeVisible();
    await expect(page.getByText('Correo Electrónico')).toBeVisible();
    await expect(page.getByText('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Regístrate' })).toBeVisible();
  });

  test('toggles between Sign In and Registration modes', async ({ page }) => {
    await page.getByRole('button', { name: 'Regístrate' }).click();
    await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar Cuenta' })).toBeVisible();

    await page.getByRole('button', { name: 'Inicia sesión' }).click();
    await expect(page.getByRole('heading', { name: 'Ingresar a JanusCore Pro' })).toBeVisible();
  });

  test('displays error message when entering invalid credentials', async ({ page }) => {
    await page.locator('input[name="email"]').fill('invalid-user@januscore.pro');
    await page.locator('input[name="password"]').fill('wrongpassword123');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // The button shows loading state and then an error notification banner appears
    await expect(page.locator('text=⚠️')).toBeVisible({ timeout: 10_000 });
  });

  test('successfully logs in with valid credentials and redirects to hub', async ({ page }) => {
    await page.locator('input[name="email"]').fill('admin@januscore.pro');
    await page.locator('input[name="password"]').fill('danro32676');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    // Should redirect to Command Center
    await expect(page).toHaveURL('/', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'JanusCore Pro' })).toBeVisible();
    await expect(page.getByText('Centro de Control Empresarial')).toBeVisible();
    await expect(page.getByText('admin@januscore.pro')).toBeVisible();
  });
});
