import { test, expect } from '@playwright/test';
import { errosDeValidacao, mensagemErro } from '../src/utils/mensagemErro.js';

test('mensagens do middleware e ProblemDetails preservam o motivo da validação', () => {
  const middleware = { response: { data: { message: 'Confira os campos destacados.', erros: { cnpj: 'CNPJ inválido.' } } } };
  expect(mensagemErro(middleware)).toBe('CNPJ inválido.');
  expect(errosDeValidacao(middleware)).toEqual({ cnpj: 'CNPJ inválido.' });
  const problem = { response: { data: { errors: { RazaoSocial: ['Razão social deve ter entre 3 e 100 caracteres.'] } } } };
  expect(errosDeValidacao(problem)).toEqual({ razaoSocial: 'Razão social deve ter entre 3 e 100 caracteres.' });
  expect(mensagemErro({ response: { data: { Erro: 'Este e-mail já está em uso.' } } })).toBe('Este e-mail já está em uso.');
  expect(mensagemErro({}, 'Falha de conexão.')).toBe('Falha de conexão.');
});

test('cadastro destaca CNPJ rejeitado pelo serviço e razão social rejeitada pelo DTO', async ({ page }) => {
  test.setTimeout(45000);
  await page.goto('/register');
  await page.locator('label[for=tipo-varejista]').click();
  await page.getByLabel('Razão social', { exact: false }).fill('Instituição QA');
  await page.getByLabel('Nome do estabelecimento', { exact: false }).fill('Loja QA');
  await page.getByLabel('CNPJ', { exact: false }).fill('00000000000000');
  await page.getByLabel('E-mail', { exact: false }).fill('invalid-registration-qa@example.invalid');
  await page.getByLabel(/^Senha\*?$/).fill('SomenteTeste!42');
  await page.getByLabel('Confirmar senha', { exact: false }).fill('SomenteTeste!42');
  const rejection = page.waitForResponse(r => r.url().endsWith('/api/registro/varejista') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  const response = await rejection;
  expect(response.status()).toBe(400);
  expect((await response.json()).erros.cnpj).toBe('CNPJ inválido.');
  await expect(page.getByLabel('CNPJ', { exact: false })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('.field__error')).toContainText('CNPJ inválido.');
  await expect(page.getByText('Confira os campos destacados.', { exact: true })).toHaveCount(0);

  await page.getByLabel('CNPJ', { exact: false }).fill('11222333000181');
  await expect(page.getByLabel('CNPJ', { exact: false })).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Razão social', { exact: false }).fill('AB');
  const validation = page.waitForResponse(r => r.url().endsWith('/api/registro/varejista') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  expect((await validation).status()).toBe(400);
  await expect(page.getByLabel('Razão social', { exact: false })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('.field__error')).toContainText('entre 3 e 100 caracteres');
});

test('cadastro ONG recusa telefone inválido antes de persistir a conta', async ({ request }) => {
  for (const telefone of ['123', '11300000000', '1190000000']) {
    const csrf = await (await request.get('/api/auth/csrf')).json();
    const response = await request.post('/api/registro/ong', { headers: { 'X-CSRF-TOKEN': csrf.token },
      data: { nomeFantasia: 'ONG QA telefone inválido', cnpj: '11222333000181', email: 'telefone-invalido@example.invalid', senha: 'SomenteTeste!42', telefone } });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.errors.Telefone).toContain('Informe um celular válido com DDD e 9 dígitos.');
  }
});

test('diagnóstico cadastral é restrito ao administrador', async ({ request }) => {
  const csrf = await (await request.get('/api/auth/csrf')).json();
  const response = await request.post('/api/cnpj/testar-validacao', { headers: { 'X-CSRF-TOKEN': csrf.token }, data: { cnpj: '11222333000181' } });
  expect(response.status()).toBe(401);
});
