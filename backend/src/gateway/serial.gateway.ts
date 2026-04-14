import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: '/serial', cors: { origin: '*' } })
export class SerialGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SerialGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté : ${client.id}`);
  }

  emitNewEvent(payload: { event: any; device: any }) {
    this.server.emit('new-event', payload);
  }
}
