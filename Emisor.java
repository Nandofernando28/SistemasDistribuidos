package socket.sinconexion.simplex;

import java.net.*;


/**
 *    Este ejemplo ilustra las llamadas de metodo bssicas para sockets
 *    datagrama sin conexion
 *    @author M. L. Liu
 */
public class Emisor {

//  Una aplicacion que manda un mensaje utilizando un socket datagrama
//  sin conexion.
//  Se esperan tres argumentos de linea de mandato, en orden:
// <nombre del dominio o direccion IP del receptor>
// <numero del puerto del socket del receptor>
// <mensaje, una cadena, para mandar>

	public static void main(String[ ] args) {
      if (args.length < 2 || args.length > 3) {
        System.out.println("Uso: java -cp bin socket.sinconexion.simplex.Emisor <IP> <puerto> [mensaje_opcional]");
        System.out.println("Ejemplo (envio de metricas automaticas): java -cp bin socket.sinconexion.simplex.Emisor 192.168.137.177 50000");
      } else {
        try {
          InetAddress maquinaReceptora = InetAddress.getByName(args[0]);
          int puertoReceptor = Integer.parseInt(args[1]);
          
          // Si pasan un tercer argumento se usa ese mensaje; si no, se obtienen las metricas del sistema
          String mensaje;
          if (args.length == 3) {
            mensaje = args[2];
          } else {
            mensaje = MetricasSistema.obtenerMetricas();
          }

          System.out.println("Enviando a " + args[0] + ":" + puertoReceptor);
          System.out.println("Mensaje: " + mensaje);

          // instancia un socket datagrama para mandar los datos
          DatagramSocket miSocket = new DatagramSocket( );
          byte[ ] almacen = mensaje.getBytes( );
          DatagramPacket datagrama =
            new DatagramPacket(almacen, almacen.length,
              maquinaReceptora, puertoReceptor);
          miSocket.send(datagrama);
          miSocket.close( );
        } // fin de try
        catch (Exception ex) {
          ex.printStackTrace( );
        } // fin de catch
      } // fin de else
    } // fin de main
  } // fin de class
