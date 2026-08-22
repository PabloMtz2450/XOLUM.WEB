(() => {
  'use strict';

  const root = document.querySelector('[data-tms-app]');
  if (!root) return;

  const state = {
    role: 'Torre de Control', activeModule: 'inicio', filter: 'todas',
    kpis: { routes:48, deliveries:142, ontime:91 },
    routes: [
      {id:'R-1048',unit:'U-18',driver:'Carlos M.',client:'ABC Distribuidora',status:'riesgo',eta:'13:42',progress:68,stops:8,done:5},
      {id:'R-1052',unit:'U-32',driver:'Juan R.',client:'Comercial del Norte',status:'incidente',eta:'14:05',progress:43,stops:7,done:3},
      {id:'R-1039',unit:'U-07',driver:'María P.',client:'Industrial Delta',status:'en-ruta',eta:'12:55',progress:81,stops:9,done:7},
      {id:'R-1055',unit:'U-21',driver:'Luis G.',client:'Pharma Corp',status:'en-ruta',eta:'15:10',progress:57,stops:6,done:3},
      {id:'R-1061',unit:'U-11',driver:'Ana V.',client:'Grupo Atlas',status:'sin-senal',eta:'15:35',progress:36,stops:5,done:2}
    ],
    deliveries: [
      {id:'E-88021',route:'R-1048',client:'ABC Distribuidora',window:'13:20 - 13:40',status:'en-ruta',pod:false,evidence:0},
      {id:'E-88022',route:'R-1052',client:'Comercial del Norte',window:'13:30 - 14:00',status:'excepcion',pod:false,evidence:2},
      {id:'E-88023',route:'R-1039',client:'Industrial Delta',window:'12:30 - 13:00',status:'entregado',pod:true,evidence:4},
      {id:'E-88024',route:'R-1055',client:'Pharma Corp',window:'15:00 - 15:30',status:'en-ruta',pod:false,evidence:1},
      {id:'E-88025',route:'R-1061',client:'Grupo Atlas',window:'15:15 - 15:45',status:'sin-senal',pod:false,evidence:0}
    ],
    exceptions: [
      {id:1,severity:'alta',title:'Alerta SafeRoute',detail:'Unidad U-32 · Parada prolongada en zona de riesgo',action:'Atender',status:'abierta'},
      {id:2,severity:'alta',title:'Entrega fuera de ventana',detail:'R-1048 · Cliente: ABC Distribuidora · ETA +2h 15m',action:'Reasignar',status:'abierta'},
      {id:3,severity:'media',title:'Evidencia incompleta',detail:'R-1052 · Faltan 2 archivos POD',action:'Revisar',status:'abierta'},
      {id:4,severity:'media',title:'Desviación de ruta',detail:'R-1039 · Desvío detectado de 4.2 km',action:'Ver ruta',status:'abierta'},
      {id:5,severity:'baja',title:'Reprogramación solicitada',detail:'R-1055 · Cliente solicita nueva ventana',action:'Gestionar',status:'abierta'},
      {id:6,severity:'media',title:'Unidad sin señal',detail:'R-1061 · Último ping hace 8 min',action:'Rastrear',status:'abierta'},
      {id:7,severity:'baja',title:'Carta Porte por validar',detail:'R-1048 · Validación documental pendiente',action:'Validar',status:'abierta'}
    ],
    incident:{active:true,attended:false,unit:'U-32',driver:'Juan R.',since:Date.now()-18*60*1000},
    activity:[
      {time:'10:21',text:'Sistema detectó desviación en R-1039'},
      {time:'10:18',text:'SafeRoute elevó alerta de U-32'},
      {time:'10:12',text:'POD completado para E-88023'}
    ]
  };

  const $ = s => root.querySelector(s);
  const $$ = s => [...root.querySelectorAll(s)];
  const esc = v => String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const labelStatus = s => ({'en-ruta':'En ruta','riesgo':'Riesgo','incidente':'Incidente','sin-senal':'Sin señal','entregado':'Entregado','excepcion':'Excepción'})[s] || s;
  const openExceptions = () => state.exceptions.filter(x=>x.status==='abierta');

  function addActivity(text){
    const now=new Date();
    state.activity.unshift({time:now.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}),text});
    state.activity=state.activity.slice(0,8);
    renderActivity();
  }

  function renderClock(){
    const el=$('[data-live-clock]');
    if(el) el.textContent=new Date().toLocaleString('es-MX',{weekday:'long',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }

  function renderKPIs(){
    const delivered=state.deliveries.filter(d=>d.status==='entregado').length;
    const values={routes:state.kpis.routes,deliveries:state.kpis.deliveries,ontime:state.kpis.ontime+'%',exceptions:openExceptions().length,incidents:(state.incident.active&&!state.incident.attended)?1:0,progress:Math.round(delivered/state.deliveries.length*100)+'%'};
    Object.entries(values).forEach(([k,v])=>$$(`[data-kpi="${k}"]`).forEach(el=>el.textContent=v));
  }

  function renderExceptions(){
    const list=openExceptions();
    const html=list.length?list.map(x=>`<article class="exception sev-${x.severity}"><div class="exc-icon">${x.severity==='alta'?'!':x.severity==='media'?'△':'i'}</div><div><b>${esc(x.title)}</b><small>${esc(x.detail)}</small></div><div class="impact">${x.severity==='alta'?'Alto impacto':x.severity==='media'?'Impacto medio':'Bajo impacto'}</div><button type="button" data-exception-action="${x.id}">${esc(x.action)}</button></article>`).join(''):'<div class="tms-empty">Sin excepciones abiertas. Operación estable.</div>';
    $$('[data-exception-list]').forEach(box=>box.innerHTML=html);
  }

  function renderRoutes(){
    const box=$('[data-route-list]'); if(!box) return;
    const list=state.routes.filter(r=>state.filter==='todas'||r.status===state.filter);
    box.innerHTML=list.length?list.map(r=>`<button type="button" class="route-row" data-route-id="${r.id}"><span><b>${r.id}</b><small>${esc(r.client)}</small></span><span>${r.unit}<small>${esc(r.driver)}</small></span><span><i class="status-dot ${r.status}"></i>${labelStatus(r.status)}</span><span>${r.done}/${r.stops}<small>paradas</small></span><span>${r.progress}%<small>ETA ${r.eta}</small></span></button>`).join(''):'<div class="tms-empty">No hay rutas con este filtro.</div>';
  }

  function renderDeliveries(){
    const box=$('[data-delivery-list]'); if(!box) return;
    box.innerHTML=state.deliveries.map(d=>`<article class="delivery-row"><div><b>${d.id}</b><small>${esc(d.client)} · ${d.route}</small></div><div><span>${d.window}</span><small>ventana</small></div><div><span class="delivery-status ${d.status}">${labelStatus(d.status)}</span><small>${d.evidence}/4 evidencias</small></div><button type="button" data-pod="${d.id}" ${d.pod?'disabled':''}>${d.pod?'POD completo':'Confirmar POD'}</button></article>`).join('');
  }

  function renderSafeRoute(){
    const status=$('[data-incident-status]'),btn=$('[data-attend-incident]');
    const sosButtons=$$('[data-sos]');
    if(!status||!btn) return;
    if(!state.incident.active){
      status.innerHTML='<b class="green">SIN INCIDENTES ACTIVOS</b><p>SafeRoute opera en modo preventivo.</p>';
      btn.disabled=true;btn.textContent='Sin incidente';sosButtons.forEach(s=>s.classList.remove('pulse'));return;
    }
    if(state.incident.attended){
      status.innerHTML=`<b class="green">INCIDENTE EN ATENCIÓN</b><p>${state.incident.unit} · ${esc(state.incident.driver)}<br>Responsable asignado: Torre de Control</p>`;
      btn.disabled=true;btn.textContent='Atendiendo';sosButtons.forEach(s=>s.classList.remove('pulse'));
    }else{
      const mins=Math.max(1,Math.floor((Date.now()-state.incident.since)/60000));
      status.innerHTML=`<b class="red">INCIDENTE CRÍTICO ACTIVO</b><p>${state.incident.unit} · Operador: ${esc(state.incident.driver)}<br>${mins} min · Última ubicación disponible</p>`;
      btn.disabled=false;btn.textContent='Atender';sosButtons.forEach(s=>s.classList.add('pulse'));
    }
  }

  function renderActivity(){
    const box=$('[data-activity]'); if(!box) return;
    box.innerHTML=state.activity.map(a=>`<div class="activity-row"><time>${a.time}</time><span>${esc(a.text)}</span></div>`).join('');
  }

  function showRoute(id){
    const r=state.routes.find(x=>x.id===id); if(!r) return;
    const drawer=$('[data-route-detail]'); if(!drawer) return;
    drawer.innerHTML=`<div class="drawer-head"><div><small>RUTA SELECCIONADA</small><h3>${r.id} · ${r.unit}</h3></div><button type="button" data-close-drawer>×</button></div><div class="drawer-grid"><div><span>Cliente</span><b>${esc(r.client)}</b></div><div><span>Operador</span><b>${esc(r.driver)}</b></div><div><span>Estado</span><b>${labelStatus(r.status)}</b></div><div><span>ETA</span><b>${r.eta}</b></div></div><div class="progress"><i style="width:${r.progress}%"></i></div><p>${r.done} de ${r.stops} paradas completadas. Progreso operacional ${r.progress}%.</p><div class="drawer-actions"><button type="button" data-route-action="contact">Contactar operador</button><button type="button" data-route-action="replan">Replanificar</button></div>`;
    drawer.dataset.open='true';addActivity(`Ruta ${r.id} abierta en Torre de Control`);
  }

  function renderModule(){
    $$('.module-view').forEach(v=>v.hidden=v.dataset.module!==state.activeModule);
    $$('button[data-module]').forEach(b=>b.classList.toggle('active',b.dataset.module===state.activeModule));
    const title=$('[data-module-title]');
    if(title) title.textContent=({inicio:'Torre de Control',rutas:'Rutas y unidades',entregas:'Entregas y POD',excepciones:'Gestión de excepciones',tracking:'Tracking operativo',saferoute:'SafeRoute · Emergencias',reportes:'Reportes ejecutivos',flota:'Flota',conductores:'Conductores',clientes:'Clientes',configuracion:'Configuración'})[state.activeModule]||'TMS XOLUM';
  }

  function setRole(role){
    state.role=role;$$('[data-role-label]').forEach(el=>el.textContent=role);
    const restricted=role==='Cliente';$$('[data-admin-only]').forEach(el=>el.hidden=restricted);
    if(restricted&&['saferoute','reportes','configuracion'].includes(state.activeModule)){state.activeModule='inicio';renderModule();}
    addActivity(`Rol cambiado a ${role}`);
  }

  function tickSimulation(){
    const delta=Math.random()>.5?1:-1;
    if(Math.random()>.78) state.kpis.ontime=Math.min(98,Math.max(86,state.kpis.ontime+delta));
    const route=state.routes[Math.floor(Math.random()*state.routes.length)];
    if(route&&route.status==='en-ruta'&&route.progress<95) route.progress=Math.min(95,route.progress+1);
    renderKPIs();renderRoutes();renderSafeRoute();
  }

  root.addEventListener('click',e=>{
    const nav=e.target.closest('button[data-module]');
    if(nav){e.preventDefault();state.activeModule=nav.dataset.module;renderModule();return;}

    const exBtn=e.target.closest('[data-exception-action]');
    if(exBtn){const ex=state.exceptions.find(x=>String(x.id)===exBtn.dataset.exceptionAction);if(ex){ex.status='resuelta';addActivity(`${ex.title}: ${ex.action} completado`);renderExceptions();renderKPIs();}return;}

    const routeBtn=e.target.closest('[data-route-id]');if(routeBtn){showRoute(routeBtn.dataset.routeId);return;}
    if(e.target.closest('[data-close-drawer]')){const d=$('[data-route-detail]');if(d)d.dataset.open='false';return;}

    const ra=e.target.closest('[data-route-action]');if(ra){addActivity(ra.dataset.routeAction==='replan'?'Replanificación iniciada':'Contacto enviado al operador');return;}

    const pod=e.target.closest('[data-pod]');
    if(pod){const d=state.deliveries.find(x=>x.id===pod.dataset.pod);if(d&&!d.pod){d.pod=true;d.evidence=4;d.status='entregado';addActivity(`POD verificado al 100% para ${d.id}`);renderDeliveries();renderKPIs();}return;}

    if(e.target.closest('[data-attend-incident]')){state.incident.attended=true;const ex=state.exceptions.find(x=>x.title==='Alerta SafeRoute'&&x.status==='abierta');if(ex)ex.status='resuelta';addActivity(`Incidente ${state.incident.unit} asignado a Torre de Control`);renderSafeRoute();renderExceptions();renderKPIs();return;}

    if(e.target.closest('[data-sos]')){if(!state.incident.active||state.incident.attended){state.incident={active:true,attended:false,unit:'U-21',driver:'Luis G.',since:Date.now()};state.exceptions.unshift({id:Date.now(),severity:'alta',title:'SOS SafeRoute',detail:'U-21 · Alerta simulada generada desde demo',action:'Atender',status:'abierta'});addActivity('SOS SafeRoute simulado activado para U-21');renderSafeRoute();renderExceptions();renderKPIs();}return;}

    if(e.target.closest('[data-refresh]')){tickSimulation();addActivity('Datos operativos actualizados manualmente');}
  });

  root.addEventListener('change',e=>{
    if(e.target.matches('[data-role-select]'))setRole(e.target.value);
    if(e.target.matches('[data-route-filter]')){state.filter=e.target.value;renderRoutes();}
  });

  renderClock();renderKPIs();renderExceptions();renderRoutes();renderDeliveries();renderSafeRoute();renderActivity();renderModule();setRole(state.role);
  setInterval(renderClock,1000);setInterval(tickSimulation,6000);
})();