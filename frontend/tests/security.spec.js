import { test, expect, request as requestFactory } from '@playwright/test';
import { createHmac } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';

test.describe.configure({ mode: 'serial' });
const base = 'http://127.0.0.1:55187';
const control = 'http://127.0.0.1:55188';
const fixturePassword = 'Teste!42-SomenteFixture';
let email = `browser-${Date.now()}@example.invalid`;
let password = 'Inicial!42-Fixture';
let userState;
async function post(client, path, data) {
  const csrf = await (await client.get('/api/auth/csrf')).json();
  return client.post(path, { data, headers: { 'X-CSRF-TOKEN': csrf.token } });
}
function totp(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = 0, buffer = 0; const bytes = [];
  for (const c of secret) { buffer = (buffer << 5) | alphabet.indexOf(c); bits += 5; if (bits >= 8) { bits -= 8; bytes.push((buffer >> bits) & 255); } }
  const counter = Buffer.alloc(8); counter.writeBigInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac('sha1', Buffer.from(bytes)).update(counter).digest(); const offset = hash.at(-1) & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
}
async function loginPage(page, user, pass) {
  await page.goto('/login'); await page.getByLabel('E-mail', { exact: true }).fill(user);
  await page.getByLabel('Senha', { exact: true }).fill(pass); await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

test('cadastro sem confirmação, endereço, cookie, CSRF e imagem persistente', async ({ page, request }) => {
  const invalid = await request.post('/api/registro/consumidor', { data: { email, senha: password, nome: 'Pessoa teste', cpf: '12345678909', telefone: '11900000000' } });
  expect(invalid.status()).toBe(400); expect((await invalid.json()).code).toBe('csrf_invalid');
  const badCpf = await post(request, '/api/registro/consumidor', { email, senha: password, nome: 'Pessoa teste', cpf: '00000000000', telefone: '11900000000' });
  expect(badCpf.status()).toBe(400);
  const registration = await post(request, '/api/registro/consumidor', { email: email.toUpperCase(), senha: password, nome: 'Pessoa teste', cpf: '12345678909', telefone: '11900000000' });
  expect(registration.status()).toBe(200);
  expect((await registration.json()).mensagem).not.toContain('Confirme');
  await page.goto('/login');
  await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Reenviar confirmação de e-mail' })).toHaveCount(0);
  await loginPage(page, email.toUpperCase(), password); await page.waitForURL('**/dashboard/consumidor');
  const cookies = await page.context().cookies(); expect(cookies.find(c => c.name === 'vittaflow-session')?.httpOnly).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  expect((await page.request.get('/api/admin/operacao')).status()).toBe(403);
  expect(await page.evaluate(() => document.cookie.includes('vittaflow-session'))).toBe(false);
  await page.reload(); await expect(page.getByRole('heading', { name: 'Ofertas em destaque' })).toBeVisible();
  expect((await post(request, '/api/registro/consumidor', { email: email.toUpperCase(), senha: password, nome: 'Duplicado', cpf: '12345678909', telefone: '11900000000' })).status()).toBe(409);
  const store = await requestFactory.newContext({ baseURL: base });
  expect((await post(store, '/api/auth/login', { email: 'loja-web@example.invalid', senha: fixturePassword })).status()).toBe(200);
  const profile = await (await store.get('/api/conta')).json();
  const csrf = await (await store.get('/api/auth/csrf')).json();
  const update = await store.put('/api/conta', { data: { nome: profile.nome, email: profile.email, organizacao: profile.organizacao, notificacoes: profile.notificacoes,
    endereco: { cep: '00000000', rua: 'Rua QA', numero: '0', bairro: 'QA', cidade: 'QA', estado: 'SP' } }, headers: { 'X-CSRF-TOKEN': csrf.token } });
  expect(update.status()).toBe(200); expect((await (await store.get('/api/conta')).json()).endereco.rua).toBe('Rua QA');
  const token = await (await page.request.get('/api/auth/csrf')).json();
  const photo = await page.request.post('/api/conta/foto', { multipart: { foto: { name: 'pixel.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64') } }, headers: { 'X-CSRF-TOKEN': token.token } });
  expect(photo.status()).toBe(200); const photoUrl = (await photo.json()).fotoUrl;
  expect((await page.request.get(photoUrl)).status()).toBe(200);
  expect((await request.post(`${control}/restart`)).status()).toBe(200);
  expect((await page.request.get('/api/conta')).status()).toBe(200);
  expect((await page.request.get(photoUrl)).status()).toBe(200);
  const afterRestart = await page.request.put('/api/conta', { data: { nome: 'Pessoa teste depois do restart', email, telefone: '', notificacoes: { novasSolicitacoes: false, vencimentos: false, doacoesConcluidas: false } }, headers: { 'X-CSRF-TOKEN': token.token } });
  expect(afterRestart.status()).toBe(200); // As chaves CSRF também sobreviveram ao restart.
  userState = await page.context().storageState();
  const headers = (await page.request.get('/')).headers();
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  await store.dispose();
});

