/**
 * Receptor de Telemetria en Cloudflare Workers
 * Repositorio: SistemasDistribuidos (Nandofernando28)
 */

// Buffer en memoria para la ultima metrica y el historial
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

    // Cabeceras CORS comunes
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, User-Agent",
    };

    // Manejo de preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ENDPOINT 1: Recibir metricas (POST / o POST /api/metricas)
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

        // Actualizar estado en memoria
        estadoActual.ultimaActualizacion = timestamp;
        estadoActual.ipRemitente = ip;
        estadoActual.ubicacion = `${ciudad}, ${pais}`;
        estadoActual.metricas = datosParseados;

        // Mantener los ultimos 20 registros
        estadoActual.historial.unshift(registro);
        if (estadoActual.historial.length > 20) {
          estadoActual.historial.pop();
        }

        // Log en consola (visible con `wrangler tail` o en el panel de Cloudflare)
        console.log(`[RECEPTOR WORKER] Metricas recibidas de ${ip} (${ciudad}, ${pais}):`, rawBody);

        return new Response(
          JSON.stringify({
            status: "exito",
            mensaje: "Metricas recibidas y procesadas por el Worker Receptor",
            ipOrigen: ip,
            ubicacion: `${ciudad}, ${pais}`,
            timestamp
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ status: "error", mensaje: err.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ENDPOINT 2: API JSON para consultar las metricas actuales
    if (url.pathname === "/api/metricas") {
      return new Response(JSON.stringify(estadoActual, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      });
    }

    // ENDPOINT 3: Dashboard Web interactivo en tiempo real (GET /)
    if (request.method === "GET") {
      const html = renderizarDashboard(url.origin);
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Cache-Control": "no-store"
        }
      });
    }

    return new Response("Ruta no encontrada", { status: 404 });
  }
};

/**
 * Genera la interfaz del Dashboard Web
 */
