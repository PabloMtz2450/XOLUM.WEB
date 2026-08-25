(() => {
  'use strict';

  const ACCESS_KEY = 'xolum_tms_demo_access';
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
    sessionStorage.setItem(ACCESS_KEY, 'granted');
    app.hidden = false;
    document.querySelector('[data-demo-gate]')?.remove();
    loadCore();
  };

  if (sessionStorage.getItem(ACCESS_KEY) === 'granted') {
    grant();
    return;
  }

  app.hidden = true;
  const style = document.createElement('style');
  style.textContent = `
    .xgate{min-height:100vh;background:radial-gradient(circle at 70% 10%,#172318 0,#0a0e12 35%,#070a0e 72%);color:#f5f7fa;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:28px 18px 60px}.xgate *{box-sizing:border-box}.xgate-shell{width:min(980px,100%);margin:auto}.xgate-top{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:70px}.xgate-brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit}.xgate-brand img{width:48px;height:48px;object-fit:contain}.xgate-brand b{font-size:20px}.xgate-brand b span{color:#79d431}.xgate-brand small{display:block;color:#8f99a5;font-size:11px;margin-top:2px}.xgate-back{border:1px solid #2a343e;border-radius:999px;padding:10px 15px;text-decoration:none;color:#dce2e8;font-size:12px;font-weight:800}.xgate-card{max-width:660px;margin:auto;background:linear-gradient(155deg,#151b22,#0e1319);border:1px solid #27313b;border-radius:26px;padding:34px;box-shadow:0 35px 110px rgba(0,0,0,.38);text-align:center}.xgate-kicker{font-size:11px;letter-spacing:.16em;color:#79d431;font-weight:900;text-transform:uppercase}.xgate h1{font-size:clamp(42px,6vw,70px);line-height:.94;letter-spacing:-.06em;margin:16px 0 18px}.xgate p{color:#99a4af;line-height:1.65;font-size:14px;max-width:540px;margin:0 auto 26px}.xgate-form{display:grid;gap:11px;max-width:460px;margin:auto}.xgate label{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#b7c0ca;font-weight:850;text-align:left}.xgate input{width:100%;border:1px solid #34404b;border-radius:11px;background:#090d12;color:#f4f7fa;padding:14px 15px;font:inherit;font-size:15px;outline:none;text-align:center;letter-spacing:.05em}.xgate input:focus{border-color:#79d431;box-shadow:0 0 0 3px rgba(121,212,49,.12)}.xgate button{border:0;border-radius:11px;background:#79d431;color:#0b1008;padding:14px 16px;font-weight:950;font-size:13px;cursor:pointer}.xgate button:disabled{opacity:.55;cursor:wait}.xgate-msg{min-height:18px;font-size:11px;color:#ff6b63}.xgate-hint{margin-top:25px;padding-top:18px;border-top:1px solid #27313b;color:#6f7a86;font-size:10px;line-height:1.6}.xgate-links{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}.xgate-links a{border:1px solid #2c3741;border-radius:999px;padding:9px 12px;color:#cbd2d9;text-decoration:none;font-size:10px;font-weight:800}@media(max-width:620px){.xgate-card{padding:25px 18px}.xgate-top{margin-bottom:42px}.xgate-back{display:none}.xgate h1{font-size:46px}}
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
      <div class="xgate-card">
        <div class="xgate-kicker">ACCESO DEMO / TMS XOLUM</div>
        <h1>Entra. Prueba. Entiende.</h1>
        <p>Sin formularios eternos. Usa tu código de invitación y entra directo a la operación: pedidos, planeación, rutas, Torre de Control y app del operador.</p>
        <form class="xgate-form" data-gate-form novalidate>
          <label for="g-code">Código de acceso</label>
          <input id="g-code" name="code" required autocomplete="one-time-code" spellcheck="false" autofocus placeholder="INGRESA TU CÓDIGO">
          <button type="submit">ENTRAR A LA DEMO →</button>
          <div class="xgate-msg" data-gate-message aria-live="polite"></div>
        </form>
        <div class="xgate-links"><a href="tms-driver.html">VER APP OPERADOR</a><a href="tms.html">VER PRESENTACIÓN</a></div>
        <div class="xgate-hint">Entorno de demostración con información simulada. El código sólo controla el acceso comercial de esta prueba estática; la versión productiva usará autenticación y autorización del lado servidor.</div>
      </div>
    </div>`;
  document.body.prepend(gate);

  async function sha256(value) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const form = gate.querySelector('[data-gate-form]');
  const message = gate.querySelector('[data-gate-message]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'VALIDANDO...';
    message.textContent = '';
    try {
      const code = String(new FormData(form).get('code') || '').trim().toUpperCase();
      if (await sha256(code) !== TEST_CODE_SHA256) {
        message.textContent = 'Código de acceso no válido.';
        return;
      }
      grant();
    } catch {
      message.textContent = 'No fue posible validar el código en este navegador.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'ENTRAR A LA DEMO →';
    }
  });
})();