import * as dgram from 'dgram';
import { type UdpCommand } from '../schema';

export async function sendUdpCommand(command: UdpCommand): Promise<{ success: boolean; message: string }> {
  try {
    // Create UDP client socket
    const client = dgram.createSocket('udp4');

    // Send UDP packet with the command
    await new Promise<void>((resolve, reject) => {
      const message = Buffer.from(command.command);
      
      client.send(message, 0, message.length, command.target_port, command.target_host, (error) => {
        if (error) {
          client.close();
          reject(error);
          return;
        }
        
        client.close();
        resolve();
      });
    });

    return {
      success: true,
      message: `UDP command '${command.command}' sent successfully to ${command.target_host}:${command.target_port}`
    };

  } catch (error) {
    console.error('UDP command failed:', error);
    return {
      success: false,
      message: `Failed to send UDP command: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}