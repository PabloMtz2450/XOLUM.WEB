(() => {
  'use strict';

  const ACCESS_KEY = 'xolum_tms_demo_access';
  const LEAD_KEY = 'xolum_tms_demo_lead';
  const TEST_CODE_SHA256 = '583b4067a3901dfc579a9852ec0be772373dc4c6a9ae0ac88bb2c93d836c176f';
  const app = document.querySelector('[data-tms-app]');
  if (!app) return;

  const loadCore = () => {
    if (document.querySelector('script[data-tms-core]')) return;
    const script = document.createElement('script');
    script.src = 'tms-core.js';
    script.defer = true;
    script.dataset.tmsCore = 'true';
    document.body.appendChild(script);
  };

  const grant = () => {
    app.hidden = false;
    const gate = document.querySelector('[data-demo-gate]');
    if (gate) gate.remove();
    loadCore();
  };

  if (sessionStorage.getItem(ACCESS_KEY) === 'granted') {
    grant();
    return;
  }

  app.hidden = true;
  const style = document.createElement('style');
  style.textContent = `
    .xgate{min-height:100vh;background:#070a0e;color:#f5f7fa;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:28px 18px 60px}
    .xgate *{box-sizing:border-box}.xgate-shell{width:min(1180px,100%);margin:auto}.xgate-top{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:52px}
    .xgate-brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit}.xgate-brand img{width:48px;height:48px;object-fit:contain}.xgate-brand b{font-size:20px}.xgate-brand b span{color:#79d431}.xgate-brand small{display:block;color:#8f99a5;font-size:11px;margin-top:2px}
    .xgate-back{border:1px solid #2a343e;border-radius:999px;padding:10px 15px;text-decoration:none;color:#dce2e8;font-size:12px;font-weight:800}
    .xgate-grid{display:grid;grid-template-columns:minmax(0,.82fr) minmax(480px,1.18fr);gap:48px;align-items:start}.xgate-copy{padding-top:24px}.xgate-kicker{font-size:11px;letter-spacing:.16em;color:#79d431;font-weight:900;text-transform:uppercase}.xgate h1{font-size:clamp(46px,6vw,82px);line-height:.94;letter-spacing:-.06em;margin:16px 0 22px}.xgate-copy>p{color:#9ba5b0;line-height:1.65;font-size:16px;max-width:560px}
    .xgate-points{display:grid;gap:11px;margin-top:28px}.xgate-point{display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:start;color:#cbd2d9;font-size:13px}.xgate-point i{width:24px;height:24px;border:1px solid #395022;border-radius:50%;display:grid;place-items:center;color:#79d431;font-style:normal;font-size:11px}
    .xgate-card{background:linear-gradient(155deg,#151b22,#0e1319);border:1px solid #27313b;border-radius:22px;padding:26px;box-shadow:0 30px 90px rgba(0,0,0,.35)}.xgate-card h2{font-size:25px;margin:0 0 7px}.xgate-card>p{color:#8e98a4;font-size:12px;line-height:1.55;margin:0 0 22px}.xgate-form{display:grid;grid-template-columns:1fr 1fr;gap:13px}.xgate-field{display:grid;gap:6px}.xgate-field.full{grid-column:1/-1}.xgate-field label{font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#aeb7c1;font-weight:800}.xgate input,.xgate select,.xgate textarea{width:100%;border:1px solid #34404b;border-radius:9px;background:#090d12;color:#f4f7fa;padding:11px 12px;font:inherit;font-size:13px;outline:none}.xgate textarea{min-height:82px;resize:vertical}.xgate input:focus,.xgate select:focus,.xgate textarea:focus{border-color:#5b86ff;box-shadow:0 0 0 3px rgba(91,134,255,.12)}
    .xgate-consent{grid-column:1/-1;display:flex;gap:9px;align-items:flex-start;color:#98a2ad;font-size:11px;line-height:1.45}.xgate-consent input{width:17px;height:17px;margin:1px 0 0;flex:0 0 auto}.xgate-submit{grid-column:1/-1;border:0;border-radius:10px;background:#79d431;color:#0b1008;padding:13px 16px;font-weight:950;font-size:13px}.xgate-submit:hover{filter:brightness(1.06)}.xgate-submit:disabled{opacity:.55;cursor:wait}.xgate-msg{grid-column:1/-1;min-height:18px;font-size:11px;color:#ff6b63}.xgate-note{grid-column:1/-1;border-top:1px solid #27313b;padding-top:13px;color:#697580;font-size:10px;line-height:1.5}.xgate-sales{margin-top:24px;color:#87919c;font-size:11px}.xgate-sales a{color:#fff;font-weight:800}
    @media(max-width:900px){.xgate-grid{grid-template-columns:1fr}.xgate-copy{padding-top:0}.xgate-card{padding:20px}.xgate-top{margin-bottom:28px}}@media(max-width:620px){.xgate-form{grid-template-columns:1fr}.xgate-field.full,.xgate-consent,.xgate-submit,.xgate-msg,.xgate-note{grid-column:auto}.xgate h1{font-size:48px}.xgate-back{display:none}}
  `;
  document.head.appendChild(style);

  const gate = document.createElement('section');
  gate.className = 'xgate';
  gate.dataset.demoGate = 'true';
  gate.innerHTML = `
    <div class="xgate-shell">
      <div class="xgate-top">
        <a class="xgate-brand" href="tms.html"><img src="assets/brand/XOLUM_Icon_64x64.png" alt="XOLUM"><div><b>TMS <span>XOLUM</span></b><small>Demo privada · Acceso por invitación</small></div></a>
        <a class="xgate-back" href="tms.html">VOLVER A PRESENTACIÓN</a>
      </div>
      <div class="xgate-grid">
        <div class="xgate-copy">
          <div class="xgate-kicker">DEMO INTERACTIVA / ACCESO CONTROLADO</div>
          <h1>Tu operación merece algo más que otra pantalla.</h1>
          <p>La demo permite recorrer una Torre de Control conceptual, rutas, entregas, POD, excepciones, tracking y SafeRoute. Antes de entrar necesitamos entender el tamaño y contexto de tu operación para que la conversación comercial tenga sentido.</p>
          <div class="xgate-points">
            <div class="xgate-point"><i>01</i><span>Información de contacto y empresa.</span></div>
            <div class="xgate-point"><i>02</i><span>Escala de flota, entregas y cobertura geográfica.</span></div>
            <div class="xgate-point"><i>03</i><span>Sistemas actuales y principal fricción operativa.</span></div>
            <div class="xgate-point"><i>04</i><span>Código de invitación asignado por XOLUM.</span></div>
          </div>
          <div class="xgate-sales">¿Aún no tienes código? <a href="mailto:contacto@xolum.com.mx?subject=Solicitud%20de%20acceso%20-%20Demo%20TMS%20XOLUM">Solicitar acceso comercial ↗</a></div>
        </div>
        <div class="xgate-card">
          <h2>Solicita / valida tu acceso</h2>
          <p>Completa todos los datos marcados. La demo utiliza información simulada y no expone operación real.</p>
          <form class="xgate-form" data-gate-form novalidate>
            <div class="xgate-field"><label for="g-name">Nombre completo *</label><input id="g-name" name="name" autocomplete="name" required minlength="3"></div>
            <div class="xgate-field"><label for="g-role">Puesto / responsabilidad *</label><input id="g-role" name="role" required placeholder="Logística, tráfico, operaciones..."></div>
            <div class="xgate-field"><label for="g-company">Empresa *</label><input id="g-company" name="company" autocomplete="organization" required minlength="2"></div>
            <div class="xgate-field"><label for="g-email">Correo empresarial *</label><input id="g-email" name="email" type="email" autocomplete="email" required></div>
            <div class="xgate-field"><label for="g-phone">Teléfono *</label><input id="g-phone" name="phone" type="tel" autocomplete="tel" required minlength="8"></div>
            <div class="xgate-field"><label for="g-industry">Giro / industria *</label><input id="g-industry" name="industry" required placeholder="Retail, manufactura, 3PL..."></div>
            <div class="xgate-field"><label for="g-model">Modelo de operación *</label><select id="g-model" name="model" required><option value="">Selecciona</option><option>Flota propia</option><option>Transportistas / 3PL</option><option>Operación mixta</option><option>Última milla tercerizada</option></select></div>
            <div class="xgate-field"><label for="g-units">Unidades aproximadas *</label><select id="g-units" name="units" required><option value="">Selecciona</option><option>1 - 10</option><option>11 - 25</option><option>26 - 50</option><option>51 - 100</option><option>101 - 250</option><option>251 - 500</option><option>Más de 500</option></select></div>
            <div class="xgate-field"><label for="g-stops">Puntos de entrega / día *</label><select id="g-stops" name="stops" required><option value="">Selecciona</option><option>1 - 50</option><option>51 - 150</option><option>151 - 500</option><option>501 - 1,000</option><option>1,001 - 5,000</option><option>Más de 5,000</option></select></div>
            <div class="xgate-field"><label for="g-horizon">Horizonte de implementación *</label><select id="g-horizon" name="horizon" required><option value="">Selecciona</option><option>Inmediato / 0-3 meses</option><option>3-6 meses</option><option>6-12 meses</option><option>Exploración / más de 12 meses</option></select></div>
            <div class="xgate-field full"><label for="g-cities">Principales ciudades, municipios o zonas de entrega *</label><input id="g-cities" name="cities" required placeholder="Ej. CDMX, Monterrey, Guadalajara, Querétaro..."></div>
            <div class="xgate-field full"><label for="g-stack">ERP / WMS / TMS / sistemas actuales</label><input id="g-stack" name="stack" placeholder="SAP, Oracle, Dynamics, Excel, desarrollo propio..."></div>
            <div class="xgate-field full"><label for="g-pain">Principal reto operativo *</label><textarea id="g-pain" name="pain" required minlength="10" placeholder="¿Qué te duele hoy? Rutas, evidencias, Carta Porte, seguimiento, reintentos, costos, SLA..."></textarea></div>
            <div class="xgate-field"><label for="g-fiscal">¿Requiere CFDI / Carta Porte? *</label><select id="g-fiscal" name="fiscal" required><option value="">Selecciona</option><option>Sí, es crítico</option><option>Sí, en algunos viajes</option><option>No actualmente</option><option>Por definir</option></select></div>
            <div class="xgate-field"><label for="g-code">Código de invitación *</label><input id="g-code" name="code" required autocomplete="one-time-code" spellcheck="false"></div>
            <label class="xgate-consent"><input type="checkbox" name="consent" required><span>Confirmo que los datos son de contacto comercial y autorizo su uso para evaluar una posible implementación de TMS XOLUM.</span></label>
            <button class="xgate-submit" type="submit">VALIDAR Y ENTRAR A LA DEMO →</button>
            <div class="xgate-msg" data-gate-message aria-live="polite"></div>
            <div class="xgate-note">Entorno de prueba: el formulario se valida en el navegador y los datos permanecen únicamente durante esta sesión. En producción, invitaciones y prospectos se validarán y registrarán del lado servidor.</div>
          </form>
        </div>
      </div>
    </div>`;
  document.body.prepend(gate);

  const form = gate.querySelector('[data-gate-form]');
  const message = gate.querySelector('[data-gate-message]');

  async function sha256(value) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    if (!form.reportValidity()) return;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'VALIDANDO...';
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const normalizedCode = String(data.code || '').trim().toUpperCase();
      const digest = await sha256(normalizedCode);
      if (digest !== TEST_CODE_SHA256) {
        message.textContent = 'Código de invitación no válido. Verifica el código asignado por XOLUM.';
        return;
      }
      delete data.code;
      delete data.consent;
      sessionStorage.setItem(LEAD_KEY, JSON.stringify({...data, qualifiedAt: new Date().toISOString()}));
      sessionStorage.setItem(ACCESS_KEY, 'granted');
      grant();
    } catch (error) {
      message.textContent = 'No fue posible validar el acceso en este navegador. Intenta nuevamente.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'VALIDAR Y ENTRAR A LA DEMO →';
    }
  });
})();