(()=>{
  'use strict';

  const header=document.querySelector('.site-header');
  const nav=document.querySelector('.main-nav');
  const menuButton=document.querySelector('.menu-button');
  const heroSymbol=document.querySelector('.hero-symbol');
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastY=Math.max(window.scrollY,0);
  let ticking=false;

  if(header){
    header.classList.add('ui-ready');
    const syncHeader=()=>{
      const y=Math.max(window.scrollY,0);
      const delta=y-lastY;
      header.classList.toggle('is-scrolled',y>18);
      if(!document.body.classList.contains('nav-open')){
        if(y>120&&delta>8) header.classList.add('is-hidden');
        if(delta<-4||y<80) header.classList.remove('is-hidden');
      }
      lastY=y;
      ticking=false;
    };
    window.addEventListener('scroll',()=>{
      if(!ticking){
        window.requestAnimationFrame(syncHeader);
        ticking=true;
      }
    },{passive:true});
  }

  const closeMenu=(restoreFocus=false)=>{
    if(!nav||!menuButton) return;
    document.body.classList.remove('nav-open');
    nav.dataset.open='false';
    menuButton.setAttribute('aria-expanded','false');
    menuButton.setAttribute('aria-label','Abrir menú');
    if(restoreFocus) menuButton.focus();
  };

  const openMenu=()=>{
    if(!nav||!menuButton) return;
    document.body.classList.add('nav-open');
    nav.dataset.open='true';
    menuButton.setAttribute('aria-expanded','true');
    menuButton.setAttribute('aria-label','Cerrar menú');
    header?.classList.remove('is-hidden');
    nav.querySelector('a')?.focus({preventScroll:true});
  };

  if(nav&&menuButton){
    nav.id=nav.id||'xolum-main-nav';
    nav.dataset.open='false';
    menuButton.setAttribute('aria-controls',nav.id);
    menuButton.setAttribute('aria-expanded','false');
    menuButton.setAttribute('aria-label','Abrir menú');
    menuButton.addEventListener('click',()=>{
      document.body.classList.contains('nav-open')?closeMenu():openMenu();
    });
    nav.addEventListener('click',event=>{
      if(event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&document.body.classList.contains('nav-open')) closeMenu(true);
    });
    window.addEventListener('resize',()=>{
      if(window.innerWidth>980) closeMenu();
    },{passive:true});
  }

  const sections=[...document.querySelectorAll('main section[id]')];
  const links=[...document.querySelectorAll('.main-nav a[href^="#"]')];
  if(sections.length&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible) return;
      const id=`#${visible.target.id}`;
      links.forEach(link=>link.toggleAttribute('data-active',link.getAttribute('href')===id));
    },{rootMargin:'-30% 0px -58% 0px',threshold:[0,.15,.35,.6]});
    sections.forEach(section=>observer.observe(section));
  }

  const quickNav=document.createElement('nav');
  quickNav.className='quick-nav';
  quickNav.setAttribute('aria-label','Accesos rápidos');
  quickNav.innerHTML='<a class="quick-nav-store" href="https://xolum.com.mx/tienda/" aria-label="Ir a XOLUM Store">STORE <span aria-hidden="true">↗</span></a><a class="quick-nav-top" href="#top" aria-label="Volver arriba"><span aria-hidden="true">↑</span></a>';
  document.body.appendChild(quickNav);

  if(heroSymbol&&!reducedMotion.matches&&window.matchMedia('(pointer:fine)').matches){
    const wrap=heroSymbol.closest('.hero-symbol-wrap');
    const reset=()=>{
      heroSymbol.style.setProperty('--xolo-x','0px');
      heroSymbol.style.setProperty('--xolo-y','0px');
      heroSymbol.style.setProperty('--xolo-glow-x','50%');
      heroSymbol.style.setProperty('--xolo-glow-y','50%');
    };
    wrap?.addEventListener('pointermove',event=>{
      const rect=wrap.getBoundingClientRect();
      const px=(event.clientX-rect.left)/rect.width;
      const py=(event.clientY-rect.top)/rect.height;
      heroSymbol.style.setProperty('--xolo-x',`${(px-.5)*10}px`);
      heroSymbol.style.setProperty('--xolo-y',`${(py-.5)*8}px`);
      heroSymbol.style.setProperty('--xolo-glow-x',`${px*100}%`);
      heroSymbol.style.setProperty('--xolo-glow-y',`${py*100}%`);
    });
    wrap?.addEventListener('pointerleave',reset);
  }
})();