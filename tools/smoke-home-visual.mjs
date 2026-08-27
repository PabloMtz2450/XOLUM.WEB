import { chromium } from 'playwright';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const failures=[];
const assert=(cond,msg)=>{if(!cond)failures.push(msg)};

async function auditPage(page,label){
  const consoleErrors=[]; const pageErrors=[]; const requestFailures=[];
  page.on('console',m=>{if(m.type()==='error') consoleErrors.push(m.text())});
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('requestfailed',r=>{if(r.url().startsWith(base)) requestFailures.push(`${r.method()} ${r.url()} ${r.failure()?.errorText||''}`)});
  const response=await page.goto(base,{waitUntil:'networkidle'});
  assert(response?.ok(),`${label}: home HTTP ${response?.status()}`);
  assert(await page.locator('h1').isVisible(),`${label}: H1 no visible`);
  assert((await page.locator('h1').innerText()).includes('FORMA MEJOR'),`${label}: H1 inesperado`);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert(overflow<=2,`${label}: overflow horizontal ${overflow}px`);
  assert(await page.locator('.quick-nav').count()===1,`${label}: quick-nav ausente/duplicado`);
  assert(consoleErrors.length===0,`${label}: console errors: ${consoleErrors.join(' | ')}`);
  assert(pageErrors.length===0,`${label}: page errors: ${pageErrors.join(' | ')}`);
  assert(requestFailures.length===0,`${label}: request failures: ${requestFailures.join(' | ')}`);
}

const browser=await chromium.launch({headless:true});
try{
  {
    const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    const page=await ctx.newPage();
    await auditPage(page,'desktop');
    assert(await page.locator('.main-nav').isVisible(),'desktop: nav principal no visible');
    assert(!(await page.locator('.menu-button').isVisible()),'desktop: botón menú debería estar oculto');
    const darkBg=await page.locator('.dark-section').first().evaluate(el=>getComputedStyle(el).backgroundColor);
    assert(darkBg==='rgb(10, 10, 10)',`desktop: fondo oscuro inesperado ${darkBg}`);
    await page.locator('a[href="#ecosistema"]').first().click();
    await page.waitForTimeout(450);
    assert((await page.evaluate(()=>location.hash))==='#ecosistema','desktop: ancla ecosistema no navegó');
    await page.evaluate(()=>window.scrollTo(0,1800)); await page.waitForTimeout(250);
    assert(await page.locator('.site-header').evaluate(el=>el.classList.contains('is-hidden')),'desktop: header no se ocultó al bajar');
    await page.evaluate(()=>window.scrollTo(0,1200)); await page.waitForTimeout(250);
    assert(!(await page.locator('.site-header').evaluate(el=>el.classList.contains('is-hidden'))),'desktop: header no reapareció al subir');
    const wrap=page.locator('.hero-symbol-wrap'); await wrap.scrollIntoViewIfNeeded(); const box=await wrap.boundingBox();
    if(box){await page.mouse.move(box.x+box.width*.75,box.y+box.height*.35); await page.waitForTimeout(80); const x=await page.locator('.hero-symbol').evaluate(el=>getComputedStyle(el).getPropertyValue('--xolo-x').trim()); assert(x&&x!=='0px','desktop: efecto Xolo no respondió');}
    await ctx.close();
  }
  {
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page=await ctx.newPage();
    await auditPage(page,'mobile');
    const metrics=await page.evaluate(()=>({innerWidth:window.innerWidth,innerHeight:window.innerHeight,clientWidth:document.documentElement.clientWidth,visualWidth:window.visualViewport?.width||null,devicePixelRatio:window.devicePixelRatio}));
    const configured=page.viewportSize();
    assert(configured?.width===390&&configured?.height===844,`mobile: viewport Playwright inesperado ${JSON.stringify(configured)}`);
    assert(metrics.innerWidth===390,`mobile: window.innerWidth inesperado ${JSON.stringify(metrics)}`);
    assert(await page.locator('.menu-button').isVisible(),'mobile: botón menú no visible');
    await page.locator('.menu-button').click(); await page.waitForTimeout(120);
    assert(await page.locator('body').evaluate(el=>el.classList.contains('nav-open')),'mobile: body no entra nav-open');
    assert((await page.locator('.menu-button').getAttribute('aria-expanded'))==='true','mobile: aria-expanded no true');
    assert((await page.locator('.main-nav').getAttribute('data-open'))==='true','mobile: menú no abre');
    await page.keyboard.press('Escape'); await page.waitForTimeout(80);
    assert(!(await page.locator('body').evaluate(el=>el.classList.contains('nav-open'))),'mobile: Escape no cerró menú');
    await page.locator('.menu-button').click(); await page.locator('.main-nav a[href="#tienda"]').click(); await page.waitForTimeout(300);
    assert((await page.evaluate(()=>location.hash))==='#tienda','mobile: navegación a tienda falló');
    assert(!(await page.locator('body').evaluate(el=>el.classList.contains('nav-open'))),'mobile: menú no cerró tras navegar');
    const qbox=await page.locator('.quick-nav').boundingBox();
    const inViewport=Boolean(qbox&&qbox.x>=-0.5&&qbox.x+qbox.width<=metrics.innerWidth+0.5);
    assert(inViewport,`mobile: quick-nav fuera de viewport qbox=${JSON.stringify(qbox)} metrics=${JSON.stringify(metrics)}`);
    await ctx.close();
  }
  {
    const ctx=await browser.newContext({viewport:{width:1200,height:800},reducedMotion:'reduce'});
    const page=await ctx.newPage(); await page.goto(base,{waitUntil:'networkidle'});
    const transform=await page.locator('.hero-symbol').evaluate(el=>getComputedStyle(el).transform);
    assert(transform==='none','reduced-motion: Xolo conserva transform animable');
    await ctx.close();
  }
}finally{await browser.close();}

if(failures.length){console.error('SMOKE HOME: FAIL'); failures.forEach((f,i)=>console.error(`${i+1}. ${f}`)); process.exit(1)}
console.log('SMOKE HOME: PASS');
console.log('desktop 1440x900: PASS');
console.log('mobile 390x844: PASS');
console.log('reduced-motion: PASS');
