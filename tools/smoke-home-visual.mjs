import { chromium, devices } from 'playwright';

const base=process.env.BASE_URL||'http://127.0.0.1:4173';
const failures=[];
const assert=(cond,msg)=>{if(!cond)failures.push(msg)};

async function geometryAudit(page,label){
  const geometry=await page.evaluate(()=>{
    const root=document.documentElement;
    const viewport=root.clientWidth;
    const offenders=Array.from(document.querySelectorAll('*')).map((el)=>{
      const r=el.getBoundingClientRect();
      return {tag:el.tagName.toLowerCase(),id:el.id||'',cls:typeof el.className==='string'?el.className:'',left:Number(r.left.toFixed(1)),right:Number(r.right.toFixed(1)),width:Number(r.width.toFixed(1)),rightOverflow:Number((r.right-viewport).toFixed(1)),leftOverflow:Number((-r.left).toFixed(1))};
    }).filter(x=>x.width>0&&(x.rightOverflow>1||x.leftOverflow>1)).sort((a,b)=>Math.max(b.rightOverflow,b.leftOverflow)-Math.max(a.rightOverflow,a.leftOverflow)).slice(0,12);
    return {viewport,rootScrollWidth:root.scrollWidth,bodyScrollWidth:document.body.scrollWidth,innerWidth:window.innerWidth,visualWidth:window.visualViewport?.width||null,offenders};
  });
  assert(geometry.offenders.length===0,`${label}: elementos fuera de viewport geometry=${JSON.stringify(geometry)}`);
  assert(geometry.rootScrollWidth<=geometry.viewport+1,`${label}: root scrollWidth ${geometry.rootScrollWidth} > viewport ${geometry.viewport}`);
  return geometry;
}

async function auditPage(page,label){
  const consoleErrors=[]; const pageErrors=[]; const requestFailures=[];
  page.on('console',m=>{if(m.type()==='error') consoleErrors.push(m.text())});
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('requestfailed',r=>{if(r.url().startsWith(base)) requestFailures.push(`${r.method()} ${r.url()} ${r.failure()?.errorText||''}`)});
  const response=await page.goto(base,{waitUntil:'networkidle'});
  assert(response?.ok(),`${label}: home HTTP ${response?.status()}`);
  assert(await page.locator('h1').isVisible(),`${label}: H1 no visible`);
  assert((await page.locator('h1').innerText()).includes('FORMA MEJOR'),`${label}: H1 inesperado`);
  await geometryAudit(page,label);
  assert(await page.locator('.quick-nav').count()===1,`${label}: quick-nav ausente/duplicado`);
  assert(consoleErrors.length===0,`${label}: console errors: ${consoleErrors.join(' | ')}`);
  assert(pageErrors.length===0,`${label}: page errors: ${pageErrors.join(' | ')}`);
  assert(requestFailures.length===0,`${label}: request failures: ${requestFailures.join(' | ')}`);
}

async function auditResponsiveWidth(browser,width,height=780){
  const iphoneUA=devices['iPhone 13'].userAgent;
  const ctx=await browser.newContext({viewport:{width,height},screen:{width,height},userAgent:iphoneUA,isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await ctx.newPage();
  const label=`mobile-${width}`;
  await auditPage(page,label);
  const metrics=await page.evaluate(()=>({clientWidth:document.documentElement.clientWidth,visualWidth:window.visualViewport?.width||null}));
  assert(metrics.clientWidth===width,`${label}: clientWidth inesperado ${JSON.stringify(metrics)}`);
  assert(Math.abs((metrics.visualWidth??0)-width)<=0.5,`${label}: visualViewport inesperado ${JSON.stringify(metrics)}`);
  assert(await page.locator('.menu-button').isVisible(),`${label}: botón menú no visible`);
  const h1Box=await page.locator('h1').boundingBox();
  assert(Boolean(h1Box&&h1Box.x>=-0.5&&h1Box.x+h1Box.width<=width+0.5),`${label}: H1 fuera de viewport ${JSON.stringify(h1Box)}`);
  const qbox=await page.locator('.quick-nav').boundingBox();
  assert(Boolean(qbox&&qbox.x>=-0.5&&qbox.x+qbox.width<=width+0.5),`${label}: quick-nav fuera de viewport ${JSON.stringify(qbox)}`);
  await ctx.close();
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
    await ctx.close();
  }
  for(const width of [320,360,390,430]) await auditResponsiveWidth(browser,width,width===320?700:844);
  {
    const iphone13=devices['iPhone 13'];
    const ctx=await browser.newContext({...iphone13});
    const page=await ctx.newPage();
    await auditPage(page,'iphone13');
    await page.locator('.menu-button').click(); await page.waitForTimeout(120);
    assert(await page.locator('body').evaluate(el=>el.classList.contains('nav-open')),'iphone13: body no entra nav-open');
    assert((await page.locator('.menu-button').getAttribute('aria-expanded'))==='true','iphone13: aria-expanded no true');
    await page.keyboard.press('Escape'); await page.waitForTimeout(80);
    assert(!(await page.locator('body').evaluate(el=>el.classList.contains('nav-open'))),'iphone13: Escape no cerró menú');
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
console.log('mobile widths 320/360/390/430: PASS');
console.log('iPhone 13 interactions: PASS');
console.log('reduced-motion: PASS');
