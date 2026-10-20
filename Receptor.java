package socket.sinconexion.simplex;

import java.net.*;

/**
 * Este ejemplo ilustra las llamadas de metodo basicas para sockets
 * datagrama sin conexion.
 * 
 * @author M. L. Liu
 */
public class Receptor {

  // Una aplicacion que recibe un mensaje utilizando un socket datagrama
  // sin conexion.
  // Se espera un argumento de linea de mandato:
  // <numero de puerto del socket del receptor>
  // Nota: se deberia especificar el mismo numero de puerto
  // en los argumentos de linea de mandato del emisor.

  public static void main(String[] args) {
    if (args.length != 1)
      System.out.println("Este programa requiere un argumento de linea de mandato.");
    else {

      int puerto = Integer.parseInt(args[0]);
      final int MAX_LON = 1024;
      // Esta es la longitud maxima asumida en octetos
      // del datagrama que se va a recibir.
      try {
        DatagramSocket miSocket = new DatagramSocket(puerto);
        // instancia un socket datagrama para recibir los datos
        while (true) {
          byte[] almacen = new byte[MAX_LON];
          DatagramPacket datagrama = new DatagramPacket(almacen, MAX_LON);
          System.out.println("Esperando...");
          miSocket.receive(datagrama);
          // Construir el mensaje usando la longitud real recibida
          String mensaje = new String(datagrama.getData(), 0, datagrama.getLength());
          // Obtener direccion y puerto del emisor
          InetAddress direccionEmisor = datagrama.getAddress();
          int puertoEmisor = datagrama.getPort();
          String origen = direccionEmisor.getHostAddress() + ":" + puertoEmisor;
          System.out.println("Origen: " + origen);
          System.out.println("Mensaje: " + mensaje);
        }
        // miSocket.close();
      } // fin de try
      catch (Exception ex) {
        ex.printStackTrace();
      } // fin de catch
    } // fin de else
  } // fin de main
}
// fin de class