test('troca de senha e e-mail revogam sessões; recuperação por e-mail removida', async ({ request }) => {
  const client = await requestFactory.newContext({ baseURL: base, storageState: userState });
  const csrf = await (await client.get('/api/auth/csrf')).json();
  const changed = await client.put('/api/conta/senha', { data: { senhaAtual: password, novaSenha: 'NovaSenha!43-Fixture' }, headers: { 'X-CSRF-TOKEN': csrf.token } });
  expect(changed.status()).toBe(204); expect((await client.get('/api/conta')).status()).toBe(401);
  expect((await post(request, '/api/auth/login', { email, senha: password })).status()).toBe(401);
  password = 'NovaSenha!43-Fixture';
  const login = await post(request, '/api/auth/login', { email, senha: password });
  expect(login.status()).toBe(200); expect(Object.hasOwn(await login.json(), 'token')).toBe(false);
  const beforeChange = await request.storageState();
  const profile = await (await request.get('/api/conta')).json();
  expect(Object.hasOwn(profile, 'emailConfirmado')).toBe(false);
  const newEmail = 'alterado-' + email;
  const update = async senhaAtual => request.put('/api/conta', { data: { ...profile, email: newEmail, senhaAtual },
    headers: { 'X-CSRF-TOKEN': (await (await request.get('/api/auth/csrf')).json()).token } });
  expect((await update('Incorreta!42')).status()).toBe(400);
  expect((await update(password)).status()).toBe(200);
  expect((await request.get('/api/conta')).status()).toBe(401);
  expect((await post(request, '/api/auth/login', { email, senha: password })).status()).toBe(401);
  email = newEmail;
  expect((await post(request, '/api/auth/login', { email, senha: password })).status()).toBe(200);
  const revoked = await requestFactory.newContext({ baseURL: base, storageState: beforeChange });
  expect((await revoked.get('/api/auth/sessao')).status()).toBe(401);
  for (const route of ['recuperar-senha', 'reenviar-confirmacao', 'confirmar-email', 'redefinir-senha'])
    expect((await post(request, '/api/auth/' + route, { email, token: 'a'.repeat(64), novaSenha: 'NaoPode!42' })).status()).toBe(404);
  const beforeLogout = await request.storageState(); expect((await post(request, '/api/auth/logout')).status()).toBe(200);
  const old = await requestFactory.newContext({ baseURL: base, storageState: beforeLogout });
  expect((await old.get('/api/conta')).status()).toBe(401);
  expect((await request.post(`${control}/restart`)).status()).toBe(200); expect((await old.get('/api/conta')).status()).toBe(401);
  await old.dispose(); await revoked.dispose(); await client.dispose();
});

