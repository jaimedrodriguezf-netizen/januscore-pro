import { test, expect } from '@playwright/test';

test.describe('Navegación de Iniciar Sesión y Registro', () => {
  test('hace clic en Iniciar Sesión desde el Inicio, navega a /signin y luego a /signin?mode=signup (Registro)', async ({ page }) => {
    // 1. Ir a la página de inicio (Hub)
    await page.goto('/');

    // 2. Verificar que el botón "Iniciar Sesión →" está visible en el encabezado
    const loginButton = page.getByRole('link', { name: 'Iniciar Sesión →' });
    await expect(loginButton).toBeVisible();

    // 3. Hacer clic en "Iniciar Sesión →"
    await loginButton.click();

    // 4. Verificar que navegó a /signin y se visualiza el formulario de inicio de sesión
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByRole('heading', { name: 'Ingresar a JanusCore Pro' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();

    // 5. Desde el login, hacer clic en el botón "Regístrate"
    const registerButton = page.getByRole('button', { name: 'Regístrate' });
    await expect(registerButton).toBeVisible();
    await registerButton.click();

    // 6. Verificar que se visualiza el formulario de creación de cuenta
    await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar Cuenta' })).toBeVisible();

    // 7. Volver al formulario de inicio de sesión haciendo clic en "Inicia sesión"
    const backToLoginButton = page.getByRole('button', { name: 'Inicia sesión' });
    await expect(backToLoginButton).toBeVisible();
    await backToLoginButton.click();

    // 8. Confirmar que regresó al formulario de login
    await expect(page.getByRole('heading', { name: 'Ingresar a JanusCore Pro' })).toBeVisible();
  });
});
