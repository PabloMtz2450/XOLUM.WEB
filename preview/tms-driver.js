(() => {
  'use strict';
  const access = sessionStorage.getItem('xolum_tms_demo_access');
  const gate = document.getElementById('gate');
  const app = document.getElementById('driverApp');
  if (!access) { gate.hidden = false; return; }
  app.hidden = false;

  const state = {
    online: true,
    started: false,
    currentStop: 0,
    queue: [],
    stops: [
      {seq:1, client:'Comercial del Norte', address:'Av. Industria 245 · Azcapotzalco', window:'13:30–14:00', status:'pendiente'},
      {seq:2, client:'ABC Distribuidora', address:'Calz. Vallejo 1240 · Gustavo A. Madero', window:'14:10–14:40', status:'pendiente'},
      {seq:3, client:'Pharma Corp', address:'Eje 5 Norte 870 · Miguel Hidalgo', window:'15:00–15:30', status:'pendiente'},
      {seq:4, client:'Grupo Atlas', address:'Av. Central 55 · Naucalpan', window:'16:00–16:40', status:'pendiente'}
    ]
  };

  const $ = id => document.getElementById(id);
  const toast = msg => { const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),2400); };
  const log = (type, detail) => {
    const evt = { id: Date.now() + Math.random(), type, detail, at: new Date().toISOString() };
    if (state.online) toast(detail + ' · sincronizado');
    else { state.queue.push(evt); renderQueue(); toast(detail + ' · guardado offline'); }
  };

  function renderClock(){ $('clock').textContent = new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}); }
  setInterval(renderClock,1000); renderClock();

  function renderStops(){
    const box=$('stops');
    box.innerHTML=state.stops.map((s,i)=>{
      const active = i===state.currentStop && state.started && s.status!=='entregado';
      const done = s.status==='entregado';
      return `<article class="stop ${active?'active':''} ${done?'done':''}"><div class="stop-head"><span class="seq">${done?'✓':s.seq}</span><div class="stop-main"><b>${s.client}</b><small>${s.address}</small></div><span class="window">${s.window}</span></div><div class="stop-actions"><button type="button" class="small-btn" data-arrive="${i}" ${(!active||done)?'disabled':''}>LLEGUÉ</button><button type="button" class="small-btn accent" data-deliver="${i}" ${(!active||done)?'disabled':''}>ENTREGA / POD</button></div></article>`;
    }).join('');
    const done=state.stops.filter(s=>s.status==='entregado').length;
    $('routeProgress').textContent=`${done} / ${state.stops.length} completadas`;
    const next=state.stops[state.currentStop];
    if(next){ $('mapDestination').textContent=next.client; $('podClient').textContent=next.client; }
  }

  function renderQueue(){
    const box=$('queue');
    box.innerHTML=state.queue.map(q=>`<span>${q.type}</span>`).join('');
    $('offlineBox').hidden=state.online;
    $('syncText').textContent=state.queue.length?`${state.queue.length} evento(s) pendientes de sincronizar.`:'Todo sincronizado con Torre de Control.';
  }

  function setOnline(v){
    state.online=v;
    const b=$('networkBtn');
    b.textContent=v?'● EN LÍNEA':'● SIN SEÑAL';
    b.classList.toggle('offline',!v);
    renderQueue();
    if(v && state.queue.length) toast('Conectividad recuperada. Hay eventos pendientes.');
  }

  $('networkBtn').addEventListener('click',()=>setOnline(!state.online));

  $('startTrip').addEventListener('click',()=>{
    if(state.started) return;
    state.started=true;
    $('startTrip').disabled=true;
    $('startTrip').textContent='VIAJE EN CURSO';
    $('tripStatus').textContent='EN RUTA';
    log('SALIDA','Viaje R-1052 iniciado');
    renderStops();
  });

  document.addEventListener('click',e=>{
    const view=e.target.closest('[data-view]');
    if(view){
      document.querySelectorAll('.bottom button').forEach(b=>b.classList.toggle('active',b===view));
      ['trip','nav','pod','more'].forEach(v=>$(v+'View').hidden=v!==view.dataset.view);
      return;
    }
    const arrive=e.target.closest('[data-arrive]');
    if(arrive){
      const i=Number(arrive.dataset.arrive), s=state.stops[i];
      if(!s) return;
      log('LLEGADA',`Llegada registrada en ${s.client}`);
      arrive.textContent='LLEGADA REGISTRADA'; arrive.disabled=true;
      return;
    }
    const deliver=e.target.closest('[data-deliver]');
    if(deliver){
      $('podModal').hidden=false;
      return;
    }
  });

  $('openPod').addEventListener('click',()=>{ if(!state.started){toast('Primero inicia el viaje.');return;} $('podModal').hidden=false; });
  $('cancelPod').addEventListener('click',()=>{$('podModal').hidden=true;});
  $('podForm').addEventListener('submit',e=>{
    e.preventDefault();
    const s=state.stops[state.currentStop]; if(!s) return;
    const fd=new FormData(e.currentTarget);
    const result=fd.get('result');
    if(result==='entregado'){
      s.status='entregado';
      log('POD',`POD completo de ${s.client}`);
      state.currentStop=Math.min(state.currentStop+1,state.stops.length-1);
    } else if(result==='parcial'){
      log('POD_PARCIAL',`Entrega parcial registrada en ${s.client}`);
    } else {
      log('RECHAZO',`Rechazo registrado en ${s.client}`);
    }
    $('podModal').hidden=true; e.currentTarget.reset(); renderStops();
    if(state.stops.every(x=>x.status==='entregado')){ $('tripStatus').textContent='VIAJE COMPLETADO'; $('tripStatus').classList.add('status'); toast('Todas las entregas fueron completadas.'); }
  });

  $('trafficBtn').addEventListener('click',()=>log('TRÁFICO','Tráfico reportado a Torre de Control'));
  $('incidentBtn').addEventListener('click',()=>log('INCIDENCIA','Incidencia operativa reportada'));
  $('sosBtn').addEventListener('click',()=>{ if(confirm('Simular activación SafeRoute SOS para la demo?')) log('SOS','SOS SafeRoute enviado con prioridad crítica'); });
  $('syncBtn').addEventListener('click',()=>{
    if(!state.online){ toast('Sin conectividad. La cola permanecerá guardada.'); return; }
    if(!state.queue.length){ toast('No hay eventos pendientes.'); return; }
    const n=state.queue.length; state.queue=[]; renderQueue(); toast(`${n} evento(s) sincronizados con Torre de Control`);
  });

  renderStops(); renderQueue();
})();