import { test, expect, request as requestFactory } from '@playwright/test';
import { createHmac } from 'node:crypto';

test.describe.configure({ mode: 'serial' });
const base = 'http://127.0.0.1:55187';
const control = 'http://127.0.0.1:55188';
const fixturePassword = 'Teste!42-SomenteFixture';
const email = `browser-${Date.now()}@example.invalid`;
let password = 'Inicial!42-Fixture';
let userState;
async function post(client, path, data) {
  const csrf = await (await client.get('/api/auth/csrf')).json();
  return client.post(path, { data, headers: { 'X-CSRF-TOKEN': csrf.token } });
}
async function mailLink(request, recipient, route) {
  let link;
  await expect.poll(async () => {
    const messages = await (await request.get(`${control}/messages?to=${encodeURIComponent(recipient)}`)).json();
    link = messages.map(m => m.body.match(new RegExp(`http://127\\.0\\.0\\.1:55187/${route}#token=([a-f0-9]{64})`))?.[0]).filter(Boolean).at(-1);
    return !!link;
  }).toBe(true);
  return link;
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

test('cadastro, e-mail, endereço, cookie, CSRF e imagem persistente', async ({ page, request }) => {
  const invalid = await request.post('/api/registro/consumidor', { data: { email, senha: password, nome: 'Pessoa teste', cpf: '12345678909', telefone: '11900000000' } });
  expect(invalid.status()).toBe(400); expect((await invalid.json()).code).toBe('csrf_invalid');
  const badCpf = await post(request, '/api/registro/consumidor', { email, senha: password, nome: 'Pessoa teste', cpf: '00000000000', telefone: '11900000000' });
  expect(badCpf.status()).toBe(400);
  const registration = await post(request, '/api/registro/consumidor', { email: email.toUpperCase(), senha: password, nome: 'Pessoa teste', cpf: '12345678909', telefone: '11900000000' });
  expect(registration.status()).toBe(200);
  expect((await post(request, '/api/auth/login', { email, senha: password })).status()).toBe(401);
  const link = await mailLink(request, email, 'confirmar-email');
  await page.goto(link); await page.getByRole('button', { name: 'Confirmar e-mail', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('E-mail confirmado');
  expect(page.url()).not.toContain('token=');
  expect((await post(request, '/api/auth/confirmar-email', { token: link.split('=')[1] })).status()).toBe(400);
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

test('troca e recuperação de senha revogam sessões; links são de uso único', async ({ page, request }) => {
  const client = await requestFactory.newContext({ baseURL: base, storageState: userState });
  const csrf = await (await client.get('/api/auth/csrf')).json();
  const changed = await client.put('/api/conta/senha', { data: { senhaAtual: password, novaSenha: 'NovaSenha!43-Fixture' }, headers: { 'X-CSRF-TOKEN': csrf.token } });
  expect(changed.status()).toBe(204); expect((await client.get('/api/conta')).status()).toBe(401);
  expect((await post(request, '/api/auth/login', { email, senha: password })).status()).toBe(401); password = 'NovaSenha!43-Fixture';
  expect((await post(request, '/api/auth/login', { email, senha: password })).status()).toBe(200);
  const stateBeforeReset = await request.storageState();
  const generic = await post(request, '/api/auth/recuperar-senha', { email });
  const unknown = await post(request, '/api/auth/recuperar-senha', { email: 'inexistente-'+Date.now()+'@example.invalid' });
  expect(generic.status()).toBe(200); expect(await generic.json()).toEqual(await unknown.json());
  const link = await mailLink(request, email, 'redefinir-senha');
  await page.goto(link); await page.getByLabel('Nova senha', { exact: true }).fill('FinalSenha!44-Fixture');
  await page.getByLabel('Confirme a nova senha', { exact: true }).fill('FinalSenha!44-Fixture');
  await page.getByRole('button', { name: 'Redefinir senha', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Senha redefinida');
  expect((await post(request, '/api/auth/redefinir-senha', { token: link.split('=')[1], novaSenha: 'OutraSenha!45-Fixture' })).status()).toBe(400);
  const revoked = await requestFactory.newContext({ baseURL: base, storageState: stateBeforeReset });
  expect((await revoked.get('/api/auth/sessao')).status()).toBe(401); password = 'FinalSenha!44-Fixture';
  const login = await post(request, '/api/auth/login', { email, senha: password }); expect(login.status()).toBe(200); expect(Object.hasOwn(await login.json(), 'token')).toBe(false);
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
  expect((await page.request.get('/api/admin/operacao')).status()).toBe(200);
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
