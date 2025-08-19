import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import * as dgram from 'dgram';
import { resetDB, createDB } from '../helpers';
import { type UdpCommand } from '../schema';
import { sendUdpCommand } from '../handlers/send_udp_command';

// Test input for UDP commands
const testCommand: UdpCommand = {
  command: 'img-1',
  target_host: 'localhost',
  target_port: 5000
};

// Mock UDP server for testing
class MockUdpServer {
  private server: dgram.Socket;
  private receivedMessages: string[] = [];
  private port: number;

  constructor(port: number) {
    this.port = port;
    this.server = dgram.createSocket('udp4');
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.on('message', (msg) => {
        this.receivedMessages.push(msg.toString());
      });

      this.server.bind(this.port, () => {
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        resolve();
      });
    });
  }

  getReceivedMessages(): string[] {
    return this.receivedMessages;
  }

  clearMessages(): void {
    this.receivedMessages = [];
  }
}

describe('sendUdpCommand', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let mockServer: MockUdpServer;
  const testPort = 5001; // Use different port for testing to avoid conflicts

  beforeEach(async () => {
    mockServer = new MockUdpServer(testPort);
    await mockServer.start();
  });

  afterEach(async () => {
    if (mockServer) {
      await mockServer.stop();
    }
  });

  it('should send UDP command successfully', async () => {
    const commandWithTestPort: UdpCommand = {
      ...testCommand,
      target_port: testPort
    };

    const result = await sendUdpCommand(commandWithTestPort);

    expect(result.success).toBe(true);
    expect(result.message).toEqual(`UDP command 'img-1' sent successfully to localhost:${testPort}`);

    // Wait a bit for UDP packet to arrive
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const receivedMessages = mockServer.getReceivedMessages();
    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0]).toEqual('img-1');
  });

  it('should handle different UDP commands', async () => {
    const commands = ['img-1', 'img-2', 'img-3', 'reset', 'stop'];

    for (const cmd of commands) {
      const commandInput: UdpCommand = {
        command: cmd,
        target_host: 'localhost',
        target_port: testPort
      };

      const result = await sendUdpCommand(commandInput);
      expect(result.success).toBe(true);
      expect(result.message).toEqual(`UDP command '${cmd}' sent successfully to localhost:${testPort}`);
    }

    // Wait for all packets to arrive
    await new Promise(resolve => setTimeout(resolve, 20));

    const receivedMessages = mockServer.getReceivedMessages();
    expect(receivedMessages).toHaveLength(5);
    expect(receivedMessages).toEqual(commands);
  });

  it('should handle different target hosts and ports', async () => {
    const commandInput: UdpCommand = {
      command: 'test-command',
      target_host: '127.0.0.1',
      target_port: testPort
    };

    const result = await sendUdpCommand(commandInput);

    expect(result.success).toBe(true);
    expect(result.message).toEqual(`UDP command 'test-command' sent successfully to 127.0.0.1:${testPort}`);

    // Wait for packet
    await new Promise(resolve => setTimeout(resolve, 10));

    const receivedMessages = mockServer.getReceivedMessages();
    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0]).toEqual('test-command');
  });

  it('should handle connection failures gracefully', async () => {
    // Use a port that's not listening
    const commandInput: UdpCommand = {
      command: 'img-1',
      target_host: 'localhost',
      target_port: 9999 // Non-listening port
    };

    const result = await sendUdpCommand(commandInput);

    // UDP is connectionless, so this should still succeed
    // The packet is sent but may not be received
    expect(result.success).toBe(true);
    expect(result.message).toEqual("UDP command 'img-1' sent successfully to localhost:9999");
  });

  it('should handle invalid host gracefully', async () => {
    const commandInput: UdpCommand = {
      command: 'img-1',
      target_host: 'invalid-host-that-does-not-exist.local',
      target_port: testPort
    };

    const result = await sendUdpCommand(commandInput);

    // This should fail due to invalid hostname
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Failed to send UDP command:/);
  });

  it('should send empty commands', async () => {
    const commandInput: UdpCommand = {
      command: '',
      target_host: 'localhost',
      target_port: testPort
    };

    const result = await sendUdpCommand(commandInput);

    expect(result.success).toBe(true);
    expect(result.message).toEqual(`UDP command '' sent successfully to localhost:${testPort}`);

    // Wait for packet
    await new Promise(resolve => setTimeout(resolve, 10));

    const receivedMessages = mockServer.getReceivedMessages();
    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0]).toEqual('');
  });

  it('should handle special characters in commands', async () => {
    const specialCommands = ['img-1!', 'test@command', 'cmd#with$symbols%'];

    for (const cmd of specialCommands) {
      mockServer.clearMessages();
      
      const commandInput: UdpCommand = {
        command: cmd,
        target_host: 'localhost',
        target_port: testPort
      };

      const result = await sendUdpCommand(commandInput);
      expect(result.success).toBe(true);

      // Wait for packet
      await new Promise(resolve => setTimeout(resolve, 10));

      const receivedMessages = mockServer.getReceivedMessages();
      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]).toEqual(cmd);
    }
  });
});