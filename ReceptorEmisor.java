package socket.sinconexion.duplex;
import java.net.*;

  /**
  *    Este ejemplo ilustra un proceso que recibe un mensaje y despu�s lo
  *    envia utilizando un socket datagrama.
  *    @author M. L. Liu
  */
  public class ReceptorEmisor {
  // Una aplicacion que recibe un mensaje y despus lo manda utilizando
  // un socket datagrama sin conexin.
  //  Se esperan cuatro argumentos de linea de mandato, en orden:
  //  <nombre de dominio o direccion IP del receptor>
  //  <numero de puerto del socket datagrama del receptor>
  //  <numero de puerto del socket datagrama de este proceso>
  //  <mensaje, una cadena, para mandar>

    public static void main(String[ ] args) {
      if (args.length != 4)
        System.out.println
        ("Este programa requiere 4 argumentos de linea de mandato");
      else {
    	/*args = new String[4];
    	args[0] = "127.0.0.1";
    	args[1] = "50000";
    	args[2] = "50001";
    	args[3] = "hola";*/    	
        try {
          InetAddress maquinaReceptora = InetAddress.getByName(args[0]);
          int puertoReceptor = Integer.parseInt(args[1]);
          int miPuerto = Integer.parseInt(args[2]);
          String mensaje = args[3];
          // instancia un socket datagrama para enviar 
          // y recibir datos
          MiSocketDatagrama miSocket = new MiSocketDatagrama(miPuerto);
          //  Primero espera a recibir un datagrama por el socket
          System.out.println("Mensaje recibido: " + miSocket.recibeMensaje());
          System.out.println("IP del remitente: " + miSocket.obtenerIPRemitente());
          System.out.println("Puerto del remitente: " + miSocket.obtenerPuertoRemitente());
          // Ahora enva un mensaje al otro proceso.
          miSocket.enviaMensaje(maquinaReceptora, puertoReceptor, mensaje);
          miSocket.close( );
        } // fin de try
        catch (Exception ex) {
          ex.printStackTrace( );
        }// fin de catch
      } // fin de else
    } // fin de main

  } // fin de class
