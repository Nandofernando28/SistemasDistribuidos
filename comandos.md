# Comandos de Compilación General
javac -d bin MetricasSistema.java Emisor.java Receptor.java EmisorWorker.java

---

# 1. Modo Local (Sockets Datagrama UDP)

### Receptor UDP (en la máquina que escucha, puerto 50000)
java -cp bin socket.sinconexion.simplex.Receptor 50000

### Emisor UDP (envío único de métricas)
java -cp bin socket.sinconexion.simplex.Emisor 192.168.137.177 50000

### Emisor UDP (enviar métricas continuamente cada 3 segundos desde PowerShell)
while ($true) { java -cp bin socket.sinconexion.simplex.Emisor 192.168.137.177 50000; Start-Sleep -Seconds 3 }

### Emisor UDP (mensaje manual personalizado opcional)
java -cp bin socket.sinconexion.simplex.Emisor 192.168.137.177 50000 "Hola mundo"

---

# 2. Modo Cloud (Receptor en Cloudflare Workers)

### Iniciar el Worker localmente (desarrollo)
cd worker
npm install
npm run dev

### Enviar métricas desde Java al Worker local (puerto 8787)
java -cp bin socket.sinconexion.simplex.EmisorWorker http://localhost:8787

### Enviar métricas continuamente al Worker local cada 3 segundos
while ($true) { java -cp bin socket.sinconexion.simplex.EmisorWorker http://localhost:8787; Start-Sleep -Seconds 3 }

### Desplegar el Worker a Cloudflare (Producción)
cd worker
npx wrangler login
npm run deploy

### Enviar métricas al Worker en la Nube (Cloudflare)
while ($true) { java -cp bin socket.sinconexion.simplex.EmisorWorker https://sistemas-distribuidos-receptor.jbdb-backend.workers.dev; Start-Sleep -Seconds 3 }

---

# 3. Comandos de Git y GitHub

### Inicializar repositorio local y conectar con GitHub
git init
git add .
git commit -m "Estructura inicial: Sockets UDP y Receptor Cloudflare Worker"
git branch -M main
git remote add origin https://github.com/Nandofernando28/SistemasDistribuidos.git
git push -u origin main
