import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cs = process.env.VITTAFLOW_TEST_CONNECTION || '';
if (!/Host=(127\.0\.0\.1|localhost)(;|$)/i.test(cs) || !/Database=vittaflow_[a-z0-9_]+(;|$)/i.test(cs))
  throw new Error('Configure VITTAFLOW_TEST_CONNECTION para um banco vittaflow_* exclusivamente local. Produção é proibida neste roteiro.');
const seed = spawnSync('dotnet', ['run', '--project', 'tests/TccSolidario.SegurancaChecks', '--', '--seed-web-only'],
  { cwd: root, env: process.env, encoding: 'utf8', windowsHide: true });
if (seed.status !== 0) throw new Error('Não preparou fixtures: ' + seed.stdout + seed.stderr);
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'vittaflow-browser-'));
fs.mkdirSync(path.join(work, 'volume'));
fs.cpSync(path.join(root, 'frontend/dist'), path.join(work, 'wwwroot'), { recursive: true });
const messages = [];
function decodeBody(raw) {
  const split = raw.indexOf('\r\n\r\n'); const headers = raw.slice(0, split); let body = raw.slice(split + 4);
  if (/content-transfer-encoding: base64/i.test(headers)) return Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf8');
  body = body.replace(/=\r?\n/g, '');
  return body.replace(/=([a-f0-9]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
const smtp = net.createServer(socket => {
  socket.setEncoding('utf8'); socket.write('220 localhost VittaFlow test SMTP\r\n');
  let buffer = '', dataMode = false, raw = '', recipients = [];
  socket.on('error', () => {});
  socket.on('data', chunk => {
    buffer += chunk;
    for (;;) {
      const i = buffer.indexOf('\r\n'); if (i < 0) break;
      const line = buffer.slice(0, i); buffer = buffer.slice(i + 2);
      if (dataMode) {
        if (line === '.') { messages.push({ to: recipients.join(','), body: decodeBody(raw) }); raw = ''; dataMode = false; socket.write('250 queued locally\r\n'); }
        else raw += line + '\r\n';
        continue;
      }
      if (/^(EHLO|HELO)/i.test(line)) socket.write('250-localhost\r\n250 8BITMIME\r\n');
      else if (/^MAIL FROM:/i.test(line)) { recipients = []; socket.write('250 ok\r\n'); }
      else if (/^RCPT TO:/i.test(line)) { recipients.push(line.slice(8).replace(/[<>]/g, '').trim().toLowerCase()); socket.write('250 ok\r\n'); }
      else if (/^DATA/i.test(line)) { dataMode = true; socket.write('354 end with dot\r\n'); }
      else if (/^QUIT/i.test(line)) { socket.end('221 bye\r\n'); break; }
      else socket.write('250 ok\r\n');
    }
  });
});
await new Promise(resolve => smtp.listen(55226, '127.0.0.1', resolve));
let api; let apiOutput = '';
const env = { ...process.env, ASPNETCORE_ENVIRONMENT: 'Development', ASPNETCORE_CONTENTROOT: work,
  ASPNETCORE_URLS: 'http://127.0.0.1:55187', ConnectionStrings__DefaultConnection: cs,
  Jwt__Key: 'CHAVE-EXCLUSIVA-DE-TESTES-LOCAIS-123456789012345678901234567890', Jwt__Issuer: 'VittaTest', Jwt__Audience: 'VittaTest',
  Security__EncryptionKey: Buffer.from(Array.from({ length: 32 }, (_, i) => i + 1)).toString('base64'),
  Security__PublicOrigin: 'http://127.0.0.1:55187', Security__CspReportOnly: 'false',
  Database__AutoMigrate: 'false', Database__SeedAdmin: 'false', DadosTeste__Ativo: 'false',
  Storage__PersistentDirectory: path.join(work, 'volume'),
  Cloudinary__CloudName: '', Cloudinary__ApiKey: '', Cloudinary__ApiSecret: '',
  Email__SmtpHost: '127.0.0.1', Email__SmtpPort: '55226', Email__StartTls: 'false', Email__Usuario: '', Email__Senha: '', Email__Remetente: 'test@example.invalid', Email__PollSeconds: '1' };
if (process.env.VITTAFLOW_TEST_USE_LIMITED_ROLE === 'true') {
  if (!/(^|;)\s*Username=[^;]+/i.test(cs)) throw new Error('Fixture requer Username explícito.');
  env.ConnectionStrings__DefaultConnection = cs.replace(/(^|;)\s*Username=[^;]*/i, '$1Username=vittaflow_app');
}
delete env.PORT;
async function startApi() {
  apiOutput = '';
  api = spawn('dotnet', [path.join(root, 'api/TccSolidario.Api/bin/Debug/net8.0/TccSolidario.Api.dll')], { cwd: work, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const child = api;
  child.stdout.on('data', b => { apiOutput = (apiOutput + b).slice(-20000); });
  child.stderr.on('data', b => { apiOutput = (apiOutput + b).slice(-20000); });
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error('API encerrou: ' + apiOutput);
    try { if ((await fetch('http://127.0.0.1:55187/health')).ok) return; } catch { /* aguardando */ }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('API não ficou pronta: ' + apiOutput);
}
async function stopApi() {
  if (!api || api.exitCode !== null) return;
  const child = api; const closed = new Promise(resolve => child.once('exit', resolve)); child.kill(); await closed;
}
await startApi();
const control = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET' && url.pathname === '/messages') {
    res.end(JSON.stringify(messages.filter(m => m.to.includes((url.searchParams.get('to') || '').toLowerCase()))));
  } else if (req.method === 'POST' && url.pathname === '/production') {
    try {
      await stopApi(); env.ASPNETCORE_ENVIRONMENT = 'Production'; env.Proxy__HttpsTermination = 'true';
      env.Email__StartTls = 'true'; env.Security__PublicOrigin = 'https://test.example.invalid';
      await startApi(); res.end('{"ok":true}');
    } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
  } else if (req.method === 'POST' && url.pathname === '/restart') {
    try { await stopApi(); await startApi(); res.end('{"ok":true}'); } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
  } else { res.statusCode = 404; res.end('{}'); }
});
await new Promise(resolve => control.listen(55188, '127.0.0.1', resolve));
console.log('Ambiente de navegador isolado pronto. E-mails são capturados somente no SMTP local.');
async function close() { control.close(); smtp.close(); await stopApi(); process.exit(0); }
process.on('SIGINT', close); process.on('SIGTERM', close);
