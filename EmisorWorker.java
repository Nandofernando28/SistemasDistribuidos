package socket.sinconexion.simplex;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Emisor HTTP para Cloudflare Workers.
 * Envia metricas del sistema (CPU, RAM, Disco) o un mensaje personalizado
 * hacia el Receptor desplegado en Cloudflare Workers.
 */
public class EmisorWorker {

    public static void main(String[] args) {
        if (args.length < 1 || args.length > 2) {
            System.out.println("==========================================================================");
            System.out.println("Uso: java -cp bin socket.sinconexion.simplex.EmisorWorker <URL_WORKER> [mensaje]");
            System.out.println("--------------------------------------------------------------------------");
            System.out.println("Ejemplos:");
            System.out.println("  1) Metricas automaticas:");
            System.out.println("     java -cp bin socket.sinconexion.simplex.EmisorWorker https://sistemas-distribuidos-receptor.<subdominio>.workers.dev");
            System.out.println("  2) Envio local durante desarrollo:");
            System.out.println("     java -cp bin socket.sinconexion.simplex.EmisorWorker http://localhost:8787");
            System.out.println("  3) Mensaje personalizado:");
            System.out.println("     java -cp bin socket.sinconexion.simplex.EmisorWorker http://localhost:8787 \"Hola desde Java\"");
            System.out.println("==========================================================================");
            return;
        }

        String workerUrl = args[0];
        // Asegurarse de que empiece con http:// o https://
        if (!workerUrl.startsWith("http://") && !workerUrl.startsWith("https://")) {
            workerUrl = "https://" + workerUrl;
        }

        String payload;
        boolean esJson = true;

        if (args.length == 2) {
            String mensajeCustom = args[1];
            // Si el usuario envia un JSON directo lo mandamos tal cual, si no, lo envolvemos
            if (mensajeCustom.trim().startsWith("{") && mensajeCustom.trim().endsWith("}")) {
                payload = mensajeCustom;
            } else {
                payload = String.format("{\"mensaje\": \"%s\"}", mensajeCustom.replace("\"", "\\\""));
            }
        } else {
            payload = MetricasSistema.obtenerMetricasJson();
        }

        System.out.println("\n[EMISOR -> CLOUDFLARE WORKER]");
        System.out.println("Destino: " + workerUrl);
        System.out.println("Payload: " + payload);

        try {
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

            System.out.println("\n[RESPUESTA DEL RECEPTOR]");
            System.out.println("Estado HTTP: " + response.statusCode());
            System.out.println("Latencia:    " + latencia + " ms");
            System.out.println("Cuerpo:      " + response.body());
            System.out.println("--------------------------------------------------------------------------\n");

        } catch (Exception ex) {
            System.err.println("\n[ERROR] No se pudo comunicar con el Worker:");
            System.err.println(ex.getMessage());
            ex.printStackTrace();
        }
    }
}
