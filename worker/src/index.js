/**
 * Receptor de Telemetria en Cloudflare Workers - Modo Terminal
 * Repositorio: SistemasDistribuidos (Nandofernando28)
 */

let estadoActual = {
  ultimaActualizacion: null,
  ipRemitente: null,
  ubicacion: null,
  metricas: null,
  historial: []
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, User-Agent",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ENDPOINT POST: Recibir mensajes / metricas desde Java
    if (request.method === "POST") {
      try {
        const rawBody = await request.text();
        const ip = request.headers.get("cf-connecting-ip") || "127.0.0.1";
        const pais = request.cf?.country || "Local";
        const ciudad = request.cf?.city || "Local";
        const userAgent = request.headers.get("user-agent") || "Desconocido";
        const timestamp = new Date().toISOString();

        let datosParseados = null;
        try {
          datosParseados = JSON.parse(rawBody);
        } catch {
          datosParseados = { mensaje: rawBody };
        }

        const registro = {
          id: Date.now(),
          timestamp,
          ipRemitente: ip,
          ubicacion: `${ciudad}, ${pais}`,
          userAgent,
          datos: datosParseados
        };

        estadoActual.ultimaActualizacion = timestamp;
        estadoActual.ipRemitente = ip;
        estadoActual.ubicacion = `${ciudad}, ${pais}`;
        estadoActual.metricas = datosParseados;

        // Guardar ultimos 50 mensajes en el buffer
        estadoActual.historial.unshift(registro);
        if (estadoActual.historial.length > 50) {
          estadoActual.historial.pop();
        }

        console.log(`[ORIGEN: ${ip} | ${ciudad}, ${pais}] Mensaje:`, rawBody);

        return new Response(
          JSON.stringify({
            status: "exito",
            mensaje: "Mensaje recibido correctamente por el Worker Receptor",
            ipOrigen: ip,
            timestamp
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ status: "error", mensaje: err.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ENDPOINT GET /api/metricas: Consulta de mensajes
    if (url.pathname === "/api/metricas") {
      return new Response(JSON.stringify(estadoActual), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      });
    }

    // ENDPOINT GET /: Terminal interactiva en el navegador
    if (request.method === "GET") {
      const html = renderizarTerminal(url.origin);
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Cache-Control": "no-store"
        }
      });
    }

    return new Response("404 Not Found", { status: 404 });
  }
};

/**
 * Vista de Terminal simple, directa y minimalista
 */
function renderizarTerminal(originUrl) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receptor | Terminal Cloudflare Worker</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0b0f17;
      color: #e6edf3;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      padding: 1.5rem;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .terminal {
      width: 100%;
      max-width: 950px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 12px 35px rgba(0,0,0,0.7);
    }
    .header {
      background: #161b22;
      padding: 0.65rem 1rem;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #30363d;
      user-select: none;
    }
    .dots {
      display: flex;
      gap: 7px;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }
    .title {
      flex: 1;
      text-align: center;
      color: #8b949e;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .body {
      padding: 1.25rem;
      font-size: 0.92rem;
      line-height: 1.6;
      height: 75vh;
      overflow-y: auto;
      background: #090d13;
    }
    .line {
      margin-bottom: 0.35rem;
      word-break: break-all;
    }
    .prompt { color: #58a6ff; font-weight: 600; }
    .success { color: #3fb950; font-weight: 600; }
    .info { color: #79c0ff; }
    .dim { color: #484f58; }
    .origin { color: #bc8cff; font-weight: 600; }
    .msg-label { color: #38bdf8; font-weight: 600; }
    .msg-text { color: #f0883e; }
    .cursor {
      display: inline-block;
      width: 8px;
      height: 16px;
      background: #3fb950;
      vertical-align: text-bottom;
      animation: blink 1s step-end infinite;
      margin-left: 4px;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="terminal">
    <div class="header">
      <div class="dots">
        <div class="dot dot-red"></div>
        <div class="dot dot-yellow"></div>
        <div class="dot dot-green"></div>
      </div>
      <div class="title">receptor@cloudflare-worker:~ (Sistemas Distribuidos)</div>
    </div>
    <div class="body" id="termBody">
      <div class="line"><span class="prompt">nando@servidor:~$</span> ./iniciar-receptor</div>
      <div class="line"><span class="info">[SISTEMAS DISTRIBUIDOS]</span> Receptor inicializado en Cloudflare Workers</div>
      <div class="line"><span class="info">[URL RECEPTOR]</span> ${originUrl}</div>
      <div class="line"><span class="success">[ESTADO]</span> Esperando mensajes de EmisorWorker.java...</div>
      <div class="line dim">--------------------------------------------------------------------------------</div>
      <div id="logs"></div>
      <div class="line" style="margin-top: 0.6rem;">
        <span class="prompt">receptor&gt;</span> <span class="cursor"></span>
      </div>
    </div>
  </div>

  <script>
    let ultimoId = 0;
    const logsEl = document.getElementById('logs');
    const termBody = document.getElementById('termBody');

    async function cargarMensajes() {
      try {
        const res = await fetch('/api/metricas');
        const data = await res.json();

        if (data.historial && data.historial.length > 0) {
          // Invertir para mostrar de mas antiguo a mas reciente
          const lista = [...data.historial].reverse();
          let nuevos = false;

          lista.forEach(item => {
            if (item.id > ultimoId) {
              nuevos = true;
              ultimoId = item.id;

              const hora = new Date(item.timestamp).toLocaleTimeString();
              const contenido = item.datos.resumen || item.datos.mensaje || JSON.stringify(item.datos);

              const bloque = document.createElement('div');
              bloque.style.marginBottom = '0.75rem';
              bloque.innerHTML = 
                '<div class="line">' +
                  '<span class="dim">[' + hora + ']</span> ' +
                  '<span class="origin">Origen: ' + item.ipRemitente + ' (' + item.ubicacion + ')</span>' +
                '</div>' +
                '<div class="line" style="padding-left: 1rem;">' +
                  '<span class="msg-label">Mensaje:</span> <span class="msg-text">' + escapeHtml(contenido) + '</span>' +
                '</div>' +
                '<div class="line dim">--------------------------------------------------------------------------------</div>';

              logsEl.appendChild(bloque);
            }
          });

          if (nuevos) {
            termBody.scrollTop = termBody.scrollHeight;
          }
        }
      } catch (e) {
        console.error('Error:', e);
      }
    }

    function escapeHtml(str) {
      const p = document.createElement('p');
      p.innerText = str;
      return p.innerHTML;
    }

    setInterval(cargarMensajes, 1500);
    cargarMensajes();
  </script>
</body>
</html>`;
}