function renderizarDashboard(originUrl) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receptor Cloudflare Worker | Sistemas Distribuidos</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(22, 29, 47, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --accent: #f6821f; /* Cloudflare Orange */
      --accent-glow: rgba(246, 130, 31, 0.25);
      --cyan: #06b6d4;
      --purple: #8b5cf6;
      --green: #10b981;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(246, 130, 31, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.1) 0px, transparent 50%);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--card-border);
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-area h1 {
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .badge-cf {
      background: linear-gradient(135deg, #f6821f, #faad3f);
      color: #000;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 0.25rem;
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--green);
      padding: 0.45rem 1rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .endpoint-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .endpoint-info code {
      font-family: 'JetBrains Mono', monospace;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .copy-btn {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text);
      border: 1px solid var(--card-border);
      padding: 0.45rem 1rem;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(12px);
      border-radius: 18px;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s, border-color 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .metric-title {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .metric-icon {
      font-size: 1.3rem;
    }

    .metric-value {
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: -1px;
      margin-bottom: 0.75rem;
    }

    .progress-bar-bg {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .progress-fill {
      height: 100%;
      width: 0%;
      border-radius: 9999px;
      transition: width 0.5s ease;
    }

    .fill-cpu { background: linear-gradient(90deg, #f6821f, #ef4444); }
    .fill-ram { background: linear-gradient(90deg, #8b5cf6, #3b82f6); }
    .fill-disk { background: linear-gradient(90deg, #06b6d4, #10b981); }

    .metric-footer {
      font-size: 0.85rem;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
    }

    .info-section {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      background: rgba(0, 0, 0, 0.2);
      padding: 1rem;
      border-radius: 12px;
    }

    .meta-item .meta-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 0.2rem;
    }

    .meta-item .meta-val {
      font-size: 0.95rem;
      font-family: 'JetBrains Mono', monospace;
      color: #e2e8f0;
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      margin-top: 1rem;
    }

    .history-table th {
      text-align: left;
      padding: 0.75rem;
      color: var(--text-muted);
      border-bottom: 1px solid var(--card-border);
      font-weight: 600;
    }

    .history-table td {
      padding: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-family: 'JetBrains Mono', monospace;
      color: #cbd5e1;
    }

    .no-data {
      text-align: center;
      padding: 2.5rem;
      color: var(--text-muted);
      font-size: 0.95rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="title-area">
        <h1>
          Receptor Telemetría
          <span class="badge-cf">Cloudflare Worker</span>
        </h1>
        <p class="subtitle">Sistemas Distribuidos &bull; Repositorio GitHub: <strong>Nandofernando28/SistemasDistribuidos</strong></p>
      </div>
      <div class="status-pill" id="statusIndicator">
        <div class="status-dot"></div>
        <span id="statusText">Worker Online &bull; Escuchando</span>
      </div>
    </header>

    <div class="endpoint-card">
      <div class="endpoint-info">
        <span style="color: var(--text-muted); font-size: 0.85rem; display: block; margin-bottom: 0.3rem;">URL del Receptor para el Emisor Java:</span>
        <code id="endpointUrl">${originUrl}</code>
      </div>
      <button class="copy-btn" onclick="copiarUrl()">📋 Copiar URL</button>
    </div>

    <div class="grid">
      <!-- CPU -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Carga de CPU</span>
          <span class="metric-icon">⚡</span>
        </div>
        <div class="metric-value" id="valCpu">-- %</div>
        <div class="progress-bar-bg">
          <div class="progress-fill fill-cpu" id="barCpu"></div>
        </div>
        <div class="metric-footer">
          <span>Uso de procesamiento</span>
          <span id="subCpu">Esperando reporte...</span>
        </div>
      </div>

      <!-- RAM -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Memoria RAM</span>
          <span class="metric-icon">🧠</span>
        </div>
        <div class="metric-value" id="valRam">-- GB</div>
        <div class="progress-bar-bg">
          <div class="progress-fill fill-ram" id="barRam"></div>
        </div>
        <div class="metric-footer">
          <span id="subRamLabel">Usada / Total</span>
          <span id="subRam">-- / -- GB</span>
        </div>
      </div>

      <!-- DISCO -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">Disco Local</span>
          <span class="metric-icon">💾</span>
        </div>
        <div class="metric-value" id="valDisk">-- GB</div>
        <div class="progress-bar-bg">
          <div class="progress-fill fill-disk" id="barDisk"></div>
        </div>
        <div class="metric-footer">
          <span>Ocupación de disco C:</span>
          <span id="subDisk">-- / -- GB</span>
        </div>
      </div>
    </div>

    <!-- Metadata del Emisor -->
    <div class="info-section">
      <div class="section-title">📡 Datos de Conexión del Emisor</div>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">IP del Emisor</div>
          <div class="meta-val" id="metaIp">--</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Ubicación Geo / Edge</div>
          <div class="meta-val" id="metaUbicacion">--</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Último Reporte Recibido</div>
          <div class="meta-val" id="metaHora">Ninguno todavía</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Frecuencia de Actualización</div>
          <div class="meta-val">Auto-refresco (2s)</div>
        </div>
      </div>
    </div>

    <!-- Historial -->
    <div class="info-section">
      <div class="section-title">📜 Registro de Telemetría Recibida</div>
      <div style="overflow-x: auto;">
        <table class="history-table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>IP Origen</th>
              <th>Ubicación</th>
              <th>Resumen de Métricas / Mensaje</th>
            </tr>
          </thead>
          <tbody id="historyBody">
            <tr>
              <td colspan="4" class="no-data">Esperando que el Emisor Java comience a enviar datos...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    function copiarUrl() {
      const url = document.getElementById('endpointUrl').innerText;
      navigator.clipboard.writeText(url).then(() => {
        alert('URL copiada: ' + url + '\\nPégala en el comando de tu Emisor Java.');
      });
    }

    async function actualizarDatos() {
      try {
        const res = await fetch('/api/metricas');
        const data = await res.json();

        if (data.metricas) {
          const m = data.metricas;
          
          // CPU
          if (typeof m.cpu === 'number') {
            document.getElementById('valCpu').innerText = m.cpu.toFixed(1) + ' %';
            document.getElementById('barCpu').style.width = Math.min(100, m.cpu) + '%';
            document.getElementById('subCpu').innerText = 'Carga normal del sistema';
          }

          // RAM
          if (m.ramUsadaGB && m.ramTotalGB) {
            document.getElementById('valRam').innerText = m.ramUsadaGB.toFixed(2) + ' GB';
            const ramPct = (m.ramUsadaGB / m.ramTotalGB) * 100;
            document.getElementById('barRam').style.width = Math.min(100, ramPct) + '%';
            document.getElementById('subRam').innerText = m.ramUsadaGB.toFixed(2) + ' / ' + m.ramTotalGB.toFixed(2) + ' GB';
          }

          // Disco
          if (m.discoUsadoGB && m.discoTotalGB) {
            document.getElementById('valDisk').innerText = m.discoUsadoGB.toFixed(1) + ' GB';
            const diskPct = (m.discoUsadoGB / m.discoTotalGB) * 100;
            document.getElementById('barDisk').style.width = Math.min(100, diskPct) + '%';
            document.getElementById('subDisk').innerText = m.discoUsadoGB.toFixed(1) + ' / ' + m.discoTotalGB.toFixed(1) + ' GB';
          }

          // Metadatos
          document.getElementById('metaIp').innerText = data.ipRemitente || '--';
          document.getElementById('metaUbicacion').innerText = data.ubicacion || '--';
          if (data.ultimaActualizacion) {
            const fecha = new Date(data.ultimaActualizacion);
            document.getElementById('metaHora').innerText = fecha.toLocaleTimeString();
          }

          // Historial
          if (data.historial && data.historial.length > 0) {
            const tbody = document.getElementById('historyBody');
            tbody.innerHTML = data.historial.map(item => {
              const h = new Date(item.timestamp).toLocaleTimeString();
              const detalle = item.datos.resumen || item.datos.mensaje || JSON.stringify(item.datos);
              return '<tr>' +
                '<td>' + h + '</td>' +
                '<td>' + item.ipRemitente + '</td>' +
                '<td>' + item.ubicacion + '</td>' +
                '<td>' + detalle + '</td>' +
                '</tr>';
            }).join('');
          }
        }
      } catch (err) {
        console.error('Error al actualizar metricas:', err);
      }
    }

    // Polling cada 2 segundos
    setInterval(actualizarDatos, 2000);
    actualizarDatos();
  </script>
</body>
</html>`;
}
