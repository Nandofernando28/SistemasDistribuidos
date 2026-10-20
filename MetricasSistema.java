package socket.sinconexion.simplex;

import com.sun.management.OperatingSystemMXBean;
import java.lang.management.ManagementFactory;
import java.io.File;
import java.util.Locale;

public class MetricasSistema {

    public static String obtenerMetricas() {
        OperatingSystemMXBean osBean = (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();

        // CPU (% de carga del sistema). Pausa breve para calcular muestra si devuelve -1 en el primer llamado
        double cargaCpu = osBean.getCpuLoad() * 100;
        if (cargaCpu < 0) {
            try { Thread.sleep(150); } catch (InterruptedException ignored) {}
            cargaCpu = osBean.getCpuLoad() * 100;
        }
        if (cargaCpu < 0) cargaCpu = 0.0;

        // Memoria RAM
        long totalRamBytes = osBean.getTotalMemorySize();
        long libreRamBytes = osBean.getFreeMemorySize();
        long usadaRamBytes = totalRamBytes - libreRamBytes;

        double totalRamGB = totalRamBytes / (1024.0 * 1024.0 * 1024.0);
        double usadaRamGB = usadaRamBytes / (1024.0 * 1024.0 * 1024.0);

        // Disco principal
        File disco = new File("C:\\");
        double discoTotalGB = disco.getTotalSpace() / (1024.0 * 1024.0 * 1024.0);
        double discoLibreGB = disco.getFreeSpace() / (1024.0 * 1024.0 * 1024.0);
        double discoUsadoGB = discoTotalGB - discoLibreGB;

        return String.format("CPU: %.1f%% | RAM: %.2f/%.2f GB | Disco C: %.1f/%.1f GB",
                cargaCpu, usadaRamGB, totalRamGB, discoUsadoGB, discoTotalGB);
    }

    public static String obtenerMetricasJson() {
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

        return String.format(Locale.US,
            "{\"cpu\": %.1f, \"ramUsadaGB\": %.2f, \"ramTotalGB\": %.2f, \"discoUsadoGB\": %.1f, \"discoTotalGB\": %.1f, \"resumen\": \"CPU: %.1f%% | RAM: %.2f/%.2f GB | Disco C: %.1f/%.1f GB\"}",
            cargaCpu, usadaRamGB, totalRamGB, discoUsadoGB, discoTotalGB,
            cargaCpu, usadaRamGB, totalRamGB, discoUsadoGB, discoTotalGB);
    }
}
