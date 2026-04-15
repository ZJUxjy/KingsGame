import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(url: string): Socket {
    this.socket = io(url, { transports: ['websocket'] });
    return this.socket;
  }

  getSocket(): Socket {
    if (!this.socket) throw new Error('Socket not connected');
    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