test('MFA administrativo, recuperação e limites persistentes', async ({ page, request }) => {
  await loginPage(page, 'admin-web@example.invalid', fixturePassword);
  await expect(page.getByRole('heading', { name: 'Proteja sua conta administrativa' })).toBeVisible();
  expect((await page.request.get('/api/admin/usuarios')).status()).toBe(401);
  const secret = await page.locator('.mfa-setup code').innerText();
  await page.getByLabel('Código do autenticador', { exact: true }).fill(totp(secret));
  const completion = page.waitForResponse(r => r.url().endsWith('/api/auth/mfa/confirmar') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Verificar e continuar' }).click(); const completed = await (await completion).json();
  await expect(page.locator('.mfa-codigos li')).toHaveCount(10);
  const oldCode = completed.codigosRecuperacao[0];
  await page.getByRole('button', { name: 'Guardei os códigos. Continuar' }).click(); await page.waitForURL('**/dashboard/admin');
  const operation = await page.request.get('/api/admin/operacao');
  expect(operation.status()).toBe(200);
  expect(Object.hasOwn(await operation.json(), 'emailsPendentes')).toBe(false);
  expect((await post(page.request, '/api/auth/logout')).status()).toBe(200);
  await loginPage(page, 'admin-web@example.invalid', fixturePassword);
  await expect(page.getByRole('heading', { name: 'Verifique sua identidade' })).toBeVisible();
  await page.getByRole('button', { name: 'Perdi acesso ao autenticador' }).click();
  await page.getByLabel('Código de recuperação', { exact: true }).fill(oldCode);
  await page.getByRole('button', { name: 'Verificar e continuar' }).click();
  await expect(page.getByRole('heading', { name: 'Proteja sua conta administrativa' })).toBeVisible();
  const newSecret = await page.locator('.mfa-setup code').innerText(); expect(newSecret === secret).toBe(false);
  await page.getByLabel('Código do autenticador', { exact: true }).fill(totp(newSecret));
  await page.getByRole('button', { name: 'Verificar e continuar' }).click(); await expect(page.locator('.mfa-codigos li')).toHaveCount(10);
  await page.getByRole('button', { name: 'Guardei os códigos. Continuar' }).click(); await page.waitForURL('**/dashboard/admin');
  const target = 'limite-'+Date.now()+'@example.invalid';
  for (let i = 0; i < 8; i++) expect((await post(request, '/api/auth/login', { email: target, senha: 'Incorreta!42' })).status()).toBe(401);
  expect((await post(request, '/api/auth/login', { email: target, senha: 'Incorreta!42' })).status()).toBe(429);
  expect((await request.post(`${control}/restart`)).status()).toBe(200);
  expect((await post(request, '/api/auth/login', { email: target, senha: 'Incorreta!42' })).status()).toBe(429);
  expect((await page.request.get('/api/admin/operacao')).status()).toBe(200);
  const violations=[];
  for(const route of ['/dashboard/admin','/dashboard/admin/approvals','/dashboard/admin/users','/dashboard/admin/configuracoes']) {
    await page.goto(route);
    await page.getByRole('heading',{level:1}).waitFor({timeout:15000});
    await page.evaluate(()=>document.fonts.ready);
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    violations.push(...result.violations.map(v=>({route,id:v.id,nodes:v.nodes.map(n=>n.target)})));
  }
  expect(violations).toEqual([]);
});

test('produção atrás do proxy HTTPS emite cookies Secure e protege diagnóstico CSP', async ({ request }) => {
  expect((await request.post(`${control}/production`)).status()).toBe(200);
  const client = await requestFactory.newContext({ baseURL: base });
  const csrf = await client.get('/api/auth/csrf'); expect(csrf.status()).toBe(200);
  const csrfSet = csrf.headersArray().find(h => h.name.toLowerCase() === 'set-cookie' && h.value.startsWith('__Host-vittaflow-csrf='))?.value;
  expect(csrfSet).toMatch(/; secure/i); expect(csrfSet).toMatch(/; httponly/i); expect(csrfSet).toMatch(/samesite=strict/i);
  expect(csrfSet).not.toMatch(/; domain=/i);
  const login = await client.post('/api/auth/login', { data: { email, senha: password },
    headers: { Cookie: csrfSet.split(';')[0], 'X-CSRF-TOKEN': (await csrf.json()).token } });
  expect(login.status()).toBe(200);
  const cookie = login.headersArray().find(h => h.name.toLowerCase() === 'set-cookie' && h.value.startsWith('__Host-vittaflow-session='))?.value;
  expect(cookie).toMatch(/; secure/i); expect(cookie).toMatch(/; httponly/i); expect(cookie).toMatch(/samesite=strict/i);
  expect(cookie).not.toMatch(/; domain=/i);
  expect((await client.get('/api/auth/sessao', { headers: { Cookie: cookie.split(';')[0] } })).status()).toBe(200);
  expect((await client.get('/')).headers()['strict-transport-security']).toContain('max-age=31536000');
  expect((await client.post('/api/security/csp', { data: [] })).status()).toBe(204);
  expect((await client.post('/api/security/csp', { data: { 'csp-report': { 'violated-directive': 123 } } })).status()).toBe(204);
  await client.dispose();
});
