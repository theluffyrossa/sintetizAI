import { test, expect } from '@playwright/test';
import { FAKE_GET_USER_MEDIA } from './fixtures/fake-video';

test('boot: renderiza UI e botão de iniciar', async ({ page, context }) => {
  await context.grantPermissions(['camera']);
  await page.addInitScript(FAKE_GET_USER_MEDIA);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SintetizAI' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Iniciar áudio e câmera/i })).toBeVisible();
});

test('seleção de modo: clica em FM e atualiza estado', async ({ page, context }) => {
  await context.grantPermissions(['camera']);
  await page.addInitScript(FAKE_GET_USER_MEDIA);
  await page.goto('/');
  const fmButton = page.getByRole('radio', { name: 'FM' });
  await fmButton.click();
  await expect(fmButton).toHaveAttribute('data-state', 'on');
});
