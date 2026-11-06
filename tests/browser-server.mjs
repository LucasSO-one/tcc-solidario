import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
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
let api; let apiOutput = '';
const env = { ...process.env, ASPNETCORE_ENVIRONMENT: 'Development', ASPNETCORE_CONTENTROOT: work,
  ASPNETCORE_URLS: 'http://127.0.0.1:55187', ConnectionStrings__DefaultConnection: cs,
  Jwt__Key: 'CHAVE-EXCLUSIVA-DE-TESTES-LOCAIS-123456789012345678901234567890', Jwt__Issuer: 'VittaTest', Jwt__Audience: 'VittaTest',
  Security__EncryptionKey: Buffer.from(Array.from({ length: 32 }, (_, i) => i + 1)).toString('base64'),
  Security__CspReportOnly: 'false',
  Database__AutoMigrate: 'false', Database__SeedAdmin: 'false', DadosTeste__Ativo: 'false',
  Storage__PersistentDirectory: path.join(work, 'volume'),
  Cloudinary__CloudName: '', Cloudinary__ApiKey: '', Cloudinary__ApiSecret: '' };
for (const key of Object.keys(env)) if (key.startsWith('Email__')) delete env[key];
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
  if (req.method === 'POST' && url.pathname === '/production') {
    try {
      await stopApi(); env.ASPNETCORE_ENVIRONMENT = 'Production'; env.Proxy__HttpsTermination = 'true';
      await startApi(); res.end('{"ok":true}');
    } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
  } else if (req.method === 'POST' && url.pathname === '/restart') {
    try { await stopApi(); await startApi(); res.end('{"ok":true}'); } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
  } else { res.statusCode = 404; res.end('{}'); }
});
await new Promise(resolve => control.listen(55188, '127.0.0.1', resolve));
console.log('Ambiente de navegador isolado pronto, sem serviço de e-mail.');
async function close() { control.close(); await stopApi(); process.exit(0); }
process.on('SIGINT', close); process.on('SIGTERM', close);
