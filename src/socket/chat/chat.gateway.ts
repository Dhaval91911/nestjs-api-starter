import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'v1',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private users: string[] = [];

  handleConnection(socket: Socket) {
    console.log('✅ Socket connected:', socket.id);
    this.users.push(socket.id);
  }

  handleDisconnect(socket: Socket) {
    console.log('❌ Socket disconnected:', socket.id);
    this.users = this.users.filter((id) => id !== socket.id);
  }

  @SubscribeMessage('joinRoom')
  async handleJoin(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log(`🔗 ${socket.id} joining room: ${roomId}`);
    await socket.join(roomId);
    socket.emit('joinRoom', `Successfully joined room: ${roomId}`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() socket: Socket,
  ) {
    console.log(`💬 ${socket.id} sent message to room ${data.roomId}`);
    this.server.to(data.roomId).emit('message', {
      sender: socket.id,
      message: data.message,
      time: new Date().toISOString(),
    });
  }

  @SubscribeMessage('testSocket')
  handleTest(
    @MessageBody() data: { message: string },
    @ConnectedSocket() socket: Socket,
  ) {
    socket.emit('testSocket', data);
  }
}
