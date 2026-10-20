# Receptor en Cloudflare Workers

Este servicio actúa como el **Receptor en la nube** de telemetría y métricas del sistema.

## Características
- **Receptor HTTP/JSON:** Escucha peticiones `POST` enviadas desde el `EmisorWorker.java`.
- **Dashboard Web en Vivo:** Si abres la URL en el navegador (`GET /`), verás un panel oscuro interactivo en tiempo real con barras de CPU, RAM, Disco, IP de origen y geolocalización.
- **API REST:** Endpoint `GET /api/metricas` para obtener el último estado e historial en formato JSON.
- **Serverless & Edge:** Desplegado en la red global de Cloudflare.

## Desarrollo Local

1. Instalar dependencias:
   ```bash
   cd worker
   npm install
   ```

2. Iniciar el servidor local de desarrollo:
   ```bash
   npm run dev
   ```
   El worker estará disponible en `http://localhost:8787`.

3. Probar el emisor Java contra el worker local:
   ```powershell
   java -cp ../bin socket.sinconexion.simplex.EmisorWorker http://localhost:8787
   ```

## Despliegue a Producción en Cloudflare

1. Iniciar sesión en Cloudflare (solo la primera vez):
   ```bash
   npx wrangler login
   ```

2. Desplegar el Worker:
   ```bash
   npm run deploy
   ```
   Cloudflare te proporcionará una URL pública única (ej. `https://sistemas-distribuidos-receptor.<tu-usuario>.workers.dev`).

3. Ver logs en tiempo real:
   ```bash
   npm run tail
   ```
