import { test, expect } from '@playwright/test';

test('carga controlada local: 20 lotes, 8 leituras simultâneas, 120 respostas', async ({ request }, testInfo) => {
  // O webServer do Playwright recusa qualquer conexão de banco não local.
  const token=await (await request.get('/api/auth/csrf')).json();
  expect((await request.post('/api/auth/login',{data:{email:'loja-web@example.invalid',senha:'Teste!42-SomenteFixture'},headers:{'X-CSRF-TOKEN':token.token}})).status()).toBe(200);
  const csrf=(await (await request.get('/api/auth/csrf')).json()).token;
  const ids=[];
  const prefix='Carga local '+Date.now();
  try {
    for(let i=0;i<20;i++) {
      const response=await request.post('/api/produtos/cadastrar-lote',{multipart:{
        Nome:prefix+' '+i,Categoria:'Hortifruti',Quantidade:'2',DataValidade:new Date(Date.now()+3*86400000).toISOString(),
        PrecoOriginal:'10',PrecoDesconto:'5',IsOferta:'true',FrutaFeia:'false',
      },headers:{'X-CSRF-TOKEN':csrf}});
      expect(response.status(),await response.text()).toBe(201);
      ids.push((await response.json()).id);
    }
    const urls=['/api/produtos/vitrine','/api/produtos/ofertas','/api/produtos/produtos'];
    for(const url of urls) expect((await request.get(url)).status()).toBe(200);
    const samples=[];
    let next=0;
    await Promise.all(Array.from({length:8},async()=>{
      while(next<120) {
        const i=next++, start=performance.now();
        const response=await request.get(urls[i%urls.length]);
        const body=await response.json();
        samples.push({status:response.status(),ms:performance.now()-start,count:Array.isArray(body)?body.length:0});
      }
    }));
    const ordered=samples.map(s=>s.ms).sort((a,b)=>a-b);
    const report={scenario:'PostgreSQL local, papel de runtime restrito, 20 lotes de fixture, 8 requisições simultâneas',requests:samples.length,
      failures:samples.filter(s=>s.status!==200||s.count<20).length,p50Ms:ordered[Math.ceil(ordered.length*.5)-1],p95Ms:ordered[Math.ceil(ordered.length*.95)-1],maxMs:ordered.at(-1)};
    console.log('CARGA_LOCAL '+JSON.stringify(report));
    await testInfo.attach('carga-local.json',{body:JSON.stringify(report,null,2),contentType:'application/json'});
    expect(report.failures).toBe(0);
    expect(report.p95Ms).toBeLessThan(3000);
  } finally {
    for(const id of ids) {
      const response=await request.delete('/api/produtos/'+id,{headers:{'X-CSRF-TOKEN':csrf}});
      expect(response.status()).toBe(204);
    }
  }
});
