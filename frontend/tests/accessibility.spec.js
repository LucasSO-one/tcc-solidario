import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('páginas públicas: acessibilidade automática, CSP e navegação por teclado', async ({ page }) => {
  const violations = [];
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', e => window.__cspViolations.push({ directive: e.effectiveDirective, blocked: e.blockedURI, source: e.sourceFile, line: e.lineNumber }));
  });
  for (const route of ['/', '/login', '/register', '/termos', '/privacidade']) {
    await page.goto(route);
    await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => window.__cspViolations), route+' CSP antes da ferramenta de auditoria').toEqual([]);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    violations.push(...result.violations.map(v => ({ route, id:v.id, impact:v.impact, nodes:v.nodes.map(n=>n.target) })));
  }
  expect(violations).toEqual([]);
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => location.hash)).toBe('#conteudo');
  await page.setViewportSize({ width: 390, height: 844 });
  for(const route of ['/', '/login', '/register', '/termos', '/privacidade']) {
    await page.goto(route);
    await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 15000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route+' sem rolagem horizontal').toBe(true);
  }
});

const perfis = [
  { nome:'varejista', email:'loja-web@example.invalid', paginas:['','/cadastrar-lote','/meus-produtos','/validar-retirada','/doacoes','/impacto','/configuracoes'] },
  { nome:'ong', email:'ong-web@example.invalid', paginas:['','/vitrine','/resgates','/solicitacoes','/configuracoes'] },
  { nome:'consumidor', email:'consumidor-web@example.invalid', paginas:['','/marketplace','/reservas','/configuracoes'] },
];
for(const perfil of perfis) {
  test('acessibilidade das páginas autenticadas: '+perfil.nome, async ({ page }) => {
    const csrf=await (await page.request.get('/api/auth/csrf')).json();
    const login=await page.request.post('/api/auth/login',{ data:{email:perfil.email,senha:'Teste!42-SomenteFixture'},headers:{'X-CSRF-TOKEN':csrf.token} });
    expect(login.status()).toBe(200);
    const violations=[];
    for(const suffix of perfil.paginas) {
      const route='/dashboard/'+perfil.nome+suffix;
      await page.goto(route);
      await page.getByRole('heading',{level:1}).waitFor({ timeout: 15000 });
      await page.evaluate(()=>document.fonts.ready);
      const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      violations.push(...result.violations.map(v=>({route,id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})));
    }
    expect(violations).toEqual([]);
  });
}
