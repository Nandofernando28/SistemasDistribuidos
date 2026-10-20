# 📖 Explicación Detallada del Repositorio: Sistemas Distribuidos

Este documento describe la arquitectura, propósito y desglose técnico de cada archivo dentro del repositorio [SistemasDistribuidos](https://github.com/Nandofernando28/SistemasDistribuidos). 

El proyecto aborda dos modelos de sistemas distribuidos:
1. **Modelo Local (Sockets UDP):** Comunicación no orientada a conexión usando datagramas directos en capa de transporte.
2. **Modelo Nube / Serverless (Cloudflare Workers):** Comunicación cliente-servidor a través de HTTP/JSON hacia un receptor alojado en el Edge con interfaz de terminal interactiva.

---

## 🗂️ Índice de Archivos del Repositorio

| Archivo / Carpeta | Propósito General |
| :--- | :--- |
| [`MetricasSistema.java`](file:///c:/Users/nando/Downloads/src/MetricasSistema.java) | Módulo utilitario que extrae el uso de CPU, memoria RAM y almacenamiento en disco de la máquina local. |
| [`Emisor.java`](file:///c:/Users/nando/Downloads/src/Emisor.java) | Cliente emisor UDP local (`DatagramSocket`) que envía datagramas sin conexión a un puerto específico. |
| [`Receptor.java`](file:///c:/Users/nando/Downloads/src/Receptor.java) | Servidor receptor UDP local (`DatagramSocket`) que escucha en un puerto y muestra los paquetes recibidos. |
| [`ReceptorEmisor.java`](file:///c:/Users/nando/Downloads/src/ReceptorEmisor.java) | Proceso bidireccional (Dúplex) que recibe un datagrama UDP y reenvía una respuesta. |
| [`EmisorWorker.java`](file:///c:/Users/nando/Downloads/src/EmisorWorker.java) | Emisor HTTP moderno en Java que transmite telemetría hacia el Cloudflare Worker. |
| [`worker/src/index.js`](file:///c:/Users/nando/Downloads/src/worker/src/index.js) | Código principal del Worker en Cloudflare: actúa como receptor de telemetría y sirve una terminal web en vivo. |
| [`worker/wrangler.toml`](file:///c:/Users/nando/Downloads/src/worker/wrangler.toml) | Archivo de configuración del entorno de ejecución de Cloudflare Workers (Wrangler). |
| [`worker/package.json`](file:///c:/Users/nando/Downloads/src/worker/package.json) | Metadatos y scripts del proyecto Node.js para el Worker. |
| [`worker/README.md`](file:///c:/Users/nando/Downloads/src/worker/README.md) | Guía de uso y despliegue del componente Worker. |
| [`.github/workflows/deploy.yml`](file:///c:/Users/nando/Downloads/src/.github/workflows/deploy.yml) | Automatización CI/CD con GitHub Actions para despliegue continuo en Cloudflare. |
| [`.gitignore`](file:///c:/Users/nando/Downloads/src/.gitignore) | Reglas de exclusión para evitar subir binarios (`.class`, `bin/`) o dependencias (`node_modules/`). |
| [`comandos.md`](file:///c:/Users/nando/Downloads/src/comandos.md) | Guía rápida con comandos de compilación, ejecución y despliegue listos para copiar y pegar. |
| [`README.md`](file:///c:/Users/nando/Downloads/src/README.md) | Portada principal y documentación general del repositorio. |

---

## 🔍 Análisis Detallado de Código por Grupos Lógicos

---

### 1. `MetricasSistema.java`
**Función:** Este archivo obtiene información del hardware del sistema operativo en tiempo de ejecución. Permite formatear las métricas tanto en texto plano legible como en formato estructurado JSON.

#### Grupo 1: Declaración de Paquete e Importaciones
```java
package socket.sinconexion.simplex;

import com.sun.management.OperatingSystemMXBean;
import java.lang.management.ManagementFactory;
import java.io.File;
import java.util.Locale;
```
* **Explicación:** Se ubica dentro del paquete `socket.sinconexion.simplex`. Utiliza `OperatingSystemMXBean` de Java Management Extensions (JMX) para acceder a métricas de bajo nivel del sistema operativo (carga de CPU y memoria física). Importa `File` para consultar el espacio de disco y `Locale` para asegurar el uso de puntos decimales estándar (`.`).

#### Grupo 2: Método `obtenerMetricas()` (Formato Texto Plano)
```java
public static String obtenerMetricas() {
    OperatingSystemMXBean osBean = (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();

    double cargaCpu = osBean.getCpuLoad() * 100;
    if (cargaCpu < 0) {
        try { Thread.sleep(150); } catch (InterruptedException ignored) {}
        cargaCpu = osBean.getCpuLoad() * 100;
    }
    if (cargaCpu < 0) cargaCpu = 0.0;

    long totalRamBytes = osBean.getTotalMemorySize();
    long libreRamBytes = osBean.getFreeMemorySize();
    long usadaRamBytes = totalRamBytes - libreRamBytes;

    double totalRamGB = totalRamBytes / (1024.0 * 1024.0 * 1024.0);
    double usadaRamGB = usadaRamBytes / (1024.0 * 1024.0 * 1024.0);

    File disco = new File("C:\\");
    double discoTotalGB = disco.getTotalSpace() / (1024.0 * 1024.0 * 1024.0);
    double discoLibreGB = disco.getFreeSpace() / (1024.0 * 1024.0 * 1024.0);
    double discoUsadoGB = discoTotalGB - discoLibreGB;

    return String.format("CPU: %.1f%% | RAM: %.2f/%.2f GB | Disco C: %.1f/%.1f GB",
            cargaCpu, usadaRamGB, totalRamGB, discoUsadoGB, discoTotalGB);
}
```
* **Explicación:** 
  1. **CPU:** `osBean.getCpuLoad()` retorna un valor entre `0.0` y `1.0`. Si la máquina no tiene una muestra previa devuelve `-1`, por lo que se hace una micro-pausa de 150 ms para volver a muestrear.
  2. **RAM:** Calcula la memoria total y libre en bytes y las convierte a Gigabytes dividiendo entre $1024^3$.
  3. **Disco:** Analiza la partición `C:\` para obtener el espacio total, libre y usado en GB.
  4. Retorna una cadena formateada pensada para sockets de texto simple.

#### Grupo 3: Método `obtenerMetricasJson()` (Formato Estructurado para Web/Cloud)
```java
public static String obtenerMetricasJson() {
    // ... lectura de CPU, RAM y Disco idéntica al grupo anterior ...
    return String.format(Locale.US,
        "{\"cpu\": %.1f, \"ramUsadaGB\": %.2f, \"ramTotalGB\": %.2f, \"discoUsadoGB\": %.1f, \"discoTotalGB\": %.1f, \"resumen\": \"CPU: %.1f%% | RAM: %.2f/%.2f GB | Disco C: %.1f/%.1f GB\"}",
        cargaCpu, usadaRamGB, totalRamGB, discoUsadoGB, discoTotalGB,
        cargaCpu, usadaRamGB, totalRamGB, discoUsadoGB, discoTotalGB);
}
```
* **Explicación:** Empaqueta las mismas variables en un objeto JSON nativo. El uso explícito de `Locale.US` garantiza que los números decimales se escriban con punto (`14.26`) y no con coma (`14,26`), evitando errores de sintaxis en el intérprete JavaScript del Worker.

---

### 2. `Emisor.java`
**Función:** Proceso cliente clásico que envía datagramas UDP mediante `DatagramSocket` hacia una dirección IP y puerto de la red local.

#### Grupo 1: Validación de Argumentos y Configuración
```java
if (args.length < 2 || args.length > 3) {
    System.out.println("Uso: java -cp bin socket.sinconexion.simplex.Emisor <IP> <puerto> [mensaje_opcional]");
    // ...
} else {
    try {
      InetAddress maquinaReceptora = InetAddress.getByName(args[0]);
      int puertoReceptor = Integer.parseInt(args[1]);
```
* **Explicación:** Verifica que se proporcionen al menos 2 argumentos (la dirección IP/dominio y el puerto de escucha). Resuelve la dirección a un objeto `InetAddress`.

#### Grupo 2: Selección del Contenido (Métricas vs. Mensaje Personalizado)
```java
String mensaje;
if (args.length == 3) {
    mensaje = args[2];
} else {
    mensaje = MetricasSistema.obtenerMetricas();
}
System.out.println("Enviando a " + args[0] + ":" + puertoReceptor);
System.out.println("Mensaje: " + mensaje);
```
* **Explicación:** Si el usuario pasa un tercer argumento, envía ese texto; en caso contrario, invoca dinámicamente a `MetricasSistema.obtenerMetricas()`.

#### Grupo 3: Creación del Socket UDP y Transmisión del Datagrama
```java
DatagramSocket miSocket = new DatagramSocket();
byte[] almacen = mensaje.getBytes();
DatagramPacket datagrama =
    new DatagramPacket(almacen, almacen.length, maquinaReceptora, puertoReceptor);
miSocket.send(datagrama);
miSocket.close();
```
* **Explicación:**
  * Instancia un `DatagramSocket` local en cualquier puerto efímero libre.
  * Convierte la cadena en un arreglo de bytes (`byte[]`).
  * Construye el `DatagramPacket` especificando el buffer, la longitud, la IP destino y el puerto de destino.
  * Llama a `miSocket.send()` (envío UDP sin acuse de recibo de capa de transporte).
  * Cierra el socket para liberar los descriptores del sistema operativo.

---

### 3. `Receptor.java`
**Función:** Servidor receptor de datagramas UDP. Se queda a la escucha permanente en un puerto específico y procesa los paquetes que lleguen.

#### Grupo 1: Inicialización del Socket Servidor
```java
int puerto = Integer.parseInt(args[0]);
final int MAX_LON = 1024;
DatagramSocket miSocket = new DatagramSocket(puerto);
```
* **Explicación:** Lee el puerto como argumento por línea de comandos y enlaza (`bind`) el `DatagramSocket` a dicho puerto local para recibir tráfico entrante. Define un buffer de lectura de 1024 bytes.

#### Grupo 2: Bucle Infinito de Escucha y Procesamiento
```java
while (true) {
    byte[] almacen = new byte[MAX_LON];
    DatagramPacket datagrama = new DatagramPacket(almacen, MAX_LON);
    System.out.println("Esperando...");
    miSocket.receive(datagrama);
    
    String mensaje = new String(datagrama.getData(), 0, datagrama.getLength());
    InetAddress direccionEmisor = datagrama.getAddress();
    int puertoEmisor = datagrama.getPort();
    String origen = direccionEmisor.getHostAddress() + ":" + puertoEmisor;
    System.out.println("Origen: " + origen);
    System.out.println("Mensaje: " + mensaje);
}
```
* **Explicación:**
  * `miSocket.receive(datagrama)` es una llamada **bloqueante**: el hilo se detiene hasta que llega un paquete a la tarjeta de red.
  * Al recibirlo, extrae el texto usando únicamente la cantidad de bytes recibidos (`datagrama.getLength()`).
  * Inspecciona la cabecera del paquete para imprimir la IP y puerto origen del emisor.

---

### 4. `EmisorWorker.java`
**Función:** Adaptación del emisor a la nube. En lugar de datagramas UDP crudos, envía peticiones `HTTP POST` con el contenido en JSON hacia el Receptor serverless de Cloudflare Workers.

#### Grupo 1: Normalización de la URL y Preparación del Payload
```java
String workerUrl = args[0];
if (!workerUrl.startsWith("http://") && !workerUrl.startsWith("https://")) {
    workerUrl = "https://" + workerUrl;
}

String payload;
if (args.length == 2) {
    String mensajeCustom = args[1];
    if (mensajeCustom.trim().startsWith("{") && mensajeCustom.trim().endsWith("}")) {
        payload = mensajeCustom;
    } else {
        payload = String.format("{\"mensaje\": \"%s\"}", mensajeCustom.replace("\"", "\\\""));
    }
} else {
    payload = MetricasSistema.obtenerMetricasJson();
}
```
* **Explicación:** Garantiza que la URL cuente con protocolo `https://`. Si el usuario envía un texto plano, lo encapsula dentro de un JSON válido; si no, toma directamente las métricas del sistema generadas por `MetricasSistema`.

#### Grupo 2: Envío HTTP Asíncrono con `java.net.http.HttpClient`
```java
HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();

HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(workerUrl))
        .timeout(Duration.ofSeconds(15))
        .header("Content-Type", "application/json")
        .header("User-Agent", "Java-Emisor/1.0 (Sistemas-Distribuidos)")
        .POST(HttpRequest.BodyPublishers.ofString(payload))
        .build();

long inicio = System.currentTimeMillis();
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
long latencia = System.currentTimeMillis() - inicio;
```
* **Explicación:** Utiliza el cliente HTTP nativo introducido en Java 11+. Establece límites de tiempo (*timeouts*), asigna la cabecera `Content-Type: application/json`, calcula la latencia total de ida y vuelta (*round-trip time*) y muestra el código de estado HTTP recibido (ej. `200 OK`).

---

### 5. `worker/src/index.js` (Cloudflare Worker Receptor)
**Función:** Receptor serverless global. Sustituye al `Receptor.java` tradicional en la nube. Recibe los mensajes por `POST`, almacena los registros en memoria y presenta una interfaz web con apariencia de terminal de comandos.

#### Grupo 1: Almacenamiento en Memoria y Cabeceras CORS
```javascript
let estadoActual = {
  ultimaActualizacion: null,
  ipRemitente: null,
  ubicacion: null,
  metricas: null,
  historial: []
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, User-Agent",
};
```
* **Explicación:** Declara una estructura en el ámbito global del isolate de Cloudflare para almacenar los últimos 50 mensajes recibidos. Configura cabeceras CORS para permitir consultas desde cualquier navegador.

#### Grupo 2: Endpoint de Recepción de Mensajes (`POST /`)
```javascript
if (request.method === "POST") {
    const rawBody = await request.text();
    const ip = request.headers.get("cf-connecting-ip") || "127.0.0.1";
    const pais = request.cf?.country || "Local";
    const ciudad = request.cf?.city || "Local";
    const timestamp = new Date().toISOString();

    let datosParseados = null;
    try { datosParseados = JSON.parse(rawBody); } 
    catch { datosParseados = { mensaje: rawBody }; }

    const registro = {
      id: Date.now(),
      timestamp,
      ipRemitente: ip,
      ubicacion: `${ciudad}, ${pais}`,
      datos: datosParseados
    };

    estadoActual.historial.unshift(registro);
    if (estadoActual.historial.length > 50) estadoActual.historial.pop();

    return new Response(JSON.stringify({ status: "exito", ipOrigen: ip }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}
```
* **Explicación:**
  * Lee el cuerpo de la petición.
  * Obtiene metadatos de red proporcionados por Cloudflare: la IP real del emisor (`cf-connecting-ip`) y su ubicación geográfica estimada (`cf.country`, `cf.city`).
  * Agrega el registro al historial y mantiene un límite máximo de 50 eventos (búfer circular).
  * Retorna una confirmación JSON con código HTTP 200.

#### Grupo 3: Endpoint de Datos (`GET /api/metricas`)
```javascript
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
```
* **Explicación:** Provee una API REST para que la terminal web consulte los nuevos mensajes recibidos sin recargar la página.

#### Grupo 4: Función `renderizarTerminal()` (Interfaz de Terminal en el Navegador)
```javascript
function renderizarTerminal(originUrl) {
  return `<!DOCTYPE html>
  ...
  <div class="terminal">
    <div class="header">
      <div class="dots"><div class="dot dot-red"></div>...</div>
      <div class="title">receptor@cloudflare-worker:~ (Sistemas Distribuidos)</div>
    </div>
    <div class="body" id="termBody">
      ...
      <div id="logs"></div>
    </div>
  </div>
  ...
  <script>
    setInterval(cargarMensajes, 1500); // Polling cada 1.5s a /api/metricas
  </script>
  ...`;
}
```
* **Explicación:** Genera un documento HTML con diseño oscuro, tipografía monoespaciada *JetBrains Mono*, botones de ventana y scroll automático. Un pequeño script cliente consulta periódicamente (`polling` cada 1.5 s) el endpoint `/api/metricas` y va imprimiendo los nuevos mensajes en pantalla tal como lo haría una terminal física.

---

### 6. Archivos de Configuración e Infraestructura

#### A. `worker/wrangler.toml`
```toml
name = "sistemas-distribuidos-receptor"
main = "src/index.js"
compatibility_date = "2024-10-01"
```
* **Explicación:** Es el manifiesto de Cloudflare Wrangler. Define el nombre del Worker (`sistemas-distribuidos-receptor`), el archivo de entrada (`src/index.js`) y la versión de compatibilidad del runtime de Cloudflare.

#### B. `worker/package.json`
```json
{
  "name": "sistemas-distribuidos-receptor",
  "version": "1.0.0",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail"
  },
  "devDependencies": {
    "wrangler": "^3.114.0"
  }
}
```
* **Explicación:** Define las dependencias de desarrollo (el paquete CLI `wrangler`) y los scripts para correr el servidor local (`npm run dev`), desplegar a producción (`npm run deploy`) o inspeccionar logs en vivo (`npm run tail`).

#### C. `.github/workflows/deploy.yml` (CI/CD Automatizado)
```yaml
name: Deploy Cloudflare Worker

on:
  push:
    branches: [ main ]
    paths:
      - 'worker/**'
      - '.github/workflows/deploy.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: 'worker'
```
* **Explicación:** Configura un flujo de integración continua en GitHub Actions. Cada vez que se hace un `git push` a la rama `main` que modifique la carpeta `worker/`, GitHub levanta un contenedor Ubuntu, descarga el código y ejecuta el despliegue a Cloudflare automáticamente utilizando un token de API seguro.

#### D. `.gitignore`
* **Explicación:** Especifica patrones de exclusión para Git:
  * `bin/` y `*.class`: Evita subir código binario compilado de Java.
  * `node_modules/` y `.wrangler/`: Evita subir dependencias pesadas de Node.js y archivos temporales de Cloudflare.

#### E. `comandos.md` y `README.md`
* **Explicación:** 
  * `comandos.md` sirve como cuaderno rápido de ejecución en PowerShell para compilar y ejecutar tanto el modo UDP local como el modo Cloud.
  * `README.md` es la presentación oficial del repositorio con diagramas de flujo en Mermaid y documentación general.

---

## 🔄 Resumen del Flujo de Datos

```text
[EmisorWorker.java]
       │
       ▼ (HTTP POST con JSON de CPU, RAM, Disco)
[Red Global de Cloudflare]
       │
       ▼
[Cloudflare Worker Receptor: worker/src/index.js]
  ├── Extrae IP del emisor y ciudad/país
  ├── Almacena en historial en memoria
  └── Responde HTTP 200 OK
       │
       ▼ (Polling cada 1.5s)
[Navegador Web: Terminal en Vivo]
  └── Imprime los mensajes en la consola web con scroll automático
```
